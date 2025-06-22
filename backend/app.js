// /backend/app.js

require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');

// ▼▼▼ CORREÇÃO: Importamos o logger singleton diretamente. ▼▼▼
const logger = require('./config/logger');

// ... (todo o seu código de `verifyEssentialFiles` pode ser removido ou mantido, mas o logger dele também deve ser simplificado)

// --- IMPORTAÇÕES LOCAIS ---
const cardRoutes = require('./routes/cardRoutes');
const authRoutes = require('./routes/authRoutes');
const db = require('./models');

// ... (Suas funções de configuração: configureSecurity, configureMiddlewares, etc.)

// --- INICIALIZAÇÃO DO SERVIDOR ---
const startServer = async () => {
  try {
    // A verificação de arquivos, se mantida, já pode usar o logger importado.
    logger.info("Iniciando verificação de arquivos...");

    const app = express();
    app.set('trust proxy', 1);

    // Suas configurações...
    // configureSecurity(app);
    // configureMiddlewares(app);
    
    logger.info('Conectando ao banco de dados...');
    await db.sequelize.authenticate();
    logger.info('Conexão com o banco estabelecida com sucesso.');
    
    // ...

    // configureRoutes(app);
    // configureErrorHandling(app, logger); // Note que você passa o logger importado

    const port = process.env.PORT || 3001;
    app.listen(port, () => {
      logger.info(`Servidor iniciado na porta ${port}`);
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
