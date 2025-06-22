// /backend/app.js - Versão com correção definitiva de CORS

require('dotenv').config();

// Módulos
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');

// ▼▼▼ PASSO 1: IMPORTAÇÃO DO LOGGER SINGLETON ▼▼▼
// Esta abordagem evita dependências circulares de uma vez por todas.
const logger = require('./config/logger');

// --- VERIFICAÇÃO DE ARQUIVOS (Opcional, mas útil) ---
// Se mantiver, garanta que ele use o logger importado acima.
// (O código de verificação pode ser mantido ou removido para simplificar)

// --- IMPORTAÇÕES LOCAIS ---
const cardRoutes = require('./routes/cardRoutes');
const authRoutes = require('./routes/authroutes');
const db = require('./models');
// --- FIM DAS IMPORTAÇÕES LOCAIS ---

const startServer = async () => {
  try {
    logger.info('Iniciando o servidor...');
    const app = express();

    // ==================================================================
    // ▼▼▼ INÍCIO DA CONFIGURAÇÃO DE CORS E SEGURANÇA (ORDEM CRÍTICA) ▼▼▼

    // 1. Confiar no Proxy do Render
    // Essencial para o rate-limit e logging de IP funcionarem corretamente.
    app.set('trust proxy', 1);

    // 2. Configuração de CORS Definitiva
    // Logamos a variável de ambiente para ter certeza de que está sendo lida.
    logger.info(`Origens permitidas pelo CORS: [${process.env.ALLOWED_ORIGINS || 'NÃO DEFINIDO, USANDO *'}]`);
    const corsOptions = {
      origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // OPTIONS é crucial
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true,
      preflightContinue: false, // Responde diretamente à requisição OPTIONS
      optionsSuccessStatus: 204 // Status padrão para pre-flight bem-sucedido
    };
    
    // O Express lida com a requisição OPTIONS automaticamente com este middleware.
    app.use(cors(corsOptions));
    
    // 3. Middlewares de Segurança e Otimização
    app.use(helmet());
    app.use(compression());
    
    // 4. Middlewares de Parsing (DEPOIS do CORS)
    app.use(express.json({ limit: '10kb' }));
    app.use(express.urlencoded({ extended: true }));

    // 5. Rate Limiting
    const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
    app.use(limiter);

    // ▲▲▲ FIM DA CONFIGURAÇÃO DE CORS E SEGURANÇA ▲▲▲
    // ==================================================================

    // Conexão com o Banco de Dados
    logger.info('Conectando ao banco de dados...');
    await db.sequelize.authenticate();
    logger.info('Conexão com o banco estabelecida com sucesso.');
    
    // Sincronização (se necessário)
    if (process.env.SYNC_DB === 'true') {
      logger.warn('Sincronizando modelos com o banco...');
      await db.sequelize.sync({ alter: true });
    }
    
    // Rotas da Aplicação
    app.get('/health', (req, res) => res.status(200).json({ status: 'online' }));
    app.use('/api/cards', cardRoutes);
    app.use('/api/auth', authRoutes);
    
    // Tratamento de Erro Global (sempre por último)
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

