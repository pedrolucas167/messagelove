// backend/models/Card.js
'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Card extends Model {
    static associate(models) {
      Card.belongsTo(models.User, {
        as: 'user',
        foreignKey: 'userId',
        targetKey: 'id',
        onDelete: 'CASCADE'
      });
    }
  }

  Card.init({
    id: {
      type: DataTypes.STRING(10),
      primaryKey: true,
      allowNull: false
    },
    de: { type: DataTypes.STRING(120), allowNull: false },
    para: { type: DataTypes.STRING(120), allowNull: false },
    mensagem: { type: DataTypes.TEXT, allowNull: false },
    fotoUrl: { type: DataTypes.STRING, allowNull: true, field: 'foto_url' },
    youtubeVideoId: { type: DataTypes.STRING, allowNull: true, field: 'youtube_video_id' },
    youtubeStartTime: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0, field: 'youtube_start_time' },
    userId: { type: DataTypes.UUID, allowNull: false, field: 'user_id' }
  }, {
    sequelize,
    modelName: 'Card',
    tableName: 'cards',
    timestamps: true,
    underscored: true
  });

  return Card;
};
