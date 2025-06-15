// cardRoutes.js (JEITO CORRETO)
const express = require('express');
const router = express.Router();
const { nanoid } = require('nanoid');
const db = require('../models');

// O middleware de upload é importado ou definido aqui
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage }); // Use a mesma config do seu server.js

// O middleware 'upload.single('foto')' é aplicado aqui!
router.post('/cards', upload.single('foto'), (req, res, next) => {
    try {
        const { de, para, mensagem, youtubeVideoId } = req.body;

        // O arquivo da foto estará em req.file, se enviado
        console.log('Arquivo recebido:', req.file ? req.file.originalname : 'Nenhum arquivo');

        if (!de || !para || !mensagem) {
            return res.status(400).json({ message: 'Campos obrigatórios faltando.' });
        }
        
        const cardId = nanoid(10);
        
        console.log(`Dados para o novo cartão ${cardId}:`, { de, para, mensagem });

        res.status(201).json({
            success: true,
            message: 'Cartão criado com sucesso!',
            cardId: cardId,
        });

    } catch (error) {
        next(error);
    }
});

module.exports = router;