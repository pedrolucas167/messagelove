const jwt = require('jsonwebtoken');
const winston = require('winston');

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
    transports: [new winston.transports.Console()]
});

const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        logger.warn('Token de autenticação ausente', {
            url: req.url,
            method: req.method,
            ip: req.ip
        });
        return res.status(401).json({ message: 'Token de autenticação ausente.' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
        logger.warn('Token vazio ou malformado', {
            url: req.url,
            method: req.method,
            ip: req.ip
        });
        return res.status(401).json({ message: 'Token inválido.' });
    }

    if (!process.env.JWT_SECRET) {
        logger.error('JWT_SECRET não configurado');
        return res.status(500).json({ message: 'Erro interno do servidor.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = { userId: decoded.userId };
        next();
    } catch (error) {
        let message = 'Token inválido ou expirado.';
        if (error.name === 'TokenExpiredError') {
            message = 'Token expirado.';
        } else if (error.name === 'JsonWebTokenError') {
            message = 'Token inválido.';
        }
        logger.error('Falha na autenticação', {
            error: error.message,
            url: req.url,
            method: req.method,
            ip: req.ip
        });
        res.status(401).json({ message });
    }
};

module.exports = authenticate;