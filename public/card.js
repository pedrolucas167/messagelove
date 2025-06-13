/**
 * @file card.js
 * @description Script para carregar e exibir um cartão personalizado na página de visualização do Messagelove.
 * @author Pedro Marques
 * @version 1.0.1
 */

document.addEventListener('DOMContentLoaded', () => {
    // Configurações e Constantes
    const IS_LOCAL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const API_URL = IS_LOCAL
        ? 'http://localhost:3001/api'
        : 'https://messagelove-backend.onrender.com/api';
    console.log(`API_URL: ${API_URL}`);

    // Seletores do DOM
    const loadingStateEl = document.getElementById('loading-state');
    const errorStateEl = document.getElementById('error-state');
    const cardViewEl = document.getElementById('card-view');
    const nomeEl = document.getElementById('card-nome');
    const dataEl = document.getElementById('card-data');
    const mensagemEl = document.getElementById('card-mensagem');
    const fotoContainerEl = document.getElementById('card-foto-container');
    const videoContainerEl = document.getElementById('card-video-container');

    // Funções Auxiliares
    const fetchCardData = async (id) => {
        const url = `${API_URL}/cards/${id}`; // Corrigido: /card para /cards
        console.log('Buscando cartão na URL:', url);
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Cartão não encontrado (Status: ${response.status})`);
            }
            const data = await response.json();
            console.log('Dados do cartão recebidos:', data);
            return data;
        } catch (error) {
            console.error('Erro ao buscar dados do cartão:', error);
            throw error;
        }
    };

    const formatSpecialDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString + 'T00:00:00');
        if (isNaN(date.getTime())) {
            return 'Uma data especial';
        }
        return date.toLocaleDateString('pt-BR', {
            day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC'
        });
    };

    const renderCardContent = (card) => {
        document.title = `Uma mensagem para ${card.nome}`;
        nomeEl.textContent = card.nome;
        mensagemEl.textContent = card.mensagem;
        dataEl.textContent = formatSpecialDate(card.data);

        fotoContainerEl.innerHTML = '';
        if (card.foto) { // Ajustado para campo 'foto' do backend
            const img = document.createElement('img');
            img.src = card.foto;
            img.alt = `Foto para ${card.nome}`;
            img.className = 'card-image';
            fotoContainerEl.appendChild(img);
        }

        videoContainerEl.innerHTML = '';
        if (card.youtubeVideoId && window.YT) {
            const playerId = `ytplayer-${Date.now()}`;
            const videoPlayerDiv = document.createElement('div');
            videoPlayerDiv.id = playerId;

            const videoWrapper = document.createElement('div');
            videoWrapper.className = 'video-player-wrapper video-frame';
            videoWrapper.appendChild(videoPlayerDiv);
            videoContainerEl.appendChild(videoWrapper);

            new YT.Player(playerId, {
                height: '100%',
                width: '100%',
                videoId: card.youtubeVideoId,
                playerVars: { 'autoplay': 1, 'mute': 1, 'loop': 1, 'playlist': card.youtubeVideoId, 'controls': 0 },
                events: { 'onReady': (event) => event.target.playVideo() }
            });
        }

        cardViewEl.classList.remove('hidden');
        triggerEmojiRain();
    };

    const triggerEmojiRain = () => {
        const emojiContainer = document.createElement('div');
        emojiContainer.className = 'emoji-rain-container';
        document.body.appendChild(emojiContainer);
        const emojis = ['❤️', '💖', '✨', '🎉', '💕', '⭐', '🥰', '😍'];
        const amount = 70;
        for (let i = 0; i < amount; i++) {
            const emojiSpan = document.createElement('span');
            emojiSpan.className = 'emoji';
            emojiSpan.textContent = emojis[Math.floor(Math.random() * emojis.length)];
            emojiSpan.style.left = `${Math.random() * 100}vw`;
            emojiSpan.style.fontSize = `${Math.random() * 1.5 + 0.8}rem`;
            emojiSpan.style.animationDuration = `${Math.random() * 4 + 3}s`;
            emojiSpan.style.animationDelay = `${Math.random() * 5}s`;
            emojiContainer.appendChild(emojiSpan);
        }
    };

    // Função Principal
    const main = async () => {
        try {
            const params = new URLSearchParams(window.location.search);
            const cardId = params.get('id');

            if (!cardId) {
                throw new Error('ID do cartão não encontrado na URL.');
            }

            const cardData = await fetchCardData(cardId);

            const render = () => renderCardContent(cardData);

            if (typeof YT === 'undefined' || typeof YT.Player === 'undefined') {
                window.onYouTubeIframeAPIReady = render;
            } else {
                render();
            }
        } catch (error) {
            console.error('Erro na inicialização:', error.message);
            errorStateEl.classList.remove('hidden');
        } finally {
            loadingStateEl.classList.add('hidden');
        }
    };

    main();
});