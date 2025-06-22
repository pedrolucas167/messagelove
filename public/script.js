/**
 * @file script.js
 * @description Script para a APLICAÇÃO de cartões, lida com criação, autenticação e visualização de cartões do usuário.
 * @author Pedro Marques
 * @version 4.0.0
 */
const CardCreatorApp = (() => {
    // 1. Configurações e Estado Centralizado
    const config = {
        IS_LOCAL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1',
        get API_URL() {
            return this.IS_LOCAL 
                ? 'http://localhost:3001/api' 
                : 'https://messagelove-backend.onrender.com/api';
        }
    };
    const state = {
        youtubeVideoId: null,
        youtubeStartTime: null,
        currentUser: null, // NOVO: Guarda o objeto do usuário logado
        userCards: []      // NOVO: Guarda os cartões do usuário
    };

    // 2. Seletores do DOM (Adicionados novos elementos para dashboard e recuperação de senha)
    const elements = {
        // ... (todos os seus seletores existentes) ...
        cardForm: document.getElementById('cardForm'),
        submitBtn: document.getElementById('submitBtn'),
        // ...
        logoutBtn: document.getElementById('logoutBtn'),
        authModal: document.getElementById('authModal'),
        // ...
        
        // NOVO: Elementos do Dashboard
        dashboardContainer: document.getElementById('dashboardContainer'),
        userWelcomeMessage: document.getElementById('userWelcomeMessage'),
        userCardsList: document.getElementById('userCardsList'),
        showCreateFormBtn: document.getElementById('showCreateFormBtn'),

        // NOVO: Elementos de Recuperação de Senha
        forgotPasswordBtn: document.getElementById('forgotPasswordBtn'),
        resetPasswordFormContainer: document.getElementById('resetPasswordFormContainer'),
        resetPasswordForm: document.getElementById('resetPasswordForm'),
        resetEmailInput: document.getElementById('resetEmailInput'),
        resetPasswordSubmitBtn: document.getElementById('resetPasswordSubmitBtn'),
        showLoginFromResetBtn: document.getElementById('showLoginFromResetBtn')
    };

    // 3. Módulo de API (NOVO: Centraliza todas as chamadas fetch)
    const api = {
        async request(endpoint, options = {}) {
            const token = auth.getToken();
            const headers = { ...options.headers };

            // Não adiciona Content-Type para FormData, o browser faz isso.
            if (!(options.body instanceof FormData)) {
                headers['Content-Type'] = 'application/json';
            }
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            try {
                const response = await fetch(`${config.API_URL}${endpoint}`, { ...options, headers });
                const result = await response.json().catch(() => ({})); // Evita erro se a resposta for vazia

                if (!response.ok) {
                    const error = new Error(result.message || `Erro ${response.status}`);
                    error.status = response.status;
                    error.data = result;
                    throw error;
                }
                return result;
            } catch (error) {
                console.error(`Erro na API (${endpoint}):`, error);
                if (error.status === 401) auth.logout(); // Desloga se o token for inválido
                throw error; // Propaga o erro para ser tratado pela função que chamou
            }
        },
        login: (email, password) => api.request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
        register: (email, password) => api.request('/auth/register', { method: 'POST', body: JSON.stringify({ email, password }) }),
        createCard: (formData) => api.request('/cards', { method: 'POST', body: formData }),
        getMyCards: () => api.request('/cards/my-cards'), // NOVO: Endpoint do dashboard
        requestPasswordReset: (email) => api.request('/auth/request-reset', { method: 'POST', body: JSON.stringify({ email }) }) // NOVO
    };
    
    // 4. Módulo de UI (Atualizado)
    const ui = {
        // ... (todas as suas funções de UI existentes: setSubmitButtonState, showNotification, etc.) ...
        
        // NOVO: Renderiza a lista de cartões do usuário
        renderUserCards() {
            if (!elements.userCardsList) return;
            elements.userCardsList.innerHTML = ''; // Limpa a lista
            if (state.userCards.length === 0) {
                elements.userCardsList.innerHTML = '<p>Você ainda não criou nenhum cartão.</p>';
                return;
            }
            state.userCards.forEach(card => {
                const cardEl = document.createElement('div');
                cardEl.className = 'dashboard-card-item';
                cardEl.innerHTML = `
                    <p>Para: <strong>${card.para}</strong></p>
                    <p>Mensagem: "${card.mensagem.substring(0, 30)}..."</p>
                    <a href="/card.html?id=${card.id}" target="_blank">Ver Cartão</a>
                `;
                elements.userCardsList.appendChild(cardEl);
            });
        },
        
        // NOVO: Alterna entre a view de criação e a de dashboard
        showView(viewName) {
            elements.cardForm.hidden = viewName !== 'create';
            elements.dashboardContainer.hidden = viewName !== 'dashboard';
        },

        // ATUALIZADO: Atualiza a UI com base no estado de login
        updateAuthUI() {
            if (state.currentUser) {
                elements.logoutBtn.hidden = false;
                elements.userWelcomeMessage.textContent = `Olá, ${state.currentUser.name || state.currentUser.email}! Aqui estão seus cartões:`;
                this.showView('dashboard');
                api.getMyCards().then(cards => {
                    state.userCards = cards;
                    this.renderUserCards();
                }).catch(err => ui.showNotification('Não foi possível carregar seus cartões.', 'error'));
            } else {
                elements.logoutBtn.hidden = true;
                this.showView('create');
            }
        }
    };

    // 5. Módulo de Autenticação (Refatorado)
    const auth = {
        isLoggedIn: () => !!localStorage.getItem('token'),
        getToken: () => localStorage.getItem('token'),
        
        // ATUALIZADO: Armazena o usuário completo no estado
        handleLoginSuccess(result) {
            localStorage.setItem('token', result.token);
            localStorage.setItem('user', JSON.stringify(result.user)); // Armazena o usuário todo
            state.currentUser = result.user;
            ui.closeAuthModal();
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
            // ... (sua lógica de validação de formulário)
            ui.setSubmitButtonState(true, 'login');
            try {
                const result = await api.login(elements.loginEmail.value, elements.loginPassword.value);
                this.handleLoginSuccess(result);
            } catch (error) {
                ui.showNotification(error.message, 'error');
            } finally {
                ui.setSubmitButtonState(false, 'login');
            }
        },

        async register(event) {
            event.preventDefault();
            // ... (sua lógica de validação de formulário)
            ui.setSubmitButtonState(true, 'register');
            try {
                const result = await api.register(elements.registerEmail.value, elements.registerPassword.value);
                this.handleLoginSuccess(result); // Faz login automaticamente após o registro
            } catch (error) {
                ui.showNotification(error.message, 'error');
            } finally {
                ui.setSubmitButtonState(false, 'register');
            }
        },
        
        // NOVO: Lógica para recuperação de senha
        async requestPasswordReset(event) {
            event.preventDefault();
            const email = elements.resetEmailInput.value;
            if (!email) return ui.showNotification('Por favor, insira seu e-mail.', 'error');
            
            ui.setSubmitButtonState(true, 'reset'); // Precisa adicionar estados para este botão
            try {
                await api.requestPasswordReset(email);
                ui.showNotification('Se o e-mail estiver cadastrado, um link de recuperação foi enviado.', 'success');
                ui.closeAuthModal();
            } catch (error) {
                ui.showNotification(error.message, 'error');
            } finally {
                ui.setSubmitButtonState(false, 'reset');
            }
        },

        // ATUALIZADO: Agora apenas abre o modal, o estado inicial decide o que mostrar
        requireAuth() {
            if (!this.isLoggedIn()) {
                ui.openAuthModal('login');
                return false;
            }
            return true;
        }
    };

    // 6. Módulo do Formulário (Atualizado para usar o Módulo de API)
    const form = {
        async handleSubmit(event) {
            event.preventDefault();
            if (!auth.requireAuth()) return;
            // ... (sua lógica de validação de campos)
            ui.setSubmitButtonState(true);
            const formData = new FormData(elements.cardForm); // Forma mais simples de pegar os dados
            // ... (adicione dados do YouTube e da foto ao formData se necessário)
            
            try {
                const result = await api.createCard(formData);
                ui.openSuccessModal(result.cardId);
                elements.cardForm.reset();
                //...
                // NOVO: Atualiza a lista de cartões no dashboard
                state.userCards.unshift(result.card); // Adiciona o novo cartão no início da lista
                ui.renderUserCards();
            } catch (error) {
                ui.showNotification(error.message, 'error');
            } finally {
                ui.setSubmitButtonState(false);
            }
        }
    };

    // 7. Vinculação de Eventos (Atualizado com novos eventos)
    const bindEvents = () => {
        // ... (seus eventos existentes) ...
        if (elements.showCreateFormBtn) elements.showCreateFormBtn.addEventListener('click', () => ui.showView('create'));
        if (elements.forgotPasswordBtn) elements.forgotPasswordBtn.addEventListener('click', () => ui.openAuthModal('reset'));
        if (elements.resetPasswordForm) elements.resetPasswordForm.addEventListener('submit', auth.requestPasswordReset);
    };

    // 8. Inicialização (ATUALIZADO: Lógica mais inteligente)
    const init = () => {
        console.log(`DOM Content Loaded - Iniciando CardCreatorApp. API_URL: ${config.API_URL}`);
        
        // Tenta carregar o usuário do localStorage
        const storedUser = localStorage.getItem('user');
        if (auth.isLoggedIn() && storedUser) {
            state.currentUser = JSON.parse(storedUser);
            ui.updateAuthUI();
        } else {
            ui.showView('create'); // Mostra o formulário de criação por padrão
        }

        bindEvents();
    };

    return { init };
})();

document.addEventListener('DOMContentLoaded', CardCreatorApp.init);
