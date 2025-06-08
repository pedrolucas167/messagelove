// ... (handlers handleCreateCard e handleGetCard existentes) ...
const { validationResult } = require('express-validator');

/**
 * Manipula a atualização de um cartão existente.
 */
const handleUpdateCard = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { id } = req.params;
  const updatedCard = await cardService.updateCard(id, req.body);

  if (!updatedCard) {
    return res.status(404).json({ message: 'Card not found.' });
  }

  res.json({
    message: 'Card updated successfully',
    cardData: updatedCard,
  });
};

/**
 * Manipula a deleção de um cartão.
 */
const handleDeleteCard = async (req, res) => {
  const { id } = req.params;
  const success = await cardService.deleteCard(id);

  if (!success) {
    return res.status(404).json({ message: 'Card not found.' });
  }
  // Status 204 significa "No Content", uma resposta padrão para deleções bem-sucedidas
  res.status(204).send();
};

module.exports = {
  handleCreateCard,
  handleGetCard,
  handleUpdateCard, // exportar o novo handler
  handleDeleteCard, // exportar o novo handler
};


// ...
const handleGetAllCards = async (req, res) => {
  const cards = await cardService.getAllCards();
  res.json(cards);
};

module.exports = {
  // ... handlers existentes
  handleGetAllCards, // exporta o novo handler
};