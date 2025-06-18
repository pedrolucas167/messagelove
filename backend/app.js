// app.js

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cardRoutes = require('./routes/cardRoutes');
const db = require('./models');

const app = express();
const PORT = process.env.PORT || 3001;

// Configuração do CORS
const corsOptions = {
    origin: [
        'http://localhost:5500',
        'http://127.0.0.1:5500',
        'https://messagelove-frontend.vercel.app',
    ],
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
};
app.use(cors(corsOptions));

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rota de Saúde
app.get('/', (req, res) => {
    res.status(200).json({ message: 'API do MessageLove está no ar!' });
});

// Roteador Principal
app.use('/api', cardRoutes);

// Tratamento de Erro Global
app.use((err, req, res, next) => {
    console.error('ERRO GLOBAL:', err.stack);
    res.status(500).json({ message: err.message || 'Ocorreu um erro interno no servidor.' });
});

// Inicialização do Servidor
const startServer = async () => {
    try {
        await db.sequelize.sync({ alter: true });
        console.log('Banco de dados PostgreSQL sincronizado.');
        app.listen(PORT, () => {
            console.log(`--- Servidor iniciado na porta ${PORT} ---`);
        });
    } catch (error) {
        console.error('Falha ao iniciar o servidor:', error);
        process.exit(1);
    }
};

startServer();