const express = require('express');
const cors = require('cors');
const SpotifyWebApi = require('spotify-web-api-node');
const dotenv = require('dotenv');
const axios = require('axios');
const sqlite3 = require('sqlite3').verbose();

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Configurar CORS
const frontendUrl = process.env.FRONTEND_URL;
if (!frontendUrl) {
  console.error('FRONTEND_URL não definido no .env. Usando valor padrão temporário.');
}
app.use(cors({ 
  origin: frontendUrl || 'https://messagelove-frontend.vercel.app',
  credentials: true,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Accept']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configurar banco de dados SQLite
const db = new sqlite3.Database('./cards.db', (err) => {
  if (err) {
    console.error('Erro ao conectar ao banco de dados:', err.message);
  } else {
    console.log('Conectado ao banco de dados SQLite (nota: dados são temporários no Render).');
  }
});

db.run(`
  CREATE TABLE IF NOT EXISTS cards (
    id TEXT PRIMARY KEY,
    nome TEXT NOT NULL,
    data TEXT,
    mensagem TEXT NOT NULL,
    spotifyTrackId TEXT,
    previewUrl TEXT,
    fotoUrl TEXT
  )
`, (err) => {
  if (err) {
    console.error('Erro ao criar tabela:', err.message);
  } else {
    console.log('Tabela "cards" criada ou já existe.');
  }
});

const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET
});

let spotifyToken = null;
let tokenExpiry = null;

async function getSpotifyToken() {
  const now = Date.now();
  if (spotifyToken && tokenExpiry && now < tokenExpiry) {
    return spotifyToken;
  }
  try {
    const data = await spotifyApi.clientCredentialsGrant();
    spotifyToken = data.body['access_token'];
    tokenExpiry = now + (data.body.expires_in * 1000) - 60000; // Renova 1 minuto antes
    spotifyApi.setAccessToken(spotifyToken);
    console.log('Token obtido com sucesso:', spotifyToken);
    return spotifyToken;
  } catch (error) {
    console.error('Erro ao obter token do Spotify:', error.message);
    throw new Error('Falha na autenticação com o Spotify');
  }
}

async function fetchPreviewUrlFromTrackEndpoint(trackId) {
  try {
    const response = await spotifyApi.getTrack(trackId);
    return response.body.preview_url || null;
  } catch (error) {
    console.error('Erro ao buscar preview_url do endpoint /tracks:', error.message);
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

app.get('/api/spotify/search', async (req, res) => {
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
          console.log(`Preview_url encontrada para ${track.name}: ${track.previewUrl}`);
        }
      }
      return track;
    }));
    console.log('Faixas encontradas:', tracks.length);
    res.json(tracks);
  } catch (error) {
    console.error('Erro na busca do Spotify:', error.message);
    res.status(500).json({ message: error.message || 'Erro ao buscar músicas' });
  }
});

app.post('/api/cards', (req, res) => {
  const { nome, data, mensagem, spotify, previewUrl } = req.body;
  console.log('Dados recebidos:', { nome, data, mensagem, spotify, previewUrl });
  const cardId = Math.random().toString(36).slice(2, 10);
  const cardData = { id: cardId, nome, data, mensagem, spotifyTrackId: spotify || null, previewUrl: previewUrl || null, fotoUrl: null };
  db.run(
    `INSERT INTO cards (id, nome, data, mensagem, spotifyTrackId, previewUrl, fotoUrl) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [cardId, nome, data, mensagem, spotify, previewUrl, null],
    (err) => {
      if (err) {
        console.error('Erro ao salvar cartão:', err.message);
        return res.status(500).json({ message: 'Erro ao salvar cartão' });
      }
      const viewLink = `${process.env.BACKEND_URL || 'https://messagelove-backend.onrender.com'}/card/${cardId}`;
      res.json({ viewLink, cardData });
    }
  );
});

app.get('/api/card/:id', (req, res) => {
  const { id } = req.params;
  db.get(`SELECT * FROM cards WHERE id = ?`, [id], (err, row) => {
    if (err) {
      console.error('Erro ao buscar cartão:', err.message);
      return res.status(500).json({ message: 'Erro ao buscar cartão' });
    }
    if (!row) return res.status(404).json({ message: 'Cartão não encontrado' });
    res.json(row);
  });
});

app.get('/api/status', (req, res) => {
  res.json({ status: 'API is running' });
});

app.get('/card/:id', (req, res) => {
  const { id } = req.params;
  res.send(`
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Seu Cartão Especial - Messagelove</title>
      <link rel="stylesheet" href="/style.css">
    </head>
    <body>
      <div id="card-view" class="container">
        <div class="card-preview">
          <h1>Cartão Especial</h1>
          <div id="card-content"></div>
        </div>
      </div>
      <script>
        async function loadCard() { ... } // (manter o código existente)
        function formatTime(seconds) { ... } // (manter o código existente)
        loadCard();
      </script>
    </body>
    </html>
  `);
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});