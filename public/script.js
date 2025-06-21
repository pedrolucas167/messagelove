/**
 * @file script.js
 * @description Script para a página de CRIAÇÃO de cartões (index.html), lida com formulário, upload, YouTube, autenticação e envio para o backend.
 * @author Pedro Marques
 * @version 3.2.0
 */
const CardCreatorApp = (() => {
    // 1. Configurações e Estado
    const config = {
        IS_LOCAL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1',
        get API_URL() {
            return this.IS_LOCAL 
                ? 'http://localhost:3001/api' 
                : 'https://messagelove-backend.onrender.com/api';
        },
        LOGIN_URL: '/login.html'
    };
    const state = { youtubeVideoId: null, youtubeStartTime: null };

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
        youtubeStartTimeInput: document.getElementById('youtubeStartTimeInput'), // Novo input
        addYoutubeUrlBtn: document.getElementById('addYoutubeUrlBtn'),
        youtubeErrorEl: document.getElementById('youtubeError'),
        youtubePreviewContainer: document.getElementById('youtubePreviewContainer'),
        youtubePlayerIframe: document.getElementById('youtubePlayer'),
        youtubeVideoIdInputHidden: document.getElementById('youtubeVideoIdInputHidden'),
        appNotificationArea: document.getElementById('appNotificationArea'),
        successModal: document.getElementById('successModal'),
        closeModalBtn: document.getElementById('closeModalBtn'),
        createAnotherBtn: document.getElementById('createAnotherBtn'),
        generatedCardLinkInput: document.getElementById('generatedCardLink'),
        copyLinkBtn: document.getElementById('copyLinkBtn'),
        viewCardBtn: document.getElementById('viewCardBtn'),
        logoutBtn: document.getElementById('logoutBtn') // Novo botão
    };

    // 3. Módulo de Autenticação
    const auth = {
        isLoggedIn() {
            return !!localStorage.getItem('token');
        },
        getToken() {
            return localStorage.getItem('token');
        },
        logout() {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = config.LOGIN_URL;
        },
        requireLogin() {
            if (!this.isLoggedIn()) {
                ui.showNotification('Faça login para criar um cartão.', 'error');
                setTimeout(() => window.location.href = config.LOGIN_URL, 1000);
                return false;
            }
            return true;
        }
    };

    // 4. Módulo de UI
    const ui = {
        setSubmitButtonState(isLoading) {
            if (!elements.submitBtn) return;
            elements.submitBtn.disabled = isLoading;
            elements.submitBtnText.hidden = isLoading;
            elements.submitBtnLoading.hidden = !isLoading;
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
            elements.generatedCardLinkInput.value = cardUrl;
            elements.viewCardBtn.href = cardUrl;
        },
        closeSuccessModal() {
            if (!elements.successModal) return;
            elements.successModal.classList.remove('active');
            setTimeout(() => { elements.successModal.hidden = true; }, 300);
            elements.cardForm.hidden = false;
        },
        async copyLinkToClipboard() {
            if (!elements.generatedCardLinkInput) return;
            try {
                await navigator.clipboard.writeText(elements.generatedCardLinkInput.value);
                const originalText = elements.copyLinkBtn.textContent;
                elements.copyLinkBtn.textContent = 'Copiado!';
                this.showNotification('Link copiado para a área de transferência!', 'success');
                setTimeout(() => elements.copyLinkBtn.textContent = originalText, 2000);
            } catch (err) {
                console.error('Falha ao copiar o link:', err);
                this.showNotification('Não foi possível copiar o link.', 'error');
            }
        },
        resetYouTubeUI() {
            elements.youtubeUrlInput.value = '';
            elements.youtubeStartTimeInput.value = '';
            elements.youtubeErrorEl.textContent = '';
            elements.youtubePreviewContainer.classList.remove('active');
            elements.youtubePlayerIframe.src = '';
            elements.youtubeVideoIdInputHidden.value = '';
            state.youtubeVideoId = null;
            state.youtubeStartTime = null;
        },
        addLogoutButton() {
            if (auth.isLoggedIn() && elements.logoutBtn) {
                elements.logoutBtn.hidden = false;
                elements.logoutBtn.addEventListener('click', auth.logout);
            }
        }
    };

    // 5. Módulo do YouTube
    const youtube = {
        getVideoId(url) {
            const patterns = [
                /(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/|live\/))([a-zA-Z0-9_-]{11})/,
                /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
                /(?:youtube\.com\/(?:playlist\?list=|channel\/|user\/|c\/|attribution_link\?a=))([a-zA-Z0-9_-]{11})/
            ];
            for (const pattern of patterns) {
                const match = url.match(pattern);
                if (match) return match[1];
            }
            return null;
        },
        async validateVideo(videoId) {
            try {
                const response = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`, {
                    headers: { 'Accept': 'application/json' }
                });
                return response.ok;
            } catch {
                return false;
            }
        },
        updateIframe(videoId, startTime = 0) {
            const src = `https://www.youtube.com/embed/${videoId}?controls=1&rel=0&modestbranding=1&playsinline=1&start=${startTime}`;
            elements.youtubePlayerIframe.src = src;
            elements.youtubePlayerIframe.setAttribute('title', 'Pré-visualização do vídeo do YouTube');
            elements.youtubePreviewContainer.classList.add('active');
        },
        async handleYouTubeUrl() {
            const url = elements.youtubeUrlInput.value.trim();
            const startTime = parseInt(elements.youtubeStartTimeInput.value.trim(), 10) || 0;

            if (!url) {
                ui.showNotification('Por favor, insira um link do YouTube.', 'error');
                elements.youtubeErrorEl.textContent = 'Link do YouTube inválido.';
                ui.resetYouTubeUI();
                return;
            }

            const videoId = this.getVideoId(url);
            if (!videoId) {
                ui.showNotification('Link do YouTube inválido.', 'error');
                elements.youtubeErrorEl.textContent = 'Link do YouTube inválido.';
                ui.resetYouTubeUI();
                return;
            }

            if (isNaN(startTime) || startTime < 0) {
                ui.showNotification('Tempo inicial do vídeo inválido.', 'error');
                elements.youtubeErrorEl.textContent = 'Tempo inicial deve ser um número não negativo.';
                ui.resetYouTubeUI();
                return;
            }

            const isValidVideo = await this.validateVideo(videoId);
            if (!isValidVideo) {
                ui.showNotification('O vídeo do YouTube não está disponível.', 'error');
                elements.youtubeErrorEl.textContent = 'O vídeo do YouTube não está disponível.';
                ui.resetYouTubeUI();
                return;
            }

            state.youtubeVideoId = videoId;
            state.youtubeStartTime = startTime;
            elements.youtubeVideoIdInputHidden.value = videoId;
            this.updateIframe(videoId, startTime);
            elements.youtubeErrorEl.textContent = '';
            ui.showNotification('Vídeo do YouTube adicionado com sucesso!', 'success');
        }
    };

    // 6. Módulo da Foto
    const photo = {
        handleUpload(event) {
            const file = event.target.files[0];
            if (file) {
                if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
                    ui.showNotification('Apenas imagens JPEG, PNG ou WebP são permitidas.', 'error');
                    return;
                }
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

    // 7. Módulo de Formulário
    const form = {
        async handleSubmit(event) {
            event.preventDefault();
            if (!auth.requireLogin()) return;

            const requiredFields = [elements.deInput, elements.nomeInput, elements.mensagemInput];
            if (requiredFields.some(input => !input.value.trim())) {
                ui.showNotification('Preencha seu nome, o do destinatário e a mensagem.', 'error');
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
            if (state.youtubeVideoId) {
                formData.append('youtubeVideoId', state.youtubeVideoId);
                if (state.youtubeStartTime) {
                    formData.append('youtubeStartTime', state.youtubeStartTime.toString());
                }
            }
            if (elements.fotoUploadInput.files[0]) {
                formData.append('foto', elements.fotoUploadInput.files[0]);
            }

            try {
                const response = await fetch(`${config.API_URL}/cards`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${auth.getToken()}` },
                    body: formData
                });
                const result = await response.json();
                
                if (!response.ok) {
                    if (response.status === 401) {
                        auth.logout();
                        throw new Error('Sessão expirada. Faça login novamente.');
                    }
                    if (response.status === 429) {
                        throw new Error('Muitas requisições. Tente novamente mais tarde.');
                    }
                    if (result.errors) {
                        throw new Error(result.errors.map(e => e.msg).join(', '));
                    }
                    throw new Error(result.message || `Erro ${response.status}`);
                }

                if (result.cardId) {
                    ui.openSuccessModal(result.cardId);
                    elements.cardForm.reset();
                    ui.resetYouTubeUI();
                    photo.remove();
                    ui.showNotification('Cartão criado com sucesso!', 'success');
                } else {
                    throw new Error('ID do cartão não recebido do servidor.');
                }
            } catch (error) {
                console.error('Erro no envio do formulário:', error);
                ui.showNotification(`Falha ao criar o cartão: ${error.message}`, 'error', 7000);
            } finally {
                ui.setSubmitButtonState(false);
            }
        }
    };

    // 8. Vinculação de Eventos
    const bindEvents = () => {
        if (elements.cardForm) elements.cardForm.addEventListener('submit', form.handleSubmit.bind(form));
        if (elements.fotoUploadInput) elements.fotoUploadInput.addEventListener('change', photo.handleUpload.bind(photo));
        if (elements.removeFotoBtn) elements.removeFotoBtn.addEventListener('click', photo.remove.bind(photo));
        if (elements.addYoutubeUrlBtn) elements.addYoutubeUrlBtn.addEventListener('click', youtube.handleYouTubeUrl.bind(youtube));
        if (elements.copyLinkBtn) elements.copyLinkBtn.addEventListener('click', ui.copyLinkToClipboard.bind(ui));
        if (elements.closeModalBtn) elements.closeModalBtn.addEventListener('click', ui.closeSuccessModal.bind(ui));
        if (elements.createAnotherBtn) elements.createAnotherBtn.addEventListener('click', () => {
            elements.cardForm.reset();
            ui.closeSuccessModal();
            ui.resetYouTubeUI();
            photo.remove();
            elements.cardForm.hidden = false;
        });
        if (elements.successModal) {
            elements.successModal.addEventListener('click', (e) => {
                if (e.target === elements.successModal) ui.closeSuccessModal();
            });
        }
    };

    // 9. Inicialização
    const init = () => {
        console.log(`DOM Content Loaded - Iniciando CardCreatorApp. API_URL: ${config.API_URL}`);
        ui.addLogoutButton();
        bindEvents();
    };

    return { init };
})();

document.addEventListener('DOMContentLoaded', CardCreatorApp.init);