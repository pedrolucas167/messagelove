require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const winston = require('winston');
const cardRoutes = require('./routes/cardRoutes');
const db = require('./models');

const app = express();
const PORT = process.env.PORT || 3001;

// Configuração do Logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

// Configuração do CORS
const corsOptions = {
  origin: (origin, callback) => {
    const whitelist = [
      'http://localhost:5500',
      'http://127.0.0.1:5500',
      'https://messagelove-frontend.vercel.app',
      process.env.FRONTEND_URL // Suporte a variável de ambiente para flexibilidade
    ].filter(Boolean); // Remove valores undefined

    if (!origin || whitelist.includes(origin)) {
      callback(null, true);
    } else {
      const error = new Error(`Origem '${origin}' não permitida pela política de CORS`);
      logger.error(error.message, { origin });
      callback(error);
    }
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 204 // Para maior compatibilidade com navegadores
};

// Configuração de Cabeçalhos de Segurança com Helmet
const cspConfig = {
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'"],
    frameSrc: ["'self'", 'https://www.youtube.com'],
    imgSrc: ["'self'", 'data:', 'https:'],
    styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
    fontSrc: ["'self'", 'https://fonts.gstatic.com'],
    connectSrc: [
      "'self'",
      'https://messagelove-backend.onrender.com',
      'http://localhost:3001',
      'https://www.youtube.com' // Para oEmbed
    ],
    objectSrc: ["'none'"],
    upgradeInsecureRequests: []
  }
};

// Middlewares
const configureMiddlewares = () => {
  app.use(helmet({
    contentSecurityPolicy: cspConfig // Aplica CSP no servidor
  }));
  app.use(compression()); // Compressão de respostas
  app.use(cors(corsOptions));
  app.options('*', cors(corsOptions));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  // Logger de requisições
  app.use((req, res, next) => {
    logger.info(`${req.method} ${req.url}`, {
      ip: req.ip,
      origin: req.get('origin'),
      userAgent: req.get('user-agent')
    });
    next();
  });
};

// Rotas
const configureRoutes = () => {
  // Rota de Saúde
  app.get('/', (req, res) => {
    res.status(200).json({ message: 'API do MessageLove está no ar!', version: '1.0.0' });
  });

  // Rotas de cartões
  app.use('/api', cardRoutes);
};

// Tratamento de Erros
const configureErrorHandling = () => {
  app.use((err, req, res, next) => {
    if (err.message.includes('não permitida pela política de CORS')) {
      return res.status(403).json({ message: err.message });
    }

    logger.error('Erro global', {
      error: err.message,
      stack: err.stack,
      url: req.url,
      method: req.method
    });

    res.status(err.status || 500).json({
      message: err.message || 'Ocorreu um erro interno no servidor.',
      error: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  });

  // 404 para rotas não encontradas
  app.use((req, res) => {
    res.status(404).json({ message: `Rota ${req.url} não encontrada.` });
  });
};

// Inicialização do Servidor
const startServer = async () => {
  try {
    await db.sequelize.authenticate();
    logger.info('Conexão com o banco de dados PostgreSQL estabelecida.');
    await db.sequelize.sync({ alter: true });
    logger.info('Modelos sincronizados com o banco de dados.');

    configureMiddlewares();
    configureRoutes();
    configureErrorHandling();

    app.listen(PORT, () => {
      logger.info(`Servidor iniciado na porta ${PORT}`, {
        environment: process.env.NODE_ENV || 'development'
      });
    });
  } catch (error) {
    logger.error('Falha ao iniciar o servidor', { error: error.message, stack: error.stack });
    process.exit(1);
  }
};

// Iniciar o servidor
startServer();