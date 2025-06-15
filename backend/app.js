// app.js (Versão de Produção com PostgreSQL e S3)

console.log('--- Iniciando app.js v5 (Produção) ---');

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { nanoid } = require('nanoid');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const db = require('./models'); // Importa os modelos do Sequelize

const app = express();
const PORT = process.env.PORT || 3001;

// --- Configuração do Cliente S3 ---
// As credenciais devem estar nas suas variáveis de ambiente na Render
const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    }
});
console.log('Cliente S3 configurado.');

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

// --- Middlewares ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Configuração do Multer ---
const storage = multer.memoryStorage(); // Armazena o arquivo na memória para upload no S3
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// --- Rota de Saúde ---
app.get('/', (req, res) => {
    res.status(200).json({ message: 'API do MessageLove está no ar!' });
});

// --- Rota para CRIAR um Cartão ---
app.post('/api/cards', upload.single('foto'), async (req, res, next) => {
    console.log('>>> Rota POST /api/cards ATINGIDA <<<');
    try {
        const { de, para, mensagem, youtubeVideoId } = req.body;
        const foto = req.file;
        let fotoUrl = null;

        if (!de || !para || !mensagem) {
            return res.status(400).json({ message: 'Campos obrigatórios faltando.' });
        }

        // Se houver uma foto, faz o upload para o S3
        if (foto) {
            const fotoKey = `cards/${nanoid(12)}-${foto.originalname}`;
            
            const command = new PutObjectCommand({
                Bucket: process.env.S3_BUCKET_NAME,
                Key: fotoKey,
                Body: foto.buffer,
                ContentType: foto.mimetype,
            });

            await s3Client.send(command);
            
            fotoUrl = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fotoKey}`;
            console.log(`Foto enviada para o S3: ${fotoUrl}`);
        }

        const cardId = nanoid(10);
        
        // Salva as informações no banco de dados PostgreSQL
        await db.Card.create({
            id: cardId,
            de,
            para,
            mensagem,
            youtubeVideoId: youtubeVideoId || null,
            fotoUrl: fotoUrl, // Salva a URL do S3 ou null
        });
        
        console.log(`Cartão salvo no PostgreSQL com ID: ${cardId}`);

        res.status(201).json({
            success: true,
            message: 'Cartão criado com sucesso!',
            cardId: cardId,
        });

    } catch (error) {
        next(error);
    }
});

// --- Rota para BUSCAR um Cartão por ID ---
app.get('/api/cards/:id', async (req, res, next) => {
    console.log(`>>> Rota GET /api/cards/${req.params.id} ATINGIDA <<<`);
    try {
        const cardId = req.params.id;
        // Busca o cartão no PostgreSQL pelo ID (chave primária)
        const card = await db.Card.findByPk(cardId);

        if (card) {
            console.log(`Cartão ${cardId} encontrado no PostgreSQL e retornado.`);
            res.status(200).json(card);
        } else {
            console.log(`Cartão ${cardId} não encontrado.`);
            res.status(404).json({ message: 'Cartão não encontrado.' });
        }
    } catch (error) {
        next(error);
    }
});

// --- Tratamento de Erros Global ---
app.use((err, req, res, next) => {
    console.error('ERRO GLOBAL:', err.stack);
    res.status(500).json({ message: err.message || 'Erro interno do servidor' });
});

// --- Inicialização do Servidor com Conexão ao DB ---
const startServer = async () => {
    try {
        await db.sequelize.sync({ alter: true }); // Sincroniza os modelos com o DB
        console.log('Banco de dados PostgreSQL sincronizado e conexão estabelecida.');
        app.listen(PORT, () => {
            console.log(`--- Servidor iniciado e ouvindo na porta ${PORT} ---`);
        });
    } catch (error) {
        console.error('Falha ao iniciar o servidor ou conectar ao banco de dados:', error);
        process.exit(1);
    }
};

startServer();
