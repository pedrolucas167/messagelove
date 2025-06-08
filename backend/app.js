const express = require('express');
const dotenv = require('dotenv');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const cors = require('cors');

const logger = require('./config/logger');
const corsOptions = require('./config/corsOptions');
const cardRoutes = require('./routes/cardRoutes');
const { logErrors, globalErrorHandler } = require('./middleware/errorHandler');

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet());
app.use(cors(corsOptions));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/api/status', (req, res) => res.json({ status: 'API is running' }));
app.use('/api', cardRoutes);

app.get('/card/:id', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'card.html'));
});

app.use((req, res, next) => {
    res.status(404).json({ message: 'Ops! A rota que você procura não foi encontrada.' });
});

app.use(logErrors);
app.use(globalErrorHandler);

const server = app.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT}`);
});

const shutdown = (signal) => {
  logger.info(`\nReceived ${signal}, shutting down gracefully...`);
  server.close(() => {
    logger.info('Server shut down successfully.');
    process.exit(0);
  });
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));