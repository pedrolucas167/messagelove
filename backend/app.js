// /backend/app.js - Versão com correção definitiva de CORS e Nomes de Arquivo

require('dotenv').config();

// Módulos
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');
const logger = require('./config/logger'); 


const cardRoutes = require('./routes/cardRoutes');
const authRoutes = require('./routes/authRoutes'); 
const db = require('./models');

const startServer = async () => {
  try {
    logger.info('Iniciando o servidor...');
    const app = express();

  

    // 1. Confiar no Proxy do Render
    app.set('trust proxy', 1);

    // 2. Configuração de CORS Definitiva
    logger.info(`Origens permitidas pelo CORS: [${process.env.ALLOWED_ORIGINS || 'NÃO DEFINIDO, USANDO *'}]`);
    const corsOptions = {
      origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      optionsSuccessStatus: 204
    };
    app.use(cors(corsOptions));
    

    app.use(helmet());
    app.use(compression());
    app.use(express.json({ limit: '10kb' }));
    app.use(express.urlencoded({ extended: true }));

    // 4. Rate Limiting
    const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
    app.use(limiter);

    // Conexão com o Banco de Dados
    logger.info('Conectando ao banco de dados...');
    await db.sequelize.authenticate();
    logger.info('Conexão com o banco estabelecida com sucesso.');
    
    if (process.env.SYNC_DB === 'true') {
      logger.warn('Sincronizando modelos com o banco...');
      await db.sequelize.sync({ alter: true });
    }
    
    app.get('/health', (req, res) => res.status(200).json({ status: 'online' }));
    app.use('/api/cards', cardRoutes);
    app.use('/api/auth', authRoutes);
    
    app.use((err, req, res, next) => {
      logger.error('Erro não tratado na aplicação:', { 
        message: err.message, 
        stack: err.stack,
        path: req.path,
        method: req.method
      });
      const isProduction = process.env.NODE_ENV === 'production';
      res.status(err.status || 500).json({
        error: isProduction ? 'Ocorreu um erro inesperado no servidor.' : err.message
      });
    });

    // Iniciar Servidor
    const port = process.env.PORT || 3001;
    app.listen(port, () => {
      logger.info(`Servidor iniciado e ouvindo na porta ${port}`);
    });
    
  } catch (error) {
    logger.error('Falha crítica na inicialização do servidor:', {
      message: error.message,
      stack: error.stack
    });
    process.exit(1);
  }
};

startServer();
