const express = require('express');
const cors = require('cors');
const SpotifyWebApi = require('spotify-web-api-node');
const dotenv = require('dotenv');
const sqlite3 = require('sqlite3').verbose();
const { v4: uuidv4 } = require('uuid');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Configuração CORS
const frontendUrl = process.env.FRONTEND_URL || 'https://messagelove-frontend.vercel.app';
const devFrontendLocalPort = process.env.DEV_FRONTEND_LOCAL_PORT || 3000;
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
app.options('*', cors()); // Habilita pre-flight para todas as rotas

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public')); // Para servir arquivos estáticos como style.css para /card/:id

// Configuração do Banco de Dados SQLite
const DB_PATH = process.env.DB_SOURCE || './cards.db'; // Usa variável de ambiente para DB_SOURCE
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

// Configuração da API do Spotify (para token da aplicação)
const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET
});

let applicationSpotifyToken = null; // Renomeado para clareza
let applicationTokenExpiryTime = 0; // Renomeado para clareza

async function refreshApplicationSpotifyToken() {
  if (applicationSpotifyToken && Date.now() < applicationTokenExpiryTime - (5 * 60 * 1000)) { // 5 min buffer
    spotifyApi.setAccessToken(applicationSpotifyToken);
    return;
  }
  try {
    console.log('SPOTIFY_APP_AUTH: Requesting new application access token...');
    const data = await spotifyApi.clientCredentialsGrant();
    applicationSpotifyToken = data.body['access_token'];
    applicationTokenExpiryTime = Date.now() + (data.body['expires_in'] * 1000);
    spotifyApi.setAccessToken(applicationSpotifyToken);
    console.log('SPOTIFY_APP_AUTH: New application access token obtained and set.');
  } catch (error) {
    applicationSpotifyToken = null;
    applicationTokenExpiryTime = 0;
    console.error('SPOTIFY_APP_AUTH_ERROR: Failed to refresh application access token:', error.response ? error.response.data : error.message);
    throw new Error('Failed to authenticate application with Spotify.');
  }
}

// Funções Auxiliares Spotify
async function fetchPreviewUrlFromTrackEndpoint(trackId) {
  if (!trackId) return null;
  try {
    await refreshApplicationSpotifyToken();
    const data = await spotifyApi.getTrack(trackId);
    return data.body.preview_url || null;
  } catch (error) {
    console.error(`SPOTIFY_API_ERROR: Failed to fetch track details for ${trackId}:`, error.message);
    return null;
  }
}

function formatTrackData(item) {
  return {
    id: item.id,
    name: item.name,
    artists: item.artists.map(artist => artist.name),
    albumName: item.album.name,
    albumImage: item.album.images && item.album.images.length > 0 ? item.album.images[0].url : '',
    previewUrl: item.preview_url || null
  };
}

// Wrapper para rotas assíncronas
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// Endpoints da API
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
  await refreshApplicationSpotifyToken();
  console.log(`SPOTIFY_API: Searching for tracks with query "${q}", limit ${limit}`);
  const data = await spotifyApi.searchTracks(q, { limit: Number(limit) });
  let tracks = data.body.tracks.items.map(formatTrackData);

  tracks = await Promise.all(tracks.map(async (track) => {
    if (!track.previewUrl && track.id) { // Apenas busca se tiver track.id
      const detailedPreviewUrl = await fetchPreviewUrlFromTrackEndpoint(track.id);
      if (detailedPreviewUrl) {
        track.previewUrl = detailedPreviewUrl;
      }
    }
    return track;
  }));
  console.log(`SPOTIFY_API: Found ${tracks.length} tracks for query "${q}".`);
  res.json(tracks);
}));

app.post('/api/cards', asyncHandler(async (req, res) => {
  const { nome, data, mensagem, spotifyTrackId, spotifyTrackName, previewUrl, fotoUrl } = req.body;
  if (!nome || !mensagem) {
    return res.status(400).json({ message: 'Fields "nome" and "mensagem" are required.' });
  }
  const cardId = uuidv4();
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
      [cardData.id, cardData.nome, cardData.data, cardData.mensagem,
       cardData.spotifyTrackId, cardData.spotifyTrackName, cardData.previewUrl, cardData.fotoUrl],
      function(err) {
        if (err) {
          console.error('DATABASE ERROR: Failed to save card:', err.message);
          return reject(new Error('Failed to save card to database.'));
        }
        console.log(`DATABASE: Card saved with ID: ${cardId}`);
        const frontendBaseUrl = process.env.FRONTEND_URL || 'https://messagelove-frontend.vercel.app';
        // Ajuste o caminho '/cards/view/' se a rota no seu frontend for diferente
        const viewLink = `${frontendBaseUrl}/cards/view/${cardId}`;
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

// Endpoint para servir a página HTML de visualização do cartão (opcional)
app.get('/card/:id', (req, res) => {
  const { id } = req.params;
  // O HTML e o script JS para esta página permanecem os mesmos.
  // Esta página tocará apenas PREVIEWS de música.
  res.send(`
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Seu Cartão Especial - Messagelove</title>
      <link rel="stylesheet" href="/style.css">
      <style>
        body{font-family:sans-serif;margin:0;background-color:#f4f4f4;display:flex;justify-content:center;align-items:center;min-height:100vh;padding:1em;}
        .container{background-color:#fff;padding:20px;border-radius:8px;box-shadow:0 0 10px rgba(0,0,0,0.1);max-width:500px;width:100%;}
        .card-preview h1{text-align:center;color:#333;} .card-preview p{color:#555;line-height:1.6;word-break:break-word;}
        .audio-player{display:flex;align-items:center;margin-top:10px;padding:10px;background-color:#eee;border-radius:4px;}
        .play-pause-btn{background:none;border:none;font-size:1.5em;cursor:pointer;margin-right:10px;}
        .progress-bar-container{flex-grow:1;height:8px;background-color:#ccc;border-radius:4px;overflow:hidden;margin:0 10px;cursor:pointer;}
        .progress-bar{width:0%;height:100%;background-color:#5cb85c;}
        .duration{font-size:0.9em;color:#333;min-width:70px;text-align:right;}
        .preview-error{color:red;font-size:0.9em;margin-top:5px;} .error-message{color:red;text-align:center;}
        img.preview-image{max-width:100%;border-radius:4px;margin-top:10px;}
      </style>
    </head>
    <body>
      <div id="card-view" class="container"><div class="card-preview">
        <h1>Seu Cartão Especial</h1>
        <div id="card-content-loading">Carregando cartão...</div>
        <div id="card-content" style="display:none;"></div>
      </div></div>
      <script>
        function formatTime(s){if(isNaN(s)||s<0)return'0:00';const m=Math.floor(s/60);const secs=Math.floor(s%60);return\`\${m}:\${secs<10?'0':''}\${secs}\`;}
        async function loadCard(){
          const cardId="${id}";
          const loadingDiv=document.getElementById('card-content-loading');
          const contentDiv=document.getElementById('card-content');
          try{
            const r=await fetch(\`/api/card/\${cardId}\`);
            if(!r.ok){const e=await r.json().catch(()=>({message:'Erro busca dados.'}));throw new Error(e.message||r.statusText);}
            const c=await r.json();loadingDiv.style.display='none';contentDiv.style.display='block';
            let df='Não especificada';if(c.data){try{const dO=new Date(c.data+'T00:00:00');if(!isNaN(dO.getTime()))df=dO.toLocaleDateString('pt-BR',{timeZone:'UTC',day:'2-digit',month:'2-digit',year:'numeric'});else df=c.data;}catch(e){df=c.data;}}
            contentDiv.innerHTML=\`
              <p><strong>Para:</strong> \${c.nome}</p><p><strong>Data:</strong> \${df}</p><p><strong>Mensagem:</strong> \${c.mensagem.replace(/\\n/g,'<br>')}</p>
              \${c.fotoUrl?\`<div><img src="\${c.fotoUrl}" alt="Foto" class="preview-image"></div>\`:''}
              \${c.previewUrl?\`<div><h3>Música: \${c.spotifyTrackName||'Faixa'}</h3><div class="audio-player"><button class="play-pause-btn" aria-label="Tocar"><span class="play-icon">▶️</span><span class="pause-icon" style="display:none">⏸️</span></button><div class="progress-bar-container"><div class="progress-bar"></div></div><span class="duration">0:00/0:00</span><audio class="card-audio-preview" preload="metadata" src="\${c.previewUrl}">Audio não suportado.</audio><div class="preview-error"style="display:none">Prévia indisponível.</div></div></div>\`:''}
            \`;
            if(c.previewUrl){
              const pE=contentDiv.querySelector('.audio-player'),aE=pE.querySelector('.audio-element'),btn=pE.querySelector('.play-pause-btn'),pI=btn.querySelector('.play-icon'),psI=btn.querySelector('.pause-icon'),pBC=pE.querySelector('.progress-bar-container'),pB=pBC.querySelector('.progress-bar'),dE=pE.querySelector('.duration'),eE=pE.querySelector('.preview-error');let aD=0;
              aE.onloadedmetadata=()=>{aD=aE.duration;dE.textContent=\`0:00 / \${formatTime(aD||0)}\`;};
              aE.ontimeupdate=()=>{if(aD>0)pB.style.width=\`\${(aE.currentTime/aD)*100}%\`;dE.textContent=\`\${formatTime(aE.currentTime)} / \${formatTime(aD||0)}\`;};
              aE.onended=()=>{pI.style.display='inline';psI.style.display='none';aE.currentTime=0;pB.style.width='0%';btn.setAttribute('aria-label','Tocar');};
              aE.onerror=()=>{eE.style.display='block';if(pE)pE.style.display='none';};
              btn.onclick=()=>{if(aE.paused){aE.play().catch(e=>{eE.textContent='Erro ao tocar.';eE.style.display='block';});pI.style.display='none';psI.style.display='inline';btn.setAttribute('aria-label','Pausar');}else{aE.pause();pI.style.display='inline';psI.style.display='none';btn.setAttribute('aria-label','Tocar');}};
              pBC.onclick=(ev)=>{if(aD>0){const rect=pBC.getBoundingClientRect();aE.currentTime=((ev.clientX-rect.left)/rect.width)*aD;}};
            }
          }catch(e){console.error('Erro loadCard:',e);loadingDiv.style.display='none';contentDiv.style.display='block';contentDiv.innerHTML=\`<p class="error-message">Erro: \${e.message}</p>\`;}
        }
        if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',loadCard);else loadCard();
      </script>
    </body></html>
  `);
});

// Middleware Global de Tratamento de Erros
app.use((err, req, res, next) => {
  console.error("GLOBAL ERROR HANDLER:", err.name, err.message);
  if (err.stack && process.env.NODE_ENV !== 'production') {
    console.error(err.stack); // Logar stack em desenvolvimento
  }
  const statusCode = err.status || 500;
  const errorMessage = (statusCode === 500 && process.env.NODE_ENV === 'production')
    ? 'Ocorreu um erro inesperado no servidor.'
    : err.message || 'Erro Interno do Servidor';

  res.status(statusCode).json({
    message: errorMessage,
    ...(process.env.NODE_ENV !== 'production' && { errorName: err.name }) // Detalhes do erro em dev
  });
});

// Inicialização do Servidor
app.listen(PORT, () => {
  console.log(`HTTP Server running on port ${PORT}`);
  console.log(`Frontend esperado em: ${frontendUrl} ou ${devFrontendUrl}`);
  refreshApplicationSpotifyToken().catch(err => { // Busca token da aplicação na inicialização
    console.error("STARTUP ERROR: Failed to fetch initial Spotify application token:", err.message);
  });
});

// Encerramento Gracioso
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