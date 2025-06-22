const express = require('express');
const multer = require('multer');
const { nanoid } = require('nanoid');
const { body, validationResult } = require('express-validator');
const path = require('path');
const { authenticate } = require('../middlewares');
const db = require('../models');
// ▼▼▼ CORREÇÃO: A importação do logger foi REMOVIDA do topo. ▼▼▼
const s3Service = require('../services/s3Service');

const router = express.Router();

// Configuração do Multer com logging aprimorado
const configureMulter = () => {
  const fileFilter = (req, file, cb) => {
    // Pegamos o logger aqui, pois esta função pode ser chamada antes das rotas.
    const logger = require('../config/logger').getLogger();

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype)) {
      logger.http(`Tentativa de upload com tipo não permitido: ${file.mimetype}`, {
        ip: req.ip,
        originalname: file.originalname
      });
      return cb(new Error('Apenas imagens JPEG, PNG ou WebP são permitidas'), false);
    }
    logger.debug(`Arquivo aceito para upload: ${file.originalname}`);
    cb(null, true);
  };

  return multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter
  });
};

const upload = configureMulter();

// Validações
const validateCard = [
  body('de').trim().notEmpty().withMessage('Remetente é obrigatório'),
  body('para').trim().notEmpty().withMessage('Destinatário é obrigatório'),
  body('mensagem').trim().notEmpty().withMessage('Mensagem é obrigatória'),
  body('data').optional().isISO8601().toDate().withMessage('Formato de data inválido (use ISO8601)'),
  body('youtubeVideoId').optional().isString(),
  body('youtubeStartTime').optional().isInt({ min: 0 }).withMessage('Tempo inicial deve ser um número inteiro positivo')
];

// Handlers
const handleCardCreation = async (req, res, next) => {
  // ▼▼▼ CORREÇÃO: O logger é importado e obtido DENTRO da função handler. ▼▼▼
  const logger = require('../config/logger').getLogger();
  const startTime = Date.now();
  
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.warn('Validação falhou', {
        errors: errors.array(),
        body: req.body,
        user: req.user?.userId
      });
      return res.status(400).json({ errors: errors.array() });
    }

    logger.http('Iniciando criação de cartão', {
      user: req.user.userId,
      hasFile: !!req.file
    });

    const fotoUrl = req.file ? await handleFileUpload(req.file, req.user.userId) : null;

    const cardData = buildCardData(req.body, req.user.userId, fotoUrl);
    const newCard = await db.Card.create(cardData);

    logger.info('Cartão criado com sucesso', {
      cardId: newCard.id,
      duration: `${Date.now() - startTime}ms`,
      userId: req.user.userId
    });

    res.status(201).json({
      success: true,
      cardId: newCard.id,
      fotoUrl,
      mensagem: newCard.mensagem
    });

  } catch (error) {
    logger.error('Falha ao criar cartão', {
      error: error.message,
      stack: error.stack,
      body: req.body,
      userId: req.user?.userId,
      duration: `${Date.now() - startTime}ms`
    });
    next(error);
  }
};

const handleGetCard = async (req, res, next) => {
  // ▼▼▼ CORREÇÃO: O logger é importado e obtido DENTRO da função handler. ▼▼▼
  const logger = require('../config/logger').getLogger();

  try {
    logger.debug(`Buscando cartão ${req.params.id}`);
    const card = await db.Card.findByPk(req.params.id);
    
    if (!card) {
      logger.warn('Cartão não encontrado', { cardId: req.params.id });
      return res.status(404).json({ message: 'Cartão não encontrado' });
    }
    
    logger.http(`Cartão recuperado: ${card.id}`, {
      cardId: card.id,
      accessedBy: req.ip
    });
    
    res.json(card);
    
  } catch (error) {
    logger.error('Falha ao buscar cartão', {
      error: error.message,
      cardId: req.params.id,
      stack: error.stack
    });
    next(error);
  }
};

// Funções auxiliares
const handleFileUpload = async (file, userId) => {
  // ▼▼▼ CORREÇÃO: O logger é importado e obtido DENTRO da função auxiliar. ▼▼▼
  const logger = require('../config/logger').getLogger();
  
  try {
    logger.debug('Iniciando upload de arquivo', {
      originalname: file.originalname,
      size: file.size,
      userId
    });
    
    const fotoUrl = await s3Service.uploadFile(file);
    
    logger.info('Upload de arquivo concluído', {
      url: fotoUrl,
      userId
    });
    
    return fotoUrl;
  } catch (error) {
    logger.error('Falha no upload de arquivo', {
      error: error.message,
      originalname: file.originalname,
      userId
    });
    throw error;
  }
};

const buildCardData = (body, userId, fotoUrl) => ({
  id: nanoid(10),
  de: body.de,
  para: body.para,
  mensagem: body.mensagem,
  data: body.data || null,
  youtubeVideoId: body.youtubeVideoId || null,
  youtubeStartTime: body.youtubeStartTime ? parseInt(body.youtubeStartTime, 10) : 0,
  fotoUrl,
  userId
});

// Rotas
router.post('/cards', 
  authenticate, 
  upload.single('foto'), 
  validateCard, 
  handleCardCreation
);

router.get('/cards/:id', handleGetCard);

module.exports = router;