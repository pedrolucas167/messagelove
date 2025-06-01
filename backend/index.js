// const https = require('https'); // Not needed when Render handles SSL
// const fs = require('fs'); // Not needed for certs
const express = require('express');
const cors = require('cors');
const SpotifyWebApi = require('spotify-web-api-node');
const dotenv = require('dotenv');
// const axios = require('axios'); // No longer needed after removing embed scraping
const sqlite3 = require('sqlite3').verbose();
const { v4: uuidv4 } = require('uuid'); // For unique IDs

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// --- CORS Configuration ---
const frontendUrl = process.env.FRONTEND_URL || 'https://messagelove-frontend.vercel.app';
const devFrontendLocalPort = process.env.DEV_FRONTEND_LOCAL_PORT || 3000; // Adjust if your local frontend runs on a different port
const devFrontendUrl = `http://localhost:${devFrontendLocalPort}`;

const allowedOrigins = [frontendUrl];
if (process.env.NODE_ENV !== 'production') {
  allowedOrigins.push(devFrontendUrl);
  if (process.env.GITPOD_WORKSPACE_URL) {
    const gitpodOrigin = process.env.GITPOD_WORKSPACE_URL.replace('https://', `https://${devFrontendLocalPort}-`);
    allowedOrigins.push(gitpodOrigin);
  }
}
console.log("Allowed CORS origins:", allowedOrigins);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`CORS: Origin ${origin} not allowed.`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Accept', 'Authorization']
}));

app.options('*', cors()); // Handle preflight requests

// --- Middleware ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public')); // Serve static files from 'public' directory

// --- Database Setup (SQLite) ---
const DB_PATH = './cards.db';
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('DATABASE ERROR: Failed to connect to SQLite:', err.message);
  } else {
    console.log(`DATABASE: Connected to SQLite database at ${DB_PATH}`);
    db.run(`
      CREATE TABLE IF NOT EXISTS cards (
        id TEXT PRIMARY KEY,
        nome TEXT NOT NULL,
        data TEXT,
        mensagem TEXT NOT NULL,
        spotifyTrackId TEXT,
        spotifyTrackName TEXT,
        previewUrl TEXT,
        fotoUrl TEXT 
      )
    `, (errRun) => {
      if (errRun) {
        console.error('DATABASE ERROR: Failed to create "cards" table:', errRun.message);
      } else {
        console.log('DATABASE: Table "cards" is ready.');
      }
    });
  }
});

// --- Spotify API Setup ---
const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET
});

let spotifyAccessToken = null;
let tokenExpiryTime = 0;

async function refreshSpotifyToken() {
  if (spotifyAccessToken && Date.now() < tokenExpiryTime - (5 * 60 * 1000)) {
    spotifyApi.setAccessToken(spotifyAccessToken);
    return;
  }
  try {
    console.log('SPOTIFY: Requesting new application access token...');
    const data = await spotifyApi.clientCredentialsGrant();
    spotifyAccessToken = data.body['access_token'];
    tokenExpiryTime = Date.now() + (data.body['expires_in'] * 1000);
    spotifyApi.setAccessToken(spotifyAccessToken);
    console.log('SPOTIFY: New application access token obtained and set.');
  } catch (error) {
    spotifyAccessToken = null;
    tokenExpiryTime = 0;
    console.error('SPOTIFY ERROR: Failed to refresh application access token:', error.response ? error.response.data : error.message);
    throw new Error('Failed to authenticate application with Spotify. Please check server logs.');
  }
}

async function fetchPreviewUrlFromTrackEndpoint(trackId) {
  if (!trackId) return null;
  try {
    await refreshSpotifyToken();
    const response = await spotifyApi.getTrack(trackId);
    return response.body.preview_url || null;
  } catch (error) {
    console.error(`SPOTIFY ERROR: Failed to fetch track details for ${trackId}:`, error.message);
    return null;
  }
}

function formatTrackData(item) {
  return {
    id: item.id,
    name: item.name,
    artists: item.artists.map(artist => artist.name),
    albumName: item.album.name,
    albumImage: item.album.images[0]?.url || '',
    previewUrl: item.preview_url || null
  };
}

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// --- API Endpoints ---

app.get('/api/status', (req, res) => {
  res.json({ 
    status: 'API is running', 
    message: 'Messagelove backend is operational.',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/spotify/search', asyncHandler(async (req, res) => {
  const { q, limit = 10 } = req.query;
  if (!q) {
    return res.status(400).json({ message: 'Search query parameter "q" is required.' });
  }
  await refreshSpotifyToken();
  console.log(`SPOTIFY: Searching for tracks with query "${q}", limit ${limit}`);
  const response = await spotifyApi.searchTracks(q, { limit: Number(limit) });
  let tracks = response.body.tracks.items.map(formatTrackData);
  tracks = await Promise.all(tracks.map(async (track) => {
    if (!track.previewUrl) {
      const detailedPreviewUrl = await fetchPreviewUrlFromTrackEndpoint(track.id);
      if (detailedPreviewUrl) {
        track.previewUrl = detailedPreviewUrl;
      }
    }
    return track;
  }));
  console.log(`SPOTIFY: Found ${tracks.length} tracks for query "${q}".`);
  res.json(tracks);
}));

app.post('/api/cards', asyncHandler(async (req, res) => {
  const { nome, data, mensagem, spotifyTrackId, spotifyTrackName, previewUrl, fotoUrl } = req.body;
  if (!nome || !mensagem) {
    return res.status(400).json({ message: 'Fields "nome" and "mensagem" are required.' });
  }
  const cardId = uuidv4();
  console.log('API POST /api/cards: Received data for new card:', { nome, data, spotifyTrackId });
  const cardData = {
    id: cardId,
    nome,
    data: data || null,
    mensagem,
    spotifyTrackId: spotifyTrackId || null,
    spotifyTrackName: spotifyTrackName || null,
    previewUrl: previewUrl || null,
    fotoUrl: fotoUrl || null
  };
  
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO cards (id, nome, data, mensagem, spotifyTrackId, spotifyTrackName, previewUrl, fotoUrl) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        cardData.id, cardData.nome, cardData.data, cardData.mensagem, 
        cardData.spotifyTrackId, cardData.spotifyTrackName, cardData.previewUrl, cardData.fotoUrl
      ],
      function(err) {
        if (err) {
          console.error('DATABASE ERROR: Failed to save card:', err.message);
          return reject(new Error('Failed to save card to database.')); 
        }
        console.log(`DATABASE: Card saved with ID: ${cardId}`);
        
        // --- MUDANÇA APLICADA AQUI ---
        // O viewLink agora aponta para uma rota no seu frontend Vercel.
        // Certifique-se que seu frontend tenha uma rota como '/cards/view/:id' para exibir o cartão.
        const frontendBaseUrlForViewLink = process.env.FRONTEND_URL || 'https://messagelove-frontend.vercel.app';
        const viewLink = `${frontendBaseUrlForViewLink}/cards/view/${cardId}`; 
        // Você pode ajustar o caminho '/cards/view/' se a sua rota no frontend for diferente (ex: '/card/')
        
        resolve(res.status(201).json({ message: 'Card created successfully', viewLink, cardData }));
      }
    );
  });
}));

app.get('/api/card/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  return new Promise((resolve, reject) => {
    db.get(`SELECT * FROM cards WHERE id = ?`, [id], (err, row) => {
      if (err) {
        console.error('DATABASE ERROR: Failed to fetch card:', err.message);
        return reject(new Error('Failed to fetch card from database.'));
      }
      if (!row) {
        return resolve(res.status(404).json({ message: 'Card not found.' }));
      }
      console.log(`DATABASE: Fetched card with ID: ${id}`);
      resolve(res.json(row));
    });
  });
}));

// --- HTML View for a Single Card (Served by Backend) ---
// Este endpoint pode se tornar opcional ou ser usado para um preview mais simples
// se o seu frontend Vercel assumir a visualização principal do cartão com o Playback SDK.
app.get('/card/:id', (req, res) => {
  const { id } = req.params;
  // (O HTML e script JS para esta página permanecem os mesmos da versão anterior)
  // Se esta página for mantida, ela continuará tocando apenas PREVIEWS de música.
  res.send(`
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Seu Cartão Especial - Messagelove</title>
      <link rel="stylesheet" href="/style.css"> 
      <style>
        body { font-family: sans-serif; margin: 0; background-color: #f4f4f4; display: flex; justify-content: center; align-items: center; min-height: 100vh; padding: 1em;}
        .container { background-color: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.1); max-width: 500px; width: 100%; }
        .card-preview h1 { text-align: center; color: #333; }
        .card-preview p { color: #555; line-height: 1.6; word-break: break-word; }
        .audio-player { display: flex; align-items: center; margin-top: 10px; padding: 10px; background-color: #eee; border-radius: 4px; }
        .play-pause-btn { background: none; border: none; font-size: 1.5em; cursor: pointer; margin-right: 10px;}
        .progress-bar-container { flex-grow: 1; height: 8px; background-color: #ccc; border-radius: 4px; overflow: hidden; margin: 0 10px; cursor: pointer;}
        .progress-bar { width: 0%; height: 100%; background-color: #5cb85c; }
        .duration { font-size: 0.9em; color: #333; min-width: 70px; text-align: right; }
        .preview-error { color: red; font-size: 0.9em; margin-top: 5px; }
        .error-message { color: red; text-align: center; }
        img.preview-image { max-width: 100%; border-radius: 4px; margin-top:10px; }
      </style>
    </head>
    <body>
      <div id="card-view" class="container">
        <div class="card-preview">
          <h1>Seu Cartão Especial</h1>
          <div id="card-content-loading">Carregando cartão...</div>
          <div id="card-content" style="display:none;">
            </div>
        </div>
      </div>

      <script>
        function formatTime(totalSeconds) {
          if (isNaN(totalSeconds) || totalSeconds < 0) return '0:00';
          const minutes = Math.floor(totalSeconds / 60);
          const seconds = Math.floor(totalSeconds % 60);
          return \`\${minutes}:\${seconds < 10 ? '0' : ''}\${seconds}\`;
        }

        async function loadCard() {
          const cardId = "${id}";
          const loadingDiv = document.getElementById('card-content-loading');
          const contentDiv = document.getElementById('card-content');

          try {
            const response = await fetch(\`/api/card/\${cardId}\`);
            if (!response.ok) {
              const errorResult = await response.json().catch(() => ({ message: 'Erro ao buscar dados do cartão.' }));
              throw new Error(errorResult.message || \`HTTP error! Status: \${response.status}\`);
            }
            const card = await response.json();
            
            loadingDiv.style.display = 'none';
            contentDiv.style.display = 'block';

            let dataFormatada = 'Não especificada';
            if (card.data) {
                try {
                    const dateObj = new Date(card.data + 'T00:00:00');
                    if (!isNaN(dateObj.getTime())) {
                        dataFormatada = dateObj.toLocaleDateString('pt-BR', { timeZone: 'UTC', day: '2-digit', month: '2-digit', year: 'numeric' });
                    } else { dataFormatada = card.data; }
                } catch (e) { dataFormatada = card.data; }
            }

            contentDiv.innerHTML = \`
              <p><strong>Para:</strong> \${card.nome}</p>
              <p><strong>Data:</strong> \${dataFormatada}</p>
              <p><strong>Mensagem:</strong> \${card.mensagem.replace(/\\n/g, '<br>')}</p>
              \${card.fotoUrl ? \`<div><img src="\${card.fotoUrl}" alt="Foto do Cartão" class="preview-image"></div>\` : ''}
              \${card.previewUrl ? \`
                <div>
                  <h3>Música: \${card.spotifyTrackName || 'Faixa selecionada'}</h3>
                  <div class="audio-player">
                    <button class="play-pause-btn" aria-label="Tocar música">
                      <span class="play-icon">▶️</span><span class="pause-icon" style="display: none;">⏸️</span>
                    </button>
                    <div class="progress-bar-container">
                       <div class="progress-bar"></div>
                    </div>
                    <span class="duration">0:00 / 0:00</span>
                    <audio class="card-audio-preview" preload="metadata" src="\${card.previewUrl}">
                      Seu navegador não suporta o elemento de áudio.
                    </audio>
                  </div>
                  <div class="preview-error" style="display: none;">
                    Não foi possível reproduzir a prévia.
                  </div>
                </div>
              \` : ''}
            \`;

            if (card.previewUrl) {
              const playerElement = contentDiv.querySelector('.audio-player');
              const audioElement = playerElement.querySelector('.card-audio-preview');
              const playPauseBtn = playerElement.querySelector('.play-pause-btn');
              const playIcon = playPauseBtn.querySelector('.play-icon');
              const pauseIcon = playPauseBtn.querySelector('.pause-icon');
              const progressBarContainer = playerElement.querySelector('.progress-bar-container');
              const progressBar = progressBarContainer.querySelector('.progress-bar');
              const durationElement = playerElement.querySelector('.duration');
              const errorElement = playerElement.querySelector('.preview-error');
              let audioDuration = 0;

              audioElement.onloadedmetadata = () => {
                audioDuration = audioElement.duration;
                durationElement.textContent = \`0:00 / \${formatTime(audioDuration || 0)}\`; // Fallback para 0 se duration for NaN
              };
              audioElement.ontimeupdate = () => {
                if (audioDuration > 0) {
                  const progressPercent = (audioElement.currentTime / audioDuration) * 100;
                  progressBar.style.width = \`\${progressPercent}%\`;
                }
                durationElement.textContent = \`\${formatTime(audioElement.currentTime)} / \${formatTime(audioDuration || 0)}\`;
              };
              audioElement.onended = () => {
                playIcon.style.display = 'inline';
                pauseIcon.style.display = 'none';
                audioElement.currentTime = 0;
                progressBar.style.width = '0%';
                playPauseBtn.setAttribute('aria-label', 'Tocar música');
              };
              audioElement.onerror = (e) => {
                console.error('Audio Error:', audioElement.error, e);
                errorElement.style.display = 'block';
                if(playerElement) playerElement.style.display = 'none';
              };
              playPauseBtn.onclick = () => {
                if (audioElement.paused) {
                  audioElement.play().catch(e => { 
                    console.error('Play Error:', e); 
                    errorElement.textContent = 'Erro ao tentar tocar a música.';
                    errorElement.style.display = 'block'; 
                  });
                  playIcon.style.display = 'none';
                  pauseIcon.style.display = 'inline';
                  playPauseBtn.setAttribute('aria-label', 'Pausar música');
                } else {
                  audioElement.pause();
                  playIcon.style.display = 'inline';
                  pauseIcon.style.display = 'none';
                  playPauseBtn.setAttribute('aria-label', 'Tocar música');
                }
              };
              progressBarContainer.onclick = (event) => {
                if (audioDuration > 0) {
                  const rect = progressBarContainer.getBoundingClientRect();
                  const offsetX = event.clientX - rect.left;
                  audioElement.currentTime = (offsetX / rect.width) * audioDuration;
                }
              };
            }

          } catch (error) {
            console.error('Failed to load card:', error);
            loadingDiv.style.display = 'none';
            contentDiv.style.display = 'block';
            contentDiv.innerHTML = \`<p class="error-message">Erro ao carregar o cartão: \${error.message}</p>\`;
          }
        }
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', loadCard);
        } else {
          loadCard();
        }
      </script>
    </body>
    </html>
  `);
});

// --- Global Error Handler ---
app.use((err, req, res, next) => {
  console.error("GLOBAL ERROR HANDLER:", err.name, err.message);
  if (err.stack && process.env.NODE_ENV !== 'production') { // Não logar stack em produção por padrão aqui, mas pode ser útil em logs centralizados
    console.error(err.stack);
  }
  const statusCode = err.status || 500;
  const errorMessage = statusCode === 500 && process.env.NODE_ENV === 'production' 
    ? 'An unexpected error occurred on the server.' 
    : err.message || 'Internal Server Error';
  res.status(statusCode).json({ 
    message: errorMessage,
    ...(process.env.NODE_ENV !== 'production' && { errorName: err.name })
  });
});

// --- Server Start ---
app.listen(PORT, () => {
  console.log(`HTTP Server running on port ${PORT}`);
  console.log(`Frontend expected at: ${frontendUrl} or ${devFrontendUrl}`);
  // Initial Spotify token fetch for application
  refreshSpotifyToken().catch(err => {
    console.error("Failed to fetch initial Spotify application token on startup:", err.message);
  });
});

// --- Graceful Shutdown ---
process.on('SIGINT', () => {
  console.log('\nSIGINT received. Shutting down gracefully...');
  db.close((err) => {
    if (err) {
      console.error('DATABASE ERROR: Failed to close SQLite connection:', err.message);
    } else {
      console.log('DATABASE: SQLite connection closed.');
    }
    console.log('Server shut down.');
    process.exit(0);
  });
});