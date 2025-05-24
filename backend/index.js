const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();

// Configuração do CORS (ampliada)
const corsOptions = {
  origin: [
    'http://localhost:5500', 
    'http://127.0.0.1:5500',
    'http://localhost:8080',
    'http://127.0.0.1:8080'
  ],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
};
app.use(cors(corsOptions));
app.use(express.json());

// Configuração do Multer (com validação)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Cria a pasta se não existir
    const uploadPath = path.join(__dirname, '../frontend/assets/uploads');
    require('fs').mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'audio/mpeg'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de arquivo não suportado'), false);
  }
};

const upload = multer({ 
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
});

// Banco de dados em memória
const cardsDB = {};

// Rota POST completa
app.post('/api/cards', upload.fields([
  { name: 'foto', maxCount: 1 },
  { name: 'audio', maxCount: 1 }
]), (req, res) => {
  try {
    const { nome, mensagem, data, spotify } = req.body;
    
    // Validação básica
    if (!nome || !mensagem) {
      return res.status(400).json({ 
        error: 'Nome e mensagem são obrigatórios' 
      });
    }

    const id = uuidv4();
    const fotoUrl = req.files.foto ? 
      `assets/uploads/${req.files.foto[0].filename}` : null;
    const mp3Url = req.files.audio ? 
      `assets/uploads/${req.files.audio[0].filename}` : null;

    // Armazena no banco de dados
    cardsDB[id] = { 
      id,
      nome, 
      mensagem,
      data: data || new Date().toISOString().split('T')[0],
      spotify,
      fotoUrl,
      mp3Url
    };

    console.log('Cartão criado:', cardsDB[id]);

    res.status(201).json({ 
      success: true,
      id,
      viewLink: `http://localhost:5500/card.html?id=${id}`
    });

  } catch (error) {
    console.error('Erro no servidor:', error);
    res.status(500).json({ 
      error: 'Erro ao processar o cartão',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Rota para visualizar cartão
app.get('/api/cards/:id', (req, res) => {
  const card = cardsDB[req.params.id];
  if (card) {
    res.json(card);
  } else {
    res.status(404).json({ error: 'Cartão não encontrado' });
  }
});

// Rota de debug
app.get('/api/debug', (req, res) => {
  res.json({
    count: Object.keys(cardsDB).length,
    cards: cardsDB
  });
});

// Inicia o servidor
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
  console.log('Endpoints disponíveis:');
  console.log(`- POST http://localhost:${PORT}/api/cards`);
  console.log(`- GET  http://localhost:${PORT}/api/cards/:id`);
  console.log(`- DEBUG http://localhost:${PORT}/api/debug`);
});