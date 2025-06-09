// backend/services/cardService.js

// 1. Importar o modelo 'Card' do Sequelize, e não a conexão antiga.
const { Card } = require('../models');

// As funções agora serão 'async' para usar o Sequelize de forma moderna.

const createCard = async (cardData) => {
  // O Sequelize lida com a criação do ID e do createdAt/updatedAt automaticamente.
  const novoCartao = await Card.create({
    nome: cardData.nome,
    data: cardData.data || null,
    mensagem: cardData.mensagem,
    youtubeVideoId: cardData.youtubeVideoId || null,
    fotoUrl: cardData.fotoUrl || null,
  });
  return novoCartao;
};

const getCardById = async (id) => {
  const card = await Card.findByPk(id); // findByPk = "Find by Primary Key"
  return card;
};

const getAllCards = async () => {
  const cards = await Card.findAll({
    order: [['createdAt', 'DESC']] // Ordena pelos mais recentes
  });
  return cards;
};

const updateCard = async (id, cardData) => {
  const card = await Card.findByPk(id);
  if (!card) {
    return null; // Retorna nulo se o cartão não for encontrado
  }
  // O método 'update' do Sequelize altera apenas os campos fornecidos
  const updatedCard = await card.update(cardData);
  return updatedCard;
};

const deleteCard = async (id) => {
  const card = await Card.findByPk(id);
  if (!card) {
    return false; // Retorna falso se não havia nada para deletar
  }
  await card.destroy(); // Deleta a linha do banco de dados
  return true; // Retorna verdadeiro para indicar sucesso
};

module.exports = {
  createCard,
  getCardById,
  getAllCards,
  updateCard,
  deleteCard
};