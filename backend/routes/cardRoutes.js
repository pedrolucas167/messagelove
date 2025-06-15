// ./routes/cardRoutes.js
console.log('Arquivo cardRoutes.js carregado.');

const express = require('express');
const router = express.Router();
const multer = require('multer');
const { nanoid } = require('nanoid');
// const db = require('../models'); // DEBUG: Desabilitado temporariamente

// Configuração do Multer
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Formato de arquivo inválido.'), false);
        }
    },
});

// A rota é apenas '/cards' e o middleware de upload está aplicado nela.
router.post('/cards', upload.single('foto'), async (req, res, next) => {
    console.log('Requisição recebida em POST /api/cards');
    try {
        const { de, para, mensagem, youtubeVideoId } = req.body;
        const foto = req.file;

        if (!de || !para || !mensagem) {
            return res.status(400).json({ message: 'Campos "De", "Para" e "Mensagem" são obrigatórios.' });
        }

        const cardId = nanoid(10);

        console.log(`Cartão criado (simulado) com ID: ${cardId}`);
        console.log('Arquivo recebido:', foto ? foto.originalname : 'Nenhuma foto');

        res.status(201).json({
            success: true,
            message: 'Cartão criado com sucesso! (Modo de Debug)',
            cardId: cardId,
        });

    } catch (error) {
        next(error);
    }
});

module.exports = router;
