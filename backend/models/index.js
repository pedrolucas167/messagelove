// Arquivo: models/index.js

'use strict';

const { Sequelize, DataTypes } = require('sequelize');

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

db.User = require('./Users')(sequelize, DataTypes);
db.Card = require('./card')(sequelize, DataTypes);

if (db.User.associate) db.User.associate(db);
if (db.Card.associate) db.Card.associate(db);

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
