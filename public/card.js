/**
 * @file card.js
 * @description Script para carregar e exibir um cartão personalizado com uma experiência de "revelação".
 * @author Pedro Marques
 * @version 4.1.0 
 */

// A classe de partículas fica fora do módulo principal para melhor organização.
class ParticleSystem {
    constructor(canvasId, emojis = ['❤️', '💖', '✨', '🎉', '💕', '⭐', '🥰']) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            console.warn('Canvas element not found, particle system will not run.');
            return;
        }
        this.ctx = this.canvas.getContext('2d');
        this.emojis = emojis;
        this.particles = [];
        this.animationFrameId = null;
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
    }
    resizeCanvas() { if (!this.canvas) return; this.canvas.width = window.innerWidth; this.canvas.height = window.innerHeight; }
    createParticles(amount = 100) { if (!this.canvas) return; this.particles = []; for (let i = 0; i < amount; i++) { this.particles.push({ x: Math.random() * this.canvas.width, y: this.canvas.height + Math.random() * 100, vx: (Math.random() - 0.5) * 1, vy: -Math.random() * 1.5 - 0.5, opacity: Math.random() * 0.5 + 0.5, emoji: this.emojis[Math.floor(Math.random() * this.emojis.length)], size: Math.random() * 20 + 15, rotation: Math.random() * 360, rotationSpeed: (Math.random() - 0.5) * 2 }); } }
    updateAndDraw() { if (!this.ctx) return; this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height); this.particles.forEach(p => { p.x += p.vx; p.y += p.vy; p.rotation += p.rotationSpeed; if (p.y < -p.size) { p.y = this.canvas.height + p.size; p.x = Math.random() * this.canvas.width; } this.ctx.save(); this.ctx.globalAlpha = p.opacity; this.ctx.font = `${p.size}px Arial`; this.ctx.translate(p.x, p.y); this.ctx.rotate(p.rotation * Math.PI / 180); this.ctx.fillText(p.emoji, -p.size / 2, p.size / 2); this.ctx.restore(); }); this.animationFrameId = requestAnimationFrame(() => this.updateAndDraw()); }
    start() { if (!this.canvas) return; this.createParticles(); this.updateAndDraw(); }
    stop() { if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId); }
}

const CardViewerApp = (() => {
    // --- 1. Módulos Internos: Config, State, Elements ---
    const config = {
        IS_LOCAL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1',
        get API_URL() { return this.IS_LOCAL ? 'http://localhost:3001/api' : 'https://messagelove-backend.onrender.com/api'; }
    };

    const state = { 
        cardData: null, 
        youtubePlayer: null, 
        particleSystem: null,
        isYouTubeApiReady: false
    };

    const elements = {
        loading: document.getElementById('loading-state'),
        error: document.getElementById('error-state'),
        mainContent: document.querySelector('.main-content'),
        footer: document.querySelector('.card-page-footer'),
        unveilingScreen: document.getElementById('unveiling-screen'),
        unveilingSenderName: document.getElementById('unveiling-sender-name'),
        openCardBtn: document.getElementById('open-card-btn'),
        cardView: document.getElementById('card-view'),
        nome: document.getElementById('card-nome'),
        de: document.getElementById('card-de'),
        data: document.getElementById('card-data'),
        mensagem: document.getElementById('card-mensagem'),
        fotoContainer: document.getElementById('card-foto-container'),
        videoContainer: document.getElementById('card-video-container'),
    };

    // --- 2. Módulo de API ---
    const api = {
        async fetchCard(id) {
            const url = `${config.API_URL}/cards/${id}`;
            const response = await fetch(url);
            if (!response.ok) {
                const errorResult = await response.json().catch(() => ({ message: 'Não foi possível ler a resposta do servidor.' }));
                throw new Error(errorResult.message || `Cartão não encontrado ou falha no servidor (Status: ${response.status}).`);
            }
            return await response.json();
        }
    };

    // --- 3. Módulo de UI (Manipulação da Interface) ---
    const ui = {
        showState(stateToShow) {
            ['loading', 'error', 'cardView', 'unveilingScreen'].forEach(s => {
                if (elements[s]) elements[s].hidden = (s !== stateToShow);
            });
        },
        showError(message) {
            this.showState('error');
            if (elements.error) elements.error.querySelector('p').textContent = message;
        },
        formatDate(dateString) {
            if (!dateString) return '';
            const date = new Date(dateString);
            return new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(date);
        },
        createUnmuteButton(player, container) {
            const button = document.createElement('button');
            button.className = 'unmute-button';
            button.innerHTML = `<svg viewbox="0 0 24 24"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9"x2="23" y2="15"></line></svg> <span>Aumente o som</span>`;
            button.addEventListener('click', () => { player.unMute(); button.classList.add('fading-out'); });
            container.appendChild(button);
            setTimeout(() => button.classList.add('visible'), 1500);
        },
        prepareUnveiling(senderName) {
            if (elements.unveilingSenderName) elements.unveilingSenderName.textContent = senderName;
            if (elements.unveilingScreen) elements.unveilingScreen.classList.add('visible');
            this.showState('unveilingScreen');
        },
        revealCard() {
            if (elements.unveilingScreen) elements.unveilingScreen.classList.remove('visible');
            if (elements.mainContent) elements.mainContent.classList.remove('hidden');
            if (elements.footer) elements.footer.classList.remove('hidden');
            document.body.classList.add('card-is-open');

            this.renderCardContent(state.cardData);
        },
        renderCardContent(card) {
            if (!card) return;
            document.title = `Uma mensagem de ${card.de} para ${card.para}`;

            if (elements.nome) elements.nome.textContent = card.para;
            if (elements.de) elements.de.textContent = card.de;
            if (elements.mensagem) elements.mensagem.textContent = card.mensagem;
            if (elements.data) elements.data.textContent = this.formatDate(card.data);
            
            // Renderização segura da imagem
            if (elements.fotoContainer && card.fotoUrl) {
                elements.fotoContainer.innerHTML = ''; // Limpa antes de adicionar
                const img = document.createElement('img');
                img.src = card.fotoUrl;
                img.alt = `Foto para ${card.para}`;
                img.className = 'card-image';
                elements.fotoContainer.appendChild(img);
            }
            
            this.showState('cardView');
            setTimeout(() => elements.cardView.classList.add('is-visible'), 10);
            
            if (card.youtubeVideoId) {
                youtube.initPlayer(card);
            }
            
            if (!state.particleSystem && document.getElementById('particle-canvas')) {
                state.particleSystem = new ParticleSystem('particle-canvas');
                if (state.particleSystem.canvas) state.particleSystem.start();
            }
        }
    };
    
    // --- 4. Módulo do YouTube ---
    const youtube = {
        initPlayer(card) {
            if (!state.isYouTubeApiReady) {
                console.log("YouTube API não está pronta. Player será iniciado quando estiver.");
                return; // A função onYouTubeApiReady vai chamar isso de novo.
            }
            if (!elements.videoContainer) return;

            const videoWrapper = document.createElement('div');
            videoWrapper.className = 'video-player-wrapper';
            elements.videoContainer.innerHTML = '';
            elements.videoContainer.appendChild(videoWrapper);

            state.youtubePlayer = new YT.Player(videoWrapper, {
                videoId: card.youtubeVideoId,
                playerVars: { autoplay: 1, mute: 1, loop: 1, playlist: card.youtubeVideoId, controls: 0, modestbranding: 1, rel: 0, origin: window.location.origin },
                events: {
                    onReady: (event) => { ui.createUnmuteButton(event.target, elements.videoContainer); },
                    onError: (err) => { console.error("Erro no Player do YouTube:", err); if (elements.videoContainer) elements.videoContainer.innerHTML = '<p class="youtube-error">Não foi possível carregar este vídeo.</p>'; }
                }
            });
        }
    };
    
    // --- 5. Lógica Principal e Eventos ---
    const init = async () => {
        const cardId = new URLSearchParams(window.location.search).get('id');
        if (!cardId) {
            ui.showError('O link do cartão parece estar incorreto. Nenhum ID foi encontrado.');
            return;
        }

        ui.showState('loading');
        try {
            state.cardData = await api.fetchCard(cardId);
            ui.prepareUnveiling(state.cardData.de);
        } catch (error) {
            console.error('Falha ao inicializar o cartão:', error);
            ui.showError(error.message);
        }
    };

    const bindEvents = () => {
        if (elements.openCardBtn) {
            elements.openCardBtn.addEventListener('click', () => ui.revealCard(), { once: true });
        }
    };
    
    // Função a ser chamada pela API do YouTube quando estiver pronta
    const onYouTubeApiReady = () => {
        console.log('API do YouTube pronta (detectada pelo módulo).');
        state.isYouTubeApiReady = true;
        // Se o cartão já foi revelado e tem um vídeo, tenta iniciar o player agora.
        if (state.cardData && state.cardData.youtubeVideoId && elements.cardView.classList.contains('is-visible')) {
            youtube.initPlayer(state.cardData);
        }
    };

    // --- 6. Ponto de Entrada do Módulo ---
    return { init, bindEvents, onYouTubeApiReady };
})();

// --- Ponto de Entrada Global ---
document.addEventListener('DOMContentLoaded', () => {
    CardViewerApp.init();
    CardViewerApp.bindEvents();
});

function onYouTubeIframeAPIReady() {
    CardViewerApp.onYouTubeApiReady();
}