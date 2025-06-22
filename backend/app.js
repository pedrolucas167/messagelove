require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
// ... outras importações

// Verificação explícita do authRoutes
const authRoutesPath = path.join(__dirname, 'routes', 'authroutes.js');
if (!fs.existsSync(authRoutesPath)) {
  console.error('Erro crítico: authroutes.js não encontrado em:', authRoutesPath);
  console.log('Arquivos encontrados na pasta routes:',
    fs.readdirSync(path.join(__dirname, 'routes')));
  process.exit(1);
}

// Importações corrigidas
const cardRoutes = require('./routes/cardRoutes');
const authRoutes = require('./routes/authroutes'); // Note o r minúsculo
const db = require('./models');

// ... resto do código permanece igual