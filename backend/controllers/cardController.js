const cardService = require('../services/cardService.js');
const { validationResult } = require('express-validator');

const handleGetAllCards = async (req, res) => {
  const cards = await cardService.getAllCards();
  res.json(cards);
};

const handleCreateCard = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const cardData = { ...req.body };
  if (req.file) {
    const fotoUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    cardData.fotoUrl = fotoUrl;
  }
  const newCard = await cardService.createCard(cardData);
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const viewLink = `${frontendUrl}/card.html?id=${newCard.id}`;
  res.status(201).json({
    message: 'Card created successfully',
    viewLink,
    cardData: newCard,
  });
};

const handleGetCard = async (req, res) => {
  const { id } = req.params;
  const card = await cardService.getCardById(id);
  if (!card) {
    return res.status(404).json({ message: 'Card not found.' });
  }
  res.json(card);
};

const handleUpdateCard = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const { id } = req.params;
  const cardData = { ...req.body };
  if (req.file) {
    const fotoUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    cardData.fotoUrl = fotoUrl;
  }
  const updatedCard = await cardService.updateCard(id, cardData);
  if (!updatedCard) {
    return res.status(404).json({ message: 'Card not found.' });
  }
  res.json({
    message: 'Card updated successfully',
    cardData: updatedCard,
  });
};

const handleDeleteCard = async (req, res) => {
  const { id } = req.params;
  const success = await cardService.deleteCard(id);
  if (!success) {
    return res.status(404).json({ message: 'Card not found.' });
  }
  res.status(204).send();
};

module.exports = {
  handleGetAllCards,
  handleCreateCard,
  handleGetCard,
  handleUpdateCard,
  handleDeleteCard
};