'use strict';

module.exports = {
  async up (q, Sequelize) {
    await q.createTable('cards', {
      id: { type: Sequelize.UUID, primaryKey: true, allowNull: false, defaultValue: Sequelize.fn('gen_random_uuid') },
      user_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'users', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      de: { type: Sequelize.STRING(120), allowNull: false },
      para: { type: Sequelize.STRING(120), allowNull: false },
      mensagem: { type: Sequelize.TEXT, allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('now') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('now') }
    });
    await q.addIndex('cards', ['user_id'], { name: 'idx_cards_user_id' });
  },

  async down (q) {
    await q.dropTable('cards');
  }
};
