
require('dotenv').config();

// Módulos principais e de terceiros
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');
const winston = require('winston');

// --- VERIFICADOR DE ARQUIVOS ---
// Esta função é executada antes de qualquer outra coisa para garantir a integridade do ambiente.

const verifyEssentialFiles = () => {
  // Logger temporário usado apenas durante a verificação inicial
  const initLogger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
    transports: [new winston.transports.Console()]
  });

  // CORRIGIDO: Nomes dos arquivos usando camelCase para corresponder à estrutura real.
  const essentialFiles = {
    middlewares: ['auth.js'],
    routes: ['cardRoutes.js', 'authRoutes.js'],
    models: ['index.js', 'users.js', 'card.js']
  };

  initLogger.info('Verificando estrutura de arquivos do projeto...');
  
  let allFilesExist = true;
  
  for (const [dir, files] of Object.entries(essentialFiles)) {
    for (const file of files) {
      const filePath = path.join(__dirname, dir, file);
      if (fs.existsSync(filePath)) {
        initLogger.info(`✓ ${dir}/${file}`);
      } else {
        initLogger.error(`✗ ${dir}/${file} (NÃO ENCONTRADO)`);
        allFilesExist = false;
      }
    }
  }

  if (!allFilesExist) {
    // Lança um erro para ser capturado pelo bloco try/catch principal, em vez de sair abruptamente.
    throw new Error('Arquivos essenciais faltando. Verifique os logs acima para detalhes.');
  }

  initLogger.info('Todos os arquivos essenciais foram encontrados.');
};


// --- IMPORTAÇÕES LOCAIS ---
// CORRIGIDO: `require` usando os nomes corretos com camelCase.
const cardRoutes = require('./routes/cardRoutes');
const authRoutes = require('./routes/authRoutes');
const db = require('./models');


// --- MÓDULOS DE CONFIGURAÇÃO ---

const configureLogger = () => {
  const logDir = path.join(__dirname, 'logs');
  if (!fs.existsSync(logDir)) fs.mkdirSync(logDir);

  return winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(winston.format.timestamp(), winston.format.errors({ stack: true }), winston.format.json()),
    transports: [
      new winston.transports.Console({ format: winston.format.combine(winston.format.colorize(), winston.format.simple()) }),
      new winston.transports.File({ filename: path.join(logDir, 'error.log'), level: 'error' }),
      new winston.transports.File({ filename: path.join(logDir, 'combined.log') })
    ]
  });
};

const configureSecurity = (app) => {
  app.use(helmet());
  app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));
};

const configureRateLimiting = () => ({
  general: rateLimit({ windowMs: 15 * 60 * 1000, max: 100, message: 'Muitas requisições deste IP, tente novamente.' }),
  auth: rateLimit({ windowMs: 60 * 60 * 1000, max: 10, message: 'Muitas tentativas de autenticação, tente novamente.' })
});

const configureMiddlewares = (app) => {
  app.use(express.json({ limit: '10kb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(compression());
  
  const limiter = configureRateLimiting();
  app.use(limiter.general);
  app.use('/api/auth', limiter.auth);
};

const configureRoutes = (app) => {
  app.get('/health', (req, res) => res.status(200).json({ status: 'online', timestamp: new Date() }));
  app.use('/api/cards', cardRoutes);
  app.use('/api/auth', authRoutes);
};

const configureErrorHandling = (app, logger) => {
  // Handler para rotas não encontradas (404)
  app.use((req, res, next) => {
    res.status(404).json({ message: 'Rota não encontrada' });
  });

  // Handler de erro global
  app.use((err, req, res, next) => {
    logger.error(err.message, { stack: err.stack, path: req.path });
    const isProduction = process.env.NODE_ENV === 'production';
    res.status(err.status || 500).json({
      error: isProduction ? 'Ocorreu um erro inesperado no servidor.' : err.message
    });
  });
};


// --- INICIALIZAÇÃO DO SERVIDOR ---

const startServer = async () => {
  let logger;
  try {
    // 1. Verificação crítica de arquivos antes de qualquer outra coisa.
    verifyEssentialFiles();
    
    // 2. Agora que sabemos que o ambiente está ok, configuramos o logger principal.
    logger = configureLogger();
    
    const app = express();
    
    // 3. Aplica todas as configurações
    configureSecurity(app);
    configureMiddlewares(app);
    
    logger.info('Conectando ao banco de dados...');
    await db.sequelize.authenticate();
    logger.info('Conexão com o banco estabelecida com sucesso.');
    
    if (process.env.SYNC_DB === 'true') {
      logger.warn('Sincronizando modelos com o banco (alter: true)...');
      await db.sequelize.sync({ alter: true });
    }
    
    configureRoutes(app);
    configureErrorHandling(app, logger); // Passa o logger para o error handler
    
    // 4. Inicia o servidor
    const port = process.env.PORT || 3001;
    app.listen(port, () => {
      logger.info(`Servidor iniciado na porta ${port}`, { environment: process.env.NODE_ENV || 'development' });
    });
    
  } catch (error) {
    // Se o logger principal falhou ao iniciar, usamos um logger de emergência.
    const emergencyLogger = logger || winston.createLogger({ transports: [new winston.transports.Console()] });
    emergencyLogger.error('Falha crítica na inicialização do servidor:', {
      message: error.message,
      stack: error.stack
    });
    process.exit(1);
  }
};

startServer();