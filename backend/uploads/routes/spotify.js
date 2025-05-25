const express = require('express');
const router = express.Router();
const SpotifyWebApi = require('spotify-web-api-node');

const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET
});

let spotifyToken = null;
let tokenExpiry = null;

async function getSpotifyToken() {
  const now = Date.now();
  if (spotifyToken && tokenExpiry && now < tokenExpiry) {
    console.log('Usando token armazenado, válido até:', new Date(tokenExpiry).toISOString());
    return spotifyToken;
  }
  try {
    const data = await spotifyApi.clientCredentialsGrant();
    spotifyToken = data.body['access_token'];
    tokenExpiry = now + (data.body.expires_in * 1000) - 60000;
    spotifyApi.setAccessToken(spotifyToken);
    console.log('Token obtido com sucesso:', spotifyToken, 'válido até:', new Date(tokenExpiry).toISOString());
    return spotifyToken;
  } catch (error) {
    console.error('Erro ao obter token do Spotify:', error.message);
    throw new Error('Falha na autenticação com o Spotify');
  }
}

async function fetchPreviewUrlFromTrackEndpoint(trackId) {
  try {
    const response = await spotifyApi.getTrack(trackId);
    console.log('Resposta do /tracks para', trackId, ':', response.body);
    return response.body.preview_url || null;
  } catch (error) {
    console.error('Erro ao buscar preview_url do endpoint /tracks para', trackId, ':', error.message, error.statusCode);
    return null;
  }
}

function formatTrack(item) {
  return {
    id: item.id,
    name: item.name,
    artists: item.artists.map(artist => artist.name),
    albumName: item.album.name,
    albumImage: item.album.images[0]?.url || '',
    previewUrl: item.preview_url || null
  };
}

router.get('/search', async (req, res) => {
  const { q, limit = 10 } = req.query;
  if (!q) {
    console.log('Erro: Parâmetro de busca "q" ausente');
    return res.status(400).json({ message: 'Parâmetro de busca "q" é obrigatório' });
  }
  try {
    console.log('Iniciando busca por:', q);
    await getSpotifyToken();
    const response = await spotifyApi.searchTracks(q, { limit: Number(limit) });
    let tracks = response.body.tracks.items.map(formatTrack);
    tracks = await Promise.all(tracks.map(async (track) => {
      if (!track.previewUrl) {
        console.log(`Preview_url não encontrada para ${track.name}, buscando via endpoint /tracks...`);
        const previewUrl = await fetchPreviewUrlFromTrackEndpoint(track.id);
        if (previewUrl) {
          track.previewUrl = previewUrl;
          console.log(`Preview_url encontrada para ${track.name}: ${previewUrl}`);
        } else {
          console.log(`Nenhuma preview_url encontrada para ${track.name} após /tracks.`);
        }
      }
      return track;
    }));
    console.log('Faixas encontradas:', tracks.length);
    res.json(tracks);
  } catch (error) {
    console.error('Erro na busca do Spotify:', error.message, error.stack);
    res.status(500).json({ message: error.message || 'Erro ao buscar músicas' });
  }
});

module.exports = router;