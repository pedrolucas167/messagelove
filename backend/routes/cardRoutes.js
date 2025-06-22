const express = require('express');
const multer = require('multer');
const { nanoid } = require('nanoid');
const { body, validationResult } = require('express-validator');
const path = require('path');
const { authenticate } = require('../middlewares');
const db = require('../models');
const logger = require('../config/logger');
const s3Service = require('../services/s3Service'); // Serviço S3 isolado

const router = express.Router();

// Configuração do Multer
const upload = configureMulter();

// Validações
const validateCard = [
  body('de').trim().notEmpty().withMessage('Remetente é obrigatório'),
  body('para').trim().notEmpty().withMessage('Destinatário é obrigatório'),
  body('mensagem').trim().notEmpty().withMessage('Mensagem é obrigatória'),
  body('data').optional().isISO8601().toDate(),
  body('youtubeVideoId').optional().isString(),
  body('youtubeStartTime').optional().isInt({ min: 0 })
];

// Rotas
router.post('/cards', 
  authenticate, 
  upload.single('foto'), 
  validateCard, 
  handleCardCreation
);

router.get('/cards/:id', handleGetCard);

// Funções auxiliares
function configureMulter() {
  const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype)) {
      logger.warn(`Tipo de arquivo não permitido: ${file.mimetype}`);
      return cb(new Error('Apenas imagens JPEG, PNG ou WebP são permitidas'), false);
    }
    cb(null, true);
  };

  return multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter
  });
}

async function handleCardCreation(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.warn('Erros de validação', { errors: errors.array() });
      return res.status(400).json({ errors: errors.array() });
    }

    const { body, file, user } = req;
    const fotoUrl = file ? await s3Service.uploadFile(file) : null;

    const cardData = {
      id: nanoid(10),
      ...body,
      fotoUrl,
      userId: user.userId
    };

    const newCard = await db.Card.create(cardData);
    
    logger.info(`Cartão criado: ${newCard.id}`, { userId: user.userId });
    
    res.status(201).json({
      success: true,
      cardId: newCard.id,
      fotoUrl,
      mensagem: newCard.mensagem
    });

  } catch (error) {
    logger.error('Erro ao criar cartão', { 
      error: error.message, 
      stack: error.stack 
    });
    next(error);
  }
}

async function handleGetCard(req, res, next) {
  try {
    const card = await db.Card.findByPk(req.params.id);
    if (!card) {
      logger.warn('Cartão não encontrado', { cardId: req.params.id });
      return res.status(404).json({ message: 'Cartão não encontrado' });
    }
    
    logger.info(`Cartão acessado: ${card.id}`);
    res.json(card);
    
  } catch (error) {
    logger.error('Erro ao buscar cartão', { 
      error: error.message,
      cardId: req.params.id
    });
    next(error);
  }
}

module.exports = router;