const winston = require('winston');
const path = require('path');

// Define os níveis de log e suas cores para o console
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const levelColors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};
winston.addColors(levelColors);


// Formato do log para o console
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(
    (info) => `[${info.timestamp}] ${info.level}: ${info.message}`
  )
);

// Formato do log para arquivos
const fileFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.json()
);


// Define os "transportes" (onde os logs serão salvos/exibidos)
const transports = [
  // Sempre exibir todos os logs no console em ambiente de desenvolvimento
  new winston.transports.Console({
    format: consoleFormat,
  }),
  // Em produção, salvar logs de erro em um arquivo
  new winston.transports.File({
    level: 'error',
    filename: path.join(__dirname, '..', 'logs', 'error.log'),
    format: fileFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  }),
];


// Cria a instância do logger
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
  levels: logLevels,
  transports,
});

module.exports = logger;