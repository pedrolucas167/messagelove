// ./routes/cardRoutes.js

const express = require('express');
const router = express.Router();
const { nanoid } = require('nanoid'); // Assumindo que você usa nanoid
const db = require('../models'); // Ajuste o caminho se necessário

// ROTA CORRETA: POST /cards
// O caminho completo se torna /api/cards por causa da configuração no server.js
router.post('/cards', (req, res, next) => {
    try {
        const { de, para, mensagem, youtubeVideoId } = req.body;

        if (!de || !para || !mensagem) {
            // É melhor retornar um erro 400 (Bad Request) para validação
            return res.status(400).json({ message: 'Campos "De", "Para" e "Mensagem" são obrigatórios.' });
        }

        const cardId = nanoid(10);
        
        // AQUI você faria a lógica para salvar no banco de dados com db.Card.create({...})
        console.log(`Dados para o novo cartão ${cardId}:`, { de, para, mensagem });

        res.status(201).json({
            success: true,
            message: 'Cartão criado com sucesso!',
            cardId: cardId,
        });

    } catch (error) {
        // Passa o erro para o middleware de tratamento de erros global
        next(error);
    }
});


module.exports = router;