/**
 * @file card.js
 * @description Script to render a specific card on card.html using data from the backend.
 * @author Pedro Marques
 * @version 1.2.1
 */
document.addEventListener('DOMContentLoaded', () => {
    const CardViewer = (() => {
        const config = {
            API_URL: window.location.hostname.includes('localhost')
                ? 'http://localhost:3000/api'
                : 'https://messagelove-backend.onrender.com/api',
            PARTICLE_COLORS: [
                'rgba(255, 182, 193, 0.7)', // Light pink
                'rgba(219, 112, 147, 0.6)', // Pale violet red
                'rgba(255, 245, 238, 0.5)', // Seashell white
                'rgba(221, 160, 221, 0.6)'  // Plum purple
            ],
            PARTICLE_GLOW: 'rgba(255, 105, 180, 0.8)' // Hot pink glow
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

        // Validação inicial de elementos
        if (!Object.values(elements).every(el => el || el === null)) {
            console.warn('Alguns elementos HTML não foram encontrados:', elements);
        }

        const api = {
            async request(endpoint, options = {}) {
                const token = sessionStorage.getItem('token'); // Alinhado com script.js
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
                        const errorMessage = result.message || `Erro ${response.status}: ${response.statusText}`;
                        if (Array.isArray(result.errors)) {
                            errorMessage = result.errors.map(e => e.msg).join(' ');
                        }
                        const error = new Error(errorMessage);
                        error.status = response.status;
                        error.data = result;
                        throw error;
                    }
                    return result;
                } catch (error) {
                    console.error(`API Error on ${endpoint}:`, { status: error.status, message: error.message, data: error.data });
                    throw error;
                }
            },
            getCard: (id) => api.request(`/cards/${id}`)
        };

        const ui = {
            showNotification(message, type = 'error') {
                if (!document.body) return;
                const notification = document.createElement('div');
                notification.className = `p-4 text-sm rounded-lg ${type === 'error' ? 'bg-red-600' : 'bg-green-500'} text-white fixed top-4 right-4 z-50`;
                notification.textContent = message;
                document.body.appendChild(notification);
                setTimeout(() => notification.remove(), 5000);
            },
            renderUnveilingScreen(card) {
                if (!card || !elements.unveilingRecipientName || !elements.unveilingSenderName) return;
                elements.unveilingRecipientName.textContent = card.para || 'Destinatário';
                elements.unveilingSenderName.textContent = card.de || 'Anônimo';
                elements.loadingState?.classList.add('hidden');
                elements.unveilingContent?.classList.remove('hidden');
            },
            renderCard(card) {
                if (!card || !elements.cardView) return;
                elements.recipientName.textContent = card.para || 'Destinatário';
                elements.specialDate.textContent = card.createdAt ? new Date(card.createdAt).toLocaleDateString('pt-BR') : '';
                elements.cardMessage.textContent = card.mensagem || '';
                elements.cardSender.textContent = card.de || 'Anônimo';
                elements.cardFotoContainer?.innerHTML = ''; // Limpa conteúdo anterior
                if (card.fotoUrl && elements.cardFotoContainer) {
                    const img = document.createElement('img');
                    img.src = card.fotoUrl;
                    img.alt = 'Imagem do cartão';
                    img.className = 'max-w-full rounded';
                    elements.cardFotoContainer.appendChild(img);
                }
                elements.cardVideoContainer?.innerHTML = ''; // Limpa conteúdo anterior
                if (card.youtubeVideoId && elements.cardVideoContainer) {
                    const startTime = card.youtubeStartTime || 0;
                    elements.cardVideoContainer.innerHTML = `
                        <iframe 
                            src="https://www.youtube.com/embed/${card.youtubeVideoId}?start=${startTime}" 
                            title="${card.para} - Mensagem de ${card.de}" 
                            frameborder="0" 
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                            allowfullscreen 
                            class="w-full h-64 rounded">
                        </iframe>
                    `;
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
                if (!elements.errorState) return;
                elements.loadingState?.classList.add('hidden');
                elements.unveilingScreen?.classList.remove('visible');
                elements.errorState.classList.remove('hidden');
                this.showNotification(message, 'error');
            }
        };

        const particles = {
            init() {
                if (!elements.particleCanvas || !config.PARTICLE_COLORS) return;
                const ctx = elements.particleCanvas.getContext('2d');
                this.resizeCanvas();

                const particlesArray = [];
                const numberOfParticles = Math.min((window.innerWidth * window.innerHeight) / 15000, 80);

                for (let i = 0; i < numberOfParticles; i++) {
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

                const animate = () => {
                    ctx.fillStyle = 'rgba(0, 0, 0, 0.03)';
                    ctx.fillRect(0, 0, elements.particleCanvas.width, elements.particleCanvas.height);

                    particlesArray.forEach(particle => {
                        particle.x += particle.directionX + Math.sin(particle.phase) * 0.3;
                        particle.y += particle.directionY + Math.cos(particle.phase) * 0.3;
                        particle.phase += 0.02;

                        if (particle.x > elements.particleCanvas.width || particle.x < 0) particle.directionX = -particle.directionX;
                        if (particle.y > elements.particleCanvas.height || particle.y < 0) particle.directionY = -particle.directionY;

                        ctx.save();
                        ctx.translate(particle.x, particle.y);
                        ctx.scale(particle.size / 4, particle.size / 4);
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

                    requestAnimationFrame(animate);
                };

                animate();

                window.addEventListener('resize', () => {
                    this.resizeCanvas();
                    // Recriar partículas em resize
                    this.init(); // Reinicia para ajustar a densidade
                });
            },
            resizeCanvas() {
                if (elements.particleCanvas) {
                    elements.particleCanvas.width = window.innerWidth;
                    elements.particleCanvas.height = window.innerHeight;
                }
            }
        };

        const init = async () => {
            if (!elements.particleCanvas) {
                console.warn('Elemento particleCanvas não encontrado. Efeitos de partículas desativados.');
            }
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
                if (!card || typeof card !== 'object') {
                    throw new Error('Cartão inválido ou não encontrado.');
                }
                ui.renderUnveilingScreen(card);
                elements.openCardBtn?.addEventListener('click', () => {
                    ui.renderCard(card);
                    ui.showCardView();
                }, { once: true });
            } catch (error) {
                const message = error.status === 404 ? 'Cartão não encontrado.' : error.message || 'Erro ao carregar cartão.';
                ui.showError(message);
            }
        };

        return { init };
    })();

    CardViewer.init();
});