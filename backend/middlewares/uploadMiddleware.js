const multer = require('multer');

// 1. Configurar o multer para usar a memória RAM em vez do disco
const storage = multer.memoryStorage();

// 2. Opcional, mas recomendado: Manter os filtros e limites que você já criou
const fileFilter = (req, file, cb) => {
  // Aceita apenas arquivos que sejam imagens
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de arquivo não suportado! Apenas imagens são permitidas.'), false);
  }
};

const limits = {
  fileSize: 5 * 1024 * 1024 // Limite de 5MB por arquivo
};

// 3. Criar a instância final do multer com a nova configuração
const upload = multer({
  storage: storage, // <-- A grande mudança está aqui
  fileFilter: fileFilter,
  limits: limits
});

module.exports = upload;