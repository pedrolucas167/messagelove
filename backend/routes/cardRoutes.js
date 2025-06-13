const express = require('express');
const router = express.Router();
const cardController = require('../controllers/cardController');
const asyncHandler = require('../middleware/asyncHandler');
const upload = require('../middleware/uploadMiddleware');
const { cardCreationValidators, cardIdValidator } = require('../middleware/validators');

/**
 * @route GET /api/cards
 * @description Lista todos os cartões
 * @access Public
 */
router.get('/', asyncHandler(cardController.handleGetAllCards));

/**
 * @route POST /api/cards
 * @description Cria um novo cartão
 * @access Public
 * @middleware upload.single('foto') - Processa upload de imagem
 * @middleware cardCreationValidators - Valida dados do cartão
 */
router.post('/', upload.single('foto'), cardCreationValidators, asyncHandler(cardController.handleCreateCard));

/**
 * @route GET /api/cards/:id
 * @description Busca um cartão por ID
 * @access Public
 * @middleware cardIdValidator - Valida o parâmetro ID
 */
router.get('/:id', cardIdValidator, asyncHandler(cardController.handleGetCard));

/**
 * @route PUT /api/cards/:id
 * @description Atualiza um cartão existente
 * @access Public
 * @middleware upload.single('foto') - Processa upload de imagem
 * @middleware cardIdValidator, cardCreationValidators - Valida ID e dados
 */
router.put('/:id', upload.single('foto'), [...cardIdValidator, ...cardCreationValidators], asyncHandler(cardController.handleUpdateCard));

/**
 * @route DELETE /api/cards/:id
 * @description Deleta um cartão por ID
 * @access Public
 * @middleware cardIdValidator - Valida o parâmetro ID
 */
router.delete('/:id', cardIdValidator, asyncHandler(cardController.handleDeleteCard));

module.exports = router;