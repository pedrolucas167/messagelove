/**
 * @file script.js
 * @description Main script for the MessageLove application. Manages particle animations, UI interactions,
 * authentication, and API communication.
 * @author Pedro Marques
 * @version 6.1.0
 */
document.addEventListener('DOMContentLoaded', () => {
    const MessageLoveApp = (() => {
        // Configuration
        const config = {
            API_URL: window.location.hostname.includes('localhost') 
                ? 'http://localhost:3001/api' 
                : 'https://messagelove-backend.onrender.com/api',
            PARTICLE_DENSITY: { mobile: 20000, desktop: 9000 },
        };

        // Application state
        const state = {
            currentUser: null,
            particlesArray: [],
        };

        // DOM elements
        const elements = {
            // Sections
            welcomeSection: document.getElementById('welcomeSection'),
            dashboardSection: document.getElementById('dashboardSection'),
            creationSection: document.getElementById('creationSection'),
            // Authentication
            authModal: document.getElementById('authModal'),
            loginFormContainer: document.getElementById('loginFormContainer'),
            registerFormContainer: document.getElementById('registerFormContainer'),
            resetPasswordFormContainer: document.getElementById('resetPasswordFormContainer'),
            loginForm: document.getElementById('loginForm'),
            loginSubmitBtn: document.getElementById('loginSubmitBtn'),
            registerForm: document.getElementById('registerForm'),
            registerSubmitBtn: document.getElementById('registerSubmitBtn'),
            openLoginBtn: document.getElementById('openLoginBtn'),
            openRegisterBtn: document.getElementById('openRegisterBtn'),
            closeAuthModalBtn: document.getElementById('closeAuthModalBtn'),
            showRegisterBtn: document.getElementById('showRegisterBtn'),
            showLoginBtn: document.getElementById('showLoginBtn'),
            showForgotPasswordBtn: document.getElementById('showForgotPasswordBtn'),
            showLoginFromResetBtn: document.getElementById('showLoginFromResetBtn'),
            // Other UI
            logoutBtn: document.getElementById('logoutBtn'),
            appNotificationArea: document.getElementById('appNotificationArea'),
            userWelcomeMessage: document.getElementById('userWelcomeMessage'),
            particleCanvas: document.getElementById('particle-canvas'),
            currentYear: document.getElementById('currentYear'),
        };

        // Particle Animation Module
        const particles = {
            init() {
                if (!elements.particleCanvas) return;
                const ctx = elements.particleCanvas.getContext('2d');
                this.resizeCanvas();
                
                const animate = () => {
                    ctx.clearRect(0, 0, elements.particleCanvas.width, elements.particleCanvas.height);
                    state.particlesArray.forEach(particle => {
                        particle.x += particle.directionX;
                        particle.y += particle.directionY;
                        if (particle.x > elements.particleCanvas.width || particle.x < 0) particle.directionX = -particle.directionX;
                        if (particle.y > elements.particleCanvas.height || particle.y < 0) particle.directionY = -particle.directionY;
                        ctx.beginPath();
                        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2, false);
                        ctx.fillStyle = particle.color;
                        ctx.fill();
                    });
                    requestAnimationFrame(animate);
                };

                this.createParticles();
                animate();

                let resizeTimeout;
                window.addEventListener('resize', () => {
                    clearTimeout(resizeTimeout);
                    resizeTimeout = setTimeout(() => {
                        this.resizeCanvas();
                        this.createParticles();
                    }, 250);
                });
            },
            createParticles() {
                state.particlesArray = [];
                const density = window.innerWidth < 768 ? config.PARTICLE_DENSITY.mobile : config.PARTICLE_DENSITY.desktop;
                const numberOfParticles = (elements.particleCanvas.height * elements.particleCanvas.width) / density;
                
                for (let i = 0; i < numberOfParticles; i++) {
                    state.particlesArray.push({
                        x: Math.random() * elements.particleCanvas.width,
                        y: Math.random() * elements.particleCanvas.height,
                        directionX: Math.random() * 0.4 - 0.2,
                        directionY: Math.random() * 0.4 - 0.2,
                        size: Math.random() * 2 + 1,
                        color: 'rgba(217, 70, 239, 0.5)',
                    });
                }
            },
            resizeCanvas() {
                if (elements.particleCanvas) {
                    elements.particleCanvas.width = window.innerWidth;
                    elements.particleCanvas.height = window.innerHeight;
                }
            },
        };

        // API Module
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

        // UI Module
        const ui = {
            showView(viewName) {
                [elements.welcomeSection, elements.dashboardSection, elements.creationSection].forEach(section => 
                    section?.classList.add('hidden'));
                elements[`${viewName}Section`]?.classList.remove('hidden');
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
                if (!elements.appNotificationArea) return;
                const notification = document.createElement('div');
                const baseClasses = 'p-4 mb-4 text-sm md:text-base rounded-lg shadow-lg text-white transition-all duration-300 ease-in-out transform';
                const typeClasses = {
                    info: 'bg-blue-500',
                    success: 'bg-green-500',
                    error: 'bg-red-600',
                };

                notification.className = `${baseClasses} ${typeClasses[type] || typeClasses.info} opacity-0 translate-y-4`;
                notification.textContent = message;
                elements.appNotificationArea.appendChild(notification);
                
                requestAnimationFrame(() => {
                    notification.classList.remove('opacity-0', 'translate-y-4');
                });

                setTimeout(() => {
                    notification.classList.add('opacity-0');
                    notification.addEventListener('transitionend', () => notification.remove(), { once: true });
                }, duration);
            },
            showAuthForm(formToShow) {
                [elements.loginFormContainer, elements.registerFormContainer, elements.resetPasswordFormContainer].forEach(form => 
                    form?.classList.add('hidden'));
                formToShow?.classList.remove('hidden');
            },
            openModal(initialForm) {
                elements.authModal?.classList.remove('hidden');
                setTimeout(() => elements.authModal?.classList.remove('opacity-0'), 10);
                elements.authModal?.querySelector('.modal-content')?.classList.remove('scale-95');
                this.showAuthForm(initialForm);
            },
            closeModal() {
                elements.authModal?.classList.add('opacity-0');
                elements.authModal?.querySelector('.modal-content')?.classList.add('scale-95');
                setTimeout(() => elements.authModal?.classList.add('hidden'), 300);
            },
            updateFooterYear() {
                if (elements.currentYear) {
                    elements.currentYear.textContent = new Date().getFullYear();
                }
            },
        };

        // Authentication Module
        const auth = {
            handleLoginSuccess(result, isRegistration = false) {
                localStorage.setItem('token', result.token);
                localStorage.setItem('user', JSON.stringify(result.user));
                state.currentUser = result.user;
                ui.closeModal();
                elements.loginForm?.reset();
                elements.registerForm?.reset();
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
                const { name, email, password } = elements.registerForm;
                ui.setButtonLoading(elements.registerSubmitBtn, true);
                try {
                    const result = await api.register(name.value, email.value, password.value);
                    this.handleLoginSuccess(result, true);
                } catch (error) {
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
            },
        };

        // Event Binding
        const bindEvents = () => {
            elements.logoutBtn?.addEventListener('click', auth.logout.bind(auth));
            elements.loginForm?.addEventListener('submit', auth.login.bind(auth));
            elements.registerForm?.addEventListener('submit', auth.register.bind(auth));
            elements.openLoginBtn?.addEventListener('click', () => ui.openModal(elements.loginFormContainer));
            elements.openRegisterBtn?.addEventListener('click', () => ui.openModal(elements.registerFormContainer));
            elements.closeAuthModalBtn?.addEventListener('click', ui.closeModal.bind(ui));
            elements.authModal?.addEventListener('click', (e) => {
                if (e.target === elements.authModal) ui.closeModal();
            });
            elements.showRegisterBtn?.addEventListener('click', () => ui.showAuthForm(elements.registerFormContainer));
            elements.showLoginBtn?.addEventListener('click', () => ui.showAuthForm(elements.loginFormContainer));
            elements.showForgotPasswordBtn?.addEventListener('click', () => ui.showAuthForm(elements.resetPasswordFormContainer));
            elements.showLoginFromResetBtn?.addEventListener('click', () => ui.showAuthForm(elements.loginFormContainer));
        };

        // Initialization
        const init = () => {
            console.log('MessageLoveApp Initialized.');
            particles.init();
            ui.updateFooterYear();
            auth.init();
            bindEvents();
        };

        return { init };
    })();

    MessageLoveApp.init();
});