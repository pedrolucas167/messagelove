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

    static createPlayerHtml(videoId) {
      if (!this.#VALID_YOUTUBE_ID_REGEX.test(videoId)) {
        return '<div class="preview-video-container"><p>Link do YouTube inválido.</p></div>';
      }

      const sanitizedId = this.#sanitizeInput(videoId);
      return `
        <div class="preview-video-container">
          <div class="youtube-player-container">
            <iframe
              src="https://www.youtube.com/embed/${sanitizedId}?rel=0&modestbranding=1"
              title="Vídeo do YouTube"
              frameborder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowfullscreen
              loading="lazy">
            </iframe>
          </div>
        </div>
      `;
    }

    static #sanitizeInput(input) {
      return input.replace(/[^a-zA-Z0-9_-]/g, '');
    }
  }

  class NotificationManager {
    #notificationArea;
    #activeNotifications = new Set();

    constructor() {
      this.#notificationArea = document.getElementById('appNotificationArea');
      if (!this.#notificationArea) {
        console.error('NotificationManager: Área de notificação não encontrada.');
      }
    }

    show(message, type = 'info', duration = 5000) {
      if (!this.#notificationArea) return;

      const notification = document.createElement('div');
      notification.className = `notification notification--${this.#validateType(type)}`;
      notification.textContent = this.#sanitizeMessage(message);
      
      const closeBtn = document.createElement('button');
      closeBtn.className = 'notification__close';
      closeBtn.innerHTML = '×';
      closeBtn.setAttribute('aria-label', 'Fechar notificação');
      closeBtn.onclick = () => this.#removeNotification(notification);
      
      notification.appendChild(closeBtn);
      this.#notificationArea.appendChild(notification);
      this.#activeNotifications.add(notification);

      if (duration > 0) {
        setTimeout(() => this.#removeNotification(notification), duration);
      }
    }

    #validateType(type) {
      const validTypes = ['info', 'success', 'warning', 'error'];
      return validTypes.includes(type) ? type : 'info';
    }

    #sanitizeMessage(message) {
      return String(message).replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    #removeNotification(notification) {
      if (!this.#activeNotifications.has(notification)) return;

      notification.classList.add('notification--removing');
      setTimeout(() => {
        notification.remove();
        this.#activeNotifications.delete(notification);
      }, 300);
    }
  }

  class FormManager {
    #form;
    #notificationManager;
    #submitBtn;
    #youtubeElements;
    #photoElements;
    #apiEndpoint;

    constructor() {
      this.#form = document.getElementById('cardForm');
      this.#notificationManager = new NotificationManager();
      this.#submitBtn = document.getElementById('submitBtn');
      this.#apiEndpoint = 'https://messagelove-backend.onrender.com/api/cards';

      this.#youtubeElements = {
        urlInput: document.getElementById('youtubeUrlInput'),
        previewContainer: document.getElementById('youtubePreviewContainer'),
        errorElement: document.getElementById('youtubeError'),
        videoIdInput: document.getElementById('youtubeVideoId'),
        addBtn: document.getElementById('addYoutubeUrlBtn')
      };

      this.#photoElements = {
        uploadInput: document.getElementById('fotoUpload'),
        previewContainer: document.querySelector('[data-js="preview-container"]'),
        previewImg: document.getElementById('fotoPreview'),
        removeBtn: document.getElementById('removeFoto')
      };

      if (!this.#form) {
        console.error('FormManager: Formulário não encontrado.');
        return;
      }
    }

    init() {
      this.#setupEventListeners();
    }

    #setupEventListeners() {
      this.#form.addEventListener('submit', (e) => this.#handleSubmit(e));
      
      if (this.#youtubeElements.addBtn) {
        this.#youtubeElements.addBtn.addEventListener('click', () => this.#handleYoutubeUrl());
      }
      
      if (this.#youtubeElements.urlInput) {
        this.#youtubeElements.urlInput.addEventListener('keypress', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            this.#handleYoutubeUrl();
          }
        });
      }
      
      if (this.#photoElements.uploadInput) {
        this.#photoElements.uploadInput.addEventListener('change', (e) => this.#handleFileUpload(e));
      }
      
      if (this.#photoElements.removeBtn) {
        this.#photoElements.removeBtn.addEventListener('click', () => this.#removePhoto());
      }
    }

    #handleYoutubeUrl() {
      const { urlInput, previewContainer, errorElement, videoIdInput } = this.#youtubeElements;
      
      if (!urlInput || !previewContainer || !errorElement || !videoIdInput) {
        console.error('YouTube elements not found');
        return;
      }

      const videoId = YouTubeManager.getVideoId(urlInput.value.trim());
      
      if (videoId) {
        errorElement.textContent = '';
        previewContainer.innerHTML = YouTubeManager.createPlayerHtml(videoId);
        previewContainer.classList.add('active');
        videoIdInput.value = videoId;
      } else {
        errorElement.textContent = 'Por favor, insira um link válido do YouTube.';
        previewContainer.classList.remove('active');
        videoIdInput.value = '';
      }
    }

    async #handleSubmit(event) {
      event.preventDefault();
      
      if (!this.#validateForm()) {
        return;
      }

      this.#setLoadingState(true);

      try {
        const formData = this.#prepareFormData();
        const response = await this.#sendFormData(formData);

        if (!response.ok) {
          await this.#handleErrorResponse(response);
          return;
        }

        const result = await response.json();
        this.#handleSuccess(result);
      } catch (error) {
        this.#handleSubmissionError(error);
      } finally {
        this.#setLoadingState(false);
      }
    }

    #validateForm() {
      const nome = this.#form.elements.nome?.value.trim();
      const mensagem = this.#form.elements.mensagem?.value.trim();

      if (!nome || !mensagem) {
        this.#notificationManager.show('Os campos "Nome" e "Mensagem" são obrigatórios.', 'error');
        return false;
      }

      return true;
    }

    #prepareFormData() {
      return {
        nome: this.#form.elements.nome.value.trim(),
        data: this.#form.elements.data?.value || null,
        mensagem: this.#form.elements.mensagem.value.trim(),
        fotoUrl: this.#photoElements.previewImg?.src || '',
        youtubeVideoId: this.#youtubeElements.videoIdInput?.value || null
      };
    }

    async #sendFormData(data) {
      return fetch(this.#apiEndpoint, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(data)
      });
    }

    async #handleErrorResponse(response) {
      try {
        const errorData = await response.json();
        throw new Error(errorData.message || `Erro ${response.status}: ${response.statusText}`);
      } catch (parseError) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }
    }

    #handleSuccess(result) {
      this.#notificationManager.show(
        `Cartão criado com sucesso! <a href="${result.viewLink}" target="_blank">Ver cartão</a>`,
        'success',
        10000
      );
      this.#resetForm();
    }

    #handleSubmissionError(error) {
      console.error('FormManager: Erro ao enviar formulário:', error);
      this.#notificationManager.show(
        error.message || 'Erro ao criar cartão. Por favor, tente novamente.',
        'error'
      );
    }

    #setLoadingState(isLoading) {
      if (this.#submitBtn) {
        this.#submitBtn.disabled = isLoading;
        this.#submitBtn.classList.toggle('btn--loading', isLoading);
      }
    }

    #handleFileUpload(event) {
      const file = event.target.files[0];
      const { previewContainer, previewImg } = this.#photoElements;

      if (!file) return;

      // Validação do arquivo
      if (!file.type.startsWith('image/')) {
        this.#notificationManager.show('Por favor, selecione um arquivo de imagem válido.', 'error');
        event.target.value = '';
        return;
      }

      // Limite de 5MB
      if (file.size > 5 * 1024 * 1024) {
        this.#notificationManager.show('O tamanho máximo da imagem é 5MB.', 'error');
        event.target.value = '';
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        previewImg.src = reader.result;
        previewContainer.hidden = false;
      };
      reader.onerror = () => {
        this.#notificationManager.show('Erro ao ler a imagem.', 'error');
        event.target.value = '';
      };
      reader.readAsDataURL(file);
    }

    #removePhoto() {
      const { uploadInput, previewContainer } = this.#photoElements;
      uploadInput.value = '';
      previewContainer.hidden = true;
    }

    #resetForm() {
      this.#form.reset();
      
      if (this.#youtubeElements.previewContainer) {
        this.#youtubeElements.previewContainer.classList.remove('active');
        this.#youtubeElements.previewContainer.innerHTML = '';
        this.#youtubeElements.urlInput.value = '';
        this.#youtubeElements.videoIdInput.value = '';
        this.#youtubeElements.errorElement.textContent = '';
      }
      
      if (this.#photoElements.previewContainer) {
        this.#photoElements.previewContainer.hidden = true;
      }
    }
  }

  // Inicialização da aplicação
  class App {
    static init() {
      try {
        // Inicializa o fundo animado de partículas
        if (window.particlesJS) {
          particlesJS('particles-js', {
            particles: {
              number: { value: 80, density: { enable: true, value_area: 800 } },
              color: { value: ['#ff6f61', '#6b48ff', '#48ff91'] }, // Cores vibrantes
              shape: { type: 'circle' },
              opacity: { value: 0.5, random: true, anim: { enable: true, speed: 1, opacity_min: 0.1 } },
              size: { value: 3, random: true, anim: { enable: true, speed: 2, size_min: 0.3 } },
              line_linked: { enable: true, distance: 150, color: '#ffffff', opacity: 0.4, width: 1 },
              move: {
                enable: true,
                speed: 2,
                direction: 'none',
                random: true,
                straight: false,
                out_mode: 'out',
                bounce: false
              }
            },
            interactivity: {
              detect_on: 'canvas',
              events: {
                onhover: { enable: true, mode: 'repulse' },
                onclick: { enable: true, mode: 'push' },
                resize: true
              },
              modes: {
                repulse: { distance: 100, duration: 0.4 },
                push: { particles_nb: 4 }
              }
            },
            retina_detect: true
          });
        } else {
          console.warn('particles.js não está disponível.');
        }

        // Inicializa o gerenciador de formulário
        const formManager = new FormManager();
        formManager.init();
      } catch (error) {
        console.error('Falha na inicialização do aplicativo:', error);
      }
    }
  }

  // Carregamento seguro
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', App.init);
  } else {
    setTimeout(App.init, 0); // Executa após o evento loop
  }
})(window, document);