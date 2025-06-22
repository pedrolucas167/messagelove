// /backend/routes/cardRoutes.js - Versão com o padrão Singleton e correção do Multer

const express = require('express');
const multer = require('multer');
const { nanoid } = require('nanoid');
const { body, validationResult } = require('express-validator');
const path = require('path');
const { authenticate } = require('../middlewares/auth'); 

const logger = require('../config/logger');
const db = require('../models');
const s3Service = require('../services/s3Service');

const router = express.Router();

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(file.mimetype)) {
            logger.warn(`Tentativa de upload com tipo de arquivo não permitido: ${file.mimetype}`, { ip: req.ip });
            // Cria um erro específico para o Multer
            const error = new Error('Apenas imagens JPEG, PNG ou WebP são permitidas');
            error.code = 'LIMIT_FILE_TYPE';
            return cb(error, false);
        }
        cb(null, true);
    }
});

// Validações
const validateCard = [
  body('de').trim().notEmpty().withMessage('O nome do remetente é obrigatório.'),
  body('para').trim().notEmpty().withMessage('O nome do destinatário é obrigatório.'),
  body('mensagem').trim().notEmpty().withMessage('A mensagem é obrigatória.'),
];

// Handlers
const handleCardCreation = async (req, res, next) => {
  const startTime = Date.now();
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.warn('Validação de criação de cartão falhou', { errors: errors.array() });
      return res.status(400).json({ errors: errors.array() });
    }

    let fotoUrl = null;
    if (req.file) {
      logger.info('Iniciando upload de arquivo para S3', { user: req.user.userId });
      fotoUrl = await s3Service.uploadFile(req.file);
      logger.info('Upload para S3 concluído', { url: fotoUrl });
    }

    const cardData = {
        id: nanoid(10),
        de: req.body.de,
        para: req.body.para,
        mensagem: req.body.mensagem,
        fotoUrl,
        youtubeVideoId: req.body.youtubeVideoId || null,
        youtubeStartTime: req.body.youtubeStartTime || 0,
        userId: req.user.userId,
    };
    
    const newCard = await db.Card.create(cardData);

    logger.info('Cartão criado com sucesso', { cardId: newCard.id, userId: req.user.userId });
    res.status(201).json(newCard);

  } catch (error) {
    logger.error('Falha ao criar cartão', { error: error.message, stack: error.stack });
    next(error);
  }
};

const handleGetMyCards = async (req, res, next) => {
    try {
        const cards = await db.Card.findAll({
            where: { userId: req.user.userId },
            order: [['createdAt', 'DESC']]
        });
        res.json(cards);
    } catch (error) {
        logger.error('Falha ao buscar os cartões do usuário', { userId: req.user.userId, error: error.message });
        next(error);
    }
};

const handleGetCardById = async (req, res, next) => {
    try {
        const card = await db.Card.findByPk(req.params.id);
        if (!card) {
            logger.warn('Cartão não encontrado', { cardId: req.params.id });
            return res.status(404).json({ message: 'Cartão não encontrado' });
        }
        res.json(card);
    } catch (error) {
        logger.error('Falha ao buscar cartão por ID', { cardId: req.params.id, error: error.message });
        next(error);
    }
};


router.post('/', 
  authenticate, 
  upload.single('foto'), 
  validateCard, 
  handleCardCreation
);

router.get('/', authenticate, handleGetMyCards);
router.get('/:id', handleGetCardById);    

module.exports = router;
