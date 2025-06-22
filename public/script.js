/**
 * @file script.js
 * @description Script principal para a aplicação MessageLove. Gerencia as "views" (telas),
 * autenticação, interatividade da UI, e a lógica de criação e visualização de cartões.
 * @author Pedro Marques
 * @version 5.1.0
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
            creationSection: document.getElementById('creationSection'),
            // Auth Buttons
            openLoginBtn: document.getElementById('openLoginBtn'),
            openRegisterBtn: document.getElementById('openRegisterBtn'),
            logoutBtn: document.getElementById('logoutBtn'),
            // Modal
            authModal: document.getElementById('authModal'),
            closeAuthModalBtn: document.getElementById('closeAuthModalBtn'),
            // Login Form
            loginFormContainer: document.getElementById('loginFormContainer'),
            loginForm: document.getElementById('loginForm'),
            loginSubmitBtn: document.getElementById('loginSubmitBtn'),
            // Register Form
            registerFormContainer: document.getElementById('registerFormContainer'),
            registerForm: document.getElementById('registerForm'),
            registerName: document.getElementById('registerName'),
            registerEmail: document.getElementById('registerEmail'),
            registerPassword: document.getElementById('registerPassword'),
            registerConfirmPassword: document.getElementById('registerConfirmPassword'),
            registerSubmitBtn: document.getElementById('registerSubmitBtn'),
            // Troca de formulários
            showRegisterBtn: document.getElementById('showRegisterBtn'),
            showLoginBtn: document.getElementById('showLoginBtn'),
            // Global
            appNotificationArea: document.getElementById('appNotificationArea'),
            particleCanvas: document.getElementById('particle-canvas'),
            currentYear: document.getElementById('currentYear'),
        };

        const api = {
            async request(endpoint, options = {}) {
                const token = localStorage.getItem('token');
                const headers = { ...options.headers };
                if (!(options.body instanceof FormData)) headers['Content-Type'] = 'application/json';
                if (token) headers['Authorization'] = `Bearer ${token}`;
                
                try {
                    const response = await fetch(`${config.API_URL}${endpoint}`, { ...options, headers });
                    const result = await response.json().catch(() => ({ message: response.statusText }));
                    if (!response.ok) {
                        const error = new Error(result.message || (result.errors ? result.errors.map(e => e.msg).join(' ') : `Erro ${response.status}`));
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
                    // ... Lógica para mostrar dashboard ...
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
                // ... (sua lógica de notificação)
            }
        };

        const auth = {
            handleLoginSuccess(result, isRegistration = false) {
                localStorage.setItem('token', result.token);
                localStorage.setItem('user', JSON.stringify(result.user));
                state.currentUser = result.user;
                modal.close();
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
                ui.showNotification('Você saiu da sessão.', 'info');
                ui.updateAuthUI();
            },
            async login(event) {
                event.preventDefault();
                const form = elements.loginForm;
                ui.setButtonLoading(elements.loginSubmitBtn, true);
                try {
                    const result = await api.login(form.email.value, form.password.value);
                    this.handleLoginSuccess(result);
                } catch (error) {
                    ui.showNotification(error.message || 'Credenciais inválidas.', 'error');
                } finally {
                    ui.setButtonLoading(elements.loginSubmitBtn, false);
                }
            },
            async register(event) {
                event.preventDefault();
                const form = elements.registerForm;
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
                    // Login automático após o registro
                    this.handleLoginSuccess(result, true);
                } catch(error) {
                    ui.showNotification(error.message || 'Não foi possível cadastrar. Tente novamente.', 'error');
                } finally {
                    ui.setButtonLoading(elements.registerSubmitBtn, false);
                }
            },
            init() {
                const user = localStorage.getItem('user');
                if (user) state.currentUser = JSON.parse(user);
                ui.updateAuthUI();
            }
        };

        const modal = {
            open(initialFormContainer) {
                elements.authModal.classList.remove('hidden');
                requestAnimationFrame(() => {
                    elements.authModal.classList.remove('opacity-0');
                    elements.authModal.querySelector('.modal-content').classList.remove('scale-95');
                });
                this.showForm(initialFormContainer);
            },
            close() {
                elements.authModal.classList.add('opacity-0');
                elements.authModal.querySelector('.modal-content').classList.add('scale-95');
                setTimeout(() => {
                    elements.authModal.classList.add('hidden');
                    elements.loginForm.reset();
                    elements.registerForm.reset();
                }, 300);
            },
            showForm(formToShow) {
                const forms = [elements.loginFormContainer, elements.registerFormContainer]; // Adicione o de reset se necessário
                forms.forEach(form => form?.classList.add('hidden'));
                formToShow?.classList.remove('hidden');
            }
        };

        const particles = {
            init() {
                const canvas = elements.particleCanvas;
                if (!canvas) return;
                // ... (Todo o seu código de animação de partículas vem aqui)
                const ctx = canvas.getContext('2d');
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight;
                let particlesArray;

                const createParticles = () => {
                    particlesArray = [];
                    const particleDensity = window.innerWidth < 768 ? 20000 : 9000;
                    const numberOfParticles = (canvas.height * canvas.width) / particleDensity;
                    for (let i = 0; i < numberOfParticles; i++) {
                        particlesArray.push({
                            x: Math.random() * canvas.width, y: Math.random() * canvas.height,
                            size: Math.random() * 2 + 1,
                            directionX: Math.random() * 0.4 - 0.2, directionY: Math.random() * 0.4 - 0.2,
                            color: 'rgba(217, 70, 239, 0.5)'
                        });
                    }
                };
                const animateParticles = () => {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    particlesArray.forEach(p => {
                        p.x += p.directionX;
                        p.y += p.directionY;
                        if (p.x > canvas.width || p.x < 0) p.directionX *= -1;
                        if (p.y > canvas.height || p.y < 0) p.directionY *= -1;
                        ctx.beginPath();
                        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                        ctx.fillStyle = p.color;
                        ctx.fill();
                    });
                    requestAnimationFrame(animateParticles);
                };
                createParticles();
                animateParticles();
                window.addEventListener('resize', () => { /* ... sua lógica de resize ... */ });
            }
        };

        const bindEvents = () => {
            elements.openLoginBtn?.addEventListener('click', () => modal.open(elements.loginFormContainer));
            elements.openRegisterBtn?.addEventListener('click', () => modal.open(elements.registerFormContainer));
            elements.closeAuthModalBtn?.addEventListener('click', modal.close);
            elements.authModal?.addEventListener('click', e => e.target === elements.authModal && modal.close());
            elements.showRegisterBtn?.addEventListener('click', () => modal.showForm(elements.registerFormContainer));
            elements.showLoginBtn?.addEventListener('click', () => modal.showForm(elements.loginFormContainer));
            elements.logoutBtn?.addEventListener('click', auth.logout);
            elements.loginForm?.addEventListener('submit', auth.login.bind(auth));
            elements.registerForm?.addEventListener('submit', auth.register.bind(auth));
        };
        
        const init = () => {
            console.log('MessageLoveApp Inicializada.');
            particles.init();
            auth.init();
            bindEvents();
            if (elements.currentYear) elements.currentYear.textContent = new Date().getFullYear();
        };

        return { init };
    })();

    MessageLoveApp.init();
});
