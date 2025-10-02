'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      this.hasMany(models.Card, { as: 'cards', foreignKey: 'userId', sourceKey: 'id', onDelete: 'CASCADE' });
    }
    toJSON() { const v = { ...this.get() }; delete v.password; return v; }
  }

  User.init({
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true, allowNull: false },
    email: { type: DataTypes.STRING(254), allowNull: false, unique: true },
    password: { type: DataTypes.STRING, allowNull: false },
    name: { type: DataTypes.STRING(120), allowNull: false }
  }, {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    underscored: true,
    timestamps: true,
    defaultScope: { attributes: { exclude: ['password'] } }
  });

  return User;
};
