document.addEventListener('DOMContentLoaded', () => {
  // !!! IMPORTANTE: Defina a URL base da sua API backend aqui !!!
  const BACKEND_BASE_URL = 'https://messagelove-backend.onrender.com'; // Exemplo, substitua pela sua URL real

  const loadingDiv = document.getElementById('card-loading');
  const errorDiv = document.getElementById('card-error');
  const cardDetailsDiv = document.getElementById('card-details');

  // Elementos para preencher
  const nomeEl = document.getElementById('nome');
  const dataEl = document.getElementById('data');
  const mensagemEl = document.getElementById('mensagem');
  const fotoEl = document.getElementById('foto');
  const spotifyContainer = document.getElementById('spotify-container');
  const spotifyIframe = document.getElementById('spotify');
  const audioContainer = document.getElementById('audio-container');
  const mp3Audio = document.getElementById('mp3');
  const mp3SourceEl = mp3Audio ? mp3Audio.querySelector('source') : null;

  /**
   * Extrai o ID do cartão da URL da página.
   * Assumindo URLs como /cards/view/CARD_ID ou /algum/caminho/CARD_ID
   * @returns {string|null} O ID do cartão ou null.
   */
  function getCardIdFromUrl() {
    const pathSegments = window.location.pathname.split('/').filter(segment => segment);
    if (pathSegments.length > 0) {
      return pathSegments[pathSegments.length - 1];
    }
    // Fallback para query parameter ?id=CARD_ID (descomente e ajuste se necessário)
    // const urlParams = new URLSearchParams(window.location.search);
    // return urlParams.get('id');
    return null;
  }

  /**
   * Formata uma string de data (espera-se YYYY-MM-DD) para DD/MM/YYYY.
   * @param {string} dateString - A string da data.
   * @returns {string} A data formatada ou uma mensagem padrão.
   */
  function formatDate(dateString) {
    if (!dateString) return 'Data não especificada';
    try {
      // Tenta primeiro como YYYY-MM-DD
      const parts = dateString.split('-');
      if (parts.length === 3 && parts[0].length === 4) {
        const [year, month, day] = parts;
        return `${day}/${month}/${year}`;
      }
      // Se não for YYYY-MM-DD, tenta converter de forma mais genérica
      const dateObj = new Date(dateString + 'T00:00:00Z'); // Adiciona Z para tratar como UTC
      if (!isNaN(dateObj.getTime())) {
          // Usar getUTCDate, getUTCMonth, getUTCFullYear para evitar problemas de fuso horário na formatação manual
          const d = dateObj.getUTCDate().toString().padStart(2, '0');
          const m = (dateObj.getUTCMonth() + 1).toString().padStart(2, '0'); // Mês é 0-indexado
          const y = dateObj.getUTCFullYear();
          return `${d}/${m}/${y}`;
      }
    } catch (e) {
      console.warn("Erro ao formatar data:", dateString, e);
    }
    return dateString; // Retorna original se a formatação falhar
  }

  /**
   * Busca os dados do cartão da API e inicia a renderização.
   * @param {string} cardId - O ID do cartão a ser buscado.
   */
  async function fetchAndRenderCard(cardId) {
    if (!loadingDiv || !errorDiv || !cardDetailsDiv) {
        console.error("Elementos DOM essenciais para feedback não encontrados.");
        return;
    }

    loadingDiv.classList.remove('hidden');
    errorDiv.classList.add('hidden');
    cardDetailsDiv.classList.add('hidden');

    try {
      const response = await fetch(`${BACKEND_BASE_URL}/api/card/${cardId}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Oops! Este cartão especial não foi encontrado.');
        }
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || `Erro ${response.status} ao buscar o cartão.`);
      }
      const cardData = await response.json();
      renderCard(cardData);
    } catch (error) {
      console.error('Erro ao buscar dados do cartão:', error);
      loadingDiv.classList.add('hidden');
      errorDiv.textContent = error.message || 'Não foi possível carregar este cartão. Tente novamente mais tarde.';
      errorDiv.classList.remove('hidden');
    }
  }

  /**
   * Preenche o HTML com os dados do cartão.
   * @param {object} data - Os dados do cartão.
   */
  function renderCard(data) {
    if (!data || !nomeEl || !dataEl || !mensagemEl || !fotoEl || 
        !spotifyContainer || !spotifyIframe || !audioContainer || !mp3Audio) {
      console.error("Elementos DOM para renderização do cartão não encontrados ou dados inválidos.");
      errorDiv.textContent = 'Erro ao exibir os detalhes do cartão.';
      errorDiv.classList.remove('hidden');
      loadingDiv.classList.add('hidden');
      return;
    }

    document.title = `Para ${data.nome || 'Alguém Especial'} | Messagelove`;
    nomeEl.textContent = data.nome || 'Um Destinatário Muito Especial';
    dataEl.textContent = formatDate(data.data);
    mensagemEl.innerHTML = data.mensagem ? data.mensagem.replace(/\n/g, '<br>') : 'Uma mensagem cheia de carinho para você!';

    // Configura a foto
    if (data.fotoUrl) {
      fotoEl.src = data.fotoUrl;
      fotoEl.alt = `Foto especial para ${data.nome || 'o cartão'}`;
      fotoEl.classList.remove('hidden');
    } else {
      fotoEl.classList.add('hidden'); // Mantém escondido se não houver foto
    }

    // Configura a música
    let musicDisplayed = false;
    if (data.spotifyTrackId) { // Prioriza Spotify Embed
      const embedUrl = `https://developer.spotify.com/documentation/web-api/reference/player/3{data.spotifyTrackId}`;
      spotifyIframe.src = embedUrl;
      spotifyContainer.classList.remove('hidden');
      audioContainer.classList.add('hidden');
      musicDisplayed = true;
    } else if (data.previewUrl && mp3SourceEl) { // Fallback para MP3 preview
      mp3SourceEl.src = data.previewUrl;
      mp3Audio.load(); // Importante para carregar a nova source
      audioContainer.classList.remove('hidden');
      spotifyContainer.classList.add('hidden');
      musicDisplayed = true;
    } else { // Nenhuma música
      spotifyContainer.classList.add('hidden');
      audioContainer.classList.add('hidden');
    }
    
    const cardMediaSection = document.querySelector('.card-media');
    if (!data.fotoUrl && !musicDisplayed && cardMediaSection) {
        // Opcional: se nenhuma mídia, você pode querer mostrar uma mensagem ou ajustar o estilo
        // cardMediaSection.textContent = "Um cartão cheio de palavras e carinho!";
    }

    // Mostra os detalhes do cartão e esconde o loading
    loadingDiv.classList.add('hidden');
    errorDiv.classList.add('hidden');
    cardDetailsDiv.classList.remove('hidden');
  }

  // --- Ponto de Entrada do Script ---
  const cardId = getCardIdFromUrl();

  if (cardId) {
    fetchAndRenderCard(cardId);
  } else {
    console.error('ID do cartão não encontrado na URL.');
    if (loadingDiv) loadingDiv.classList.add('hidden');
    if (errorDiv) {
      errorDiv.textContent = 'Link do cartão inválido ou ID não encontrado.';
      errorDiv.classList.remove('hidden');
    }
    if (cardDetailsDiv) cardDetailsDiv.classList.add('hidden');
  }
});