const express = require('express');
const router = express.Router();
const cardController = require('../controllers/cardController');
const asyncHandler = require('../middleware/asyncHandler');
// cardCreationValidators agora pode ser usado para o Update também
const { cardCreationValidators, cardIdValidator } = require('../middleware/validators');

// Rota para criar um novo cartão
// POST /api/cards
router.post('/cards', cardCreationValidators, asyncHandler(cardController.handleCreateCard));

// Rota para obter dados de um cartão
// GET /api/card/:id
router.get('/card/:id', cardIdValidator, asyncHandler(cardController.handleGetCard));

// Rota para atualizar um cartão existente
// PUT /api/card/:id
router.put('/card/:id', cardIdValidator, cardCreationValidators, asyncHandler(cardController.handleUpdateCard));

// Rota para deletar um cartão
// DELETE /api/card/:id
router.delete('/card/:id', cardIdValidator, asyncHandler(cardController.handleDeleteCard));

module.exports = router;


// GET /api/cards - Rota para listar todos os cartões
router.get('/cards', asyncHandler(cardController.handleGetAllCards));

// GET /api/card/:id - Rota para obter dados de um cartão (já existente)
// ...