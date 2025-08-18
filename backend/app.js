require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const logger = require('./config/logger');
const db = require('./models');
const authRoutes = require('./routes/authRoutes');
const cardRoutes = require('./routes/cardsRoutes'); 

const app = express();

const allowedOrigins = [
  'https://messagelove-frontend.vercel.app',
  'http://localhost:3000',
  'https://messagelove.vercel.app'
];

const corsOptions = {
  origin: function (origin, callback) {
    // Permite requisições sem origem (como mobile apps ou serviços backend)
    if (!origin) return callback(null, true);
    
    // Verifica se a origem está na lista de permitidas
    if (allowedOrigins.some(allowed => {
      return origin.match(new RegExp(allowed.replace('https://', 'https?://')));
    })) {
      return callback(null, true);
    }
    
    logger.warn(`Blocked CORS request from: ${origin}`);
    callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 204
};

// Middlewares
app.use(cors(corsOptions));
app.use(helmet());
app.use(compression());
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  skip: (req) => req.method === 'OPTIONS',
  message: 'Too many requests from this IP, please try again later'
});
app.use(limiter);

// Rotas (corrigido para usar cardRoutes em vez de cardsRoutes)
app.use('/api/auth', authRoutes);
app.use('/api/cards', cardRoutes); // Corrigido aqui

// Rota raiz
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'online',
    message: 'MessageLove API',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    docs: 'https://github.com/your-repo/docs'
  });
});

// Tratamento de erros
app.use((req, res, next) => {
  res.status(404).json({
    error: 'Endpoint not found',
    availableEndpoints: {
      auth: '/api/auth',
      cards: '/api/cards',
    }
  });
});

app.use((err, req, res, next) => {
  logger.error(err.stack);
  
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      error: 'CORS policy violation',
      allowedOrigins,
      yourOrigin: req.headers.origin || 'none'
    });
  }

  res.status(500).json({
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message
  });
});

// Inicialização do servidor
const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    await db.sequelize.authenticate();
    logger.info('Database connection established');
    
    if (process.env.NODE_ENV === 'development') {
      await db.sequelize.sync({ alter: true });
      logger.info('Database synced in development mode');
    }
    
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Allowed CORS origins: ${allowedOrigins.join(', ')}`);
    });
  } catch (err) {
    logger.error('Failed to start server:', err);
    process.exit(1);
  }
};

startServer();

// Shutdown graceful
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  try {
    await db.sequelize.close();
    process.exit(0);
  } catch (err) {
    logger.error('Error during shutdown:', err);
    process.exit(1);
  }
});