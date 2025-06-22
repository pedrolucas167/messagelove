require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');
const logger = require('./config/logger'); 
const db = require('./models');

const cardRoutes = require('./routes/cardRoutes');
const authRoutes = require('./routes/authRoutes'); 

const setupSecurity = (app) => {
    app.set('trust proxy', 1);

    logger.info(`Origens CORS permitidas: [${process.env.ALLOWED_ORIGINS || 'NÃO DEFINIDO, USANDO *'}]`);
    const corsOptions = {
      origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      optionsSuccessStatus: 204
    };
    app.use(cors(corsOptions));

    /* APRIMORADO: Política de Segurança de Conteúdo (CSP) mais flexível e segura */
    app.use(helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'"],
                styleSrc: ["'self'", "https://fonts.googleapis.com", "'unsafe-inline'"],
                fontSrc: ["'self'", "https://fonts.gstatic.com"],
                imgSrc: ["'self'", "data:"],
                connectSrc: ["'self'"],
                objectSrc: ["'none'"],
                upgradeInsecureRequests: [],
            },
        },
    }));

    const limiter = rateLimit({ 
        windowMs: 15 * 60 * 1000,
        max: 150,
        standardHeaders: true,
        legacyHeaders: false,
    });
    app.use(limiter);
};

const setupCoreMiddlewares = (app) => {
    app.use(compression());
    app.use(express.json({ limit: '10kb' }));
    app.use(express.urlencoded({ extended: true }));
};

const connectDatabase = async () => {
    logger.info('Conectando ao banco de dados...');
    await db.sequelize.authenticate();
    logger.info('Conexão com o banco estabelecida com sucesso.');
    
    if (process.env.SYNC_DB === 'true') {
      logger.warn('Sincronizando modelos com o banco (alter: true)...');
      await db.sequelize.sync({ alter: true });
    }
};

const setupRoutes = (app) => {
    app.get('/health', (req, res) => res.status(200).json({ status: 'online', timestamp: new Date() }));
    
    app.use('/api/cards', cardRoutes);
    app.use('/api/auth', authRoutes);
};

const setupErrorHandling = (app) => {
    app.use((req, res, next) => {
        res.status(404).json({ error: 'Rota não encontrada' });
    });

    app.use((err, req, res, next) => {
      logger.error('Erro não tratado na aplicação:', { 
        error: err.message, 
        stack: err.stack,
        path: req.path,
        method: req.method
      });
      const isProduction = process.env.NODE_ENV === 'production';
      res.status(err.status || 500).json({
        error: isProduction ? 'Ocorreu um erro inesperado no servidor.' : err.message
      });
    });
};

const startServer = async () => {
  try {
    const app = express();
    
    setupSecurity(app);
    setupCoreMiddlewares(app);
    await connectDatabase();
    setupRoutes(app);
    setupErrorHandling(app);

    const port = process.env.PORT || 3001;
    const server = app.listen(port, () => {
      logger.info(`Servidor iniciado e ouvindo na porta ${port}`);
    });
    
    const gracefulShutdown = (signal) => {
        logger.warn(`Sinal ${signal} recebido. Desligando o servidor de forma gradual...`);
        server.close(() => {
            logger.info('Servidor HTTP fechado.');
            db.sequelize.close().then(() => {
                logger.info('Conexão com o banco de dados fechada.');
                process.exit(0);
            });
        });
    };

    /* ADICIONADO: Captura de erros não tratados que podem derrubar o processo Node.js */
    process.on('unhandledRejection', (reason, promise) => {
        logger.error('Unhandled Rejection at:', { promise, reason: reason.stack || reason });
        // Aplicações em estados desconhecidos por rejeições de promise devem ser reiniciadas.
        gracefulShutdown('unhandledRejection');
    });
    
    process.on('uncaughtException', (error) => {
        logger.error('Uncaught Exception thrown:', { error: error.stack });
        // 'uncaughtException' indica um erro grave. O processo DEVE ser encerrado.
        gracefulShutdown('uncaughtException');
    });

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    logger.error('Falha crítica na inicialização do servidor:', {
      message: error.message,
      stack: error.stack
    });
    process.exit(1);
  }
};

startServer();