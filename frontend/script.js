// Envolvemos todo o código em uma IIFE para criar um escopo privado
(function(window, document) {
  'use strict'; // Habilita o modo estrito para ajudar a pegar erros comuns

  const FALLBACK_BACKEND_URL = 'https://messagelove-backend.onrender.com';
  const LOCAL_DEV_BACKEND_URL = 'https://localhost:3001'; // Para o backend rodando localmente

  /**
   * @namespace AppConfig
   * @description Gerencia configurações da aplicação, como URLs de backend.
   */
  const AppConfig = {
    /**
     * Obtém a URL base do backend apropriada (local ou produção).
     * @returns {string} A URL do backend.
     */
    getBackendUrl: function() {
      if (window.location.hostname === 'localhost' || window.location.hostname === 'https://messagelove-frontend.vercel.app/') {
        // Se o frontend está rodando localmente, assume que o backend também pode estar.
        // Você pode adicionar verificações de porta se o frontend local não for na porta padrão.
        // console.log('Usando URL de backend local:', LOCAL_DEV_BACKEND_URL);
        return LOCAL_DEV_BACKEND_URL;
      }
      // console.log('Usando URL de backend de produção:', FALLBACK_BACKEND_URL);
      return FALLBACK_BACKEND_URL;
    }
  };

  /**
   * @namespace DOM
   * @description Centraliza a seleção de elementos DOM.
   */
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
    // spotifySectionPlaceholder: document.getElementById('spotify-section-placeholder') // Sugestão: usar um placeholder
  };

  /**
   * @function formatTime
   * @description Formata segundos para o formato mm:ss.
   * @param {number} seconds - O tempo total em segundos.
   * @returns {string} O tempo formatado.
   */
  function formatTime(seconds) {
    if (!isFinite(seconds) || seconds < 0) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
  }

  /**
   * @namespace AudioPlayerManager
   * @description Gerencia a criação e funcionalidade de players de áudio.
   */
  const AudioPlayerManager = {
    /**
     * Cria e inicializa um elemento de player de áudio.
     * @param {object} track - Informações da faixa (name, previewUrl).
     * @param {string} [playerContext='track'] - Contexto para aria-labels (ex: 'track' ou 'card').
     * @returns {HTMLElement} O elemento do player de áudio.
     */
    createPlayer: function(track, playerContext = 'track') {
      const playerElement = document.createElement('div');
      playerElement.className = 'audio-player';
      playerElement.setAttribute('data-track-name', track.name || 'esta faixa'); // Para aria-labels

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

    /**
     * Inicializa a lógica de eventos para um player de áudio específico.
     * @private
     * @param {HTMLElement} playerElement - O elemento raiz do player.
     * @param {string} playerContext - Contexto para aria-labels.
     */
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
        console.error('Elementos do player de áudio não encontrados para inicialização.', playerElement);
        return;
      }

      audioElement.addEventListener('loadedmetadata', () => {
        if (isFinite(audioElement.duration)) {
          durationElement.textContent = `0:00 / ${formatTime(audioElement.duration)}`;
        }
      });

      audioElement.addEventListener('timeupdate', () => {
        if (isFinite(audioElement.duration) && audioElement.duration > 0) {
          const progressPercent = (audioElement.currentTime / audioElement.duration) * 100;
          progressBar.style.width = `${progressPercent}%`;
          durationElement.textContent = `${formatTime(audioElement.currentTime)} / ${formatTime(audioElement.duration)}`;
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
        // Pausa outros áudios na página
        document.querySelectorAll('audio.audio-element, audio.track-preview, audio.card-audio-preview').forEach(otherAudio => {
          if (otherAudio !== audioElement && !otherAudio.paused) {
            otherAudio.pause();
            // Idealmente, resetar a UI dos outros players também
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
        errorElement.style.display = 'block';
        playerElement.style.display = 'none'; // Esconde o player problemático
      });

      playPauseBtn.addEventListener('click', () => {
        if (audioElement.paused) {
          audioElement.play().catch(e => {
            console.error(`Erro ao tentar play() para ${trackName}:`, e);
            errorElement.style.display = 'block';
            playerElement.style.display = 'none';
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

      const validTypes = ['image/jpeg', 'image/png'];
      if (!validTypes.includes(file.type)) {
        // SUGESTÃO: Usar um sistema de notificação da UI em vez de alert.
        alert('Por favor, selecione uma imagem JPG ou PNG.');
        DOM.fotoInput.value = '';
        return;
      }

      if (file.size > 5 * 1024 * 1024) { // 5MB
        alert('A imagem deve ter no máximo 5MB.');
        DOM.fotoInput.value = '';
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        DOM.fotoPreview.src = reader.result;
        DOM.fotoPreview.style.display = 'block';
        DOM.removeFotoBtn.style.display = 'flex'; // Ou 'block' dependendo do seu CSS
        DOM.previewContainer.hidden = false;
      };
      reader.readAsDataURL(file);
    },

    removePhoto() {
      DOM.fotoInput.value = ''; // Limpa o input de arquivo
      DOM.fotoPreview.src = '#'; // Evita mostrar imagem quebrada
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

    init() {
      this._createAndInsertSection();
      
      this.searchInput = document.getElementById('spotifySearch');
      this.searchBtn = document.getElementById('searchSpotifyBtn');
      this.resultsContainer = document.getElementById('spotifyResults');
      this.selectedTrackInput = document.getElementById('selectedSpotifyTrack'); // Hidden input for track ID
      this.previewUrlInput = document.getElementById('previewUrl'); // Hidden input for preview URL
      
      if (!this.searchInput || !this.searchBtn || !this.resultsContainer || !this.selectedTrackInput || !this.previewUrlInput) {
        console.error('Spotify: Elementos da seção Spotify não encontrados após inserção.');
        return;
      }
      
      console.log('Módulo Spotify inicializado com sucesso.');
      this._setupEventListeners();
    },

    _createAndInsertSection() {
      const sectionContainer = document.createElement('div');
      sectionContainer.className = 'form-group spotify-section-wrapper'; // Classe para estilização se necessário
      sectionContainer.innerHTML = `
        <label for="spotifySearch">Adicionar música do Spotify (Opcional)</label>
        <div class="spotify-search-container">
          <input type="text" id="spotifySearch" placeholder="Pesquisar música ou artista..." 
                 class="spotify-search-input" aria-label="Pesquisar música no Spotify" />
          <button type="button" id="searchSpotifyBtn" class="btn btn--spotify">
            <span class="search-icon">🔍</span> Buscar
          </button>
        </div>
        <div id="spotifyResults" class="spotify-results" aria-live="polite"></div>
        <input type="hidden" id="selectedSpotifyTrack" name="spotify" />
        <input type="hidden" id="previewUrl" name="previewUrl" />
        <small class="field-hint">Busque e selecione uma música. Algumas podem não ter prévia.</small>
      `;
      // Insere antes do grupo do botão de submit
      const submitBtnGroup = DOM.submitBtn.closest('.form-group');
      if (DOM.fieldset && submitBtnGroup) {
        DOM.fieldset.insertBefore(sectionContainer, submitBtnGroup);
      } else {
        console.error("Não foi possível encontrar o fieldset ou o grupo do botão de submit para inserir a seção do Spotify.");
        // Como fallback, poderia adicionar ao final do fieldset
        // DOM.fieldset.appendChild(sectionContainer);
      }
    },

    _setupEventListeners() {
      this.searchBtn.addEventListener('click', () => this.search());

      let searchTimeout;
      this.searchInput.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => this.search(), 500); // Debounce
      });
    },

    async search() {
      const query = this.searchInput.value.trim();
      if (!query) {
        this.showFeedback('Digite o nome da música ou artista para buscar.', 'info');
        return;
      }

      this._toggleLoading(true);
      try {
        const response = await fetch(`${this.backendUrl}/api/spotify/search?q=${encodeURIComponent(query)}`, {
          method: 'GET',
          headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: `Erro na requisição: ${response.statusText}` }));
          throw new Error(errorData.message || `Erro ${response.status}: ${response.statusText}`);
        }

        const tracks = await response.json();
        if (!Array.isArray(tracks)) {
          throw new Error('Resposta inválida do servidor: os dados das faixas não são um array.');
        }
        this._displayResults(tracks);

      } catch (error) {
        console.error('Erro na busca do Spotify:', error);
        let errorMessage = error.message;
        if (error.message.includes('Failed to fetch')) {
          errorMessage = `Não foi possível conectar ao servidor de música (${this.backendUrl}). Verifique sua conexão e tente novamente. [Detalhes técnicos no console]`;
           console.error(`Detalhes da falha 'Failed to fetch': URL: ${this.backendUrl}/api/spotify/search. Verifique se o backend está rodando, CORS, HTTP/HTTPS misto, SSL.`);
        }
        this.showFeedback(errorMessage, 'error');
      } finally {
        this._toggleLoading(false);
      }
    },

    _displayResults(tracks) {
      this.resultsContainer.innerHTML = ''; // Limpa resultados anteriores
      const oldSelectedFeedback = this.resultsContainer.querySelector('.selected-track-info');
      if (oldSelectedFeedback) oldSelectedFeedback.remove();


      if (!tracks.length) {
        this.showFeedback('Nenhuma música encontrada com esse termo. Tente outra busca.', 'info');
        return;
      }

      const fragment = document.createDocumentFragment();
      tracks.forEach(track => {
        if(track) { // Adiciona verificação para track nula se formatTrackData no backend puder retornar null
            const trackElement = this._createTrackElement(track);
            fragment.appendChild(trackElement);
        }
      });
      this.resultsContainer.appendChild(fragment);
    },

    _createTrackElement(track) {
      const element = document.createElement('div');
      element.className = 'spotify-track';
      element.innerHTML = `
        <img src="${track.albumImage || 'placeholder-album.png'}" alt="Capa do álbum ${track.albumName || 'Desconhecido'}" 
             class="track-image" width="60" height="60" loading="lazy" />
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
        const audioPlayerEl = AudioPlayerManager.createPlayer(track, 'track');
        playerContainer.appendChild(audioPlayerEl);
      }

      element.querySelector('.select-track-btn')
        .addEventListener('click', () => this._selectTrack(track, element));
      
      return element;
    },

    _selectTrack(track, selectedElement) {
      // Limpa feedback de seleção anterior se estiver dentro do resultsContainer
      const oldFeedback = this.resultsContainer.querySelector('.selected-track-info');
      if (oldFeedback) oldFeedback.remove();

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
      const feedbackDiv = document.createElement('div');
      feedbackDiv.className = 'selected-track-info feedback feedback--success';
      feedbackDiv.innerHTML = `
          Música selecionada: <strong>${track.name}</strong> - ${track.artists ? track.artists.join(', ') : ''}
          ${track.previewUrl ? '<br><em>Prévias de 30 segundos podem estar disponíveis.</em>' : '<br><em>Esta música não possui prévia de áudio.</em>'}
      `;
      // Insere o feedback acima dos resultados da busca
      this.resultsContainer.insertAdjacentElement('beforebegin', feedbackDiv);
    },

    showFeedback(message, type = 'info') {
      // Limpa feedback de seleção anterior, pois este feedback geral deve substituí-lo
      const oldSelectedFeedback = DOM.fieldset.querySelector('.selected-track-info'); // Procura em um escopo mais amplo
      if (oldSelectedFeedback) oldSelectedFeedback.remove();
      
      this.resultsContainer.innerHTML = `<div class="feedback feedback--${type}">${message}</div>`;
    },

    _toggleLoading(isLoading) {
      this.searchBtn.disabled = isLoading;
      const searchIcon = this.searchBtn.querySelector('.search-icon');
      if (isLoading) {
        this.searchBtn.innerHTML = '<span class="btn__loading"></span> Buscando...';
      } else {
        this.searchBtn.innerHTML = '<span class="search-icon">🔍</span> Buscar';
      }
    }
  };

  /**
   * @namespace FormManager
   * @description Gerencia a submissão do formulário e a prévia do cartão.
   */
  const FormManager = {
    backendUrl: AppConfig.getBackendUrl(),

    init() {
      if (!DOM.form || !DOM.submitBtn || !DOM.nomeInput || !DOM.mensagemInput) {
        console.error('FormManager: Elementos essenciais do formulário não encontrados.');
        return;
      }
      this._setupEventListeners();
      this._setCurrentYear();
    },

    _setupEventListeners() {
      DOM.form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await this._handleSubmit();
      });
    },

    async _handleSubmit() {
      const nome = DOM.nomeInput.value.trim();
      const mensagem = DOM.mensagemInput.value.trim();

      if (!nome || !mensagem) {
        // SUGESTÃO: Usar um sistema de notificação da UI.
        alert('Por favor, preencha os campos Nome e Mensagem.');
        return;
      }

      const formData = new FormData();
      formData.append('nome', nome);
      formData.append('mensagem', mensagem);
      if (DOM.dataInput.value) formData.append('data', DOM.dataInput.value);
      if (DOM.fotoInput.files[0]) formData.append('foto', DOM.fotoInput.files[0]);
      
      const selectedTrackId = document.getElementById('selectedSpotifyTrack')?.value;
      const previewUrl = document.getElementById('previewUrl')?.value;

      if (selectedTrackId) formData.append('spotify', selectedTrackId);
      if (previewUrl) formData.append('previewUrl', previewUrl);

      DOM.submitBtn.classList.add('loading');
      DOM.submitBtn.disabled = true;
      DOM.submitBtn.innerHTML = '<span class="btn__loading"></span> Enviando...';

      try {
        console.log('Enviando formulário com dados:', Object.fromEntries(formData));
        const response = await fetch(`${this.backendUrl}/api/cards`, {
          method: 'POST',
          body: formData
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: `Erro na requisição: ${response.statusText}` }));
          throw new Error(errorData.message || `Erro ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Cartão criado:', data);
        this._showCardPreview(data.cardData, data.viewLink); // Passa o viewLink

        // Limpar formulário após sucesso
        DOM.form.reset();
        PhotoManager.removePhoto();
        const spotifyResultsContainer = document.getElementById('spotifyResults');
        const selectedTrackInfo = DOM.fieldset.querySelector('.selected-track-info');
        if (spotifyResultsContainer) spotifyResultsContainer.innerHTML = '';
        if (selectedTrackInfo) selectedTrackInfo.remove();
        document.getElementById('selectedSpotifyTrack').value = '';
        document.getElementById('previewUrl').value = '';


      } catch (error) {
        console.error('Erro ao enviar formulário:', error);
        let errorMessage = error.message;
        if (error.message.includes('Failed to fetch')) {
          errorMessage = `Não foi possível conectar ao servidor (${this.backendUrl}) para enviar seu cartão. Verifique sua conexão e tente novamente. [Detalhes técnicos no console]`;
           console.error(`Detalhes da falha 'Failed to fetch': URL: ${this.backendUrl}/api/cards. Verifique se o backend está rodando, CORS, HTTP/HTTPS misto, SSL.`);
        }
        // SUGESTÃO: Usar um sistema de notificação da UI.
        alert(`Erro ao enviar: ${errorMessage}`);
      } finally {
        DOM.submitBtn.classList.remove('loading');
        DOM.submitBtn.disabled = false;
        DOM.submitBtn.textContent = 'Criar Cartão Mensagem';
      }
    },

    _showCardPreview(cardData, viewLink) {
      const existingPreview = document.querySelector('.card-preview-wrapper');
      if (existingPreview) existingPreview.remove();

      const previewWrapper = document.createElement('div');
      previewWrapper.className = 'card-preview-wrapper';

      const previewContainer = document.createElement('div');
      previewContainer.className = 'card-preview';
      
      let dataFormatada = 'Não especificada';
      if (cardData.data) {
          try {
              const [year, month, day] = cardData.data.split('-');
              if(year && month && day) dataFormatada = `${day}/${month}/${year}`;
              else dataFormatada = cardData.data; // Se o formato não for o esperado
          } catch (e) {
              dataFormatada = cardData.data;
          }
      }
      
      previewContainer.innerHTML = `
        <div class="card-preview-header">
          <h2>Cartão Criado com Sucesso!</h2>
          <button type="button" class="close-preview-btn" aria-label="Fechar prévia">&times;</button>
        </div>
        <p><strong>Para:</strong> ${cardData.nome}</p>
        <p><strong>Data:</strong> ${dataFormatada}</p>
        <p><strong>Mensagem:</strong> ${cardData.mensagem.replace(/\n/g, '<br>')}</p>
        ${cardData.fotoUrl ? `<div class="preview-image-container"><img src="${cardData.fotoUrl}" alt="Foto do cartão" class="preview-image" /></div>` : ''}
        <div class="preview-audio-container">
          ${cardData.previewUrl ? `<h3>Música Selecionada:</h3>` : ''}
        </div>
        <p class="preview-link-info">Seu cartão está pronto! Você pode visualizá-lo e compartilhá-lo através do link: 
            <a href="${viewLink}" target="_blank" rel="noopener noreferrer">${viewLink}</a>
        </p>
        <button type="button" class="btn btn--secondary close-preview-btn-bottom">Fechar Prévia</button>
      `;

      if (cardData.previewUrl) {
        const audioContainer = previewContainer.querySelector('.preview-audio-container');
        const audioPlayerEl = AudioPlayerManager.createPlayer({ name: cardData.nome, previewUrl: cardData.previewUrl }, 'card');
        audioContainer.appendChild(audioPlayerEl);
      }
      
      previewContainer.querySelectorAll('.close-preview-btn, .close-preview-btn-bottom').forEach(btn => {
        btn.addEventListener('click', () => previewWrapper.remove());
      });

      previewWrapper.appendChild(previewContainer);
      document.body.appendChild(previewWrapper);
      previewWrapper.scrollIntoView({ behavior: 'smooth', block: 'center' });
    },

    _setCurrentYear() {
      if (DOM.currentYear) {
        DOM.currentYear.textContent = new Date().getFullYear();
      }
    }
  };

  /**
   * @namespace App
   * @description Ponto de entrada e inicialização da aplicação.
   */
  const App = {
    init: function() {
      console.log('Aplicação Messagelove inicializando...');
      // Inicializa os módulos que dependem do DOM estar pronto.
      PhotoManager.init();
      Spotify.init(); // Cria e insere sua própria seção
      FormManager.init();

      // Se você adicionou a inicialização do tsparticles (efeito de fundo)
      if (typeof tsParticles !== 'undefined' && typeof initParticles === 'function') {
        // initParticles(); // Descomente se initParticles estiver definida globalmente ou dentro desta IIFE
      }
      console.log('Aplicação pronta.');
    }
  };

  // Inicializa a aplicação quando o DOM estiver completamente carregado.
  document.addEventListener('DOMContentLoaded', App.init);

  // Expor o App globalmente se necessário para debug ou chamadas externas (opcional)
  // window.MessageloveApp = App;

})(window, document); // Passa window e document para a IIFE para minificação e acesso mais rápido