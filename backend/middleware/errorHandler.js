const logger = require('../config/logger');

const logErrors = (err, req, res, next) => {
  logger.error(`${err.status || 500} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
  if (process.env.NODE_ENV === 'development') {
    logger.debug(err.stack);
  }
  next(err);
};

const globalErrorHandler = (err, req, res, next) => {
  const statusCode = err.status || 500;
  const isProduction = process.env.NODE_ENV === 'production';
  res.status(statusCode).json({
    message: isProduction && statusCode === 500 ? 'Ocorreu um erro interno inesperado no servidor.' : err.message,
    ...(!isProduction && { error: err.name, stack: err.stack })
  });
};

module.exports = {
  logErrors,
  globalErrorHandler,
};