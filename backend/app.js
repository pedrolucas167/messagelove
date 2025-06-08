// 1. CARREGAR VARIÁVEIS DE AMBIENTE (essencial que seja a primeira linha)
require('dotenv').config();

// 2. IMPORTAR AS DEPENDÊNCIAS
const express = require('express');
const cors = require('cors');
const { Sequelize } = require('sequelize'); // <-- Importa o Sequelize

// Importa o nosso arquivo de rotas
const cardRoutes = require('./routes/cardRoutes');

// 3. INICIALIZAR A APLICAÇÃO EXPRESS
const app = express();
const PORT = process.env.PORT || 3001;

// --- NOVA SEÇÃO: CONFIGURAÇÃO DO BANCO DE DADOS ---
// Pega a URL de conexão do banco de dados das variáveis de ambiente
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
    throw new Error("A variável de ambiente DATABASE_URL não foi definida.");
}

// Cria uma nova instância do Sequelize para se conectar ao banco
const sequelize = new Sequelize(databaseUrl, {
    dialect: 'postgres',
    protocol: 'postgres',
    // Opções de conexão SSL - ESSENCIAL para o Render.com e outras nuvens
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false // Necessário para evitar erros de certificado no Render
        }
    }
});
// ----------------------------------------------------

// 4. CONFIGURAR OS MIDDLEWARES (sem alterações aqui)
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 5. DEFINIR AS ROTAS DA APLICAÇÃO (sem alterações aqui)
app.get('/', (req, res) => {
    res.send('API do MessageLove está funcionando!');
});
app.use('/api', cardRoutes);

// --- NOVA SEÇÃO: FUNÇÃO PARA INICIAR O SERVIDOR ---
const startServer = async () => {
    try {
        // Tenta autenticar a conexão com o banco de dados
        await sequelize.authenticate();
        console.log('Conexão com o banco de dados (PostgreSQL) estabelecida com sucesso.');

        // Se a conexão for bem-sucedida, inicia o servidor Express
        app.listen(PORT, () => {
            console.log(`Servidor rodando na porta ${PORT}`);
        });

    } catch (error) {
        console.error('Não foi possível conectar ao banco de dados:', error);
        process.exit(1); // Encerra o processo se não conseguir conectar
    }
};

// 6. INICIAR O SERVIDOR CHAMANDO A NOVA FUNÇÃO
startServer();