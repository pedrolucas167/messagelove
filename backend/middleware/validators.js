const { body, param } = require('express-validator');

const validateYouTubeId = (value) => {
  if (!value) return true;
  return /^[a-zA-Z0-9_-]{11}$/.test(value);
};

const validateUrl = (value) => {
  if (!value) return true;
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
};

const cardCreationValidators = [
  body('nome').trim().notEmpty().withMessage('O nome do destinatário é obrigatório.').isLength({ max: 100 }).withMessage('O nome não pode exceder 100 caracteres.').escape(),
  body('data').optional({ checkFalsy: true }).isISO8601().withMessage('O formato da data deve ser YYYY-MM-DD.').toDate(),
  body('mensagem').trim().notEmpty().withMessage('A mensagem é obrigatória.').isLength({ max: 2000 }).withMessage('A mensagem não pode exceder 2000 caracteres.').escape(),
  body('youtubeVideoId').optional({ checkFalsy: true }).trim().custom(validateYouTubeId).withMessage('O ID do vídeo do YouTube é inválido.'),
  body('fotoUrl').optional({ checkFalsy: true }).trim().custom(validateUrl).withMessage('A URL da foto é inválida.')
];

const cardIdValidator = [
  param('id').isUUID(4).withMessage('O formato do ID do cartão é inválido.')
];

module.exports = {
  cardCreationValidators,
  cardIdValidator
};