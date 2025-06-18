/**
 * @file script.js
 * @description Script para a página de CRIAÇÃO de cartões (index.html), lida com formulário, upload, YouTube e envio para o backend.
 * @author Pedro Marques
 * @version 2.0.0
 */

// --- Módulo de Criação de Cartão ---
const CardCreatorApp = (() => {
    // 1. Configurações e Estado da Aplicação
    const config = {
        IS_LOCAL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1',
        get API_URL() {
            return this.IS_LOCAL 
                ? 'http://localhost:3001/api' 
                : 'https://messagelove-backend.onrender.com/api';
        }
    };

    const state = {
        youtubePlayer: null,
    };

    // 2. Centralização dos Seletores do DOM
    const elements = {
        cardForm: document.getElementById('cardForm'),
        submitBtn: document.getElementById('submitBtn'),
        submitBtnText: document.querySelector('#submitBtn .btn-text'),
        submitBtnLoading: document.querySelector('#submitBtn .btn-loading'),
        nomeInput: document.getElementById('nome'),
        mensagemInput: document.getElementById('mensagem'),
        dataInput: document.getElementById('data'),
        fotoUploadInput: document.getElementById('fotoUpload'),
        fotoPreviewContainer: document.querySelector('[data-js="preview-container"]'),
        fotoPreviewImg: document.querySelector('[data-js="foto-preview"]'),
        removeFotoBtn: document.querySelector('[data-js="remove-foto"]'),
        youtubeUrlInput: document.getElementById('youtubeUrlInput'),
        youtubeStartTimeMinInput: document.getElementById('youtubeStartTimeMin'), // NOVO
        youtubeStartTimeSecInput: document.getElementById('youtubeStartTimeSec'), // NOVO
        addYoutubeUrlBtn: document.getElementById('addYoutubeUrlBtn'),
        youtubeErrorEl: document.getElementById('youtubeError'),
        youtubePreviewContainer: document.getElementById('youtubePreviewContainer'),
        youtubePlayerIframe: document.getElementById('youtubePlayer'),
        youtubeVideoIdInputHidden: document.getElementById('youtubeVideoId'),
        appNotificationArea: document.getElementById('appNotificationArea'),
    };

    // 3. Funções Utilitárias
    const utils = {
        showNotification(message, type = 'info', duration = 3000) {
            if (!elements.appNotificationArea) {
                console.warn('Área de notificação não encontrada.');
                return;
            }
            const notificationEl = document.createElement('div');
            notificationEl.className = `notification notification--${type}`;
            notificationEl.innerHTML = `<span>${message}</span><button class="notification__close">×</button>`;
            elements.appNotificationArea.appendChild(notificationEl);

            const close = () => {
                notificationEl.classList.add('notification--removing');
                notificationEl.addEventListener('animationend', () => notificationEl.remove());
            };

            notificationEl.querySelector('.notification__close').addEventListener('click', close);
            if (duration) {
                setTimeout(close, duration);
            }
        }
    };

    // 4. Módulo de Lógica do YouTube
    const youtube = {
        onApiReady() {
            console.log('API do YouTube carregada e pronta (modo CRIAÇÃO).');
            // Se já houver uma URL, tenta inicializar o player
            if (elements.youtubeUrlInput.value.trim()) {
                this.initPlayer();
            }
        },
        parseUrl(url) {
            const regExp = /(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
            const match = url.match(regExp);
            return (match && match[1]) ? match[1] : null;
        },
        getStartTime() {
            const minutes = parseInt(elements.youtubeStartTimeMinInput.value, 10) || 0;
            const seconds = parseInt(elements.youtubeStartTimeSecInput.value, 10) || 0;
            return (minutes * 60) + seconds;
        },
        initPlayer() {
            elements.youtubeErrorEl.textContent = '';
            const url = elements.youtubeUrlInput.value.trim();
            if (!url) {
                utils.showNotification('Por favor, insira um link do YouTube.', 'error');
                return;
            }

            const videoId = this.parseUrl(url);
            if (!videoId) {
                elements.youtubeErrorEl.textContent = 'Link do YouTube inválido. Por favor, verifique.';
                elements.youtubePreviewContainer.classList.remove('active');
                elements.youtubeVideoIdInputHidden.value = '';
                return;
            }

            const startSeconds = this.getStartTime();
            elements.youtubeVideoIdInputHidden.value = videoId;
            elements.youtubePreviewContainer.classList.add('active');
            
            const playerVars = { 
                'controls': 1, 
                'rel': 0, 
                'modestbranding': 1,
                'start': startSeconds 
            };

            if (typeof YT === 'undefined' || typeof YT.Player === 'undefined') {
                utils.showNotification('API do YouTube ainda não carregada. Tente novamente em alguns segundos.', 'warn');
                return;
            }

            if (state.youtubePlayer) {
                state.youtubePlayer.loadVideoById({ videoId, startSeconds });
            } else {
                state.youtubePlayer = new YT.Player(elements.youtubePlayerIframe, {
                    height: '100%',
                    width: '100%',
                    videoId: videoId,
                    playerVars: playerVars,
                    events: {
                        'onReady': () => console.log('Player de CRIAÇÃO pronto.'),
                        'onError': (error) => {
                            console.error('Erro no player de criação do YouTube:', error);
                            elements.youtubeErrorEl.textContent = 'Não foi possível carregar o vídeo. Verifique o link.';
                            elements.youtubePreviewContainer.classList.remove('active');
                        }
                    }
                });
            }
        }
    };

    // 5. Módulo de Lógica da Foto
    const photo = {
        handleUpload(event) {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    elements.fotoPreviewImg.src = e.target.result;
                    elements.fotoPreviewContainer.hidden = false;
                };
                reader.readAsDataURL(file);
            }
        },
        remove() {
            elements.fotoUploadInput.value = ''; // Limpa o seletor de arquivo
            elements.fotoPreviewImg.src = '';
            elements.fotoPreviewContainer.hidden = true;
        }
    };

    // 6. Módulo de Lógica do Formulário
    const form = {
        setSubmitButtonState(isLoading) {
            if (elements.submitBtn) {
                elements.submitBtn.disabled = isLoading;
                if(elements.submitBtnText) elements.submitBtnText.hidden = isLoading;
                if(elements.submitBtnLoading) elements.submitBtnLoading.hidden = !isLoading;
            }
        },
        async handleSubmit(event) {
            event.preventDefault();

            if (!elements.nomeInput.value.trim() || !elements.mensagemInput.value.trim()) {
                utils.showNotification('Por favor, preencha o nome e a mensagem.', 'error');
                return;
            }

            this.setSubmitButtonState(true);

            const formData = new FormData();
            formData.append('de', 'Seu Nome'); // Considere adicionar um campo "de" no HTML
            formData.append('para', elements.nomeInput.value.trim());
            formData.append('mensagem', elements.mensagemInput.value.trim());

            if (elements.dataInput.value) {
                formData.append('data', elements.dataInput.value);
            }
            if (elements.youtubeVideoIdInputHidden.value) {
                const startTime = youtube.getStartTime();
                formData.append('youtubeVideoId', elements.youtubeVideoIdInputHidden.value);
                formData.append('youtubeStartTime', startTime); // Envia o tempo de início
            }
            if (elements.fotoUploadInput.files[0]) {
                formData.append('foto', elements.fotoUploadInput.files[0]);
            }

            try {
                const response = await fetch(`${config.API_URL}/cards`, {
                    method: 'POST',
                    body: formData,
                });

                const result = await response.json();

                if (!response.ok) {
                    throw new Error(result.message || 'Erro desconhecido ao criar o cartão.');
                }

                if (result.cardId) {
                    utils.showNotification('Cartão criado com sucesso!', 'success', 5000);
                    setTimeout(() => {
                        window.location.href = `/card.html?id=${result.cardId}`;
                    }, 1000);
                } else {
                    throw new Error('ID do cartão não foi recebido do servidor.');
                }

            } catch (error) {
                console.error('Erro no envio do formulário:', error);
                utils.showNotification(`Falha ao criar o cartão: ${error.message}`, 'error', 7000);
                this.setSubmitButtonState(false);
            }
            // Não precisa de finally aqui, pois o estado do botão só deve ser resetado em caso de erro. Em caso de sucesso, a página redireciona.
        }
    };

    // 7. Vinculação de Eventos
    const bindEvents = () => {
        if (elements.cardForm) {
            elements.cardForm.addEventListener('submit', form.handleSubmit.bind(form));
        }
        if (elements.fotoUploadInput) {
            elements.fotoUploadInput.addEventListener('change', photo.handleUpload.bind(photo));
        }
        if (elements.removeFotoBtn) {
            elements.removeFotoBtn.addEventListener('click', photo.remove.bind(photo));
        }
        if (elements.addYoutubeUrlBtn) {
            elements.addYoutubeUrlBtn.addEventListener('click', youtube.initPlayer.bind(youtube));
        }
    };
    
    // 8. Inicialização
    const init = () => {
        console.log(`DOM Content Loaded - Iniciando CardCreatorApp. API_URL: ${config.API_URL}`);
        bindEvents();
    };

    // Expor métodos/propriedades públicas (Interface Pública)
    return {
        init: init,
        onYouTubeApiReady: youtube.onApiReady.bind(youtube) // Expor para ser chamado globalmente
    };
})();

// --- Ponto de Entrada Global ---
document.addEventListener('DOMContentLoaded', CardCreatorApp.init);

/**
 * Função global exigida pela API do YouTube.
 * Ela chama o método correspondente dentro do nosso módulo encapsulado.
 */
function onYouTubeIframeAPIReady() {
    CardCreatorApp.onYouTubeApiReady();
}