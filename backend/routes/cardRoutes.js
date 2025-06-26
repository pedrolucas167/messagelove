const express = require('express');
const multer = require('multer');
const { nanoid } = require('nanoid');
const { body, validationResult } = require('express-validator');
const authenticate = require('../middlewares/auth');
const logger = require('../config/logger');
const db = require('../models');
const s3Service = require('../services/s3Service');

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
            return res.status(400).json({ errors: errors.array() });
        }

        let fotoUrl = null;
        if (req.file) {
            fotoUrl = await s3Service.uploadFile(req.file);
        }

        const cardData = {
            id: nanoid(10),
            de: req.body.de,
            para: req.body.para,
            mensagem: req.body.mensagem,
            fotoUrl,
            youtubeVideoId: req.body.youtubeVideoId || null,
            youtubeStartTime: parseInt(req.body.youtubeStartTime, 10) || 0,
            userId: req.user.userId
        };

        const newCard = await db.Card.create(cardData);
        res.status(201).json({ id: newCard.id, ...newCard.dataValues });

    } catch (error) {
        logger.error('Falha ao criar cartão', {
            error: error.message,
            userId: req.user?.userId,
            stack: error.stack
        });
        next(error);
    }
});

router.get('/', authenticate, async (req, res, next) => {
    try {
        const cards = await db.Card.findAll({
            where: { userId: req.user.userId },
            order: [['createdAt', 'DESC']]
        });
        res.json(cards);
    } catch (error) {
        logger.error('Falha ao buscar cartões', { userId: req.user?.userId, error: error.message });
        next(error);
    }
});

router.get('/:id', async (req, res, next) => {
    try {
        const card = await db.Card.findByPk(req.params.id);
        if (!card) {
            return res.status(404).json({ message: 'Cartão não encontrado' });
        }
        res.json(card);
    } catch (error) {
        logger.error('Falha ao buscar cartão por ID', { cardId: req.params.id, error: error.message });
        next(error);
    }
});

module.exports = router;