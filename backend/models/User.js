'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      User.hasMany(models.Card, {
        as: 'cards',
        foreignKey: 'userId',
        sourceKey: 'id',
        onDelete: 'CASCADE',
        hooks: true
      });
    }

    // Evita vazar password em JSON
    toJSON() {
      const values = { ...this.get() };
      delete values.password;
      return values;
    }
  }

  User.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING(254),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: { msg: 'Email inválido.' },
        notEmpty: { msg: 'Email é obrigatório.' }
      },
      set(v) {
        this.setDataValue('email', (v || '').toLowerCase().trim());
      }
    },
    password: {
      type: DataTypes.STRING, // hash bcrypt
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Senha é obrigatória.' },
        len: { args: [8, 255], msg: 'Senha deve ter pelo menos 8 caracteres.' }
      }
    },
    name: {
      type: DataTypes.STRING(120),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Nome é obrigatório.' }
      }
    }
  }, {
    sequelize,
    modelName: 'User',
    tableName: 'users',         // <- minúsculo e estável
    timestamps: true,
    underscored: true,         
    defaultScope: {
      attributes: { exclude: ['password'] }
    },
    indexes: [
      { unique: true, fields: ['email'] }
    ]
  });

  return User;
};
