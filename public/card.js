document.addEventListener('DOMContentLoaded', () => {

    const IS_LOCAL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const API_URL = IS_LOCAL 
        ? 'http://localhost:3001/api' 
        : 'https://messagelove-backend.onrender.com/api';

    // --- Seletores dos Elementos do DOM ---
    const envelopeEl = document.getElementById('envelope');
    const loadingStateEl = document.getElementById('loading-state');
    const errorStateEl = document.getElementById('error-state');
    const cardViewEl = document.getElementById('card-view');

    const nomeEl = document.getElementById('card-nome');
    const dataEl = document.getElementById('card-data');
    const mensagemEl = document.getElementById('card-mensagem');
    const fotoContainerEl = document.getElementById('card-foto-container');
    const videoContainerEl = document.getElementById('card-video-container');

    // --- Funções Principais ---

    /**
     * Busca os dados de um cartão específico na API.
     * @param {string} id - O ID do cartão.
     * @returns {Promise<object|null>} Os dados do cartão ou null em caso de erro.
     */
    const fetchCardData = async (id) => {
        try {
            const response = await fetch(`${API_URL}/card/${id}`);
            if (!response.ok) throw new Error(`Cartão não encontrado (Status: ${response.status})`);
            return await response.json();
        } catch (error) {
            console.error("Erro ao buscar dados do cartão:", error);
            return null;
        }
    };

    /**
     * Formata a data para um formato mais legível e amigável.
     * @param {string} dateString - A data no formato ISO (YYYY-MM-DD).
     * @returns {string} A data formatada.
     */
    const formatSpecialDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR', {
            day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC'
        });
    };

    /**
     * Preenche o cartão com os dados da API.
     * @param {object} card - O objeto do cartão.
     */
    const renderCard = (card) => {
        document.title = `Uma mensagem para ${card.nome}`;
        nomeEl.textContent = card.nome; // Alterado para não ter o "Para:", fica mais limpo no design
        mensagemEl.textContent = card.mensagem;
        dataEl.textContent = formatSpecialDate(card.data);

        // Limpa containers para evitar duplicatas em re-renderizações (boa prática)
        fotoContainerEl.innerHTML = '';
        videoContainerEl.innerHTML = '';

        if (card.fotoUrl) {
            const img = document.createElement('img');
            img.src = card.fotoUrl;
            img.alt = `Foto para ${card.nome}`;
            fotoContainerEl.appendChild(img);
        }

        if (card.youtubeVideoId) {
            const iframe = document.createElement('iframe');
            iframe.src = `https://www.youtube-nocookie.com/embed/${card.youtubeVideoId}?autoplay=1&mute=1&loop=1&playlist=${card.youtubeVideoId}&controls=0`;
            iframe.title = "Player de vídeo do YouTube";
            iframe.frameborder = "0";
            iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
            iframe.allowfullscreen = true;
            videoContainerEl.appendChild(iframe);
        }
    };

    /**
     * Cria e dispara o efeito de chuva de emojis na tela.
     */
    const triggerEmojiRain = () => {
        const emojiContainer = document.createElement('div');
        emojiContainer.className = 'emoji-rain-container';
        document.body.appendChild(emojiContainer);

        const emojis = ['❤️', '💖', '✨', '🎉', '💕', '⭐', '🥰', '😍'];
        const amount = 50;

        for (let i = 0; i < amount; i++) {
            const emojiSpan = document.createElement('span');
            emojiSpan.className = 'emoji';
            emojiSpan.textContent = emojis[Math.floor(Math.random() * emojis.length)];
            emojiSpan.style.left = `${Math.random() * 100}vw`;
            emojiSpan.style.fontSize = `${Math.random() * 1.5 + 0.8}rem`;
            emojiSpan.style.animationDuration = `${Math.random() * 4 + 3}s`;
            emojiSpan.style.animationDelay = `${Math.random() * 5}s`;
            emojiContainer.appendChild(emojiSpan);
        }
    };

    /**
     * Orquestra a busca de dados e a exibição da página.
     */
    const showCard = async () => {
        const params = new URLSearchParams(window.location.search);
        const cardId = params.get('id');

        if (!cardId) {
            loadingStateEl.classList.add('hidden');
            errorStateEl.classList.remove('hidden');
            return;
        }

        const cardData = await fetchCardData(cardId);
        
        loadingStateEl.classList.add('hidden');

        if (!cardData) {
            errorStateEl.classList.remove('hidden');
        } else {
            renderCard(cardData);
            cardViewEl.classList.remove('hidden'); // Revela o cartão, disparando as animações CSS
            triggerEmojiRain();
        }
    };

    /**
     * Função que inicia todo o processo ao clicar no envelope.
     */
    const openEnvelope = () => {
        envelopeEl.classList.add('opened');
        
        // Esconde o envelope e mostra o loader
        setTimeout(() => {
            envelopeEl.style.display = 'none';
            loadingStateEl.classList.remove('hidden');
            
            // Inicia a busca pelos dados do cartão
            showCard();
        }, 500); // Sincronizado com a animação de 'opened'
    };

    // --- Partículas de Fundo (mantido do design anterior) ---
    const initParticles = () => {
        const canvas = document.getElementById('particles-js');
        if (!canvas) return; // Não quebra se o canvas não existir
        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        let particlesArray = [];

        class Particle { /* ... (código das partículas omitido por brevidade, é o mesmo da resposta anterior) ... */ }
        function createParticles() { /* ... */ }
        function animateParticles() { /* ... */ }

        // Código completo da partícula para copiar e colar
        class Particle {
            constructor(x, y, dX, dY, s, c) { this.x=x; this.y=y; this.directionX=dX; this.directionY=dY; this.size=s; this.color=c; }
            draw() { ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI*2, false); ctx.fillStyle = 'rgba(247, 178, 103, 0.5)'; ctx.fill(); }
            update() { if (this.x > canvas.width || this.x < 0) this.directionX = -this.directionX; if (this.y > canvas.height || this.y < 0) this.directionY = -this.directionY; this.x += this.directionX; this.y += this.directionY; this.draw(); }
        }
        function createParticles() {
            particlesArray = []; let num = (canvas.height * canvas.width) / 9000;
            for (let i = 0; i < num; i++) {
                let s = (Math.random() * 2) + 1; let x = (Math.random() * ((innerWidth - s*2) - (s*2)) + s*2); let y = (Math.random() * ((innerHeight - s*2) - (s*2)) + s*2);
                let dX = (Math.random() * .4) - .2; let dY = (Math.random() * .4) - .2;
                particlesArray.push(new Particle(x, y, dX, dY, s));
            }
        }
        function animateParticles() { requestAnimationFrame(animateParticles); ctx.clearRect(0, 0, innerWidth, innerHeight); for (let p of particlesArray) p.update(); }
        
        createParticles(); animateParticles();
        window.addEventListener('resize', () => { canvas.width = innerWidth; canvas.height = innerHeight; createParticles(); });
    };

    // Inicia as partículas e adiciona o gatilho principal
    initParticles();
    envelopeEl.addEventListener('click', openEnvelope);
});