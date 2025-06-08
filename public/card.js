document.addEventListener('DOMContentLoaded', async () => {
    const API_URL = 'http://localhost:3001/api'; // Mude para a URL do Render em produção

    // Elementos da página que serão preenchidos
    const nomeEl = document.getElementById('card-nome');
    const mensagemEl = document.getElementById('card-mensagem');
    const dataEl = document.getElementById('card-data');
    const fotoContainerEl = document.getElementById('card-foto-container');
    const videoContainerEl = document.getElementById('card-video-container');

    /**
     * Extrai o ID do cartão da URL da página.
     * Ex: card.html?id=123e4567-e89b-12d3-a456-426614174000
     * @returns {string|null} O ID do cartão ou null se não for encontrado.
     */
    const getCardIdFromURL = () => {
        const params = new URLSearchParams(window.location.search);
        return params.get('id');
    };

    /**
     * Busca os dados de um cartão específico na API.
     * @param {string} id - O ID do cartão.
     * @returns {object|null} Os dados do cartão ou null em caso de erro.
     */
    const fetchCardData = async (id) => {
        try {
            const response = await fetch(`${API_URL}/card/${id}`);
            if (!response.ok) {
                throw new Error(`Cartão não encontrado ou erro na API. Status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error("Erro ao buscar dados do cartão:", error);
            return null;
        }
    };

    /**
     * Preenche a página com os dados do cartão.
     * @param {object} card - O objeto do cartão vindo da API.
     */
    const renderCard = (card) => {
        document.title = `Um cartão para ${card.nome}`; // Atualiza o título da aba
        
        nomeEl.textContent = `Para: ${card.nome}`;
        mensagemEl.textContent = card.mensagem;
        
        // Formata a data para o padrão brasileiro
        dataEl.textContent = card.data 
            ? new Date(card.data).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) 
            : 'Não especificada';

        // Adiciona a imagem se a URL existir
        if (card.fotoUrl) {
            const img = document.createElement('img');
            img.src = card.fotoUrl;
            img.alt = `Foto para ${card.nome}`;
            fotoContainerEl.appendChild(img);
        }

        // Adiciona o vídeo do YouTube se o ID existir
        if (card.youtubeVideoId) {
            const iframe = document.createElement('iframe');
            iframe.src = `https://www.youtube-nocookie.com/embed/${card.youtubeVideoId}`;
            iframe.title = "Player de vídeo do YouTube";
            iframe.frameBorder = "0";
            iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
            iframe.allowFullscreen = true;
            
            // Wrapper para manter a proporção do vídeo responsivo
            const videoWrapper = document.createElement('div');
            videoWrapper.className = 'youtube-player-wrapper';
            videoWrapper.appendChild(iframe);
            videoContainerEl.appendChild(videoWrapper);
        }
    };

    /**
     * Função principal que orquestra a execução.
     */
    const main = async () => {
        const cardId = getCardIdFromURL();
        if (!cardId) {
            nomeEl.textContent = 'Erro: ID do cartão não encontrado na URL.';
            return;
        }

        const cardData = await fetchCardData(cardId);
        if (!cardData) {
            nomeEl.textContent = 'Não foi possível carregar os dados deste cartão.';
            return;
        }

        renderCard(cardData);
    };

    // Inicia a execução
    main();
});