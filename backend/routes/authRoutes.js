'use strict';

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { checkSchema, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const { sequelize, User } = require('../models');
const logger = require('../config/logger');

const router = express.Router();

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: 'Muitas tentativas. Por favor, tente novamente mais tarde.', skipSuccessfulRequests: true });
const forgotLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 5, message: 'Muitas tentativas. Por favor, tente novamente mais tarde.' });

const ensureJwtSecret = () => { if (!process.env.JWT_SECRET) { throw new Error('Variável de ambiente JWT_SECRET não configurada'); } };
const generateAuthToken = (userId) => { ensureJwtSecret(); return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }); };
const sanitizeUserData = (user) => ({ id: user.id, name: user.name, email: user.email, createdAt: user.created_at || user.createdAt });
const normalizeEmail = (v) => String(v || '').toLowerCase().trim();

const validationSchemas = {
  register: {
    email: {
      in: ['body'],
      isEmail: { errorMessage: 'Email inválido' },
      customSanitizer: { options: normalizeEmail },
      custom: {
        options: async (value) => {
          const user = await User.findOne({ where: { email: value } });
          if (user) throw new Error('Email já está em uso');
          return true;
        }
      }
    },
    password: {
      in: ['body'],
      isLength: { options: { min: 8 }, errorMessage: 'Senha deve ter pelo menos 8 caracteres' },
      matches: { options: /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/, errorMessage: 'Senha deve conter letras maiúsculas, minúsculas e números' }
    },
    name: {
      in: ['body'],
      notEmpty: { errorMessage: 'Nome é obrigatório' },
      isLength: { options: { max: 120 }, errorMessage: 'Nome deve ter no máximo 120 caracteres' },
      trim: true
    }
  },
  login: {
    email: { in: ['body'], isEmail: { errorMessage: 'Email inválido' }, customSanitizer: { options: normalizeEmail } },
    password: { in: ['body'], notEmpty: { errorMessage: 'Senha é obrigatória' } }
  },
  forgot: {
    email: { in: ['body'], isEmail: { errorMessage: 'Email inválido' }, customSanitizer: { options: normalizeEmail } }
  },
  reset: {
    email: { in: ['body'], isEmail: { errorMessage: 'Email inválido' }, customSanitizer: { options: normalizeEmail } },
    token: { in: ['body'], notEmpty: { errorMessage: 'Token é obrigatório' } },
    newPassword: {
      in: ['body'],
      isLength: { options: { min: 8 }, errorMessage: 'Senha deve ter pelo menos 8 caracteres' },
      matches: { options: /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/, errorMessage: 'Senha deve conter letras maiúsculas, minúsculas e números' }
    }
  }
};

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.warn('Falha na validação', { endpoint: req.path, errors: errors.array(), ip: req.ip });
    return res.status(400).json({ success: false, errors: errors.array().map(err => ({ field: err.param, message: err.msg })) });
  }
  next();
};

router.post('/register', authLimiter, checkSchema(validationSchemas.register), validateRequest, async (req, res, next) => {
  try {
    const name = String(req.body.name || '').trim();
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || '');
    const hashedPassword = await bcrypt.hash(password, 12);

    let user;
    try {
      user = await User.create({ name, email, password: hashedPassword });
    } catch (err) {
      if (err?.name === 'SequelizeUniqueConstraintError' || err?.parent?.code === '23505') {
        logger.warn('Registro com email já existente (unique constraint)', { email });
        return res.status(409).json({ success: false, error: 'Email já está em uso' });
      }
      throw err;
    }

    const token = generateAuthToken(user.id);
    logger.info('Usuário registrado com sucesso', { userId: user.id, email: user.email });
    return res.status(201).json({ success: true, token, user: sanitizeUserData(user) });
  } catch (error) {
    logger.error('Erro no registro de usuário', { error: error.message, stack: error.stack });
    return next(error);
  }
});

router.post('/login', authLimiter, checkSchema(validationSchemas.login), validateRequest, async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || '');

    const user = await User.unscoped().findOne({
      where: { email },
      attributes: ['id', 'name', 'email', 'password', 'created_at', 'createdAt']
    });

    if (!user || !user.password) {
      logger.warn('Tentativa de login com email não cadastrado ou sem senha', { email });
      return res.status(401).json({ success: false, error: 'Credenciais inválidas' });
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      logger.warn('Tentativa de login com senha incorreta', { userId: user.id, email: user.email });
      return res.status(401).json({ success: false, error: 'Credenciais inválidas' });
    }

    const token = generateAuthToken(user.id);
    logger.info('Login realizado com sucesso', { userId: user.id, email: user.email });

    return res.status(200).json({ success: true, token, user: sanitizeUserData(user) });
  } catch (error) {
    logger.error('Erro no processo de login', { error: error.message, stack: error.stack });
    return next(error);
  }
});

router.post('/forgot-password', forgotLimiter, checkSchema(validationSchemas.forgot), validateRequest, async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body.email);
    const user = await User.findOne({ where: { email } });
    const respondOk = () => res.json({ success: true, message: 'Se o email existir, enviaremos instruções.' });
    if (!user) { logger.info('Forgot-password para email não cadastrado', { email }); return respondOk(); }

    const raw = crypto.randomBytes(32).toString('hex');
    const hash = crypto.createHash('sha256').update(raw).digest('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await sequelize.query(
      `INSERT INTO password_reset_tokens (id, user_id, token_hash, expires_at, created_at, updated_at)
       VALUES (gen_random_uuid(), :uid, :th, :exp, now(), now())
       ON CONFLICT (token_hash) DO NOTHING;`,
      { replacements: { uid: user.id, th: hash, exp: expiresAt } }
    );

    const base = (process.env.FRONTEND_URL || '').replace(/\/$/, '');
    const resetUrl = `${base}/reset?token=${raw}&email=${encodeURIComponent(email)}`;
    logger.info('Link de reset gerado', { email, resetUrl });

    return respondOk();
  } catch (error) {
    logger.error('Erro no forgot-password', { error: error.message, stack: error.stack });
    return next(error);
  }
});

router.post('/reset-password', forgotLimiter, checkSchema(validationSchemas.reset), validateRequest, async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body.email);
    const token = String(req.body.token || '');
    const newPassword = String(req.body.newPassword || '');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const [[row]] = await sequelize.query(`
      SELECT prt.id, prt.expires_at, prt.used_at, u.id AS user_id
      FROM password_reset_tokens prt
      JOIN users u ON u.id = prt.user_id
      WHERE u.email = :email AND prt.token_hash = :th
      LIMIT 1;`, { replacements: { email, th: tokenHash } });

    if (!row) return res.status(400).json({ success: false, message: 'Token inválido' });
    if (row.used_at) return res.status(400).json({ success: false, message: 'Token já utilizado' });
    if (new Date(row.expires_at) < new Date()) return res.status(400).json({ success: false, message: 'Token expirado' });

    const hash = await bcrypt.hash(newPassword, 12);

    await sequelize.transaction(async (t) => {
      await sequelize.query(
        `UPDATE users SET password = :pwd, updated_at = now() WHERE id = :uid;`,
        { replacements: { pwd: hash, uid: row.user_id }, transaction: t }
      );
      await sequelize.query(
        `UPDATE password_reset_tokens SET used_at = now(), updated_at = now() WHERE id = :id;`,
        { replacements: { id: row.id }, transaction: t }
      );
      await sequelize.query(
        `DELETE FROM password_reset_tokens WHERE user_id = :uid AND id <> :id;`,
        { replacements: { uid: row.user_id, id: row.id }, transaction: t }
      );
      await sequelize.query(
        `DELETE FROM sessions WHERE user_id = :uid;`,
        { replacements: { uid: row.user_id }, transaction: t }
      );
    });

    logger.info('Senha redefinida com sucesso', { email });
    return res.json({ success: true, message: 'Senha alterada com sucesso' });
  } catch (error) {
    logger.error('Erro no reset-password', { error: error.message, stack: error.stack });
    return next(error);
  }
});

module.exports = router;
