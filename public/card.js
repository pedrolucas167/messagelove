/**
 * @file card.js
 * @description Script para carregar e exibir um cartão personalizado com uma experiência de "revelação".
 * @author Pedro Marques
 * @version 4.0.0 (The Unveiling Experience)
 */

class ParticleSystem { /* ...código da classe de partículas continua igual... */ }

const CardViewerApp = (() => {
    const config = {
        IS_LOCAL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1',
        get API_URL() { return this.IS_LOCAL ? 'http://localhost:3001/api' : 'https://messagelove-backend.onrender.com/api'; }
    };
    let state = { cardData: null, youtubePlayer: null, particleSystem: null };

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

    const api = {
        async fetchCard(id) { const url = `${config.API_URL}/cards/${id}`; const response = await fetch(url); if (!response.ok) throw new Error('Cartão não encontrado.'); return await response.json(); }
    };

    const ui = {
        showError(message) { if(elements.loading) elements.loading.hidden = true; if(elements.error) { elements.error.querySelector('p').textContent = message; elements.error.hidden = false; } },
        formatDate(dateString) { if (!dateString) return ''; const date = new Date(dateString); return new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(date); },
        createUnmuteButton(player, container) { const button = document.createElement('button'); button.className = 'unmute-button'; button.innerHTML = `<svg viewbox="0 0 24 24"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9"x2="23" y2="15"></line></svg> <span>Aumente o som</span>`; button.addEventListener('click', () => { player.unMute(); button.classList.add('fading-out'); }); container.appendChild(button); setTimeout(() => button.classList.add('visible'), 1500); },
        
        prepareUnveiling(senderName) {
            if (elements.loading) elements.loading.hidden = true;
            if (elements.unveilingSenderName) elements.unveilingSenderName.textContent = senderName;
            if (elements.unveilingScreen) elements.unveilingScreen.classList.add('visible');
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
            
            if (elements.fotoContainer && card.fotoUrl) {
                elements.fotoContainer.innerHTML = `<img src="${card.fotoUrl}" alt="Foto para ${card.para}" class="card-image"/>`;
            }
            if (elements.videoContainer && card.youtubeVideoId) {
                youtube.initPlayer(card);
            }
            
            elements.cardView.classList.add('is-visible');
            
            if (!state.particleSystem && document.getElementById('particle-canvas')) {
                state.particleSystem = new ParticleSystem('particle-canvas');
                if (state.particleSystem.canvas) state.particleSystem.start();
            }
        }
    };
    
    const youtube = {
        initPlayer(card) {
            const videoWrapper = document.createElement('div');
            videoWrapper.className = 'video-player-wrapper';
            elements.videoContainer.innerHTML = '';
            elements.videoContainer.appendChild(videoWrapper);

            state.youtubePlayer = new YT.Player(videoWrapper, {
                videoId: card.youtubeVideoId,
                playerVars: { autoplay: 1, mute: 1, loop: 1, playlist: card.youtubeVideoId, controls: 0, modestbranding: 1, rel: 0, origin: window.location.origin },
                events: {
                    onReady: (event) => { ui.createUnmuteButton(event.target, elements.videoContainer); },
                    onError: () => { if (elements.videoContainer) elements.videoContainer.innerHTML = ''; }
                }
            });
        }
    };
    
    const init = async () => {
        const cardId = new URLSearchParams(window.location.search).get('id');
        if (!cardId) {
            ui.showError('Link inválido.');
            return;
        }
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
    
    return { init, bindEvents };
})();

// A API do YouTube agora é carregada de forma assíncrona
// Não precisamos mais do onYouTubeIframeAPIReady, pois o player é criado quando o cartão é revelado.
// A verificação `typeof YT` se torna implícita, já que o usuário só pode clicar após o carregamento da página.

document.addEventListener('DOMContentLoaded', () => {
    CardViewerApp.init();
    CardViewerApp.bindEvents();
});