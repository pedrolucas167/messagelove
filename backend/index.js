const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Configurar CORS
const frontendUrl = process.env.FRONTEND_URL;
if (!frontendUrl) {
  console.error('FRONTEND_URL não definido no .env. Usando valor padrão temporário.');
}
app.use(cors({ 
  origin: frontendUrl || 'https://messagelove-frontend.vercel.app',
  credentials: true,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Accept']
}));
console.log('CORS configurado para:', frontendUrl || 'https://messagelove-frontend.vercel.app');
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos (para fotos)
app.use('/uploads', express.static('uploads'));

// Rotas
const spotifyRoutes = require('./routes/spotify');
const cardsRoutes = require('./routes/cards');
app.use('/api/spotify', spotifyRoutes);
app.use('/api/cards', cardsRoutes);

app.get('/api/status', (req, res) => {
  res.json({ status: 'API is running' });
});

app.get('/card/:id', (req, res) => {
  const { id } = req.params;
  res.redirect(`${process.env.FRONTEND_URL || 'https://messagelove-frontend.vercel.app'}/card/${id}`);
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});