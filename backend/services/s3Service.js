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