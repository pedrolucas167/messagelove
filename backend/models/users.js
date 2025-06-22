// /backend/models/users.js - VERSÃO CORRIGIDA

'use strict';
const { Model } = require('sequelize');

// A mágica está aqui: exportamos uma função que recebe os argumentos do index.js
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    // Se você tiver associações, elas vêm aqui.
    static associate(models) {
      // Exemplo: User.hasMany(models.Card, { foreignKey: 'userId' });
    }
  }

  // Usamos User.init para definir o modelo
  User.init({
    // Suas colunas exatamente como estavam:
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: { isEmail: true },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  }, {
    // Suas opções exatamente como estavam:
    sequelize, 
    modelName: 'User',
    timestamps: true,
    tableName: 'Users',
  });

  return User;
};