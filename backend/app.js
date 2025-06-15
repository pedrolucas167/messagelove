require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const cardRoutes = require('./routes/cardRoutes');
const db = require('./models');

const app = express();
const PORT = process.env.PORT || 3001;

// Configuração do Multer para upload de arquivos
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // Limite de 5MB
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Formato de arquivo inválido. Use JPG, PNG ou GIF.'), false);
        }
    },
});

// Configuração do CORS
const corsOptions = {
    origin: [
        'http://localhost:3000', // Para desenvolvimento local
        'https://messagelove-frontend.vercel.app', // Frontend em produção
    ],
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
};
app.use(cors(corsOptions));

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rota de saúde
app.get('/', (req, res) => {
    res.status(200).json({ message: 'API do MessageLove está funcionando!' });
});

// Rotas da API
app.use('/api', upload.single('foto'), cardRoutes);

// Tratamento de erros global
app.use((err, req, res, next) => {
    console.error('Erro:', err.message);
    if (err instanceof multer.MulterError) {
        return res.status(400).json({ error: 'Erro no upload do arquivo: ' + err.message });
    }
    res.status(500).json({ error: err.message || 'Erro interno do servidor' });
});

// Inicialização do servidor
const startServer = async () => {
    try {
        await db.sequelize.sync({ alter: true }); // Sincroniza modelos, ajustando tabelas se necessário
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
