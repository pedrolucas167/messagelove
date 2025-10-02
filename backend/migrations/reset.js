'use strict';
module.exports = {
  async up (q, Sequelize) {
    await q.createTable('password_reset_tokens', {
      id: { type: Sequelize.UUID, primaryKey: true, allowNull: false, defaultValue: Sequelize.fn('gen_random_uuid') },
      user_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' },
      token_hash: { type: Sequelize.STRING(128), allowNull: false }, // sha256 hex
      expires_at: { type: Sequelize.DATE, allowNull: false },
      used_at: { type: Sequelize.DATE, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('now') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('now') },
    });
    await q.addIndex('password_reset_tokens', ['user_id'], { name: 'idx_prt_user' });
    await q.addIndex('password_reset_tokens', ['token_hash'], { name: 'idx_prt_token_hash', unique: true });
  },
  async down (q) {
    await q.dropTable('password_reset_tokens');
  }
};
