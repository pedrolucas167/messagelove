const express = require('express');
const dotenv = require('dotenv');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const cors = require('cors');

const corsOptions = require('./config/corsOptions');
const cardRoutes = require('./routes/cardRoutes');
const { logErrors, globalErrorHandler } = require('./middleware/errorHandler');

// Configuração inicial
dotenv.config();
const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares de segurança e configuração
app.use(helmet());
app.use(cors(corsOptions));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Rotas da API
app.get('/api/status', (req, res) => res.json({ status: 'API is running' }));
app.use('/api', cardRoutes);

// Rota para visualização do cartão (HTML)
app.get('/card/:id', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'card.html'));
});

// Middlewares de tratamento de erros
app.use(logErrors);
app.use(globalErrorHandler);

// Inicialização do servidor
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

// Encerramento gracioso
const shutdown = (signal) => {
  console.log(`\nReceived ${signal}, shutting down gracefully...`);
  server.close(() => {
    console.log('Server shut down successfully.');
    process.exit(0);
  });
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));