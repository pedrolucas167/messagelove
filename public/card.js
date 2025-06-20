/**
 * @file card.js
 * @description Script para carregar e exibir um cartão personalizado. Utiliza Canvas para um sistema de partículas de emoji e gerencia a visualização do cartão.
 * @author Pedro Marques
 * @version 2.1.0 (Fixes for Particles & YouTube Player)
 */

class ParticleSystem {
    constructor(canvasId, emojis = ['❤️', '💖', '✨', '🎉', '💕', '⭐', '🥰']) {
        this.canvas = document.getElementById(canvasId);
        // A verificação já existe no construtor, o que é ótimo.
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

    resizeCanvas() {
        if (!this.canvas) return;
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    createParticles(amount = 100) {
        if (!this.canvas) return;
        this.particles = []; // Limpa partículas existentes ao criar novas
        for (let i = 0; i < amount; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: this.canvas.height + Math.random() * 100,
                vx: (Math.random() - 0.5) * 1,
                vy: -Math.random() * 1.5 - 0.5,
                opacity: Math.random() * 0.5 + 0.5,
                emoji: this.emojis[Math.floor(Math.random() * this.emojis.length)],
                size: Math.random() * 20 + 15,
                rotation: Math.random() * 360,
                rotationSpeed: (Math.random() - 0.5) * 2,
            });
        }
    }

    updateAndDraw() {
        if (!this.ctx) return;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.rotation += p.rotationSpeed;

            if (p.y < -p.size) {
                p.y = this.canvas.height + p.size;
                p.x = Math.random() * this.canvas.width;
            }

            this.ctx.save();
            this.ctx.globalAlpha = p.opacity;
            this.ctx.font = `${p.size}px Arial`;
            this.ctx.translate(p.x, p.y);
            this.ctx.rotate(p.rotation * Math.PI / 180);
            this.ctx.fillText(p.emoji, -p.size / 2, p.size / 2);
            this.ctx.restore();
        });

        requestAnimationFrame(() => this.updateAndDraw());
    }

    start() {
        if (!this.canvas) return;
        this.createParticles();
        this.updateAndDraw();
    }
}


// --- Módulo de Visualização de Cartão ---
const CardViewerApp = (() => {
    // 1. Configuração e Estado
    const config = {
        IS_LOCAL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1',
        get API_URL() {
            return this.IS_LOCAL ? 'http://localhost:3001/api' : 'https://messagelove-backend.onrender.com/api';
        }
    };

    let state = {
        cardData: null,
        youtubePlayer: null,
        particleSystem: null,
    };

    // 2. Seletores do DOM
    const elements = {
        loading: document.getElementById('loading-state'),
        error: document.getElementById('error-state'),
        cardView: document.getElementById('card-view'),
        nome: document.getElementById('card-nome'),
        data: document.getElementById('card-data'),
        mensagem: document.getElementById('card-mensagem'),
        fotoContainer: document.getElementById('card-foto-container'),
        videoContainer: document.getElementById('card-video-container'),
    };

    // 3. Lógica da API
    const api = {
        async fetchCard(id) {
            const url = `${config.API_URL}/cards/${id}`;
            console.log('Buscando cartão:', url);
            const response = await fetch(url);
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Cartão não encontrado (Status: ${response.status}). Detalhes: ${errorText}`);
            }
            return await response.json();
        }
    };

    // 4. Lógica de UI (Renderização)
    const ui = {
        showLoading() { /* ... código sem alterações ... */ },
        showError(message) { /* ... código sem alterações ... */ },
        formatDate(dateString) { /* ... código sem alterações ... */ },
        createUnmuteButton(player, container) { /* ... código sem alterações ... */ },

        // CORRIGIDO: Lógica de partículas agora é mais segura
        renderCard(card) {
            state.cardData = card;
            document.title = `Uma mensagem para ${card.para}`;
            elements.nome.textContent = card.para;
            elements.mensagem.textContent = card.mensagem;
            if (elements.data) elements.data.textContent = this.formatDate(card.data);

            if (elements.fotoContainer && card.fotoUrl) { // usa fotoUrl
                elements.fotoContainer.innerHTML = `<img src="${card.fotoUrl}" alt="Foto para ${card.para}" class="card-image"/>`;
            }

            if (elements.videoContainer && card.youtubeVideoId) {
                youtube.initPlayer(card);
            }
            
            elements.cardView.classList.add('is-visible');
            
            // CORREÇÃO: Inicia o sistema de partículas apenas se o canvas existir.
            if (!state.particleSystem && document.getElementById('particle-canvas')) {
                state.particleSystem = new ParticleSystem('particle-canvas');
                if (state.particleSystem.canvas) { // Dupla verificação
                    state.particleSystem.start();
                }
            }
        }
    };
    Object.assign(ui, { showLoading() { if(elements.loading) elements.loading.classList.remove('hidden'); if(elements.error) elements.error.classList.add('hidden'); }, showError(message) { if(elements.loading) elements.loading.classList.add('hidden'); if (elements.error) { elements.error.textContent = `Erro: ${message}`; elements.error.classList.remove('hidden'); } }, formatDate(dateString) { if (!dateString) return ''; const date = new Date(dateString); return new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(date); }, createUnmuteButton(player, container) { const button = document.createElement('button'); button.className = 'unmute-button'; button.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9"x2="23" y2="15"></line></svg> <span>Ativar Som</span>`; button.addEventListener('click', () => { player.unMute(); button.style.display = 'none'; }); container.appendChild(button); setTimeout(() => button.classList.add('visible'), 1000); } });
    
    // 5. Lógica do YouTube (CORRIGIDO)
    const youtube = {
        initPlayer(card) {
            if (typeof YT === 'undefined' || typeof YT.Player === 'undefined') {
                console.warn('API do YouTube ainda não disponível. Renderização do player adiada.');
                return;
            }
            
            const videoPlayerDiv = document.createElement('div');
            const videoWrapper = document.createElement('div');
            videoWrapper.className = 'video-player-wrapper';
            videoWrapper.appendChild(videoPlayerDiv);
            elements.videoContainer.innerHTML = '';
            elements.videoContainer.appendChild(videoWrapper);

            state.youtubePlayer = new YT.Player(videoPlayerDiv, {
                videoId: card.youtubeVideoId,
                playerVars: {
                    autoplay: 1,
                    mute: 1,
                    loop: 1,
                    playlist: card.youtubeVideoId,
                    controls: 0,
                    modestbranding: 1,
                    rel: 0,
                    // REMOVIDO: youtubeStartTime para consistência com as outras partes do app
                    origin: window.location.origin // CORREÇÃO: Adiciona a origem para evitar erros de postMessage
                },
                events: {
                    onReady: (event) => {
                        console.log('Player pronto.');
                        ui.createUnmuteButton(event.target, videoWrapper);
                    },
                    onError: (err) => {
                        console.error("Erro no Player do YouTube:", err);
                        elements.videoContainer.innerHTML = '<p class="youtube-error">Não foi possível carregar o vídeo.</p>';
                    }
                }
            });
        }
    };
    
    // 6. Ponto de Entrada
    const init = async () => {
        const cardId = new URLSearchParams(window.location.search).get('id');

        if (!cardId) {
            ui.showError('O link do cartão parece estar incorreto. Nenhum ID foi encontrado.');
            return;
        }

        try {
            ui.showLoading();
            const cardData = await api.fetchCard(cardId);
            state.cardData = cardData; 
            
            if (typeof YT !== 'undefined' && YT.Player) {
                 ui.renderCard(cardData);
            }
        } catch (error) {
            console.error('Falha ao inicializar o cartão:', error);
            ui.showError(error.message);
        } finally {
             if(elements.loading) elements.loading.classList.add('hidden');
        }
    };

    const onYouTubeApiReady = () => {
        console.log('API do YouTube pronta (detectada pelo módulo).');
        if (state.cardData) {
            ui.renderCard(state.cardData);
        }
    };
    
    return {
        init,
        onYouTubeApiReady
    };
})();

// --- Ponto de Entrada Global ---
document.addEventListener('DOMContentLoaded', CardViewerApp.init);


function onYouTubeIframeAPIReady() {
    CardViewerApp.onYouTubeApiReady();
}