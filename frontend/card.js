(function(window, document) {
  'use strict';

  class YouTubeManager {
    static getVideoId(url) {
      if (!url) return null;
      const patterns = [
        /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([^&]+)/,
        /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([^?]+)/,
        /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([^?]+)/,
        /(?:https?:\/\/)?(?:www\.)?youtube\.com\/v\/([^?]+)/,
        /(?:https?:\/\/)?(?:www\.)?youtube\.com\/shorts\/([^?]+)/
      ];
      for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1]) return match[1].split('&')[0];
      }
      return null;
    }

    static createPlayerHtml(urls, currentIndex) {
      if (!urls || !urls.length || currentIndex >= urls.length) {
        return '<div class="preview-video-container"><p>Nenhum vídeo disponível.</p></div>';
      }
      const videoId = this.getVideoId(urls[currentIndex]);
      if (!videoId) {
        return '<div class="preview-video-container"><p>Link do YouTube inválido.</p></div>';
      }
      return `
        <div class="preview-video-container">
          <h3>Vídeo ${currentIndex + 1} de ${urls.length}</h3>
          <div class="youtube-player-container">
            <iframe
              src="https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1"
              title="Vídeo do YouTube"
              frameborder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowfullscreen>
            </iframe>
          </div>
          <div class="video-controls">
            <button type="button" class="btn btn--secondary prev-video-btn" ${currentIndex === 0 ? 'disabled' : ''}>Vídeo Anterior</button>
            <button type="button" class="btn btn--secondary next-video-btn" ${currentIndex === urls.length - 1 ? 'disabled' : ''}>Próximo Vídeo</button>
          </div>
        </div>
      `;
    }
  }

  class CardManager {
    #elements;
    #currentVideoIndex = 0;
    #youtubeUrls = [];

    constructor() {
      this.#elements = {
        loading: document.getElementById('card-loading'),
        error: document.getElementById('card-error'),
        details: document.getElementById('card-details'),
        nome: document.getElementById('nome'),
        data: document.getElementById('data'),
        mensagem: document.getElementById('mensagem'),
        foto: document.getElementById('foto'),
        youtubeContainer: document.getElementById('youtube-container'),
        currentYear: document.getElementById('currentYear')
      };
    }

    init() {
      if (!this.#elements.details) {
        console.error('CardManager: Elementos do cartão não encontrados.');
        return;
      }
      this.#setCurrentYear();
      this.#loadCard();
      console.log('CardManager: Inicializado.');
    }

    #setCurrentYear() {
      if (this.#elements.currentYear) {
        this.#elements.currentYear.textContent = new Date().getFullYear();
      }
    }

    #formatDate(dateStr) {
      if (!dateStr) return 'Não especificada';
      try {
        const dateObj = new Date(dateStr + 'T00:00:00');
        return isNaN(dateObj.getTime())
          ? dateStr
          : dateObj.toLocaleDateString('pt-BR', { timeZone: 'UTC', day: '2-digit', month: '2-digit', year: 'numeric' });
      } catch {
        return dateStr;
      }
    }

    #updateVideoPlayer() {
      const { youtubeContainer } = this.#elements;
      youtubeContainer.innerHTML = YouTubeManager.createPlayerHtml(this.#youtubeUrls, this.#currentVideoIndex);
      const prevBtn = youtubeContainer.querySelector('.prev-video-btn');
      const nextBtn = youtubeContainer.querySelector('.next-video-btn');
      if (prevBtn) {
        prevBtn.onclick = () => {
          if (this.#currentVideoIndex > 0) {
            this.#currentVideoIndex--;
            this.#updateVideoPlayer();
          }
        };
      }
      if (nextBtn) {
        nextBtn.onclick = () => {
          if (this.#currentVideoIndex < this.#youtubeUrls.length - 1) {
            this.#currentVideoIndex++;
            this.#updateVideoPlayer();
          }
        };
      }
    }

    async #loadCard() {
      const { loading, error, details, nome, data, mensagem, foto, youtubeContainer } = this.#elements;
      const cardId = window.location.pathname.split('/').pop();
      if (!cardId) {
        loading.classList.add('hidden');
        error.classList.remove('hidden');
        error.textContent = 'Erro: ID do cartão não encontrado na URL.';
        return;
      }

      try {
        const response = await fetch(`/api/card/${cardId}`);
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Erro ao buscar dados.' }));
          throw new Error(errorData.message);
        }
        const card = await response.json();

        loading.classList.add('hidden');
        details.classList.remove('hidden');

        nome.textContent = card.nome || 'N/A';
        data.textContent = `Data: ${this.#formatDate(card.data)}`;
        mensagem.innerHTML = card.mensagem ? card.mensagem.replace(/\n/g, '<br>') : 'N/A';
        if (card.fotoUrl) {
          foto.src = card.fotoUrl;
          foto.classList.remove('hidden');
        }
        this.#youtubeUrls = card.youtubeUrls || [];
        if (this.#youtubeUrls.length) {
          this.#updateVideoPlayer();
        } else {
          youtubeContainer.innerHTML = '<div class="preview-video-container"><p>Nenhum vídeo disponível.</p></div>';
        }
      } catch (err) {
        console.error('CardManager: Erro ao carregar cartão:', err);
        loading.classList.add('hidden');
        error.classList.remove('hidden');
        error.textContent = `Erro: ${err.message}`;
      }
    }
  }

  const app = {
    init() {
      console.log('Aplicação Messagelove Card inicializando...');
      const cardManager = new CardManager();
      cardManager.init();
      console.log('Aplicação Messagelove Card pronta.');
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => app.init());
  } else {
    app.init();
  }
})(window, document);