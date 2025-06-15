// ./routes/cardRoutes.js

const express = require('express');
const router = express.Router();
const multer = require('multer'); // Importe o multer aqui
const { nanoid } = require('nanoid');
const db = require('../models');

// Configuração do Multer (pode ser feita aqui ou importada)
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

// **CORREÇÃO APLICADA AQUI**
// A rota é apenas '/cards' e o middleware de upload está aplicado nela.
router.post('/cards', upload.single('foto'), async (req, res, next) => {
    try {
        const { de, para, mensagem, youtubeVideoId } = req.body;
        const foto = req.file; // O arquivo da foto estará disponível aqui

        if (!de || !para || !mensagem) {
            return res.status(400).json({ message: 'Campos "De", "Para" e "Mensagem" são obrigatórios.' });
        }

        const cardId = nanoid(10);
        
        // Exemplo de como você salvaria no banco de dados
        // await db.Card.create({
        //     id: cardId,
        //     de,
        //     para,
        //     mensagem,
        //     youtubeVideoId,
        //     fotoUrl: foto ? 'URL_DA_SUA_IMAGEM_AQUI' : null,
        // });

        console.log(`Cartão criado com ID: ${cardId}`);
        console.log('Arquivo recebido:', foto ? foto.originalname : 'Nenhuma foto');

        res.status(201).json({
            success: true,
            message: 'Cartão criado com sucesso!',
            cardId: cardId,
        });

    } catch (error) {
        next(error); // Passa o erro para o handler global
    }
});


// Você pode adicionar outras rotas aqui, como a de buscar um cartão por ID
// router.get('/cards/:id', async (req, res, next) => { ... });


module.exports = router;