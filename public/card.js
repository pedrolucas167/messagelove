/**
 * @file card.js
 * @description Script para carregar e exibir um cartão personalizado com arquitetura modular.
 * @author Pedro Marques
 * @version 6.2.0
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- 1. CONFIGURAÇÕES E SELETORES ---
    const API_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
        ? 'http://localhost:3001/api'
        : 'https://messagelove-backend.onrender.com/api';

    const ELEMENTS = {
        stateManager: document.getElementById('card-state-manager'),
        revealBtn: document.getElementById('revealBtn'),
        revealOverlay: document.getElementById('reveal-overlay'),
        nome: document.getElementById('card-nome'),
        de: document.getElementById('card-de'), // Adicionado o elemento "De"
        data: document.getElementById('card-data'),
        mensagem: document.getElementById('card-mensagem'),
        fotoContainer: document.getElementById('card-foto-container'),
        videoContainer: document.getElementById('card-video-container'),
        likeBtn: document.getElementById('likeBtn'),
        errorText: document.getElementById('error-text'),
    };

    // --- 2. LÓGICA DA APLICAÇÃO ---

    const fetchCardData = async (id) => {
        const response = await fetch(`${API_URL}/cards/${id}`);
        if (!response.ok) {
            const errorMsg = response.status === 404 ? 'Cartão não encontrado.' : 'Erro no servidor.';
            throw new Error(errorMsg);
        }
        return await response.json();
    };

    const renderCardContent = (card) => {
        if (!card || typeof card !== 'object') {
            throw new Error("Os dados recebidos do cartão são inválidos.");
        }

        document.title = `Uma mensagem para ${card.para || 'Você'}`;
        
        ELEMENTS.nome.innerHTML = `<span class="card-label">Para:</span> ${card.para || 'Pessoa Especial'}`;
        ELEMENTS.mensagem.textContent = card.mensagem || 'Uma mensagem especial para você.';
        
        // Renderiza o remetente
        if (ELEMENTS.de) {
            ELEMENTS.de.innerHTML = `<span class="card-label-de">De:</span> ${card.de || 'Alguém Especial'}`;
        }

        // Renderiza outros elementos...
        const renderMedia = (container, data, type) => {
            container.innerHTML = '';
            container.hidden = true;
            if (data) {
                if (type === 'image') {
                    container.innerHTML = `<img src="${data}" alt="Foto para ${card.para}" class="card-image">`;
                } else if (type === 'video') {
                    const videoSrc = `https://www.youtube.com/embed/${data}?autoplay=1&mute=1&loop=1&playlist=${data}&controls=0&rel=0`;
                    container.innerHTML = `<div class="video-frame"><div class="video-player-wrapper"><iframe src="${videoSrc}" title="Vídeo do YouTube" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe></div></div>`;
                }
                container.hidden = false;
            }
        };

        renderMedia(ELEMENTS.fotoContainer, card.fotoUrl, 'image');
        renderMedia(ELEMENTS.videoContainer, card.youtubeVideoId, 'video');
    };

    const loadCard = async () => {
        ELEMENTS.stateManager.dataset.state = 'loading';
        try {
            const cardId = new URLSearchParams(window.location.search).get('id');
            if (!cardId) throw new Error('O link está incompleto.');
            
            const cardData = await fetchCardData(cardId);
            renderCardContent(cardData);
            
            ELEMENTS.stateManager.dataset.state = 'card-content';
            // Adicione seus efeitos visuais aqui (ex: playSoundEffect(), triggerEmojiRain())
        } catch (error) {
            console.error('Não foi possível carregar o cartão:', error);
            if (ELEMENTS.errorText) ELEMENTS.errorText.textContent = error.message;
            ELEMENTS.stateManager.dataset.state = 'error';
        }
    };

    // --- 3. INICIALIZAÇÃO ---

    const init = () => {
        if (!ELEMENTS.stateManager) {
            console.error("Elemento #card-state-manager não encontrado.");
            return;
        }
        ELEMENTS.revealBtn?.addEventListener('click', () => {
            // Adicione seus efeitos visuais aqui (ex: triggerFullscreenReveal())
            setTimeout(loadCard, 500);
        }, { once: true });
        
        // ... (outros event listeners como o do likeBtn)
    };

    init();
});
