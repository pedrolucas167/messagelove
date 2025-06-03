(function(window, document) {
  'use strict';

  class NotificationManager {
    #container;
    #defaultDuration = 3000;
    #animationDuration = 500;

    constructor() {
      this.#container = null;
    }

    init() {
      this.#container = document.getElementById('appNotificationArea');
      if (!this.#container && document.body) {
        this.#container = document.createElement('div');
        this.#container.id = 'appNotificationArea';
        this.#container.setAttribute('aria-live', 'polite');
        this.#container.setAttribute('role', 'log');
        document.body.appendChild(this.#container);
        console.log('NotificationManager: Container criado.');
      } else if (this.#container) {
        console.log('NotificationManager: Container existente.');
      } else {
        console.error('NotificationManager: Falha ao criar container.');
      }
    }

    #createMessageElement(msg, type) {
      const element = document.createElement('div');
      element.className = `notification notification--${type}`;
      element.textContent = msg;
      const closeButton = document.createElement('button');
      closeButton.innerHTML = '×';
      closeButton.className = 'notification__close';
      closeButton.setAttribute('aria-label', 'Fechar');
      closeButton.onclick = () => this.#removeMessage(element);
      element.appendChild(closeButton);
      return element;
    }

    #removeMessage(element) {
      if (!element.parentElement) return;
      element.classList.add('notification--removing');
      setTimeout(() => element.parentElement?.removeChild(element), this.#animationDuration);
    }

    showMessage(msg, type = 'info', duration = this.#defaultDuration) {
      if (!this.#container) {
        this.init();
        if (!this.#container) {
          console.error(`[Notify][${type}] ${msg} (Container não pronto)`);
          return;
        }
      }
      const element = this.#createMessageElement(msg, type);
      this.#container.appendChild(element);
      if (duration) setTimeout(() => this.#removeMessage(element), duration);
    }

    showSuccess(msg, duration = this.#defaultDuration) {
      this.showMessage(msg, 'success', duration);
    }

    showError(msg, duration = 5000) {
      this.showMessage(msg, 'error', duration);
    }

    showInfo(msg, duration = this.#defaultDuration) {
      this.showMessage(msg, 'info', duration);
    }
  }

  class Utils {
    static toggleButtonLoading(button, isLoading, loadingText = 'Carregando...', defaultHtml = 'Ação') {
      if (!button) return;
      if (isLoading) {
        if (!button.classList.contains('btn--loading')) {
          button.dataset.originalContent = button.innerHTML;
          button.innerHTML = `<span class="btn__loading"></span> ${loadingText}`;
          button.disabled = true;
          button.classList.add('btn--loading');
        }
      } else {
        if (button.classList.contains('btn--loading')) {
          button.innerHTML = button.dataset.originalContent || defaultHtml;
          button.disabled = false;
          delete button.dataset.originalContent;
          button.classList.remove('btn--loading');
        }
      }
    }
  }

  class AppConfig {
    static getFrontendBaseUrl() {
      return `${window.location.protocol}//${window.location.host}`;
    }

    static getBackendUrl() {
      return 'https://messagelove-backend.onrender.com';
    }
  }

  class YouTubeManager {
    static #patterns = [
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([^&]+)/,
      /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([^?]+)/,
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([^?]+)/,
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/v\/([^?]+)/,
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/shorts\/([^?]+)/
    ];

    static getVideoId(url) {
      if (!url) return null;
      try {
        for (const pattern of this.#patterns) {
          const match = url.match(pattern);
          if (match && match[1]) return match[1].split('&')[0];
        }
        return null;
      } catch (error) {
        console.error('Erro ao extrair ID do YouTube:', error);
        return null;
      }
    }

    static validateUrl(url) {
      return !url || !!this.getVideoId(url);
    }

    static createPlayerHtml(videoId, index, total) {
      if (!videoId) {
        return '<div class="preview-video-container" style="margin-top: 15px;"><p>Link do YouTube inválido.</p></div>';
      }
      return `
        <div class="preview-video-container" style="margin-top: 15px;">
          <h3>Vídeo ${index + 1} de ${total}:</h3>
          <div class="youtube-player-wrapper" style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; max-width: 100%; background: #000;">
            <iframe
              id="youtubePlayer"
              style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"
              src="https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1"
              title="Vídeo do YouTube"
              frameborder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowfullscreen>
            </iframe>
          </div>
          <div class="video-controls" style="margin-top: 10px; text-align: center;">
            <button type="button" class="btn btn--secondary prev-video-btn" ${index === 0 ? 'disabled' : ''}>Vídeo Anterior</button>
            <button type="button" class="btn btn--secondary next-video-btn" ${index === total - 1 ? 'disabled' : ''}>Próximo Vídeo</button>
          </div>
        </div>`;
    }
  }

  class PhotoManager {
    #elements;

    constructor() {
      this.#elements = {
        fotoInput: document.getElementById('fotoUpload'),
        fotoPreview: document.getElementById('fotoPreview'),
        removeFotoBtn: document.getElementById('removeFoto'),
        previewContainer: document.querySelector('[data-js="preview-container"]')
      };
    }

    init() {
      const { fotoInput, fotoPreview, removeFotoBtn, previewContainer } = this.#elements;
      if (!fotoInput || !fotoPreview || !removeFotoBtn || !previewContainer) {
        console.warn('PhotoManager: Elementos de upload não encontrados.');
        return;
      }
      fotoInput.addEventListener('change', () => this.#handleFileSelect());
      removeFotoBtn.addEventListener('click', () => this.removePhoto());
      console.log('PhotoManager: Inicializado.');
    }

    #handleFileSelect() {
      const { fotoInput, fotoPreview, removeFotoBtn, previewContainer } = this.#elements;
      const file = fotoInput.files[0];
      if (!file) return;

      const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
      if (!validTypes.includes(file.type)) {
        NotificationManager.prototype.showError('Selecione uma imagem JPG, PNG ou GIF.');
        fotoInput.value = '';
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        NotificationManager.prototype.showError('A imagem deve ter no máximo 5MB.');
        fotoInput.value = '';
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        fotoPreview.src = reader.result;
        fotoPreview.style.display = 'block';
        removeFotoBtn.style.display = 'flex';
        previewContainer.hidden = false;
      };
      reader.readAsDataURL(file);
    }

    removePhoto() {
      const { fotoInput, fotoPreview, removeFotoBtn, previewContainer } = this.#elements;
      fotoInput.value = '';
      fotoPreview.src = '#';
      fotoPreview.style.display = 'none';
      removeFotoBtn.style.display = 'none';
      previewContainer.hidden = true;
    }
  }

  class FormManager {
    #elements;
    #notificationManager;
    #backendUrl;
    #youtubeUrls;
    #currentVideoIndex;

    constructor() {
      this.#elements = {
        form: document.getElementById('cardForm'),
        nomeInput: document.getElementById('nome'),
        mensagemInput: document.getElementById('mensagem'),
        submitBtn: document.getElementById('submitBtn'),
        currentYear: document.getElementById('currentYear'),
        youtubeUrlsContainer: document.getElementById('youtubeUrlsContainer'),
        addYoutubeUrlBtn: document.getElementById('addYoutubeUrlBtn')
      };
      this.#notificationManager = new NotificationManager();
      this.#backendUrl = AppConfig.getBackendUrl();
      this.#youtubeUrls = [];
      this.#currentVideoIndex = 0;
      this.originalSubmitBtnContent = 'Criar Cartão Mensagem';
    }

    init() {
      const { form } = this.#elements;
      if (!form) {
        console.error('FormManager: Formulário principal não encontrado.');
        return;
      }
      form.addEventListener('submit', (e) => this.#handleSubmit(e));
      this.#initYoutubeUrlInputs();
      this.#setCurrentYear();
      console.log('FormManager: Inicializado.');
    }

    #initYoutubeUrlInputs() {
      const { youtubeUrlsContainer, addYoutubeUrlBtn } = this.#elements;
      if (!youtubeUrlsContainer || !addYoutubeUrlBtn) return;

      addYoutubeUrlBtn.addEventListener('click', () => {
        const inputDiv = document.createElement('div');
        inputDiv.className = 'youtube-url-input';
        inputDiv.innerHTML = `
          <input type="text" name="youtubeUrls[]" placeholder="Insira um link do YouTube" />
          <button type="button" class="remove-url-btn">Remover</button>
        `;
        youtubeUrlsContainer.appendChild(inputDiv);
      });

      youtubeUrlsContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-url-btn')) {
          e.target.parentElement.remove();
        }
      });
    }

    #validateForm(nome, mensagem, youtubeUrls) {
      if (!nome || !mensagem) {
        this.#notificationManager.showError('Por favor, preencha Nome e Mensagem.');
        return false;
      }
      if (youtubeUrls.some(url => !YouTubeManager.validateUrl(url))) {
        this.#notificationManager.showError('Um ou mais links do YouTube são inválidos.');
        return false;
      }
      return true;
    }

    async #handleSubmit(event) {
      event.preventDefault();
      const { nomeInput, mensagemInput, submitBtn, form, youtubeUrlsContainer } = this.#elements;
      if (!nomeInput || !mensagemInput || !submitBtn || !form) {
        this.#notificationManager.showError('Erro: Elementos do formulário não encontrados.');
        return;
      }

      const nome = nomeInput.value.trim();
      const mensagem = mensagemInput.value.trim();
      this.#youtubeUrls = Array.from(youtubeUrlsContainer.querySelectorAll('[name="youtubeUrls[]"]'))
        .map(input => input.value.trim())
        .filter(url => url);

      if (!this.#validateForm(nome, mensagem, this.#youtubeUrls)) return;

      const formData = new FormData(form);
      formData.delete('youtubeUrls[]');
      formData.append('youtubeUrls', JSON.stringify(this.#youtubeUrls));

      Utils.toggleButtonLoading(submitBtn, true, 'Enviando...', this.originalSubmitBtnContent);
      try {
        const response = await fetch(`${this.#backendUrl}/api/cards`, {
          method: 'POST',
          body: formData
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: `Erro no servidor: ${response.statusText}` }));
          throw new Error(errorData.message);
        }
        const result = await response.json();
        this.#notificationManager.showSuccess('Cartão criado com sucesso!');
        this.#showCardPreview(result.cardData, result.viewLink);
        this.#clearFormState();
      } catch (error) {
        console.error('FormManager: Erro ao enviar formulário:', error);
        this.#notificationManager.showError(`Erro ao enviar: ${error.message}`);
      } finally {
        Utils.toggleButtonLoading(submitBtn, false, 'Enviando...', this.originalSubmitBtnContent);
      }
    }

    #clearFormState() {
      const { form, youtubeUrlsContainer } = this.#elements;
      if (form) form.reset();
      PhotoManager.prototype.removePhoto();
      if (youtubeUrlsContainer) {
        youtubeUrlsContainer.innerHTML = `
          <div class="youtube-url-input">
            <input type="text" name="youtubeUrls[]" placeholder="Insira um link do YouTube" />
            <button type="button" class="remove-url-btn">Remover</button>
          </div>
        `;
      }
      this.#youtubeUrls = [];
      this.#currentVideoIndex = 0;
    }

    #formatDate(dateStr) {
      try {
        if (!dateStr) return 'Não especificada';
        const dateObj = new Date(dateStr + 'T00:00:00');
        return isNaN(dateObj.getTime())
          ? dateStr
          : dateObj.toLocaleDateString('pt-BR', { timeZone: 'UTC', day: '2-digit', month: '2-digit', year: 'numeric' });
      } catch {
        return dateStr || 'Não especificada';
      }
    }

    #showCardPreview(cardData, viewLink) {
      const existingPreview = document.querySelector('.card-preview-wrapper');
      if (existingPreview) existingPreview.remove();

      const wrapper = document.createElement('div');
      wrapper.className = 'card-preview-wrapper';
      const container = document.createElement('div');
      container.className = 'card-preview';

      this.#youtubeUrls = cardData.youtubeUrls || (cardData.previewUrl ? [cardData.previewUrl] : []);
      this.#currentVideoIndex = 0;

      const updateVideoPlayer = () => {
        return YouTubeManager.createPlayerHtml(
          YouTubeManager.getVideoId(this.#youtubeUrls[this.#currentVideoIndex]),
          this.#currentVideoIndex,
          this.#youtubeUrls.length
        );
      };

      container.innerHTML = `
        <div class="card-preview-header">
          <h2>Cartão Criado!</h2>
          <button type="button" class="close-preview-btn" aria-label="Fechar prévia">×</button>
        </div>
        <p><strong>Para:</strong> ${cardData.nome || 'N/A'}</p>
        <p><strong>Data:</strong> ${this.#formatDate(cardData.data)}</p>
        <p><strong>Mensagem:</strong> ${cardData.mensagem ? cardData.mensagem.replace(/\n/g, '<br>') : 'N/A'}</p>
        ${cardData.fotoUrl ? `<div class="preview-image-container"><img src="${cardData.fotoUrl}" alt="Foto do cartão" class="preview-image"/></div>` : ''}
        ${updateVideoPlayer()}
        <p class="preview-link-info">Link para compartilhar: <a href="${viewLink}" target="_blank" rel="noopener noreferrer">${viewLink}</a></p>
        <button type="button" class="btn btn--secondary close-preview-btn-bottom">Fechar Prévia</button>
      `;

      wrapper.appendChild(container);
      document.body.appendChild(wrapper);

      container.querySelectorAll('.close-preview-btn, .close-preview-btn-bottom').forEach(btn => {
        btn.addEventListener('click', () => wrapper.remove());
      });

      const updateButtons = () => {
        const prevBtn = container.querySelector('.prev-video-btn');
        const nextBtn = container.querySelector('.next-video-btn');
        if (prevBtn) {
          prevBtn.disabled = this.#currentVideoIndex === 0;
          prevBtn.addEventListener('click', () => {
            if (this.#currentVideoIndex > 0) {
              this.#currentVideoIndex--;
              container.querySelector('.preview-video-container').outerHTML = updateVideoPlayer();
              updateButtons();
              wrapper.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          });
        }
        if (nextBtn) {
          nextBtn.disabled = this.#currentVideoIndex === this.#youtubeUrls.length - 1;
          nextBtn.addEventListener('click', () => {
            if (this.#currentVideoIndex < this.#youtubeUrls.length - 1) {
              this.#currentVideoIndex++;
              container.querySelector('.preview-video-container').outerHTML = updateVideoPlayer();
              updateButtons();
              wrapper.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          });
        }
      };

      updateButtons();
      wrapper.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    #setCurrentYear() {
      const { currentYear } = this.#elements;
      if (currentYear) currentYear.textContent = new Date().getFullYear();
    }
  }

  class App {
    static init() {
      console.log('Aplicação Messagelove inicializando...');
      const notificationManager = new NotificationManager();
      notificationManager.init();
      const photoManager = new PhotoManager();
      photoManager.init();
      const formManager = new FormManager();
      formManager.init();
      console.log('Aplicação Messagelove pronta.');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => App.init());
  } else {
    App.init();
  }
})(window, document);