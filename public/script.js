document.addEventListener('DOMContentLoaded', () => {
    const MessageLoveApp = (() => {
        const config = {
            API_URL: window.location.hostname.includes('localhost')
                ? 'http://localhost:3000/api'
                : 'https://messagelove-backend.onrender.com/api',
            PARTICLE_DENSITY: { mobile: 30000, desktop: 15000 },
            PARTICLE_CONNECTION_DISTANCE: 80,
            PARTICLE_INTERACTION_RADIUS: 120,
            PARTICLE_COLORS: [
                'rgba(255, 182, 193, 0.7)',
                'rgba(219, 112, 147, 0.6)',
                'rgba(255, 245, 238, 0.5)',
                'rgba(221, 160, 221, 0.6)'
            ],
            PARTICLE_GLOW: 'rgba(255, 105, 180, 0.8)',
            MAX_RETRIES: 2,
            RETRY_DELAY: 2000
        };

        const state = {
            currentUser: null,
            particlesArray: [],
            interactionPos: { x: null, y: null },
            retryCount: 0
        };

        const elements = {
            // ... (mesmos elementos, omitidos por brevidade)
        };

        if (!Object.values(elements).every(el => el || el === null)) {
            console.warn('Alguns elementos HTML não foram encontrados:', elements);
        }

        const particles = { init, createParticles, resizeCanvas }; // ... (código de partículas omitido por brevidade)

        const api = {
            async request(endpoint, options = {}, retries = config.MAX_RETRIES) {
                const token = sessionStorage.getItem('token');
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
                        let errorMessage = `Erro ${response.status}: ${result.message || response.statusText}`;
                        if (Array.isArray(result.errors)) errorMessage = result.errors.map(e => e.msg).join(' ');
                        else if (response.status === 429) errorMessage = 'Muitas tentativas. Tente novamente em alguns minutos.';
                        else if (response.status === 0) errorMessage = 'Não foi possível conectar ao servidor. Verifique sua conexão.';
                        else if (response.status === 500) errorMessage += result.data?.error ? ` - ${result.data.error}` : ' - Erro interno do servidor detectado.';
                        const error = new Error(errorMessage);
                        error.status = response.status;
                        error.data = result;
                        throw error;
                    }
                    state.retryCount = 0;
                    return result;
                } catch (error) {
                    console.error(`API Error on ${endpoint} (Tentativa ${config.MAX_RETRIES - retries + 1}/${config.MAX_RETRIES}):`, {
                        status: error.status,
                        message: error.message,
                        data: error.data,
                        retryCount: state.retryCount
                    });
                    if (error.status === 401) {
                        auth.logout();
                        throw error; // Propagar erro para auth.login
                    }
                    if (retries > 0 && error.status !== 401 && error.status !== 429) {
                        state.retryCount++;
                        await new Promise(resolve => setTimeout(resolve, config.RETRY_DELAY));
                        return api.request(endpoint, options, retries - 1);
                    }
                    throw error; 
                }
            },
            login: (email, password) => api.request('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ email, password })
            }),
            // ... (outros métodos omitidos por brevidade)
        };

        const ui = {
            // ... (código de UI omitido por brevidade)
            setButtonLoading(btn, isLoading) {
                if (!btn) return;
                if (!btn.dataset.originalText) btn.dataset.originalText = btn.innerHTML; // Inicializar se não definido
                btn.disabled = isLoading;
                btn.classList.toggle('opacity-75', isLoading);
                btn.classList.toggle('cursor-not-allowed', isLoading);
                btn.innerHTML = isLoading ? '<span class="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>Carregando...' : btn.dataset.originalText;
            },
            // ... (outros métodos de UI)
        };

        const auth = {
            // ... (métodos sanitizeInput, isValidEmail, isValidPassword, handleLoginSuccess, logout omitidos por brevidade)
            async login(event) {
                event.preventDefault();
                if (!elements.loginSubmitBtn || !elements.loginForm) return;
                ui.setButtonLoading(elements.loginSubmitBtn, true);
                console.log('Iniciando login...'); // Depuração
                const email = this.sanitizeInput(elements.loginForm.email.value, true);
                const password = elements.loginForm.password.value;

                try {
                    console.log('Validando credenciais...'); // Depuração
                    if (!email || !password) throw new Error('Por favor, preencha todos os campos.');
                    if (!this.isValidEmail(email)) throw new Error('Por favor, insira um email válido.');
                    const result = await api.login(email, password);
                    console.log('Login bem-sucedido:', result); // Depuração
                    this.handleLoginSuccess(result);
                } catch (error) {
                    console.error('Erro no login:', error); // Depuração
                    let errorMessage = error.message || 'Falha na comunicação com o servidor.';
                    if (error.status === 401) errorMessage = 'Email ou senha incorretos.';
                    else if (error.status === 429) errorMessage = 'Muitas tentativas. Tente novamente em alguns minutos.';
                    ui.showNotification(errorMessage, 'error');
                } finally {
                    console.log('Finalizando login...'); // Depuração
                    ui.setButtonLoading(elements.loginSubmitBtn, false);
                    elements.loginForm.password.value = '';
                }
            },
            // ... (outros métodos de auth)
            init() {
                const user = sessionStorage.getItem('user');
                if (user) {
                    try {
                        state.currentUser = JSON.parse(user);
                        api.verifyToken().catch(() => this.logout());
                    } catch {
                        this.logout();
                    }
                }
                ui.updateAuthUI();
                setInterval(() => api.verifyToken().catch(() => this.logout()), 300000);
            }
        };

        const cards = { /* ... (código de cards omitido por brevidade) */ };

        const bindEvents = () => {
            // ... (eventos omitidos por brevidade)
            elements.loginForm?.addEventListener('submit', auth.login.bind(auth));
            // ... (outros eventos)
        };

        const init = () => {
            if (!elements.particleCanvas && !elements.appNotificationArea) {
                console.warn('Alguns elementos críticos não foram encontrados. Verifique o HTML.');
                return;
            }
            particles.init();
            ui.updateFooterYear();
            auth.init();
            bindEvents();
        };

        return { init };
    })();

    MessageLoveApp.init();
});