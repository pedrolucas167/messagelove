// models/index.js
'use strict';

const { Sequelize, DataTypes } = require('sequelize');


const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('A variável de ambiente DATABASE_URL não foi definida.');
}

const isProd = (process.env.NODE_ENV || 'development') === 'production' || !!process.env.RENDER;
const useSSL = process.env.DB_SSL === 'true' || isProd;

const sequelize = new Sequelize(databaseUrl, {
  dialect: 'postgres',
  protocol: 'postgres',
  dialectOptions: useSSL
    ? { ssl: { require: true, rejectUnauthorized: false } }
    : {},
  logging: process.env.SEQUELIZE_LOGGING === 'true' ? console.log : false,
  pool: {
    max: Number(process.env.DB_POOL_MAX || 10),
    min: Number(process.env.DB_POOL_MIN || 0),
    acquire: Number(process.env.DB_POOL_ACQUIRE || 30000),
    idle: Number(process.env.DB_POOL_IDLE || 10000),
  },
});


const db = {};
db.sequelize = sequelize;
db.Sequelize = Sequelize;


db.User = require('./User')(sequelize, DataTypes);
db.Card = require('./Card')(sequelize, DataTypes);

// --- Associações ---
if (typeof db.User.associate === 'function') db.User.associate(db);
if (typeof db.Card.associate === 'function') db.Card.associate(db);


db.Op = Sequelize.Op;

module.exports = db;
