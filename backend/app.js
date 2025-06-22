require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const winston = require('winston');
const path = require('path');
const fs = require('fs');


const verifyFiles = () => {
  const requiredPaths = {
    middlewares: path.join(__dirname, 'middlewares', 'auth.js'),
    cardRoutes: path.join(__dirname, 'routes', 'cardRoutes.js'),
    authRoutes: path.join(__dirname, 'routes', 'authRoutes.js'),
    models: path.join(__dirname, 'models', 'index.js')
  };

  console.log('Verificando estrutura de arquivos:');
  Object.entries(requiredPaths).forEach(([name, filePath]) => {
    console.log(`- ${name}: ${filePath}`, fs.existsSync(filePath) ? '✅' : '❌');
  });
};
verifyFiles();

// Importações com fallback para debug
let cardRoutes, authRoutes, db;
try {
  cardRoutes = require(path.join(__dirname, 'routes', 'cardRoutes'));
  authRoutes = require(path.join(__dirname, 'routes', 'authRoutes'));
  db = require(path.join(__dirname, 'models'));
} catch (importError) {
  console.error('Erro nas importações:', {
    message: importError.message,
    stack: importError.stack,
    code: importError.code
  });
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3001;

// Configuração do Logger (com verificação de diretório de logs)
const logDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: path.join(logDir, 'error.log'), level: 'error' }),
    new winston.transports.File({ filename: path.join(logDir, 'combined.log') })
  ]
});

// [Restante das configurações permanecem iguais...]

// Inicialização do Servidor com verificação adicional
const startServer = async () => {
  try {
    // Verificação final antes de iniciar
    const requiredFiles = [
      path.join(__dirname, 'middlewares', 'auth.js'),
      path.join(__dirname, 'routes', 'cardRoutes.js'),
      path.join(__dirname, 'routes', 'authRoutes.js'),
      path.join(__dirname, 'models', 'index.js')
    ];

    requiredFiles.forEach(file => {
      if (!fs.existsSync(file)) {
        const error = new Error(`Arquivo essencial não encontrado: ${file}`);
        logger.error(error.message, { missingFile: file });
        throw error;
      }
    });

    await db.sequelize.authenticate();
    logger.info('Conexão com o banco de dados estabelecida');

    await db.sequelize.sync({ alter: true });
    logger.info('Modelos sincronizados');

    configureMiddlewares();
    configureRoutes();
    configureErrorHandling();

    app.listen(PORT, () => {
      logger.info(`Servidor operacional na porta ${PORT}`, {
        environment: process.env.NODE_ENV || 'development',
        nodeVersion: process.version
      });
    });

  } catch (error) {
    logger.error('Falha crítica na inicialização', {
      error: {
        message: error.message,
        stack: error.stack,
        code: error.code
      },
      system: {
        paths: {
          middlewares: path.join(__dirname, 'middlewares'),
          routes: path.join(__dirname, 'routes'),
          models: path.join(__dirname, 'models')
        },
        files: {
          middlewares: fs.readdirSync(path.join(__dirname, 'middlewares')).join(', '),
          routes: fs.readdirSync(path.join(__dirname, 'routes')).join(', ')
        }
      }
    });
    process.exit(1);
  }
};

startServer();