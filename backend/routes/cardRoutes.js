const express = require('express');
const multer = require('multer');
const { body, validationResult } = require('express-validator');
const authenticate = require('../middlewares/auth');
const { createCard, getCardById } = require('../services/cardService');
const logger = require('../config/logger');

const router = express.Router();

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(file.mimetype)) {
            const error = new Error('Apenas imagens JPEG, PNG ou WebP são permitidas');
            error.code = 'LIMIT_FILE_TYPE';
            return cb(error, false);
        }
        cb(null, true);
    }
});

const validateCard = [
    body('de').trim().notEmpty().withMessage('O nome do remetente é obrigatório.'),
    body('para').trim().notEmpty().withMessage('O nome do destinatário é obrigatório.'),
    body('mensagem').trim().notEmpty().withMessage('A mensagem é obrigatória.'),
    body('youtubeVideoId').optional().trim(),
    body('youtubeStartTime').optional().isInt({ min: 0 }).withMessage('O tempo inicial do vídeo deve ser um número positivo.')
];

router.post('/', authenticate, upload.single('foto'), validateCard, async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            logger.warn('Validação falhou no POST /cards', { errors: errors.array(), userId: req.user?.userId });
            return res.status(400).json({ errors: errors.array() });
        }

        const cardData = {
            de: req.body.de,
            para: req.body.para,
            mensagem: req.body.mensagem,
            youtubeVideoId: req.body.youtubeVideoId,
            youtubeStartTime: req.body.youtubeStartTime
        };
        logger.info('Criando novo cartão', { userId: req.user.userId, cardData });
        const novoCartao = await createCard(cardData, req.file, req.user.userId);
        res.status(201).json({ id: novoCartao.id, ...novoCartao.dataValues });
    } catch (error) {
        logger.error('Erro ao criar cartão', { error: error.message, userId: req.user?.userId, stack: error.stack });
        next(error);
    }
});

router.get('/', authenticate, async (req, res, next) => {
    try {
        if (!req.user?.userId) {
            logger.warn('Autenticação ausente no GET /cards');
            return res.status(401).json({ message: 'Autenticação necessária.' });
        }
        logger.info('Buscando cartões do usuário', { userId: req.user.userId });
        const cards = await Card.findAll({
            where: { userId: req.user.userId },
            order: [['createdAt', 'DESC']]
        });
        res.json(cards);
    } catch (error) {
        logger.error('Erro ao buscar cartões', { error: error.message, userId: req.user?.userId });
        next(error);
    }
});

router.get('/:id', async (req, res, next) => {
    try {
        logger.info('Buscando cartão por ID', { cardId: req.params.id });
        const card = await getCardById(req.params.id);
        if (!card) {
            logger.warn('Cartão não encontrado', { cardId: req.params.id });
            return res.status(404).json({ message: 'Cartão não encontrado' });
        }
        res.json(card);
    } catch (error) {
        logger.error('Erro ao buscar cartão por ID', { error: error.message, cardId: req.params.id });
        next(error);
    }
});

module.exports = router;