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

    // Configurar origens permitidas
    const allowedOrigins = process.env.ALLOWED_ORIGINS
        ? process.env.ALLOWED_ORIGINS.split(';').map(url => url.trim())
        : [
            'http://127.0.0.1:5500', // Desenvolvimento local (Live Server)
            `http://localhost:${process.env.DEV_FRONTEND_LOCAL_PORT || '3000'}`, // Frontend local
            process.env.FRONTEND_URL || 'https://messagelove-frontend.vercel.app', // Frontend em produção
        ];
    logger.info(`Origens CORS permitidas: [${allowedOrigins.join(', ')}]`);

    const corsOptions = {
        origin: (origin, callback) => {
            // Permitir requisições sem origem (ex.: Postman) ou origens na lista
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, origin || '*');
            } else {
                logger.warn(`Origem não permitida: ${origin}`);
                callback(new Error(`Origem ${origin} não permitida pelo CORS`));
            }
        },
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true, // Suporte a tokens/cookies
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
                connectSrc: ["'self'", process.env.FRONTEND_URL, `http://localhost:${process.env.DEV_FRONTEND_LOCAL_PORT || '3000'}`],
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
    app.get('/health', (req, res) => res.status(200).json({ 
        status: 'online', 
        timestamp: new Date(), 
        allowedOrigins: process.env.ALLOWED_ORIGINS?.split(';') || [
            'http://127.0.0.1:5500',
            `http://localhost:${process.env.DEV_FRONTEND_LOCAL_PORT || '3000'}`,
            process.env.FRONTEND_URL
        ]
    }));
    
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

    process.on('unhandledRejection', (reason, promise) => {
        logger.error('Unhandled Rejection at:', { promise, reason: reason.stack || reason });
        gracefulShutdown('unhandledRejection');
    });
    
    process.on('uncaughtException', (error) => {
        logger.error('Uncaught Exception thrown:', { error: error.stack });
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