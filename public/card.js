document.addEventListener('DOMContentLoaded', () => {
    
    const IS_LOCAL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const API_URL = IS_LOCAL 
    ? 'http://localhost:3001/api' 
    : 'https://messagelove-backend.onrender.com/api';

    // --- Seletores dos Elementos do DOM ---
    const loadingStateEl = document.getElementById('loading-state');
    const errorStateEl = document.getElementById('error-state');
    const cardViewEl = document.getElementById('card-view');

    // Elementos do cartão que serão preenchidos
    const nomeEl = document.getElementById('card-nome');
    const dataEl = document.getElementById('card-data');
    const mensagemEl = document.getElementById('card-mensagem');
    const fotoContainerEl = document.getElementById('card-foto-container');
    const videoContainerEl = document.getElementById('card-video-container');

    // --- Funções Principais ---

    /**
     * Busca os dados de um cartão específico na API.
     * @param {string} id - O ID do cartão.
     * @returns {Promise<object|null>} Os dados do cartão ou null em caso de erro.
     */
    const fetchCardData = async (id) => {
        try {
            const response = await fetch(`${API_URL}/card/${id}`);
            if (!response.ok) {
                throw new Error(`Cartão não encontrado (Status: ${response.status})`);
            }
            return await response.json();
        } catch (error) {
            console.error("Erro ao buscar dados do cartão:", error);
            return null;
        }
    };

    /**
     * Formata a data para um formato mais legível e amigável.
     * @param {string} dateString - A data no formato ISO (YYYY-MM-DD).
     * @returns {string} A data formatada, ex: "7 de junho de 2025".
     */
    const formatSpecialDate = (dateString) => {
        if (!dateString) return 'Uma data especial';
        
        const date = new Date(dateString);
        // Usamos 'long' para o mês para obter o nome completo.
        return date.toLocaleDateString('pt-BR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            timeZone: 'UTC' // Importante para evitar problemas de fuso horário
        });
    };


    
    const renderCard = (card) => {
        document.title = `Um cartão para ${card.nome}`;
        nomeEl.textContent = `Para: ${card.nome}`;
        mensagemEl.textContent = card.mensagem;
        dataEl.textContent = formatSpecialDate(card.data);

        if (card.fotoUrl) {
            const img = document.createElement('img');
            img.src = card.fotoUrl;
            img.alt = `Foto para ${card.nome}`;
            img.className = 'card-image';
            fotoContainerEl.appendChild(img);
        }

        if (card.youtubeVideoId) {
            const videoWrapper = document.createElement('div');
            // Adicionamos as classes que criamos no CSS para a moldura e o player
            videoWrapper.className = 'video-player-wrapper video-frame';
            videoWrapper.innerHTML = `
                <iframe 
                    src="https://www.youtube-nocookie.com/embed/${card.youtubeVideoId}?autoplay=1&mute=1&loop=1&playlist=${card.youtubeVideoId}"
                    title="Player de vídeo do YouTube" 
                    frameborder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowfullscreen>
                </iframe>`;
            videoContainerEl.appendChild(videoWrapper);
        }
    };
    
    /**
     * Cria e dispara o efeito de chuva de emojis na tela.
     */
    const triggerEmojiRain = () => {
        const emojiContainer = document.createElement('div');
        emojiContainer.className = 'emoji-rain-container';
        document.body.appendChild(emojiContainer);

        const emojis = ['❤️', '💖', '✨', '🎉', '💕', '⭐', '🥰', '😍'];
        const amount = 50; // Quantidade de emojis na chuva

        for (let i = 0; i < amount; i++) {
            const emojiSpan = document.createElement('span');
            emojiSpan.className = 'emoji';
            emojiSpan.textContent = emojis[Math.floor(Math.random() * emojis.length)];
            
            // Estilos aleatórios para um efeito natural
            emojiSpan.style.left = `${Math.random() * 100}vw`;
            emojiSpan.style.fontSize = `${Math.random() * 1.5 + 0.8}rem`;
            emojiSpan.style.animationDuration = `${Math.random() * 4 + 3}s`; // Duração entre 3s e 7s
            emojiSpan.style.animationDelay = `${Math.random() * 5}s`;

            emojiContainer.appendChild(emojiSpan);
        }
    };

    /**
     * Orquestra a exibição da página, gerenciando os estados.
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

        loadingStateEl.classList.add('hidden'); // Esconde o loading

        if (!cardData) {
            errorStateEl.classList.remove('hidden'); // Mostra erro se não encontrar dados
        } else {
            cardViewEl.classList.remove('hidden'); // Mostra o cartão
            renderCard(cardData);
            triggerEmojiRain(); // Dispara a magia!
        }
    };

    // Inicia a aplicação
    main();
});