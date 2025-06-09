// backend/routes/cardRoutes.js

const express = require('express');
const router = express.Router();

const cardController = require('../controllers/cardController');
const asyncHandler = require('../middleware/asyncHandler');
const upload = require('../middleware/uploadMiddleware');
// Supondo que você ainda tenha seus validadores
const { cardCreationValidators, cardIdValidator } = require('../middleware/validators');

// CORRETO: Sem parênteses depois dos nomes das funções do controller
router.get('/cards', asyncHandler(cardController.handleGetAllCards));

router.post(
  '/cards',
  upload.single('foto'),
  cardCreationValidators,
  asyncHandler(cardController.handleCreateCard)
);

router.get('/card/:id', cardIdValidator, asyncHandler(cardController.handleGetCard));

router.put(
  '/card/:id',
  upload.single('foto'),
  [...cardIdValidator, ...cardCreationValidators],
  asyncHandler(cardController.handleUpdateCard)
);

router.delete('/card/:id', cardIdValidator, asyncHandler(cardController.handleDeleteCard));

module.exports = router;