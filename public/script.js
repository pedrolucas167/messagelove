/**
 * @file script.js
 * @description Script para a página de CRIAÇÃO de cartões (index.html), lida com formulário, upload, YouTube e envio para o backend.
 * @author Pedro Marques
 * @version 3.0.0 (Final & Production Ready)
 */
const CardCreatorApp = (() => {
    // 1. Configurações e Estado
    const config = {
        IS_LOCAL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1',
        get API_URL() {
            // CORRIGIDO: Adicionado /api no final da URL de produção
            return this.IS_LOCAL 
                ? 'http://localhost:3001/api' 
                : 'https://messagelove-backend.onrender.com/api';
        }
    };
    const state = { youtubePlayer: null };

    // 2. Seletores do DOM
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
        // CORRIGIDO: O ID do elemento oculto estava errado.
        youtubeVideoIdInputHidden: document.getElementById('youtubeVideoIdInputHidden'),
        appNotificationArea: document.getElementById('appNotificationArea'),
        successModal: document.getElementById('successModal'),
        closeModalBtn: document.getElementById('closeModalBtn'),
        createAnotherBtn: document.getElementById('createAnotherBtn'),
        generatedCardLinkInput: document.getElementById('generatedCardLink'),
        copyLinkBtn: document.getElementById('copyLinkBtn'),
        viewCardBtn: document.getElementById('viewCardBtn'),
    };

    // 3. Módulo de UI
    const ui = {
        setSubmitButtonState(isLoading) {
            if (!elements.submitBtn) return;
            elements.submitBtn.disabled = isLoading;
            if (elements.submitBtnText) elements.submitBtnText.hidden = isLoading;
            if (elements.submitBtnLoading) elements.submitBtnLoading.hidden = !isLoading;
        },
        showNotification(message, type = 'info', duration = 3000) {
            if (!elements.appNotificationArea) return;
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
        },
        openSuccessModal(cardId) {
            const cardUrl = `${window.location.origin}/card.html?id=${cardId}`;
            if (!elements.successModal) return;
            elements.cardForm.hidden = true;
            elements.successModal.hidden = false;
            setTimeout(() => elements.successModal.classList.add('active'), 10);
            if (elements.generatedCardLinkInput) elements.generatedCardLinkInput.value = cardUrl;
            if (elements.viewCardBtn) elements.viewCardBtn.href = cardUrl;
        },
        closeSuccessModal() {
            if (!elements.successModal) return;
            elements.successModal.classList.remove('active');
            setTimeout(() => { elements.successModal.hidden = true; }, 300);
        },
        async copyLinkToClipboard() {
            if (!elements.generatedCardLinkInput) return;
            try {
                await navigator.clipboard.writeText(elements.generatedCardLinkInput.value);
                const originalText = elements.copyLinkBtn.textContent;
                elements.copyLinkBtn.textContent = 'Copiado!';
                this.showNotification('Link copiado para a área de transferência!', 'success');
                setTimeout(() => {
                    if (elements.copyLinkBtn) elements.copyLinkBtn.textContent = originalText;
                }, 2000);
            } catch (err) {
                console.error('Falha ao copiar o link: ', err);
                this.showNotification('Não foi possível copiar o link.', 'error');
            }
        },
    };

    // 4. Módulo do YouTube
    const youtube = {
        onApiReady() {
            console.log('API do YouTube carregada e pronta.');
        },
        parseUrl(url) {
            const match = url.match(/(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
            return (match && match[1]) ? match[1] : null;
        },
        initPlayer() {
            if (typeof YT === 'undefined' || typeof YT.Player === 'undefined') {
                ui.showNotification('API do YouTube ainda não carregada. Tente novamente.', 'warn');
                return;
            }
            const url = elements.youtubeUrlInput.value.trim();
            if (!url) {
                ui.showNotification('Por favor, insira um link do YouTube.', 'error');
                return;
            }
            const videoId = this.parseUrl(url);
            if (!videoId) {
                this._updateUI('error', 'Link do YouTube inválido.');
                return;
            }
            this._updateUI('success');
            if (elements.youtubeVideoIdInputHidden) {
                elements.youtubeVideoIdInputHidden.value = videoId;
            }
            this._createOrUpdatePlayer(videoId);
        },
        _createOrUpdatePlayer(videoId) {
            const playerVars = { 'controls': 1, 'rel': 0, 'modestbranding': 1 };
            if (state.youtubePlayer && typeof state.youtubePlayer.loadVideoById === 'function') {
                state.youtubePlayer.loadVideoById({ videoId });
            } else {
                state.youtubePlayer = new YT.Player(elements.youtubePlayerIframe, { height: '100%', width: '100%', videoId: videoId, playerVars: playerVars, events: { 'onReady': () => console.log('Player de CRIAÇÃO pronto.'), 'onError': (e) => this._handlePlayerError(e) } });
            }
        },
        _updateUI(uiState, message = '') {
            if (uiState === 'success') {
                elements.youtubeErrorEl.textContent = '';
                elements.youtubePreviewContainer.classList.add('active');
            } else if (uiState === 'error') {
                elements.youtubeErrorEl.textContent = message;
                elements.youtubePreviewContainer.classList.remove('active');
                if (elements.youtubeVideoIdInputHidden) elements.youtubeVideoIdInputHidden.value = '';
                if (state.youtubePlayer && typeof state.youtubePlayer.destroy === 'function') { state.youtubePlayer.destroy(); state.youtubePlayer = null; }
            }
        },
        _handlePlayerError(error) {
            console.error('Erro no player de criação do YouTube:', error);
            this._updateUI('error', 'Não foi possível carregar o vídeo. Verifique o link.');
        }
    };

    // 5. Módulo da Foto
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

    // 6. Módulo de Formulário
    const form = {
        async handleSubmit(event) {
            event.preventDefault();
            if (!elements.deInput.value.trim() || !elements.nomeInput.value.trim() || !elements.mensagemInput.value.trim()) {
                ui.showNotification('Por favor, preencha seu nome, o do destinatário e a mensagem.', 'error');
                return;
            }
            
            ui.setSubmitButtonState(true);

            const formData = new FormData();
            formData.append('de', elements.deInput.value.trim());
            formData.append('para', elements.nomeInput.value.trim());
            formData.append('mensagem', elements.mensagemInput.value.trim());

            if (elements.dataInput.value) {
                formData.append('data', elements.dataInput.value);
            }
            if (elements.youtubeVideoIdInputHidden && elements.youtubeVideoIdInputHidden.value) {
                formData.append('youtubeVideoId', elements.youtubeVideoIdInputHidden.value);
            }
            if (elements.fotoUploadInput.files[0]) {
                formData.append('foto', elements.fotoUploadInput.files[0]);
            }

            try {
                const response = await fetch(`${config.API_URL}/cards`, {
                    method: 'POST',
                    body: formData
                });
                const result = await response.json();
                if (!response.ok) throw new Error(result.message || `Erro ${response.status}`);
                
                if (result.cardId) {
                    ui.openSuccessModal(result.cardId);
                } else {
                    throw new Error('ID do cartão não foi recebido do servidor.');
                }
            } catch (error) {
                console.error('Erro no envio do formulário:', error);
                ui.showNotification(`Falha ao criar o cartão: ${error.message}`, 'error', 7000);
                ui.setSubmitButtonState(false); // Reativa o botão apenas em caso de erro
            }
        }
    };

    // 7. Vinculação de Eventos
    const bindEvents = () => {
        // Mapeamento explícito para clareza e segurança
        if (elements.cardForm) elements.cardForm.addEventListener('submit', form.handleSubmit.bind(form));
        if (elements.fotoUploadInput) elements.fotoUploadInput.addEventListener('change', photo.handleUpload.bind(photo));
        if (elements.removeFotoBtn) elements.removeFotoBtn.addEventListener('click', photo.remove.bind(photo));
        if (elements.addYoutubeUrlBtn) elements.addYoutubeUrlBtn.addEventListener('click', youtube.initPlayer.bind(youtube));
        
        // Eventos do Modal
        if (elements.copyLinkBtn) elements.copyLinkBtn.addEventListener('click', ui.copyLinkToClipboard.bind(ui));
        if (elements.closeModalBtn) elements.closeModalBtn.addEventListener('click', ui.closeSuccessModal.bind(ui));
        if (elements.createAnotherBtn) elements.createAnotherBtn.addEventListener('click', () => window.location.reload());
        if (elements.successModal) {
            elements.successModal.addEventListener('click', (e) => {
                if (e.target === elements.successModal) ui.closeSuccessModal();
            });
        }
    };
    
    // 8. Inicialização
    const init = () => {
        console.log(`DOM Content Loaded - Iniciando CardCreatorApp. API_URL: ${config.API_URL}`);
        bindEvents();
    };

    return {
        init,
        onYouTubeApiReady: youtube.onApiReady.bind(youtube)
    };
})();

document.addEventListener('DOMContentLoaded', CardCreatorApp.init);

function onYouTubeIframeAPIReady() {
    CardCreatorApp.onYouTubeApiReady();
}