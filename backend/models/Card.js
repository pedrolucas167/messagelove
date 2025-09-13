document.addEventListener('DOMContentLoaded', () => {
  const CardViewer = (() => {
    const config = {
      API_URL: (['localhost','127.0.0.1'].includes(window.location.hostname)
        ? 'http://localhost:3001/api'
        : 'https://messagelove.onrender.com/api'),
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
        const headers = new Headers(options.headers || {});
        if (!(options.body instanceof FormData) && !headers.has('Content-Type') && options.method && options.method !== 'GET') {
          headers.set('Content-Type', 'application/json');
        }
        if (token && !headers.has('Authorization')) {
          headers.set('Authorization', `Bearer ${token}`);
        }

        const res = await fetch(`${config.API_URL}${endpoint}`, { ...options, headers });
        const text = await res.text();
        const data = text ? JSON.parse(text) : {};

        if (!res.ok) {
          let errorMessage = data.message || `Erro ${res.status}: ${res.statusText}`;
          if (Array.isArray(data.errors)) {
            errorMessage = data.errors.map(e => e.msg || e.message).join(' ');
          }
          const err = new Error(errorMessage);
          err.status = res.status;
          err.data = data;
          throw err;
        }
        return data;
      },
      getCard: (id) => api.request(`/cards/${encodeURIComponent(id)}`)
    };

    const ui = {
      showNotification(message, type = 'error') {
        const n = document.createElement('div');
        n.className = `p-4 text-sm rounded-lg ${type === 'error' ? 'bg-red-600' : 'bg-green-600'} text-white fixed top-4 right-4 z-50 shadow-lg`;
        n.textContent = message;
        document.body.appendChild(n);
        setTimeout(() => n.remove(), 5000);
      },
      renderUnveilingScreen(card) {
        if (!card) return;
        elements.unveilingRecipientName && (elements.unveilingRecipientName.textContent = card.para || 'Destinatário');
        elements.unveilingSenderName && (elements.unveilingSenderName.textContent = card.de || 'Anônimo');
        elements.loadingState?.classList.add('hidden');
        elements.unveilingContent?.classList.remove('hidden');
      },
      renderCard(card) {
        if (!card || !elements.cardView) return;
        elements.recipientName && (elements.recipientName.textContent = card.para || 'Destinatário');
        elements.specialDate && (elements.specialDate.textContent = card.createdAt ? new Date(card.createdAt).toLocaleDateString('pt-BR') : '');
        elements.cardMessage && (elements.cardMessage.textContent = card.mensagem || '');
        elements.cardSender && (elements.cardSender.textContent = card.de || 'Anônimo');

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
                title="${(card.para || 'Destinatário')} - Mensagem de ${(card.de || 'Anônimo')}"
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
        this.showNotification(message, 'error');
      }
    };

    const particles = (() => {
      let ctx = null;
      let frameId = null;
      let particlesArray = [];
      let resizeTimeout = null;

      function resizeCanvas() {
        if (!elements.particleCanvas) return;
        elements.particleCanvas.width = window.innerWidth;
        elements.particleCanvas.height = window.innerHeight;
      }

      function createParticles() {
        particlesArray = [];
        const count = Math.min((window.innerWidth * window.innerHeight) / 15000, 80);
        for (let i = 0; i < count; i++) {
          particlesArray.push({
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            directionX: Math.random() * 0.3 - 0.15,
            directionY: Math.random() * 0.3 - 0.15,
            size: Math.random() * 3 + 2,
            color: config.PARTICLE_COLORS[Math.floor(Math.random() * config.PARTICLE_COLORS.length)],
            phase: Math.random() * Math.PI * 2
          });
        }
      }

      function drawHeart(x, y, size, color) {
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(size / 4, size / 4);
        ctx.beginPath();
        ctx.moveTo(0, -3);
        ctx.bezierCurveTo(-3, -5, -6, -2, -6, 1);
        ctx.bezierCurveTo(-6, 4, -3, 6, 0, 3);
        ctx.bezierCurveTo(3, 6, 6, 4, 6, 1);
        ctx.bezierCurveTo(6, -2, 3, -5, 0, -3);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.shadowColor = config.PARTICLE_GLOW;
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.restore();
      }

      function step() {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.03)';
        ctx.fillRect(0, 0, elements.particleCanvas.width, elements.particleCanvas.height);

        for (const p of particlesArray) {
          p.x += p.directionX + Math.sin(p.phase) * 0.3;
          p.y += p.directionY + Math.cos(p.phase) * 0.3;
          p.phase += 0.02;

          if (p.x > elements.particleCanvas.width || p.x < 0) p.directionX = -p.directionX;
          if (p.y > elements.particleCanvas.height || p.y < 0) p.directionY = -p.directionY;

          drawHeart(p.x, p.y, p.size, p.color);
        }
        frameId = requestAnimationFrame(step);
      }

      function onResize() {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
          cancelAnimationFrame(frameId);
          resizeCanvas();
          createParticles();
          frameId = requestAnimationFrame(step);
        }, 120);
      }

      return {
        init() {
          if (!elements.particleCanvas) return;
          ctx = elements.particleCanvas.getContext('2d');
          resizeCanvas();
          createParticles();
          frameId = requestAnimationFrame(step);
          window.addEventListener('resize', onResize);
        },
        cleanup() {
          cancelAnimationFrame(frameId);
          window.removeEventListener('resize', onResize);
        }
      };
    })();

    const init = async () => {
      particles.init();

      const urlParams = new URLSearchParams(window.location.search);
      const cardId = urlParams.get('id');
      if (!cardId) {
        ui.showError('ID do cartão não fornecido.');
        return;
      }

      try {
        const response = await api.getCard(cardId);
        const card = Array.isArray(response) ? response[0] : response;
        if (!card || typeof card !== 'object') throw new Error('Cartão inválido ou não encontrado.');

        ui.renderUnveilingScreen(card);
        elements.openCardBtn?.addEventListener('click', () => {
          ui.renderCard(card);
          ui.showCardView();
        }, { once: true });
      } catch (err) {
        const message = err.status === 404 ? 'Cartão não encontrado.' : (err.message || 'Erro ao carregar cartão.');
        ui.showError(message);
      }
    };

    return { init };
  })();

  CardViewer.init();
});
