"use strict";

/**
 * Migration to add audio support to cards table
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Check if columns exist before adding them
    const tableDesc = await queryInterface.describeTable("cards");

    if (!tableDesc.audio_url) {
      await queryInterface.addColumn("cards", "audio_url", {
        type: Sequelize.TEXT,
        allowNull: true,
        defaultValue: null,
      });
    }

    if (!tableDesc.audio_duration) {
      await queryInterface.addColumn("cards", "audio_duration", {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: null,
      });
    }

    console.log("✅ Audio columns added to cards table");
  },

  async down(queryInterface) {
    const tableDesc = await queryInterface.describeTable("cards");

    if (tableDesc.audio_url) {
      await queryInterface.removeColumn("cards", "audio_url");
    }

    if (tableDesc.audio_duration) {
      await queryInterface.removeColumn("cards", "audio_duration");
    }

    console.log("✅ Audio columns removed from cards table");
  },
};
