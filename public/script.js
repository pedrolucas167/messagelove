/**
 * @file script.js
 * @description Main script for the MessageLove application. Features elegant heart-shaped particle animations
 * for a romantic "correio elegante" theme, secure authentication, and UI interactions.
 * @author Pedro Marques
 * @version 6.3.1
 */
document.addEventListener('DOMContentLoaded', () => {
    const MessageLoveApp = (() => {
        // Configuration
        const config = {
            API_URL: window.location.hostname.includes('localhost') 
                ? 'http://localhost:3000/api' // Proxy for local dev
                : 'https://messagelove-backend.onrender.com/api',
            PARTICLE_DENSITY: { mobile: 30000, desktop: 15000 },
            PARTICLE_CONNECTION_DISTANCE: 80,
            PARTICLE_INTERACTION_RADIUS: 120,
            PARTICLE_COLORS: [
                'rgba(255, 182, 193, 0.7)', // Light pink
                'rgba(219, 112, 147, 0.6)', // Pale violet red
                'rgba(255, 245, 238, 0.5)', // Seashell white
                'rgba(221, 160, 221, 0.6)'  // Plum purple
            ],
            PARTICLE_GLOW: 'rgba(255, 105, 180, 0.8)' // Hot pink glow
        };

        // Application state
        const state = {
            currentUser: null,
            particlesArray: [],
            interactionPos: { x: null, y: null }
        };

        // DOM elements
        const elements = {
            welcomeSection: document.getElementById('welcomeSection'),
            dashboardSection: document.getElementById('dashboardSection'),
            creationSection: document.getElementById('creationSection'),
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
            logoutBtn: document.getElementById('logoutBtn'),
            appNotificationArea: document.getElementById('appNotificationArea'),
            userWelcomeMessage: document.getElementById('userWelcomeMessage'),
            particleCanvas: document.getElementById('particle-canvas'),
            currentYear: document.getElementById('currentYear')
        };

        // Particle Animation Module
        const particles = {
            init() {
                if (!elements.particleCanvas) return;
                const ctx = elements.particleCanvas.getContext('2d');
                this.resizeCanvas();

                // Interaction handlers (mouse and touch)
                const updateInteractionPos = (e, isTouch = false) => {
                    const rect = elements.particleCanvas.getBoundingClientRect();
                    const clientX = isTouch ? e.touches[0].clientX : e.clientX;
                    const clientY = isTouch ? e.touches[0].clientY : e.clientY;
                    state.interactionPos.x = clientX - rect.left;
                    state.interactionPos.y = clientY - rect.top;
                };

                window.addEventListener('mousemove', updateInteractionPos);
                window.addEventListener('touchmove', (e) => updateInteractionPos(e, true));
                window.addEventListener('mouseleave', () => {
                    state.interactionPos.x = null;
                    state.interactionPos.y = null;
                });
                window.addEventListener('touchend', () => {
                    state.interactionPos.x = null;
                    state.interactionPos.y = null;
                });

                const animate = () => {
                    // Soft fade for trails
                    ctx.fillStyle = 'rgba(0, 0, 0, 0.03)';
                    ctx.fillRect(0, 0, elements.particleCanvas.width, elements.particleCanvas.height);

                    state.particlesArray.forEach(particle => {
                        // Interaction attraction
                        if (state.interactionPos.x !== null && state.interactionPos.y !== null) {
                            const dx = state.interactionPos.x - particle.x;
                            const dy = state.interactionPos.y - particle.y;
                            const distance = Math.sqrt(dx * dx + dy * dy);
                            if (distance < config.PARTICLE_INTERACTION_RADIUS) {
                                const force = (config.PARTICLE_INTERACTION_RADIUS - distance) / config.PARTICLE_INTERACTION_RADIUS;
                                particle.directionX -= dx * force * 0.015;
                                particle.directionY -= dy * force * 0.015;
                            }
                        }

                        // Sinusoidal motion
                        particle.phase += 0.02;
                        particle.x += particle.directionX + Math.sin(particle.phase) * 0.3;
                        particle.y += particle.directionY + Math.cos(particle.phase) * 0.3;

                        // Bounce off edges
                        if (particle.x > elements.particleCanvas.width || particle.x < 0) particle.directionX = -particle.directionX;
                        if (particle.y > elements.particleCanvas.height || particle.y < 0) particle.directionY = -particle.directionY;

                        // Draw heart-shaped particle
                        ctx.save();
                        ctx.translate(particle.x, particle.y);
                        ctx.scale(particle.size / 4, particle.size / 4); // Scale heart size
                        ctx.beginPath();
                        ctx.moveTo(0, -3);
                        ctx.bezierCurveTo(-3, -5, -6, -2, -6, 1);
                        ctx.bezierCurveTo(-6, 4, -3, 6, 0, 3);
                        ctx.bezierCurveTo(3, 6, 6, 4, 6, 1);
                        ctx.bezierCurveTo(6, -2, 3, -5, 0, -3);
                        ctx.closePath();
                        ctx.fillStyle = particle.color;
                        ctx.shadowColor = config.PARTICLE_GLOW;
                        ctx.shadowBlur = 8;
                        ctx.fill();
                        ctx.restore();
                    });

                    // Draw connections
                    for (let i = 0; i < state.particlesArray.length; i++) {
                        for (let j = i + 1; j < state.particlesArray.length; j++) {
                            const p1 = state.particlesArray[i];
                            const p2 = state.particlesArray[j];
                            const dx = p1.x - p2.x;
                            const dy = p1.y - p2.y;
                            const distance = Math.sqrt(dx * dx + dy * dy);
                            if (distance < config.PARTICLE_CONNECTION_DISTANCE) {
                                ctx.beginPath();
                                ctx.moveTo(p1.x, p1.y);
                                ctx.lineTo(p2.x, p2.y);
                                ctx.strokeStyle = `rgba(255, 182, 193, ${1 - distance / config.PARTICLE_CONNECTION_DISTANCE})`;
                                ctx.lineWidth = 0.5;
                                ctx.stroke();
                            }
                        }
                    }

                    requestAnimationFrame(animate);
                };

                this.createParticles();
                animate();

                // Debounced resize handler
                let resizeTimeout;
                window.addEventListener('resize', () => {
                    clearTimeout(resizeTimeout);
                    resizeTimeout = setTimeout(() => {
                        this.resizeCanvas();
                        this.createParticles();
                    }, 100);
                });
            },
            createParticles() {
                state.particlesArray = [];
                const density = window.innerWidth < 768 ? config.PARTICLE_DENSITY.mobile : config.PARTICLE_DENSITY.desktop;
                const numberOfParticles = Math.min((elements.particleCanvas.height * elements.particleCanvas.width) / density, 80); // Cap for performance
                
                for (let i = 0; i < numberOfParticles; i++) {
                    state.particlesArray.push({
                        x: Math.random() * elements.particleCanvas.width,
                        y: Math.random() * elements.particleCanvas.height,
                        directionX: Math.random() * 0.3 - 0.15,
                        directionY: Math.random() * 0.3 - 0.15,
                        size: Math.random() * 3 + 2,
                        color: config.PARTICLE_COLORS[Math.floor(Math.random() * config.PARTICLE_COLORS.length)],
                        phase: Math.random() * Math.PI * 2 // For sinusoidal motion
                    });
                }
            },
            resizeCanvas() {
                if (elements.particleCanvas) {
                    elements.particleCanvas.width = window.innerWidth;
                    elements.particleCanvas.height = window.innerHeight;
                }
            }
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
                        } else if (response.status === 429) {
                            errorMessage = 'Muitas tentativas. Tente novamente em alguns minutos.';
                        } else if (response.status === 0) {
                            errorMessage = 'Não foi possível conectar ao servidor. Verifique sua conexão ou tente novamente mais tarde.';
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
                    throw new Error(error.message || 'Erro de conexão com o servidor.');
                }
            },
            login: (email, password) => api.request('/auth/login', { method: 'POST', body: JSON.stringify({ email: email.trim(), password }) }),
            register: (name, email, password) => api.request('/auth/register', { method: 'POST', body: JSON.stringify({ name: name.trim(), email: email.trim(), password }) }),
            getMyCards: () => api.request('/cards')
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
                btn.innerHTML = isLoading ? '<span class="btn-spinner inline-block mr-2"></span>Carregando...' : btn.dataset.originalText || btn.innerHTML;
                if (!isLoading && !btn.dataset.originalText) {
                    btn.dataset.originalText = btn.innerHTML;
                }
            },
            showNotification(message, type = 'info', duration = 5000) {
                if (!elements.appNotificationArea) return;
                const notification = document.createElement('div');
                const baseClasses = 'p-4 mb-4 text-sm md:text-base rounded-lg shadow-lg text-white transition-all duration-300 ease-in-out transform relative';
                const typeClasses = {
                    info: 'bg-blue-500',
                    success: 'bg-green-500',
                    error: 'bg-red-600',
                    warning: 'bg-yellow-500'
                };

                notification.className = `${baseClasses} ${typeClasses[type] || typeClasses.info} opacity-0 translate-y-4`;
                notification.innerHTML = `
                    <span>${message}</span>
                    <button class="notification__close" aria-label="Fechar notificação">×</button>
                `;
                elements.appNotificationArea.appendChild(notification);

                const closeBtn = notification.querySelector('.notification__close');
                closeBtn.addEventListener('click', () => {
                    notification.classList.add('opacity-0');
                    notification.addEventListener('transitionend', () => notification.remove(), { once: true });
                });

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
                setTimeout(() => {
                    elements.authModal?.classList.remove('opacity-0');
                    elements.authModal?.querySelector('.modal-content')?.classList.remove('translate-y-10', 'scale-95');
                }, 10);
                this.showAuthForm(initialForm);
            },
            closeModal() {
                elements.authModal?.classList.add('opacity-0');
                elements.authModal?.querySelector('.modal-content')?.classList.add('translate-y-10', 'scale-95');
                setTimeout(() => elements.authModal?.classList.add('hidden'), 300);
            },
            updateFooterYear() {
                if (elements.currentYear) {
                    elements.currentYear.textContent = new Date().getFullYear();
                }
            }
        };

        // Authentication Module
        const auth = {
            sanitizeInput(input) {
                return input.replace(/[<>&"']/g, '');
            },
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
                history.replaceState(null, '', window.location.pathname);
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
                const email = this.sanitizeInput(elements.loginForm.email.value);
                const password = elements.loginForm.password.value;
                try {
                    if (!email || !password) {
                        throw new Error('Por favor, preencha todos os campos.');
                    }
                    const result = await api.login(email, password);
                    this.handleLoginSuccess(result);
                } catch (error) {
                    ui.showNotification(error.message || 'Falha na comunicação com o servidor.', 'error');
                } finally {
                    ui.setButtonLoading(elements.loginSubmitBtn, false);
                    elements.loginForm.password.value = '';
                }
            },
            async register(event) {
                event.preventDefault();
                const { name, email, password } = elements.registerForm;
                ui.setButtonLoading(elements.registerSubmitBtn, true);
                const sanitizedName = this.sanitizeInput(name.value);
                const sanitizedEmail = this.sanitizeInput(email.value);
                try {
                    if (!sanitizedName || !sanitizedEmail || !password.value) {
                        throw new Error('Por favor, preencha todos os campos.');
                    }
                    const result = await api.register(sanitizedName, sanitizedEmail, password.value);
                    this.handleLoginSuccess(result, true);
                } catch (error) {
                    ui.showNotification(error.message || 'Não foi possível cadastrar.', 'error');
                } finally {
                    ui.setButtonLoading(elements.registerSubmitBtn, false);
                    elements.registerForm.password.value = '';
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