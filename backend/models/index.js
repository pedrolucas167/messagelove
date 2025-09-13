'use strict';

const { Sequelize, DataTypes } = require('sequelize');

// Carrega a URL do banco de dados das variáveis de ambiente
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

// Inicializa os modelos
const db = {};

db.User = require('./user')(sequelize, DataTypes);
db.Card = require('./card')(sequelize, DataTypes);

// Define associações
if (db.User.associate) db.user.associate(db);
if (db.Card.associate) db.card.associate(db);

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
