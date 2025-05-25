const https = require('https');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const SpotifyWebApi = require('spotify-web-api-node');
const dotenv = require('dotenv');
const axios = require('axios');
const sqlite3 = require('sqlite3').verbose();

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Configurar CORS para permitir o frontend (atualizar para o domínio do deploy)
app.use(cors({ 
  origin: process.env.FRONTEND_URL || 'https://messagelove-frontend.vercel.app', // Ajustar para o domínio do frontend no deploy
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
    console.log('Conectado ao banco de dados SQLite.');
  }
});

// Criar tabela de cartões
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

async function getSpotifyToken() {
  try {
    const data = await spotifyApi.clientCredentialsGrant();
    spotifyApi.setAccessToken(data.body['access_token']);
    console.log('Token obtido com sucesso:', data.body['access_token']);
    return data.body['access_token'];
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

async function fetchPreviewUrlFromEmbed(trackId) {
  try {
    const response = await axios.get(`https://open.spotify.com/embed/track/${trackId}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    const htmlContent = response.data;
    const regex = /<script id="resource" type="application\/json">(.+?)<\/script>/s;
    const match = htmlContent.match(regex);
    
    if (match) {
      const jsonData = JSON.parse(match[1]);
      const previewUrl = jsonData?.audioPreview?.url;
      return previewUrl || null;
    } else {
      console.log('Nenhum dado JSON encontrado na página de embed.');
      return null;
    }
  } catch (error) {
    console.error('Erro ao buscar preview_url do embed:', error.message);
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

// Endpoint para buscar músicas no Spotify
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

    // Para cada faixa sem preview_url, tentar buscar via endpoint /tracks e depois via embed
    tracks = await Promise.all(tracks.map(async (track) => {
      if (!track.previewUrl) {
        console.log(`Preview_url não encontrada para ${track.name}, buscando via endpoint /tracks...`);
        const previewUrlFromTrack = await fetchPreviewUrlFromTrackEndpoint(track.id);
        if (previewUrlFromTrack) {
          track.previewUrl = previewUrlFromTrack;
          console.log(`Preview_url encontrada via endpoint /tracks para ${track.name}: ${track.previewUrl}`);
        } else {
          console.log(`Preview_url não encontrada via endpoint /tracks, buscando via embed...`);
          const previewUrlFromEmbed = await fetchPreviewUrlFromEmbed(track.id);
          if (previewUrlFromEmbed) {
            track.previewUrl = previewUrlFromEmbed;
            console.log(`Preview_url encontrada via embed para ${track.name}: ${track.previewUrl}`);
          }
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

// Endpoint para criar um cartão
app.post('/api/cards', (req, res) => {
  const { nome, data, mensagem, spotify, previewUrl } = req.body;

  console.log('Dados recebidos:', {
    nome,
    data,
    mensagem,
    spotify,
    previewUrl
  });

  // Gerar um ID único para o cartão
  const cardId = Math.random().toString(36).slice(2, 10); // ID simples para teste

  const cardData = {
    id: cardId,
    nome,
    data,
    mensagem,
    spotifyTrackId: spotify || null,
    previewUrl: previewUrl || null,
    fotoUrl: null // Adicionar suporte para foto no futuro
  };

  // Salvar no banco de dados
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

// Endpoint para visualizar um cartão
app.get('/api/card/:id', (req, res) => {
  const { id } = req.params;

  db.get(
    `SELECT * FROM cards WHERE id = ?`,
    [id],
    (err, row) => {
      if (err) {
        console.error('Erro ao buscar cartão:', err.message);
        return res.status(500).json({ message: 'Erro ao buscar cartão' });
      }
      if (!row) {
        return res.status(404).json({ message: 'Cartão não encontrado' });
      }
      res.json(row);
    }
  );
});

// Endpoint de status
app.get('/api/status', (req, res) => {
  res.json({ status: 'API is running' });
});

// Servir a página de visualização do cartão
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
        async function loadCard() {
          try {
            const response = await fetch('/api/card/${id}');
            const card = await response.json();
            if (!response.ok) throw new Error(card.message || 'Erro ao carregar cartão');
            const content = document.getElementById('card-content');
            content.innerHTML = \`
              <p><strong>Para:</strong> \${card.nome}</p>
              <p><strong>Data:</strong> \${card.data || 'Não especificada'}</p>
              <p><strong>Mensagem:</strong> \${card.mensagem}</p>
              \${card.previewUrl ? \`
                <div>
                  <h3>Música</h3>
                  <div class="audio-player">
                    <button class="play-pause-btn" aria-label="Tocar ou pausar música">
                      <span class="play-icon">▶️</span>
                      <span class="pause-icon" style="display: none;">⏸️</span>
                    </button>
                    <div class="progress-bar">
                      <div class="progress"></div>
                    </div>
                    <span class="duration">0:00 / 0:30</span>
                    <audio class="card-audio-preview" preload="metadata">
                      <source src="\${card.previewUrl}" type="audio/mpeg">
                      Seu navegador não suporta o elemento de áudio.
                    </audio>
                  </div>
                  <div class="preview-error" style="display: none;">
                    Não foi possível reproduzir a música. Pode estar bloqueada na sua região.
                  </div>
                </div>
              \` : ''}
            \`;

            const audioElement = content.querySelector('.card-audio-preview');
            const playPauseBtn = content.querySelector('.play-pause-btn');
            const playIcon = content.querySelector('.play-icon');
            const pauseIcon = content.querySelector('.pause-icon');
            const progressBar = content.querySelector('.progress');
            const durationElement = content.querySelector('.duration');
            const errorElement = content.querySelector('.preview-error');

            if (audioElement) {
              audioElement.addEventListener('loadedmetadata', () => {
                durationElement.textContent = \`0:00 / \${formatTime(audioElement.duration)}\`;
              });

              audioElement.addEventListener('timeupdate', () => {
                const currentTime = audioElement.currentTime;
                const duration = audioElement.duration || 30;
                const progressPercent = (currentTime / duration) * 100;
                progressBar.style.width = \`\${progressPercent}%\`;
                durationElement.textContent = \`\${formatTime(currentTime)} / \${formatTime(duration)}\`;
              });

              audioElement.addEventListener('ended', () => {
                playPauseBtn.setAttribute('aria-label', 'Tocar música');
                playIcon.style.display = 'inline';
                pauseIcon.style.display = 'none';
                audioElement.currentTime = 0;
                progressBar.style.width = '0%';
              });

              audioElement.addEventListener('error', () => {
                console.error('Erro ao reproduzir música:', audioElement.error);
                errorElement.style.display = 'block';
                audioElement.closest('.audio-player').style.display = 'none';
              });

              playPauseBtn.addEventListener('click', () => {
                if (audioElement.paused) {
                  audioElement.play();
                  playPauseBtn.setAttribute('aria-label', 'Pausar música');
                  playIcon.style.display = 'none';
                  pauseIcon.style.display = 'inline';
                } else {
                  audioElement.pause();
                  playPauseBtn.setAttribute('aria-label', 'Tocar música');
                  playIcon.style.display = 'inline';
                  pauseIcon.style.display = 'none';
                }
              });
            }
          } catch (error) {
            document.getElementById('card-content').innerHTML = \`<p class="error-message">\${error.message}</p>\`;
          }
        }

        function formatTime(seconds) {
          const minutes = Math.floor(seconds / 60);
          const secs = Math.floor(seconds % 60);
          return \`\${minutes}:\${secs < 10 ? '0' : ''}\${secs}\`;
        }

        loadCard();
      </script>
    </body>
    </html>
  `);
});

const options = {
  key: fs.readFileSync('localhost-key.pem'),
  cert: fs.readFileSync('localhost.pem')
};

https.createServer(options, app).listen(PORT, () => {
  console.log(`Servidor HTTPS rodando na porta ${PORT}`);
});

// Fechar o banco de dados ao encerrar o processo
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error('Erro ao fechar o banco de dados:', err.message);
    }
    console.log('Banco de dados fechado.');
    process.exit(0);
  });
});