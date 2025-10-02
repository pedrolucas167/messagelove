document.addEventListener('DOMContentLoaded', () => {
  const CardViewer = (() => {
    const config = {
      API_URL: (['localhost','127.0.0.1'].includes(location.hostname))
        ? 'http://localhost:3001/api'
        : 'https://messagelove.onrender.com/api',
      PARTICLE_COLORS: [
        'rgba(255, 182, 193, 0.7)',
        'rgba(219, 112, 147, 0.6)',
        'rgba(255, 245, 238, 0.5)',
        'rgba(221, 160, 221, 0.6)'
      ],
      PARTICLE_GLOW: 'rgba(255, 105, 180, 0.8)'
    };

    const elements = {
      unveilingScreen: document.getElementById('unveiling-screen'),
      loadingState: document.getElementById('loading-state'),
      unveilingContent: document.getElementById('unveiling-content'),
      unveilingRecipientName: document.getElementById('unveiling-recipient-name'),
      unveilingSenderName: document.getElementById('unveiling-sender-name'),
      openCardBtn: document.getElementById('open-card-btn'),
      cardPageHeader: document.getElementById('card-page-header'),
      mainContent: document.getElementById('main-content'),
      cardView: document.getElementById('card-view'),
      recipientName: document.getElementById('card-nome'),
      specialDate: document.getElementById('card-data'),
      cardMessage: document.getElementById('card-mensagem'),
      cardSender: document.getElementById('card-de'),
      cardFotoContainer: document.getElementById('card-foto-container'),
      cardVideoContainer: document.getElementById('card-video-container'),
      errorState: document.getElementById('error-state'),
      particleCanvas: document.getElementById('particle-canvas')
    };

    const api = {
      async request(endpoint, options = {}) {
        const token = sessionStorage.getItem('token');
        const headers = { ...(options.headers || {}) };
        if (!(options.body instanceof FormData)) headers['Content-Type'] = 'application/json';
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const resp = await fetch(`${config.API_URL}${endpoint}`, { ...options, headers });
        const text = await resp.text();
        const data = text ? JSON.parse(text) : {};
        if (!resp.ok) {
          let errorMessage = data.message || `Erro ${resp.status}: ${resp.statusText}`;
          if (Array.isArray(data.errors)) errorMessage = data.errors.map(e => e.msg || e.message).join(' ');
          const err = new Error(errorMessage);
          err.status = resp.status;
          err.data = data;
          throw err;
        }
        return data;
      },
      getCard: (id) => api.request(`/cards/${id}`)
    };

    const ui = {
      showNotification(message, type = 'error') {
        const n = document.createElement('div');
        n.className = `p-4 text-sm rounded-lg ${type === 'error' ? 'bg-red-600' : 'bg-green-500'} text-white fixed top-4 right-4 z-50`;
        n.textContent = message;
        document.body.appendChild(n);
        setTimeout(() => n.remove(), 5000);
      },
      renderUnveilingScreen(card) {
        if (!card) return;
        if (elements.unveilingRecipientName) elements.unveilingRecipientName.textContent = card.para || 'Destinatário';
        if (elements.unveilingSenderName) elements.unveilingSenderName.textContent = card.de || 'Anônimo';
        elements.loadingState?.classList.add('hidden');
        elements.unveilingContent?.classList.remove('hidden');
      },
      renderCard(card) {
        if (!card) return;
        if (elements.recipientName) elements.recipientName.textContent = card.para || 'Destinatário';
        if (elements.specialDate) elements.specialDate.textContent = card.createdAt ? new Date(card.createdAt).toLocaleDateString('pt-BR') : '';
        if (elements.cardMessage) elements.cardMessage.textContent = card.mensagem || '';
        if (elements.cardSender) elements.cardSender.textContent = card.de || 'Anônimo';
        if (elements.cardFotoContainer) {
          elements.cardFotoContainer.innerHTML = '';
          if (card.fotoUrl) {
            const img = document.createElement('img');
            img.src = card.fotoUrl;
            img.alt = 'Imagem do cartão';
            img.className = 'max-w-full rounded';
            elements.cardFotoContainer.appendChild(img);
          }
        }
        if (elements.cardVideoContainer) {
          elements.cardVideoContainer.innerHTML = '';
          if (card.youtubeVideoId) {
            const startTime = card.youtubeStartTime || 0;
            elements.cardVideoContainer.innerHTML = `
              <iframe
                src="https://www.youtube.com/embed/${card.youtubeVideoId}?start=${startTime}"
                title="${card.para || ''} - Mensagem de ${card.de || ''}"
                frameborder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowfullscreen
                class="w-full h-64 rounded">
              </iframe>
            `;
          }
        }
      },
      showCardView() {
        elements.unveilingScreen?.classList.remove('visible');
        elements.cardPageHeader?.classList.remove('hidden');
        elements.mainContent?.classList.remove('hidden');
        elements.cardView?.classList.remove('hidden');
        document.getElementById('card-page-footer')?.classList.remove('hidden');
      },
      showError(message = 'Erro ao carregar cartão.') {
        elements.loadingState?.classList.add('hidden');
        elements.unveilingScreen?.classList.remove('visible');
        elements.errorState?.classList.remove('hidden');
        ui.showNotification(message, 'error');
      }
    };

    const particles = (() => {
      let ctx = null;
      let list = [];
      let raf = null;
      let resizeTid = null;

      const resizeCanvas = () => {
        if (!elements.particleCanvas) return;
        elements.particleCanvas.width = window.innerWidth;
        elements.particleCanvas.height = window.innerHeight;
      };

      const spawn = () => {
        list = [];
        const count = Math.min((window.innerWidth * window.innerHeight) / 15000, 80);
        for (let i = 0; i < count; i++) {
          list.push({
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            directionX: Math.random() * 0.3 - 0.15,
            directionY: Math.random() * 0.3 - 0.15,
            size: Math.random() * 3 + 2,
            color: config.PARTICLE_COLORS[Math.floor(Math.random() * config.PARTICLE_COLORS.length)],
            phase: Math.random() * Math.PI * 2
          });
        }
      };

      const tick = () => {
        if (!ctx) return;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.03)';
        ctx.fillRect(0, 0, elements.particleCanvas.width, elements.particleCanvas.height);
        for (const p of list) {
          p.x += p.directionX + Math.sin(p.phase) * 0.3;
          p.y += p.directionY + Math.cos(p.phase) * 0.3;
          p.phase += 0.02;
          if (p.x > elements.particleCanvas.width || p.x < 0) p.directionX = -p.directionX;
          if (p.y > elements.particleCanvas.height || p.y < 0) p.directionY = -p.directionY;

          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.scale(p.size / 4, p.size / 4);
          ctx.beginPath();
          ctx.moveTo(0, -3);
          ctx.bezierCurveTo(-3, -5, -6, -2, -6, 1);
          ctx.bezierCurveTo(-6, 4, -3, 6, 0, 3);
          ctx.bezierCurveTo(3, 6, 6, 4, 6, 1);
          ctx.bezierCurveTo(6, -2, 3, -5, 0, -3);
          ctx.closePath();
          ctx.fillStyle = p.color;
          ctx.shadowColor = config.PARTICLE_GLOW;
          ctx.shadowBlur = 8;
          ctx.fill();
          ctx.restore();
        }
        raf = requestAnimationFrame(tick);
      };

      const onResize = () => {
        clearTimeout(resizeTid);
        resizeTid = setTimeout(() => { resizeCanvas(); spawn(); }, 120);
      };

      return {
        init() {
          if (!elements.particleCanvas) return;
          ctx = elements.particleCanvas.getContext('2d');
          resizeCanvas();
          spawn();
          if (raf) cancelAnimationFrame(raf);
          raf = requestAnimationFrame(tick);
          window.removeEventListener('resize', onResize);
          window.addEventListener('resize', onResize);
        },
        cleanup() {
          if (raf) cancelAnimationFrame(raf);
          window.removeEventListener('resize', onResize);
          clearTimeout(resizeTid);
        }
      };
    })();

    const init = async () => {
      particles.init();
      const params = new URLSearchParams(location.search);
      const cardId = params.get('id');
      if (!cardId) { ui.showError('ID do cartão não fornecido.'); return; }
      try {
        const data = await api.getCard(cardId);
        const card = Array.isArray(data) ? data[0] : data;
        if (!card || typeof card !== 'object') throw new Error('Cartão inválido ou não encontrado.');
        ui.renderUnveilingScreen(card);
        elements.openCardBtn?.addEventListener('click', () => { ui.renderCard(card); ui.showCardView(); }, { once: true });
      } catch (e) {
        const msg = e.status === 404 ? 'Cartão não encontrado.' : (e.message || 'Erro ao carregar cartão.');
        ui.showError(msg);
      }
    };

    return { init };
  })();

  CardViewer.init();
});
