/**
 * @file card.js
 * @description Script para carregar e exibir um cartão personalizado na página de visualização do Messagelove (card.html).
 * @author Pedro Marques
 * @version 1.0.4 // Versão consolidada para VISUALIZAÇÃO
 */

// Variável global para armazenar os dados do cartão, acessível pela API do YouTube
let cardDataGlobal = null;

// Esta função é um callback GLOBAL que a API do YouTube chama quando está pronta.
// Ela precisa estar no escopo global (window) para ser encontrada pela API.
window.onYouTubeIframeAPIReady = function() {
    console.log('API do YouTube carregada e pronta (modo VISUALIZAÇÃO).');
    if (cardDataGlobal) {
        // Renderiza o cartão se os dados já estiverem disponíveis
        window.renderCardContent(cardDataGlobal);
    } else {
        console.log('Dados do cartão ainda não disponíveis para visualização, aguardando...');
    }
};

// Garante que o script só manipule o DOM quando o HTML estiver completamente carregado.
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded - Iniciando card.js (Modo VISUALIZAÇÃO)');

    // --- Configurações e Constantes ---
    const IS_LOCAL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const API_URL = IS_LOCAL
        ? 'http://localhost:3001/api'
        : 'https://messagelove-backend.onrender.com/api';
    console.log(`API_URL: ${API_URL}`);

    // --- Seletores do DOM (Específicos para VISUALIZAÇÃO) ---
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

    // --- Funções Auxiliares (Comuns para este arquivo) ---
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

    // A função renderCardContent é acessível globalmente via window.renderCardContent
    window.renderCardContent = (card) => {
        if (!card) {
            console.error('Nenhum dado de cartão fornecido para renderCardContent.');
            return;
        }

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
            videoContainerEl.innerHTML = '';
            if (card.youtubeVideoId) {
                if (typeof YT !== 'undefined' && typeof YT.Player !== 'undefined') {
                    const playerId = `ytplayer-view-${Date.now()}`;
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
                        playerVars: {
                            'autoplay': 1, 'mute': 1, 'loop': 1, 'playlist': card.youtubeVideoId,
                            'controls': 0, 'modestbranding': 1, 'rel': 0
                        },
                        events: {
                            'onReady': (event) => { console.log('Player do YouTube pronto, iniciando vídeo.'); event.target.playVideo(); },
                            'onError': (error) => {
                                console.error('Erro no player de visualização do YouTube:', error);
                                if (videoContainerEl) videoContainerEl.innerHTML = '<p class="youtube-error">Não foi possível carregar o vídeo.</p>';
                            }
                        }
                    });
                } else {
                    console.warn('API do YouTube não carregada para visualização. Vídeo pode não ser exibido.');
                    if (videoContainerEl) {
                         videoContainerEl.innerHTML = '<p class="youtube-error">Carregando vídeo...</p>';
                    }
                }
            }
        }
        // Exibe o cartão (se existir)
        if (cardViewEl) cardViewEl.classList.remove('hidden');
        triggerEmojiRain();
    };

    // --- Função Principal para o Modo de VISUALIZAÇÃO ---
    const mainViewMode = async (cardId) => {
        try {
            if (loadingStateEl) loadingStateEl.classList.remove('hidden');
            if (errorStateEl) errorStateEl.classList.add('hidden');

            const cardData = await fetchCardData(cardId);
            cardDataGlobal = cardData; // Armazena globalmente

            if (typeof YT !== 'undefined' && typeof YT.Player !== 'undefined') {
                console.log('API do YouTube já carregada para o modo de visualização.');
                window.renderCardContent(cardData);
            } else {
                console.log('Aguardando a API do YouTube para o modo de visualização. onYouTubeIframeAPIReady será chamada.');
                if (videoContainerEl) {
                     videoContainerEl.innerHTML = '<p class="youtube-error">Carregando vídeo...</p>';
                }
            }
        } catch (error) {
            console.error('Erro na inicialização do cartão (modo visualização):', error.message);
            if (errorStateEl) {
                errorStateEl.textContent = `Erro ao carregar o cartão: ${error.message}`;
                errorStateEl.classList.remove('hidden');
            }
        } finally {
            if (loadingStateEl) loadingStateEl.classList.add('hidden');
        }
    }

    // --- Lógica de Inicialização Principal ---
    // Esta lógica agora assume que card.js SÓ é usado na página de VISUALIZAÇÃO (card.html)
    const params = new URLSearchParams(window.location.search);
    const cardIdFromUrl = params.get('id');

    if (cardIdFromUrl) {
        console.log('Modo: Visualização de Cartão (card.js). ID:', cardIdFromUrl);
        mainViewMode(cardIdFromUrl);
    } else {
        // Se card.js estiver sendo carregado sem um ID, é um erro para esta página.
        console.error('Erro: Este script (card.js) deve ser carregado na página de visualização com um ID de cartão na URL.');
        if (loadingStateEl) loadingStateEl.classList.add('hidden');
        if (errorStateEl) {
            errorStateEl.textContent = 'Ops! Não encontramos um ID de cartão para exibir. O link pode estar incorreto.';
            errorStateEl.classList.remove('hidden');
        }
        // Opcional: Esconder cardViewEl se estiver visível por algum motivo
        if (cardViewEl) cardViewEl.classList.add('hidden');
    }
}); // Fim do DOMContentLoaded