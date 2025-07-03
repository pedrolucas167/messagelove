const { Card } = require('../models');
const { nanoid } = require('nanoid');
const { uploadOptimizedPhoto } = require('./s3Service');
const logger = require('../config/logger');

/**
 * Cria um novo cartão, otimizando a foto se ela existir.
 * @param {object} cardData - Dados do cartão (de, para, mensagem, youtubeVideoId, youtubeStartTime).
 * @param {object} file - O arquivo de foto opcional (req.file).
 * @param {string} userId - ID do usuário autenticado.
 * @returns {Promise<object>} O objeto do cartão criado com ID.
 * @throws {Error} Se os dados forem inválidos ou a criação falhar.
 */
async function createCard(cardData, file, userId) {
    if (!userId) throw new Error('ID do usuário é obrigatório.');
    if (!cardData.de || !cardData.para || !cardData.mensagem) {
        throw new Error('Campos de, para e mensagem são obrigatórios.');
    }

    try {
        logger.info('Iniciando criação de cartão', { userId, cardData });
        const fotoUrl = await uploadOptimizedPhoto(file);
        const novoCartao = await Card.create({
            id: nanoid(10),
            de: cardData.de,
            para: cardData.para,
            mensagem: cardData.mensagem,
            fotoUrl,
            youtubeVideoId: cardData.youtubeVideoId || null,
            youtubeStartTime: parseInt(cardData.youtubeStartTime, 10) || 0,
            userId // Usa o userId fornecido, sem criar novo User
        });
        logger.info('Cartão criado com sucesso', { cardId: novoCartao.id, userId });
        return novoCartao;
    } catch (error) {
        logger.error('Falha ao criar cartão', { error: error.message, userId, stack: error.stack });
        throw error;
    }
}

/**
 * Busca um cartão por ID.
 * @param {string} id - ID do cartão.
 * @returns {Promise<object|null>} O cartão encontrado ou null.
 */
async function getCardById(id) {
    try {
        const card = await Card.findByPk(id);
        return card;
    } catch (error) {
        logger.error('Falha ao buscar cartão por ID', { id, error: error.message });
        throw error;
    }
}

module.exports = {
    createCard,
    getCardById
};