const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { nanoid } = require('nanoid');
const sharp = require('sharp');
const logger = require('../config/logger');

const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

/**
 * Otimiza uma imagem com Sharp e faz o upload para o S3.
 * @param {object} file - O objeto de arquivo do multer (req.file).
 * @returns {Promise<string|null>} A URL do arquivo no S3 ou null se não houver arquivo.
 * @throws {Error} Se ocorrer erro no processamento ou upload.
 */
async function uploadOptimizedPhoto(file) {
    if (!file) return null;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
        throw new Error('Tipo de arquivo não suportado. Use apenas JPEG, PNG ou WebP.');
    }

    try {
        logger.info('Otimizando imagem e iniciando upload para o S3', { fileName: file.originalname });
        const processedImageBuffer = await sharp(file.buffer)
            .resize({ width: 1200, height: 1200, fit: 'inside', withoutEnlargement: true })
            .webp({ quality: 80 })
            .toBuffer();

        const fileKey = `cards/${nanoid(12)}.webp`;
        const command = new PutObjectCommand({
            Bucket: process.env.S3_BUCKET_NAME,
            Key: fileKey,
            Body: processedImageBuffer,
            ContentType: 'image/webp'
        });

        await s3Client.send(command);
        const photoUrl = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileKey}`;
        logger.info('Foto otimizada enviada com sucesso', { photoUrl, fileName: file.originalname });
        return photoUrl;
    } catch (error) {
        logger.error('Erro no upload para S3', { error: error.message, fileName: file.originalname });
        throw new Error('Falha ao processar ou enviar a imagem para o S3.');
    }
}

/**
 * Faz upload de um arquivo genérico para o S3 (sem otimização).
 * @param {object} file - O objeto de arquivo do multer (req.file).
 * @returns {Promise<string|null>} A URL do arquivo no S3 ou null se não houver arquivo.
 * @throws {Error} Se ocorrer erro no upload.
 */
async function uploadFile(file) {
    if (!file) return null;

    try {
        const extension = file.originalname.split('.').pop().toLowerCase();
        const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp'];
        if (!allowedExtensions.includes(extension)) {
            throw new Error('Extensão de arquivo não suportada. Use apenas JPG, JPEG, PNG ou WebP.');
        }

        logger.info('Iniciando upload de arquivo para o S3', { fileName: file.originalname });
        const fileKey = `cards/${nanoid(12)}.${extension}`;
        const command = new PutObjectCommand({
            Bucket: process.env.S3_BUCKET_NAME,
            Key: fileKey,
            Body: file.buffer,
            ContentType: file.mimetype
        });

        await s3Client.send(command);
        const fileUrl = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileKey}`;
        logger.info('Arquivo enviado com sucesso', { fileUrl, fileName: file.originalname });
        return fileUrl;
    } catch (error) {
        logger.error('Erro no upload para S3', { error: error.message, fileName: file.originalname });
        throw new Error('Falha ao enviar o arquivo para o S3.');
    }
}

module.exports = {
    uploadFile,
    uploadOptimizedPhoto
};