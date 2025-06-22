require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const winston = require('winston');
const path = require('path'); // Adicionado para resolver problemas de caminho
const fs = require('fs'); // Adicionado para verificação de arquivos

// Verificação do arquivo auth.js antes das importações
const authMiddlewarePath = path.join(__dirname, 'middlewares', 'auth.js');
console.log('Verificando middleware de autenticação:', {
  path: authMiddlewarePath,
  exists: fs.existsSync(authMiddlewarePath)
});

// Importações corrigidas com path.join
const cardRoutes = require(path.join(__dirname, 'routes', 'cardRoutes'));
const authRoutes = require(path.join(__dirname, 'routes', 'authRoutes')); // Corrigido case sensitivity
const db = require(path.join(__dirname, 'models'));

const app = express();
const PORT = process.env.PORT || 3001;

// [O restante do seu código permanece EXATAMENTE IGUAL...]
// Configuração do Logger, CORS, Helmet, Rate Limiting, etc...
// Todas as outras funções (configureMiddlewares, configureRoutes, etc) permanecem iguais

// Inicialização do Servidor
const startServer = async () => {
  try {
    // Verificação adicional de arquivos
    const requiredFiles = [
      path.join(__dirname, 'middlewares', 'auth.js'),
      path.join(__dirname, 'routes', 'cardRoutes.js'),
      path.join(__dirname, 'routes', 'authRoutes.js'),
      path.join(__dirname, 'models', 'index.js')
    ];
    
    requiredFiles.forEach(file => {
      if (!fs.existsSync(file)) {
        throw new Error(`Arquivo necessário não encontrado: ${file}`);
      }
    });

    await db.sequelize.authenticate();
    logger.info('Conexão com o banco de dados PostgreSQL estabelecida.');
    await db.sequelize.sync({ alter: true });
    logger.info('Modelos sincronizados com o banco de dados.');

    configureMiddlewares();
    configureRoutes();
    configureErrorHandling();

    app.listen(PORT, () => {
      logger.info(`Servidor iniciado na porta ${PORT}`, {
        environment: process.env.NODE_ENV || 'development',
        url: `http://localhost:${PORT}`
      });
    });
  } catch (error) {
    logger.error('Falha ao iniciar o servidor', { 
      error: error.message, 
      stack: error.stack,
      verification: {
        authMiddleware: fs.existsSync(authMiddlewarePath),
        cardRoutes: fs.existsSync(path.join(__dirname, 'routes', 'cardRoutes.js')),
        authRoutes: fs.existsSync(path.join(__dirname, 'routes', 'authRoutes.js'))
      }
    });
    process.exit(1);
  }
};

startServer();