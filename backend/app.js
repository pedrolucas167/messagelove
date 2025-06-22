require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');
const winston = require('winston');


const initLogger = winston.createLogger({
  level: 'info',
  format: winston.format.simple(),
  transports: [new winston.transports.Console()]
});

// Verificação de arquivos essenciais
const verifyEssentialFiles = () => {
  const essentialFiles = {
    middlewares: ['auth.js'],
    routes: ['cardroutes.js', 'authroutes.js'],
    models: ['index.js']
  };

  initLogger.info('Verificando estrutura do projeto:');
  
  let allFilesExist = true;
  
  for (const [dir, files] of Object.entries(essentialFiles)) {
    const dirPath = path.join(__dirname, dir);
    
    if (!fs.existsSync(dirPath)) {
      initLogger.error(`Diretório ${dir} não encontrado`);
      allFilesExist = false;
      continue;
    }

    files.forEach(file => {
      const filePath = path.join(dirPath, file);
      const exists = fs.existsSync(filePath);
      initLogger[exists ? 'info' : 'error'](
        `${exists ? '✓' : '✗'} ${dir}/${file}`
      );
      if (!exists) allFilesExist = false;
    });
  }

  if (!allFilesExist) {
    initLogger.error('Arquivos essenciais faltando - encerrando aplicação');
    process.exit(1);
  }
};

verifyEssentialFiles();

// Importações após verificação
const cardRoutes = require('./routes/cardroutes');
const authRoutes = require('./routes/authroutes');
const db = require('./models');

// Configuração completa do logger
const configureLogger = () => {
  const logDir = path.join(__dirname, 'logs');
  
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
  }

  return winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.errors({ stack: true }),
      winston.format.json()
    ),
    transports: [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        )
      }),
      new winston.transports.File({
        filename: path.join(logDir, 'error.log'),
        level: 'error',
        maxsize: 5 * 1024 * 1024 // 5MB
      }),
      new winston.transports.File({
        filename: path.join(logDir, 'combined.log'),
        maxsize: 10 * 1024 * 1024 // 10MB
      })
    ]
  });
};

const logger = configureLogger();

// Configurações de Segurança
const configureSecurity = (app) => {
  app.use(helmet());
  app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));
};

// Configuração do Rate Limiting
const configureRateLimiting = () => {
  return {
    general: rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutos
      max: 100,
      message: 'Muitas requisições deste IP, tente novamente mais tarde'
    }),
    auth: rateLimit({
      windowMs: 60 * 60 * 1000, // 1 hora
      max: 10,
      message: 'Muitas tentativas de login, tente novamente mais tarde'
    })
  };
};

// Middlewares da Aplicação
const configureMiddlewares = (app) => {
  app.use(express.json({ limit: '10kb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(compression());
  
  const limiter = configureRateLimiting();
  app.use(limiter.general);
  app.use('/api/auth', limiter.auth);
};

// Rotas da Aplicação
const configureRoutes = (app) => {
  app.get('/health', (req, res) => {
    res.status(200).json({
      status: 'online',
      timestamp: new Date().toISOString()
    });
  });

  app.use('/api/cards', cardRoutes);
  app.use('/api/auth', authRoutes);
};

// Tratamento de Erros
const configureErrorHandling = (app) => {
  app.use((err, req, res, next) => {
    logger.error('Erro não tratado:', {
      message: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method
    });

    res.status(err.status || 500).json({
      error: process.env.NODE_ENV === 'production'
        ? 'Ocorreu um erro no servidor'
        : err.message
    });
  });

  app.use((req, res) => {
    res.status(404).json({ message: 'Rota não encontrada' });
  });
};

// Inicialização do Servidor
const startServer = async () => {
  const app = express();
  
  try {
    logger.info('Iniciando configuração do servidor...');
    
    // Configurações básicas
    configureSecurity(app);
    configureMiddlewares(app);
    
    // Conexão com o banco de dados
    logger.info('Conectando ao banco de dados...');
    await db.sequelize.authenticate();
    logger.info('Conexão com o banco estabelecida com sucesso');
    
    // Sincronização dos modelos
    if (process.env.SYNC_DB === 'true') {
      logger.warn('Sincronizando modelos com o banco de dados (alter: true)');
      await db.sequelize.sync({ alter: true });
    }
    
    // Configuração final
    configureRoutes(app);
    configureErrorHandling(app);
    
    // Iniciar servidor
    const port = process.env.PORT || 3001;
    app.listen(port, () => {
      logger.info(`Servidor iniciado na porta ${port}`, {
        environment: process.env.NODE_ENV || 'development',
        node_version: process.version
      });
    });
    
  } catch (error) {
    logger.error('Falha na inicialização do servidor:', {
      error: error.message,
      stack: error.stack
    });
    process.exit(1);
  }
};

startServer();