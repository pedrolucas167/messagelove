const multer = require('multer');
const path = require('path');

// Configuração do Armazenamento (Storage)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'uploads/'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Filtro de Arquivos (File Filter)
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de arquivo não suportado! Apenas imagens são permitidas.'), false);
  }
};

// Configuração dos Limites
const limits = {
  fileSize: 5 * 1024 * 1024 // Limite de 5MB
};

// Criação da instância do Multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: limits
});

module.exports = upload;