const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { checkSchema, validationResult } = require('express-validator');
const { User } = require('../models');
const logger = require('../config/logger');
const rateLimit = require('express-rate-limit');

const router = express.Router();

// Configuração de Rate Limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Muitas tentativas. Por favor, tente novamente mais tarde.',
  skipSuccessfulRequests: true
});

// Esquemas de Validação
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
      isLength: { 
        options: { min: 8 },
        errorMessage: 'Senha deve ter pelo menos 8 caracteres'
      },
      matches: {
        options: /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/,
        errorMessage: 'Senha deve conter letras maiúsculas, minúsculas e números'
      }
    },
    name: {
      notEmpty: true,
      errorMessage: 'Nome é obrigatório',
      isLength: {
        options: { max: 100 },
        errorMessage: 'Nome deve ter no máximo 100 caracteres'
      }
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
const generateAuthToken = (userId) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('Variável de ambiente JWT_SECRET não configurada');
  }
  
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );
};

const sanitizeUserData = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  createdAt: user.createdAt
});

// Middlewares
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.warn('Falha na validação', {
      endpoint: req.path,
      errors: errors.array(),
      ip: req.ip
    });
    
    return res.status(400).json({
      success: false,
      errors: errors.array().map(err => ({
        field: err.param,
        message: err.msg
      }))
    });
  }
  next();
};

// Rotas
router.post(
  '/register',
  authLimiter,
  checkSchema(validationSchemas.register),
  validateRequest,
  async (req, res, next) => {
    try {
      const { name, email, password } = req.body;
      
      // Criptografa a senha
      const hashedPassword = await bcrypt.hash(password, 12);
      
      // Cria o usuário no banco de dados
      const user = await User.create({
        name,
        email,
        password: hashedPassword
      });

      // Gera token JWT
      const token = generateAuthToken(user.id);

      logger.info('Usuário registrado com sucesso', {
        userId: user.id,
        email: user.email
      });

      res.status(201).json({
        success: true,
        token,
        user: sanitizeUserData(user)
      });

    } catch (error) {
      logger.error('Erro no registro de usuário', {
        error: error.message,
        stack: error.stack
      });
      
      if (error.message.includes('email')) {
        return res.status(409).json({
          success: false,
          error: 'Email já está em uso'
        });
      }
      
      next(error);
    }
  }
);

router.post(
  '/login',
  authLimiter,
  checkSchema(validationSchemas.login),
  validateRequest,
  async (req, res, next) => {
    try {
      const { email, password } = req.body;
      
      // Busca usuário pelo email
      const user = await User.findOne({ where: { email } });
      
      if (!user) {
        logger.warn('Tentativa de login com email não cadastrado', { email });
        return res.status(401).json({
          success: false,
          error: 'Credenciais inválidas'
        });
      }

      // Verifica a senha
      const isPasswordValid = await bcrypt.compare(password, user.password);
      
      if (!isPasswordValid) {
        logger.warn('Tentativa de login com senha incorreta', { 
          userId: user.id,
          email: user.email
        });
        return res.status(401).json({
          success: false,
          error: 'Credenciais inválidas'
        });
      }

      // Gera token JWT
      const token = generateAuthToken(user.id);

      logger.info('Login realizado com sucesso', {
        userId: user.id,
        email: user.email
      });

      res.status(200).json({
        success: true,
        token,
        user: sanitizeUserData(user)
      });

    } catch (error) {
      logger.error('Erro no processo de login', {
        error: error.message,
        stack: error.stack
      });
      next(error);
    }
  }
);

module.exports = router;