

// Envolvemos todo o código em uma IIFE para criar um escopo privado
(function(window, document) {
  'use strict'; // Habilita o modo estrito para ajudar a pegar erros comuns

  // --- Módulos Utilitários ---

  /**
   * @namespace NotificationManager
   * @description Gerencia a exibição de notificações não bloqueantes.
   */
  const NotificationManager = {
    _notificationContainer: null,
    _defaultDuration: 3000,

    init: function() {
      if (document.getElementById('appNotificationArea')) {
        this._notificationContainer = document.getElementById('appNotificationArea');
      } else {
        this._notificationContainer = document.createElement('div');
        this._notificationContainer.id = 'appNotificationArea';
        this._notificationContainer.setAttribute('aria-live', 'polite');
        this._notificationContainer.setAttribute('role', 'log');
        document.body.appendChild(this._notificationContainer);
      }
    },
    _showMessage: function(message, type = 'info', duration = this._defaultDuration) {
      if (!this._notificationContainer) this.init();

      const messageElement = document.createElement('div');
      messageElement.className = `notification notification--${type}`;
      messageElement.setAttribute('role', 'status');
      messageElement.setAttribute('aria-atomic', 'true');
      messageElement.textContent = message;

      const closeButton = document.createElement('button');
      closeButton.innerHTML = '&times;';
      closeButton.className = 'notification__close';
      closeButton.setAttribute('aria-label', 'Fechar notificação');
      closeButton.onclick = () => {
        messageElement.classList.add('notification--removing');
        // Espera a animação de saída antes de remover
        messageElement.addEventListener('transitionend', () => messageElement.remove());
      };
      messageElement.appendChild(closeButton);

      this._notificationContainer.appendChild(messageElement);

      if (duration) {
        setTimeout(() => {
          // Verifica se o elemento ainda existe antes de tentar remover
          if (messageElement.parentElement) {
            closeButton.onclick(); // Simula clique para animação de saída
          }
        }, duration);
      }
    },
    showSuccess: function(message, duration) {
      this._showMessage(message, 'success', duration || this._defaultDuration);
    },
    showError: function(message, duration) {
      this._showMessage(message, 'error', duration || 5000); // Erros ficam um pouco mais
    },
    showInfo: function(message, duration) {
      this._showMessage(message, 'info', duration || this._defaultDuration);
    }
  };

  /**
   * @namespace Utils
   * @description Funções utilitárias genéricas para a aplicação.
   */
  const Utils = {
    /**
     * Alterna o estado de loading de um botão.
     * @param {HTMLButtonElement} button - O elemento do botão.
     * @param {boolean} isLoading - True se estiver carregando, false caso contrário.
     * @param {string} [loadingText='Carregando...'] - Texto a ser exibido durante o carregamento (sem o spinner).
     * @param {string|null} [defaultHtmlContent=null] - Conteúdo HTML original do botão para restaurar.
     */
    toggleButtonLoading: function(button, isLoading, loadingText = 'Carregando...', defaultHtmlContent = null) {
      if (!button) return;

      if (isLoading) {
        if (!button.classList.contains('btn--loading')) { // Evita sobrescrever se já estiver loading
          button.dataset.originalContent = button.innerHTML;
          button.innerHTML = `<span class="btn__loading"></span> ${loadingText}`;
          button.disabled = true;
          button.classList.add('btn--loading');
        }
      } else {
        if (button.classList.contains('btn--loading')) { // Restaura apenas se estava em loading
          const originalContent = button.dataset.originalContent || defaultHtmlContent || 'Ação';
          button.innerHTML = originalContent;
          button.disabled = false;
          delete button.dataset.originalContent;
          button.classList.remove('btn--loading');
        }
      }
    },

    /**
     * Formata segundos para o formato mm:ss.
     * @param {number} seconds - O tempo total em segundos.
     * @returns {string} O tempo formatado.
     */
    formatTime: function(seconds) {
      if (!isFinite(seconds) || seconds < 0) return '0:00';
      const minutes = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
    }
  };

  // --- Configuração da Aplicação ---

// URL do seu backend de produção (Render)
const PROD_BACKEND_URL = 'https://messagelove-backend.onrender.com';

/**
 * @namespace AppConfig
 * @description Gerencia configurações da aplicação, como URLs de backend e frontend.
 */
const AppConfig = {
  /**
   * Obtém a URL base do frontend atual.
   * Ex: "https://messagelove-frontend.vercel.app" ou "http://localhost:PORTA_FRONTEND"
   * @returns {string} A URL base do frontend.
   */
  getFrontendBaseUrl: function() {
    return `${window.location.protocol}//${window.location.host}`;
  },

  /**
   * Obtém a URL base do backend.
   * De acordo com sua informação, sempre usará o backend de produção (Render).
   * @returns {string} A URL do backend.
   */
  getBackendUrl: function() {
    // Como você não usa um backend local separado e quer que
    // o frontend (mesmo em localhost) acesse o backend no Render,
    // retornamos diretamente a URL de produção.
    console.log('Usando URL de backend:', PROD_BACKEND_URL);
    return PROD_BACKEND_URL;
  }
};

  // --- Seletores DOM ---
  const DOM = {
    form: document.getElementById('cardForm'),
    nomeInput: document.getElementById('nome'),
    dataInput: document.getElementById('data'),
    mensagemInput: document.getElementById('mensagem'),
    fotoInput: document.getElementById('fotoUpload'),
    fotoPreview: document.getElementById('fotoPreview'),
    removeFotoBtn: document.getElementById('removeFoto'),
    submitBtn: document.getElementById('submitBtn'),
    currentYear: document.getElementById('currentYear'),
    fieldset: document.querySelector('fieldset'),
    previewContainer: document.querySelector('[data-js="preview-container"]'),
  };

  // --- Módulos da Aplicação ---

  /**
   * @namespace AudioPlayerManager
   * @description Gerencia a criação e funcionalidade de players de áudio.
   */
  const AudioPlayerManager = {
    createPlayer: function(track, playerContext = 'track') {
      const playerElement = document.createElement('div');
      playerElement.className = 'audio-player';
      playerElement.setAttribute('data-track-name', track.name || 'esta faixa');

      playerElement.innerHTML = `
        <button class="play-pause-btn" aria-label="Tocar prévia de ${track.name || 'faixa'}">
          <span class="play-icon">▶️</span>
          <span class="pause-icon" style="display: none;">⏸️</span>
        </button>
        <div class="progress-bar-container">
          <div class="progress-bar"></div>
        </div>
        <span class="duration">0:00 / 0:00</span>
        <audio class="audio-element" preload="metadata">
          <source src="${track.previewUrl}" type="audio/mpeg">
          Seu navegador não suporta o elemento de áudio.
        </audio>
        <div class="preview-error" style="display: none;">
          Não foi possível reproduzir a prévia.
        </div>
      `;
      this._initPlayerLogic(playerElement, playerContext);
      return playerElement;
    },
    _initPlayerLogic: function(playerElement, playerContext) {
      const audioElement = playerElement.querySelector('.audio-element');
      const playPauseBtn = playerElement.querySelector('.play-pause-btn');
      const playIcon = playerElement.querySelector('.play-icon');
      const pauseIcon = playerElement.querySelector('.pause-icon');
      const progressBarContainer = playerElement.querySelector('.progress-bar-container');
      const progressBar = playerElement.querySelector('.progress-bar');
      const durationElement = playerElement.querySelector('.duration');
      const errorElement = playerElement.querySelector('.preview-error');
      const trackName = playerElement.dataset.trackName || (playerContext === 'card' ? 'música' : 'prévia');

      if (!audioElement || !playPauseBtn || !progressBarContainer || !progressBar || !durationElement || !errorElement) {
        console.error('Elementos do player de áudio não encontrados.', playerElement);
        return;
      }

      audioElement.addEventListener('loadedmetadata', () => {
        if (isFinite(audioElement.duration)) {
          durationElement.textContent = `0:00 / ${Utils.formatTime(audioElement.duration)}`;
        }
      });
      audioElement.addEventListener('timeupdate', () => {
        if (isFinite(audioElement.duration) && audioElement.duration > 0) {
          const progressPercent = (audioElement.currentTime / audioElement.duration) * 100;
          progressBar.style.width = `${progressPercent}%`;
          durationElement.textContent = `${Utils.formatTime(audioElement.currentTime)} / ${Utils.formatTime(audioElement.duration)}`;
        }
      });
      audioElement.addEventListener('ended', () => {
        playPauseBtn.setAttribute('aria-label', `Tocar ${trackName}`);
        playIcon.style.display = 'inline';
        pauseIcon.style.display = 'none';
        audioElement.currentTime = 0;
        progressBar.style.width = '0%';
      });
      audioElement.addEventListener('play', () => {
        document.querySelectorAll('audio.audio-element, audio.track-preview, audio.card-audio-preview').forEach(otherAudio => {
          if (otherAudio !== audioElement && !otherAudio.paused) {
            otherAudio.pause();
            const otherPlayerRoot = otherAudio.closest('.audio-player');
            if (otherPlayerRoot) {
                const otherBtn = otherPlayerRoot.querySelector('.play-pause-btn');
                const otherPlayIcon = otherPlayerRoot.querySelector('.play-icon');
                const otherPauseIcon = otherPlayerRoot.querySelector('.pause-icon');
                if(otherBtn && otherPlayIcon && otherPauseIcon) {
                    otherBtn.setAttribute('aria-label', `Tocar ${otherPlayerRoot.dataset.trackName || 'prévia'}`);
                    otherPlayIcon.style.display = 'inline';
                    otherPauseIcon.style.display = 'none';
                }
            }
          }
        });
      });
      audioElement.addEventListener('error', (e) => {
        console.error(`Erro ao carregar/reproduzir áudio para ${trackName}:`, audioElement.error, e);
        errorElement.textContent = `Prévia indisponível para ${trackName}.`; // Mensagem mais específica
        errorElement.style.display = 'block';
        // playerElement.style.display = 'none'; // Esconde o player problemático
        // Opcional: notificar globalmente
        // NotificationManager.showError(`Não foi possível carregar a prévia de "${trackName}".`);
      });
      playPauseBtn.addEventListener('click', () => {
        if (audioElement.paused) {
          audioElement.play().catch(e => {
            console.error(`Erro ao tentar play() para ${trackName}:`, e);
            errorElement.textContent = `Erro ao tocar ${trackName}.`;
            errorElement.style.display = 'block';
            // playerElement.style.display = 'none';
          });
          playPauseBtn.setAttribute('aria-label', `Pausar ${trackName}`);
          playIcon.style.display = 'none';
          pauseIcon.style.display = 'inline';
        } else {
          audioElement.pause();
          playPauseBtn.setAttribute('aria-label', `Tocar ${trackName}`);
          playIcon.style.display = 'inline';
          pauseIcon.style.display = 'none';
        }
      });
      progressBarContainer.addEventListener('click', (event) => {
        if (!isFinite(audioElement.duration)) return;
        const rect = progressBarContainer.getBoundingClientRect();
        const offsetX = event.clientX - rect.left;
        const newTime = (offsetX / rect.width) * audioElement.duration;
        audioElement.currentTime = newTime;
      });
    }
  };

  /**
   * @namespace PhotoManager
   * @description Gerencia o upload e preview de fotos.
   */
  const PhotoManager = {
    init() {
      if (!DOM.fotoInput || !DOM.fotoPreview || !DOM.removeFotoBtn || !DOM.previewContainer) {
        console.error('PhotoManager: Elementos de upload de foto não encontrados.');
        return;
      }
      this._setupEventListeners();
    },
    _setupEventListeners() {
      DOM.fotoInput.addEventListener('change', () => this._handleFileSelect());
      DOM.removeFotoBtn.addEventListener('click', () => this.removePhoto());
    },
    _handleFileSelect() {
      const file = DOM.fotoInput.files[0];
      if (!file) return;
      const validTypes = ['image/jpeg', 'image/png', 'image/gif']; // Adicionado gif como exemplo
      if (!validTypes.includes(file.type)) {
        NotificationManager.showError('Por favor, selecione uma imagem JPG, PNG ou GIF.');
        DOM.fotoInput.value = '';
        return;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB
        NotificationManager.showError('A imagem deve ter no máximo 5MB.');
        DOM.fotoInput.value = '';
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        DOM.fotoPreview.src = reader.result;
        DOM.fotoPreview.style.display = 'block';
        DOM.removeFotoBtn.style.display = 'flex';
        DOM.previewContainer.hidden = false;
      };
      reader.readAsDataURL(file);
    },
    removePhoto() {
      DOM.fotoInput.value = '';
      DOM.fotoPreview.src = '#';
      DOM.fotoPreview.style.display = 'none';
      DOM.removeFotoBtn.style.display = 'none';
      DOM.previewContainer.hidden = true;
    }
  };

  /**
   * @namespace Spotify
   * @description Gerencia a busca e seleção de músicas do Spotify.
   */
  const Spotify = {
    backendUrl: AppConfig.getBackendUrl(),
    originalSearchBtnContent: '<span class="search-icon">🔍</span> Buscar', // Salva o HTML original do botão

    init() {
      this._createAndInsertSection();
      this.searchInput = document.getElementById('spotifySearch');
      this.searchBtn = document.getElementById('searchSpotifyBtn');
      this.resultsContainer = document.getElementById('spotifyResults');
      this.selectedTrackInput = document.getElementById('selectedSpotifyTrack');
      this.previewUrlInput = document.getElementById('previewUrl');

      if (!this.searchInput || !this.searchBtn || !this.resultsContainer || !this.selectedTrackInput || !this.previewUrlInput) {
        console.error('Spotify: Elementos da seção Spotify não encontrados.');
        NotificationManager.showError('Erro ao inicializar a busca de músicas.');
        return;
      }
      console.log('Módulo Spotify inicializado.');
      this._setupEventListeners();
    },
    _createAndInsertSection() {
      const sectionContainer = document.createElement('div');
      sectionContainer.className = 'form-group spotify-section-wrapper';
      sectionContainer.innerHTML = `
        <label for="spotifySearch">Adicionar música do Spotify (Opcional)</label>
        <div class="spotify-search-container">
          <input type="text" id="spotifySearch" placeholder="Pesquisar música ou artista..." 
                 class="spotify-search-input" aria-label="Pesquisar música no Spotify" />
          <button type="button" id="searchSpotifyBtn" class="btn btn--spotify">
            ${this.originalSearchBtnContent}
          </button>
        </div>
        <div id="spotifyResults" class="spotify-results" aria-live="polite"></div>
        <input type="hidden" id="selectedSpotifyTrack" name="spotify" />
        <input type="hidden" id="previewUrl" name="previewUrl" />
        <small class="field-hint">Busque e selecione uma música. Algumas podem não ter prévia.</small>
      `;
      const submitBtnGroup = DOM.submitBtn.closest('.form-group');
      if (DOM.fieldset && submitBtnGroup) {
        DOM.fieldset.insertBefore(sectionContainer, submitBtnGroup);
      } else if (DOM.fieldset) {
        console.warn("Grupo do botão de submit não encontrado. Inserindo Spotify ao final do fieldset.");
        DOM.fieldset.appendChild(sectionContainer);
      } else {
        console.error("Fieldset não encontrado. Não foi possível adicionar a seção do Spotify.");
      }
    },
    _setupEventListeners() {
      this.searchBtn.addEventListener('click', () => this.search());
      let searchTimeout;
      this.searchInput.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => this.search(), 500);
      });
    },
    async search() {
      const query = this.searchInput.value.trim();
      if (!query) {
        this.showFeedback('Digite o nome da música ou artista para buscar.', 'info');
        return;
      }
      Utils.toggleButtonLoading(this.searchBtn, true, 'Buscando...');
      try {
        const response = await fetch(`${this.backendUrl}/api/spotify/search?q=${encodeURIComponent(query)}`, {
          method: 'GET',
          headers: { 'Accept': 'application/json' } // Content-Type não é usual para GET
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: `Erro na requisição: ${response.statusText}` }));
          throw new Error(errorData.message || `Erro ${response.status}: ${response.statusText}`);
        }
        const tracks = await response.json();
        if (!Array.isArray(tracks)) {
          throw new Error('Resposta inválida do servidor: dados das faixas não são um array.');
        }
        this._displayResults(tracks);
      } catch (error) {
        console.error('Erro na busca do Spotify:', error);
        let errorMessage = error.message;
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
          errorMessage = `Não foi possível conectar ao servidor de música (${this.backendUrl}). Verifique sua conexão.`;
        }
        this.showFeedback(errorMessage, 'error'); // Feedback local na área de resultados
        // NotificationManager.showError(errorMessage); // Opcional: notificação global
      } finally {
        Utils.toggleButtonLoading(this.searchBtn, false, 'Buscando...', this.originalSearchBtnContent);
      }
    },
    _displayResults(tracks) {
      this.resultsContainer.innerHTML = '';
      const oldSelectedFeedback = DOM.fieldset.querySelector('.selected-track-info');
      if (oldSelectedFeedback) oldSelectedFeedback.remove();

      if (!tracks.length) {
        this.showFeedback('Nenhuma música encontrada. Tente outra busca.', 'info');
        return;
      }
      const fragment = document.createDocumentFragment();
      tracks.forEach(track => {
        if (track) fragment.appendChild(this._createTrackElement(track));
      });
      this.resultsContainer.appendChild(fragment);
    },
    _createTrackElement(track) {
      const element = document.createElement('div');
      element.className = 'spotify-track';
      element.innerHTML = `
        <img src="${track.albumImage || 'placeholder-album.png'}" alt="Capa do álbum ${track.albumName || 'Desconhecido'}" 
             class="track-image" width="60" height="60" loading="lazy" onerror="this.src='placeholder-album.png'; this.onerror=null;" />
        <div class="track-info">
          <h4 class="track-name">${track.name}</h4>
          <p class="track-artist">${track.artists ? track.artists.join(', ') : 'Artista Desconhecido'}</p>
          <p class="track-album">${track.albumName || 'Álbum Desconhecido'}</p>
          <div class="preview-player-container">
            ${track.previewUrl ? '' : '<span class="no-preview-text" aria-label="Prévia não disponível">Sem prévia de áudio</span>'}
          </div>
        </div>
        <button type="button" class="btn select-track-btn" 
                data-track-id="${track.id}" aria-label="Selecionar música ${track.name}">
          Selecionar
        </button>
      `;
      if (track.previewUrl) {
        const playerContainer = element.querySelector('.preview-player-container');
        playerContainer.appendChild(AudioPlayerManager.createPlayer(track, 'track'));
      }
      element.querySelector('.select-track-btn').addEventListener('click', () => this._selectTrack(track, element));
      return element;
    },
    _selectTrack(track, selectedElement) {
      const oldGlobalFeedback = DOM.fieldset.querySelector('.selected-track-info');
      if (oldGlobalFeedback) oldGlobalFeedback.remove();

      document.querySelectorAll('.spotify-track.selected').forEach(el => {
        el.classList.remove('selected');
        const btn = el.querySelector('.select-track-btn');
        if (btn) btn.textContent = 'Selecionar';
      });
      selectedElement.classList.add('selected');
      const selectBtn = selectedElement.querySelector('.select-track-btn');
      if (selectBtn) selectBtn.textContent = 'Selecionado ✓';
      this.selectedTrackInput.value = track.id;
      this.previewUrlInput.value = track.previewUrl || '';
      this._showSelectedTrackFeedback(track);
    },
    _showSelectedTrackFeedback(track) {
      let feedbackDiv = DOM.fieldset.querySelector('.selected-track-info');
      if (!feedbackDiv) {
        feedbackDiv = document.createElement('div');
        feedbackDiv.className = 'selected-track-info feedback feedback--success';
        if (this.resultsContainer && this.resultsContainer.parentNode) {
            this.resultsContainer.parentNode.insertBefore(feedbackDiv, this.resultsContainer);
        } else if (DOM.fieldset) {
            DOM.fieldset.appendChild(feedbackDiv); 
        }
      }
      feedbackDiv.innerHTML = `
          Música selecionada: <strong>${track.name}</strong> - ${track.artists ? track.artists.join(', ') : ''}
          ${track.previewUrl ? '<br><em>Prévias de 30 segundos podem estar disponíveis.</em>' : '<br><em>Esta música não possui prévia de áudio.</em>'}
      `;
    },
    showFeedback(message, type = 'info') { // Feedback local na área de resultados
      const oldSelectedFeedback = DOM.fieldset.querySelector('.selected-track-info');
      if (oldSelectedFeedback) oldSelectedFeedback.remove();
      this.resultsContainer.innerHTML = `<div class="feedback feedback--${type}">${message}</div>`;
    },
    resetSpotifySection() { // Para limpar a seção do Spotify
        if (this.resultsContainer) this.resultsContainer.innerHTML = '';
        const selectedTrackInfo = DOM.fieldset.querySelector('.selected-track-info');
        if (selectedTrackInfo) selectedTrackInfo.remove();
        if (this.selectedTrackInput) this.selectedTrackInput.value = '';
        if (this.previewUrlInput) this.previewUrlInput.value = '';
        if (this.searchInput) this.searchInput.value = '';
    }
  };

  /**
   * @namespace FormManager
   * @description Gerencia a submissão do formulário e a prévia do cartão.
   */
  const FormManager = {
    backendUrl: AppConfig.getBackendUrl(),
    originalSubmitBtnContent: 'Criar Cartão Mensagem', // Salva o HTML original do botão

    init() {
      if (!DOM.form || !DOM.submitBtn || !DOM.nomeInput || !DOM.mensagemInput) {
        console.error('FormManager: Elementos essenciais do formulário não encontrados.');
        NotificationManager.showError('Erro ao inicializar o formulário.');
        return;
      }
      // Salva o conteúdo original do botão de submit se ele tiver HTML complexo
      // this.originalSubmitBtnContent = DOM.submitBtn.innerHTML; // Se o texto simples não for suficiente
      this._setupEventListeners();
      this._setCurrentYear();
    },
    _setupEventListeners() {
      DOM.form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await this._handleSubmit();
      });
    },
    _clearFormState() {
      DOM.form.reset();
      PhotoManager.removePhoto();
      Spotify.resetSpotifySection(); // Usa a função de reset do módulo Spotify
    },
    async _handleSubmit() {
      const nome = DOM.nomeInput.value.trim();
      const mensagem = DOM.mensagemInput.value.trim();
      if (!nome || !mensagem) {
        NotificationManager.showError('Por favor, preencha os campos Nome e Mensagem.');
        return;
      }
      const formData = new FormData(DOM.form); // FormData pode pegar direto do form
      // Campos adicionais ou que não têm 'name' no HTML precisam ser adicionados manualmente:
      // Ex: se 'spotify' e 'previewUrl' inputs não tiverem o atributo 'name':
      // formData.append('spotify', document.getElementById('selectedSpotifyTrack')?.value || '');
      // formData.append('previewUrl', document.getElementById('previewUrl')?.value || '');
      // No seu caso, os inputs hidden 'spotify' e 'previewUrl' já têm 'name', então FormData(DOM.form) deve pegá-los.
      // Mas vamos garantir que eles sejam enviados corretamente se não tiverem 'name' ou se precisar de lógica extra:
      const selectedTrackId = document.getElementById('selectedSpotifyTrack')?.value;
      const previewUrl = document.getElementById('previewUrl')?.value;
      if (selectedTrackId) formData.set('spotify', selectedTrackId); // Use 'set' para garantir que substitua se já existir
      else formData.delete('spotify'); // Remove se vazio para não enviar campo vazio desnecessário
      if (previewUrl) formData.set('previewUrl', previewUrl);
      else formData.delete('previewUrl');

      Utils.toggleButtonLoading(DOM.submitBtn, true, 'Enviando...');
      try {
        // console.log('Enviando formulário com dados:', Object.fromEntries(formData.entries()));
        const response = await fetch(`${this.backendUrl}/api/cards`, {
          method: 'POST',
          body: formData
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: `Erro na requisição: ${response.statusText}` }));
          throw new Error(errorData.message || `Erro ${response.status}: ${response.statusText}`);
        }
        const data = await response.json();
        NotificationManager.showSuccess('Cartão criado com sucesso!');
        this._showCardPreview(data.cardData, data.viewLink);
        this._clearFormState();
      } catch (error) {
        console.error('Erro ao enviar formulário:', error);
        let errorMessage = error.message;
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
          errorMessage = `Não foi possível conectar ao servidor (${this.backendUrl}). Verifique sua conexão.`;
        }
        NotificationManager.showError(`Erro ao enviar: ${errorMessage}`);
      } finally {
        Utils.toggleButtonLoading(DOM.submitBtn, false, 'Enviando...', this.originalSubmitBtnContent);
      }
    },
    _showCardPreview(cardData, viewLink) {
      const existingPreview = document.querySelector('.card-preview-wrapper');
      if (existingPreview) existingPreview.remove();

      const previewWrapper = document.createElement('div');
      previewWrapper.className = 'card-preview-wrapper';
      const previewContainerEl = document.createElement('div');
      previewContainerEl.className = 'card-preview';
      
      let dataFormatada = 'Não especificada';
      if (cardData.data) {
          try {
              const dateObj = new Date(cardData.data + 'T00:00:00');
              if (!isNaN(dateObj.getTime())) {
                  dataFormatada = dateObj.toLocaleDateString('pt-BR', {timeZone: 'UTC'});
              } else { dataFormatada = cardData.data; }
          } catch (e) { dataFormatada = cardData.data; }
      }
      
      previewContainerEl.innerHTML = `
        <div class="card-preview-header">
          <h2>Cartão Criado!</h2>
          <button type="button" class="close-preview-btn" aria-label="Fechar prévia">&times;</button>
        </div>
        <p><strong>Para:</strong> ${cardData.nome}</p>
        <p><strong>Data:</strong> ${dataFormatada}</p>
        <p><strong>Mensagem:</strong> ${cardData.mensagem.replace(/\n/g, '<br>')}</p>
        ${cardData.fotoUrl ? `<div class="preview-image-container"><img src="${cardData.fotoUrl}" alt="Foto do cartão" class="preview-image" onerror="this.style.display='none';" /></div>` : ''}
        <div class="preview-audio-container">
          ${cardData.previewUrl && cardData.spotifyTrackName ? `<h3>Música: ${cardData.spotifyTrackName}</h3>` : (cardData.previewUrl ? '<h3>Música Selecionada:</h3>' : '')}
        </div>
        <p class="preview-link-info">Link para visualização: 
            <a href="${viewLink}" target="_blank" rel="noopener noreferrer">${viewLink}</a>
        </p>
        <button type="button" class="btn btn--secondary close-preview-btn-bottom">Fechar Prévia</button>
      `;

      if (cardData.previewUrl) {
        const audioContainer = previewContainerEl.querySelector('.preview-audio-container');
        const trackInfoForPlayer = {
            name: cardData.spotifyTrackName || `música para ${cardData.nome}`,
            previewUrl: cardData.previewUrl
        };
        audioContainer.appendChild(AudioPlayerManager.createPlayer(trackInfoForPlayer, 'card'));
      }
      
      previewContainerEl.querySelectorAll('.close-preview-btn, .close-preview-btn-bottom').forEach(btn => {
        btn.addEventListener('click', () => previewWrapper.remove());
      });

      previewWrapper.appendChild(previewContainerEl);
      (DOM.previewContainer || document.body).appendChild(previewWrapper);
      previewWrapper.scrollIntoView({ behavior: 'smooth', block: 'center' });
    },
    _setCurrentYear() {
      if (DOM.currentYear) DOM.currentYear.textContent = new Date().getFullYear();
    }
  };

  /**
   * @namespace App
   * @description Ponto de entrada e inicialização da aplicação.
   */
  const App = {
    init: function() {
      console.log('Aplicação Messagelove inicializando...');
      NotificationManager.init(); // Deve ser um dos primeiros a inicializar

      PhotoManager.init();
      Spotify.init();
      FormManager.init();

      if (typeof tsParticles !== 'undefined' && typeof initParticles === 'function') {
        // initParticles();
      }
      console.log('Aplicação pronta.');
    }
  };

  // Inicializa a aplicação
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', App.init);
  } else {
    App.init(); // DOM já carregado
  }

  // window.MessageloveApp = App; // Expor globalmente para debug (opcional)

})(window, document);