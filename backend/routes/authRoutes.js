const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { User } = require('../models');
const logger = require('../config/logger');
const rateLimit = require('express-rate-limit');
const { checkSchema } = require('express-validator');

const router = express.Router();

// Rate limiting para endpoints sensíveis
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // Limite de tentativas
  message: 'Muitas tentativas. Por favor, tente novamente mais tarde.',
  skipSuccessfulRequests: true
});

// Esquemas de validação reutilizáveis
const validationSchemas = {
  register: {
    email: {
      isEmail: true,
      errorMessage: 'Email inválido',
      custom: {
        options: async (value) => {
          const user = await User.findOne({ where: { email: value } });
          if (user) throw new Error('Email já está em uso');
        }
      }
    },
    password: {
      isLength: { options: { min: 8 } },
      errorMessage: 'Senha deve ter pelo menos 8 caracteres',
      matches: { 
        options: /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*]).{8,}$/,
        errorMessage: 'Senha deve conter letras maiúsculas, minúsculas, números e caracteres especiais'
      }
    },
    name: {
      notEmpty: true,
      errorMessage: 'Nome é obrigatório',
      isLength: { options: { max: 100 } }
    }
  },
  login: {
    email: {
      isEmail: true,
      errorMessage: 'Email inválido'
    },
    password: {
      notEmpty: true,
      errorMessage: 'Senha é obrigatória'
    }
  }
};

// Utilitários
const generateToken = (userId) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('Configuração de segurança faltando: JWT_SECRET');
  }
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );
};

const sanitizeUser = (user) => ({
  id: user.id,
  email: user.email,
  name: user.name,
  createdAt: user.createdAt
});

// Middleware de tratamento de erros de validação
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.warn('Erros de validação', {
      path: req.path,
      errors: errors.array(),
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    return res.status(400).json({ 
      success: false,
      errors: errors.array().map(err => err.msg) 
    });
  }
  next();
};

/**
 * @route POST /auth/register
 * @desc Registra um novo usuário
 * @access Public
 */
router.post(
  '/register',
  authLimiter,
  checkSchema(validationSchemas.register),
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const { email, password, name } = req.body;
      
      const hashedPassword = await bcrypt.hash(password, 12);
      const user = await User.create({ 
        email, 
        password: hashedPassword, 
        name 
      });

      const token = generateToken(user.id);

      logger.info('Novo usuário registrado com sucesso', { 
        userId: user.id,
        ip: req.ip 
      });

      res.status(201).json({
        success: true,
        token,
        user: sanitizeUser(user)
      });

    } catch (error) {
      logger.error('Erro no processo de registro', {
        error: error.message,
        stack: error.stack,
        input: req.body
      });
      next(error);
    }
  }
);

/**
 * @route POST /auth/login
 * @desc Autentica um usuário existente
 * @access Public
 */
router.post(
  '/login',
  authLimiter,
  checkSchema(validationSchemas.login),
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const { email, password } = req.body;
      
      const user = await User.findOne({ where: { email } });
      if (!user) {
        logger.warn('Tentativa de login com email não registrado', { 
          email,
          ip: req.ip 
        });
        return res.status(401).json({ 
          success: false,
          message: 'Credenciais inválidas' 
        });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        logger.warn('Tentativa de login com senha incorreta', { 
          userId: user.id,
          ip: req.ip 
        });
        return res.status(401).json({ 
          success: false,
          message: 'Credenciais inválidas' 
        });
      }

      const token = generateToken(user.id);

      logger.info('Login bem-sucedido', { 
        userId: user.id,
        ip: req.ip 
      });

      res.status(200).json({
        success: true,
        token,
        user: sanitizeUser(user)
      });

    } catch (error) {
      logger.error('Erro no processo de login', {
        error: error.message,
        stack: error.stack,
        input: req.body
      });
      next(error);
    }
  }
);

module.exports = router;