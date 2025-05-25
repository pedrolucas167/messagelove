const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./cards.db', (err) => {
  if (err) {
    console.error('Erro ao conectar ao banco de dados:', err.message);
  } else {
    console.log('Conectado ao banco de dados SQLite (nota: dados são temporários no Render).');
  }
});

db.run(`
  CREATE TABLE IF NOT EXISTS cards (
    id TEXT PRIMARY KEY,
    nome TEXT NOT NULL,
    data TEXT,
    mensagem TEXT NOT NULL,
    spotifyTrackId TEXT,
    previewUrl TEXT,
    fotoUrl TEXT
  )
`, (err) => {
  if (err) {
    console.error('Erro ao criar tabela:', err.message);
  } else {
    console.log('Tabela "cards" criada ou já existe.');
  }
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Apenas imagens JPG e PNG são permitidas.'));
  }
});

router.post('/', upload.single('foto'), [
  body('nome').notEmpty().withMessage('Nome é obrigatório'),
  body('mensagem').notEmpty().withMessage('Mensagem é obrigatória')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { nome, data, mensagem, spotify, previewUrl } = req.body;
  console.log('Dados recebidos:', { nome, data, mensagem, spotify, previewUrl, hasFile: !!req.file });
  const cardId = Math.random().toString(36).slice(2, 10);
  const fotoUrl = req.file ? `/uploads/${req.file.filename}` : null;
  const cardData = { id: cardId, nome, data, mensagem, spotifyTrackId: spotify || null, previewUrl: previewUrl || null, fotoUrl };

  db.run(
    `INSERT INTO cards (id, nome, data, mensagem, spotifyTrackId, previewUrl, fotoUrl) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [cardId, nome, data, mensagem, spotify, previewUrl, fotoUrl],
    (err) => {
      if (err) {
        console.error('Erro ao salvar cartão:', err.message);
        return res.status(500).json({ message: 'Erro ao salvar cartão' });
      }
      const viewLink = `${process.env.FRONTEND_URL || 'https://messagelove-frontend.vercel.app'}/card/${cardId}`;
      res.json({ viewLink, cardData });
    }
  );
});

router.get('/:id', (req, res) => {
  const { id } = req.params;
  db.get(`SELECT * FROM cards WHERE id = ?`, [id], (err, row) => {
    if (err) {
      console.error('Erro ao buscar cartão:', err.message);
      return res.status(500).json({ message: 'Erro ao buscar cartão' });
    }
    if (!row) return res.status(404).json({ message: 'Cartão não encontrado' });
    res.json(row);
  });
});

module.exports = router;