const { body, param, validationResult } = require('express-validator');

const cardCreationValidators = [
    body('nome').notEmpty().withMessage('Nome é obrigatório.'),
    body('mensagem').notEmpty().withMessage('Mensagem é obrigatória.'),
    body('data').optional().isDate().withMessage('Data inválida.'),
    body('youtubeVideoId').optional().isString().withMessage('ID do YouTube inválido.'),
];

const cardIdValidator = [
    param('id').isInt({ min: 1 }).withMessage('ID inválido.'),
];

// Middleware para verificar erros de validação
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array().map(err => err.msg) });
    }
    next();
};

module.exports = {
    cardCreationValidators: [...cardCreationValidators, validate],
    cardIdValidator: [...cardIdValidator, validate],
};