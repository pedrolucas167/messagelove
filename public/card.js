/**
 * @file card.js
 * @description Script para carregar e exibir um cartão personalizado.
 * @author Pedro Marques
 * @version 2.0.0
 */

document.addEventListener('DOMContentLoaded', () => {

    // --- 1. CONFIGURAÇÕES E SELETORES ---
    const API_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
        ? 'http://localhost:3001/api'
        : 'https://messagelove-backend.onrender.com/api';

    const elements = {
        loadingState: document.getElementById('loading-state'),
        errorState: document.getElementById('error-state'),
        cardView: document.getElementById('card-view'),
        nome: document.getElementById('card-nome'),
        data: document.getElementById('card-data'),
        mensagem: document.getElementById('card-mensagem'),
        fotoContainer: document.getElementById('card-foto-container'),
        videoContainer: document.getElementById('card-video-container'),
        errorText: document.getElementById('error-text'), // Adicione um elemento com este ID no seu HTML de erro
    };

    // --- 2. FUNÇÕES AUXILIARES ---

    /**
     * Busca os dados do cartão na API.
     * @param {string} id - O ID do cartão.
     * @returns {Promise<object>} Os dados do cartão.
     */
    const fetchCardData = async (id) => {
        try {
            const response = await fetch(`${API_URL}/cards/${id}`);
            if (!response.ok) {
                // Se a resposta for 404, o cartão não foi encontrado.
                if (response.status === 404) {
                    throw new Error('Este cartão não foi encontrado. Verifique o link e tente novamente.');
                }
                throw new Error(`Erro na comunicação com o servidor (Status: ${response.status})`);
            }
            return await response.json();
        } catch (error) {
            console.error('Falha ao buscar dados do cartão:', error);
            // Propaga o erro para ser tratado pela função main.
            throw error;
        }
    };

    /**
     * Formata a data para um formato legível.
     * @param {string} dateString - A data no formato YYYY-MM-DD.
     * @returns {string} A data formatada.
     */
    const formatSpecialDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(`${dateString}T00:00:00`); // Adiciona T00:00:00 para evitar problemas de fuso horário.
        return date.toLocaleDateString('pt-BR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            timeZone: 'UTC'
        });
    };

    /**
     * Cria e dispara uma "chuva" de emojis na tela.
     */
    const triggerEmojiRain = () => {
        const container = document.createElement('div');
        container.className = 'emoji-rain-container';
        document.body.appendChild(container);
        
        const emojis = ['❤️', '💖', '✨', '🎉', '💕', '⭐', '🥰'];
        for (let i = 0; i < 50; i++) {
            const emojiEl = document.createElement('span');
            emojiEl.className = 'emoji';
            emojiEl.textContent = emojis[Math.floor(Math.random() * emojis.length)];
            emojiEl.style.left = `${Math.random() * 100}vw`;
            emojiEl.style.fontSize = `${Math.random() * 1.5 + 0.8}rem`;
            emojiEl.style.animationDuration = `${Math.random() * 4 + 4}s`; // Duração entre 4s e 8s
            emojiEl.style.animationDelay = `${Math.random() * 5}s`;
            container.appendChild(emojiEl);
        }
        // Remove o container após a animação para não sobrecarregar o DOM
        setTimeout(() => container.remove(), 10000);
    };


    // --- 3. LÓGICA DE RENDERIZAÇÃO ---

    /**
     * Preenche a página com os dados do cartão.
     * @param {object} card - O objeto do cartão vindo da API.
     */
    const renderCardContent = (card) => {
        // Altera o título da página para uma experiência mais pessoal
        document.title = `Uma mensagem para ${card.para || 'Você'}`;

        // Preenche os dados básicos
        elements.nome.textContent = card.para || 'Pessoa Especial';
        elements.mensagem.textContent = card.mensagem || 'Uma mensagem do coração.';

        // Formata e exibe a data, se existir
        if (card.data) {
            elements.data.textContent = formatSpecialDate(card.data);
            elements.data.hidden = false;
        }

        // Renderiza a foto, se existir
        if (card.fotoUrl) {
            elements.fotoContainer.innerHTML = `<img src="${card.fotoUrl}" alt="Foto para ${card.para}" class="card-image">`;
            elements.fotoContainer.hidden = false;
        }

        // Renderiza o vídeo do YouTube, se existir
        if (card.youtubeVideoId) {
            const videoSrc = `https://www.youtube.com/embed/${card.youtubeVideoId}?autoplay=1&mute=1&loop=1&playlist=${card.youtubeVideoId}&controls=0&rel=0`;
            elements.videoContainer.innerHTML = `
                <div class="video-frame">
                    <div class="video-player-wrapper">
                        <iframe 
                            src="${videoSrc}" 
                            title="Vídeo do YouTube" 
                            frameborder="0" 
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                            allowfullscreen>
                        </iframe>
                    </div>
                </div>
            `;
            elements.videoContainer.hidden = false;
        }

        // Exibe o cartão e a animação
        elements.cardView.hidden = false;
        triggerEmojiRain();
    };


    // --- 4. FUNÇÃO PRINCIPAL (INICIALIZAÇÃO) ---

    const main = async () => {
        try {
            const cardId = new URLSearchParams(window.location.search).get('id');
            if (!cardId) {
                throw new Error('O link está incompleto. ID do cartão não encontrado.');
            }

            const cardData = await fetchCardData(cardId);
            renderCardContent(cardData);

        } catch (error) {
            console.error('Não foi possível carregar o cartão:', error);
            if (elements.errorText) {
                elements.errorText.textContent = error.message;
            }
            elements.errorState.hidden = false;
        } finally {
            elements.loadingState.hidden = true;
        }
    };

    // Inicia a execução do script
    main();
});
