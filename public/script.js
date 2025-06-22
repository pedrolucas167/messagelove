
const MessageLoveApp = (() => {
    // 1. ================= MÓDULO DE CONFIGURAÇÃO E ESTADO =================
    const config = {
        API_URL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
            ? 'http://localhost:3001/api' 
            : 'https://messagelove-backend.onrender.com/api'
    };
    const state = {
        currentUser: null,
        userCards: [],
        youtubeVideoId: null,
        youtubeStartTime: null,
    };

    // 2. ================= SELETORES DO DOM =================
    const elements = {
        // Views Principais
        welcomeSection: document.getElementById('welcomeSection'),
        dashboardSection: document.getElementById('dashboardSection'),
        creationSection: document.getElementById('creationSection'),

        // Botões de Ação Principal
        openLoginBtn: document.getElementById('openLoginBtn'),
        openRegisterBtn: document.getElementById('openRegisterBtn'),
        logoutBtn: document.getElementById('logoutBtn'),

        // Dashboard
        userWelcomeMessage: document.getElementById('userWelcomeMessage'),
        userCardsList: document.getElementById('userCardsList'),
        showCreateFormBtn: document.getElementById('showCreateFormBtn'),
        showDashboardBtn: document.getElementById('showDashboardBtn'),

        // Modal de Autenticação
        authModal: document.getElementById('authModal'),
        closeAuthModalBtn: document.getElementById('closeAuthModalBtn'),
        
        // Formulários no Modal
        loginFormContainer: document.getElementById('loginFormContainer'),
        loginForm: document.getElementById('loginForm'),
        loginEmail: document.getElementById('loginEmail'),
        loginPassword: document.getElementById('loginPassword'),
        loginSubmitBtn: document.getElementById('loginSubmitBtn'),
        
        registerFormContainer: document.getElementById('registerFormContainer'),
        registerForm: document.getElementById('registerForm'),
        // Adicione seletores para campos de registro se forem diferentes

        resetPasswordFormContainer: document.getElementById('resetPasswordFormContainer'),
        resetPasswordForm: document.getElementById('resetPasswordForm'),
        // Adicione seletores para campos de reset

        // Links de troca de formulário no Modal
        showRegisterBtn: document.getElementById('showRegisterBtn'),
        showLoginBtn: document.getElementById('showLoginBtn'),
        showForgotPasswordBtn: document.getElementById('showForgotPasswordBtn'),
        showLoginFromResetBtn: document.getElementById('showLoginFromResetBtn'),
        
        // Notificações
        appNotificationArea: document.getElementById('appNotificationArea'),

        // ... Adicione aqui os seletores para o formulário de criação quando ele for integrado ...
    };

    // 3. ================= MÓDULO DE API (Centralizado) =================
    const api = {
        async request(endpoint, options = {}) {
            const token = localStorage.getItem('token');
            const headers = { ...options.headers };

            if (!(options.body instanceof FormData)) {
                headers['Content-Type'] = 'application/json';
            }
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            try {
                const response = await fetch(`${config.API_URL}${endpoint}`, { ...options, headers });
                const result = await response.json().catch(() => ({}));

                if (!response.ok) {
                    const error = new Error(result.error || `Erro ${response.status}`);
                    error.status = response.status;
                    error.data = result;
                    throw error;
                }
                return result;
            } catch (error) {
                console.error(`API Error on ${endpoint}:`, error);
                if (error.status === 401) auth.logout();
                throw error;
            }
        },
        login: (email, password) => api.request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
        register: (email, password, name) => api.request('/auth/register', { method: 'POST', body: JSON.stringify({ email, password, name }) }),
        getMyCards: () => api.request('/cards'), // Assumindo que GET /api/cards retorna os cartões do usuário autenticado
        // ... outras chamadas de API (createCard, requestPasswordReset, etc.)
    };

    // 4. ================= MÓDULO DE UI =================
    const ui = {
        showView(viewName) {
            [elements.welcomeSection, elements.dashboardSection, elements.creationSection].forEach(section => {
                if (section) section.classList.add('hidden');
            });
            const sectionToShow = elements[`${viewName}Section`];
            if (sectionToShow) sectionToShow.classList.remove('hidden');
        },
        
        updateAuthUI() {
            if (state.currentUser) {
                elements.logoutBtn.classList.remove('hidden');
                elements.userWelcomeMessage.textContent = `Olá, ${state.currentUser.name || state.currentUser.email}!`;
                this.showView('dashboard');
                this.fetchAndRenderCards();
            } else {
                elements.logoutBtn.classList.add('hidden');
                this.showView('welcome');
            }
        },

        async fetchAndRenderCards() {
            if (!elements.userCardsList) return;
            elements.userCardsList.innerHTML = `<div class="bg-gray-700 p-4 rounded-lg"><p class="text-gray-400 animate-pulse">Carregando seus cartões...</p></div>`;
            try {
                const cards = await api.getMyCards();
                state.userCards = cards;
                this.renderCards();
            } catch (error) {
                elements.userCardsList.innerHTML = `<div class="bg-red-900/50 text-red-300 p-4 rounded-lg"><p>Não foi possível carregar seus cartões. Tente recarregar a página.</p></div>`;
                this.showNotification('Falha ao carregar seus cartões.', 'error');
            }
        },

        renderCards() {
            if (!elements.userCardsList) return;
            elements.userCardsList.innerHTML = '';
            if (state.userCards.length === 0) {
                elements.userCardsList.innerHTML = `<div class="col-span-full text-center bg-gray-700/50 p-6 rounded-lg"><p class="text-gray-400">Você ainda não criou nenhum cartão. Que tal começar agora?</p></div>`;
                return;
            }
            state.userCards.forEach(card => {
                const cardEl = document.createElement('a');
                cardEl.href = `/card.html?id=${card.id}`;
                cardEl.target = '_blank';
                cardEl.className = 'block bg-gray-700 hover:bg-gray-600 p-4 rounded-lg transition-all transform hover:-translate-y-1';
                cardEl.innerHTML = `
                    <div class="font-bold text-white">Para: ${card.para}</div>
                    <p class="text-sm text-gray-300 mt-1 truncate">"${card.mensagem}"</p>
                    <div class="text-xs text-fuchsia-400 mt-3">Ver cartão &rarr;</div>
                `;
                elements.userCardsList.appendChild(cardEl);
            });
        },
        
        showNotification(message, type = 'info', duration = 4000) {
            const colors = {
                info: 'bg-blue-500',
                success: 'bg-green-500',
                error: 'bg-red-500',
            };
            const notificationEl = document.createElement('div');
            notificationEl.className = `p-4 rounded-lg text-white shadow-lg transform transition-all duration-300 translate-x-full ${colors[type]}`;
            notificationEl.innerHTML = `<span>${message}</span>`;
            elements.appNotificationArea.appendChild(notificationEl);
            
            setTimeout(() => notificationEl.classList.remove('translate-x-full'), 10);
            setTimeout(() => {
                notificationEl.classList.add('translate-x-full');
                notificationEl.addEventListener('transitionend', () => notificationEl.remove());
            }, duration);
        }
    };

    // 5. ================= MÓDULO DE AUTENTICAÇÃO =================
    const auth = {
        handleLoginSuccess(result) {
            localStorage.setItem('token', result.token);
            localStorage.setItem('user', JSON.stringify(result.user));
            state.currentUser = result.user;
            document.querySelector('#closeAuthModalBtn').click(); // Simula clique no botão de fechar
            ui.showNotification('Login realizado com sucesso!', 'success');
            ui.updateAuthUI();
        },

        logout() {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            state.currentUser = null;
            state.userCards = [];
            ui.showNotification('Você saiu da sessão.', 'info');
            ui.updateAuthUI();
        },

        async login(event) {
            event.preventDefault();
            const email = elements.loginEmail.value;
            const password = elements.loginPassword.value;
            // TODO: Adicionar feedback visual para o botão de loading
            try {
                const result = await api.login(email, password);
                this.handleLoginSuccess(result);
            } catch (error) {
                ui.showNotification(error.message || 'Credenciais inválidas.', 'error');
            }
        },
        
        init() {
            const token = localStorage.getItem('token');
            const user = localStorage.getItem('user');
            if (token && user) {
                state.currentUser = JSON.parse(user);
            }
            ui.updateAuthUI();
        }
    };

    // 6. ================= VINCULAÇÃO DE EVENTOS =================
    const bindEvents = () => {
        elements.openLoginBtn?.addEventListener('click', () => document.dispatchEvent(new CustomEvent('open-auth-modal', { detail: 'login' })));
        elements.openRegisterBtn?.addEventListener('click', () => document.dispatchEvent(new CustomEvent('open-auth-modal', { detail: 'register' })));
        elements.logoutBtn?.addEventListener('click', auth.logout);
        elements.loginForm?.addEventListener('submit', auth.login.bind(auth));
        
        elements.showCreateFormBtn?.addEventListener('click', () => ui.showView('creation'));
        elements.showDashboardBtn?.addEventListener('click', () => ui.showView('dashboard'));
    };

    // 7. ================= INICIALIZAÇÃO =================
    const init = () => {
        console.log('MessageLoveApp Inicializada.');
        auth.init();
        bindEvents();
    };

    return { init };
})();

MessageLoveApp.init();


document.addEventListener('open-auth-modal', (e) => {
 
    const authModal = document.getElementById('authModal');
    const loginFormContainer = document.getElementById('loginFormContainer');
    const registerFormContainer = document.getElementById('registerFormContainer');
    
    authModal.classList.remove('hidden');
    setTimeout(() => authModal.classList.remove('opacity-0'), 10);
    authModal.querySelector('.modal-content').classList.remove('scale-95');

    if (e.detail === 'login') {
        loginFormContainer.classList.remove('hidden');
        registerFormContainer.classList.add('hidden');
    } else {
        loginFormContainer.classList.add('hidden');
        registerFormContainer.classList.remove('hidden');
    }
});
