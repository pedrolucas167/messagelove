// Arquivo: models/card.js

'use strict';
const { Model } = require('sequelize');

// A função recebe 'sequelize' e 'DataTypes' como argumentos
module.exports = (sequelize, DataTypes) => {
  class Card extends Model {
    static associate(models) {
      // Defina associações aqui, se houver.
    }
  }
  Card.init({
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
    },
    de: {
      type: DataTypes.STRING,
      allowNull: false
    },
    para: {
      type: DataTypes.STRING,
      allowNull: false
    },
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