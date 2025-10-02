'use strict';

const express = require('express');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const { checkSchema, validationResult } = require('express-validator');
const { Card, User } = require('../models');
const logger = require('../config/logger');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 8 * 1024 * 1024 } });

const auth = (req, res, next) => {
  try {
    const h = req.headers.authorization || '';
    const token = h.startsWith('Bearer ') ? h.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    if (!process.env.JWT_SECRET) return res.status(500).json({ error: 'JWT secret missing' });
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = payload.userId;
    next();
  } catch { return res.status(401).json({ error: 'Unauthorized' }); }
};

const validate = (schema) => [
  checkSchema(schema),
  (req, res, next) => {
    const r = validationResult(req);
    if (!r.isEmpty()) return res.status(400).json({ success: false, errors: r.array().map(e => ({ field: e.param, message: e.msg })) });
    next();
  }
];

const schemas = {
  create: {
    de: { in: ['body'], notEmpty: { errorMessage: 'Campo "de" é obrigatório' }, isLength: { options: { max: 120 }, errorMessage: 'Máximo 120' } },
    para: { in: ['body'], notEmpty: { errorMessage: 'Campo "para" é obrigatório' }, isLength: { options: { max: 120 }, errorMessage: 'Máximo 120' } },
    mensagem: { in: ['body'], notEmpty: { errorMessage: 'Mensagem é obrigatória' } },
    youtubeVideoId: { in: ['body'], optional: true, isLength: { options: { max: 32 }, errorMessage: 'youtubeVideoId inválido' } },
    youtubeStartTime: { in: ['body'], optional: true, isInt: { errorMessage: 'youtubeStartTime deve ser inteiro' } },
    fotoUrl: { in: ['body'], optional: true, isURL: { errorMessage: 'fotoUrl inválida' } }
  }
};

router.get('/', auth, async (req, res) => {
  try {
    const card = await Card.findByPk(req.params.id, {
  include: [{ association: 'user', attributes: ['id','name','email'] }]
});
    logger.info('Buscando cartões do usuário', { userId: req.userId });
    return res.json(cards);
  } catch (e) {
    logger.error('Erro ao buscar cartões', { error: e.message, stack: e.stack, userId: req.userId });
    return res.status(500).json({ error: 'Erro ao buscar cartões' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const card = await Card.findByPk(req.params.id, { include: [{ model: User, as: 'user', attributes: ['id','name','email'] }], });
    if (!card) return res.status(404).json({ error: 'Cartão não encontrado' });
    return res.json(card);
  } catch (e) {
    logger.error('Erro ao buscar cartão', { error: e.message, stack: e.stack, id: req.params.id });
    return res.status(500).json({ error: 'Erro ao buscar cartão' });
  }
});

router.post(
  '/',
  auth,
  upload.none(),
  validate(schemas.create),
  async (req, res) => {
    try {
      const payload = {
        userId: req.userId,
        de: String(req.body.de || '').trim(),
        para: String(req.body.para || '').trim(),
        mensagem: String(req.body.mensagem || '').trim(),
        youtubeVideoId: req.body.youtubeVideoId || null,
        youtubeStartTime: req.body.youtubeStartTime ? Number(req.body.youtubeStartTime) : null,
        fotoUrl: req.body.fotoUrl || null
      };
      logger.info('Criando novo cartão', { cardData: { de: payload.de, para: payload.para, mensagem: payload.mensagem, youtubeVideoId: payload.youtubeVideoId || '' }, userId: req.userId });
      const created = await Card.create(payload);
      return res.status(201).json(created);
    } catch (e) {
      logger.error('Erro ao criar cartão', { error: e.message, stack: e.stack });
      return res.status(500).json({ error: 'Erro ao criar cartão' });
    }
  }
);

module.exports = router;
