const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();

// Configurações
app.use(cors()); // Permite requisições do frontend
app.use(express.json()); // Lê JSON no corpo das requisições

// Banco temporário em memória (substituiremos por Firebase/Supabase)
const database = {};

// Rota para criar um cartão
app.post('/api/cards', (req, res) => {
  const { nome, data, mensagem, spotify, fotoUrl, mp3Url } = req.body;
  const id = uuidv4(); // Gera um ID único

  // Salva o cartão no "banco" temporário
  database[id] = { nome, data, mensagem, spotify, fotoUrl, mp3Url };

  // Retorna o link único (ajustado para o frontend)
  res.json({ link: `http://localhost:3000/card.html?id=${id}` });
});

// Rota para buscar um cartão
app.get('/api/cards/:id', (req, res) => {
  const card = database[req.params.id];

  if (card) {
    res.json(card);
  } else {
    res.status(404).json({ error: 'Cartão não encontrado' });
  }
});

// Iniciar servidor
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 Backend rodando em http://localhost:${PORT}`);
});