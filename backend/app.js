require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const logger = require('./config/logger');
const db = require('./models');
const cardRoutes = require('./routes/cardRoutes');
const authRoutes = require('./routes/authRoutes');

const app = express();

// Configuração de CORS com validação dinâmica
const allowedOrigins = [
  'https://messagelove-frontend.vercel.app',
  'http://localhost:3000', // Para desenvolvimento
];

const corsOptions = {
  origin: (origin, callback) => {
    // Permitir requisições sem origem (ex.: Postman) ou origens permitidas
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn(`CORS bloqueado para origem: ${origin}`);
      callback(new Error('Não permitido pelo CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 204,
  maxAge: 86400, // Cache de 24h para preflight
};

// Middlewares críticos
app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Responde a preflight para todas as rotas

app.use(helmet());
app.use(compression());
app.use(express.json({ limit: '50kb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 150,
  message: 'Muitas requisições, tente novamente mais tarde',
}));

// Rotas
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'API MessageLove - Online',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
});

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    cors: 'enabled',
    allowedOrigins: allowedOrigins,
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/cards', cardRoutes);

// Tratamento de erros
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint não encontrado' });
});

app.use((err, req, res, next) => {
  logger.error(`Erro no servidor: ${err.message}`, { 
    stack: err.stack, 
    path: req.path, 
    method: req.method 
  });
  res.status(500).json({ 
    error: process.env.NODE_ENV === 'production' 
      ? 'Erro interno' 
      : err.message 
  });
});

// Conexão com o banco e inicialização
const PORT = process.env.PORT || 3000;

db.sequelize.authenticate()
  .then(() => {
    logger.info('Conexão com o banco estabelecida');
    if (process.env.NODE_ENV === 'development') {
      db.sequelize.sync({ alter: true });
    }
    
    app.listen(PORT, () => {
      logger.info(`Servidor rodando na porta ${PORT}`);
    });
  })
  .catch(err => {
    logger.error('Falha ao conectar ao banco:', err);
    process.exit(1);
  });

process.on('SIGTERM', () => {
  logger.info('Recebido SIGTERM. Encerrando conexão com o banco...');
  db.sequelize.close()
    .then(() => {
      logger.info('Conexão com o banco encerrada');
      process.exit(0);
    })
    .catch(err => {
      logger.error('Erro ao encerrar conexão com o banco:', err);
      process.exit(1);
    });
});