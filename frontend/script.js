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

    static createPlayerHtml(videoId) {
      if (!videoId) {
        return '<div class="preview-video-container"><p>Link do YouTube inválido.</p></div>';
      }
      return `
        <div class="preview-video-container">
          <div class="youtube-player-container">
            <iframe
              src="https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1"
              title="Vídeo do YouTube"
              frameborder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowfullscreen>
            </iframe>
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

    appendNotification(notification) {
      this.#notificationArea.appendChild(notification);
    }

    removeNotification(notification) {
      this.#removeNotification(notification);
    }
  }

  class FormManager {
    #form;
    #notificationManager;

    constructor() {
      this.#form = document.getElementById('cardForm');
      this.#notificationManager = new NotificationManager();
    }

    init() {
      if (!this.#form) {
        console.error('FormManager: Formulário não encontrado.');
        return;
      }
      this.#setupEventListeners();
    }

    #setupEventListeners() {
      this.#form.addEventListener('submit', (e) => this.#handleSubmit(e));
      document.getElementById('addYoutubeUrlBtn').addEventListener('click', () => this.#handleYoutubeUrl());
      document.getElementById('youtubeUrlInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.#handleYoutubeUrl();
        }
      });
      document.getElementById('fotoUpload').addEventListener('change', (e) => this.#handleFileUpload(e));
      document.getElementById('removeFoto')?.addEventListener('click', () => this.#removePhoto());
    }

    #handleYoutubeUrl() {
      const urlInput = document.getElementById('youtubeUrlInput');
      const previewContainer = document.getElementById('youtubePreviewContainer');
      const errorElement = document.getElementById('youtubeError');
      
      const videoId = YouTubeManager.getVideoId(urlInput.value.trim());
      
      if (videoId) {
        errorElement.textContent = '';
        previewContainer.innerHTML = YouTubeManager.createPlayerHtml(videoId);
        previewContainer.classList.add('active');
        document.getElementById('youtubeVideoId').value = videoId;
      } else {
        errorElement.textContent = 'Por favor, insira um link válido do YouTube.';
        previewContainer.classList.remove('active');
      }
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
        youtubeVideoId: formData.get('youtubeVideoId') || null
      };

      try {
        const response = await fetch('https://messagelove-backend.onrender.com/api/cards', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Failed to create card.');
        }

        const result = await response.json();
        this.#showSuccessNotification(result.viewLink);
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

    #showSuccessNotification(viewLink) {
      const notification = document.createElement('div');
      notification.className = 'notification notification--success';
      this.#notificationManager.appendNotification(notification);
      setTimeout(() => this.#notificationManager.removeNotification(notification), 10000);
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
      document.getElementById('youtubePreviewContainer').classList.remove('active');
      document.getElementById('youtubePreviewContainer').innerHTML = '';
      document.getElementById('youtubeUrlInput').value = '';
      document.getElementById('youtubeVideoId').value = '';
      document.getElementById('youtubeError').textContent = '';
    }
  }

  const app = {
    init() {
      const formManager = new FormManager();
      formManager.init();
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => app.init());
  } else {
    app.init();
  }
})(window, document);