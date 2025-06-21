// routes/cardRoutes.js

const express = require('express');
const router = express.Router();
const multer = require('multer');
const { nanoid } = require('nanoid');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const db = require('../models');

// Configuração do AWS S3
const s3Client = new S3Client({ region: process.env.AWS_REGION });

// Armazenamento na memória com filtro de tipos permitidos
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/webp'];
        if (!allowed.includes(file.mimetype)) {
            return cb(new Error('Tipo de arquivo não permitido.'));
        }
        cb(null, true);
    }
});

// --- Rota para CRIAR um Cartão ---
router.post('/cards', upload.single('foto'), async (req, res, next) => {
    if (process.env.NODE_ENV !== 'production') {
        console.log('>>> Rota POST /api/cards ATINGIDA <<<');
        console.log('Body recebido:', req.body);
        console.log('Arquivo recebido:', req.file ? req.file.originalname : 'Nenhum arquivo');
    }

    try {
        const { de, para, mensagem, data, youtubeVideoId, youtubeStartTime } = req.body;
        const foto = req.file;
        let fotoUrl = null;

        if (!de || !para || !mensagem) {
            return res.status(400).json({ message: 'Campos obrigatórios (de, para, mensagem) faltando.' });
        }

        // Validação e conversão do tempo inicial do vídeo
        const youtubeStart = parseInt(youtubeStartTime, 10);
        if (youtubeStartTime && isNaN(youtubeStart)) {
            return res.status(400).json({ message: 'youtubeStartTime deve ser um número.' });
        }

        // Upload para S3, se houver imagem
        if (foto) {
            console.log('Iniciando upload para o S3...');
            const extension = foto.originalname.split('.').pop();
            const fotoKey = `cards/${nanoid(12)}.${extension}`;

            const command = new PutObjectCommand({
                Bucket: process.env.S3_BUCKET_NAME,
                Key: fotoKey,
                Body: foto.buffer,
                ContentType: foto.mimetype,
            });

            try {
                await s3Client.send(command);
                fotoUrl = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fotoKey}`;
                console.log(`Foto enviada para o S3 com sucesso: ${fotoUrl}`);
            } catch (s3Err) {
                console.error('Erro ao fazer upload no S3:', s3Err);
                return res.status(500).json({ message: 'Erro ao enviar a imagem para o S3.' });
            }
        }

        // Criação no banco de dados
        console.log('Salvando informações no banco de dados...');
        const newCard = await db.Card.create({
            id: nanoid(10),
            de,
            para,
            mensagem,
            data: data || null,
            youtubeVideoId: youtubeVideoId || null,
            youtubeStartTime: youtubeStart || 0,
            fotoUrl: fotoUrl,
        });

        console.log(`Cartão salvo no DB com ID: ${newCard.id}`);
        res.status(201).json({
            success: true,
            cardId: newCard.id,
            fotoUrl,
            mensagem: newCard.mensagem,
            data: newCard.data,
        });

    } catch (error) {
        console.error("ERRO DETALHADO NA ROTA /cards:", error);
        next(error);
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
