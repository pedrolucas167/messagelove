document.addEventListener('DOMContentLoaded', () => {
  const CardViewer = (() => {
    const cfg = {
      API_URL: (() => {
        const meta = document.querySelector('meta[name="api-url"]')?.content?.trim();
        if (meta) return meta.replace(/\/$/, '');
        return (['localhost','127.0.0.1'].includes(location.hostname))
          ? 'http://localhost:3001/api'
          : 'https://messagelove.onrender.com/api';
      })(),
      REQ_TIMEOUT_MS: 10_000,
      RETRIES: 2,
      RETRY_BASE_MS: 600,
      PARTICLE: {
        maxCount: 80,
        density: 15000,
        colors: [
          'rgba(255, 182, 193, 0.7)',
          'rgba(219, 112, 147, 0.6)',
          'rgba(255, 245, 238, 0.5)',
          'rgba(221, 160, 221, 0.6)'
        ],
        glow: 'rgba(255, 105, 180, 0.8)'
      },
      DATE_FMT: new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium' })
    };

    const $ = (id) => document.getElementById(id);
    const el = {
      unveilingScreen: $('unveiling-screen'),
      loadingState: $('loading-state'),
      unveilingContent: $('unveiling-content'),
      unveilingRecipientName: $('unveiling-recipient-name'),
      unveilingSenderName: $('unveiling-sender-name'),
      openCardBtn: $('open-card-btn'),
      cardPageHeader: $('card-page-header'),
      mainContent: $('main-content'),
      cardView: $('card-view'),
      recipientName: $('card-nome'),
      specialDate: $('card-data'),
      cardMessage: $('card-mensagem'),
      cardSender: $('card-de'),
      cardFotoContainer: $('card-foto-container'),
      cardVideoContainer: $('card-video-container'),
      errorState: $('error-state'),
      particleCanvas: $('particle-canvas')
    };

    // ===== Utils =====
    const getToken = () => sessionStorage.getItem('token') || '';
    const safeParseJSON = (t) => { try { return t ? JSON.parse(t) : {}; } catch { return { message: 'Resposta inválida do servidor' }; } };
    const qs = new URLSearchParams(location.search);
    const formatDate = (iso) => (iso ? cfg.DATE_FMT.format(new Date(iso)) : '');

    const api = {
      async request(path, { method = 'GET', headers = {}, body, auth = false, timeout = cfg.REQ_TIMEOUT_MS } = {}) {
        const url = `${cfg.API_URL}${path}`;
        const hdrs = new Headers(headers);
        if (!(body instanceof FormData)) hdrs.set('Content-Type', 'application/json');
        if (auth && getToken()) hdrs.set('Authorization', `Bearer ${getToken()}`);

        let lastErr;
        for (let attempt = 0; attempt <= cfg.RETRIES; attempt++) {
          const ac = new AbortController();
          const t = setTimeout(() => ac.abort(), timeout);
          try {
            const resp = await fetch(url, { method, headers: hdrs, body, signal: ac.signal });
            clearTimeout(t);
            const text = await resp.text();
            const data = safeParseJSON(text);
            if (!resp.ok) {
              const errs = Array.isArray(data.errors) ? data.errors.map(e => e.msg || e.message).join(' ') : '';
              const msg = data.message || errs || `Erro ${resp.status}: ${resp.statusText}`;
              const err = new Error(msg);
              err.status = resp.status;
              err.data = data;
              throw err;
            }
            return data;
          } catch (e) {
            clearTimeout(t);
            lastErr = e;
            const retriable = !e.status || (e.status >= 500 && e.status < 600);
            if (attempt < cfg.RETRIES && retriable) {
              const wait = cfg.RETRY_BASE_MS * 2 ** attempt + Math.random() * 250;
              await new Promise(r => setTimeout(r, wait));
              continue;
            }
            throw e;
          }
        }
        throw lastErr;
      },
      getCard: (id) => api.request(`/cards/${encodeURIComponent(id)}`, { auth: false }) // público
    };

    const ui = (() => {
    
      let live = document.querySelector('[data-live-region]');
      if (!live) {
        live = document.createElement('div');
        live.setAttribute('aria-live', 'polite');
        live.setAttribute('aria-atomic', 'true');
        live.dataset.liveRegion = 'true';
        live.style.position = 'fixed';
        live.style.inset = 'auto 1rem 1rem auto';
        live.style.zIndex = '9999';
        document.body.appendChild(live);
      }

      const notify = (message, type = 'info', ms = 4000) => {
        const colors = { info: '#3b82f6', success: '#22c55e', error: '#ef4444', warn: '#eab308' };
        const n = document.createElement('div');
        n.style.cssText = `
          background:${colors[type] || colors.info};
          color:#fff; padding:.75rem 1rem; margin-top:.5rem;
          border-radius:.5rem; box-shadow:0 10px 15px -3px rgba(0,0,0,.3);
          font-size:.9rem; max-width:22rem;
        `;
        n.textContent = message;
        live.appendChild(n);
        setTimeout(() => n.remove(), ms);
      };

      const showUnveiling = (card) => {
        if (el.unveilingRecipientName) el.unveilingRecipientName.textContent = card.para || 'Destinatário';
        if (el.unveilingSenderName) el.unveilingSenderName.textContent = card.de || 'Anônimo';
        el.loadingState?.classList.add('hidden');
        el.unveilingContent?.classList.remove('hidden');
      };

      const lazyYouTube = (videoId, start = 0) => {
        if (!el.cardVideoContainer) return;
        el.cardVideoContainer.innerHTML = '';
        if (!videoId) return;

        const thumb = `https://i.ytimg.com/vi/${encodeURIComponent(videoId)}/hqdefault.jpg`;
        const wrap = document.createElement('div');
        wrap.className = 'relative w-full rounded overflow-hidden cursor-pointer';
        wrap.style.aspectRatio = '16/9';

        const img = document.createElement('img');
        img.src = thumb;
        img.alt = 'Pré-visualização do vídeo';
        img.loading = 'lazy';
        img.referrerPolicy = 'no-referrer';
        img.className = 'w-full h-full object-cover';
        wrap.appendChild(img);

        const play = document.createElement('button');
        play.setAttribute('aria-label', 'Reproduzir vídeo');
        play.className = 'absolute inset-0 grid place-items-center';
        play.innerHTML = `
          <span style="
            width:64px;height:64px;border-radius:9999px;
            background:rgba(0,0,0,.6);display:inline-grid;place-items:center;">
            ▶
          </span>`;
        wrap.appendChild(play);

        wrap.addEventListener('click', () => {
          el.cardVideoContainer.innerHTML = `
            <iframe
              src="https://www.youtube.com/embed/${encodeURIComponent(videoId)}?start=${Number(start)||0}&autoplay=1"
              title="YouTube video"
              frameborder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowfullscreen
              class="w-full rounded"
              style="aspect-ratio:16/9"></iframe>`;
        }, { once: true });

        el.cardVideoContainer.appendChild(wrap);
      };

      const renderCard = (card) => {
        if (el.recipientName) el.recipientName.textContent = card.para || 'Destinatário';
        if (el.specialDate) el.specialDate.textContent = formatDate(card.createdAt);
        if (el.cardMessage) el.cardMessage.textContent = card.mensagem || '';
        if (el.cardSender) el.cardSender.textContent = card.de || 'Anônimo';

        if (el.cardFotoContainer) {
          el.cardFotoContainer.innerHTML = '';
          if (card.fotoUrl) {
            const img = document.createElement('img');
            img.src = card.fotoUrl;
            img.alt = 'Imagem do cartão';
            img.className = 'max-w-full rounded';
            img.loading = 'lazy';
            el.cardFotoContainer.appendChild(img);
          }
        }

        lazyYouTube(card.youtubeVideoId, card.youtubeStartTime);
      };

      const openView = () => {
        el.unveilingScreen?.classList.remove('visible');
        el.cardPageHeader?.classList.remove('hidden');
        el.mainContent?.classList.remove('hidden');
        el.cardView?.classList.remove('hidden');
        document.getElementById('card-page-footer')?.classList.remove('hidden');
      };

      const showError = (msg) => {
        el.loadingState?.classList.add('hidden');
        el.unveilingScreen?.classList.remove('visible');
        el.errorState?.classList.remove('hidden');
        notify(msg, 'error');
      };

      return { notify, showUnveiling, renderCard, openView, showError };
    })();


    const particles = (() => {
      let ctx, raf, resizeTid;
      let pts = [];

      const sizeFor = () => Math.min((innerWidth * innerHeight) / cfg.PARTICLE.density, cfg.PARTICLE.maxCount) | 0;

      const resize = () => {
        if (!el.particleCanvas) return;
        const dpr = Math.min(devicePixelRatio || 1, 2);
        const w = innerWidth, h = innerHeight;
        el.particleCanvas.width = Math.floor(w * dpr);
        el.particleCanvas.height = Math.floor(h * dpr);
        el.particleCanvas.style.width = `${w}px`;
        el.particleCanvas.style.height = `${h}px`;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      };

      const spawn = () => {
        pts = [];
        const n = sizeFor();
        for (let i = 0; i < n; i++) {
          pts.push({
            x: Math.random() * innerWidth,
            y: Math.random() * innerHeight,
            dx: Math.random() * 0.3 - 0.15,
            dy: Math.random() * 0.3 - 0.15,
            size: Math.random() * 3 + 2,
            color: cfg.PARTICLE.colors[(Math.random() * cfg.PARTICLE.colors.length) | 0],
            phase: Math.random() * Math.PI * 2
          });
        }
      };

      const loop = () => {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.03)';
        ctx.fillRect(0, 0, el.particleCanvas.width, el.particleCanvas.height);
        for (const p of pts) {
          p.x += p.dx + Math.sin(p.phase) * 0.3;
          p.y += p.dy + Math.cos(p.phase) * 0.3;
          p.phase += 0.02;
          if (p.x < 0 || p.x > innerWidth) p.dx *= -1;
          if (p.y < 0 || p.y > innerHeight) p.dy *= -1;

          ctx.save();
          ctx.translate(p.x, p.y);
          const s = p.size / 4;
          ctx.scale(s, s);
          ctx.beginPath();
          ctx.moveTo(0, -3);
          ctx.bezierCurveTo(-3, -5, -6, -2, -6, 1);
          ctx.bezierCurveTo(-6, 4, -3, 6, 0, 3);
          ctx.bezierCurveTo(3, 6, 6, 4, 6, 1);
          ctx.bezierCurveTo(6, -2, 3, -5, 0, -3);
          ctx.closePath();
          ctx.fillStyle = p.color;
          ctx.shadowColor = cfg.PARTICLE.glow;
          ctx.shadowBlur = 8;
          ctx.fill();
          ctx.restore();
        }
        raf = requestAnimationFrame(loop);
      };

      const onResize = () => {
        clearTimeout(resizeTid);
        resizeTid = setTimeout(() => { resize(); spawn(); }, 120);
      };

      return {
        init() {
          if (!el.particleCanvas) return;
          ctx = el.particleCanvas.getContext('2d');
          resize(); spawn();
          if (raf) cancelAnimationFrame(raf);
          raf = requestAnimationFrame(loop);
          addEventListener('resize', onResize);
        },
        cleanup() {
          if (raf) cancelAnimationFrame(raf);
          removeEventListener('resize', onResize);
          clearTimeout(resizeTid);
        }
      };
    })();

    // ===== Init =====
    const init = async () => {
      particles.init();

      const id = qs.get('id');
      if (!id) { ui.showError('ID do cartão não fornecido.'); return; }

      try {
        const card = await api.getCard(id);
        if (!card || typeof card !== 'object') throw new Error('Cartão inválido ou não encontrado.');
        ui.showUnveiling(card);
        el.openCardBtn?.addEventListener('click', () => {
          ui.renderCard(card);
          ui.openView();
        }, { once: true });
      } catch (e) {
        const msg = (e.status === 404) ? 'Cartão não encontrado.' : (e.message || 'Erro ao carregar cartão.');
        ui.showError(msg);
      }
    };

    return { init };
  })();

  CardViewer.init();
});

