// app.js

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cardRoutes = require('./routes/cardRoutes');
const db = require('./models');

const app = express();
const PORT = process.env.PORT || 3001;

// --- Início da Configuração Robusta do CORS ---
const whitelist = [
    'http://localhost:5500',
    'http://127.0.0.1:5500',
    'https://messagelove-frontend.vercel.app'
];

const corsOptions = {
    origin: function (origin, callback) {
        // Permite requisições sem 'origin' (ex: Postman, apps mobile) ou se a origem está na whitelist
        if (!origin || whitelist.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Acesso não permitido pela política de CORS'));
        }
    },
    methods: ['GET', 'POST', 'OPTIONS'], // Adicionado OPTIONS para requisições 'preflight'
    allowedHeaders: ['Content-Type', 'Authorization'], // Headers que seu frontend pode enviar
    credentials: true // Permite o envio de credenciais (cookies, etc.), se necessário no futuro
};

// Habilita o CORS para todas as rotas com as opções robustas
app.use(cors(corsOptions));

// Habilita a resposta para requisições preflight 'OPTIONS' em todas as rotas
// Isso é essencial para que POST com Content-Type complexo (como multipart/form-data) funcione corretamente
app.options('*', cors(corsOptions)); 
// --- Fim da Configuração Robusta do CORS ---


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
    // Adicionado para tratar erros de CORS especificamente
    if (err.message === 'Acesso não permitido pela política de CORS') {
        console.error('Tentativa de acesso bloqueada por CORS. Origem:', req.header('origin'));
        return res.status(403).json({ message: err.message });
    }
    
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