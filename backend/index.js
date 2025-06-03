const express = require('express');
const cors = require('cors');
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
    allowedOrigins.push(process.env.GITPOD_WORKSPACE_URL.replace('https://', `https://${devFrontendLocalPort}-`));
  }
}
console.log('Allowed CORS origins:', allowedOrigins);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
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
app.options('*', cors());

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Configuração do Banco de Dados SQLite
const DB_PATH = process.env.DB_SOURCE || './cards.db';
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('DATABASE ERROR: Failed to connect to SQLite:', err.message);
    return;
  }
  console.log(`DATABASE: Connected to SQLite at ${DB_PATH}`);
  db.run(`
    CREATE TABLE IF NOT EXISTS cards (
      id TEXT PRIMARY KEY,
      nome TEXT NOT NULL,
      data TEXT,
      mensagem TEXT NOT NULL,
      youtubeUrls TEXT, -- Armazena URLs do YouTube como JSON
      fotoUrl TEXT
    )
  `, (errRun) => {
    if (errRun) {
      console.error('DATABASE ERROR: Failed to create "cards" table:', errRun.message);
    } else {
      console.log('DATABASE: Table "cards" is ready.');
    }
  });
});

// Wrapper para rotas assíncronas
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// Endpoints da API
app.get('/api/status', (req, res) => {
  res.json({
    status: 'API is running',
    message: 'Messagelove backend is operational.',
    timestamp: new Date().toISOString()
  });
});

app.post('/api/cards', asyncHandler(async (req, res) => {
  const { nome, data, mensagem, youtubeUrls, fotoUrl } = req.body;

  if (!nome || !mensagem) {
    return res.status(400).json({ message: 'Fields "nome" and "mensagem" are required.' });
  }

  let parsedYoutubeUrls = [];
  try {
    parsedYoutubeUrls = typeof youtubeUrls === 'string' ? JSON.parse(youtubeUrls) : youtubeUrls || [];
    if (!Array.isArray(parsedYoutubeUrls)) {
      throw new Error('youtubeUrls must be an array.');
    }
  } catch (error) {
    return res.status(400).json({ message: 'Invalid youtubeUrls format. Must be a JSON array.' });
  }

  const cardId = uuidv4();
  const cardData = {
    id: cardId,
    nome,
    data: data || null,
    mensagem,
    youtubeUrls: JSON.stringify(parsedYoutubeUrls), // Armazena como JSON no banco
    fotoUrl: fotoUrl || null
  };

  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO cards (id, nome, data, mensagem, youtubeUrls, fotoUrl)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [cardData.id, cardData.nome, cardData.data, cardData.mensagem, cardData.youtubeUrls, cardData.fotoUrl],
      function (err) {
        if (err) {
          console.error('DATABASE ERROR: Failed to save card:', err.message);
          return reject(new Error('Failed to save card to database.'));
        }
        console.log(`DATABASE: Card saved with ID: ${cardId}`);
        const viewLink = `${frontendUrl}/cards/view/${cardId}`;
        resolve(res.status(201).json({
          message: 'Card created successfully',
          viewLink,
          cardData: {
            ...cardData,
            youtubeUrls: parsedYoutubeUrls // Retorna como array na resposta
          }
        }));
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
      resolve(res.json({
        ...row,
        youtubeUrls: row.youtubeUrls ? JSON.parse(row.youtubeUrls) : [] // Converte JSON para array
      }));
    });
  });
}));

app.get('/card/:id', (req, res) => {
  const { id } = req.params;
  res.send(`
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Seu Cartão Especial - Messagelove</title>
      <link rel="stylesheet" href="/styles.css">
    </head>
    <body>
      <div id="card-view-page" class="container">
        <div class="card-preview">
          <h1>Seu Cartão Especial</h1>
          <div id="card-content-loading">Carregando cartão...</div>
          <div id="card-content" style="display:none;"></div>
        </div>
      </div>
      <script>
        function getYouTubeVideoId(url) {
          if (!url) return null;
          const patterns = [
            /(?:https?:\\/\\/)?(?:www\\.)?youtube\\.com\\/watch\\?v=([^&]+)/,
            /(?:https?:\\/\\/)?(?:www\\.)?youtu\\.be\\/([^?]+)/,
            /(?:https?:\\/\\/)?(?:www\\.)?youtube\\.com\\/embed\\/([^?]+)/,
            /(?:https?:\\/\\/)?(?:www\\.)?youtube\\.com\\/v\\/([^?]+)/,
            /(?:https?:\\/\\/)?(?:www\\.)?youtube\\.com\\/shorts\\/([^?]+)/
          ];
          for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match && match[1]) return match[1].split('&')[0];
          }
          return null;
        }

        function createVideoPlayerHtml(urls, currentIndex) {
          if (!urls || !urls.length || currentIndex >= urls.length) {
            return '<div class="preview-video-container"><p>Nenhum vídeo disponível.</p></div>';
          }
          const videoId = getYouTubeVideoId(urls[currentIndex]);
          if (!videoId) {
            return '<div class="preview-video-container"><p>Link do YouTube inválido.</p></div>';
          }
          return \`
            <div class="preview-video-container">
              <h3>Vídeo \${currentIndex + 1} de \${urls.length}</h3>
              <div class="youtube-player-container">
                <iframe
                  src="https://www.youtube.com/embed/\${videoId}?rel=0&modestbranding=1"
                  title="Vídeo do YouTube"
                  frameborder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowfullscreen>
                </iframe>
              </div>
              <div class="video-controls">
                <button type="button" class="btn btn--secondary prev-video-btn" \${currentIndex === 0 ? 'disabled' : ''}>Vídeo Anterior</button>
                <button type="button" class="btn btn--secondary next-video-btn" \${currentIndex === urls.length - 1 ? 'disabled' : ''}>Próximo Vídeo</button>
              </div>
            </div>
          \`;
        }

        async function loadCard() {
          const cardId = "${id}";
          const loadingDiv = document.getElementById('card-content-loading');
          const contentDiv = document.getElementById('card-content');
          try {
            const response = await fetch(\`/api/card/\${cardId}\`);
            if (!response.ok) {
              const error = await response.json().catch(() => ({ message: 'Erro ao buscar dados.' }));
              throw new Error(error.message);
            }
            const card = await response.json();
            loadingDiv.style.display = 'none';
            contentDiv.style.display = 'block';

            let dataFormatted = 'Não especificada';
            if (card.data) {
              try {
                const dateObj = new Date(card.data + 'T00:00:00');
                if (!isNaN(dateObj.getTime())) {
                  dataFormatted = dateObj.toLocaleDateString('pt-BR', {
                    timeZone: 'UTC',
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                  });
                } else {
                  dataFormatted = card.data;
                }
              } catch {
                dataFormatted = card.data;
              }
            }

            let currentVideoIndex = 0;
            const updateVideoPlayer = () => {
              contentDiv.querySelector('.preview-video-container').outerHTML = createVideoPlayerHtml(card.youtubeUrls, currentVideoIndex);
              const prevBtn = contentDiv.querySelector('.prev-video-btn');
              const nextBtn = contentDiv.querySelector('.next-video-btn');
              if (prevBtn) {
                prevBtn.onclick = () => {
                  if (currentVideoIndex > 0) {
                    currentVideoIndex--;
                    updateVideoPlayer();
                  }
                };
              }
              if (nextBtn) {
                nextBtn.onclick = () => {
                  if (currentVideoIndex < card.youtubeUrls.length - 1) {
                    currentVideoIndex++;
                    updateVideoPlayer();
                  }
                };
              }
            };

            contentDiv.innerHTML = \`
              <p><strong>Para:</strong> \${card.nome}</p>
              <p><strong>Data:</strong> \${dataFormatted}</p>
              <p><strong>Mensagem:</strong> \${card.mensagem.replace(/\\n/g, '<br>')}</p>
              \${card.fotoUrl ? \`<div class="preview-image-container"><img src="\${card.fotoUrl}" alt="Foto" class="preview-image"></div>\` : ''}
              \${createVideoPlayerHtml(card.youtubeUrls, currentVideoIndex)}
            \`;

            updateVideoPlayer();
          } catch (error) {
            console.error('Erro loadCard:', error);
            loadingDiv.style.display = 'none';
            contentDiv.style.display = 'block';
            contentDiv.innerHTML = \`<p class="error-message">Erro: \${error.message}</p>\`;
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

// Middleware Global de Tratamento de Erros
app.use((err, req, res, next) => {
  console.error('GLOBAL ERROR HANDLER:', err.name, err.message);
  if (err.stack && process.env.NODE_ENV !== 'production') {
    console.error(err.stack);
  }
  const statusCode = err.status || 500;
  const errorMessage = (statusCode === 500 && process.env.NODE_ENV === 'production')
    ? 'Ocorreu um erro inesperado no servidor.'
    : err.message || 'Erro Interno do Servidor';

  res.status(statusCode).json({
    message: errorMessage,
    ...(process.env.NODE_ENV !== 'production' && { errorName: err.name })
  });
});

// Inicialização do Servidor
app.listen(PORT, () => {
  console.log(`HTTP Server running on port ${PORT}`);
  console.log(`Frontend esperado em: ${frontendUrl} ou ${devFrontendUrl}`);
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