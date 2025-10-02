'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'name', {
      type: Sequelize.STRING,
      allowNull: true   
    });
  },

  async down (queryInterface) {
    await queryInterface.removeColumn('users', 'name');
  }
};
