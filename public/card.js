document.addEventListener('DOMContentLoaded', () => {

    const IS_LOCAL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const API_URL = IS_LOCAL
        ? 'http://localhost:3001/api'
        : 'https://messagelove-backend.onrender.com/api';

    // --- Seletores do DOM ---
    const loadingStateEl = document.getElementById('loading-state');
    const errorStateEl = document.getElementById('error-state');
    const cardViewEl = document.getElementById('card-view');
    const nomeEl = document.getElementById('card-nome');
    const dataEl = document.getElementById('card-data');
    const mensagemEl = document.getElementById('card-mensagem');
    const fotoContainerEl = document.getElementById('card-foto-container');
    const videoContainerEl = document.getElementById('card-video-container');

    // --- Funções Auxiliares ---

    const fetchCardData = async (id) => {
        try {
            const response = await fetch(`${API_URL}/card/${id}`);
            if (!response.ok) {
                // Lança o erro com a mensagem do status para ser pego pelo catch
                throw new Error(`Cartão não encontrado (Status: ${response.status})`);
            }
            return await response.json();
        } catch (error) {
            // Loga o erro e o relança para que a função main possa tratá-lo
            console.error("Erro ao buscar dados do cartão:", error);
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
        if (card.fotoUrl) {
            const img = document.createElement('img');
            img.src = card.fotoUrl;
            img.alt = `Foto para ${card.nome}`;
            img.className = 'card-image';
            fotoContainerEl.appendChild(img);
        }

        videoContainerEl.innerHTML = '';
        if (card.youtubeVideoId && window.YT) { // Verifica se a API YT está disponível
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
        
        // Exibe o cartão e os efeitos apenas após o conteúdo ser renderizado
        cardViewEl.classList.remove('hidden');
        triggerEmojiRain();
    };

    const triggerEmojiRain = () => {
        // ... (código da chuva de emojis sem alteração) ...
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

    /**
     * Orquestra a exibição da página com lógica de renderização unificada.
     */
    const main = async () => {
        try {
            const params = new URLSearchParams(window.location.search);
            const cardId = params.get('id');

            if (!cardId) {
                throw new Error("ID do cartão não encontrado na URL.");
            }

            const cardData = await fetchCardData(cardId);

            // A função que renderiza tudo
            const render = () => renderCardContent(cardData);

            // Se a API do YT não estiver pronta, agendamos a renderização.
            // A API do YT chama onYouTubeIframeAPIReady globalmente quando termina de carregar.
            if (typeof YT === 'undefined' || typeof YT.Player === 'undefined') {
                window.onYouTubeIframeAPIReady = render;
            } else {
                // Se já estiver pronta, renderizamos imediatamente.
                render();
            }

        } catch (error) {
            console.error(error.message);
            errorStateEl.classList.remove('hidden');
        } finally {
            loadingStateEl.classList.add('hidden');
        }
    };

    main();
});