// cardService.js
const { uploadOptimizedPhoto } = require('./utils/imageProcessor'); // Certifique-se de que o caminho está correto

async function createCard(formData, userId) {
    try {
        const de = formData.get('de');
        const para = formData.get('para');
        const mensagem = formData.get('mensagem');
        const youtubeVideoId = formData.get('youtubeVideoId');
        let fotoUrl = null;

        if (!de || !para || !mensagem) {
            throw new Error('Remetente, destinatário e mensagem são obrigatórios.');
        }

        const file = formData.get('foto');
        if (file) {
            fotoUrl = await uploadOptimizedPhoto(file); // Linha 29
        }

        // Lógica para salvar no banco de dados (ex.: usando Mongoose)
        const card = await Card.create({
            de,
            para,
            mensagem,
            fotoUrl,
            youtubeVideoId,
            userId
        });

        return card;
    } catch (error) {
        console.error('Erro ao criar cartão:', error);
        throw error;
    }
}

module.exports = { createCard };