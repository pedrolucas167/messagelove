/**
 * @file script.js
 * @description Script principal para a aplicação MessageLove. Gerencia as "views" (telas),
 * autenticação, interatividade da UI, e a lógica de criação e visualização de cartões.
 * @author Pedro Marques
 * @version 5.0.0
 */
document.addEventListener('DOMContentLoaded', () => {
    const MessageLoveApp = (() => {
        // 1. ================= MÓDULOS =================
        const config = {
            API_URL: window.location.hostname.includes('localhost') ? 'http://localhost:3001/api' : 'https://messagelove-backend.onrender.com/api'
        };
        const state = { currentUser: null };

        const elements = {
            // Views
            welcomeSection: document.getElementById('welcomeSection'),
            dashboardSection: document.getElementById('dashboardSection'),
            // Auth
            openLoginBtn: document.getElementById('openLoginBtn'),
            openRegisterBtn: document.getElementById('openRegisterBtn'),
            logoutBtn: document.getElementById('logoutBtn'),
            // Modal
            authModal: document.getElementById('authModal'),
            closeAuthModalBtn: document.getElementById('closeAuthModalBtn'),
            loginFormContainer: document.getElementById('loginFormContainer'),
            registerFormContainer: document.getElementById('registerFormContainer'),
            loginForm: document.getElementById('loginForm'),
            registerForm: document.getElementById('registerForm'),
            showRegisterBtn: document.getElementById('showRegisterBtn'),
            showLoginBtn: document.getElementById('showLoginBtn'),
            // Global
            appNotificationArea: document.getElementById('appNotificationArea'),
            particleCanvas: document.getElementById('particle-canvas'),
        };

        const api = {
            // ... (seu módulo de API existente)
            login: (email, password) => api.request('/auth/login', { /* ... */ }),
            register: (name, email, password) => api.request('/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password }) }),
        };

        const ui = {
            // ... (seu módulo de UI existente)
        };

        const auth = {
            // ... (suas funções de login, logout, etc.)
            
            // NOVA FUNÇÃO DE REGISTRO
            async register(event) {
                event.preventDefault();
                const form = event.target;
                const name = form.name.value;
                const email = form.email.value;
                const password = form.password.value;
                const confirmPassword = form.confirmPassword.value;

                if (!name || !email || !password) {
                    return ui.showNotification('Por favor, preencha todos os campos.', 'error');
                }
                if (password.length < 8) {
                    return ui.showNotification('A senha deve ter no mínimo 8 caracteres.', 'error');
                }
                if (password !== confirmPassword) {
                    return ui.showNotification('As senhas não coincidem.', 'error');
                }

                ui.setButtonLoading(elements.registerSubmitBtn, true);
                try {
                    const result = await api.register(name, email, password);
                    this.handleLoginSuccess(result); // Faz o login automático
                } catch(error) {
                    ui.showNotification(error.message || 'Não foi possível cadastrar.', 'error');
                } finally {
                    ui.setButtonLoading(elements.registerSubmitBtn, false);
                }
            },
        };

        // 2. ================= INICIALIZAÇÃO E EVENTOS =================
        const bindEvents = () => {
            // ... (seus eventos de modal e login)
            elements.registerForm?.addEventListener('submit', auth.register.bind(auth));
        };
        
        const init = () => {
            // Integra a lógica de partículas e UI do seu snippet
            const canvas = elements.particleCanvas;
            if (canvas) {
                // ... (código da animação de partículas que você forneceu)
            }
            // ... resto da sua lógica de inicialização
            bindEvents();
            auth.init();
        };

        return { init };
    })();

    MessageLoveApp.init();
});
