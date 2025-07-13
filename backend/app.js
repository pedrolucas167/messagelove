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

const setupSecurity = (app) => {
    app.set('trust proxy', 1);

    const allowedOrigins = process.env.ALLOWED_ORIGINS
        ? process.env.ALLOWED_ORIGINS.split(';').map(url => url.trim())
        : [
            'http://127.0.0.1:5500',
            `http://localhost:${process.env.DEV_FRONTEND_LOCAL_PORT || '3000'}`,
            process.env.FRONTEND_URL || 'https://messagelove-frontend.vercel.app'
        ];

    const corsOptions = {
        origin: (origin, callback) => {
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                logger.warn(`Origem não permitida: ${origin}`);
                callback(new Error(`Origem ${origin} não permitida pelo CORS`));
            }
        },
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true,
        optionsSuccessStatus: 204
    };

    // ✅ Middleware CORS principal
    app.use(cors(corsOptions));

    // ✅ Suporte explícito para requisições OPTIONS (preflight)
    app.options('*', cors(corsOptions));

    // ✅ Helmet com CSP
    app.use(helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'", "'unsafe-inline'"],
                styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
                fontSrc: ["'self'", 'https://fonts.gstatic.com'],
                imgSrc: ["'self'", 'data:', 'https://messagelove-frontend.vercel.app'],
                connectSrc: ["'self'", ...allowedOrigins],
                objectSrc: ["'none'"],
                upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null
            }
        }
    }));

    app.use(rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 150,
        standardHeaders: true,
        legacyHeaders: false
    }));
};

const setupCoreMiddlewares = (app) => {
    app.use(compression());
    app.use(express.json({ limit: '10kb' }));
    app.use(express.urlencoded({ extended: true }));
};

const connectDatabase = async () => {
    try {
        await db.sequelize.authenticate();
        logger.info('Conexão com o banco de dados estabelecida');

        if (process.env.NODE_ENV === 'development' && process.env.SYNC_DB === 'true') {
            await db.sequelize.sync({ alter: true });
            logger.info('Modelos sincronizados com o banco de dados');
        } else {
            logger.info('Sincronização do banco desativada (use migrações em produção)');
        }
    } catch (error) {
        logger.error('Erro ao conectar com o banco de dados:', {
            error: error.message,
            stack: error.stack
        });
        throw error;
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
    app.use((req, res) => {
        res.status(404).json({ error: 'Rota não encontrada' });
    });

    app.use((err, req, res, next) => {
        logger.error('Erro na aplicação:', {
            error: err.message,
            stack: err.stack,
            path: req.path,
            method: req.method
        });
        res.status(err.status || 500).json({
            error: process.env.NODE_ENV === 'production' ? 'Erro interno do servidor' : err.message
        });
    });
};

const startServer = async () => {
    try {
        setupSecurity(app);
        setupCoreMiddlewares(app);
        await connectDatabase();
        setupRoutes(app);
        setupErrorHandling(app);

        const port = process.env.PORT || 3000;
        const server = app.listen(port, () => {
            logger.info(`Servidor iniciado na porta ${port}`);
        });

        const gracefulShutdown = (signal) => {
            server.close(() => {
                db.sequelize.close().then(() => {
                    logger.info('Servidor e conexão com o banco encerrados');
                    process.exit(0);
                });
            });
        };

        process.on('unhandledRejection', (reason) => {
            logger.error('Unhandled Rejection:', { reason: reason.stack || reason });
            gracefulShutdown('unhandledRejection');
        });

        process.on('uncaughtException', (error) => {
            logger.error('Uncaught Exception:', { error: error.stack });
            gracefulShutdown('uncaughtException');
        });

        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    } catch (error) {
        logger.error('Falha na inicialização do servidor:', {
            message: error.message,
            stack: error.stack
        });
        process.exit(1);
    }
};

startServer();
