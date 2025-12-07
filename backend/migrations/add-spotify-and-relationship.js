"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    // Add spotify_uri column
    await queryInterface.addColumn("cards", "spotify_uri", {
      type: Sequelize.STRING(100),
      allowNull: true,
      defaultValue: null,
    });

    // Add relationship_date column
    await queryInterface.addColumn("cards", "relationship_date", {
      type: Sequelize.DATE,
      allowNull: true,
      defaultValue: null,
    });

    // Add music_type column to differentiate between YouTube and Spotify
    await queryInterface.addColumn("cards", "music_type", {
      type: Sequelize.STRING(20),
      allowNull: true,
      defaultValue: null,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("cards", "spotify_uri");
    await queryInterface.removeColumn("cards", "relationship_date");
    await queryInterface.removeColumn("cards", "music_type");
  },
};
