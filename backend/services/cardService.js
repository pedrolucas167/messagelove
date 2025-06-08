const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');

const createCard = (cardData) => {
  return new Promise((resolve, reject) => {
    const newCard = {
      id: uuidv4(),
      nome: cardData.nome,
      data: cardData.data || null,
      mensagem: cardData.mensagem,
      youtubeVideoId: cardData.youtubeVideoId || null,
      fotoUrl: cardData.fotoUrl || null,
      createdAt: new Date().toISOString(),
    };
    const sql = `INSERT INTO cards (id, nome, data, mensagem, youtubeVideoId, fotoUrl, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)`;
    const params = [newCard.id, newCard.nome, newCard.data, newCard.mensagem, newCard.youtubeVideoId, newCard.fotoUrl, newCard.createdAt];
    db.run(sql, params, function (err) {
      if (err) return reject(new Error('Failed to create card.'));
      resolve(newCard);
    });
  });
};

const getCardById = (id) => {
  return new Promise((resolve, reject) => {
    const sql = "SELECT * FROM cards WHERE id = ?";
    db.get(sql, [id], (err, row) => {
      if (err) return reject(new Error('Failed to fetch card.'));
      resolve(row);
    });
  });
};

const getAllCards = () => {
  return new Promise((resolve, reject) => {
    const sql = "SELECT * FROM cards ORDER BY createdAt DESC";
    db.all(sql, [], (err, rows) => {
      if (err) return reject(new Error('Failed to fetch cards.'));
      resolve(rows);
    });
  });
};

const updateCard = (id, cardData) => {
  return new Promise((resolve, reject) => {
    const { nome, data, mensagem, youtubeVideoId, fotoUrl } = cardData;
    const sql = `UPDATE cards SET nome = ?, data = ?, mensagem = ?, youtubeVideoId = ?, fotoUrl = ? WHERE id = ?`;
    const params = [nome, data, mensagem, youtubeVideoId, fotoUrl, id];
    db.run(sql, params, function (err) {
      if (err) return reject(new Error('Failed to update card.'));
      if (this.changes === 0) return resolve(null);
      resolve(getCardById(id));
    });
  });
};

const deleteCard = (id) => {
  return new Promise((resolve, reject) => {
    const sql = 'DELETE FROM cards WHERE id = ?';
    db.run(sql, [id], function (err) {
      if (err) return reject(new Error('Failed to delete card.'));
      resolve(this.changes > 0);
    });
  });
};

module.exports = {
  createCard,
  getCardById,
  getAllCards,
  updateCard,
  deleteCard
};