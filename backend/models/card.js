const { DataTypes } = require('sequelize');

// Exportamos uma função que define o modelo
// e que recebe a instância do sequelize como argumento
module.exports = (sequelize) => {
  const Card = sequelize.define('Card', {
    id: {
      type: DataTypes.UUID, // Um tipo de ID universal e único, melhor prática
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    nome: {
      type: DataTypes.STRING,
      allowNull: false
    },
    data: {
      type: DataTypes.DATEONLY // Armazena apenas a data, sem hora
    },
    mensagem: {
      type: DataTypes.TEXT, // Melhor para textos longos
      allowNull: false
    },
    youtubeVideoId: {
      type: DataTypes.STRING,
      allowNull: true
    },
    fotoUrl: {
      type: DataTypes.STRING,
      allowNull: true
    }
    // O Sequelize já cria os campos `createdAt` e `updatedAt` automaticamente
  }, {
    tableName: 'cards' // Força o nome da tabela a ser 'cards'
  });

  return Card;
};