'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    const qi = queryInterface;
    const table = 'users';

    const desc = await qi.describeTable(table);

    if (desc.password_hash && !desc.password) {
      await qi.renameColumn(table, 'password_hash', 'password');
    }

    const hasName = desc.name;
    if (!hasName) {
      await qi.addColumn(table, 'name', {
        type: Sequelize.STRING(120),
        allowNull: false
      });
    }
  },

  async down (queryInterface, Sequelize) {
    // rollback (opcional): remover name e voltar password -> password_hash
    const qi = queryInterface;
    const table = 'users';
    const desc = await qi.describeTable(table);

    if (desc.name) {
      await qi.removeColumn(table, 'name');
    }
    const fresh = await qi.describeTable(table);
    if (fresh.password && !fresh.password_hash) {
      await qi.renameColumn(table, 'password', 'password_hash');
    }
  }
};
