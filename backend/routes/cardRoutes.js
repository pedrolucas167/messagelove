// routes/cardRoutes.js

const express = require('express');
const router = express.Router();
const multer = require('multer');
const { nanoid } = require('nanoid');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const db = require('../models');


const s3Client = new S3Client({ region: process.env.AWS_REGION });
const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } }); // Limite de 5MB

// --- Rota para CRIAR um Cartão ---
router.post('/cards', upload.single('foto'), async (req, res, next) => {
    console.log('>>> Rota POST /api/cards ATINGIDA <<<');
    console.log('Body recebido:', req.body);
    console.log('Arquivo recebido:', req.file ? req.file.originalname : 'Nenhum arquivo');

    try {
       
        const { de, para, mensagem, data, youtubeVideoId, youtubeStartTime } = req.body;
        const foto = req.file;
        let fotoUrl = null;

        
        if (!de || !para || !mensagem) {
            return res.status(400).json({ message: 'Campos obrigatórios (de, para, mensagem) faltando.' });
        }

        // Lógica de upload para o S3 se uma foto for enviada
        if (foto) {
            console.log('Iniciando upload para o S3...');
            const fotoKey = `cards/${nanoid(12)}-${foto.originalname.replace(/\s/g, '_')}`;
            
            const command = new PutObjectCommand({
                Bucket: process.env.S3_BUCKET_NAME,
                Key: fotoKey,
                Body: foto.buffer,
                ContentType: foto.mimetype,
            });

            await s3Client.send(command);
            fotoUrl = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fotoKey}`;
            console.log(`Foto enviada para o S3 com sucesso: ${fotoUrl}`);
        }

        // Gravação no banco de dados
        console.log('Salvando informações no banco de dados...');
        const newCard = await db.Card.create({
            id: nanoid(10),
            de,
            para,
            mensagem,
            data: data || null,
            youtubeVideoId: youtubeVideoId || null,
            youtubeStartTime: youtubeStartTime || 0, 
            fotoUrl: fotoUrl, // Será null se nenhuma foto for enviada
        });
        
        console.log(`Cartão salvo no DB com ID: ${newCard.id}`);
        res.status(201).json({ success: true, cardId: newCard.id });

    } catch (error) {
        console.error("ERRO DETALHADO NA ROTA /cards:", error); // Log detalhado do erro
        next(error); // Passa para o error handler global
    }
});

// --- Rota para BUSCAR um Cartão por ID ---
router.get('/cards/:id', async (req, res, next) => {
    try {
        const card = await db.Card.findByPk(req.params.id);
        if (card) {
            res.status(200).json(card);
        } else {
            res.status(404).json({ message: 'Cartão não encontrado.' });
        }
    } catch (error) {
        next(error);
    }
});

module.exports = router;