
const { Sequelize, DataTypes } = require('sequelize');
require('dotenv').config();

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('DATABASE_URL não definida');
  process.exit(1);
}

const sequelize = new Sequelize(databaseUrl, {
  dialect: 'postgres',
  dialectOptions: {
    ssl: process.env.NODE_ENV === 'production' ? { require: true, rejectUnauthorized: false } : false,
  },
  logging: console.log,
});

async function up() {
  const queryInterface = sequelize.getQueryInterface();

  console.log('Adicionando novos campos à tabela cards...');

  // YouTube end time
  await queryInterface.addColumn('cards', 'youtube_end_time', {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: null,
  }).catch(() => console.log('youtube_end_time já existe'));

  // YouTube autoplay
  await queryInterface.addColumn('cards', 'youtube_autoplay', {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: false,
  }).catch(() => console.log('youtube_autoplay já existe'));

  // Spotify URI
  await queryInterface.addColumn('cards', 'spotify_uri', {
    type: DataTypes.STRING(100),
    allowNull: true,
    defaultValue: null,
  }).catch(() => console.log('spotify_uri já existe'));

  // Music type (enum: youtube/spotify)
  await sequelize.query(`
    DO $$ BEGIN
      CREATE TYPE music_type_enum AS ENUM ('youtube', 'spotify');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `);

  await queryInterface.addColumn('cards', 'music_type', {
    type: DataTypes.ENUM('youtube', 'spotify'),
    allowNull: true,
    defaultValue: null,
  }).catch(() => console.log('music_type já existe'));

  // Relationship date
  await queryInterface.addColumn('cards', 'relationship_date', {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: null,
  }).catch(() => console.log('relationship_date já existe'));

  // Selected animal
  await queryInterface.addColumn('cards', 'selected_animal', {
    type: DataTypes.STRING(20),
    allowNull: true,
    defaultValue: null,
  }).catch(() => console.log('selected_animal já existe'));

  // Selected GIF
  await queryInterface.addColumn('cards', 'selected_gif', {
    type: DataTypes.TEXT,
    allowNull: true,
    defaultValue: null,
  }).catch(() => console.log('selected_gif já existe'));

  // Selected emoji
  await queryInterface.addColumn('cards', 'selected_emoji', {
    type: DataTypes.STRING(10),
    allowNull: true,
    defaultValue: null,
  }).catch(() => console.log('selected_emoji já existe'));

  console.log('✅ Migração concluída com sucesso!');
}

async function down() {
  const queryInterface = sequelize.getQueryInterface();

  console.log('Removendo campos adicionados...');

  await queryInterface.removeColumn('cards', 'youtube_end_time').catch(() => {});
  await queryInterface.removeColumn('cards', 'youtube_autoplay').catch(() => {});
  await queryInterface.removeColumn('cards', 'spotify_uri').catch(() => {});
  await queryInterface.removeColumn('cards', 'music_type').catch(() => {});
  await queryInterface.removeColumn('cards', 'relationship_date').catch(() => {});
  await queryInterface.removeColumn('cards', 'selected_animal').catch(() => {});
  await queryInterface.removeColumn('cards', 'selected_gif').catch(() => {});
  await queryInterface.removeColumn('cards', 'selected_emoji').catch(() => {});

  console.log('✅ Rollback concluído!');
}

async function run() {
  const action = process.argv[2] || 'up';
  
  try {
    await sequelize.authenticate();
    console.log('Conectado ao banco de dados.');

    if (action === 'up') {
      await up();
    } else if (action === 'down') {
      await down();
    } else {
      console.log('Uso: node add-enhanced-card-fields.js [up|down]');
    }
  } catch (error) {
    console.error('Erro na migração:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

run();
