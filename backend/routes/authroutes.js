const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { User } = require('../models'); // Importação corrigida
const logger = require('../config/logger'); // Logger centralizado

const router = express.Router();

// Constantes para reutilização
const PASSWORD_MIN_LENGTH = 6;
const TOKEN_CONFIG = {
  expiresIn: process.env.TOKEN_EXPIRATION || '24h'
};

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
    .withMessage(`Senha deve ter pelo menos ${PASSWORD_MIN_LENGTH} caracteres`),
  body('name')
    .optional()
    .trim()
    .escape()
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
  const { id, email, name } = user;
  return { id, email, name };
};

// Rotas
router.post('/register', validateRegister, async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.warn('Erro de validação no registro', { errors: errors.array() });
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, name } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ email, password: hashedPassword, name });

    const token = generateAuthToken(user.id);
    const userData = sanitizeUser(user);

    logger.info('Novo usuário registrado', { userId: user.id });
    res.status(201).json({ token, user: userData });
  } catch (error) {
    logger.error('Erro no registro', { error: error.message });
    next(error);
  }
});

router.post('/login', validateLogin, async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.warn('Erro de validação no login', { errors: errors.array() });
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });

    if (!user) {
      logger.warn('Tentativa de login com email não registrado', { email });
      return res.status(401).json({ message: 'Credenciais inválidas' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      logger.warn('Tentativa de login com senha inválida', { email });
      return res.status(401).json({ message: 'Credenciais inválidas' });
    }

    const token = generateAuthToken(user.id);
    const userData = sanitizeUser(user);

    logger.info('Login bem-sucedido', { userId: user.id });
    res.status(200).json({ token, user: userData });
  } catch (error) {
    logger.error('Erro no login', { error: error.message });
    next(error);
  }
});

module.exports = router;