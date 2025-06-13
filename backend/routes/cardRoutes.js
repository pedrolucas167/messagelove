const express = require('express');
const router = express.Router();
const cardController = require('../controllers/cardController');
const asyncHandler = require('../middleware/asyncHandler');
const upload = require('../middleware/uploadMiddleware');
const { cardCreationValidators, cardIdValidator } = require('../middleware/validators');

console.log('Configurando rotas de cartões...');

router.get('/', asyncHandler(cardController.handleGetAllCards));
router.get('/:id', cardIdValidator, asyncHandler(cardController.handleGetCard));
router.post('/', upload.single('foto'), cardCreationValidators, asyncHandler((req, res, next) => {
    console.log('Rota POST /api/cards acionada:', req.body, req.file);
    cardController.handleCreateCard(req, res, next);
}));
router.put('/:id', upload.single('foto'), cardCreationValidators, cardIdValidator, asyncHandler(cardController.handleUpdateCard));
router.delete('/:id', cardIdValidator, asyncHandler(cardController.handleDeleteCard));

module.exports = router;