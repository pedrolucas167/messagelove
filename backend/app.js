// app.js (Versão Final com Rota GET e simulação de DB)

console.log('--- Iniciando app.js v4 ---');

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { nanoid } = require('nanoid');

const app = express();
const PORT = process.env.PORT || 3001;

// --- Simulação de Banco de Dados (para debug) ---
const cardsDatabase = {};
console.log('Banco de dados em memória inicializado.');

// --- Configuração do CORS ---
const corsOptions = {
    origin: [
        'http://localhost:5500',
        'http://127.0.0.1:5500',
        'https://messagelove-frontend.vercel.app', // URL de produção do seu frontend
    ],
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
};
app.use(cors(corsOptions));
console.log('CORS configurado.');

// --- Middlewares ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
console.log('Middlewares de body-parser configurados.');

// --- Configuração do Multer ---
const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });
console.log('Multer configurado.');

// --- Rota de Saúde ---
app.get('/', (req, res) => {
    res.status(200).json({ message: 'API do MessageLove está no ar!' });
});
console.log('Rota de saúde / registrada.');

// --- Rota para CRIAR um Cartão ---
app.post('/api/cards', upload.single('foto'), async (req, res, next) => {
    console.log('>>> Rota POST /api/cards ATINGIDA <<<');
    try {
        const { de, para, mensagem, youtubeVideoId } = req.body;
        const foto = req.file;

        if (!de || !para || !mensagem) {
            return res.status(400).json({ message: 'Campos obrigatórios faltando.' });
        }

        const cardId = nanoid(10);
        
        // Salva o cartão no nosso "banco de dados" em memória
        cardsDatabase[cardId] = {
            id: cardId,
            de,
            para,
            mensagem,
            youtubeVideoId: youtubeVideoId || null,
            // Em um app real, você faria upload da imagem para um serviço (S3, Cloudinary)
            // e salvaria a URL aqui. Por enquanto, simulamos.
            fotoUrl: foto ? `data:${foto.mimetype};base64,${foto.buffer.toString('base64')}` : null
        };
        
        console.log(`Cartão criado e salvo (simulado) com ID: ${cardId}`);

        res.status(201).json({
            success: true,
            message: 'Cartão criado com sucesso!',
            cardId: cardId,
        });

    } catch (error) {
        next(error);
    }
});
console.log('--- Rota POST /api/cards registrada ---');

// --- NOVA ROTA para BUSCAR um Cartão por ID ---
app.get('/api/cards/:id', (req, res) => {
    console.log(`>>> Rota GET /api/cards/${req.params.id} ATINGIDA <<<`);
    const cardId = req.params.id;
    const card = cardsDatabase[cardId];

    if (card) {
        console.log(`Cartão ${cardId} encontrado e retornado.`);
        res.status(200).json(card);
    } else {
        console.log(`Cartão ${cardId} não encontrado no banco de dados em memória.`);
        res.status(404).json({ message: 'Cartão não encontrado.' });
    }
});
console.log('--- Rota GET /api/cards/:id registrada ---');

// --- Tratamento de Erros Global ---
app.use((err, req, res, next) => {
    console.error('ERRO GLOBAL:', err.stack);
    res.status(500).json({ message: err.message || 'Erro interno do servidor' });
});

// --- Inicialização do Servidor ---
app.listen(PORT, () => {
    console.log(`--- Servidor iniciado e ouvindo na porta ${PORT} ---`);
});
