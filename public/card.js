/**
 * @file card.js
 * @description Script para carregar e exibir um cartão personalizado.
 * @author Pedro Marques
 * @version 3.0.0 (Final Version)
 */

// --- Classe para o Sistema de Partículas com Canvas ---
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
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
    }
    resizeCanvas() { if (!this.canvas) return; this.canvas.width = window.innerWidth; this.canvas.height = window.innerHeight; }
    createParticles(amount = 100) { if (!this.canvas) return; this.particles = []; for (let i = 0; i < amount; i++) { this.particles.push({ x: Math.random() * this.canvas.width, y: this.canvas.height + Math.random() * 100, vx: (Math.random() - 0.5) * 1, vy: -Math.random() * 1.5 - 0.5, opacity: Math.random() * 0.5 + 0.5, emoji: this.emojis[Math.floor(Math.random() * this.emojis.length)], size: Math.random() * 20 + 15, rotation: Math.random() * 360, rotationSpeed: (Math.random() - 0.5) * 2, }); } }
    updateAndDraw() { if (!this.ctx) return; this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height); this.particles.forEach(p => { p.x += p.vx; p.y += p.vy; p.rotation += p.rotationSpeed; if (p.y < -p.size) { p.y = this.canvas.height + p.size; p.x = Math.random() * this.canvas.width; } this.ctx.save(); this.ctx.globalAlpha = p.opacity; this.ctx.font = `${p.size}px Arial`; this.ctx.translate(p.x, p.y); this.ctx.rotate(p.rotation * Math.PI / 180); this.ctx.fillText(p.emoji, -p.size / 2, p.size / 2); this.ctx.restore(); }); requestAnimationFrame(() => this.updateAndDraw()); }
    start() { if (!this.canvas) return; this.createParticles(); this.updateAndDraw(); }
}

// --- Módulo de Visualização de Cartão ---
const CardViewerApp = (() => {
    const config = {
        IS_LOCAL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1',
        get API_URL() { return this.IS_LOCAL ? 'http://localhost:3001/api' : 'https://messagelove-backend.onrender.com/api'; }
    };
    let state = { cardData: null, youtubePlayer: null, particleSystem: null };

    // CORRIGIDO: Adicionado o seletor para #card-de
    const elements = {
        loading: document.getElementById('loading-state'),
        error: document.getElementById('error-state'),
        cardView: document.getElementById('card-view'),
        nome: document.getElementById('card-nome'),
        de: document.getElementById('card-de'), // NOVO
        data: document.getElementById('card-data'),
        mensagem: document.getElementById('card-mensagem'),
        fotoContainer: document.getElementById('card-foto-container'),
        videoContainer: document.getElementById('card-video-container'),
    };

    const api = {
        async fetchCard(id) { /* ...código sem alterações... */ }
    };
    Object.assign(api, { async fetchCard(id) { const url = `${config.API_URL}/cards/${id}`; console.log('Buscando cartão:', url); const response = await fetch(url); if (!response.ok) { const errorText = await response.text(); throw new Error(`Cartão não encontrado (Status: ${response.status}).`); } return await response.json(); }});

    const ui = {
        showState(stateToShow) {
            ['loading', 'error', 'cardView'].forEach(s => {
                if (elements[s]) elements[s].classList.add('hidden');
            });
            if (elements[stateToShow]) elements[stateToShow].classList.remove('hidden');
        },
        showError(message) { this.showState('error'); if (elements.error) elements.error.querySelector('p').textContent = message; },
        formatDate(dateString) { if (!dateString) return ''; const date = new Date(dateString); return new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(date); },
        createUnmuteButton(player, container) { /* ...código sem alterações... */ },
        // CORRIGIDO: Preenche todos os campos, incluindo o #card-de
        renderCard(card) {
            state.cardData = card;
            document.title = `Uma mensagem de ${card.de} para ${card.para}`;

            if (elements.nome) elements.nome.textContent = card.para;
            if (elements.de) elements.de.textContent = card.de; // PREENCHE O REMETENTE
            if (elements.mensagem) elements.mensagem.textContent = card.mensagem;
            if (elements.data) elements.data.textContent = this.formatDate(card.data);

            if (elements.fotoContainer && card.fotoUrl) {
                elements.fotoContainer.innerHTML = `<img src="${card.fotoUrl}" alt="Foto para ${card.para}" class="card-image"/>`;
            } else {
                elements.fotoContainer.innerHTML = ''; // Limpa se não houver foto
            }

            if (elements.videoContainer && card.youtubeVideoId) {
                youtube.initPlayer(card);
            }
            
            this.showState('cardView');
            elements.cardView.classList.add('is-visible');
            
            if (!state.particleSystem && document.getElementById('particle-canvas')) {
                state.particleSystem = new ParticleSystem('particle-canvas');
                if (state.particleSystem.canvas) state.particleSystem.start();
            }
        }
    };
    Object.assign(ui, { createUnmuteButton(player, container) { const button = document.createElement('button'); button.className = 'unmute-button'; button.innerHTML = `<svg viewbox="0 0 24 24"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9"x2="23" y2="15"></line></svg> <span>Ativar Som</span>`; button.addEventListener('click', () => { player.unMute(); button.remove(); }); container.appendChild(button); setTimeout(() => button.classList.add('visible'), 1000); } });
    
    const youtube = {
        initPlayer(card) {
            if (!elements.videoContainer) return;
            const videoPlayerDiv = document.createElement('div');
            const videoWrapper = document.createElement('div');
            videoWrapper.className = 'video-player-wrapper';
            videoWrapper.appendChild(videoPlayerDiv);
            elements.videoContainer.innerHTML = '';
            elements.videoContainer.appendChild(videoWrapper);

            state.youtubePlayer = new YT.Player(videoPlayerDiv, {
                videoId: card.youtubeVideoId,
                playerVars: {
                    autoplay: 1, mute: 1, loop: 1, playlist: card.youtubeVideoId,
                    controls: 0, modestbranding: 1, rel: 0,
                    origin: window.location.origin
                },
                events: {
                    onReady: (event) => { console.log('Player pronto.'); ui.createUnmuteButton(event.target, videoWrapper); },
                    onError: (err) => { console.error("Erro no Player do YouTube:", err); if (elements.videoContainer) elements.videoContainer.innerHTML = ''; }
                }
            });
        }
    };
    
    const init = async () => {
        const cardId = new URLSearchParams(window.location.search).get('id');
        if (!cardId) {
            ui.showError('O link do cartão parece estar incorreto. Nenhum ID foi encontrado.');
            return;
        }

        try {
            ui.showState('loading');
            const cardData = await api.fetchCard(cardId);
            state.cardData = cardData;
            
            // Lógica para esperar a API do YT se necessário
            if (typeof YT === 'undefined' || typeof YT.Player === 'undefined') {
                console.log("Aguardando API do YouTube...");
                // onYouTubeApiReady irá chamar renderCard quando estiver pronta
            } else {
                ui.renderCard(cardData); // Se já estiver pronta, renderiza agora
            }
        } catch (error) {
            console.error('Falha ao inicializar o cartão:', error);
            ui.showError(error.message);
        }
    };

    const onYouTubeApiReady = () => {
        console.log('API do YouTube pronta (detectada pelo módulo).');
        if (state.cardData && !elements.cardView.classList.contains('is-visible')) {
            ui.renderCard(state.cardData);
        }
    };
    
    return { init, onYouTubeApiReady };
})();

document.addEventListener('DOMContentLoaded', CardViewerApp.init);

function onYouTubeIframeAPIReady() {
    CardViewerApp.onYouTubeApiReady();
}