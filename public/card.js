/**
 * @file card.js
 * @description Script para carregar e exibir um cartão personalizado com um fluxo de revelação.
 * @author Pedro Marques
 * @version 5.3.0
 */

document.addEventListener('DOMContentLoaded', () => {

    // --- 1. CONFIGURAÇÕES E SELETORES ---
    const API_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
        ? 'http://localhost:3001/api'
        : 'https://messagelove-backend.onrender.com/api';

    const ELEMENTS = {
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

    // --- 2. EFEITOS ESPECIAIS (ÁUDIO E ANIMAÇÕES) ---

    const synth = window.Tone ? new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'sine' },
        envelope: { attack: 0.005, decay: 0.1, sustain: 0.3, release: 1 },
    }).toDestination() : null;

    const playSoundEffect = (note = 'C5') => {
        if (!synth) return;
        if (Tone.context.state !== 'running') {
            Tone.context.resume().catch(e => console.error("Erro ao iniciar o áudio:", e));
        }
        const now = Tone.now();
        synth.triggerAttackRelease([note, Tone.Frequency(note).transpose(4), Tone.Frequency(note).transpose(7)], '8n', now);
    };

    const triggerEmojiRain = () => {
        // Evita criar múltiplas "chuvas" de emojis ao mesmo tempo.
        if (document.querySelector('.emoji-rain-container')) return;
        
        const container = document.createElement('div');
        container.className = 'emoji-rain-container';
        document.body.appendChild(container);
        
        const EMOJIS = ['❤️', '💖', '✨', '🎉', '💕', '⭐', '🥰', '😍', '🥳'];
        const EMOJI_COUNT = 60;

        for (let i = 0; i < EMOJI_COUNT; i++) {
            const emojiEl = document.createElement('span');
            emojiEl.className = 'emoji';
            emojiEl.textContent = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];

            // Estilos para uma animação mais rica e variada
            emojiEl.style.left = `${Math.random() * 100}vw`;
            emojiEl.style.fontSize = `${Math.random() * 1.5 + 0.8}rem`; // Tamanhos variados
            emojiEl.style.animationDuration = `${Math.random() * 4 + 5}s`; // Duração entre 5s e 9s
            emojiEl.style.animationDelay = `${Math.random() * 4}s`; // Atraso de até 4s
            
            container.appendChild(emojiEl);
        }

        // Limpa o container da chuva de emojis após a animação para manter a performance.
        setTimeout(() => {
            if (container) {
                container.remove();
            }
        }, 10000); // Tempo suficiente para a animação mais longa terminar
    };
    
    const triggerFullscreenReveal = () => {
        if (!ELEMENTS.revealOverlay) return;
        ELEMENTS.revealOverlay.classList.add('active');
        playSoundEffect('C4');
    };
    
    // --- 3. LÓGICA DA API E RENDERIZAÇÃO ---

    const fetchCardData = async (id) => {
        const response = await fetch(`${API_URL}/cards/${id}`);
        if (!response.ok) {
            const errorMsg = response.status === 404 ? 'Este cartão não foi encontrado.' : `Erro no servidor (${response.status})`;
            throw new Error(errorMsg);
        }
        return await response.json();
    };

    const renderCardContent = (card) => {
        if (!card || typeof card !== 'object') {
            throw new Error("Os dados recebidos do cartão são inválidos.");
        }

        document.title = `Uma mensagem para ${card.para || 'Você'}`;
        
        // CORREÇÃO: Adicionado o rótulo "Para:" antes do nome.
        ELEMENTS.nome.innerHTML = `<span class="card-label">Para:</span> ${card.para || 'Pessoa Especial'}`;
        
        ELEMENTS.mensagem.textContent = card.mensagem || 'Uma mensagem especial para você.';
        
        ELEMENTS.data.hidden = true;
        ELEMENTS.fotoContainer.hidden = true;
        ELEMENTS.videoContainer.hidden = true;
        
        if (card.data) {
            ELEMENTS.data.textContent = new Date(`${card.data}T00:00:00`).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', timeZone: 'UTC' });
            ELEMENTS.data.hidden = false;
        }

        if (card.fotoUrl) {
            ELEMENTS.fotoContainer.innerHTML = `<img src="${card.fotoUrl}" alt="Foto para ${card.para}" class="card-image">`;
            ELEMENTS.fotoContainer.hidden = false;
        }

        if (card.youtubeVideoId) {
            const videoSrc = `https://www.youtube.com/embed/${card.youtubeVideoId}?autoplay=1&mute=1&loop=1&playlist=${card.youtubeVideoId}&controls=0&rel=0`;
            ELEMENTS.videoContainer.innerHTML = `<div class="video-frame"><div class="video-player-wrapper"><iframe src="${videoSrc}" title="Vídeo do YouTube" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe></div></div>`;
            ELEMENTS.videoContainer.hidden = false;
        }
    };

    // --- 4. FLUXO PRINCIPAL ---

    const loadCard = async () => {
        ELEMENTS.stateManager.dataset.state = 'loading';
        try {
            const cardId = new URLSearchParams(window.location.search).get('id');
            if (!cardId) throw new Error('O link está incompleto.');
            const cardData = await fetchCardData(cardId);
            renderCardContent(cardData);
            ELEMENTS.stateManager.dataset.state = 'card-content';
            playSoundEffect('E5');
            triggerEmojiRain();
        } catch (error) {
            console.error('Não foi possível carregar o cartão:', error);
            if (ELEMENTS.errorText) ELEMENTS.errorText.textContent = error.message;
            ELEMENTS.stateManager.dataset.state = 'error';
        }
    };

    // --- 5. INICIALIZAÇÃO E EVENTOS ---

    const init = () => {
        if (!ELEMENTS.stateManager) {
            console.error("Elemento #card-state-manager não encontrado.");
            return;
        }
        ELEMENTS.revealBtn?.addEventListener('click', () => {
            triggerFullscreenReveal();
            setTimeout(loadCard, 500);
        }, { once: true });
        ELEMENTS.likeBtn?.addEventListener('click', (e) => {
            e.currentTarget.classList.toggle('liked');
            playSoundEffect('G5');
            if (e.currentTarget.classList.contains('liked')) {
                triggerEmojiRain();
            }
        });
    };

    init();
});
