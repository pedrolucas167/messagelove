// Arquivo: models/index.js (Versão Refatorada)

'use strict';

'use strict';

const { Sequelize, DataTypes } = require('sequelize');

// Pega a URL do banco de dados das variáveis de ambiente
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("A variável de ambiente DATABASE_URL não foi definida.");
}

// Cria a instância do Sequelize diretamente da DATABASE_URL,
// que é a prática recomendada para ambientes como a Render.
const sequelize = new Sequelize(databaseUrl, {
    dialect: 'postgres',
    protocol: 'postgres',
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false // Necessário para a Render
        }
    },
    logging: false,
});

const db = {};

// Passa 'sequelize' e 'DataTypes' ao inicializar o modelo
db.Card = require('./card.js')(sequelize, DataTypes);
db.User = require('./user')(sequelize, DataTypes);

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;