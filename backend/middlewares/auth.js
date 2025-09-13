// middlewares/auth.js
const jwt = require('jsonwebtoken');
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.Console()]
});

module.exports = function authenticate(req, res, next) {
  const header = req.headers.authorization || '';

  if (!header.startsWith('Bearer ')) {
    logger.warn('Token ausente', { url: req.url, method: req.method, ip: req.ip });
    return res.status(401).json({ success: false, error: 'Token de autenticação ausente.' });
  }

  const token = header.split(' ')[1];
  if (!token) {
    logger.warn('Bearer sem token', { url: req.url, method: req.method, ip: req.ip });
    return res.status(401).json({ success: false, error: 'Token inválido.' });
  }

  if (!process.env.JWT_SECRET) {
    logger.error('JWT_SECRET não configurado');
    return res.status(500).json({ success: false, error: 'Erro interno do servidor.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Normaliza o id do usuário independente do campo usado no payload
    const userId = decoded.userId || decoded.sub || decoded.id;
    if (!userId) {
      logger.warn('Payload do token sem userId/sub/id', { url: req.url, method: req.method });
      return res.status(401).json({ success: false, error: 'Token inválido.' });
    }

    // Disponibiliza de forma consistente para as rotas/serviços
    req.userId = userId;
    req.user = {
      id: userId,
      email: decoded.email || null,
      name: decoded.name || null,
      role: decoded.role || null
    };

    return next();
  } catch (err) {
    const msg =
      err.name === 'TokenExpiredError' ? 'Token expirado.' :
      err.name === 'JsonWebTokenError' ? 'Token inválido.' :
      'Token inválido ou expirado.';

    logger.warn('Falha na autenticação', {
      error: err.message,
      url: req.url,
      method: req.method,
      ip: req.ip
    });

    return res.status(401).json({ success: false, error: msg });
  }
};
