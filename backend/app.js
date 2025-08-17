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

class App {
  constructor() {
    this.app = express();
    this.REQUIRED_ENV = ['DATABASE_URL', 'JWT_SECRET', 'ALLOWED_ORIGINS'];
    this.DEFAULT_PORT = 3000;
    this.RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutos
    this.RATE_LIMIT_MAX = 150;
    
    this.startServer();
  }

  get allowedOrigins() {
    return process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(';').map(url => url.trim())
      : [
          'http://127.0.0.1:5500',
          `http://localhost:${process.env.DEV_FRONTEND_LOCAL_PORT || '3000'}`,
          'https://messagelove-frontend.vercel.app',
          'https://messagelove-backend.onrender.com'
        ];
  }

  validateEnv() {
    const missing = this.REQUIRED_ENV.filter(env => !process.env[env]);
    if (missing.length) {
      logger.error('Variáveis de ambiente ausentes', { missing });
      throw new Error(`Variáveis necessárias não definidas: ${missing.join(', ')}`);
    }
  }

  setupCors() {
    const corsOptions = {
      origin: (origin, callback) => {
        // Permite requisições sem origin (como mobile apps ou curl)
        if (!origin) return callback(null, true);
        
        // Verifica se a origem está na lista de permitidas
        const originAllowed = this.allowedOrigins.some(allowed => 
          origin === allowed || origin.startsWith(allowed)
        );

        if (originAllowed) {
          return callback(null, true);
        }
        
        logger.warn('Origem não permitida', { 
          origin, 
          allowedOrigins: this.allowedOrigins 
        });
        callback(new Error(`Origem ${origin} não permitida pelo CORS`));
      },
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'x-access-token'],
      credentials: true,
      optionsSuccessStatus: 204,
      maxAge: 86400 // Cache de 24h para preflight
    };

    // Aplica CORS para todas as rotas
    this.app.use(cors(corsOptions));
    
    // Middleware adicional para headers CORS explícitos
    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-access-token');
      res.header('Access-Control-Allow-Credentials', 'true');
      next();
    });

    // Habilita preflight para todas as rotas
    this.app.options('*', cors(corsOptions));
  }

  setupSecurity() {
    this.app.set('trust proxy', 1);
    
    this.app.use(
      helmet({
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
            fontSrc: ["'self'", 'https://fonts.gstatic.com'],
            imgSrc: ["'self'", 'data:', 'https://messagelove-frontend.vercel.app'],
            connectSrc: ["'self'", ...this.allowedOrigins],
            objectSrc: ["'none'"],
            upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
          },
        },
        crossOriginResourcePolicy: { policy: "cross-origin" }
      })
    );

    this.app.use(
      rateLimit({
        windowMs: this.RATE_LIMIT_WINDOW_MS,
        max: this.RATE_LIMIT_MAX,
        standardHeaders: true,
        legacyHeaders: false,
        skip: (req) => req.ip === '::ffff:127.0.0.1'
      })
    );
  }

  setupCoreMiddlewares() {
    this.app.use(compression());
    this.app.use(express.json({ limit: '50kb' }));
    this.app.use(express.urlencoded({ extended: true }));
    
    // Middleware para log de requisições
    this.app.use((req, res, next) => {
      logger.info(`${req.method} ${req.path}`, {
        ip: req.ip,
        origin: req.headers.origin,
        userAgent: req.headers['user-agent']
      });
      next();
    });
  }

  async connectDatabase() {
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
      logger.error('Erro ao conectar com o banco de dados', {
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  setupRoutes() {
    this.app.get('/health', (req, res) =>
      res.status(200).json({
        status: 'online',
        timestamp: new Date().toISOString(),
        allowedOrigins: this.allowedOrigins,
        environment: process.env.NODE_ENV
      })
    );

    this.app.use('/api/cards', cardRoutes);
    this.app.use('/api/auth', authRoutes);
  }

  setupErrorHandling() {
    this.app.use((req, res) => {
      res.status(404).json({ 
        error: 'Rota não encontrada',
        path: req.path,
        method: req.method
      });
    });

    this.app.use((err, req, res, next) => {
      logger.error('Erro na aplicação', {
        error: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method
      });
      
      if (err.message.includes('CORS')) {
        return res.status(403).json({
          error: 'Acesso não autorizado',
          details: process.env.NODE_ENV === 'development' ? {
            message: err.message,
            allowedOrigins: this.allowedOrigins,
            receivedOrigin: req.headers.origin
          } : undefined
        });
      }

      res.status(err.status || 500).json({
        error: process.env.NODE_ENV === 'production' 
          ? 'Erro interno do servidor' 
          : err.message
      });
    });
  }

  setupGracefulShutdown(server) {
    const gracefulShutdown = (signal) => {
      logger.info(`Recebido sinal ${signal} para encerramento`);
      server.close(() => {
        db.sequelize.close()
          .then(() => {
            logger.info('Servidor e conexão com o banco encerrados');
            process.exit(0);
          })
          .catch(err => {
            logger.error('Erro ao encerrar conexão com o banco', {
              error: err.message
            });
            process.exit(1);
          });
      });
    };

    process.on('unhandledRejection', (reason) => {
      logger.error('Unhandled Rejection', { reason: reason.stack || reason });
      gracefulShutdown('unhandledRejection');
    });

    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception', { error: error.stack });
      gracefulShutdown('uncaughtException');
    });

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  }

  async startServer() {
    try {
      this.validateEnv();
      this.setupCors();
      this.setupSecurity();
      this.setupCoreMiddlewares();
      await this.connectDatabase();
      this.setupRoutes();
      this.setupErrorHandling();

      const port = process.env.PORT || this.DEFAULT_PORT;
      const server = this.app.listen(port, () => {
        logger.info(`Servidor iniciado na porta ${port}`, {
          environment: process.env.NODE_ENV,
          allowedOrigins: this.allowedOrigins
        });
      });

      this.setupGracefulShutdown(server);
    } catch (error) {
      logger.error('Falha na inicialização do servidor', {
        message: error.message,
        stack: error.stack
      });
      process.exit(1);
    }
  }
}

new App();