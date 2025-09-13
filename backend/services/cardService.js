const express = require('express');
const { body, validationResult } = require('express-validator');
const multer = require('multer');

const auth = require('../middlewares/auth');          
const cardService = require('../services/cardService');
const logger = require('../config/logger');

const router = express.Router();

const upload = multer({ storage: multer.memoryStorage() });

const validators = [
  body('de').trim().notEmpty().withMessage('Campo "de" é obrigatório'),
  body('para').trim().notEmpty().withMessage('Campo "para" é obrigatório'),
  body('mensagem').trim().notEmpty().withMessage('Campo "mensagem" é obrigatório'),
  body('youtubeVideoId').optional().isString().trim(),
  body('youtubeStartTime').optional().toInt()
];

function validateRequest(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array().map(e => ({ field: e.param, message: e.msg }))
    });
  }
  next();
}


router.get('/', auth, async (req, res, next) => {
  try {
    const { Card } = require('../models');
    const cards = await Card.findAll({
      where: { userId: req.userId },
      order: [['createdAt', 'DESC']]
    });
    res.json(cards);
  } catch (err) {
    next(err);
  }
});


router.post(
  '/',
  auth,
  upload.single('foto'),   
  validators,
  validateRequest,
  async (req, res, next) => {
    try {
      const cardData = {
        de: req.body.de,
        para: req.body.para,
        mensagem: req.body.mensagem,
        youtubeVideoId: req.body.youtubeVideoId || null,
        youtubeStartTime: req.body.youtubeStartTime
      };

      logger.info('Criando novo cartão', { cardData });

      const novo = await cardService.createCard(cardData, req.file, req.userId);
      return res.status(201).json(novo);
    } catch (err) {
      logger.error('Erro ao criar cartão', { error: err.message, stack: err.stack });
      
      if (err.message === 'ID do usuário é obrigatório.' ||
          err.message === 'Campos de, para e mensagem são obrigatórios.' ||
          err.message === 'Arquivo de foto inválido.') {
        return res.status(400).json({ success: false, error: err.message });
      }
      next(err);
    }
  }
);

module.exports = router;
