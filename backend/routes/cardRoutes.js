const express = require('express');
const multer = require('multer');
const { nanoid } = require('nanoid');
const { body, validationResult } = require('express-validator');
const path = require('path');
const { authenticate } = require('../middlewares');
const db = require('../models');
const logger = require('../config/logger'); // Assumindo que você já tem o logger singleton
const s3Service = require('../services/s3Service');

const router = express.Router();


const configureMulter = () => { /* ... */ };
const upload = configureMulter();
const validateCard = [ /* ... */ ];
const handleFileUpload = async (file, userId) => { /* ... */ };
const buildCardData = (body, userId, fotoUrl) => { /* ... */ };

// --- Handlers ---
const handleCardCreation = async (req, res, next) => {
   
};

const handleGetCard = async (req, res, next) => {
    
};

router.post('/', 
  authenticate, 
  upload.single('foto'), 
  validateCard, 
  handleCardCreation
);

router.get('/:id', handleGetCard);

module.exports = router;
