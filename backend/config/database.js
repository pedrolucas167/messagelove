const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Define o caminho para o arquivo do banco de dados
const DB_PATH = path.join(__dirname, '..', 'data', 'cards.db');
const DB_DIR = path.dirname(DB_PATH);

// Garante que o diretório do banco de dados exista
const fs = require('fs');
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

// Cria e conecta ao banco de dados
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('DATABASE ERROR: Could not connect.', err.message);
    throw err;
  }
  console.log('DATABASE: Connected to SQLite successfully.');
});

// Cria a tabela 'cards' se ela não existir
db.run(`
  CREATE TABLE IF NOT EXISTS cards (
    id TEXT PRIMARY KEY,
    nome TEXT NOT NULL,
    data TEXT,
    mensagem TEXT NOT NULL,
    youtubeVideoId TEXT,
    fotoUrl TEXT,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP
  )
`, (err) => {
    if (err) {
        console.error('DATABASE ERROR: Could not create table.', err.message);
        throw err;
    }
    console.log('DATABASE: Table "cards" is ready.');
});


module.exports = db;