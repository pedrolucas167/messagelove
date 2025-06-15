// Arquivo: models/index.js

'use strict';

const { Sequelize, DataTypes } = require('sequelize');
const path = require('path'); // Adicionado para lidar com caminhos de arquivo
const process = require('process');
const env = process.env.NODE_ENV || 'development';

// CORRIGIDO: Usa path.join para encontrar o config.json de forma segura
const configPath = path.join(__dirname, '..', 'config', 'config.json');
const config = require(configPath)[env];

let sequelize;
if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  sequelize = new Sequelize(config.database, config.username, config.password, config);
}

const db = {};

// Passa 'sequelize' e 'DataTypes' ao inicializar o modelo
db.Card = require('./card.js')(sequelize, DataTypes);

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;