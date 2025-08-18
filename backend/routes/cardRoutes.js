const express = require('express');
const multer = require('multer');
const { checkSchema, matchedData, validationResult } = require('express-validator');
const authenticate = require('../middlewares/auth');
const { createCard, getCardById } = require('../services/cardService');
const logger = require('../config/logger');
const { Card } = require('../models');
const rateLimit = require('express-rate-limit');

const router = express.Router();

const cardLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Muitas requisições. Por favor, tente novamente mais tarde.'
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { 
    fileSize: 5 * 1024 * 1024,
    files: 1
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype)) {
      const error = new Error('Tipo de arquivo não suportado. Apenas JPEG, PNG ou WebP são permitidos.');
      error.code = 'LIMIT_FILE_TYPE';
      return cb(error, false);
    }
    cb(null, true);
  }
});

const validationSchemas = {
  createCard: {
    de: {
      trim: true,
      notEmpty: true,
      errorMessage: 'O nome do remetente é obrigatório',
      isLength: {
        options: { max: 100 },
        errorMessage: 'O nome do remetente deve ter no máximo 100 caracteres'
      }
    },
    para: {
      trim: true,
      notEmpty: true,
      errorMessage: 'O nome do destinatário é obrigatório',
      isLength: {
        options: { max: 100 },
        errorMessage: 'O nome do destinatário deve ter no máximo 100 caracteres'
      }
    },
    mensagem: {
      trim: true,
      notEmpty: true,
      errorMessage: 'A mensagem é obrigatória',
      isLength: {
        options: { max: 1000 },
        errorMessage: 'A mensagem deve ter no máximo 1000 caracteres'
      }
    },
    youtubeVideoId: {
      optional: true,
      trim: true,
      isLength: {
        options: { max: 20 },
        errorMessage: 'O ID do vídeo do YouTube deve ter no máximo 20 caracteres'
      }
    },
    youtubeStartTime: {
      optional: true,
      isInt: {
        options: { min: 0 },
        errorMessage: 'O tempo inicial do vídeo deve ser um número positivo'
      },
      toInt: true
    }
  }
};

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.warn('Erros de validação', {
      route: req.path,
      errors: errors.array(),
      userId: req.user?.id,
      ip: req.ip
    });
    return res.status(400).json({
      success: false,
      errors: errors.array().map(err => ({
        param: err.param,
        message: err.msg
      }))
    });
  }
  next();
};

const handleUploadError = (err, req, res, next) => {
  if (err.code === 'LIMIT_FILE_TYPE') {
    logger.warn('Erro no upload de arquivo', {
      error: err.message,
      userId: req.user?.id
    });
    return res.status(400).json({
      success: false,
      error: err.message
    });
  }
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      error: 'O tamanho do arquivo excede o limite de 5MB'
    });
  }
  next(err);
};

router.post(
  '/',
  authenticate,
  cardLimiter,
  upload.single('foto'),
  checkSchema(validationSchemas.createCard),
  validateRequest,
  handleUploadError,
  async (req, res, next) => {
    try {
      const cardData = matchedData(req);
      const { id: userId } = req.user;

      logger.info('Criando novo cartão', { 
        userId,
        cardData: { ...cardData, foto: req.file ? 'present' : 'absent' }
      });

      const novoCartao = await createCard({
        ...cardData,
        foto: req.file,
        userId
      });

      res.status(201).json({
        success: true,
        data: {
          id: novoCartao.id,
          ...novoCartao.dataValues
        }
      });

    } catch (error) {
      logger.error('Erro ao criar cartão', {
        error: error.message,
        stack: error.stack,
        userId: req.user?.id
      });
      next(error);
    }
  }
);

router.get(
  '/',
  authenticate,
  cardLimiter,
  async (req, res, next) => {
    try {
      const { id: userId } = req.user;

      logger.info('Buscando cartões do usuário', { userId });

      const cards = await Card.findAll({
        where: { userId },
        attributes: ['id', 'de', 'para', 'mensagem', 'createdAt'],
        order: [['createdAt', 'DESC']],
        limit: 50
      });

      res.json({
        success: true,
        data: cards,
        count: cards.length
      });

    } catch (error) {
      logger.error('Erro ao buscar cartões', {
        error: error.message,
        stack: error.stack,
        userId: req.user?.id
      });
      next(error);
    }
  }
);

router.get(
  '/:id',
  authenticate,
  async (req, res, next) => {
    try {
      const { id: cardId } = req.params;
      const { id: userId } = req.user;

      logger.info('Buscando cartão por ID', { cardId, userId });

      const card = await getCardById(cardId);

      if (!card) {
        logger.warn('Cartão não encontrado', { cardId });
        return res.status(404).json({
          success: false,
          error: 'Cartão não encontrado'
        });
      }

      if (card.userId !== userId) {
        logger.warn('Acesso não autorizado ao cartão', { cardId, userId });
        return res.status(403).json({
          success: false,
          error: 'Acesso não autorizado'
        });
      }

      res.json({
        success: true,
        data: card
      });

    } catch (error) {
      logger.error('Erro ao buscar cartão por ID', {
        error: error.message,
        stack: error.stack,
        cardId: req.params.id,
        userId: req.user?.id
      });
      next(error);
    }
  }
);

module.exports = router;