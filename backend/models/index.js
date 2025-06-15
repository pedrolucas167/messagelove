// Arquivo: models/index.js

'use strict';

// 1. Importar DataTypes junto com Sequelize
const { Sequelize, DataTypes } = require('sequelize');
const process = require('process');
const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/../config/config.json')[env];

let sequelize;
if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  sequelize = new Sequelize(config.database, config.username, config.password, config);
}

const db = {};

// 2. Passar o 'DataTypes' ao inicializar o modelo
// Esta é a correção principal: passamos (sequelize, DataTypes)
db.Card = require('./card.js')(sequelize, DataTypes);

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
