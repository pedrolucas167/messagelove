
const CardViewerApp = (() => {
    // 1. Configurações
    const config = {
        API_BASE_URL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
            ? 'http://localhost:3001/api/cards'
            : 'https://messagelove-backend.onrender.com/api/cards',
    };

    // 2. Seletores do DOM
    const elements = {
        unveilingScreen: document.getElementById('unveiling-screen'),
        loadingState: document.getElementById('loading-state'),
        unveilingContent: document.getElementById('unveiling-content'),
        unveilingSenderName: document.getElementById('unveiling-sender-name'),
        unveilingRecipientName: document.getElementById('unveiling-recipient-name'), // Novo elemento
        openCardBtn: document.getElementById('open-card-btn'),
        header: document.getElementById('card-page-header'),
        mainContent: document.getElementById('main-content'),
        footer: document.getElementById('card-page-footer'),
        card: {
            container: document.getElementById('card-view'),
            recipient: document.getElementById('card-nome'),
            date: document.getElementById('card-data'),
            message: document.getElementById('card-mensagem'),
            sender: document.getElementById('card-de'),
            photoContainer: document.getElementById('card-foto-container'),
            videoContainer: document.getElementById('card-video-container'),
        },
        errorState: document.getElementById('error-state'),
    };

    // 3. Módulo de UI
    const ui = {
        showLoadingState() {
            elements.loadingState.classList.remove('hidden');
            elements.unveilingContent.classList.add('hidden');
        },
        showUnveilingScreen(data) {
            elements.loadingState.classList.add('hidden');
            elements.unveilingContent.classList.remove('hidden');
            elements.unveilingSenderName.textContent = data.de || 'Alguém especial';
            elements.unveilingRecipientName.textContent = data.para || 'Você';
            elements.unveilingScreen.classList.add('visible');
        },
        revealCard() {
            elements.unveilingScreen.classList.remove('visible');
            setTimeout(() => {
                elements.unveilingScreen.classList.add('hidden');
                elements.header.classList.remove('hidden');
                elements.mainContent.classList.remove('hidden');
                elements.footer.classList.remove('hidden');
                elements.card.container.classList.remove('hidden');
                document.body.classList.add('card-is-open');
            }, 500); // Alinhado com a transição do CSS
        },
        showErrorState(message) {
            elements.unveilingScreen.classList.add('hidden');
            elements.mainContent.classList.remove('hidden');
            elements.card.container.classList.add('hidden');
            elements.errorState.classList.remove('hidden');
            elements.errorState.querySelector('p').textContent = message || 'Não foi possível carregar o cartão.';
        },
        populateCardData(data) {
            elements.card.recipient.textContent = data.para || '';
            elements.card.message.textContent = data.mensagem || '';
            elements.card.sender.textContent = data.de ? `De: ${data.de}` : '';

            if (data.dataEspecial) {
                const date = new Date(data.dataEspecial);
                elements.card.date.textContent = date.toLocaleDateString('pt-BR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                });
            }

            if (data.fotoUrl) {
                const img = document.createElement('img');
                img.src = data.fotoUrl;
                img.alt = `Foto enviada por ${data.de || 'anônimo'}`;
                img.className = 'card-image';
                img.loading = 'lazy';
                elements.card.photoContainer.appendChild(img);
            }

            if (data.youtubeVideoId) {
                this.createYouTubeIframe(data.youtubeVideoId);
            }
        },
        createYouTubeIframe(videoId) {
            const iframe = document.createElement('iframe');
            iframe.src = `https://www.youtube.com/embed/${videoId}?controls=1&rel=0&modestbranding=1&playsinline=1`;
            iframe.title = 'Vídeo do YouTube do cartão';
            iframe.className = 'video-frame';
            iframe.loading = 'lazy';
            iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
            iframe.allowFullscreen = true;
            elements.card.videoContainer.appendChild(iframe);
        },
    };

    // 4. Módulo de Dados
    const dataModule = {
        async fetchCard(cardId) {
            if (!cardId) throw new Error('ID do cartão não fornecido na URL.');
            const response = await fetch(`${config.API_BASE_URL}/${cardId}`);
            if (!response.ok) {
                throw new Error(`Erro ao buscar o cartão: ${response.statusText}`);
            }
            return response.json();
        },
    };

    // 5. Inicialização
    const init = async () => {
        ui.showLoadingState();
        try {
            const cardId = new URLSearchParams(window.location.search).get('id');
            const data = await dataModule.fetchCard(cardId);
            ui.showUnveilingScreen(data);
            ui.populateCardData(data);
            elements.openCardBtn.addEventListener('click', ui.revealCard);
        } catch (error) {
            console.error('Erro ao inicializar o cartão:', error);
            ui.showErrorState(error.message);
        }
    };

    return { init };
})();

document.addEventListener('DOMContentLoaded', CardViewerApp.init);