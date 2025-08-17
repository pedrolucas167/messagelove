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

const REQUIRED_ENV = ['DATABASE_URL', 'JWT_SECRET', 'ALLOWED_ORIGINS'];
const DEFAULT_PORT = 3000;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutos
const RATE_LIMIT_MAX = 150;

const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(';').map((url) => url.trim())
    : [
          'http://127.0.0.1:5500',
          `http://localhost:${process.env.DEV_FRONTEND_LOCAL_PORT || '3000'}`,
          process.env.FRONTEND_URL || 'https://messagelove-frontend.vercel.app',
      ];

// Validação de variáveis de ambiente
const validateEnv = () => {
    const missing = REQUIRED_ENV.filter((env) => !process.env[env]);
    if (missing.length) {
        logger.error('Variáveis de ambiente ausentes', { missing });
        throw new Error(`Variáveis necessárias não definidas: ${missing.join(', ')}`);
    }
};

const setupSecurity = (app) => {
    app.set('trust proxy', 1);

    const corsOptions = {
        origin: (origin, callback) => {
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                logger.warn('Origem não permitida', { origin, allowedOrigins });
                callback(new Error(`Origem ${origin} não permitida pelo CORS`));
            }
        },
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true,
        optionsSuccessStatus: 204,
    };

    app.use(cors(corsOptions));
    app.options('*', cors(corsOptions));

    app.use(
        helmet({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    scriptSrc: ["'self'", "'unsafe-inline'"],
                    styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
                    fontSrc: ["'self'", 'https://fonts.gstatic.com'],
                    imgSrc: ["'self'", 'data:', 'https://messagelove-frontend.vercel.app'],
                    connectSrc: ["'self'", ...allowedOrigins],
                    objectSrc: ["'none'"],
                    upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
                },
            },
        })
    );

    app.use(
        rateLimit({
            windowMs: RATE_LIMIT_WINDOW_MS,
            max: RATE_LIMIT_MAX,
            standardHeaders: true,
            legacyHeaders: false,
        })
    );
};

const setupCoreMiddlewares = (app) => {
    app.use(compression());
    app.use(express.json({ limit: '50kb' }));
    app.use(express.urlencoded({ extended: true }));
};

const connectDatabase = async () => {
    try {
        await db.sequelize.authenticate();
        logger.info('Conexão com o banco de dados estabelecida', { level: 'info' });

        if (process.env.NODE_ENV === 'development' && process.env.SYNC_DB === 'true') {
            await db.sequelize.sync({ alter: true });
            logger.info('Modelos sincronizados com o banco de dados', { level: 'info' });
        } else {
            logger.info('Sincronização do banco desativada (use migrações em produção)', { level: 'info' });
        }
    } catch (error) {
        logger.error('Erro ao conectar com o banco de dados', {
            error: error.message,
            stack: error.stack,
            level: 'error',
        });
        throw error;
    }
};

const setupRoutes = (app) => {
    app.get('/health', (req, res) =>
        res.status(200).json({
            status: 'online',
            timestamp: new Date().toISOString(),
            allowedOrigins, // Agora allowedOrigins está definido
        })
    );

    app.use('/api/cards', cardRoutes);
    app.use('/api/auth', authRoutes);
};

const setupErrorHandling = (app) => {
    app.use((req, res) => {
        res.status(404).json({ error: 'Rota não encontrada', path: req.path });
    });

    app.use((err, req, res, next) => {
        logger.error('Erro na aplicação', {
            error: err.message,
            stack: err.stack,
            path: req.path,
            method: req.method,
            level: 'error',
        });
        res.status(err.status || 500).json({
            error: process.env.NODE_ENV === 'production' ? 'Erro interno do servidor' : err.message,
        });
    });
};

const startServer = async () => {
    try {
        validateEnv();
        setupSecurity(app);
        setupCoreMiddlewares(app);
        await connectDatabase();
        setupRoutes(app);
        setupErrorHandling(app);

        const port = process.env.PORT || DEFAULT_PORT;
        const server = app.listen(port, () => {
            logger.info(`Servidor iniciado na porta ${port}`, { level: 'info' });
        });

        const gracefulShutdown = (signal) => {
            logger.info(`Recebido sinal ${signal} para encerramento`, { level: 'info' });
            server.close(() => {
                db.sequelize
                    .close()
                    .then(() => {
                        logger.info('Servidor e conexão com o banco encerrados', { level: 'info' });
                        process.exit(0);
                    })
                    .catch((err) => {
                        logger.error('Erro ao encerrar conexão com o banco', {
                            error: err.message,
                            level: 'error',
                        });
                        process.exit(1);
                    });
            });
        };

        process.on('unhandledRejection', (reason) => {
            logger.error('Unhandled Rejection', { reason: reason.stack || reason, level: 'error' });
            gracefulShutdown('unhandledRejection');
        });

        process.on('uncaughtException', (error) => {
            logger.error('Uncaught Exception', { error: error.stack, level: 'error' });
            gracefulShutdown('uncaughtException');
        });

        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    } catch (error) {
        logger.error('Falha na inicialização do servidor', {
            message: error.message,
            stack: error.stack,
            level: 'error',
        });
        process.exit(1);
    }
};

startServer();