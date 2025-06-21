const express = require('express');
const multer = require('multer');
const { nanoid } = require('nanoid');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { body, validationResult } = require('express-validator');
const winston = require('winston');
const authenticate = require('../middlewares/auth');
const db = require('../models');

const router = express.Router();

// Configuração do Logger
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

// Configuração do AWS S3
const s3Client = new S3Client({ region: process.env.AWS_REGION });

// Configuração do Multer para upload
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.mimetype)) {
      logger.warn('Tipo de arquivo não permitido', { mimetype: file.mimetype });
      return cb(new Error('Apenas imagens JPEG, PNG ou WebP são permitidas.'));
    }
    cb(null, true);
  }
});

// Validações para POST /cards
const validateCard = [
  body('de').trim().notEmpty().withMessage('O campo "Remetente" é obrigatório.'),
  body('para').trim().notEmpty().withMessage('O campo "Destinatário" é obrigatório.'),
  body('mensagem').trim().notEmpty().withMessage('O campo "Mensagem" é obrigatório.'),
  body('data').optional().isISO8601().toDate().withMessage('Data inválida.'),
  body('youtubeVideoId').optional().trim().matches(/^[0-9A-Za-z_-]{10,}$/).withMessage('ID do vídeo do YouTube inválido.'),
  body('youtubeStartTime').optional().isInt({ min: 0 }).withMessage('Tempo inicial do vídeo deve ser um número inteiro não negativo.'),
];

// Rota para CRIAR um Cartão (protegida por autenticação)
router.post('/cards', authenticate, upload.single('foto'), validateCard, async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.warn('Erro de validação na criação de cartão', { errors: errors.array() });
      return res.status(400).json({ errors: errors.array() });
    }

    const { de, para, mensagem, data, youtubeVideoId, youtubeStartTime } = req.body;
    const foto = req.file;
    let fotoUrl = null;

    // Upload para S3, se houver imagem
    if (foto) {
      logger.info('Iniciando upload para o S3', { originalname: foto.originalname });
      const extension = foto.originalname.split('.').pop();
      const fotoKey = `cards/${nanoid(12)}.${extension}`;

      const command = new PutObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: fotoKey,
        Body: foto.buffer,
        ContentType: foto.mimetype,
      });

      await s3Client.send(command);
      fotoUrl = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fotoKey}`;
      logger.info('Foto enviada para o S3', { fotoUrl });
    }

    // Criação no banco de dados
    const newCard = await db.Card.create({
      id: nanoid(10),
      de,
      para,
      mensagem,
      data: data || null,
      youtubeVideoId: youtubeVideoId || null,
      youtubeStartTime: youtubeStartTime ? parseInt(youtubeStartTime, 10) : 0,
      fotoUrl,
      userId: req.user.userId, // Associado ao usuário autenticado
    });

    logger.info('Cartão criado com sucesso', { cardId: newCard.id, userId: req.user.userId });
    res.status(201).json({
      success: true,
      cardId: newCard.id,
      fotoUrl,
      mensagem: newCard.mensagem,
      data: newCard.data,
    });
  } catch (error) {
    logger.error('Erro ao criar cartão', { error: error.message, stack: error.stack });
    next(error);
  }
});

// Rota para BUSCAR um Cartão por ID (pública)
router.get('/cards/:id', async (req, res, next) => {
  try {
    const card = await db.Card.findByPk(req.params.id);
    if (!card) {
      logger.warn('Cartão não encontrado', { cardId: req.params.id });
      return res.status(404).json({ message: 'Cartão não encontrado.' });
    }
    logger.info('Cartão recuperado', { cardId: card.id });
    res.status(200).json(card);
  } catch (error) {
    logger.error('Erro ao buscar cartão', { error: error.message, stack: error.stack });
    next(error);
  }
});

module.exports = router;