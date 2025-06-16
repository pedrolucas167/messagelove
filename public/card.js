/**
 * @file card.js
 * @description Script para carregar e exibir um cartão personalizado com arquitetura modular.
 * @author Pedro Marques
 * @version 6.2.0
 */

// Módulo principal do aplicativo do Cartão
const CardApp = {
    // --- 1. CONFIGURAÇÕES E ESTADO INICIAL ---
    config: {
        apiUrl: (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
            ? 'http://localhost:3001/api'
            : 'https://messagelove-backend.onrender.com/api',
    },

    elements: {}, // Cache de elementos do DOM
    
    // --- 2. MÓDULO DE GERENCIAMENTO DE ESTADO ---
    StateManager: {
        managerEl: null,
        setState(state) {
            if (this.managerEl) {
                this.managerEl.dataset.state = state;
            }
        },
        init(managerElement) {
            this.managerEl = managerElement;
            if (!this.managerEl) {
                console.error("Gerenciador de estado (#card-state-manager) não encontrado.");
                return false;
            }
            return true;
        }
    },

    // --- 3. MÓDULO DE EFEITOS ESPECIAIS ---
    Effects: {
        synth: null,
        initAudio() {
            if (window.Tone) {
                this.synth = new Tone.PolySynth(Tone.Synth, {
                    oscillator: { type: 'sine' },
                    envelope: { attack: 0.005, decay: 0.1, sustain: 0.3, release: 1 },
                }).toDestination();
            }
        },
        playSound(note = 'C5') {
            if (!this.synth) return;
            if (Tone.context.state !== 'running') {
                Tone.context.resume().catch(e => console.error("Áudio:", e));
            }
            const now = Tone.now();
            this.synth.triggerAttackRelease([note, Tone.Frequency(note).transpose(4)], '8n', now);
        },
        triggerEmojiRain() {
            if (document.querySelector('.emoji-rain-container')) return;
            const container = document.createElement('div');
            container.className = 'emoji-rain-container';
            document.body.appendChild(container);
            const emojis = ['❤️', '💖', '✨', '🎉', '💕'];
            for (let i = 0; i < 50; i++) {
                const emojiEl = document.createElement('span');
                emojiEl.className = 'emoji';
                emojiEl.textContent = emojis[Math.floor(Math.random() * emojis.length)];
                Object.assign(emojiEl.style, {
                    left: `${Math.random() * 100}vw`,
                    fontSize: `${Math.random() * 1.5 + 0.8}rem`,
                    animationDuration: `${Math.random() * 4 + 4}s`,
                    animationDelay: `${Math.random() * 5}s`,
                });
                container.appendChild(emojiEl);
            }
            setTimeout(() => container.remove(), 10000);
        },
        triggerFullscreenReveal() {
            if (CardApp.elements.revealOverlay) {
                CardApp.elements.revealOverlay.classList.add('active');
                this.playSound('C4');
            }
        },
    },

    // --- 4. MÓDULO DE MANIPULAÇÃO DA UI ---
    UI: {
        render(card) {
            // CORREÇÃO: Adicionada verificação para garantir que 'card' é um objeto válido.
            if (!card || typeof card !== 'object') {
                throw new Error("Os dados recebidos do cartão são inválidos.");
            }

            document.title = `Uma mensagem para ${card.para || 'Você'}`;
            this.setText('nome', card.para || 'Pessoa Especial');
            this.setText('mensagem', card.mensagem || 'Uma mensagem especial para você.');

            // CORREÇÃO: A lógica de exibição da mídia foi movida para dentro de renderMedia
            this.renderMedia('fotoContainer', card.fotoUrl, 'image', card.para);
            this.renderMedia('videoContainer', card.youtubeVideoId, 'youtube');
        },
        setText(elementKey, text) {
            if (CardApp.elements[elementKey]) {
                CardApp.elements[elementKey].textContent = text;
            }
        },
        renderMedia(containerKey, data, type, altText = '') {
            const container = CardApp.elements[containerKey];
            if (!container) return;

            // Esconde o container por padrão e só mostra se houver dados
            container.style.display = 'none';
            container.innerHTML = '';

            if (!data) return; // Se não houver dados, o container permanece escondido.

            container.style.display = ''; // Garante que o container esteja visível
            let mediaElement;

            if (type === 'image') {
                mediaElement = new Image();
                mediaElement.src = data;
                mediaElement.alt = `Foto para ${altText}`;
                mediaElement.className = 'card-image';
            } else if (type === 'youtube') {
                const videoSrc = `https://www.youtube.com/embed/${data}?autoplay=1&mute=1&loop=1&playlist=${data}&controls=0&rel=0`;
                mediaElement = document.createElement('div');
                mediaElement.className = 'video-frame';
                mediaElement.innerHTML = `<div class="video-player-wrapper"><iframe src="${videoSrc}" title="Vídeo do YouTube" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe></div>`;
            }

            const showMedia = () => {
                container.appendChild(mediaElement);
            };
            
            if (type === 'image') {
                mediaElement.onload = showMedia;
                mediaElement.onerror = () => console.error('Erro ao carregar a imagem. Verifique as permissões e CORS do bucket S3.');
            } else {
                showMedia();
            }
        }
    },

    // --- 5. MÓDULO DA API ---
    API: {
        async fetchCard(id) {
            try {
                const response = await fetch(`${CardApp.config.apiUrl}/cards/${id}`);
                if (!response.ok) {
                    throw new Error(response.status === 404 ? 'Cartão não encontrado.' : 'Erro no servidor.');
                }
                return await response.json();
            } catch (error) {
                console.error('Falha na API:', error);
                throw new Error('Falha de conexão com o servidor.');
            }
        }
    },

    // --- 6. FLUXO PRINCIPAL E INICIALIZAÇÃO ---
    async loadCard() {
        CardApp.StateManager.setState('loading');
        try {
            const cardId = new URLSearchParams(window.location.search).get('id');
            if (!cardId) throw new Error('O link está incompleto.');

            const cardData = await CardApp.API.fetchCard(cardId);
            CardApp.UI.render(cardData);
            
            CardApp.StateManager.setState('card-content');
            CardApp.Effects.playSound('E5');
            CardApp.Effects.triggerEmojiRain();

        } catch (error) {
            console.error('Não foi possível carregar o cartão:', error);
            if (CardApp.elements.errorText) CardApp.elements.errorText.textContent = error.message;
            CardApp.StateManager.setState('error');
        }
    },

    bindEvents() {
        this.elements.revealBtn?.addEventListener('click', () => {
            this.Effects.triggerFullscreenReveal();
            setTimeout(() => this.loadCard(), 500);
        }, { once: true });

        this.elements.likeBtn?.addEventListener('click', (e) => {
            e.currentTarget.classList.toggle('liked');
            this.Effects.playSound('G5');
            if (e.currentTarget.classList.contains('liked')) {
                this.Effects.triggerEmojiRain();
            }
        });
    },

    init() {
        this.elements = {
            stateManager: document.getElementById('card-state-manager'),
            revealBtn: document.getElementById('revealBtn'),
            revealOverlay: document.getElementById('reveal-overlay'),
            nome: document.getElementById('card-nome'),
            data: document.getElementById('card-data'),
            mensagem: document.getElementById('card-mensagem'),
            fotoContainer: document.getElementById('card-foto-container'),
            videoContainer: document.getElementById('card-video-container'),
            likeBtn: document.getElementById('likeBtn'),
            errorText: document.getElementById('error-text'),
        };

        if (!this.StateManager.init(this.elements.stateManager)) return;

        this.Effects.initAudio();
        this.bindEvents();

        console.log("Messagelove Card Viewer inicializado.");
    }
};

document.addEventListener('DOMContentLoaded', () => CardApp.init());
