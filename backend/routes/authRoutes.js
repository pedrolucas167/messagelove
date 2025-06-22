// /backend/routes/authRoutes.js

const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const { User } = require('../models');

const logger = require('../config/logger');

const router = express.Router();


router.post('/register', async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.warn('Erro de validação no registro', { 
        errors: errors.array(),
        ip: req.ip
      });
      return res.status(400).json({ errors: errors.array() });
    }
    const { email, password, name } = req.body;
    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await User.create({ email, password: hashedPassword, name });
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '24h' });
    
    logger.info('Novo usuário registrado', { userId: user.id, ip: req.ip });
    res.status(201).json({ token, user: { id: user.id, email: user.email, name: user.name }});
    
  } catch (error) {
    logger.error('Erro no registro', { 
      error: error.message,
      stack: error.stack
    });
    next(error);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.warn('Erro de validação no login', { errors: errors.array(), ip: req.ip });
      return res.status(400).json({ errors: errors.array() });
    }
    // ... resto da sua lógica
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user || !await bcrypt.compare(password, user.password)) {
      logger.warn('Tentativa de login inválida', { email, ip: req.ip });
      return res.status(401).json({ message: 'Credenciais inválidas' });
    }
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '24h' });
    
    logger.info('Login bem-sucedido', { userId: user.id, ip: req.ip });
    res.status(200).json({ token, user: { id: user.id, email: user.email, name: user.name }});

  } catch (error) {
    logger.error('Erro no login', { 
      error: error.message,
      stack: error.stack
    });
    next(error);
  }
});


module.exports = router;