/**
 * @file card.js
 * @description Script para carregar e exibir um cartão personalizado com arquitetura modular.
 * @author Pedro Marques
<<<<<<< HEAD
 * @version 1.0.2 
=======
 * @version 6.2.0
>>>>>>> b2f9d5c7bb00eb130b060af04d4385d1f4dc428d
 */

// Declara a função global onYouTubeIframeAPIReady ANTES do DOMContentLoaded
// para garantir que o YouTube a encontre quando a API carregar.
let cardDataGlobal = null; // Variável para armazenar os dados do cartão globalmente

window.onYouTubeIframeAPIReady = function() {
    if (cardDataGlobal) {
        renderCardContent(cardDataGlobal);
    }
};

document.addEventListener('DOMContentLoaded', () => {
    // --- 1. CONFIGURAÇÕES E SELETORES ---
    const API_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
        ? 'http://localhost:3001/api'
        : 'https://messagelove-backend.onrender.com/api';

<<<<<<< HEAD
    // Seletores do DOM
    const loadingStateEl = document.getElementById('loading-state');
    const errorStateEl = document.getElementById('error-state');
    const cardViewEl = document.getElementById('card-view');
    const nomeEl = document.getElementById('card-nome');
    const dataEl = document.getElementById('card-data');
    const mensagemEl = document.getElementById('card-mensagem');
    const fotoContainerEl = document.getElementById('card-foto-container');
    const videoContainerEl = document.getElementById('card-video-container');

    // Variável global para o contêiner de emojis, para evitar duplicatas
    let emojiRainContainerEl = null;

    // Funções Auxiliares
    const fetchCardData = async (id) => {
        const url = `${API_URL}/cards/${id}`;
        console.log('Buscando cartão na URL:', url);
        try {
            const response = await fetch(url);
            if (!response.ok) {
                // Tenta ler a mensagem de erro do backend se disponível
                const errorText = await response.text();
                throw new Error(`Cartão não encontrado (Status: ${response.status}). Detalhes: ${errorText}`);
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
        // Adiciona 'T00:00:00' para garantir que a data seja interpretada como UTC e evitar problemas de fuso horário
        const date = new Date(dateString + 'T00:00:00'); 
        if (isNaN(date.getTime())) {
            return 'Uma data especial'; // Fallback para datas inválidas
        }
        return date.toLocaleDateString('pt-BR', {
            day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' // Força UTC para consistência
        });
    };

    // A função renderCardContent agora é globalmente acessível para onYouTubeIframeAPIReady
    window.renderCardContent = (card) => {
        document.title = `Uma mensagem para ${card.nome}`;
        nomeEl.textContent = card.nome;
        mensagemEl.textContent = card.mensagem;
        dataEl.textContent = formatSpecialDate(card.data);

        fotoContainerEl.innerHTML = ''; // Limpa antes de adicionar
        if (card.foto) {
            const img = document.createElement('img');
            img.src = card.foto;
            img.alt = `Foto para ${card.nome}`;
            img.className = 'card-image';
            fotoContainerEl.appendChild(img);
        }

        videoContainerEl.innerHTML = ''; // Limpa antes de adicionar
        // Verifica se há um ID de vídeo e se a API do YouTube está carregada
        if (card.youtubeVideoId && typeof YT !== 'undefined' && typeof YT.Player !== 'undefined') {
            const playerId = `ytplayer-${Date.now()}`; // ID único para o player
            const videoPlayerDiv = document.createElement('div');
            videoPlayerDiv.id = playerId;

            // Cria o wrapper com a moldura
            const videoWrapper = document.createElement('div');
            videoWrapper.className = 'video-player-wrapper video-frame'; // Classes para o CSS
            videoWrapper.appendChild(videoPlayerDiv);
            videoContainerEl.appendChild(videoWrapper);

            new YT.Player(playerId, {
                height: '100%',
                width: '100%',
                videoId: card.youtubeVideoId,
                playerVars: { 
                    'autoplay': 1, // Tentar autoplay
                    'mute': 1,     // Silenciar para permitir autoplay em mais navegadores
                    'loop': 1,     // Loop contínuo do vídeo
                    'playlist': card.youtubeVideoId, // Necessário para 'loop' funcionar
                    'controls': 0, // Esconder controles do player
                    'modestbranding': 1, // Reduzir o branding do YouTube
                    'rel': 0 // Não mostrar vídeos relacionados ao final
                },
                events: { 
                    'onReady': (event) => {
                        event.target.playVideo(); // Força a execução do vídeo
                    },
                    'onError': (error) => {
                        console.error('Erro no player do YouTube:', error);
                        // Opcional: exiba uma mensagem de erro ou fallback aqui
                    }
                }
            });
        } else if (card.youtubeVideoId) {
            console.warn('API do YouTube não carregada ou YouTubeVideoId ausente. O vídeo não será exibido.');
            // Opcional: Adicionar um placeholder ou mensagem para o usuário
        }

        cardViewEl.classList.remove('hidden'); // Exibe o cartão
        triggerEmojiRain(); // Chama a chuva de emojis após o cartão ser renderizado
    };

    const triggerEmojiRain = () => {
        // Cria o contêiner de emojis apenas uma vez
        if (!emojiRainContainerEl) {
            emojiRainContainerEl = document.createElement('div');
            emojiRainContainerEl.className = 'emoji-rain-container';
            document.body.appendChild(emojiRainContainerEl);
        } else {
            // Se já existe, limpa para uma nova "chuva" se a função for chamada novamente
            emojiRainContainerEl.innerHTML = '';
        }

        const emojis = ['❤️', '💖', '✨', '🎉', '💕', '⭐', '🥰', '😍'];
        const amount = 70; // Quantidade de emojis
        const fragment = document.createDocumentFragment(); // Para melhor performance

        for (let i = 0; i < amount; i++) {
            const emojiSpan = document.createElement('span');
            emojiSpan.className = 'emoji';
            emojiSpan.textContent = emojis[Math.floor(Math.random() * emojis.length)];
            
            // Posicionamento horizontal aleatório
            emojiSpan.style.left = `${Math.random() * 100}vw`;
            // Tamanho aleatório
            emojiSpan.style.fontSize = `${Math.random() * 1.5 + 0.8}rem`; // Entre 0.8rem e 2.3rem
            // Duração da animação aleatória
            emojiSpan.style.animationDuration = `${Math.random() * 4 + 3}s`; // Entre 3s e 7s
            // Atraso da animação aleatório para que não caiam todos ao mesmo tempo
            emojiSpan.style.animationDelay = `${Math.random() * 5}s`; // Entre 0s e 5s

            fragment.appendChild(emojiSpan);
        }
        emojiRainContainerEl.appendChild(fragment); // Adiciona todos os emojis de uma vez
    };

    // Função Principal
    const main = async () => {
=======
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
>>>>>>> b2f9d5c7bb00eb130b060af04d4385d1f4dc428d
        try {
            const cardId = new URLSearchParams(window.location.search).get('id');
            if (!cardId) throw new Error('O link está incompleto.');
            
            const cardData = await fetchCardData(cardId);
<<<<<<< HEAD
            cardDataGlobal = cardData; // Armazena globalmente para onYouTubeIframeAPIReady

            // Verifica se a API do YouTube já está carregada.
            // Se sim, renderiza diretamente. Caso contrário, espera o callback.
            if (typeof YT !== 'undefined' && typeof YT.Player !== 'undefined') {
                renderCardContent(cardData);
            } else {
                // A função onYouTubeIframeAPIReady já está definida no escopo global
                // Ela será chamada automaticamente pelo script da API do YouTube quando carregar.
                console.log('Esperando a API do YouTube carregar...');
            }
        } catch (error) {
            console.error('Erro na inicialização do cartão:', error.message);
            errorStateEl.textContent = `Erro ao carregar o cartão: ${error.message}`;
            errorStateEl.classList.remove('hidden');
        } finally {
            loadingStateEl.classList.add('hidden'); // Esconde o estado de carregamento
        }
    };

    main(); // Inicia o processo de carregamento do cartão
});

// Este script (do YouTube) deve ser carregado APÓS a definição de onYouTubeIframeAPIReady
// mas idealmente antes do DOMContentLoaded, ou de forma assíncrona.
// Certifique-se de que no seu HTML você tem algo assim:
/*
<script async src="https://www.youtube.com/iframe_api"></script>
<script src="path/to/card.js"></script>
*/
=======
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
>>>>>>> b2f9d5c7bb00eb130b060af04d4385d1f4dc428d
