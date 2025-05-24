require('dotenv').config();
const express = require('express');
const SpotifyWebApi = require('spotify-web-api-node');
const cors = require('cors');
const logger = require('./utils/logger'); // Sugiro criar um logger personalizado

const app = express();

// Configurações básicas
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuração do Spotify API
const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri: process.env.SPOTIFY_REDIRECT_URI
});

// Middlewares
const authenticateSpotify = async (req, res, next) => {
  try {
    if (!spotifyApi.getAccessToken()) {
      throw new Error('Access token not available');
    }

    // Verifica se o token está expirado ou prestes a expirar
    const tokenExpiration = spotifyApi.getAccessTokenExpirationTime();
    const currentTime = Math.floor(Date.now() / 1000);
    const timeRemaining = tokenExpiration - currentTime;

    if (timeRemaining < 300) { // Renova se faltar menos de 5 minutos
      const data = await spotifyApi.refreshAccessToken();
      spotifyApi.setAccessToken(data.body['access_token']);
      
      if (data.body['refresh_token']) {
        spotifyApi.setRefreshToken(data.body['refresh_token']);
      }
    }
    
    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    res.status(401).json({ 
      error: 'Unauthorized',
      message: 'Please authenticate via /api/spotify/login',
      details: error.message
    });
  }
};

// Rotas do Spotify
app.get('/api/spotify/login', (req, res) => {
  const scopes = ['user-read-private', 'user-read-email'];
  const state = generateRandomString(16); // Função de segurança recomendada
  
  const authorizeUrl = spotifyApi.createAuthorizeURL(scopes, state);
  res.redirect(authorizeUrl);
});

app.get('/api/spotify/callback', async (req, res) => {
  const { code, state, error } = req.query;

  if (error) {
    logger.error('Spotify auth error:', error);
    return res.redirect(`/error?message=${encodeURIComponent(error)}`);
  }

  try {
    const data = await spotifyApi.authorizationCodeGrant(code);
    spotifyApi.setAccessToken(data.body['access_token']);
    spotifyApi.setRefreshToken(data.body['refresh_token']);
    
    res.redirect(process.env.FRONTEND_REDIRECT_URI || 'http://localhost:3000');
  } catch (err) {
    logger.error('Failed to get access token:', err);
    res.redirect(`/error?message=${encodeURIComponent('Authentication failed')}`);
  }
});

app.get('/api/spotify/search', authenticateSpotify, async (req, res) => {
  try {
    const { q, type = 'track', limit = 10 } = req.query;
    
    if (!q) {
      return res.status(400).json({ 
        error: 'Bad Request',
        message: 'Query parameter "q" is required'
      });
    }

    const data = await spotifyApi.searchTracks(q, { limit });
    const tracks = data.body.tracks.items.map(formatTrack);

    res.json({ tracks });
  } catch (error) {
    logger.error('Search error:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'Failed to search tracks',
      details: error.message
    });
  }
});

// Funções auxiliares
function formatTrack(track) {
  return {
    id: track.id,
    name: track.name,
    artists: track.artists.map(artist => artist.name),
    album: {
      name: track.album.name,
      image: track.album.images[0]?.url || null
    },
    duration: track.duration_ms,
    preview_url: track.preview_url
  };
}

function generateRandomString(length) {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from({ length }, () => 
    possible.charAt(Math.floor(Math.random() * possible.length))
  ).join('');   

// Inicialização do servidor
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Spotify integration configured with client ID: ${process.env.SPOTIFY_CLIENT_ID}`);
});