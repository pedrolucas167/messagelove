/**
 * @file script.js
 * @description Script para a página de CRIAÇÃO de cartões (index.html), lida com formulário, upload, YouTube e envio para o backend.
 * @author Pedro Marques
 * @version 2.4.0 (Removed YouTube Start Time feature)
 */
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

    // 2. Centralização dos Seletores do DOM (REMOVIDOS CAMPOS DE TEMPO)
    const elements = {
        cardForm: document.getElementById('cardForm'),
        submitBtn: document.getElementById('submitBtn'),
        submitBtnText: document.querySelector('#submitBtn .btn-text'),
        submitBtnLoading: document.querySelector('#submitBtn .btn-loading'),
        deInput: document.getElementById('deInput'),
        nomeInput: document.getElementById('nome'),
        mensagemInput: document.getElementById('mensagem'),
        dataInput: document.getElementById('data'),
        fotoUploadInput: document.getElementById('fotoUpload'),
        fotoPreviewContainer: document.querySelector('[data-js="preview-container"]'),
        fotoPreviewImg: document.querySelector('[data-js="foto-preview"]'),
        removeFotoBtn: document.querySelector('[data-js="remove-foto"]'),
        youtubeUrlInput: document.getElementById('youtubeUrlInput'),
        addYoutubeUrlBtn: document.getElementById('addYoutubeUrlBtn'),
        youtubeErrorEl: document.getElementById('youtubeError'),
        youtubePreviewContainer: document.getElementById('youtubePreviewContainer'),
        youtubePlayerIframe: document.getElementById('youtubePlayer'),
        youtubeVideoIdInputHidden: document.getElementById('youtubeVideoId'),
        appNotificationArea: document.getElementById('appNotificationArea'),
        successArea: document.getElementById('successArea'),
        generatedCardLinkInput: document.getElementById('generatedCardLink'),
        copyLinkBtn: document.getElementById('copyLinkBtn'),
        viewCardBtn: document.getElementById('viewCardBtn'),
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
            if (duration) setTimeout(close, duration);
        }
    };

    // 4. Módulo de Lógica do YouTube (REATORADO)
    const youtube = {
        onApiReady() {
            console.log('API do YouTube carregada e pronta (modo CRIAÇÃO).');
            if (elements.youtubeUrlInput.value.trim()) this.initPlayer();
        },
        parseUrl(url) {
            const regExp = /(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
            const match = url.match(regExp);
            return (match && match[1]) ? match[1] : null;
        },
        // REMOVIDA A FUNÇÃO getStartTime()
        initPlayer() {
            // A lógica de espera da API que implementamos anteriormente foi mesclada aqui para simplicidade
            if (typeof YT === 'undefined' || typeof YT.Player === 'undefined') {
                utils.showNotification('API do YouTube ainda não carregada. Tente novamente.', 'warn');
                return;
            }
            const url = elements.youtubeUrlInput.value.trim();
            if (!url) {
                utils.showNotification('Por favor, insira um link do YouTube.', 'error');
                return;
            }
            const videoId = this.parseUrl(url);
            if (!videoId) {
                this._updateUI('error', 'Link do YouTube inválido. Por favor, verifique.');
                return;
            }
            
            this._updateUI('success');
            elements.youtubeVideoIdInputHidden.value = videoId;
            this._createOrUpdatePlayer(videoId); // Não passa mais o startSeconds
        },
        _createOrUpdatePlayer(videoId) { // Não recebe mais o startSeconds
            // REMOVIDO 'start' de playerVars
            const playerVars = { 'controls': 1, 'rel': 0, 'modestbranding': 1 }; 
            if (state.youtubePlayer && typeof state.youtubePlayer.loadVideoById === 'function') {
                // Não precisa mais passar startSeconds
                state.youtubePlayer.loadVideoById({ videoId });
            } else {
                state.youtubePlayer = new YT.Player(elements.youtubePlayerIframe, {
                    height: '100%', width: '100%', videoId: videoId, playerVars: playerVars,
                    events: {
                        'onReady': () => console.log('Player de CRIAÇÃO pronto.'),
                        'onError': (e) => this._handlePlayerError(e)
                    }
                });
            }
        },
        _updateUI(uiState, message = '') {
            if (uiState === 'success') {
                elements.youtubeErrorEl.textContent = '';
                elements.youtubePreviewContainer.classList.add('active');
            } else if (uiState === 'error') {
                elements.youtubeErrorEl.textContent = message;
                elements.youtubePreviewContainer.classList.remove('active');
                elements.youtubeVideoIdInputHidden.value = '';
                if (state.youtubePlayer && typeof state.youtubePlayer.destroy === 'function') {
                    state.youtubePlayer.destroy();
                    state.youtubePlayer = null;
                }
            }
        },
        _handlePlayerError(error) {
            console.error('Erro no player de criação do YouTube:', error);
            this._updateUI('error', 'Não foi possível carregar o vídeo. Verifique o link ou se ele permite incorporação.');
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
            elements.fotoUploadInput.value = '';
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

        displaySuccess(cardId) {
            const cardUrl = `${window.location.origin}/card.html?id=${cardId}`;
            elements.cardForm.hidden = true;
            elements.successArea.hidden = false;
            elements.generatedCardLinkInput.value = cardUrl;
            elements.viewCardBtn.href = cardUrl;
        },

        async copyLinkToClipboard() {
            try {
                await navigator.clipboard.writeText(elements.generatedCardLinkInput.value);
                const originalText = elements.copyLinkBtn.textContent;
                elements.copyLinkBtn.textContent = 'Copiado!';
                utils.showNotification('Link copiado para a área de transferência!', 'success');
                setTimeout(() => {
                    elements.copyLinkBtn.textContent = originalText;
                }, 2000);
            } catch (err) {
                console.error('Falha ao copiar o link: ', err);
                utils.showNotification('Não foi possível copiar o link.', 'error');
            }
        },
        
        async handleSubmit(event) {
            event.preventDefault();

            if (!elements.deInput.value.trim() || !elements.nomeInput.value.trim() || !elements.mensagemInput.value.trim()) {
                utils.showNotification('Por favor, preencha seu nome, o do destinatário e a mensagem.', 'error');
                return;
            }

            this.setSubmitButtonState(true);

            const formData = new FormData();
            formData.append('de', elements.deInput.value.trim());
            formData.append('para', elements.nomeInput.value.trim());
            formData.append('mensagem', elements.mensagemInput.value.trim());

            if (elements.dataInput.value) formData.append('data', elements.dataInput.value);
            
            if (elements.youtubeVideoIdInputHidden.value) {
                formData.append('youtubeVideoId', elements.youtubeVideoIdInputHidden.value);
                // REMOVIDO: Envio do youtubeStartTime
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
                    this.displaySuccess(result.cardId);
                } else {
                    throw new Error('ID do cartão não foi recebido do servidor.');
                }
            } catch (error) {
                console.error('Erro no envio do formulário:', error);
                utils.showNotification(`Falha ao criar o cartão: ${error.message}`, 'error', 7000);
            } finally {
                this.setSubmitButtonState(false);
            }
        }
    };

    // 7. Vinculação de Eventos
    const bindEvents = () => {
        if (elements.cardForm) elements.cardForm.addEventListener('submit', form.handleSubmit.bind(form));
        if (elements.fotoUploadInput) elements.fotoUploadInput.addEventListener('change', photo.handleUpload.bind(photo));
        if (elements.removeFotoBtn) elements.removeFotoBtn.addEventListener('click', photo.remove.bind(photo));
        if (elements.addYoutubeUrlBtn) elements.addYoutubeUrlBtn.addEventListener('click', youtube.initPlayer.bind(youtube));
        if (elements.copyLinkBtn) elements.copyLinkBtn.addEventListener('click', form.copyLinkToClipboard.bind(form));
    };
    
    // 8. Inicialização
    const init = () => {
        console.log(`DOM Content Loaded - Iniciando CardCreatorApp. API_URL: ${config.API_URL}`);
        bindEvents();
    };

    return {
        init: init,
        onYouTubeApiReady: youtube.onApiReady.bind(youtube)
    };
})();

document.addEventListener('DOMContentLoaded', CardCreatorApp.init);

function onYouTubeIframeAPIReady() {
    CardCreatorApp.onYouTubeApiReady();
}