// app.js (Versão Final de Debug com Rota Unificada)

console.log('Iniciando app.js (Modo de Debug com Rota Unificada)...');

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { nanoid } = require('nanoid');

const app = express();
const PORT = process.env.PORT || 3001;

// --- Configuração do CORS ---
const corsOptions = {
    origin: [
        'http://localhost:3000',
        'http://localhost:5500',
        'http://127.0.0.1:5500',
        'https://messagelove-frontend.vercel.app', // URL de produção do seu frontend
    ],
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
};
app.use(cors(corsOptions));

// --- Middlewares ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Configuração do Multer ---
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // Limite de 5MB
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Formato de arquivo inválido.'), false);
        }
    },
});

// --- Rota de Saúde ---
app.get('/', (req, res) => {
    res.status(200).json({ message: 'API do MessageLove está no ar!' });
});

// --- Rota de Criação de Cartão (Definida Diretamente) ---
app.post('/api/cards', upload.single('foto'), async (req, res, next) => {
    console.log('>>> Requisição recebida em POST /api/cards <<<');
    try {
        const { de, para, mensagem } = req.body;
        const foto = req.file;

        if (!de || !para || !mensagem) {
            console.log('Validação falhou: campos obrigatórios faltando.');
            return res.status(400).json({ message: 'Campos "De", "Para" e "Mensagem" são obrigatórios.' });
        }

        const cardId = nanoid(10);
        console.log(`Cartão criado (simulado) com ID: ${cardId}`);
        console.log('Arquivo recebido:', foto ? foto.originalname : 'Nenhuma foto');

        res.status(201).json({
            success: true,
            message: 'Cartão criado com sucesso!',
            cardId: cardId,
        });

    } catch (error) {
        next(error);
    }
});
console.log('Rota POST /api/cards registrada diretamente no app.');


// --- Rota "Catch-all" para depurar rotas não encontradas ---
app.use((req, res, next) => {
    console.log(`ROTA NÃO ENCONTRADA: ${req.method} ${req.originalUrl}`);
    res.status(404).json({ message: `A rota ${req.method} ${req.originalUrl} não existe no servidor.` });
});

// --- Tratamento de Erros Global ---
app.use((err, req, res, next) => {
    console.error('ERRO GLOBAL:', err.stack);
    res.status(500).json({ message: err.message || 'Erro interno do servidor' });
});

// --- Inicialização do Servidor ---
app.listen(PORT, () => {
    console.log(`Servidor de depuração (Rota Unificada) rodando na porta ${PORT}`);
});
