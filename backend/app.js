require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const winston = require('winston');
const cardRoutes = require('./routes/cardRoutes');
const authRoutes = require('./routes/authroutes');
const db = require('./models');

const app = express();
const PORT = process.env.PORT || 3001;

// Configuração do Logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({ format: winston.format.simple() }),
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
      process.env.FRONTEND_URL
    ].filter(Boolean);

    if (!origin || whitelist.includes(origin)) {
      logger.debug('CORS permitido', { origin });
      callback(null, true);
    } else {
      const error = new Error(`Origem '${origin}' não permitida pela política de CORS`);
      logger.warn(error.message, { origin });
      callback(error);
    }
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 204
};

// Configuração do Helmet (CSP e outros cabeçalhos)
const cspConfig = {
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'"],
    frameSrc: ["'self'", 'https://www.youtube.com'],
    imgSrc: ["'self'", 'data:', 'https:', `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com`],
    styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
    fontSrc: ["'self'", 'https://fonts.gstatic.com'],
    connectSrc: [
      "'self'",
      'https://messagelove-backend.onrender.com',
      'http://localhost:3001',
      'https://www.youtube.com',
      `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com`
    ],
    objectSrc: ["'none'"],
    upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null
  }
};

// Configuração do Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // 100 requisições por IP
  message: { message: 'Muitas requisições. Tente novamente mais tarde.' },
  standardHeaders: true,
  legacyHeaders: false
});

const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 10, // 10 tentativas de login por IP
  message: { message: 'Muitas tentativas de login. Tente novamente em 1 hora.' },
  standardHeaders: true,
  legacyHeaders: false
});

// Middlewares
const configureMiddlewares = () => {
  // Segurança: Helmet com CSP
  app.use(helmet({ contentSecurityPolicy: cspConfig }));
  // Compressão de respostas
  app.use(compression());
  // CORS
  app.use(cors(corsOptions));
  app.options('*', cors(corsOptions));
  // Rate Limiting geral
  app.use(limiter);
  // Rate Limiting específico para autenticação
  app.use('/api/auth', authLimiter);
  // Parsers
  app.use(express.json({ limit: '10kb' }));
  app.use(express.urlencoded({ extended: true, limit: '10kb' }));
  // Logger de requisições
  app.use((req, res, next) => {
    logger.info(`${req.method} ${req.url}`, {
      ip: req.ip,
      origin: req.get('origin') || 'N/A',
      userAgent: req.get('user-agent') || 'N/A',
      userId: req.user ? req.user.userId : 'N/A'
    });
    next();
  });
};

// Rotas
const configureRoutes = () => {
  // Rota de saúde
  app.get('/', (req, res) => {
    res.status(200).json({
      message: 'API do MessageLove está no ar!',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development'
    });
  });
  // Rotas principais
  app.use('/api', cardRoutes);
  app.use('/api/auth', authRoutes);
};

// Tratamento de Erros
const configureErrorHandling = () => {
  // Erros de validação (express-validator)
  app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
      logger.warn('Erro de JSON inválido', { url: req.url, body: req.body });
      return res.status(400).json({ message: 'Corpo da requisição inválido.' });
    }
    if (err.message.includes('não permitida pela política de CORS')) {
      return res.status(403).json({ message: err.message });
    }
    next(err);
  });

  // Erro global
  app.use((err, req, res, next) => {
    logger.error('Erro global', {
      error: err.message,
      stack: err.stack,
      url: req.url,
      method: req.method,
      userId: req.user ? req.user.userId : 'N/A'
    });

    res.status(err.status || 500).json({
      message: err.message || 'Ocorreu um erro interno no servidor.',
      error: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  });

  // 404
  app.use((req, res) => {
    logger.warn('Rota não encontrada', { url: req.url, method: req.method });
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
        environment: process.env.NODE_ENV || 'development',
        url: `http://localhost:${PORT}`
      });
    });
  } catch (error) {
    logger.error('Falha ao iniciar o servidor', { error: error.message, stack: error.stack });
    process.exit(1);
  }
};

startServer();