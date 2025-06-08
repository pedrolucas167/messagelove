require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cardRoutes = require('./routes/cardRoutes');
const db = require('./models'); // <-- Importa a configuração do banco!

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.send('API do MessageLove está funcionando!');
});
app.use('/api', cardRoutes);

const startServer = async () => {
    try {
        // O `db.sequelize.sync()` lê todos os seus modelos e cria as tabelas
        // no banco de dados se elas não existirem.
        await db.sequelize.sync();
        console.log('Banco de dados sincronizado e conexão estabelecida.');

        app.listen(PORT, () => {
            console.log(`Servidor rodando na porta ${PORT}`);
        });
    } catch (error) {
        console.error('Não foi possível iniciar o servidor:', error);
        process.exit(1);
    }
};

startServer();