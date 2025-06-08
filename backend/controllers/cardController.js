// 1. IMPORTAR AS DEPENDÊNCIAS
const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { Card } = require('../models'); // Importa o modelo Card do Sequelize

// 2. CONFIGURAR O CLIENTE S3 (fora das funções para ser reutilizado)
const s3Client = new S3Client({
    region: process.env.AWS_BUCKET_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    }
});

// --- FUNÇÕES DO CONTROLLER ---

/**
 * Cria um novo cartão, faz o upload da foto para o S3 e salva os dados no PostgreSQL.
 */
const handleCreateCard = async (req, res) => {
    const { nome, data, mensagem, youtubeVideoId } = req.body;
    let fotoUrl = null;

    // Se um arquivo de foto foi enviado, faça o upload para o S3 primeiro
    if (req.file) {
        const fileName = `messagelove/foto-${Date.now()}-${req.file.originalname}`;
        const params = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: fileName,
            Body: req.file.buffer,
            ContentType: req.file.mimetype
        };
        const command = new PutObjectCommand(params);
        await s3Client.send(command);
        fotoUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_BUCKET_REGION}.amazonaws.com/${fileName}`;
    }

    // Agora, crie a entrada no banco de dados com a URL da foto (se houver)
    const novoCartao = await Card.create({
        nome,
        data,
        mensagem,
        youtubeVideoId,
        fotoUrl // Será a URL do S3 ou null
    });

    res.status(201).json(novoCartao);
};

/**
 * Busca um cartão específico pelo seu ID.
 */
const handleGetCard = async (req, res) => {
    const { id } = req.params;
    const card = await Card.findByPk(id);

    if (!card) {
        return res.status(404).json({ message: 'Cartão não encontrado.' });
    }

    res.status(200).json(card);
};

/**
 * Lista todos os cartões. (Opcional, mas útil para gerenciamento)
 */
const handleGetAllCards = async (req, res) => {
    const cards = await Card.findAll({ order: [['createdAt', 'DESC']] });
    res.status(200).json(cards);
};

/**
 * Atualiza um cartão. Se uma nova foto for enviada, apaga a antiga do S3.
 */
const handleUpdateCard = async (req, res) => {
    const { id } = req.params;
    const card = await Card.findByPk(id);

    if (!card) {
        return res.status(404).json({ message: 'Cartão não encontrado.' });
    }

    let fotoUrl = card.fotoUrl; // Mantém a URL antiga por padrão

    // Se uma nova foto foi enviada...
    if (req.file) {
        // ...primeiro, apague a foto antiga do S3, se ela existir.
        if (card.fotoUrl) {
            const oldKey = card.fotoUrl.split('.amazonaws.com/')[1];
            const deleteCommand = new DeleteObjectCommand({
                Bucket: process.env.AWS_BUCKET_NAME,
                Key: oldKey
            });
            await s3Client.send(deleteCommand);
        }

        // ...depois, faça o upload da nova foto.
        const fileName = `messagelove/foto-${Date.now()}-${req.file.originalname}`;
        const putCommand = new PutObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: fileName,
            Body: req.file.buffer,
            ContentType: req.file.mimetype
        });
        await s3Client.send(putCommand);
        fotoUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_BUCKET_REGION}.amazonaws.com/${fileName}`;
    }

    // Atualiza os dados do cartão no banco de dados
    const updatedCard = await card.update({ ...req.body, fotoUrl });
    res.status(200).json(updatedCard);
};

/**
 * Deleta um cartão e sua foto correspondente no S3.
 */
const handleDeleteCard = async (req, res) => {
    const { id } = req.params;
    const card = await Card.findByPk(id);

    if (!card) {
        return res.status(404).json({ message: 'Cartão não encontrado.' });
    }

    // Se o cartão tiver uma foto, apague-a do S3 primeiro
    if (card.fotoUrl) {
        const key = card.fotoUrl.split('.amazonaws.com/')[1];
        const command = new DeleteObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: key,
        });
        await s3Client.send(command);
    }

    // Agora, apague o registro do cartão do banco de dados
    await card.destroy();
    res.status(204).send(); // 204 No Content - sucesso, mas sem corpo de resposta
};


// 3. EXPORTAR TODAS AS FUNÇÕES
module.exports = {
    handleCreateCard,
    handleGetCard,
    handleGetAllCards,
    handleUpdateCard,
    handleDeleteCard
};