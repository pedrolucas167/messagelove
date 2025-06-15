// app.js

console.log('Iniciando app.js...'); // DEBUG

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

// Apenas o prefixo da rota é definido.
app.use('/api', cardRoutes);
console.log('Rotas de /api anexadas a partir de cardRoutes.'); // DEBUG

// Rota "catch-all" para depurar rotas não encontradas
app.use((req, res, next) => {
    console.log(`ROTA NÃO ENCONTRADA: ${req.method} ${req.originalUrl}`);
    res.status(404).json({ message: `A rota ${req.method} ${req.originalUrl} não existe no servidor.` });
});

// Tratamento de erros global
app.use((err, req, res, next) => {
    console.error('ERRO GLOBAL:', err.stack);
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
