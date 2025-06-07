(function(window, document) {
  'use strict';

  class YouTubeManager {
    static #VALID_YOUTUBE_ID_REGEX = /^[a-zA-Z0-9_-]{11}$/;
    static #URL_PATTERNS = [
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([^&]+)/,
      /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([^?]+)/,
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([^?]+)/,
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/v\/([^?]+)/,
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/shorts\/([^?]+)/
    ];

    static getVideoId(url) {
      if (!url || typeof url !== 'string') return null;
      
      const sanitizedUrl = url.trim();
      if (!sanitizedUrl) return null;

      for (const pattern of this.#URL_PATTERNS) {
        const match = sanitizedUrl.match(pattern);
        if (match && match[1]) {
          const videoId = match[1].split('&')[0].split('/')[0];
          if (this.#VALID_YOUTUBE_ID_REGEX.test(videoId)) {
            return videoId;
          }
        }
      }
      return null;
    }

    static createPlayerHtml(urls, currentIndex) {
      if (!Array.isArray(urls) || urls.length === 0 || currentIndex >= urls.length) {
        return this.#createErrorMessage('Nenhum vídeo disponível.');
      }

      const videoId = this.getVideoId(urls[currentIndex]);
      if (!videoId) {
        return this.#createErrorMessage('Link do YouTube inválido.');
      }

      return `
        <div class="preview-video-container">
          <h3>Vídeo ${currentIndex + 1} de ${urls.length}</h3>
          <div class="youtube-player-container">
            <iframe
              src="https://www.youtube.com/embed/${this.#sanitizeInput(videoId)}?rel=0&modestbranding=1"
              title="Vídeo do YouTube"
              frameborder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowfullscreen
              loading="lazy">
            </iframe>
          </div>
          ${this.#createVideoControls(urls.length, currentIndex)}
        </div>
      `;
    }

    static #createErrorMessage(message) {
      return `<div class="preview-video-container"><p>${this.#sanitizeInput(message)}</p></div>`;
    }

    static #createVideoControls(totalVideos, currentIndex) {
      return `
        <div class="video-controls">
          <button type="button" class="btn btn--secondary prev-video-btn" 
            ${currentIndex === 0 ? 'disabled aria-disabled="true"' : ''}>
            Vídeo Anterior
          </button>
          <button type="button" class="btn btn--secondary next-video-btn" 
            ${currentIndex === totalVideos - 1 ? 'disabled aria-disabled="true"' : ''}>
            Próximo Vídeo
          </button>
        </div>
      `;
    }

    static #sanitizeInput(input) {
      return String(input).replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }
  }

  class CardManager {
    #elements;
    #currentVideoIndex = 0;
    #youtubeUrls = [];
    #cardId = null;

    constructor() {
      this.#elements = this.#initializeElements();
      this.#cardId = this.#extractCardId();
    }

    #initializeElements() {
      return {
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

    #extractCardId() {
      const pathParts = window.location.pathname.split('/');
      return pathParts[pathParts.length - 1] || null;
    }

    init() {
      if (!this.#validateElements()) {
        console.error('CardManager: Elementos essenciais não encontrados.');
        return;
      }
      
      this.#setCurrentYear();
      this.#loadCard();
    }

    #validateElements() {
      return !!this.#elements.details;
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
          : dateObj.toLocaleDateString('pt-BR', { 
              timeZone: 'UTC', 
              day: '2-digit', 
              month: '2-digit', 
              year: 'numeric' 
            });
      } catch {
        return dateStr;
      }
    }

    #sanitizeMessage(message) {
      if (!message) return 'N/A';
      return message
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\n/g, '<br>');
    }

    async #loadCard() {
      const { loading, error, details } = this.#elements;
      
      if (!this.#cardId) {
        this.#showError('ID do cartão não encontrado na URL.');
        return;
      }

      try {
        const card = await this.#fetchCardData();
        this.#displayCard(card);
      } catch (err) {
        console.error('CardManager: Erro ao carregar cartão:', err);
        this.#showError(err.message || 'Erro ao carregar dados do cartão.');
      }
    }

    async #fetchCardData() {
      const response = await fetch(`/api/card/${encodeURIComponent(this.#cardId)}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Erro ao buscar dados.' }));
        throw new Error(errorData.message);
      }
      return await response.json();
    }

    #displayCard(card) {
      const { loading, error, details, nome, data, mensagem, foto, youtubeContainer } = this.#elements;
      
      loading.classList.add('hidden');
      error.classList.add('hidden');
      details.classList.remove('hidden');

      nome.textContent = card.nome || 'N/A';
      data.textContent = `Data: ${this.#formatDate(card.data)}`;
      mensagem.innerHTML = this.#sanitizeMessage(card.mensagem);
      
      this.#handlePhoto(card.fotoUrl);
      this.#handleVideos(card.youtubeUrls || []);
    }

    #handlePhoto(photoUrl) {
      const { foto } = this.#elements;
      if (photoUrl) {
        foto.src = photoUrl;
        foto.classList.remove('hidden');
      } else {
        foto.classList.add('hidden');
      }
    }

    #handleVideos(videoUrls) {
      this.#youtubeUrls = Array.isArray(videoUrls) ? videoUrls : [];
      this.#currentVideoIndex = 0;
      this.#updateVideoPlayer();
    }

    #updateVideoPlayer() {
      const { youtubeContainer } = this.#elements;
      youtubeContainer.innerHTML = YouTubeManager.createPlayerHtml(
        this.#youtubeUrls, 
        this.#currentVideoIndex
      );
      
      this.#setupVideoControls();
    }

    #setupVideoControls() {
      const prevBtn = this.#elements.youtubeContainer.querySelector('.prev-video-btn');
      const nextBtn = this.#elements.youtubeContainer.querySelector('.next-video-btn');
      
      if (prevBtn) {
        prevBtn.onclick = () => this.#navigateVideo(-1);
      }
      if (nextBtn) {
        nextBtn.onclick = () => this.#navigateVideo(1);
      }
    }

    #navigateVideo(direction) {
      const newIndex = this.#currentVideoIndex + direction;
      if (newIndex >= 0 && newIndex < this.#youtubeUrls.length) {
        this.#currentVideoIndex = newIndex;
        this.#updateVideoPlayer();
      }
    }

    #showError(message) {
      const { loading, error } = this.#elements;
      loading.classList.add('hidden');
      error.classList.remove('hidden');
      error.textContent = `Erro: ${message}`;
    }
  }

  class App {
    static init() {
      try {
        console.log('Aplicação Messagelove Card inicializando...');
        new CardManager().init();
        console.log('Aplicação Messagelove Card pronta.');
      } catch (error) {
        console.error('Falha na inicialização do aplicativo:', error);
      }
    }
  }

  // Carregamento seguro
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', App.init);
  } else {
    setTimeout(App.init, 0);
  }
})(window, document);