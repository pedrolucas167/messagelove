// ... (funções createCard e getCardById existentes) ...

/**
 * Atualiza um cartão existente no banco de dados.
 * @param {string} id - O ID do cartão a ser atualizado.
 * @param {object} cardData - Os novos dados para o cartão.
 * @returns {Promise<object>} O objeto do cartão atualizado.
 */
const updateCard = (id, cardData) => {
  return new Promise((resolve, reject) => {
    // Pega apenas os campos que podem ser atualizados para evitar sobrescrever o ID ou createdAt
    const { nome, data, mensagem, youtubeVideoId, fotoUrl } = cardData;

    const sql = `
      UPDATE cards 
      SET nome = ?, data = ?, mensagem = ?, youtubeVideoId = ?, fotoUrl = ?
      WHERE id = ?
    `;
    const params = [nome, data, mensagem, youtubeVideoId, fotoUrl, id];

    db.run(sql, params, function (err) {
      if (err) {
        console.error('DATABASE ERROR:', err.message);
        return reject(new Error('Failed to update card.'));
      }
      // a propriedade 'this.changes' indica se alguma linha foi alterada
      if (this.changes === 0) {
        return resolve(null); // Retorna null se nenhum card com o ID foi encontrado
      }
      console.log(`SERVICE: Card updated in DB with ID: ${id}`);
      // Após atualizar, buscamos o card com os novos dados para retornar ao cliente
      resolve(getCardById(id));
    });
  });
};


/**
 * Deleta um cartão do banco de dados.
 * @param {string} id - O ID do cartão a ser deletado.
 * @returns {Promise<boolean>} Retorna true se deletado com sucesso, false caso contrário.
 */
const deleteCard = (id) => {
  return new Promise((resolve, reject) => {
    const sql = 'DELETE FROM cards WHERE id = ?';

    db.run(sql, [id], function (err) {
      if (err) {
        console.error('DATABASE ERROR:', err.message);
        return reject(new Error('Failed to delete card.'));
      }
      // 'this.changes' será 1 se o card foi deletado, 0 se não foi encontrado
      if (this.changes > 0) {
        console.log(`SERVICE: Card deleted from DB with ID: ${id}`);
        resolve(true);
      } else {
        resolve(false);
      }
    });
  });
};


module.exports = {
  createCard,
  getCardById,
  updateCard, // exportar a nova função
  deleteCard, // exportar a nova função
};

// ...
const getAllCards = () => {
  return new Promise((resolve, reject) => {
    const sql = "SELECT * FROM cards ORDER BY createdAt DESC"; // Ordena pelos mais recentes
    db.all(sql, [], (err, rows) => {
      if (err) {
        console.error('DATABASE ERROR:', err.message);
        return reject(new Error('Failed to fetch cards.'));
      }
      resolve(rows);
    });
  });
};

module.exports = {
  // ... funcs existentes
  getAllCards, // exporta a nova função
};