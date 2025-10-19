'use strict';
require('dotenv').config();


const fs = require('fs');
const path = require('path');
const { Sequelize, DataTypes } = require('sequelize');
const basename = path.basename(__filename);

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
  dialectOptions: process.env.DATABASE_URL?.includes('render.com') ? { ssl: { require: true } } : {}
});

const db = {};
fs.readdirSync(__dirname)
  .filter(f => f !== basename && f.endsWith('.js'))
  .forEach(f => {
    const model = require(path.join(__dirname, f))(sequelize, DataTypes);
    db[model.name] = model;
  });

Object.values(db).forEach(model => {
  if (typeof model.associate === 'function') model.associate(db);
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
