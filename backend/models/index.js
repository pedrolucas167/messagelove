'use strict';

const { Sequelize, DataTypes } = require('sequelize');
const User = require('./users'); 

// Pega a URL do banco de dados das variáveis de ambiente
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("A variável de ambiente DATABASE_URL não foi definida.");
}


const sequelize = new Sequelize(databaseUrl, {
    dialect: 'postgres',
    protocol: 'postgres',
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false 
        }
    },
    logging: false,
});

const db = {};


db.Card = require('./cards')(sequelize, DataTypes);
db.User = require('./users')(sequelize, DataTypes);

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;