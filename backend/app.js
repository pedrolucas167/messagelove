// app.js

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cardRoutes = require('./routes/cardRoutes');
const db = require('./models');

const app = express();
const PORT = process.env.PORT || 3001;

// Configuração do CORS
const corsOptions = {
  origin: (origin, callback) => {
    const whitelist = [
      'http://localhost:5500',
      'http://127.0.0.1:5500',
      'https://messagelove-frontend.vercel.app',
    ];
    if (!origin || whitelist.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Acesso não permitido pela política de CORS'));
    }
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
  credentials: false, // Desativado, pois o frontend não usa cookies
  optionsSuccessStatus: 204, // Resposta padrão para requisições OPTIONS
};

// Middlewares
app.use(helmet()); // Adiciona cabeçalhos de segurança
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined')); // Logging detalhado para monitoramento

// Rota de Saúde
app.get('/', (req, res) => {
  res.status(200).json({ message: 'API do MessageLove está no ar!', version: '4.2.0' });
});

// Roteador Principal
app.use('/api', cardRoutes);

// Middleware de Erro Global
app.use((err, req, res, next) => {
  if (err.message === 'Acesso não permitido pela política de CORS') {
    console.error(`CORS Error: Origem '${req.header('origin')}' bloqueada`);
    return res.status(403).json({ message: 'Acesso não permitido pela política de CORS' });
  }

  console.error(`Erro global: ${err.message}\nStack: ${err.stack}`);
  res.status(err.status || 500).json({
    message: err.message || 'Ocorreu um erro interno no servidor',
    error: process.env.NODE_ENV === 'production' ? undefined : err.stack,
  });
});

// Inicialização do Servidor
const startServer = async () => {
  try {
    await db.sequelize.sync({ alter: true });
    console.log('Banco de dados PostgreSQL sincronizado');
    app.listen(PORT, () => {
      console.log(`🚀 Servidor iniciado na porta ${PORT}`);
      console.log(`Ambiente: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('Falha ao iniciar o servidor:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app; // Exporta para testes ou integração