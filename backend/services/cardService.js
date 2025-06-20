// backend/services/cardService.js

const { Card } = require('../models');
const { nanoid } = require('nanoid');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const sharp = require('sharp'); // NOVO: Importa a biblioteca de otimização

// O cliente S3 é configurado aqui, uma única vez.
const s3Client = new S3Client({ region: process.env.AWS_REGION });

/**
 * (NOVA FUNÇÃO AUXILIAR)
 * Otimiza uma imagem com Sharp e faz o upload para o S3.
 * @param {object} file - O objeto de arquivo do multer (req.file).
 * @returns {Promise<string|null>} A URL do arquivo no S3 ou null.
 */
async function uploadOptimizedPhoto(file) {
    if (!file) {
        return null; // Retorna nulo se não houver arquivo
    }

    console.log('Otimizando imagem e iniciando upload para o S3...');

    // Usa o sharp para redimensionar e converter a imagem para WebP
    const processedImageBuffer = await sharp(file.buffer)
        .resize({ width: 1200, height: 1200, fit: 'inside', withoutEnlargement: true }) // Redimensiona para no máximo 1200px
        .webp({ quality: 80 }) // Converte para o formato WebP com 80% de qualidade
        .toBuffer();

    const photoKey = `cards/${nanoid(12)}.webp`; // Salva sempre como .webp
    
    const command = new PutObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: photoKey,
        Body: processedImageBuffer, // Envia o buffer da imagem otimizada
        ContentType: 'image/webp',   // Define o tipo de conteúdo correto
    });

    await s3Client.send(command);
    const photoUrl = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${photoKey}`;
    
    console.log(`Foto otimizada enviada com sucesso para: ${photoUrl}`);
    return photoUrl;
}

/**
 * (FUNÇÃO REATORADA)
 * Cria um novo cartão, otimizando a foto se ela existir.
 * @param {object} cardData - Dados do cartão vindos do controller (req.body).
 * @param {object} file - O arquivo de foto opcional vindo do controller (req.file).
 * @returns {Promise<object>} O objeto do cartão criado.
 */
const createCard = async (cardData, file) => {
    // 1. Otimiza e faz o upload da foto primeiro
    const fotoUrl = await uploadOptimizedPhoto(file);

    // 2. Extrai os dados corretos do cardData
    const { de, para, mensagem, data, youtubeVideoId } = cardData;

    // 3. Grava tudo no banco de dados
    const novoCartao = await Card.create({
        de,
        para,
        mensagem,
        data: data || null,
        youtubeVideoId: youtubeVideoId || null,
        fotoUrl: fotoUrl, // Usa a URL da imagem otimizada (ou null)
    });

    return novoCartao;
};

// --- Funções existentes que permanecem iguais ---

const getCardById = async (id) => {
  const card = await Card.findByPk(id);
  return card;
};

const getAllCards = async () => {
  const cards = await Card.findAll({
    order: [['createdAt', 'DESC']]
  });
  return cards;
};

const updateCard = async (id, cardData) => {
  const card = await Card.findByPk(id);
  if (!card) return null;
  const updatedCard = await card.update(cardData);
  return updatedCard;
};

const deleteCard = async (id) => {
  const card = await Card.findByPk(id);
  if (!card) return false;
  await card.destroy();
  return true;
};

module.exports = {
  createCard,
  getCardById,
  getAllCards,
  updateCard,
  deleteCard
};