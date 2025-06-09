const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { Card } = require('../models');

const s3Client = new S3Client({
    region: process.env.AWS_BUCKET_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    }
});

const handleCreateCard = async (req, res) => {
    // Adicionamos um try...catch aqui dentro para um erro mais detalhado
    try {
        console.log("--- CONTROLLER INICIADO ---");
        console.log("req.body recebido:", req.body);
        console.log("req.file recebido:", req.file ? req.file.originalname : "Nenhum arquivo");

        const { nome, data, mensagem, youtubeVideoId } = req.body;
        let fotoUrl = null;

        if (req.file) {
            console.log("Iniciando upload para o S3...");
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
            console.log("Upload para o S3 concluído com sucesso. URL:", fotoUrl);
        }

        console.log("Iniciando criação no banco de dados...");
        const novoCartao = await Card.create({
            nome,
            data: data || null, // Garante que a data seja nula se vazia
            mensagem,
            youtubeVideoId,
            fotoUrl
        });
        console.log("Registro criado no banco de dados com sucesso.");

        res.status(201).json(novoCartao);

    } catch (error) {
        // Este log vai nos dar o erro exato do S3 ou do Sequelize
        console.error("### ERRO DETALHADO NO CONTROLLER ###:", error);
        res.status(500).send("Internal Server Error");
    }
};

// ... suas outras funções de controller (handleGetCard, etc.) ...

module.exports = {
    handleCreateCard,
    // ... exporte as outras funções aqui ...
};