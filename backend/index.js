const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const sqlite3 = require('sqlite3').verbose();
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');

// Configuração inicial
dotenv.config();
const app = express();
const PORT = process.env.PORT || 3001;

// Configuração de rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100 // limite de 100 requisições por IP
});

// 1. Configuração de Segurança e CORS
const configureSecurity = () => {
  // Middlewares de segurança
  app.use(helmet());
  app.use(limiter);
  
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
class Database {
  constructor() {
    this.DB_PATH = process.env.DB_SOURCE || './cards.db';
    this.db = null;
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.DB_PATH, (err) => {
        if (err) {
          console.error('DATABASE ERROR: Failed to connect:', err.message);
          reject(err);
        } else {
          console.log(`DATABASE: Connected to SQLite at ${this.DB_PATH}`);
          resolve(this.db);
        }
      });
    });
  }

  async initialize() {
    // Query em UMA ÚNICA LINHA para evitar problemas de formatação
    const createTableQuery = `CREATE TABLE IF NOT EXISTS cards (id TEXT PRIMARY KEY, nome TEXT NOT NULL, data TEXT, mensagem TEXT NOT NULL, youtubeVideoId TEXT, fotoUrl TEXT, createdAt TEXT DEFAULT CURRENT_TIMESTAMP)`;
    
    return new Promise((resolve, reject) => {
      this.db.run(createTableQuery, (err) => {
        if (err) {
          console.error('DATABASE ERROR: Failed to create table:', err.message);
          reject(err);
        } else {
          console.log('DATABASE: Table "cards" created successfully');
          resolve();
        }
      });
    });
  }

  


  async initialize() {
  try {
    // Query simplificada sem quebras de linha
    await this.db.exec(`CREATE TABLE IF NOT EXISTS cards (
      id TEXT PRIMARY KEY,
      nome TEXT NOT NULL,
      data TEXT,
      mensagem TEXT NOT NULL,
      youtubeVideoId TEXT,
      fotoUrl TEXT,
      createdAt TEXT DEFAULT (datetime('now'))
    `);
    console.log('DATABASE: Table created successfully');
  } catch (err) {
    console.error('DATABASE ERROR:', err.message);
    throw err;
  }
}

  async close() {
    return new Promise((resolve, reject) => {
      if (this.db) {
        this.db.close((err) => {
          if (err) {
            console.error('DATABASE ERROR: Failed to close SQLite connection:', err.message);
            reject(err);
          } else {
            console.log('DATABASE: SQLite connection closed.');
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  }

  async insertCard(cardData) {
    return new Promise((resolve, reject) => {
      this.db.run(
        `INSERT INTO cards (id, nome, data, mensagem, youtubeVideoId, fotoUrl)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [cardData.id, cardData.nome, cardData.data, cardData.mensagem, cardData.youtubeVideoId, cardData.fotoUrl],
        function(err) {
          if (err) return reject(err);
          resolve(this.lastID);
        }
      );
    });
  }

  async getCard(id) {
    return new Promise((resolve, reject) => {
      this.db.get(`SELECT * FROM cards WHERE id = ?`, [id], (err, row) => {
        if (err) return reject(err);
        resolve(row);
      });
    });
  }
}

// 3. Middlewares
const setupMiddlewares = () => {
  app.use(express.json({ limit: '10kb' }));
  app.use(express.urlencoded({ extended: true, limit: '10kb' }));
  app.use(express.static(path.join(__dirname, 'public'), {
    dotfiles: 'ignore',
    index: false
  }));
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

const validateYouTubeId = (value) => {
  if (!value) return true;
  // YouTube ID tem geralmente 11 caracteres
  return /^[a-zA-Z0-9_-]{11}$/.test(value);
};

const validateUrl = (value) => {
  if (!value) return true;
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
};

// 5. Rotas
const setupRoutes = (database) => {
  // Health Check
  app.get('/api/status', (req, res) => {
    res.json({
      status: 'API is running',
      message: 'Messagelove backend is operational.',
      timestamp: new Date().toISOString()
    });
  });

  // Criar novo cartão
  app.post('/api/cards', 
    [
      body('nome').trim().isLength({ min: 1, max: 100 }).escape(),
      body('data').optional().isISO8601().toDate(),
      body('mensagem').trim().isLength({ min: 1, max: 2000 }).escape(),
      body('youtubeVideoId').optional().custom(validateYouTubeId),
      body('fotoUrl').optional().custom(validateUrl)
    ],
    asyncHandler(async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { nome, data, mensagem, youtubeVideoId, fotoUrl } = req.body;

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
        await database.insertCard(cardData);
        
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
    })
  );

  // Obter dados de um cartão
  app.get('/api/card/:id', 
    asyncHandler(async (req, res) => {
      const { id } = req.params;
      
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
        return res.status(400).json({ message: 'Invalid card ID format.' });
      }

      const card = await database.getCard(id);

      if (!card) {
        return res.status(404).json({ message: 'Card not found.' });
      }

      console.log(`DATABASE: Fetched card with ID: ${id}`);
      return res.json(card);
    })
  );

  // Visualizar cartão
  app.get('/card/:id', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'card.html'));
  });
};

// 6. Tratamento de Erros
const setupErrorHandling = () => {
  // Rota não encontrada
  app.use((req, res, next) => {
    res.status(404).json({ message: 'Route not found.' });
  });

  // Tratamento de erros global
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
const startServer = async (database) => {
  const server = app.listen(PORT, () => {
    console.log(`HTTP Server running on port ${PORT}`);
    const frontendUrl = process.env.FRONTEND_URL || 'https://messagelove-frontend.vercel.app';
    const devFrontendUrl = `http://localhost:${process.env.DEV_FRONTEND_LOCAL_PORT || 3000}`;
    console.log(`Frontend esperado em: ${frontendUrl} ou ${devFrontendUrl}`);
  });

  // Encerramento gracioso
  const shutdown = async () => {
    console.log('\nShutting down gracefully...');
    server.close(async () => {
      try {
        await database.close();
        console.log('Server shut down.');
        process.exit(0);
      } catch (err) {
        console.error('Error during shutdown:', err);
        process.exit(1);
      }
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
};

// 8. Inicialização da Aplicação
const initializeApp = async () => {
  try {
    configureSecurity();
    setupMiddlewares();
    
    const database = new Database();
    await database.connect();
    await database.initialize();
    
    setupRoutes(database);
    setupErrorHandling();
    await startServer(database);
  } catch (error) {
    console.error('FATAL ERROR: Failed to initialize application:', error);
    process.exit(1);
  }
};

// Iniciar a aplicação
initializeApp();