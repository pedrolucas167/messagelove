// Arquivo: models/card.js

'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Card extends Model {}
  Card.init({
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
    },
    // ---- VERIFICAÇÃO CRÍTICA ----
    // Garanta que os campos abaixo substituíram o campo 'nome'.
    de: {
      type: DataTypes.STRING,
      allowNull: false
    },
    para: {
      type: DataTypes.STRING,
      allowNull: false
    },
    // ----------------------------
    mensagem: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    fotoUrl: {
      type: DataTypes.STRING,
      allowNull: true
    },
    youtubeVideoId: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'Card',
  });
  return Card;
};
