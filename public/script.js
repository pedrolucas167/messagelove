document.addEventListener('DOMContentLoaded', () => {
  const MessageLoveApp = (() => {
    const config = {
      API_URL: (['localhost', '127.0.0.1'].includes(window.location.hostname)
        ? 'http://localhost:3001/api'
        : 'https://messagelove.onrender.com/api'),
      PARTICLE_CONFIG: {
        density: { mobile: 40000, desktop: 15000 },
        connectionDistance: 80,
        interactionRadius: 120,
        colors: [
          'rgba(255, 182, 193, 0.7)',
          'rgba(219, 112, 147, 0.6)',
          'rgba(255, 245, 238, 0.5)',
          'rgba(221, 160, 221, 0.6)'
        ],
        glow: 'rgba(255, 105, 180, 0.8)'
      },
      MAX_RETRIES: 2,
      RETRY_DELAY: 2000,
      TOKEN_CHECK_INTERVAL: 15 * 60 * 1000
    };

    const state = {
      currentUser: null,
      particles: [],
      interactionPos: { x: null, y: null },
      retryCount: 0,
      authToken: null
    };

    const elements = {
      welcomeSection: document.getElementById('welcomeSection'),
      dashboardSection: document.getElementById('dashboardSection'),
      creationSection: document.getElementById('creationSection'),
      authModal: document.getElementById('authModal'),
      modalContent: document.querySelector('.modal-content'),
      closeAuthModalBtn: document.getElementById('closeAuthModalBtn'),
      loginForm: document.getElementById('loginForm'),
      registerForm: document.getElementById('registerForm'),
      resetPasswordForm: document.querySelector('#resetPasswordFormContainer form'),
      createCardForm: document.getElementById('createCardForm'),
      loginSubmitBtn: document.getElementById('loginSubmitBtn'),
      registerSubmitBtn: document.getElementById('registerSubmitBtn'),
      createCardSubmitBtn: document.getElementById('createCardSubmitBtn'),
      logoutBtn: document.getElementById('logoutBtn'),
      showCreateFormBtn: document.getElementById('showCreateFormBtn'),
      showDashboardBtn: document.getElementById('showDashboardBtn'),
      openLoginBtn: document.getElementById('openLoginBtn'),
      openRegisterBtn: document.getElementById('openRegisterBtn'),
      showRegisterBtn: document.getElementById('showRegisterBtn'),
      showLoginBtn: document.getElementById('showLoginBtn'),
      showForgotPasswordBtn: document.getElementById('showForgotPasswordBtn'),
      showLoginFromResetBtn: document.getElementById('showLoginFromResetBtn'),
      appNotificationArea: document.getElementById('appNotificationArea'),
      userWelcomeMessage: document.getElementById('userWelcomeMessage'),
      userCardsList: document.getElementById('userCardsList'),
      particleCanvas: document.getElementById('particle-canvas'),
      currentYear: document.getElementById('currentYear')
    };

    const validateElements = () => {
      const critical = ['particleCanvas','appNotificationArea','welcomeSection','dashboardSection','creationSection'];
      const missing = critical.filter(k => !elements[k]);
      if (missing.length) { console.error('Elementos críticos não encontrados:', missing); return false; }
      return true;
    };

    const particles = {
      ctx: null,
      animationFrameId: null,
      resizeTimeout: null,
      init() {
        if (!elements.particleCanvas) return;
        this.ctx = elements.particleCanvas.getContext('2d');
        this.setupEventListeners();
        this.resizeCanvas();
        this.createParticles();
        this.animate();
      },
      setupEventListeners() {
        const updatePos = (x, y) => {
          const rect = elements.particleCanvas.getBoundingClientRect();
          state.interactionPos = { x: x - rect.left, y: y - rect.top };
        };
        window.addEventListener('mousemove', e => updatePos(e.clientX, e.clientY));
        window.addEventListener('touchmove', e => updatePos(e.touches[0].clientX, e.touches[0].clientY), { passive: true });
        const clearPos = () => state.interactionPos = { x: null, y: null };
        window.addEventListener('mouseleave', clearPos);
        window.addEventListener('touchend', clearPos);
        window.addEventListener('resize', () => {
          clearTimeout(this.resizeTimeout);
          this.resizeTimeout = setTimeout(() => { this.resizeCanvas(); this.createParticles(); }, 100);
        });
      },
      resizeCanvas() {
        elements.particleCanvas.width = window.innerWidth;
        elements.particleCanvas.height = window.innerHeight;
      },
      createParticles() {
        state.particles = [];
        const density = window.innerWidth < 768 ? config.PARTICLE_CONFIG.density.mobile : config.PARTICLE_CONFIG.density.desktop;
        const count = Math.min((elements.particleCanvas.height * elements.particleCanvas.width) / density, 80);
        for (let i = 0; i < count; i++) {
          state.particles.push({
            x: Math.random() * elements.particleCanvas.width,
            y: Math.random() * elements.particleCanvas.height,
            directionX: Math.random() * 0.3 - 0.15,
            directionY: Math.random() * 0.3 - 0.15,
            size: Math.random() * 3 + 2,
            color: config.PARTICLE_CONFIG.colors[Math.floor(Math.random()*config.PARTICLE_CONFIG.colors.length)],
            phase: Math.random() * Math.PI * 2
          });
        }
      },
      animate() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.03)';
        this.ctx.fillRect(0, 0, elements.particleCanvas.width, elements.particleCanvas.height);
        state.particles.forEach(p => { this.updateParticle(p); this.drawParticle(p); });
        this.drawConnections();
        this.animationFrameId = requestAnimationFrame(() => this.animate());
      },
      updateParticle(p) {
        if (state.interactionPos.x !== null && state.interactionPos.y !== null) {
          const dx = state.interactionPos.x - p.x;
          const dy = state.interactionPos.y - p.y;
          const d = Math.hypot(dx, dy);
          if (d < config.PARTICLE_CONFIG.interactionRadius) {
            const f = (config.PARTICLE_CONFIG.interactionRadius - d) / config.PARTICLE_CONFIG.interactionRadius;
            p.directionX -= dx * f * 0.015;
            p.directionY -= dy * f * 0.015;
          }
        }
        p.phase += 0.02;
        p.x += p.directionX + Math.sin(p.phase) * 0.3;
        p.y += p.directionY + Math.cos(p.phase) * 0.3;
        if (p.x > elements.particleCanvas.width || p.x < 0) p.directionX = -p.directionX;
        if (p.y > elements.particleCanvas.height || p.y < 0) p.directionY = -p.directionY;
      },
      drawParticle(p) {
        this.ctx.save();
        this.ctx.translate(p.x, p.y);
        this.ctx.scale(p.size / 4, p.size / 4);
        this.ctx.beginPath();
        this.ctx.moveTo(0, -3);
        this.ctx.bezierCurveTo(-3, -5, -6, -2, -6, 1);
        this.ctx.bezierCurveTo(-6, 4, -3, 6, 0, 3);
        this.ctx.bezierCurveTo(3, 6, 6, 4, 6, 1);
        this.ctx.bezierCurveTo(6, -2, -3, -5, 0, -3);
        this.ctx.closePath();
        this.ctx.fillStyle = p.color;
        this.ctx.shadowColor = config.PARTICLE_CONFIG.glow;
        this.ctx.shadowBlur = 8;
        this.ctx.fill();
        this.ctx.restore();
      },
      drawConnections() {
        for (let i = 0; i < state.particles.length; i++) {
          for (let j = i + 1; j < state.particles.length; j++) {
            const p1 = state.particles[i], p2 = state.particles[j];
            const d = Math.hypot(p1.x - p2.x, p1.y - p2.y);
            if (d < config.PARTICLE_CONFIG.connectionDistance) {
              this.ctx.beginPath();
              this.ctx.moveTo(p1.x, p1.y);
              this.ctx.lineTo(p2.x, p2.y);
              this.ctx.strokeStyle = `rgba(255, 182, 193, ${1 - d / config.PARTICLE_CONFIG.connectionDistance})`;
              this.ctx.lineWidth = 0.5;
              this.ctx.stroke();
            }
          }
        }
      },
      cleanup() {
        if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
        clearTimeout(this.resizeTimeout);
      }
    };

    const apiService = {
      async request(endpoint, options = {}, retries = config.MAX_RETRIES) {
        const attempt = config.MAX_RETRIES - retries + 1;
        const headers = new Headers(options.headers || {});
        if (!(options.body instanceof FormData)) headers.set('Content-Type', 'application/json');
        if (state.authToken) headers.set('Authorization', `Bearer ${state.authToken}`);
        try {
          const response = await fetch(`${config.API_URL}${endpoint}`, { ...options, headers });
          const data = await this.parseResponse(response);
          if (!response.ok) throw this.createError(response, data);
          return data;
        } catch (error) {
          return this.handleRetry(error, endpoint, options, retries, attempt);
        }
      },
      parseResponse(response) {
        return response.text().then(t => (t ? JSON.parse(t) : {}));
      },
      createError(response, data) {
        let message = `Erro ${response.status}: ${data.message || response.statusText}`;
        if (Array.isArray(data.errors)) {
          message = data.errors.map(e => e.msg || e.message).join(' ');
        } else if (response.status === 429) {
          message = 'Muitas tentativas. Tente novamente em alguns minutos.';
        } else if (response.status === 500) {
          message += data.data?.error ? ` - ${data.data.error}` : ' - Erro interno do servidor.';
        }
        const err = new Error(message);
        err.status = response.status;
        err.data = data;
        return err;
      },
      async handleRetry(error, endpoint, options, retries, attempt) {
        const isCorsError = !error.status && String(error.message || '').includes('Failed to fetch');
        const isAuthError = error.status === 401;
        const isRateLimitError = error.status === 429;
        console.error(`API Error on ${endpoint} (Tentativa ${attempt}/${config.MAX_RETRIES}):`, {
          status: error.status || 'N/A', message: error.message, data: error.data, attempt
        });
        if (isAuthError) { auth.logout(); throw new Error('Sessão expirada. Faça login novamente.'); }
        if (retries > 0 && !isCorsError && !isAuthError && !isRateLimitError) {
          await new Promise(r => setTimeout(r, config.RETRY_DELAY));
          return this.request(endpoint, options, retries - 1);
        }
        throw isCorsError ? new Error('Erro de conexão com o servidor. Verifique sua conexão.') : error;
      },
      login(email, password) {
        return this.request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
      },
      register(name, email, password) {
        return this.request('/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password }) });
      },
      verifyToken() { return this.request('/auth/verify'); },
      getCards() { return this.request('/cards'); },
      createCard(formData) { return this.request('/cards', { method: 'POST', body: formData }); }
    };

    const uiService = {
      showView(view) {
        ['welcome', 'dashboard', 'creation'].forEach(v => {
          elements[`${v}Section`]?.classList.toggle('hidden', v !== view);
        });
      },
      updateAuthUI() {
        if (state.currentUser) {
          elements.logoutBtn?.classList.remove('hidden');
          if (elements.userWelcomeMessage) elements.userWelcomeMessage.textContent = `Olá, ${state.currentUser.name}!`;
          this.showView('dashboard');
          cardService.loadCards().catch(console.error);
        } else {
          elements.logoutBtn?.classList.add('hidden');
          this.showView('welcome');
        }
      },
      openAuthModal(initialForm = 'login') {
        if (!elements.authModal) return;
        this.showAuthForm(initialForm);
        elements.authModal.classList.remove('hidden');
        elements.authModal.setAttribute('aria-hidden', 'false');
        setTimeout(() => {
          elements.authModal.classList.remove('opacity-0');
          elements.modalContent?.classList.remove('scale-95');
        }, 10);
      },
      closeAuthModal() {
        if (!elements.authModal) return;
        elements.authModal.classList.add('opacity-0');
        elements.modalContent?.classList.add('scale-95');
        elements.authModal.setAttribute('aria-hidden', 'true');
        setTimeout(() => {
          elements.authModal.classList.add('hidden');
          elements.loginForm?.reset();
          elements.registerForm?.reset();
        }, 300);
      },
      showAuthForm(formName) {
        const forms = {
          login: elements.loginForm?.parentElement,
          register: elements.registerForm?.parentElement,
          reset: elements.resetPasswordForm?.parentElement
        };
        Object.values(forms).forEach(f => f && f.classList.add('hidden'));
        if (forms[formName]) forms[formName].classList.remove('hidden');
      },
      showNotification(message, type = 'info', duration = 5000) {
        if (!elements.appNotificationArea) return;
        const types = { info: 'bg-blue-500', success: 'bg-green-500', error: 'bg-red-600', warning: 'bg-yellow-500' };
        const n = document.createElement('div');
        n.className = `
          p-4 mb-4 text-sm md:text-base rounded-lg shadow-lg text-white 
          transition-all duration-300 ease-in-out transform relative
          opacity-0 translate-y-4 ${types[type] || types.info}
        `;
        n.innerHTML = `
          <span>${message}</span>
          <button class="notification-close absolute top-2 right-2 text-white hover:text-gray-200">×</button>
        `;
        elements.appNotificationArea.appendChild(n);
        requestAnimationFrame(() => n.classList.remove('opacity-0','translate-y-4'));
        const closeBtn = n.querySelector('.notification-close');
        const close = () => { n.classList.add('opacity-0'); n.addEventListener('transitionend', () => n.remove(), { once: true }); };
        closeBtn.addEventListener('click', close);
        setTimeout(close, duration);
      },
      setButtonLoading(button, isLoading) {
        if (!button) return;
        button.disabled = isLoading;
        button.classList.toggle('opacity-75', isLoading);
        button.classList.toggle('cursor-not-allowed', isLoading);
        if (isLoading) {
          button.dataset.originalText = button.innerHTML;
          button.innerHTML = `
            <span class="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
            Carregando...
          `;
        } else if (button.dataset.originalText) {
          button.innerHTML = button.dataset.originalText;
        }
      },
      updateFooterYear() {
        if (elements.currentYear) elements.currentYear.textContent = new Date().getFullYear();
      }
    };

    const auth = {
      isValidEmail(email) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email); },
      isValidPassword(password) { return /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/.test(password); },
      sanitizeInput(input, isEmail = false) { const s = input.trim(); return isEmail ? s.toLowerCase() : s; },
      storeUserData(token, user) {
        state.authToken = token; state.currentUser = user;
        sessionStorage.setItem('token', token);
        sessionStorage.setItem('user', JSON.stringify(user));
      },
      clearUserData() {
        state.authToken = null; state.currentUser = null;
        sessionStorage.removeItem('token'); sessionStorage.removeItem('user');
      },
      handleAuthSuccess(response, isRegistration = false) {
        this.storeUserData(response.token, response.user);
        uiService.closeAuthModal();
        uiService.showNotification(isRegistration ? `Bem-vindo, ${response.user.name}!` : 'Login realizado com sucesso!','success');
        uiService.updateAuthUI();
        history.replaceState(null, '', window.location.pathname);
      },
      async login(event) {
        event.preventDefault();
        if (!elements.loginSubmitBtn || !elements.loginForm) return;
        const email = this.sanitizeInput(elements.loginForm.email.value, true);
        const password = elements.loginForm.password.value;
        uiService.setButtonLoading(elements.loginSubmitBtn, true);
        try {
          if (!email || !password) throw new Error('Por favor, preencha todos os campos.');
          if (!this.isValidEmail(email)) throw new Error('Por favor, insira um email válido.');
          const response = await apiService.login(email, password);
          this.handleAuthSuccess(response);
        } catch (e) {
          this.handleAuthError(e);
        } finally {
          uiService.setButtonLoading(elements.loginSubmitBtn, false);
          elements.loginForm.password.value = '';
        }
      },
      async register(event) {
        event.preventDefault();
        if (!elements.registerSubmitBtn || !elements.registerForm) return;
        const name = this.sanitizeInput(elements.registerForm.name.value);
        const email = this.sanitizeInput(elements.registerForm.email.value, true);
        const password = elements.registerForm.password.value;
        uiService.setButtonLoading(elements.registerSubmitBtn, true);
        try {
          if (!name || !email || !password) throw new Error('Por favor, preencha todos os campos.');
          if (!this.isValidEmail(email)) throw new Error('Por favor, insira um email válido.');
          if (!this.isValidPassword(password)) throw new Error('A senha deve ter pelo menos 8 caracteres, incluindo letras e números.');
          const response = await apiService.register(name, email, password);
          this.handleAuthSuccess(response, true);
        } catch (e) {
          this.handleAuthError(e);
        } finally {
          uiService.setButtonLoading(elements.registerSubmitBtn, false);
          elements.registerForm.password.value = '';
        }
      },
      async resetPassword(event) {
        event.preventDefault();
        if (!elements.resetPasswordForm) return;
        const submitBtn = elements.resetPasswordForm.querySelector('button[type="submit"]');
        const email = this.sanitizeInput(elements.resetPasswordForm.email.value, true);
        uiService.setButtonLoading(submitBtn, true);
        try {
          if (!email || !this.isValidEmail(email)) throw new Error('Por favor, insira um email válido.');
          await apiService.request('/auth/reset-password', { method: 'POST', body: JSON.stringify({ email }) });
          uiService.showNotification('Instruções de redefinição de senha enviadas para seu email.','success');
          uiService.showAuthForm('login');
        } catch (e) {
          uiService.showNotification(e.message || 'Erro ao solicitar redefinição de senha.','error');
        } finally {
          uiService.setButtonLoading(submitBtn, false);
        }
      },
      logout() { this.clearUserData(); uiService.showNotification('Você saiu da sua conta.','info'); uiService.updateAuthUI(); },
      handleAuthError(error) {
        let msg = error.message || 'Falha na comunicação com o servidor.';
        if (error.status === 401) msg = 'Email ou senha incorretos.';
        else if (error.status === 409) msg = 'Este email já está registrado.';
        else if (error.status === 429) msg = 'Muitas tentativas. Tente novamente em alguns minutos.';
        uiService.showNotification(msg, 'error');
      },
      init() {
        const token = sessionStorage.getItem('token');
        const user = sessionStorage.getItem('user');
        if (token && user) {
          try { state.authToken = token; state.currentUser = JSON.parse(user); this.verifyTokenPeriodically(); }
          catch { this.clearUserData(); }
        }
        uiService.updateAuthUI();
      },
      verifyTokenPeriodically() {
        apiService.verifyToken().catch(() => this.logout());
        setInterval(() => apiService.verifyToken().catch(() => this.logout()), config.TOKEN_CHECK_INTERVAL);
      }
    };

    const cardService = {
      async create(event) {
        event.preventDefault();
        if (!state.currentUser || !elements.createCardSubmitBtn || !elements.createCardForm) return;
        uiService.setButtonLoading(elements.createCardSubmitBtn, true);
        try {
          const formData = new FormData(elements.createCardForm);
          for (const f of ['de','para','mensagem']) if (!formData.get(f)) throw new Error(`Por favor, preencha o campo ${f}.`);
          const response = await apiService.createCard(formData);
          if (!response.id) throw new Error('Erro ao criar cartão. Tente novamente.');
          uiService.showNotification('Cartão criado com sucesso!','success');
          elements.createCardForm.reset();
          uiService.showView('dashboard');
          window.location.href = `card.html?id=${response.id}`;
        } catch (e) {
          uiService.showNotification(e.message, 'error');
        } finally {
          uiService.setButtonLoading(elements.createCardSubmitBtn, false);
        }
      },
      async loadCards() {
        if (!state.currentUser || !elements.userCardsList) return;
        try { const cards = await apiService.getCards(); this.renderCards(cards); }
        catch (e) { uiService.showNotification(`Erro ao carregar cartões: ${e.message}`, 'error'); }
      },
      renderCards(cards) {
        if (!elements.userCardsList) return;
        if (!cards.length) {
          elements.userCardsList.innerHTML = `
            <div class="bg-gray-700 p-4 rounded-lg text-gray-400">
              Você ainda não criou nenhum cartão. Crie um agora!
            </div>`;
          return;
        }
        elements.userCardsList.innerHTML = cards.map(card => `
          <div class="bg-gray-700 p-4 rounded-lg hover:bg-gray-600 transition-colors">
            <h3 class="text-lg font-semibold text-white">Para: ${card.para}</h3>
            <p class="text-gray-400 truncate">${card.mensagem}</p>
            <p class="text-sm text-gray-500">Criado em: ${new Date(card.createdAt).toLocaleDateString('pt-BR')}</p>
            <a href="card.html?id=${card.id}" class="text-fuchsia-400 hover:text-fuchsia-300 mt-2 inline-block">Ver cartão</a>
          </div>`).join('');
      },
      showCreationForm() { uiService.showView('creation'); },
      showDashboard() { uiService.showView('dashboard'); }
    };

    const bindEvents = () => {
      elements.logoutBtn?.addEventListener('click', () => auth.logout());
      elements.loginForm?.addEventListener('submit', e => auth.login(e));
      elements.registerForm?.addEventListener('submit', e => auth.register(e));
      elements.resetPasswordForm?.addEventListener('submit', e => auth.resetPassword(e));
      elements.createCardForm?.addEventListener('submit', e => cardService.create(e));
      elements.showCreateFormBtn?.addEventListener('click', () => cardService.showCreationForm());
      elements.showDashboardBtn?.addEventListener('click', () => cardService.showDashboard());
      elements.openLoginBtn?.addEventListener('click', () => uiService.openAuthModal('login'));
      elements.openRegisterBtn?.addEventListener('click', () => uiService.openAuthModal('register'));
      elements.closeAuthModalBtn?.addEventListener('click', () => uiService.closeAuthModal());
      elements.authModal?.addEventListener('click', e => { if (e.target === elements.authModal) uiService.closeAuthModal(); });
      elements.showRegisterBtn?.addEventListener('click', () => uiService.showAuthForm('register'));
      elements.showLoginBtn?.addEventListener('click', () => uiService.showAuthForm('login'));
      elements.showForgotPasswordBtn?.addEventListener('click', () => uiService.showAuthForm('reset'));
      elements.showLoginFromResetBtn?.addEventListener('click', () => uiService.showAuthForm('login'));
    };

    const init = () => {
      if (!validateElements()) return;
      particles.init();
      uiService.updateFooterYear();
      auth.init();
      bindEvents();
    };

    const cleanup = () => { particles.cleanup(); };

    return { init, cleanup };
  })();

  MessageLoveApp.init();
  window.addEventListener('beforeunload', () => { MessageLoveApp.cleanup(); });
});
