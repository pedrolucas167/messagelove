/**
 * @file script.js
 * @description Script para a página inicial (index.html) do Messagelove, gerencia autenticação, criação de cartões, upload de fotos e vídeos do YouTube.
 * @author Pedro Marques
 * @version 3.5.1
 */
const CardCreatorApp = (() => {
    // Configurações
    const config = {
        IS_LOCAL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1',
        get API_URL() {
            return this.IS_LOCAL ? 'http://localhost:3001/api' : 'https://messagelove-backend.onrender.com/api';
        }
    };

    // Estado
    const state = {
        youtube: { videoId: null, startTime: null }
    };

    // Seletores do DOM
    const elements = {
        cardSection: document.getElementById('cardSection'),
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
        removeFotoBtn: document.getElementById('removeFoto'),
        youtubeUrlInput: document.getElementById('youtubeUrlInput'),
        youtubeStartTimeInput: document.getElementById('youtubeStartTimeInput'),
        addYoutubeUrlBtn: document.getElementById('addYoutubeUrlBtn'),
        youtubeErrorEl: document.getElementById('youtubeError'),
        youtubePreviewContainer: document.getElementById('youtubePreviewContainer'),
        youtubePlayerIframe: document.getElementById('youtubePlayer'),
        youtubeVideoIdInputHidden: document.getElementById('youtubeVideoIdInputHidden'),
        authModal: document.getElementById('authModal'),
        closeAuthModalBtn: document.getElementById('closeAuthModalBtn'),
        loginFormContainer: document.getElementById('loginFormContainer'),
        registerFormContainer: document.getElementById('registerFormContainer'),
        loginForm: document.getElementById('loginForm'),
        loginSubmitBtn: document.getElementById('loginSubmitBtn'),
        loginEmail: document.getElementById('loginEmail'),
        loginPassword: document.getElementById('loginPassword'),
        loginSubmitBtnText: document.querySelector('#loginSubmitBtn .btn-text'),
        loginSubmitBtnLoading: document.querySelector('#loginSubmitBtn .btn-loading'),
        showRegisterBtn: document.getElementById('showRegisterBtn'),
        registerForm: document.getElementById('registerForm'),
        registerSubmitBtn: document.getElementById('registerSubmitBtn'),
        registerEmail: document.getElementById('registerEmail'),
        registerPassword: document.getElementById('registerPassword'),
        registerConfirmPassword: document.getElementById('registerConfirmPassword'),
        registerSubmitBtnText: document.querySelector('#registerSubmitBtn .btn-text'),
        registerSubmitBtnLoading: document.querySelector('#registerSubmitBtn .btn-loading'),
        showLoginBtn: document.getElementById('showLoginBtn'),
        successModal: document.getElementById('successModal'),
        closeModalBtn: document.getElementById('closeModalBtn'),
        createAnotherBtn: document.getElementById('createAnotherBtn'),
        generatedCardLinkInput: document.getElementById('generatedCardLink'),
        copyLinkBtn: document.getElementById('copyLinkBtn'),
        viewCardBtn: document.getElementById('viewCardBtn'),
        logoutBtn: document.getElementById('logoutBtn'),
        appNotificationArea: document.getElementById('appNotificationArea'),
        currentYear: document.getElementById('currentYear') // Adicionado
    };

    // Módulo de Validação
    const validation = {
        isValidEmail(email) {
            return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        },
        isValidPassword(password) {
            return password.length >= 8;
        },
        isValidText(text) {
            return text.trim().length > 0;
        }
    };

    // Módulo de UI
    const ui = {
        setButtonState(button, textEl, loadingEl, isLoading) {
            button.disabled = isLoading;
            textEl.hidden = isLoading;
            loadingEl.hidden = !isLoading;
        },
        showNotification(message, type = 'info', duration = 3000) {
            const notificationEl = document.createElement('div');
            notificationEl.className = `notification notification--${type}`;
            notificationEl.innerHTML = `<span>${message}</span><button class="notification__close" aria-label="Fechar notificação">×</button>`;
            elements.appNotificationArea.appendChild(notificationEl);
            const close = () => {
                notificationEl.classList.add('notification--removing');
                notificationEl.addEventListener('animationend', () => notificationEl.remove(), { once: true });
            };
            notificationEl.querySelector('.notification__close').addEventListener('click', close, { once: true });
            if (duration) setTimeout(close, duration);
        },
        showAuthModal(mode = 'login') {
            elements.authModal.hidden = false;
            elements.cardSection.hidden = true;
            setTimeout(() => elements.authModal.classList.add('active'), 10);
            elements.loginFormContainer.hidden = mode !== 'login';
            elements.registerFormContainer.hidden = mode === 'login';
            const focusInput = mode === 'login' ? elements.loginEmail : elements.registerEmail;
            focusInput.focus();
        },
        hideAuthModal() {
            elements.authModal.classList.remove('active');
            setTimeout(() => {
                elements.authModal.hidden = true;
                elements.loginForm.reset();
                elements.registerForm.reset();
            }, 300);
            if (auth.isLoggedIn()) {
                elements.cardSection.hidden = false;
            }
        },
        showSuccessModal(cardId) {
            const cardUrl = `${window.location.origin}/card.html?id=${cardId}`;
            elements.cardSection.hidden = true;
            elements.successModal.hidden = false;
            setTimeout(() => elements.successModal.classList.add('active'), 10);
            elements.generatedCardLinkInput.value = cardUrl;
            elements.viewCardBtn.href = cardUrl;
        },
        hideSuccessModal() {
            elements.successModal.classList.remove('active');
            setTimeout(() => {
                elements.successModal.hidden = true;
                elements.cardSection.hidden = false;
            }, 300);
        },
        resetYouTubeUI() {
            elements.youtubeUrlInput.value = '';
            elements.youtubeStartTimeInput.value = '';
            elements.youtubeErrorEl.textContent = '';
            elements.youtubePreviewContainer.classList.remove('active');
            elements.youtubePlayerIframe.src = '';
            elements.youtubeVideoIdInputHidden.value = '';
            state.youtube.videoId = null;
            state.youtube.startTime = null;
        },
        updateLogoutButton() {
            elements.logoutBtn.hidden = !auth.isLoggedIn();
        },
        async copyLinkToClipboard() {
            try {
                await navigator.clipboard.writeText(elements.generatedCardLinkInput.value);
                const originalText = elements.copyLinkBtn.textContent;
                elements.copyLinkBtn.textContent = 'Copiado!';
                this.showNotification('Link copiado para a área de transferência!', 'success');
                setTimeout(() => elements.copyLinkBtn.textContent = originalText, 2000);
            } catch (err) {
                console.error('Erro ao copiar link:', err);
                this.showNotification('Não foi possível copiar o link.', 'error');
            }
        }
    };

    // Módulo de Autenticação
    const auth = {
        isLoggedIn() {
            return !!localStorage.getItem('token');
        },
        getToken() {
            return localStorage.getItem('token');
        },
        async login(event) {
            event.preventDefault();
            const email = elements.loginEmail.value.trim();
            const password = elements.loginPassword.value.trim();
            if (!validation.isValidEmail(email)) {
                ui.showNotification('E-mail inválido.', 'error');
                return;
            }
            if (!validation.isValidPassword(password)) {
                ui.showNotification('A senha deve ter no mínimo 8 caracteres.', 'error');
                return;
            }
            ui.setButtonState(elements.loginSubmitBtn, elements.loginSubmitBtnText, elements.loginSubmitBtnLoading, true);
            try {
                const response = await fetch(`${config.API_URL}/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                const result = await response.json();
                if (!response.ok) {
                    if (response.status === 429) throw new Error('Muitas tentativas. Tente novamente mais tarde.');
                    throw new Error(result.message || 'Erro ao fazer login.');
                }
                localStorage.setItem('token', result.token);
                localStorage.setItem('user', JSON.stringify({ email }));
                ui.hideAuthModal();
                ui.showNotification('Login realizado com sucesso!', 'success');
                ui.updateLogoutButton();
            } catch (error) {
                console.error('Erro no login:', error);
                ui.showNotification(`Falha ao fazer login: ${error.message}`, 'error', 7000);
            } finally {
                ui.setButtonState(elements.loginSubmitBtn, elements.loginSubmitBtnText, elements.loginSubmitBtnLoading, false);
            }
        },
        async register(event) {
            event.preventDefault();
            const email = elements.registerEmail.value.trim();
            const password = elements.registerPassword.value.trim();
            const confirmPassword = elements.registerConfirmPassword.value.trim();
            if (!validation.isValidEmail(email)) {
                ui.showNotification('E-mail inválido.', 'error');
                return;
            }
            if (!validation.isValidPassword(password)) {
                ui.showNotification('A senha deve ter no mínimo 8 caracteres.', 'error');
                return;
            }
            if (password !== confirmPassword) {
                ui.showNotification('As senhas não coincidem.', 'error');
                return;
            }
            ui.setButtonState(elements.registerSubmitBtn, elements.registerSubmitBtnText, elements.registerSubmitBtnLoading, true);
            try {
                const response = await fetch(`${config.API_URL}/auth/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                const result = await response.json();
                if (!response.ok) {
                    if (response.status === 429) throw new Error('Muitas tentativas. Tente novamente mais tarde.');
                    throw new Error(result.message || 'Erro ao cadastrar.');
                }
                localStorage.setItem('token', result.token);
                localStorage.setItem('user', JSON.stringify({ email }));
                ui.hideAuthModal();
                ui.showNotification('Cadastro realizado com sucesso!', 'success');
                ui.updateLogoutButton();
            } catch (error) {
                console.error('Erro no registro:', error);
                ui.showNotification(`Falha ao cadastrar: ${error.message}`, 'error', 7000);
            } finally {
                ui.setButtonState(elements.registerSubmitBtn, elements.registerSubmitBtnText, elements.registerSubmitBtnLoading, false);
            }
        },
        logout() {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            ui.showNotification('Você saiu da sessão.', 'info');
            ui.showAuthModal('login');
            ui.updateLogoutButton();
        },
        checkAuth() {
            if (!this.isLoggedIn()) {
                ui.showAuthModal('login');
            } else {
                elements.cardSection.hidden = false;
                ui.updateLogoutButton();
            }
        }
    };

    // Módulo do YouTube
    const youtube = {
        getVideoId(url) {
            const patterns = [
                /(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/|live\/))([a-zA-Z0-9_-]{11})/,
                /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/
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
            elements.youtubePreviewContainer.classList.add('active');
        },
        async handleYouTubeUrl() {
            const url = elements.youtubeUrlInput.value.trim();
            const startTime = parseInt(elements.youtubeStartTimeInput.value, 10) || 0;
            if (!url) {
                ui.showNotification('Por favor, insira um link do YouTube.', 'error');
                elements.youtubeErrorEl.textContent = 'Link do YouTube inválido.';
                return;
            }
            const videoId = this.getVideoId(url);
            if (!videoId) {
                ui.showNotification('Link do YouTube inválido.', 'error');
                elements.youtubeErrorEl.textContent = 'Link do YouTube inválido.';
                return;
            }
            if (isNaN(startTime) || startTime < 0) {
                ui.showNotification('Tempo inicial inválido.', 'error');
                elements.youtubeErrorEl.textContent = 'Tempo inicial deve ser um número não negativo.';
                return;
            }
            const isValidVideo = await this.validateVideo(videoId);
            if (!isValidVideo) {
                ui.showNotification('O vídeo do YouTube não está disponível.', 'error');
                elements.youtubeErrorEl.textContent = 'O vídeo do YouTube não está disponível.';
                return;
            }
            state.youtube.videoId = videoId;
            state.youtube.startTime = startTime;
            elements.youtubeVideoIdInputHidden.value = videoId;
            this.updateIframe(videoId, startTime);
            elements.youtubeErrorEl.textContent = '';
            ui.showNotification('Vídeo do YouTube adicionado com sucesso!', 'success');
        }
    };

    // Módulo de Foto
    const photo = {
        handleUpload(event) {
            const file = event.target.files[0];
            if (!file) return;
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
        },
        remove() {
            elements.fotoUploadInput.value = '';
            elements.fotoPreviewImg.src = '';
            elements.fotoPreviewContainer.hidden = true;
        }
    };

    // Módulo de Formulário
    const form = {
        async handleSubmit(event) {
            event.preventDefault();
            if (!auth.isLoggedIn()) {
                ui.showAuthModal('login');
                return;
            }
            const requiredFields = [elements.deInput, elements.nomeInput, elements.mensagemInput];
            if (!requiredFields.every(input => validation.isValidText(input.value))) {
                ui.showNotification('Preencha todos os campos obrigatórios.', 'error');
                return;
            }
            ui.setButtonState(elements.submitBtn, elements.submitBtnText, elements.submitBtnLoading, true);
            const formData = new FormData();
            formData.append('de', elements.deInput.value.trim());
            formData.append('para', elements.nomeInput.value.trim());
            formData.append('mensagem', elements.mensagemInput.value.trim());
            if (elements.dataInput.value) formData.append('data', elements.dataInput.value);
            if (state.youtube.videoId) {
                formData.append('youtubeVideoId', state.youtube.videoId);
                if (state.youtube.startTime) formData.append('youtubeStartTime', state.youtube.startTime.toString());
            }
            if (elements.fotoUploadInput.files[0]) formData.append('foto', elements.fotoUploadInput.files[0]);
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
                    if (response.status === 429) throw new Error('Muitas requisições. Tente novamente mais tarde.');
                    if (result.errors) throw new Error(result.errors.map(e => e.msg).join(', '));
                    throw new Error(result.message || `Erro ${response.status}`);
                }
                if (result.cardId) {
                    ui.showSuccessModal(result.cardId);
                    elements.cardForm.reset();
                    ui.resetYouTubeUI();
                    photo.remove();
                    ui.showNotification('Cartão criado com sucesso!', 'success');
                } else {
                    throw new Error('ID do cartão não recebido.');
                }
            } catch (error) {
                console.error('Erro no envio do formulário:', error);
                ui.showNotification(`Falha ao criar o cartão: ${error.message}`, 'error', 7000);
            } finally {
                ui.setButtonState(elements.submitBtn, elements.submitBtnText, elements.submitBtnLoading, false);
            }
        }
    };

    // Vinculação de Eventos
    const bindEvents = () => {
        elements.cardForm?.addEventListener('submit', form.handleSubmit);
        elements.fotoUploadInput?.addEventListener('change', photo.handleUpload);
        elements.removeFotoBtn?.addEventListener('click', photo.remove);
        elements.addYoutubeUrlBtn?.addEventListener('click', youtube.handleYouTubeUrl);
        elements.copyLinkBtn?.addEventListener('click', ui.copyLinkToClipboard);
        elements.closeModalBtn?.addEventListener('click', ui.hideSuccessModal);
        elements.createAnotherBtn?.addEventListener('click', () => {
            elements.cardForm.reset();
            ui.hideSuccessModal();
            ui.resetYouTubeUI();
            photo.remove();
        });
        elements.successModal?.addEventListener('click', (e) => {
            if (e.target === elements.successModal) ui.hideSuccessModal();
        });
        elements.loginForm?.addEventListener('submit', auth.login);
        elements.registerForm?.addEventListener('submit', auth.register);
        elements.closeAuthModalBtn?.addEventListener('click', ui.hideAuthModal);
        elements.authModal?.addEventListener('click', (e) => {
            if (e.target === elements.authModal) ui.hideAuthModal();
        });
        elements.showRegisterBtn?.addEventListener('click', () => ui.showAuthModal('register'));
        elements.showLoginBtn?.addEventListener('click', () => ui.showAuthModal('login'));
        elements.logoutBtn?.addEventListener('click', auth.logout);
    };

    // Inicialização
    const init = () => {
        console.log(`Iniciando CardCreatorApp. API_URL: ${config.API_URL}`);
        bindEvents();
        auth.checkAuth();
        if (elements.currentYear) {
            elements.currentYear.textContent = new Date().getFullYear();
        } else {
            console.warn('Elemento #currentYear não encontrado no DOM.');
        }
    };

    return { init };
})();

document.addEventListener('DOMContentLoaded', CardCreatorApp.init);