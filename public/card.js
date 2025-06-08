document.addEventListener('DOMContentLoaded', () => {

    const IS_LOCAL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const API_URL = IS_LOCAL
        ? 'http://localhost:3001/api'
        : 'https://messagelove-backend.onrender.com/api';

    // --- Seletores do DOM ---
    // (Mantidos como estavam)
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
            if (!response.ok) throw new Error(`Cartão não encontrado (Status: ${response.status})`);
            return await response.json();
        } catch (error) {
            console.error("Erro ao buscar dados do cartão:", error);
            return null;
        }
    };

    /**
     * CORREÇÃO DE DATA
     * Formata a data de forma robusta, evitando problemas de fuso horário.
     * @param {string} dateString - A data no formato "YYYY-MM-DD".
     * @returns {string} A data formatada.
     */
    const formatSpecialDate = (dateString) => {
        if (!dateString) return ''; // Retorna vazio se não houver data

        // Anexar T00:00:00 torna a data inequívoca como meia-noite UTC.
        const date = new Date(dateString + 'T00:00:00');

        // Verifica se a data criada é válida
        if (isNaN(date.getTime())) {
            console.error("Data recebida inválida:", dateString);
            return 'Uma data especial';
        }

        return date.toLocaleDateString('pt-BR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            timeZone: 'UTC' // Mantém a formatação consistente
        });
    };

    /**
     * CORREÇÃO DE VÍDEO E TEXTO
     * Preenche o cartão, inicializa o player de vídeo com a API do YouTube.
     * @param {object} card - Os dados do cartão.
     */
    const renderCard = (card) => {
        document.title = `Uma mensagem para ${card.nome}`;
        
        // CORREÇÃO DE TEXTO: Removido "Para: " para um visual mais limpo
        nomeEl.textContent = card.nome;
        mensagemEl.textContent = card.mensagem; // O CSS com 'white-space: pre-wrap' cuida da formatação
        dataEl.textContent = formatSpecialDate(card.data);

        fotoContainerEl.innerHTML = ''; // Limpa antes de adicionar
        if (card.fotoUrl) {
            const img = document.createElement('img');
            img.src = card.fotoUrl;
            img.alt = `Foto para ${card.nome}`;
            img.className = 'card-image';
            fotoContainerEl.appendChild(img);
        }

        videoContainerEl.innerHTML = ''; // Limpa antes de adicionar
        if (card.youtubeVideoId) {
            // Cria um contêiner para a API do YouTube substituir
            const videoPlayerDiv = document.createElement('div');
            const playerId = `ytplayer-${Date.now()}`; // ID único para o player
            videoPlayerDiv.id = playerId;
            
            const videoWrapper = document.createElement('div');
            videoWrapper.className = 'video-player-wrapper video-frame';
            videoWrapper.appendChild(videoPlayerDiv);

            videoContainerEl.appendChild(videoWrapper);

            // Usa a API do YouTube para criar e controlar o player
            new YT.Player(playerId, {
                height: '100%',
                width: '100%',
                videoId: card.youtubeVideoId,
                playerVars: {
                    'autoplay': 1,
                    'mute': 1,
                    'loop': 1,
                    'playlist': card.youtubeVideoId, // 'loop' exige 'playlist'
                    'controls': 0, // Esconde os controles para um visual mais limpo
                    'showinfo': 0,
                    'rel': 0
                },
                events: {
                    // Toca o vídeo assim que o player estiver pronto
                    'onReady': (event) => event.target.playVideo()
                }
            });
        }
    };

    const triggerEmojiRain = () => {
        // (Função mantida como estava, sem alterações)
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
     * Orquestra a exibição da página.
     */
    const main = async () => {
        const params = new URLSearchParams(window.location.search);
        const cardId = params.get('id');

        if (!cardId) {
            loadingStateEl.classList.add('hidden');
            errorStateEl.classList.remove('hidden');
            return;
        }

        const cardData = await fetchCardData(cardId);
        loadingStateEl.classList.add('hidden');

        if (!cardData) {
            errorStateEl.classList.remove('hidden');
        } else {
            // A API do YouTube precisa estar pronta antes de renderizarmos o cartão
            // A função onYouTubeIframeAPIReady será chamada globalmente
            window.onYouTubeIframeAPIReady = () => {
                renderCard(cardData);
            };

            // Se a API já carregou, onYouTubeIframeAPIReady pode não disparar,
            // então verificamos se o objeto YT já existe.
            if (window.YT && window.YT.Player) {
                renderCard(cardData);
            }
            
            cardViewEl.classList.remove('hidden');
            triggerEmojiRain();
        }
    };

    main();
});