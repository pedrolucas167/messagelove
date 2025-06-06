const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const sqlite3 = require('sqlite3').verbose();
const { v4: uuidv4 } = require('uuid');
const path = require('path');

// Configuração inicial
dotenv.config();
const app = express();
const PORT = process.env.PORT || 3001;

// 1. Configuração de CORS
const configureCors = () => {
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

  const corsOptions = {
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
  };

  app.use(cors(corsOptions));
  app.options('*', cors());
};

// 2. Configuração do Banco de Dados
const setupDatabase = () => {
  const DB_PATH = process.env.DB_SOURCE || './cards.db';
  const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
      console.error('DATABASE ERROR: Failed to connect to SQLite:', err.message);
      return;
    }
    console.log(`DATABASE: Connected to SQLite at ${DB_PATH}`);
  });

  const initializeDatabase = () => {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS cards (
        id TEXT PRIMARY KEY,
        nome TEXT NOT NULL,
        data TEXT,
        mensagem TEXT NOT NULL,
        youtubeVideoId TEXT,
        fotoUrl TEXT
      )
    `;

    return new Promise((resolve, reject) => {
      db.run(createTableQuery, (err) => {
        if (err) {
          console.error('DATABASE ERROR: Failed to create "cards" table:', err.message);
          reject(err);
        } else {
          console.log('DATABASE: Table "cards" is ready.');
          resolve(db);
        }
      });
    });
  };

  return { db, initializeDatabase };
};

// 3. Middlewares
const setupMiddlewares = () => {
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(express.static(path.join(__dirname, 'public')));
};

// 4. Helpers
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const formatDate = (dateString) => {
  if (!dateString) return 'Não especificada';
  
  try {
    const dateObj = new Date(dateString + 'T00:00:00');
    if (!isNaN(dateObj.getTime())) {
      return dateObj.toLocaleDateString('pt-BR', {
        timeZone: 'UTC',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    }
    return dateString;
  } catch {
    return dateString;
  }
};

// 5. Rotas
const setupRoutes = (db) => {
  // Health Check
  app.get('/api/status', (req, res) => {
    res.json({
      status: 'API is running',
      message: 'Messagelove backend is operational.',
      timestamp: new Date().toISOString()
    });
  });

  // Criar novo cartão
  app.post('/api/cards', asyncHandler(async (req, res) => {
    const { nome, data, mensagem, youtubeVideoId, fotoUrl } = req.body;

    if (!nome || !mensagem) {
      return res.status(400).json({ message: 'Fields "nome" and "mensagem" are required.' });
    }

    const cardId = uuidv4();
    const cardData = {
      id: cardId,
      nome,
      data: data || null,
      mensagem,
      youtubeVideoId: youtubeVideoId || null,
      fotoUrl: fotoUrl || null
    };

    try {
      await new Promise((resolve, reject) => {
        db.run(
          `INSERT INTO cards (id, nome, data, mensagem, youtubeVideoId, fotoUrl)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [cardData.id, cardData.nome, cardData.data, cardData.mensagem, cardData.youtubeVideoId, cardData.fotoUrl],
          function (err) {
            if (err) return reject(err);
            resolve();
          }
        );
      });

      console.log(`DATABASE: Card saved with ID: ${cardId}`);
      const frontendUrl = process.env.FRONTEND_URL || 'https://messagelove-frontend.vercel.app';
      const viewLink = `${frontendUrl}/cards/view/${cardId}`;

      return res.status(201).json({
        message: 'Card created successfully',
        viewLink,
        cardData
      });
    } catch (err) {
      console.error('DATABASE ERROR: Failed to save card:', err.message);
      throw new Error('Failed to save card to database.');
    }
  }));

  // Obter dados de um cartão
  app.get('/api/card/:id', asyncHandler(async (req, res) => {
    const { id } = req.params;

    const card = await new Promise((resolve, reject) => {
      db.get(`SELECT * FROM cards WHERE id = ?`, [id], (err, row) => {
        if (err) return reject(err);
        resolve(row);
      });
    });

    if (!card) {
      return res.status(404).json({ message: 'Card not found.' });
    }

    console.log(`DATABASE: Fetched card with ID: ${id}`);
    return res.json(card);
  }));

  // Visualizar cartão
  app.get('/card/:id', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'card.html'));
  });
};

// 6. Tratamento de Erros
const setupErrorHandling = () => {
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
};

// 7. Inicialização do Servidor
const startServer = () => {
  const server = app.listen(PORT, () => {
    console.log(`HTTP Server running on port ${PORT}`);
    const frontendUrl = process.env.FRONTEND_URL || 'https://messagelove-frontend.vercel.app';
    const devFrontendUrl = `http://localhost:${process.env.DEV_FRONTEND_LOCAL_PORT || 3000}`;
    console.log(`Frontend esperado em: ${frontendUrl} ou ${devFrontendUrl}`);
  });

  // Encerramento gracioso
  process.on('SIGINT', () => {
    console.log('\nSIGINT received. Shutting down gracefully...');
    server.close(() => {
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
  });
};

// 8. Inicialização da Aplicação
const initializeApp = async () => {
  try {
    configureCors();
    setupMiddlewares();
    const { db, initializeDatabase } = setupDatabase();
    await initializeDatabase();
    setupRoutes(db);
    setupErrorHandling();
    startServer();
  } catch (error) {
    console.error('FATAL ERROR: Failed to initialize application:', error);
    process.exit(1);
  }
};

// Iniciar a aplicação
initializeApp();