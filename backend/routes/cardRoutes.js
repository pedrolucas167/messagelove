// routes/cardRoutes.js

const express = require('express');
const router = express.Router();
const multer = require('multer');
const { nanoid } = require('nanoid');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const db = require('../models');

// --- Configuração do S3 e Multer ---
const s3Client = new S3Client({ region: process.env.AWS_REGION });
const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// --- Rota para CRIAR um Cartão ---
// CORREÇÃO: Adicionada a palavra 'async' aqui
router.post('/cards', upload.single('foto'), async (req, res, next) => {
    console.log('>>> Rota POST /api/cards ATINGIDA <<<');
    try {
        const { de, para, mensagem, youtubeVideoId } = req.body;
        const foto = req.file;
        let fotoUrl = null;

        if (!de || !para || !mensagem) {
            return res.status(400).json({ message: 'Campos obrigatórios faltando.' });
        }

        if (foto) {
            const fotoKey = `cards/${nanoid(12)}-${foto.originalname.replace(/\s/g, '_')}`;
            const command = new PutObjectCommand({
                Bucket: process.env.S3_BUCKET_NAME,
                Key: fotoKey,
                Body: foto.buffer,
                ContentType: foto.mimetype,
                ACL: 'public-read' // Garante que a imagem seja pública
            });
            await s3Client.send(command); // 'await' agora é válido
            fotoUrl = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fotoKey}`;
            console.log(`Foto enviada para o S3: ${fotoUrl}`);
        }

        const newCard = await db.Card.create({
            id: nanoid(10),
            de,
            para,
            mensagem,
            youtubeVideoId: youtubeVideoId || null,
            fotoUrl,
        });
        
        console.log(`Cartão salvo no DB com ID: ${newCard.id}`);
        res.status(201).json({ success: true, cardId: newCard.id });

    } catch (error) {
        next(error);
    }
});

// --- Rota para BUSCAR um Cartão por ID ---
router.get('/cards/:id', async (req, res, next) => {
    console.log(`>>> Rota GET /api/cards/${req.params.id} ATINGIDA <<<`);
    try {
        const card = await db.Card.findByPk(req.params.id);
        if (card) {
            console.log(`Cartão ${req.params.id} encontrado.`);
            res.status(200).json(card);
        } else {
            console.log(`Cartão ${req.params.id} não encontrado.`);
            res.status(404).json({ message: 'Cartão não encontrado.' });
        }
    } catch (error) {
        next(error);
    }
});

module.exports = router;