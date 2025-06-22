/**
 * @file script.js
 * @description Script principal para a aplicação MessageLove. Gerencia a lógica de negócio,
 * estado da aplicação, autenticação e comunicação com a API.
 * @author Pedro Marques
 * @version 6.0.0
 */
document.addEventListener('DOMContentLoaded', () => {
    const MessageLoveApp = (() => {
        const config = {
            API_URL: window.location.hostname.includes('localhost') ? 'http://localhost:3001/api' : 'https://messagelove-backend.onrender.com/api'
        };
        const state = { currentUser: null };

        const elements = {
            welcomeSection: document.getElementById('welcomeSection'),
            dashboardSection: document.getElementById('dashboardSection'),
            creationSection: document.getElementById('creationSection'),
            logoutBtn: document.getElementById('logoutBtn'),
            loginForm: document.getElementById('loginForm'),
            loginSubmitBtn: document.getElementById('loginSubmitBtn'),
            registerForm: document.getElementById('registerForm'),
            registerSubmitBtn: document.getElementById('registerSubmitBtn'),
            appNotificationArea: document.getElementById('appNotificationArea'),
            userWelcomeMessage: document.getElementById('userWelcomeMessage'),
        };

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
                    const result = await response.text().then(text => text ? JSON.parse(text) : {});

                    if (!response.ok) {
                        let errorMessage = `Erro ${response.status}: ${response.statusText}`;
                        if (result && result.message) {
                            errorMessage = result.message;
                        } else if (result && Array.isArray(result.errors)) {
                            errorMessage = result.errors.map(e => e.msg).join(' ');
                        }
                        const error = new Error(errorMessage);
                        error.status = response.status;
                        error.data = result;
                        throw error;
                    }
                    return result;
                } catch (error) {
                    console.error(`API Error on ${endpoint}:`, error);
                    if (error.status === 401) {
                        auth.logout();
                    }
                    throw error;
                }
            },
            login: (email, password) => api.request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
            register: (name, email, password) => api.request('/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password }) }),
            getMyCards: () => api.request('/cards'),
        };

        const ui = {
            showView(viewName) {
                [elements.welcomeSection, elements.dashboardSection, elements.creationSection].forEach(section => section?.classList.add('hidden'));
                const sectionToShow = elements[`${viewName}Section`];
                sectionToShow?.classList.remove('hidden');
            },
            updateAuthUI() {
                if (state.currentUser) {
                    elements.logoutBtn.classList.remove('hidden');
                    if (elements.userWelcomeMessage) {
                        elements.userWelcomeMessage.textContent = `Olá, ${state.currentUser.name}!`;
                    }
                    this.showView('dashboard');
                } else {
                    elements.logoutBtn.classList.add('hidden');
                    this.showView('welcome');
                }
            },
            setButtonLoading(btn, isLoading) {
                if (!btn) return;
                btn.disabled = isLoading;
                btn.classList.toggle('opacity-75', isLoading);
                btn.classList.toggle('cursor-not-allowed', isLoading);
            },
            showNotification(message, type = 'info', duration = 5000) {
                const area = elements.appNotificationArea;
                if (!area) return;

                const notification = document.createElement('div');
                const baseClasses = 'p-4 mb-4 text-sm md:text-base rounded-lg shadow-lg text-white transition-all duration-300 ease-in-out transform';
                const typeClasses = {
                    info: 'bg-blue-500',
                    success: 'bg-green-500',
                    error: 'bg-red-600',
                };

                notification.className = `${baseClasses} ${typeClasses[type] || typeClasses.info} opacity-0 translate-y-4`;
                notification.textContent = message;
                area.appendChild(notification);
                
                requestAnimationFrame(() => {
                    notification.classList.remove('opacity-0', 'translate-y-4');
                });

                setTimeout(() => {
                    notification.classList.add('opacity-0');
                    notification.addEventListener('transitionend', () => notification.remove(), { once: true });
                }, duration);
            }
        };

        const auth = {
            handleLoginSuccess(result, isRegistration = false) {
                localStorage.setItem('token', result.token);
                localStorage.setItem('user', JSON.stringify(result.user));
                state.currentUser = result.user;
                
                if (window.AppUI && typeof window.AppUI.closeModal === 'function') {
                    window.AppUI.closeModal();
                }
                
                elements.loginForm.reset();
                elements.registerForm.reset();

                const welcomeMessage = isRegistration 
                    ? `Bem-vindo, ${result.user.name}!` 
                    : `Login realizado com sucesso!`;
                ui.showNotification(welcomeMessage, 'success');
                ui.updateAuthUI();
            },
            logout() {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                state.currentUser = null;
                ui.showNotification('Você saiu da sua conta.', 'info');
                ui.updateAuthUI();
            },
            async login(event) {
                event.preventDefault();
                ui.setButtonLoading(elements.loginSubmitBtn, true);
                try {
                    const result = await api.login(elements.loginForm.email.value, elements.loginForm.password.value);
                    this.handleLoginSuccess(result);
                } catch (error) {
                    ui.showNotification(error.message || 'Falha na comunicação com o servidor.', 'error');
                } finally {
                    ui.setButtonLoading(elements.loginSubmitBtn, false);
                }
            },
            async register(event) {
                event.preventDefault();
                const form = elements.registerForm;
                const { name, email, password, confirmPassword } = form;

                if (password.value !== confirmPassword.value) {
                    return ui.showNotification('As senhas não coincidem.', 'error');
                }
                
                ui.setButtonLoading(elements.registerSubmitBtn, true);
                try {
                    const result = await api.register(name.value, email.value, password.value);
                    this.handleLoginSuccess(result, true);
                } catch(error) {
                    ui.showNotification(error.message || 'Não foi possível cadastrar.', 'error');
                } finally {
                    ui.setButtonLoading(elements.registerSubmitBtn, false);
                }
            },
            init() {
                const user = localStorage.getItem('user');
                if (user) {
                    try {
                        state.currentUser = JSON.parse(user);
                    } catch {
                        localStorage.clear();
                    }
                }
                ui.updateAuthUI();
            }
        };

        const bindEvents = () => {
            elements.logoutBtn?.addEventListener('click', auth.logout.bind(auth));
            elements.loginForm?.addEventListener('submit', auth.login.bind(auth));
            elements.registerForm?.addEventListener('submit', auth.register.bind(auth));
        };
        
        const init = () => {
            console.log('MessageLoveApp Lógica Inicializada.');
            auth.init();
            bindEvents();
        };

        return { init };
    })();

    if (window.AppUI) {
        MessageLoveApp.init();
    }
});