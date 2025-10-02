
document.addEventListener('DOMContentLoaded', () => {
  const App = (() => {
    const cfg = {
      API_URL: (['localhost', '127.0.0.1'].includes(location.hostname))
        ? 'http://localhost:3001/api'
        : 'https://messagelove.onrender.com/api',
      TOKEN_CHECK_INTERVAL: 15 * 60 * 1000,
      REQ_TIMEOUT_MS: 10000,
      RETRIES: 2,
      RETRY_BASE_MS: 500,
      GRID: { 
        sm: 1, md: 2, lg: 3, xl: 4
      },
      PARTICLE: {
        density: { mobile: 40000, desktop: 15000 },
        colors: [
          'rgba(255, 182, 193, 0.7)',
          'rgba(219, 112, 147, 0.6)',
          'rgba(255, 245, 238, 0.5)',
          'rgba(221, 160, 221, 0.6)'
        ],
        glow: 'rgba(255, 105, 180, 0.8)'
      }
    };

    const $ = s => document.querySelector(s);
    const $$ = s => Array.from(document.querySelectorAll(s));

    const els = {
      welcome: $('#welcomeSection'),
      dash: $('#dashboardSection'),
      create: $('#creationSection'),
      toastArea: $('#appNotificationArea'),
      list: $('#userCardsList'),
      search: $('#cardsSearch'),
      sort: $('#cardsSort'),
      filter: $('#cardsFilter'),
      particle: $('#particle-canvas'),
      authModal: $('#authModal'),
      modalContent: document.querySelector('.modal-content'),
      loginForm: $('#loginForm'),
      registerForm: $('#registerForm'),
      resetForm: document.querySelector('#resetPasswordFormContainer form'),
      createForm: $('#createCardForm'),
      loginBtn: $('#loginSubmitBtn'),
      registerBtn: $('#registerSubmitBtn'),
      createBtn: $('#createCardSubmitBtn'),
      logoutBtn: $('#logoutBtn'),
      openLogin: $('#openLoginBtn'),
      openRegister: $('#openRegisterBtn'),
      showCreate: $('#showCreateFormBtn'),
      showDash: $('#showDashboardBtn'),
      showRegister: $('#showRegisterBtn'),
      showLogin: $('#showLoginBtn'),
      showForgot: $('#showForgotPasswordBtn'),
      showLoginFromReset: $('#showLoginFromResetBtn'),
      userWelcome: $('#userWelcomeMessage'),
      year: $('#currentYear'),
    };

    const state = {
      token: sessionStorage.getItem('token') || null,
      user: (() => { try { return JSON.parse(sessionStorage.getItem('user')) } catch { return null } })(),
      cards: [],
      filtered: [],
      loading: false,
      search: '',
      sort: 'date_desc',
      filter: 'all'
    };

    const htmlesc = (s = '') => (s + '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const copy = async (t) => { try { await navigator.clipboard.writeText(t); ui.toast('Link copiado!', 'success'); } catch { ui.toast('Não foi possível copiar', 'error'); } };
    const share = async (title, text, url) => {
      if (navigator.share) { try { await navigator.share({ title, text, url }); } catch { } }
      else copy(url);
    };
    const fmtDate = (iso) => new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium' }).format(new Date(iso));
    const viewTransition = (fn) => (document.startViewTransition ? document.startViewTransition(fn) : fn());

    const api = {
      async request(path, { method = 'GET', headers = {}, body, auth = true, timeout = cfg.REQ_TIMEOUT_MS } = {}) {
        const url = `${cfg.API_URL}${path}`;
        const h = new Headers(headers);
        if (!(body instanceof FormData)) h.set('Content-Type', 'application/json');
        if (auth && state.token) h.set('Authorization', `Bearer ${state.token}`);

        let lastErr;
        for (let a = 0; a <= cfg.RETRIES; a++) {
          const ctrl = new AbortController();
          const tid = setTimeout(() => ctrl.abort(), timeout);
          try {
            const r = await fetch(url, { method, headers: h, body, signal: ctrl.signal });
            clearTimeout(tid);
            const t = await r.text();
            const data = t ? JSON.parse(t) : {};
            if (!r.ok) {
              const msg = (Array.isArray(data.errors) ? data.errors.map(e => e.msg || e.message).join(' ') : (data.message || r.statusText));
              const err = new Error(msg); err.status = r.status; err.data = data; throw err;
            }
            return data;
          } catch (e) {
            clearTimeout(tid);
            lastErr = e;
            const retriable = !e.status || (e.status >= 500 && e.status < 600);
            if (a < cfg.RETRIES && retriable) {
              const wait = cfg.RETRY_BASE_MS * 2 ** a + Math.random() * 200;
              await new Promise(r => setTimeout(r, wait));
              continue;
            }
            throw e;
          }
        }
        throw lastErr;
      },
      login: (email, password) => api.request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }), auth: false }),
      register: (name, email, password) => api.request('/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password }), auth: false }),
      verify: () => api.request('/auth/verify', { method: 'GET' }),
      forgot: (email) => api.request('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }), auth: false }),
      reset: (email, token, newPassword) => api.request('/auth/reset-password', { method: 'POST', body: JSON.stringify({ email, token, newPassword }), auth: false }),
      cards: () => api.request('/cards', { method: 'GET' }),
      createCard: (formData) => api.request('/cards', { method: 'POST', body: formData })
    };

    const ui = {
      setYear() { els.year && (els.year.textContent = new Date().getFullYear()) },
      toast(msg, type = 'info', ms = 4000) {
        if (!els.toastArea) return alert(msg);
        const n = document.createElement('div');
        n.role = 'status'; n.ariaLive = 'polite';
        n.className = `pointer-events-auto px-4 py-3 mb-3 rounded-lg shadow-lg text-white ${({
          info: 'bg-sky-600', success: 'bg-emerald-600', error: 'bg-rose-600', warn: 'bg-amber-600'
        })[type] || 'bg-sky-600'}`;
        n.innerHTML = `<div class="flex items-start gap-3">
          <span class="font-medium">${htmlesc(msg)}</span>
          <button class="ml-auto opacity-80 hover:opacity-100">✕</button>
        </div>`;
        els.toastArea.appendChild(n);
        const close = () => { n.classList.add('opacity-0', 'translate-y-1'); setTimeout(() => n.remove(), 200); };
        n.querySelector('button')?.addEventListener('click', close);
        setTimeout(close, ms);
      },
      show(view) {
        ['welcome', 'dash', 'create'].forEach(v => {
          const elv = ({ welcome: els.welcome, dash: els.dash, create: els.create })[v];
          elv?.classList.toggle('hidden', v !== view);
        })
      },
      setLoadingCards(on) {
        state.loading = on;
        if (!els.list) return;
        if (on) {
          els.list.innerHTML = ui.skeletonGrid();
          els.list.dataset.loading = '1';
        } else {
          delete els.list.dataset.loading;
        }
      },
      skeletonGrid() {
        const tiles = Array.from({ length: 8 }).map(() => `
          <div class="break-inside-avoid rounded-xl overflow-hidden bg-gray-700/60 animate-pulse h-[180px] mb-4"></div>
        `).join('');
        return `<div class="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4">${tiles}</div>`;
      },
      emptyState() {
        return `
          <div class="rounded-xl bg-gray-700/60 p-8 text-center">
            <h3 class="text-white text-lg font-semibold mb-2">Você ainda não criou cartões</h3>
            <p class="text-gray-300 mb-4">Comece um agora — é rápido e bonito ✨</p>
            <button id="ctaCreateNow" class="px-4 py-2 rounded-md bg-fuchsia-600 text-white hover:bg-fuchsia-500">Criar novo cartão</button>
          </div>
        `;
      },
      grid(cards) {
        const items = cards.map(card => {
          const url = `card.html?id=${encodeURIComponent(card.id)}`;
          const date = fmtDate(card.createdAt);
          const img = card.fotoUrl ? `<img src="${htmlesc(card.fotoUrl)}" alt="foto" class="w-full h-40 object-cover">` : `<div class="w-full h-40 bg-gradient-to-br from-fuchsia-700/40 to-indigo-700/30"></div>`;
          return `
          <article class="break-inside-avoid mb-4 rounded-xl overflow-hidden bg-gray-700/60 ring-1 ring-white/5 hover:ring-fuchsia-500/40 transition">
            ${img}
            <div class="p-4 space-y-2">
              <h3 class="text-white font-semibold">Para: ${htmlesc(card.para)}</h3>
              <p class="text-gray-300 line-clamp-2">${htmlesc(card.mensagem || '')}</p>
              <p class="text-xs text-gray-400">${date}</p>
              <div class="flex gap-2 pt-2">
                <a href="${url}" class="px-3 py-1 rounded-md bg-gray-600 text-white hover:bg-gray-500">Abrir</a>
                <button data-copy="${url}" class="px-3 py-1 rounded-md bg-gray-600 text-white hover:bg-gray-500">Copiar link</button>
                <button data-share='${htmlesc(JSON.stringify({ title: "MessageLove", text: `Cartão para ${card.para}`, url }))}' class="px-3 py-1 rounded-md bg-gray-600 text-white hover:bg-gray-500">Compartilhar</button>
                <button data-preview='${htmlesc(JSON.stringify(card))}' class="ml-auto px-3 py-1 rounded-md bg-fuchsia-600 text-white hover:bg-fuchsia-500">Preview</button>
              </div>
            </div>
          </article>`;
        }).join('');

        return `<div class="cards-masonry columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4">${items}</div>`;
      },
      applyGridBehaviors() {
    
        els.list?.addEventListener('click', (e) => {
          const t = e.target.closest('button'); if (!t) return;
          if (t.dataset.copy) { copy(t.dataset.copy); }
          else if (t.dataset.share) {
            try { const p = JSON.parse(t.dataset.share); share(p.title, p.text, p.url); }
            catch { copy(location.origin); }
          } else if (t.dataset.preview) {
            try { const c = JSON.parse(t.dataset.preview); ui.openPreview(c); } catch { }
          }
        });
        $('#ctaCreateNow')?.addEventListener('click', () => viewTransition(() => ui.show('create')));
      },
      openPreview(card) {
       
        const wrap = document.createElement('div');
        wrap.className = 'fixed inset-0 z-50 grid place-items-center bg-black/60 p-4';
        wrap.innerHTML = `
          <div class="max-w-xl w-full bg-gray-800 rounded-xl overflow-hidden shadow-xl ring-1 ring-white/10">
            ${card.fotoUrl ? `<img src="${htmlesc(card.fotoUrl)}" alt="" class="w-full h-64 object-cover">` : ''}
            <div class="p-5 space-y-2">
              <h3 class="text-white text-xl font-semibold">Para: ${htmlesc(card.para)}</h3>
              <p class="text-gray-300 whitespace-pre-line">${htmlesc(card.mensagem || '')}</p>
              <p class="text-xs text-gray-400">De: ${htmlesc(card.de || 'Anônimo')} • ${fmtDate(card.createdAt)}</p>
              <div class="flex gap-2 pt-2">
                <a href="card.html?id=${encodeURIComponent(card.id)}" class="px-3 py-2 rounded-md bg-fuchsia-600 text-white hover:bg-fuchsia-500">Abrir cartão</a>
                <button class="ml-auto px-3 py-2 rounded-md bg-gray-700 text-white hover:bg-gray-600" data-close>Fechar</button>
              </div>
            </div>
          </div>`;
        document.body.appendChild(wrap);
        wrap.addEventListener('click', (e) => { if (e.target === wrap || e.target.closest('[data-close]')) wrap.remove(); });
      },
      updateToolbar() {
        const hasBar = document.querySelector('#cardsToolbar');
        if (!hasBar) return;
        els.search && (els.search.value = state.search);
        els.sort && (els.sort.value = state.sort);
        els.filter && (els.filter.value = state.filter);
      }
    };

    const auth = {
      save(token, user) { state.token = token; state.user = user; sessionStorage.setItem('token', token); sessionStorage.setItem('user', JSON.stringify(user)); },
      clear() { state.token = null; state.user = null; sessionStorage.removeItem('token'); sessionStorage.removeItem('user'); },
      async login(e) {
        e.preventDefault();
        const email = els.loginForm.email.value.trim().toLowerCase();
        const password = els.loginForm.password.value;
        els.loginBtn.disabled = true;
        try {
          const data = await api.login(email, password);
          auth.save(data.token, data.user);
          ui.toast('Login realizado!', 'success'); viewTransition(() => ui.show('dash')); dataLayer();
          await cards.load(); // carrega cards pós login
        } catch (e) { ui.toast(e.message || 'Falha no login', 'error'); }
        finally { els.loginBtn.disabled = false; els.loginForm.password.value = ''; }
      },
      async register(e) {
        e.preventDefault();
        const name = els.registerForm.name.value.trim();
        const email = els.registerForm.email.value.trim().toLowerCase();
        const password = els.registerForm.password.value;
        els.registerBtn.disabled = true;
        try {
          const data = await api.register(name, email, password);
          auth.save(data.token, data.user);
          ui.toast(`Bem-vindo, ${data.user.name}!`, 'success'); viewTransition(() => ui.show('dash'));
          await cards.load();
        } catch (e) { ui.toast(e.message || 'Falha no registro', 'error'); }
        finally { els.registerBtn.disabled = false; els.registerForm.password.value = ''; }
      },
      logout() { auth.clear(); ui.toast('Você saiu.', 'info'); viewTransition(() => ui.show('welcome')); els.list && (els.list.innerHTML = ''); },
      startTokenChecks() {
        if (!state.token) return;
        api.verify().catch(() => auth.logout());
        setInterval(() => state.token && api.verify().catch(() => auth.logout()), cfg.TOKEN_CHECK_INTERVAL);
      }
    };

    const cards = {
      applyFilters() {
        let arr = [...state.cards];
        if (state.search) {
          const q = state.search.toLowerCase();
          arr = arr.filter(c => (c.para || '').toLowerCase().includes(q) || (c.de || '').toLowerCase().includes(q) || (c.mensagem || '').toLowerCase().includes(q));
        }
        if (state.filter === 'withPhoto') arr = arr.filter(c => !!c.fotoUrl);
        if (state.filter === 'noPhoto') arr = arr.filter(c => !c.fotoUrl);
        if (state.sort === 'date_desc') arr.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        if (state.sort === 'date_asc') arr.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        state.filtered = arr;
      },
      async load() {
        if (!state.user || !els.list) return;
        ui.setLoadingCards(true);
        try {
          const data = await api.cards();
          state.cards = Array.isArray(data) ? data : [];
          cards.applyFilters();
          viewTransition(() => {
            els.list.innerHTML = state.filtered.length ? ui.grid(state.filtered) : ui.emptyState();
            ui.applyGridBehaviors();
          });
        } catch (e) {
          ui.toast(`Erro ao carregar cartões: ${e.message}`, 'error');
          els.list.innerHTML = ui.emptyState();
          ui.applyGridBehaviors();
        } finally {
          ui.setLoadingCards(false);
        }
      },
      async create(e) {
        e.preventDefault();
        if (!state.user) return ui.toast('Faça login para criar.', 'warn');
        const fd = new FormData(els.createForm);
        for (const f of ['de', 'para', 'mensagem']) {
          if (!fd.get(f)) return ui.toast(`Preencha o campo ${f}.`, 'warn');
        }
        els.createBtn.disabled = true;
        try {
          const res = await api.createCard(fd);
          ui.toast('Cartão criado!', 'success');
          els.createForm.reset();
          viewTransition(() => ui.show('dash'));
          await cards.load();
          setTimeout(() => location.href = `card.html?id=${encodeURIComponent(res.id)}`, 350);
        } catch (e) { ui.toast(e.message || 'Erro ao criar cartão', 'error'); }
        finally { els.createBtn.disabled = false; }
      }
    };

    const particles = (() => {
      let ctx, raf, pts = [];
      const resize = () => {
        const dpr = Math.min(devicePixelRatio || 1, 2);
        const w = innerWidth, h = innerHeight;
        els.particle.width = Math.floor(w * dpr);
        els.particle.height = Math.floor(h * dpr);
        els.particle.style.width = w + 'px'; els.particle.style.height = h + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      };
      const spawn = () => {
        pts = [];
        const density = innerWidth < 768 ? cfg.PARTICLE.density.mobile : cfg.PARTICLE.density.desktop;
        const n = Math.min((innerWidth * innerHeight) / density, 80) | 0;
        for (let i = 0; i < n; i++) {
          pts.push({ x: Math.random() * innerWidth, y: Math.random() * innerHeight, dx: Math.random() * 0.3 - 0.15, dy: Math.random() * 0.3 - 0.15, s: Math.random() * 3 + 2, c: cfg.PARTICLE.colors[(Math.random() * cfg.PARTICLE.colors.length) | 0], ph: Math.random() * Math.PI * 2 });
        }
      };
      const draw = () => {
        ctx.fillStyle = 'rgba(0,0,0,.03)'; ctx.fillRect(0, 0, els.particle.width, els.particle.height);
        for (const p of pts) {
          p.x += p.dx + Math.sin(p.ph) * 0.3; p.y += p.dy + Math.cos(p.ph) * 0.3; p.ph += 0.02;
          if (p.x < 0 || p.x > innerWidth) p.dx *= -1; if (p.y < 0 || p.y > innerHeight) p.dy *= -1;
          ctx.save(); ctx.translate(p.x, p.y); const sc = p.s / 4; ctx.scale(sc, sc);
          ctx.beginPath(); ctx.moveTo(0, -3); ctx.bezierCurveTo(-3, -5, -6, -2, -6, 1); ctx.bezierCurveTo(-6, 4, -3, 6, 0, 3); ctx.bezierCurveTo(3, 6, 6, 4, 6, 1); ctx.bezierCurveTo(6, -2, 3, -5, 0, -3); ctx.closePath();
          ctx.fillStyle = p.c; ctx.shadowColor = cfg.PARTICLE.glow; ctx.shadowBlur = 8; ctx.fill(); ctx.restore();
        }
        raf = requestAnimationFrame(draw);
      };
      const onResize = () => { resize(); spawn(); };
      return {
        init() {
          if (!els.particle) return;
          ctx = els.particle.getContext('2d'); resize(); spawn(); raf && cancelAnimationFrame(raf); raf = requestAnimationFrame(draw);
          addEventListener('resize', onResize);
        }
      };
    })();

  
    const bind = () => {
      els.logoutBtn?.addEventListener('click', auth.logout);
      els.loginForm?.addEventListener('submit', auth.login);
      els.registerForm?.addEventListener('submit', auth.register);
      els.resetForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = e.target.email.value.trim().toLowerCase();
        const token = e.target.token.value.trim();
        const newPassword = e.target.newPassword.value;
        try {
          if (token && newPassword) {
            await api.reset(email, token, newPassword);
            ui.toast('Senha alterada! Faça login.', 'success');
            ui.show('welcome');
          } else {
            await api.forgot(email);
            ui.toast('Se o email existir, enviaremos instruções.', 'success');
            ui.show('welcome');
          }
        } catch (err) { ui.toast(err.message || 'Erro ao processar.', 'error'); }
      });
      els.createForm?.addEventListener('submit', cards.create);
      els.showCreate?.addEventListener('click', () => viewTransition(() => ui.show('create')));
      els.showDash?.addEventListener('click', () => viewTransition(() => ui.show('dash')));
      els.openLogin?.addEventListener('click', () => ui.show('welcome'));
      els.openRegister?.addEventListener('click', () => ui.show('welcome'));

      // toolbar
      const deb = (fn, ms = 300) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); } };
      els.search?.addEventListener('input', deb(e => { state.search = e.target.value.trim(); cards.applyFilters(); els.list.innerHTML = state.filtered.length ? ui.grid(state.filtered) : ui.emptyState(); ui.applyGridBehaviors(); }));
      els.sort?.addEventListener('change', e => { state.sort = e.target.value; cards.applyFilters(); els.list.innerHTML = state.filtered.length ? ui.grid(state.filtered) : ui.emptyState(); ui.applyGridBehaviors(); });
      els.filter?.addEventListener('change', e => { state.filter = e.target.value; cards.applyFilters(); els.list.innerHTML = state.filtered.length ? ui.grid(state.filtered) : ui.emptyState(); ui.applyGridBehaviors(); });
    };


    const init = async () => {
      ui.setYear();
      particles.init();
      if (state.user) {
        ui.show('dash');
        els.userWelcome && (els.userWelcome.textContent = `Olá, ${state.user.name}!`);
        auth.startTokenChecks();
        await cards.load();
      } else {
        ui.show('welcome');
      }
      ui.updateToolbar();
      bind();
    };

    return { init };
  })();

  App.init();
});

