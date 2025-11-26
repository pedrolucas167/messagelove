'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    const qi = queryInterface;
    const table = 'users';

    const desc = await qi.describeTable(table);

    // Add google_id column if it doesn't exist
    if (!desc.google_id) {
      await qi.addColumn(table, 'google_id', {
        type: Sequelize.STRING(255),
        allowNull: true,
        unique: true
      });
    }

    // Make password nullable for OAuth users
    if (desc.password && desc.password.allowNull === false) {
      await qi.changeColumn(table, 'password', {
        type: Sequelize.STRING,
        allowNull: true
      });
    }
  },

  async down (queryInterface, Sequelize) {
    const qi = queryInterface;
    const table = 'users';
    const desc = await qi.describeTable(table);

    if (desc.google_id) {
      await qi.removeColumn(table, 'google_id');
    }

    // Revert password to NOT NULL (may fail if there are NULL values)
    if (desc.password) {
      await qi.changeColumn(table, 'password', {
        type: Sequelize.STRING,
        allowNull: false
      });
    }
  }
};
