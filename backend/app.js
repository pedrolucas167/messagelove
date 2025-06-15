// app.js

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cardRoutes = require('./routes/cardRoutes'); // Importa as rotas
const db = require('./models');

const app = express();
const PORT = process.env.PORT || 3001;

// Configuração do CORS
const corsOptions = {
    origin: [
        'http://localhost:3000',
        'http://localhost:5500', // Adicionado para Live Server
        'http://127.0.0.1:5500', // Adicionado para Live Server
        'https://messagelove-frontend.vercel.app', // Frontend em produção
    ],
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
};
app.use(cors(corsOptions));

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rota de saúde (para verificar se a API está no ar)
app.get('/', (req, res) => {
    res.status(200).json({ message: 'API do MessageLove está funcionando!' });
});

// **CORREÇÃO APLICADA AQUI**
// Apenas o prefixo da rota é definido. O middleware de upload foi movido.
app.use('/api', cardRoutes);

// Tratamento de erros global
app.use((err, req, res, next) => {
    console.error('Erro:', err.message);
    res.status(500).json({ message: err.message || 'Erro interno do servidor' });
});

// Inicialização do servidor
const startServer = async () => {
    try {
        await db.sequelize.sync({ alter: true });
        console.log('Banco de dados sincronizado e conexão estabelecida.');
        app.listen(PORT, () => {
            console.log(`Servidor rodando na porta ${PORT}`);
        });
    } catch (error) {
        console.error('Não foi possível iniciar o servidor:', error);
        process.exit(1);
    }
};

startServer();
