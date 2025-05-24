const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const app = express();

// Configurações
const FRONTEND_URLS = [
  'http://localhost:5500',
  'http://127.0.0.1:5500',
  'http://localhost:8080',
  'http://127.0.0.1:8080'
];
const UPLOADS_DIR = path.join(__dirname, '../frontend/assets/uploads');

// Middleware
app.use(cors({
  origin: FRONTEND_URLS,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
}));
app.use(express.json());
app.use('/assets/uploads', express.static(UPLOADS_DIR)); // Servir arquivos estáticos

// Configuração do Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'audio/mpeg'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Arquivo não suportado (apenas JPG, PNG ou MP3)'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// Banco de dados (temporário em memória)
const cardsDB = {};

// POST - Criação do cartão
app.post('/api/cards', upload.fields([
  { name: 'foto', maxCount: 1 },
  { name: 'audio', maxCount: 1 }
]), (req, res) => {
  try {
    const { nome, mensagem, data, spotify } = req.body;

    if (!nome || !mensagem) {
      return res.status(400).json({ error: 'Nome e mensagem são obrigatórios.' });
    }

    const id = uuidv4();
    const foto = req.files.foto ? req.files.foto[0].filename : null;
    const audio = req.files.audio ? req.files.audio[0].filename : null;

    const card = {
      id,
      nome,
      mensagem,
      data: data || new Date().toISOString().split('T')[0],
      spotify,
      fotoUrl: foto ? `/assets/uploads/${foto}` : null,
      mp3Url: audio ? `/assets/uploads/${audio}` : null
    };

    cardsDB[id] = card;

    console.log('✅ Cartão criado:', card);

    res.status(201).json({
      success: true,
      id,
      viewLink: `http://localhost:5500/card.html?id=${id}`
    });
  } catch (error) {
    console.error('❌ Erro no servidor:', error);
    res.status(500).json({
      error: 'Erro interno no servidor',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

//  GET - Obter um cartão específico
app.get('/api/cards/:id', (req, res) => {
  const card = cardsDB[req.params.id];
  if (!card) {
    return res.status(404).json({ error: 'Cartão não encontrado.' });
  }
  res.json(card);
});

// GET - Debug (listar todos)
app.get('/api/debug', (req, res) => {
  res.json({
    count: Object.keys(cardsDB).length,
    cards: cardsDB
  });
});

// Inicializa o servidor
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando: http://localhost:${PORT}`);
  console.log('📌 Endpoints disponíveis:');
  console.log(`➡️ POST  http://localhost:${PORT}/api/cards`);
  console.log(`➡️ GET   http://localhost:${PORT}/api/cards/:id`);
  console.log(`➡️ DEBUG http://localhost:${PORT}/api/debug`);
});
