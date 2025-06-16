/**
 * @file card.js
 * @description Script para carregar e exibir um cartão personalizado com um fluxo de revelação.
 * @author Pedro Marques
 * @version 5.1.0
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

    const triggerEmojiRain = () => { /* ... (função sem alterações) ... */ };
    const triggerFullscreenReveal = () => { /* ... (função sem alterações) ... */ };
    
    // --- 3. LÓGICA DA API E RENDERIZAÇÃO ---

    const fetchCardData = async (id) => { /* ... (função sem alterações) ... */ };

    const renderCardContent = (card) => {
        document.title = `Uma mensagem para ${card.para || 'Você'}`;
        ELEMENTS.nome.textContent = card.para || 'Pessoa Especial';
        ELEMENTS.mensagem.textContent = card.mensagem || 'Uma mensagem especial para você.';
        
        // Garante que os containers comecem limpos e ocultos
        ELEMENTS.data.hidden = true;
        ELEMENTS.fotoContainer.hidden = true;
        ELEMENTS.videoContainer.hidden = true;
        
        if (card.data) {
            ELEMENTS.data.textContent = new Date(`${card.data}T00:00:00`).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', timeZone: 'UTC' });
            ELEMENTS.data.hidden = false;
        }

        // CORREÇÃO: Torna o contêiner visível se houver foto
        if (card.fotoUrl) {
            ELEMENTS.fotoContainer.innerHTML = `<img src="${card.fotoUrl}" alt="Foto para ${card.para}" class="card-image">`;
            ELEMENTS.fotoContainer.hidden = false;
        }

        // CORREÇÃO: Torna o contêiner visível se houver vídeo
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
