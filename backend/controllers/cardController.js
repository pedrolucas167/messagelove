const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const cardService = require('../services/cardService');
const { v4: uuidv4 } = require('uuid');

// Configuração do cliente S3
const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

// Função auxiliar para fazer upload de imagem no S3
const uploadImageToS3 = async (file) => {
    if (!file) return null;

    const fileExtension = file.mimetype.split('/')[1];
    const fileName = `cards/${uuidv4()}.${fileExtension}`;
    
    const command = new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET,
        Key: fileName,
        Body: file.buffer,
        ContentType: file.mimetype,
        ACL: 'public-read', // Permite acesso público à imagem
    });

    await s3Client.send(command);
    return `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;
};

// Função auxiliar para deletar imagem do S3
const deleteImageFromS3 = async (imageUrl) => {
    if (!imageUrl) return;

    const key = imageUrl.split('.com/')[1];
    const command = new DeleteObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET,
        Key: key,
    });

    await s3Client.send(command);
};

// Criar um cartão
const handleCreateCard = async (req, res) => {
    try {
        console.log('Requisição POST /api/cards recebida:', req.body, req.file);
        
        const { nome, mensagem, data, youtubeVideoId } = req.body;

        // Validação dos campos obrigatórios
        if (!nome || !mensagem) {
            return res.status(400).json({ error: 'Nome e mensagem são obrigatórios.' });
        }

        // Processar a imagem, se presente
        const fotoUrl = req.file ? await uploadImageToS3(req.file) : null;

        // Criar o cartão no banco via cardService
        const card = await cardService.createCard({
            nome,
            data: data || null,
            mensagem,
            youtubeVideoId: youtubeVideoId || null,
            foto: fotoUrl,
        });

        res.status(201).json({ id: card.id, message: 'Cartão criado com sucesso!' });
    } catch (error) {
        console.error('Erro ao criar cartão:', error);
        res.status(500).json({ error: `Erro ao criar cartão: ${error.message}` });
    }
};

// Buscar um cartão por ID
const handleGetCard = async (req, res) => {
    try {
        const { id } = req.params;
        const card = await cardService.getCardById(id);

        if (!card) {
            return res.status(404).json({ error: 'Cartão não encontrado.' });
        }

        res.status(200).json(card);
    } catch (error) {
        console.error('Erro ao buscar cartão:', error);
        res.status(500).json({ error: `Erro ao buscar cartão: ${error.message}` });
    }
};

// Buscar todos os cartões
const handleGetAllCards = async (req, res) => {
    try {
        const cards = await cardService.getAllCards();
        res.status(200).json(cards);
    } catch (error) {
        console.error('Erro ao buscar cartões:', error);
        res.status(500).json({ error: `Erro ao buscar cartões: ${error.message}` });
    }
};

// Atualizar um cartão
const handleUpdateCard = async (req, res) => {
    try {
        const { id } = req.params;
        const { nome, mensagem, data, youtubeVideoId } = req.body;

        // Verificar se o cartão existe
        const existingCard = await cardService.getCardById(id);
        if (!existingCard) {
            return res.status(404).json({ error: 'Cartão não encontrado.' });
        }

        // Processar nova imagem, se presente
        let fotoUrl = existingCard.foto;
        if (req.file) {
            // Deletar imagem antiga do S3, se existir
            if (existingCard.foto) {
                await deleteImageFromS3(existingCard.foto);
            }
            fotoUrl = await uploadImageToS3(req.file);
        }

        // Atualizar o cartão
        const updatedCard = await cardService.updateCard(id, {
            nome: nome || existingCard.nome,
            mensagem: mensagem || existingCard.mensagem,
            data: data || existingCard.data,
            youtubeVideoId: youtubeVideoId || existingCard.youtubeVideoId,
            foto: fotoUrl,
        });

        res.status(200).json({ id: updatedCard.id, message: 'Cartão atualizado com sucesso!' });
    } catch (error) {
        console.error('Erro ao atualizar cartão:', error);
        res.status(500).json({ error: `Erro ao atualizar cartão: ${error.message}` });
    }
};

// Deletar um cartão
const handleDeleteCard = async (req, res) => {
    try {
        const { id } = req.params;

        // Verificar se o cartão existe
        const card = await cardService.getCardById(id);
        if (!card) {
            return res.status(404).json({ error: 'Cartão não encontrado.' });
        }

        // Deletar imagem do S3, se existir
        if (card.foto) {
            await deleteImageFromS3(card.foto);
        }

        // Deletar o cartão do banco
        await cardService.deleteCard(id);
        res.status(200).json({ message: 'Cartão deletado com sucesso!' });
    } catch (error) {
        console.error('Erro ao deletar cartão:', error);
        res.status(500).json({ error: `Erro ao deletar cartão: ${error.message}` });
    }
};

module.exports = {
    handleCreateCard,
    handleGetCard,
    handleGetAllCards,
    handleUpdateCard,
    handleDeleteCard,
};