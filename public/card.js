/**
 * @file card.js
 * @description Script para carregar e exibir um cartão personalizado na página de visualização do Messagelove.
 * @author Pedro Marques
 * @version 1.0.3 // Versão com as correções de erro 'null' e otimizações
 */

// Variável global para armazenar os dados do cartão, acessível pela API do YouTube
let cardDataGlobal = null;

// Esta função é um callback GLOBAL que a API do YouTube chama quando está pronta.
// Ela precisa estar no escopo global (window) para ser encontrada pela API.
window.onYouTubeIframeAPIReady = function() {
    console.log('API do YouTube carregada e pronta.');
    if (cardDataGlobal) {
        // Renderiza o cartão se os dados já estiverem disponíveis
        window.renderCardContent(cardDataGlobal); // Chama a função global
    } else {
        console.log('Dados do cartão ainda não disponíveis, aguardando...');
    }
};

// Garante que o script só manipule o DOM quando o HTML estiver completamente carregado.
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded - Iniciando script.js');

    // --- Configurações e Constantes ---
    const IS_LOCAL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const API_URL = IS_LOCAL
        ? 'http://localhost:3001/api'
        : 'https://messagelove-backend.onrender.com/api';
    console.log(`API_URL: ${API_URL}`);

    // --- Seletores do DOM ---
    // ATENÇÃO: É crucial que esses IDs existam no seu HTML e estejam corretos.
    // O erro "Cannot read properties of null" ocorre se um desses elementos não for encontrado.
    const loadingStateEl = document.getElementById('loading-state');
    const errorStateEl = document.getElementById('error-state');
    const cardViewEl = document.getElementById('card-view');
    const nomeEl = document.getElementById('card-nome');
    const dataEl = document.getElementById('card-data');
    const mensagemEl = document.getElementById('card-mensagem');
    const fotoContainerEl = document.getElementById('card-foto-container');
    const videoContainerEl = document.getElementById('card-video-container');

    // Variável para o contêiner de emojis, criada uma única vez
    let emojiRainContainerEl = null;

    // --- Funções Auxiliares ---
    const fetchCardData = async (id) => {
        const url = `${API_URL}/cards/${id}`;
        console.log('Buscando cartão na URL:', url);
        try {
            const response = await fetch(url);
            if (!response.ok) {
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
        const date = new Date(dateString + 'T00:00:00');
        if (isNaN(date.getTime())) {
            return 'Uma data especial';
        }
        return date.toLocaleDateString('pt-BR', {
            day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC'
        });
    };

    // A função renderCardContent é acessível globalmente via window.renderCardContent
    // para ser chamada tanto pelo main() quanto por onYouTubeIframeAPIReady
    window.renderCardContent = (card) => {
        if (!card) {
            console.error('Nenhum dado de cartão fornecido para renderCardContent.');
            return;
        }

        // Verificações defensivas antes de manipular elementos
        document.title = `Uma mensagem para ${card.nome}`;
        if (nomeEl) nomeEl.textContent = card.nome;
        if (mensagemEl) mensagemEl.textContent = card.mensagem;
        if (dataEl) dataEl.textContent = formatSpecialDate(card.data);

        // Renderiza foto
        if (fotoContainerEl) {
            fotoContainerEl.innerHTML = '';
            if (card.foto) {
                const img = document.createElement('img');
                img.src = card.foto;
                img.alt = `Foto para ${card.nome}`;
                img.className = 'card-image';
                fotoContainerEl.appendChild(img);
            }
        }

        // Renderiza vídeo do YouTube
        if (videoContainerEl) {
            videoContainerEl.innerHTML = ''; // Limpa antes de adicionar
            if (card.youtubeVideoId) {
                // Adiciona uma verificação extra para a API do YouTube aqui também,
                // caso renderCardContent seja chamada por outros meios antes de onYouTubeIframeAPIReady
                if (typeof YT !== 'undefined' && typeof YT.Player !== 'undefined') {
                    const playerId = `ytplayer-${Date.now()}`;
                    const videoPlayerDiv = document.createElement('div');
                    videoPlayerDiv.id = playerId;

                    const videoWrapper = document.createElement('div');
                    // Usando as classes de moldura que você tem no CSS
                    videoWrapper.className = 'video-player-wrapper video-frame';
                    videoWrapper.appendChild(videoPlayerDiv);
                    videoContainerEl.appendChild(videoWrapper);

                    new YT.Player(playerId, {
                        height: '100%',
                        width: '100%',
                        videoId: card.youtubeVideoId,
                        playerVars: {
                            'autoplay': 1,
                            'mute': 1,
                            'loop': 1,
                            'playlist': card.youtubeVideoId,
                            'controls': 0,
                            'modestbranding': 1,
                            'rel': 0
                        },
                        events: {
                            'onReady': (event) => {
                                console.log('Player do YouTube pronto, iniciando vídeo.');
                                event.target.playVideo();
                            },
                            'onError': (error) => {
                                console.error('Erro no player do YouTube:', error);
                                if (videoContainerEl) {
                                    videoContainerEl.innerHTML = '<p class="youtube-error">Não foi possível carregar o vídeo. Tente novamente mais tarde.</p>';
                                }
                            }
                        }
                    });
                } else {
                    console.warn('API do YouTube ainda não carregada ou YouTubeVideoId ausente. O vídeo pode não ser exibido.');
                    if (videoContainerEl) {
                         videoContainerEl.innerHTML = '<p class="youtube-error">Carregando vídeo...</p>';
                    }
                }
            }
        }

        // Exibe o cartão (se existir)
        if (cardViewEl) cardViewEl.classList.remove('hidden');
        
        // Ativa a chuva de emojis
        triggerEmojiRain();
    };

    const triggerEmojiRain = () => {
        if (!emojiRainContainerEl) {
            emojiRainContainerEl = document.createElement('div');
            emojiRainContainerEl.className = 'emoji-rain-container';
            document.body.appendChild(emojiRainContainerEl);
        } else {
            emojiRainContainerEl.innerHTML = ''; // Limpa para nova chuva
        }

        const emojis = ['❤️', '💖', '✨', '🎉', '💕', '⭐', '🥰', '😍'];
        const amount = 70;
        const fragment = document.createDocumentFragment();

        for (let i = 0; i < amount; i++) {
            const emojiSpan = document.createElement('span');
            emojiSpan.className = 'emoji';
            emojiSpan.textContent = emojis[Math.floor(Math.random() * emojis.length)];
            emojiSpan.style.left = `${Math.random() * 100}vw`;
            emojiSpan.style.fontSize = `${Math.random() * 1.5 + 0.8}rem`;
            emojiSpan.style.animationDuration = `${Math.random() * 4 + 3}s`;
            emojiSpan.style.animationDelay = `${Math.random() * 5}s`;
            fragment.appendChild(emojiSpan);
        }
        emojiRainContainerEl.appendChild(fragment);
    };

    // --- Função Principal ---
    const main = async () => {
        try {
            // Esconde estado de carregamento inicial
            if (loadingStateEl) loadingStateEl.classList.remove('hidden');
            if (errorStateEl) errorStateEl.classList.add('hidden'); // Garante que o erro esteja escondido

            const params = new URLSearchParams(window.location.search);
            const cardId = params.get('id');

            if (!cardId) {
                throw new Error('ID do cartão não encontrado na URL.');
            }

            const cardData = await fetchCardData(cardId);
            cardDataGlobal = cardData; // Armazena globalmente

            // Decide se renderiza o cartão imediatamente ou espera a API do YouTube
            if (typeof YT !== 'undefined' && typeof YT.Player !== 'undefined') {
                console.log('API do YouTube já carregada no início.');
                window.renderCardContent(cardData); // Chama a função global
            } else {
                console.log('Aguardando a API do YouTube. onYouTubeIframeAPIReady será chamada.');
                if (videoContainerEl) {
                     videoContainerEl.innerHTML = '<p class="youtube-error">Carregando vídeo...</p>';
                }
            }
        } catch (error) {
            console.error('Erro na inicialização do cartão:', error.message);
            if (errorStateEl) {
                errorStateEl.textContent = `Erro ao carregar o cartão: ${error.message}`;
                errorStateEl.classList.remove('hidden');
            }
        } finally {
            // Esconde o estado de carregamento no final, independentemente do sucesso ou erro
            if (loadingStateEl) loadingStateEl.classList.add('hidden');
        }
    };

    // Chama a função principal quando o DOM estiver pronto
    main();
});