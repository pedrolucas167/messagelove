const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const { User } = require('../models');
const { getLogger } = require('../config/logger');
const logger = getLogger();

const router = express.Router();

// Constantes para reutilização
const PASSWORD_MIN_LENGTH = 8; 
const TOKEN_CONFIG = {
  expiresIn: process.env.TOKEN_EXPIRATION || '24h'
};

// Rate Limiter para endpoints de autenticação
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 5, 
  message: { 
    error: 'Muitas tentativas, tente novamente mais tarde',
    retryAfter: 900 
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Middlewares de validação
const validateRegister = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email inválido')
    .custom(async (email) => {
      const user = await User.findOne({ where: { email } });
      if (user) throw new Error('Email já registrado');
    }),
  body('password')
    .isLength({ min: PASSWORD_MIN_LENGTH })
    .withMessage(`Senha deve ter pelo menos ${PASSWORD_MIN_LENGTH} caracteres`)
    .matches(/[0-9]/)
    .withMessage('Senha deve conter pelo menos um número')
    .matches(/[a-zA-Z]/)
    .withMessage('Senha deve conter pelo menos uma letra'),
  body('name')
    .optional()
    .trim()
    .escape()
    .isLength({ max: 100 })
    .withMessage('Nome muito longo')
];

const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email inválido'),
  body('password')
    .notEmpty()
    .withMessage('Senha é obrigatória')
];

// Utilitários
const generateAuthToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, TOKEN_CONFIG);
};

const sanitizeUser = (user) => {
  const { id, email, name, createdAt, updatedAt } = user;
  return { id, email, name, createdAt, updatedAt };
};

// Middleware de headers de segurança
const securityHeaders = (req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  next();
};

// Rotas
router.post('/register', securityHeaders, validateRegister, async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.warn('Erro de validação no registro', { 
        errors: errors.array(),
        ip: req.ip,
        userAgent: req.get('user-agent')
      });
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, name } = req.body;
    const hashedPassword = await bcrypt.hash(password, 12); // Aumentado o salt rounds para 12
    const user = await User.create({ email, password: hashedPassword, name });

    const token = generateAuthToken(user.id);
    const userData = sanitizeUser(user);

    logger.info('Novo usuário registrado', { 
      userId: user.id,
      email: user.email,
      ip: req.ip
    });
    
    res.status(201)
      .setHeader('X-Auth-Token', token)
      .json({ 
        token, 
        user: userData 
      });
  } catch (error) {
    logger.error('Erro no registro', { 
      error: error.message,
      stack: error.stack,
      email: req.body.email,
      ip: req.ip
    });
    next(error);
  }
});

router.post('/login', securityHeaders, authLimiter, validateLogin, async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.warn('Erro de validação no login', { 
        errors: errors.array(),
        ip: req.ip,
        userAgent: req.get('user-agent')
      });
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });

    if (!user) {
      logger.warn('Tentativa de login com email não registrado', { 
        email,
        ip: req.ip,
        userAgent: req.get('user-agent')
      });
      return res.status(401).json({ message: 'Credenciais inválidas' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      logger.warn('Tentativa de login com senha inválida', { 
        email,
        ip: req.ip,
        userAgent: req.get('user-agent')
      });
      return res.status(401).json({ message: 'Credenciais inválidas' });
    }

    const token = generateAuthToken(user.id);
    const userData = sanitizeUser(user);

    logger.info('Login bem-sucedido', { 
      userId: user.id,
      email: user.email,
      ip: req.ip
    });
    
    res.status(200)
      .setHeader('X-Auth-Token', token)
      .json({ 
        token, 
        user: userData 
      });
  } catch (error) {
    logger.error('Erro no login', { 
      error: error.message,
      stack: error.stack,
      email: req.body.email,
      ip: req.ip
    });
    next(error);
  }
});

module.exports = router;