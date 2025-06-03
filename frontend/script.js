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

    static async validateUrl(url) {
      const videoId = this.getVideoId(url);
      if (!videoId) return null;
      try {
        const response = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${process.env.YOUTUBE_API_KEY}`);
        const data = await response.json();
        if (!data.items.length) return null;
        return {
          url,
          videoId,
          title: data.items[0].snippet.title,
          thumbnail: data.items[0].snippet.thumbnails?.medium?.url || ''
        };
      } catch {
        return null;
      }
    }

    static createPlayerHtml(videoData, index, total) {
      if (!videoData || !videoData.videoId) {
        return '<div class="preview-video-container"><p>Link do YouTube inválido.</p></div>';
      }
      return `
        <div class="preview-video-container">
          <h3>${videoData.title || 'Vídeo ' + (index + 1)}</h3>
          <div class="youtube-player-container">
            ${videoData.thumbnail ? `<img src="${videoData.thumbnail}" alt="Thumbnail do vídeo ${videoData.title}" class="video-thumbnail">` : ''}
            <iframe
              id="youtubePlayer"
              src="https://www.youtube.com/embed/${videoData.videoId}?rel=0&modestbranding=1"
              title="${videoData.title || 'Vídeo do YouTube'}"
              frameborder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowfullscreen>
            </iframe>
          </div>
          <div class="video-controls">
            <button type="button" class="btn btn--secondary prev-video-btn" ${index === 0 ? 'disabled' : ''}>Vídeo Anterior</button>
            <button type="button" class="btn btn--secondary next-video-btn" ${index === total - 1 ? 'disabled' : ''}>Próximo Vídeo</button>
          </div>
        </div>
      `;
    }
  }

  class NotificationManager {
    #notificationArea;

    constructor() {
      this.#notificationArea = document.getElementById('appNotificationArea');
    }

    show(message, type = 'info', duration = 5000) {
      const notification = document.createElement('div');
      notification.className = `notification notification--${type}`;
      notification.textContent = message;
      const closeBtn = document.createElement('button');
      closeBtn.className = 'notification__close';
      closeBtn.innerHTML = '&times;';
      closeBtn.onclick = () => this.#removeNotification(notification);
      notification.appendChild(closeBtn);
      this.#notificationArea.appendChild(notification);
      setTimeout(() => this.#removeNotification(notification), duration);
    }

    #removeNotification(notification) {
      notification.classList.add('notification--removing');
      setTimeout(() => notification.remove(), 300);
    }
  }

  class FormManager {
    #form;
    #notificationManager;
    #youtubeUrlsContainer;
    #currentVideoIndex = 0;
    #youtubeData = [];

    constructor() {
      this.#form = document.getElementById('cardForm');
      this.#notificationManager = new NotificationManager();
      this.#youtubeUrlsContainer = document.getElementById('youtubeUrlsContainer');
    }

    init() {
      if (!this.#form) {
        console.error('FormManager: Formulário não encontrado.');
        return;
      }
      this.#setupEventListeners();
      console.log('FormManager: Inicializado.');
    }

    #setupEventListeners() {
      this.#form.addEventListener('submit', (e) => this.#handleSubmit(e));
      document.getElementById('addYoutubeUrlBtn').addEventListener('click', () => this.#addYoutubeUrlInput());
      document.getElementById('fotoUpload').addEventListener('change', (e) => this.#handleFileUpload(e));
      document.getElementById('removeFoto')?.addEventListener('click', () => this.#removePhoto());
      this.#youtubeUrlsContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-url-btn')) {
          this.#removeYoutubeUrlInput(e.target);
        }
      });
    }

    async #handleSubmit(event) {
      event.preventDefault();
      const submitBtn = document.getElementById('submitBtn');
      submitBtn.disabled = true;
      submitBtn.classList.add('btn--loading');

      const formData = new FormData(this.#form);
      const data = {
        nome: formData.get('nome'),
        data: formData.get('data'),
        mensagem: formData.get('mensagem'),
        fotoUrl: document.getElementById('fotoPreview')?.src || '',
        youtubeUrls: formData.getAll('youtubeUrls[]').filter(url => url.trim())
      };

      try {
        this.#youtubeData = [];
        for (const url of data.youtubeUrls) {
          const videoData = await YouTubeManager.validateUrl(url);
          if (videoData) {
            this.#youtubeData.push(videoData);
          } else {
            throw new Error(`Invalid YouTube URL: ${url}`);
          }
        }

        const response = await fetch('https://messagelove-backend.onrender.com/api/cards', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...data, youtubeUrls: this.#youtubeData })
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Failed to create card.');
        }

        const result = await response.json();
        this.#showCardPreview(result.cardData, result.viewLink);
        this.#notificationManager.show('Cartão criado com sucesso!', 'success');
        this.#form.reset();
        this.#resetForm();
      } catch (error) {
        console.error('FormManager: Erro ao enviar formulário:', error);
        this.#notificationManager.show(error.message || 'Erro ao criar cartão.', 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.classList.remove('btn--loading');
      }
    }

    #addYoutubeUrlInput() {
      const inputContainer = document.createElement('div');
      inputContainer.className = 'youtube-url-input';
      inputContainer.innerHTML = `
        <input type="url" name="youtubeUrls[]" class="form-input" placeholder="Insira um link do YouTube">
        <button type="button" class="remove-url-btn">Remover</button>
      `;
      this.#youtubeUrlsContainer.appendChild(inputContainer);
    }

    #removeYoutubeUrlInput(button) {
      if (this.#youtubeUrlsContainer.children.length > 1) {
        button.parentElement.remove();
      } else {
        button.parentElement.querySelector('input').value = '';
      }
    }

    #handleFileUpload(event) {
      const file = event.target.files[0];
      const previewContainer = document.querySelector('[data-js="preview-container"]');
      const previewImg = document.getElementById('fotoPreview');

      if (file) {
        if (!file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) {
          this.#notificationManager.show('Por favor, selecione uma imagem válida (máx. 5MB).', 'error');
          event.target.value = '';
          return;
        }
        const reader = new FileReader();
        reader.onload = () => {
          previewImg.src = reader.result;
          previewContainer.hidden = false;
        };
        reader.readAsDataURL(file);
      }
    }

    #removePhoto() {
      const input = document.getElementById('fotoUpload');
      const previewContainer = document.querySelector('[data-js="preview-container"]');
      input.value = '';
      previewContainer.hidden = true;
    }

    #resetForm() {
      const previewContainer = document.querySelector('[data-js="preview-container"]');
      previewContainer.hidden = true;
      while (this.#youtubeUrlsContainer.children.length > 1) {
        this.#youtubeUrlsContainer.lastChild.remove();
      }
      this.#youtubeUrlsContainer.querySelector('input').value = '';
      this.#currentVideoIndex = 0;
      this.#youtubeData = [];
    }

    #showCardPreview(cardData, viewLink) {
      const modal = document.createElement('div');
      modal.className = 'card-preview-wrapper';
      modal.innerHTML = `
        <div class="card-preview">
          <div class="card-preview-header">
            <h2>Prévia do Cartão</h2>
            <button type="button" class="close-preview-btn">&times;</button>
          </div>
          <p><strong>Para:</strong> ${cardData.nome}</p>
          <p><strong>Data:</strong> ${cardData.data ? new Date(cardData.data).toLocaleDateString('pt-BR') : 'Não especificada'}</p>
          <p><strong>Mensagem:</strong> ${cardData.mensagem.replace(/\n/g, '<br>')}</p>
          ${cardData.fotoUrl ? `<div class="preview-image-container"><img src="${cardData.fotoUrl}" alt="Foto" class="preview-image"></div>` : ''}
          <div id="youtube-preview"></div>
          <div class="preview-link-info">
            <p>Link do cartão: <a href="${viewLink}" target="_blank">${viewLink}</a></p>
          </div>
          <button type="button" class="btn btn--secondary close-preview-btn-bottom">Fechar</button>
        </div>
      `;
      document.body.appendChild(modal);

      const youtubePreview = modal.querySelector('#youtube-preview');
      const updateVideoPreview = () => {
        youtubePreview.innerHTML = YouTubeManager.createPlayerHtml(this.#youtubeData[this.#currentVideoIndex], this.#currentVideoIndex, this.#youtubeData.length);
        const prevBtn = youtubePreview.querySelector('.prev-video-btn');
        const nextBtn = youtubePreview.querySelector('.next-video-btn');
        if (prevBtn) {
          prevBtn.onclick = () => {
            if (this.#currentVideoIndex > 0) {
              this.#currentVideoIndex--;
              updateVideoPreview();
            }
          };
        }
        if (nextBtn) {
          nextBtn.onclick = () => {
            if (this.#currentVideoIndex < this.#youtubeData.length - 1) {
              this.#currentVideoIndex++;
              updateVideoPreview();
            }
          };
        }
      };

      if (this.#youtubeData.length) {
        updateVideoPreview();
      } else {
        youtubePreview.innerHTML = '<div class="preview-video-container"><p>Nenhum vídeo disponível.</p></div>';
      }

      modal.querySelectorAll('.close-preview-btn, .close-preview-btn-bottom').forEach(btn => {
        btn.onclick = () => modal.remove();
      });
    }
  }

  const app = {
    init() {
      console.log('Aplicação Messagelove inicializando...');
      const formManager = new FormManager();
      formManager.init();
      console.log('Aplicação Messagelove pronta.');
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => app.init());
  } else {
    app.init();
  }
})(window, document);