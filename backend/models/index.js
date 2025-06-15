// models/index.js

'use strict';

// 1. Importar DataTypes junto com Sequelize
const { Sequelize, DataTypes } = require('sequelize'); 

// Pega a URL do banco de dados das variáveis de ambiente
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("A variável de ambiente DATABASE_URL não foi definida.");
}

// Cria a instância do Sequelize com as configurações para o Render
const sequelize = new Sequelize(databaseUrl, {
    dialect: 'postgres',
    protocol: 'postgres',
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false
        }
    }
});

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

// 2. Passar o 'DataTypes' ao inicializar o modelo
db.Card = require('./card.js')(sequelize, DataTypes);

// Exporta o objeto db, pronto para ser usado no seu app
module.exports = db;