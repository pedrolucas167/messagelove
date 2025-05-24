require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const SpotifyWebApi = require('spotify-web-api-node');
const winston = require('winston');

// ========== Logger ==========
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp(),
    winston.format.printf(
      ({ timestamp, level, message }) => `[${timestamp}] ${level}: ${message}`
    )
  ),
  transports: [new winston.transports.Console()]
});

// ========== Helpers ==========
function generateRandomString(length) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from({ length }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
}

function formatTrack(track) {
  return {
    id: track.id,
    name: track.name,
    artists: track.artists.map(a => a.name),
    album: track.album.name,
    albumImage: track.album.images[0]?.url || '',
    duration: track.duration_ms,
    previewUrl: track.preview_url
  };
}

// ========== Spotify Config ==========
const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri: process.env.SPOTIFY_REDIRECT_URI || 'http://localhost:3001/callback'
});

// ========== App Setup ==========
const app = express();
const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const uploadDir = path.join(__dirname, 'uploads');

// Middlewares
app.use(cors({ origin: FRONTEND_URL, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Multer Upload Config
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    await fs.mkdir(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'audio/mpeg'];
    allowed.includes(file.mimetype) ? cb(null, true) : cb(new Error('Invalid file type'));
  }
});

// ========== Spotify Auth Middleware ==========
const authenticateSpotify = (req, res, next) => {
  if (!spotifyApi.getAccessToken()) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Please authenticate via /api/spotify/login'
    });
  }
  next();
};

const handleSpotifyError = async (error, req, res, next) => {
  if (error.statusCode === 401 && spotifyApi.getRefreshToken()) {
    try {
      const data = await spotifyApi.refreshAccessToken();
      spotifyApi.setAccessToken(data.body.access_token);
      if (data.body.refresh_token) {
        spotifyApi.setRefreshToken(data.body.refresh_token);
      }
      logger.info('Spotify access token refreshed');
      return next();
    } catch (refreshError) {
      logger.error('Failed to refresh Spotify token:', refreshError);
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Failed to refresh token. Please login again.',
        details: refreshError.message
      });
    }
  } else {
    logger.error('Spotify API error:', error);
    return res.status(error.statusCode || 500).json({
      error: 'Spotify API Error',
      message: error.message
    });
  }
};

// ========== Routes ==========

// Health Check
app.get('/api/status', (req, res) => {
  res.json({ status: 'API is running' });
});

// === Spotify ===
app.get('/api/spotify/login', (req, res) => {
  const scopes = ['user-read-private', 'user-read-email'];
  const state = generateRandomString(16);
  const authorizeURL = spotifyApi.createAuthorizeURL(scopes, state);

  res.redirect(authorizeURL);
});

app.get('/api/spotify/callback', async (req, res) => {
  const { code, error } = req.query;

  if (error) {
    logger.error('Spotify auth error:', error);
    return res.redirect(`${FRONTEND_URL}/error?message=${encodeURIComponent(error)}`);
  }

  try {
    const data = await spotifyApi.authorizationCodeGrant(code);
    spotifyApi.setAccessToken(data.body.access_token);
    spotifyApi.setRefreshToken(data.body.refresh_token);

    logger.info('Spotify authentication successful');
    res.redirect(FRONTEND_URL);
  } catch (err) {
    logger.error('Spotify callback error:', err);
    res.redirect(`${FRONTEND_URL}/error?message=${encodeURIComponent('Authentication failed')}`);
  }
});

app.get('/api/spotify/search', authenticateSpotify, async (req, res, next) => {
  const { q, type = 'track', limit = 10 } = req.query;

  if (!q) {
    return res.status(400).json({ error: 'Query parameter "q" is required' });
  }

  try {
    const data = await spotifyApi.search(q, [type], { limit: parseInt(limit) });
    const items = data.body.tracks.items.map(formatTrack);
    res.json({ items });
  } catch (error) {
    return handleSpotifyError(error, req, res, next);
  }
});

app.get('/api/spotify/status', (req, res) => {
  res.json({
    accessToken: spotifyApi.getAccessToken() ? 'Present' : 'None',
    refreshToken: spotifyApi.getRefreshToken() ? 'Present' : 'None'
  });
});

// === Card Generation ===
app.post('/api/cards', upload.fields([{ name: 'foto' }, { name: 'audio' }]), async (req, res) => {
  const { nome, mensagem, data, spotify } = req.body;
  const foto = req.files?.foto?.[0];
  const audio = req.files?.audio?.[0];

  if (!nome || !mensagem) {
    return res.status(400).json({ error: 'Nome and mensagem are required' });
  }

  const cardId = generateRandomString(8);
  const viewLink = `${FRONTEND_URL}/card/${cardId}`;

  logger.info('Card created:', { nome, mensagem, data, spotify, foto: foto?.filename, audio: audio?.filename });

  res.json({ viewLink });
});

// ========== Error Handler ==========
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: 'An unexpected error occurred',
    details: err.message
  });
});

// ========== Start Server ==========
app.listen(PORT, async () => {
  try {
    await fs.mkdir(uploadDir, { recursive: true });
    logger.info(`Server running on port ${PORT}`);
    logger.info(`Upload directory initialized: ${uploadDir}`);
  } catch (error) {
    logger.error('Failed to initialize server:', error);
    process.exit(1);
  }
});
