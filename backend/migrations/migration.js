'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // users
    await queryInterface.createTable('users', {
      id: { type: Sequelize.UUID, primaryKey: true, allowNull: false, defaultValue: Sequelize.fn('gen_random_uuid') },
      email: { type: Sequelize.STRING, allowNull: false, unique: true },
      password_hash: { type: Sequelize.STRING, allowNull: false },
      email_verified_at: { type: Sequelize.DATE, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('now') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('now') },
    });
    await queryInterface.addIndex('users', ['email'], { name: 'idx_users_email' });

    // sessions (se o seu código usa)
    await queryInterface.createTable('sessions', {
      id: { type: Sequelize.UUID, primaryKey: true, allowNull: false, defaultValue: Sequelize.fn('gen_random_uuid') },
      user_id: { type: Sequelize.UUID, allowNull: false,
        references: { model: 'users', key: 'id' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' },
      token: { type: Sequelize.STRING, allowNull: false, unique: true },
      expires_at: { type: Sequelize.DATE, allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('now') },
    });
    await queryInterface.addIndex('sessions', ['user_id'], { name: 'idx_sessions_user_id' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('sessions');
    await queryInterface.dropTable('users');
  }
};
