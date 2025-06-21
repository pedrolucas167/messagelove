// Aguarda o DOM estar completamente carregado antes de executar o script
document.addEventListener('DOMContentLoaded', () => {
    // Mapeamento dos elementos do DOM para fácil acesso
    const elements = {
        unveilingScreen: document.getElementById('unveiling-screen'),
        loadingState: document.getElementById('loading-state'),
        unveilingContent: document.getElementById('unveiling-content'),
        unveilingSenderName: document.getElementById('unveiling-sender-name'),
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
            videoContainer: document.getElementById('card-video-container')
        },
        errorState: document.getElementById('error-state')
    };

    const API_BASE_URL = 'https://messagelove-backend.onrender.com/api/cards';

    // Função principal que inicia o processo
    const initializeCard = async () => {
        try {
            // 1. Pega o ID do cartão da URL (ex: /card.html?id=12345)
            const cardId = new URLSearchParams(window.location.search).get('id');
            if (!cardId) {
                throw new Error('ID do cartão não encontrado na URL.');
            }

            // 2. Busca os dados do cartão na API
            const response = await fetch(`${API_BASE_URL}/${cardId}`);
            if (!response.ok) {
                throw new Error(`Erro na API: ${response.statusText}`);
            }
            const data = await response.json();

            // 3. Preenche os dados e prepara a tela de revelação
            populateUnveilingScreen(data);
            populateCardData(data);
            
            // 4. Transição do estado de loading para o de "pronto para abrir"
            elements.loadingState.classList.add('hidden');
            elements.unveilingContent.classList.remove('hidden');

        } catch (error) {
            console.error("Falha ao inicializar o cartão:", error);
            showErrorState();
        }
    };

    // Preenche a tela de revelação com o nome de quem enviou
    const populateUnveilingScreen = (data) => {
        elements.unveilingSenderName.textContent = data.de;
    };

    // Preenche o conteúdo do cartão
    const populateCardData = (data) => {
        elements.card.recipient.textContent = data.para;
        elements.card.date.textContent = data.dataEspecial 
            ? new Date(data.dataEspecial).toLocaleDateString('pt-BR', { dateStyle: 'long' })
            : '';
        elements.card.message.textContent = data.mensagem;
        elements.card.sender.textContent = data.de;

        // Adiciona a foto se existir
        if (data.fotoUrl) {
            const img = document.createElement('img');
            img.src = data.fotoUrl;
            img.alt = `Foto enviada por ${data.de}`;
            elements.card.photoContainer.appendChild(img);
        }

        // Adiciona o vídeo do YouTube se existir
        if (data.youtubeVideoId) { // Ajustado para corresponder ao campo do backend
            createYouTubeIframe(data.youtubeVideoId);
        }
    };

    // Função para mostrar o cartão ao clicar no botão
    const revealCard = () => {
        elements.unveilingScreen.classList.remove('visible');
        elements.unveilingScreen.classList.add('hidden');
        
        elements.header.classList.remove('hidden');
        elements.mainContent.classList.remove('hidden');
        elements.footer.classList.remove('hidden');
        elements.card.container.classList.remove('hidden');

        // Aqui você pode iniciar animações, como a de partículas
        // initParticles(); 
    };

    // Função para exibir o estado de erro
    const showErrorState = () => {
        elements.unveilingScreen.classList.remove('visible');
        elements.unveilingScreen.classList.add('hidden');
        elements.mainContent.classList.remove('hidden');
        elements.card.container.classList.add('hidden');
        elements.errorState.classList.remove('hidden');
    };

    // Cria um iframe simples para o YouTube (Refatorado)
    const createYouTubeIframe = (videoId) => {
        const iframe = document.createElement('iframe');
        iframe.src = `https://www.youtube.com/embed/${videoId}?controls=1&rel=0&modestbranding=1&playsinline=1`;
        iframe.width = '100%';
        iframe.height = '360';
        iframe.frameBorder = '0';
        iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
        iframe.allowFullscreen = true;
        elements.card.videoContainer.appendChild(iframe);
    };

    // Adiciona o listener de evento ao botão
    elements.openCardBtn.addEventListener('click', revealCard);

    // Inicia todo o processo
    initializeCard();
});