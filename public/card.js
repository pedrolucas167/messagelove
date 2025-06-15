/**
 * @file card.js
 * @description Script para carregar e exibir um cartão personalizado com efeitos visuais e sonoros.
 * @author Pedro Marques
 * @version 3.0.1
 */

document.addEventListener('DOMContentLoaded', () => {

    // --- 1. CONFIGURAÇÕES E SELETORES ---
    const API_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
        ? 'http://localhost:3001/api'
        : 'https://messagelove-backend.onrender.com/api';

    const ELEMENTS = {
        loadingState: document.getElementById('loading-state'),
        errorState: document.getElementById('error-state'),
        cardView: document.getElementById('card-view'),
        nome: document.getElementById('card-nome'),
        data: document.getElementById('card-data'),
        mensagem: document.getElementById('card-mensagem'),
        fotoContainer: document.getElementById('card-foto-container'),
        videoContainer: document.getElementById('card-video-container'),
        errorText: document.getElementById('error-text'),
        likeBtn: document.getElementById('likeBtn'),
    };

    // --- 2. EFEITOS ESPECIAIS (ÁUDIO E ANIMAÇÕES) ---

    // Prepara o sintetizador de áudio para um efeito sonoro mágico
    const synth = window.Tone ? new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'sine' },
        envelope: { attack: 0.005, decay: 0.1, sustain: 0.3, release: 1 },
    }).toDestination() : null;

    const playSoundEffect = () => {
        if (!synth) return;
        // Garante que o contexto de áudio seja iniciado por um gesto do usuário
        if (Tone.context.state !== 'running') {
            Tone.context.resume();
        }
        const now = Tone.now();
        synth.triggerAttackRelease(['C5', 'E5', 'G5'], '8n', now);
        synth.triggerAttackRelease(['E5', 'G5', 'B5'], '8n', now + 0.2);
    };

    const triggerEmojiRain = () => {
        if (document.querySelector('.emoji-rain-container')) return; // Evita múltiplas chuvas
        const container = document.createElement('div');
        container.className = 'emoji-rain-container';
        
        // --- CORREÇÃO APLICADA AQUI ---
        // Força o contêiner de emojis a aparecer na frente de outros elementos.
        container.style.zIndex = '999';

        document.body.appendChild(container);
        
        const emojis = ['❤️', '💖', '✨', '🎉', '💕', '⭐', '🥰'];
        for (let i = 0; i < 50; i++) {
            const emojiEl = document.createElement('span');
            emojiEl.className = 'emoji';
            emojiEl.textContent = emojis[Math.floor(Math.random() * emojis.length)];
            emojiEl.style.left = `${Math.random() * 100}vw`;
            emojiEl.style.fontSize = `${Math.random() * 1.5 + 0.8}rem`;
            emojiEl.style.animationDuration = `${Math.random() * 4 + 4}s`;
            emojiEl.style.animationDelay = `${Math.random() * 5}s`;
            container.appendChild(emojiEl);
        }
        setTimeout(() => container.remove(), 10000);
    };
    
    // --- 3. LÓGICA DA API ---

    const fetchCardData = async (id) => {
        const response = await fetch(`${API_URL}/cards/${id}`);
        if (!response.ok) {
            const errorMsg = response.status === 404
                ? 'Este cartão não foi encontrado. Verifique o link.'
                : `Erro no servidor (Status: ${response.status})`;
            throw new Error(errorMsg);
        }
        return await response.json();
    };

    // --- 4. RENDERIZAÇÃO E UI ---

    const formatSpecialDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(`${dateString}T00:00:00`);
        return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
    };

    const renderCardContent = (card) => {
        document.title = `Uma mensagem para ${card.para || 'Você'}`;
        ELEMENTS.nome.textContent = card.para || 'Pessoa Especial';
        ELEMENTS.mensagem.textContent = card.mensagem || 'Uma mensagem especial para você.';

        if (card.data) {
            ELEMENTS.data.textContent = formatSpecialDate(card.data);
            ELEMENTS.data.hidden = false;
        }

        if (card.fotoUrl) {
            ELEMENTS.fotoContainer.innerHTML = `<img src="${card.fotoUrl}" alt="Foto para ${card.para}" class="card-image">`;
            ELEMENTS.fotoContainer.hidden = false;
        }

        if (card.youtubeVideoId) {
            const videoSrc = `https://www.youtube.com/embed/${card.youtubeVideoId}?autoplay=1&mute=1&loop=1&playlist=${card.youtubeVideoId}&controls=0&rel=0`;
            ELEMENTS.videoContainer.innerHTML = `
                <div class="video-frame">
                    <div class="video-player-wrapper">
                        <iframe src="${videoSrc}" title="Vídeo do YouTube" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>
                    </div>
                </div>`;
            ELEMENTS.videoContainer.hidden = false;
        }

        // Revela o cartão com animação
        ELEMENTS.cardView.classList.remove('hidden');
        setTimeout(() => {
            ELEMENTS.cardView.classList.add('visible');
            playSoundEffect();
            triggerEmojiRain();
        }, 100); // Pequeno delay para garantir a transição
    };

    // --- 5. FUNÇÃO PRINCIPAL (INICIALIZAÇÃO) ---

    const main = async () => {
        try {
            const cardId = new URLSearchParams(window.location.search).get('id');
            if (!cardId) {
                throw new Error('O link está incompleto. Não foi possível encontrar o ID do cartão.');
            }

            const cardData = await fetchCardData(cardId);
            renderCardContent(cardData);

        } catch (error) {
            console.error('Não foi possível carregar o cartão:', error);
            if (ELEMENTS.errorText) ELEMENTS.errorText.textContent = error.message;
            ELEMENTS.errorState.classList.remove('hidden');
            ELEMENTS.errorState.classList.add('visible');
        } finally {
            ELEMENTS.loadingState.classList.add('hidden');
        }
    };

    // --- 6. REGISTRO DE EVENTOS ---

    ELEMENTS.likeBtn?.addEventListener('click', (e) => {
        const btn = e.currentTarget;
        btn.classList.toggle('liked');
        playSoundEffect(); // Toca o som de novo ao curtir
        if (btn.classList.contains('liked')) {
            triggerEmojiRain(); // Lança mais emojis ao curtir
        }
    });

    // Inicia a aplicação
    main();
});