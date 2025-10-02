'use strict';

module.exports = (sequelize, DataTypes) => {
  const Card = sequelize.define('Card', {
    id: { type: DataTypes.UUID, allowNull: false, primaryKey: true, defaultValue: sequelize.literal('gen_random_uuid()') },
    userId: { type: DataTypes.UUID, allowNull: false, field: 'user_id' },
    de: { type: DataTypes.STRING(120), allowNull: false },
    para: { type: DataTypes.STRING(120), allowNull: false },
    mensagem: { type: DataTypes.TEXT, allowNull: false },
    fotoUrl: { type: DataTypes.TEXT, allowNull: true, field: 'foto_url', defaultValue: null },
    youtubeVideoId: { type: DataTypes.STRING(32), allowNull: true, field: 'youtube_video_id', defaultValue: null },
    youtubeStartTime: { type: DataTypes.INTEGER, allowNull: true, field: 'youtube_start_time', defaultValue: null }
  }, {
    tableName: 'cards',
    modelName: 'Card',
    underscored: true,
    timestamps: true
  });

  Card.associate = (models) => {
    Card.belongsTo(models.User, { as: 'user', foreignKey: 'userId', targetKey: 'id', onDelete: 'CASCADE' });
  };

  return Card;
};
