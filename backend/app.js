// 1. CARREGAR VARIÁVEIS DE AMBIENTE
// Coloque esta linha no topo de tudo para garantir que as variáveis do .env sejam carregadas
require('dotenv').config();

// 2. IMPORTAR AS DEPENDÊNCIAS
const express = require('express');
const cors = require('cors');

// Importa o nosso novo arquivo de rotas
const cardRoutes = require('./routes/cardRoutes'); 

// 3. INICIALIZAR A APLICAÇÃO EXPRESS
const app = express();
const PORT = process.env.PORT || 3001;

// 4. CONFIGURAR OS MIDDLEWARES
// Habilita o CORS para permitir que seu frontend (em outra URL) acesse esta API
app.use(cors());

// Permite que o Express entenda requisições com corpo no formato JSON
app.use(express.json());

// Permite que o Express entenda requisições com corpos vindos de formulários
app.use(express.urlencoded({ extended: true }));


// 5. DEFINIR AS ROTAS DA APLICAÇÃO
// Rota de "saúde" para verificar se o servidor está no ar
app.get('/', (req, res) => {
    res.send('API do MessageLove está funcionando!');
});

// AQUI ESTÁ A MÁGICA:
// Dizemos ao Express para usar nosso arquivo de rotas para qualquer requisição que comece com '/api'
app.use('/api', cardRoutes);


// 6. INICIAR O SERVIDOR
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});