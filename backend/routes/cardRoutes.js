const express = require('express');
const multer = require('multer');
const { nanoid } = require('nanoid');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { body, validationResult } = require('express-validator');
const winston = require('winston');
const path = require('path'); // Adicionado para garantir resolução de caminhos
const authenticate = require(path.join(__dirname, '..', 'middlewares', 'auth')); // Caminho corrigido
const db = require(path.join(__dirname, '..', 'models')); // Caminho corrigido

const router = express.Router();

// Configuração do Logger (mantido igual)
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

// [Restante das configurações (S3, Multer, validações) mantido igual...]

// Adicione esta verificação no início do arquivo para debug
try {
  const authPath = path.join(__dirname, '..', 'middlewares', 'auth.js');
  console.log('Verificando middleware de autenticação:', {
    path: authPath,
    exists: require('fs').existsSync(authPath)
  });
} catch (error) {
  console.error('Erro ao verificar middleware:', error);
}

// [Todas as rotas permanecem exatamente iguais...]

module.exports = router;