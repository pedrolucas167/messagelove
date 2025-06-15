const { Sequelize } = require('sequelize');

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

// Cria um objeto para guardar nossos modelos e a conexão
const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Importa nosso modelo Card e o inicializa com a conexão
db.Card = require('./card.js')(sequelize);

// Exporta o objeto db, que agora contém tudo que precisamos
module.exports = db;