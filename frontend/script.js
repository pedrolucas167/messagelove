// script.js
// Data: 25/05/2025, 05:50 PM -03

// Módulo para gerenciar elementos DOM
const DOM = {
  elements: {
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
    spotifySection: document.querySelector('[data-js="spotify-section"]')
  },

  validateElements(requiredElements) {
    const missingElements = Object.entries(requiredElements)
      .filter(([key, value]) => !value)
      .map(([key]) => key);
    if (missingElements.length) {
      console.error('Elementos DOM ausentes:', missingElements.join(', '));
      return false;
    }
    return true;
  },

  getElement(key) {
    return this.elements[key];
  }
};

// Módulo para gerenciar o áudio player (reutilizável)
const AudioPlayer = {
  initialize(audioElement, playPauseBtn, playIcon, pauseIcon, progressBar, durationElement, errorElement, trackName) {
    audioElement.addEventListener('loadedmetadata', () => {
      durationElement.textContent = `0:00 / ${this.formatTime(audioElement.duration)}`;
    });

    audioElement.addEventListener('timeupdate', () => {
      const currentTime = audioElement.currentTime;
      const duration = audioElement.duration || 30;
      const progressPercent = (currentTime / duration) * 100;
      progressBar.style.width = `${progressPercent}%`;
      durationElement.textContent = `${this.formatTime(currentTime)} / ${this.formatTime(duration)}`;
    });

    audioElement.addEventListener('ended', () => {
      playPauseBtn.setAttribute('aria-label', `Tocar prévia${trackName ? ` de ${trackName}` : ''}`);
      playIcon.style.display = 'inline';
      pauseIcon.style.display = 'none';
      audioElement.currentTime = 0;
      progressBar.style.width = '0%';
    });

    audioElement.addEventListener('play', () => {
      document.querySelectorAll('.track-preview, .card-audio-preview').forEach(otherAudio => {
        if (otherAudio !== audioElement) {
          otherAudio.pause();
          otherAudio.currentTime = 0;
          const otherBtn = otherAudio.closest('.audio-player').querySelector('.play-pause-btn');
          otherBtn.querySelector('.play-icon').style.display = 'inline';
          otherBtn.querySelector('.pause-icon').style.display = 'none';
          otherBtn.setAttribute('aria-label', `Tocar prévia${otherAudio.closest('.spotify-track') ? ` de ${otherAudio.closest('.spotify-track').querySelector('.track-name').textContent}` : ''}`);
        }
      });
    });

    audioElement.addEventListener('error', () => {
      console.error(`Erro ao reproduzir áudio${trackName ? ` para ${trackName}` : ''}:`, audioElement.error);
      errorElement.style.display = 'block';
      audioElement.closest('.audio-player').style.display = 'none';
    });

    playPauseBtn.addEventListener('click', () => {
      if (audioElement.paused) {
        audioElement.play();
        playPauseBtn.setAttribute('aria-label', `Pausar prévia${trackName ? ` de ${trackName}` : ''}`);
        playIcon.style.display = 'none';
        pauseIcon.style.display = 'inline';
      } else {
        audioElement.pause();
        playPauseBtn.setAttribute('aria-label', `Tocar prévia${trackName ? ` de ${trackName}` : ''}`);
        playIcon.style.display = 'inline';
        pauseIcon.style.display = 'none';
      }
    });
  },

  formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
  }
};

// Módulo para gerenciar upload de fotos
const PhotoManager = {
  requiredElements: {
    fotoInput: DOM.getElement('fotoInput'),
    fotoPreview: DOM.getElement('fotoPreview'),
    removeFotoBtn: DOM.getElement('removeFotoBtn'),
    previewContainer: DOM.getElement('previewContainer')
  },

  init() {
    if (!DOM.validateElements(this.requiredElements)) return;
    this.setupEventListeners();
  },

  setupEventListeners() {
    DOM.getElement('fotoInput').addEventListener('change', () => this.handleFileSelect());
    DOM.getElement('removeFotoBtn').addEventListener('click', () => this.removePhoto());
  },

  handleFileSelect() {
    const file = DOM.getElement('fotoInput').files[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      alert('Por favor, selecione uma imagem JPG ou PNG.');
      DOM.getElement('fotoInput').value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('A imagem deve ter no máximo 5MB.');
      DOM.getElement('fotoInput').value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      DOM.getElement('fotoPreview').src = reader.result;
      DOM.getElement('fotoPreview').style.display = 'block';
      DOM.getElement('removeFotoBtn').style.display = 'flex';
      DOM.getElement('previewContainer').hidden = false;
    };
    reader.readAsDataURL(file);
  },

  removePhoto() {
    DOM.getElement('fotoInput').value = '';
    DOM.getElement('fotoPreview').src = '';
    DOM.getElement('fotoPreview').style.display = 'none';
    DOM.getElement('removeFotoBtn').style.display = 'none';
    DOM.getElement('previewContainer').hidden = true;
  }
};

// Módulo para integração com o Spotify
const Spotify = {
  elements: {},

  init() {
    this.createAndInsertSection();
    this.setupElements();
    if (!this.validateElements()) return;
    console.log('Spotify inicializado com sucesso');
    this.setupEventListeners();
  },

  createAndInsertSection() {
    const container = document.createElement('div');
    container.innerHTML = `
      <div class="form-group">
        <label for="spotifySearch">Adicionar música do Spotify</label>
        <div class="spotify-search-container">
          <input type="text" id="spotifySearch" placeholder="Pesquisar música ou artista..." 
                 class="spotify-search-input" aria-label="Pesquisar música no Spotify" />
          <button type="button" id="searchSpotifyBtn" class="btn btn--spotify">
            Buscar
          </button>
        </div>
        <div id="spotifyResults" class="spotify-results" aria-live="polite"></div>
        <input type="hidden" id="selectedSpotifyTrack" name="spotify" />
        <input type="hidden" id="previewUrl" name="previewUrl" />
        <small class="field-hint">Busque e selecione uma música. Nem todas as músicas possuem prévia de 30 segundos.</small>
      </div>
    `;
    DOM.getElement('fieldset').insertBefore(container, DOM.getElement('submitBtn').closest('.form-group'));
    console.log('Seção do Spotify inserida no DOM');
  },

  setupElements() {
    this.elements = {
      searchInput: document.getElementById('spotifySearch'),
      searchBtn: document.getElementById('searchSpotifyBtn'),
      resultsContainer: document.getElementById('spotifyResults'),
      selectedTrackInput: document.getElementById('selectedSpotifyTrack'),
      previewUrlInput: document.getElementById('previewUrl')
    };
  },

  validateElements() {
    return DOM.validateElements(this.elements);
  },

  setupEventListeners() {
    this.elements.searchBtn.addEventListener('click', () => {
      console.log('Botão de busca clicado');
      this.search();
    });

    let timeout;
    this.elements.searchInput.addEventListener('input', () => {
      console.log('Input detectado:', this.elements.searchInput.value);
      clearTimeout(timeout);
      timeout = setTimeout(() => this.search(), 500);
    });
  },

  async search() {
    const query = this.elements.searchInput.value.trim();
    if (!query) {
      this.showFeedback('Digite o nome da música ou artista', 'error');
      return;
    }

    try {
      this.toggleLoading(true);
      console.log('Iniciando busca com query:', query);

      const response = await fetch(`${process.env.BACKEND_URL || 'https://messagelove-backend.onrender.com'}/api/spotify/search?q=${encodeURIComponent(query)}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      console.log('Resposta do backend:', { status: response.status, url: response.url });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Erro ${response.status}: ${response.statusText}`);
      }

      const tracks = await response.json();
      if (!Array.isArray(tracks)) throw new Error('Resposta inválida do servidor: não é um array');

      this.displayResults(tracks);
    } catch (error) {
      console.error('Erro na busca:', error);
      let errorMessage = error.message;
      if (error.message.includes('Failed to fetch')) {
        errorMessage = 'Não foi possível conectar ao servidor em https://messagelove-backend.onrender.com/api/spotify/search. Verifique se: 1) O backend está rodando; 2) O CORS está configurado para https://messagelove-frontend.vercel.app; 3) A conexão está estável.';
      }
      this.showFeedback(errorMessage, 'error');
    } finally {
      this.toggleLoading(false);
    }
  },

  displayResults(tracks) {
    this.elements.resultsContainer.innerHTML = '';
    console.log('Exibindo resultados:', tracks.length);

    if (!tracks.length) {
      this.showFeedback('Nenhuma música encontrada. Tente outro termo.', 'info');
      return;
    }

    const fragment = document.createDocumentFragment();
    tracks.forEach(track => fragment.appendChild(this.createTrackElement(track)));
    this.elements.resultsContainer.appendChild(fragment);
    console.log('Resultados inseridos no DOM');
  },

  createTrackElement(track) {
    const element = document.createElement('div');
    element.className = 'spotify-track';
    element.innerHTML = `
      <img src="${track.albumImage}" alt="Capa do álbum ${track.albumName}" class="track-image" width="60" height="60" />
      <div class="track-info">
        <h4 class="track-name">${track.name}</h4>
        <p class="track-artist">${track.artists.join(', ')}</p>
        <p class="track-album">${track.albumName}</p>
        <div class="preview-container">
          ${track.previewUrl ? `
            <div class="audio-player">
              <button class="play-pause-btn" aria-label="Tocar ou pausar prévia de ${track.name}">
                <span class="play-icon">▶️</span>
                <span class="pause-icon" style="display: none;">⏸️</span>
              </button>
              <div class="progress-bar">
                <div class="progress"></div>
              </div>
              <span class="duration">0:00 / 0:30</span>
              <audio class="track-preview" preload="metadata">
                <source src="${track.previewUrl}" type="audio/mpeg">
                Seu navegador não suporta o elemento de áudio.
              </audio>
            </div>
            <div class="preview-error" style="display: none;">
              Não foi possível reproduzir a prévia. Pode estar bloqueada na sua região.
            </div>
          ` : '<span class="no-preview-text" aria-label="Prévia não disponível">Sem prévia</span>'}
        </div>
      </div>
      <button type="button" class="btn select-track-btn" data-track-id="${track.id}" aria-label="Selecionar ${track.name}">
        Selecionar
      </button>
    `;

    const audioElement = element.querySelector('.track-preview');
    if (audioElement) {
      AudioPlayer.initialize(
        audioElement,
        element.querySelector('.play-pause-btn'),
        element.querySelector('.play-icon'),
        element.querySelector('.pause-icon'),
        element.querySelector('.progress'),
        element.querySelector('.duration'),
        element.querySelector('.preview-error'),
        track.name
      );
    }

    element.querySelector('.select-track-btn').addEventListener('click', () => this.selectTrack(track, element));
    return element;
  },

  selectTrack(track, element) {
    document.querySelectorAll('.spotify-track').forEach(el => {
      el.classList.remove('selected');
      el.querySelector('.select-track-btn').textContent = 'Selecionar';
    });

    element.classList.add('selected');
    element.querySelector('.select-track-btn').textContent = 'Selecionado ✓';
    this.elements.selectedTrackInput.value = track.id;
    this.elements.previewUrlInput.value = track.previewUrl || '';
    this.showSelectedTrackFeedback(track);
  },

  showSelectedTrackFeedback(track) {
    this.elements.resultsContainer.insertAdjacentHTML('afterbegin',
      `<div class="selected-track-info">
        Música selecionada: <strong>${track.name}</strong> - ${track.artists.join(', ')}
        ${track.previewUrl ? '<br><em>Prévia disponível</em>' : '<br><em>Esta música não tem prévia disponível.</em>'}
      </div>`
    );
    console.log('Feedback de música selecionada exibido:', track.name);
  },

  showFeedback(message, type = 'info') {
    this.elements.resultsContainer.innerHTML = `<div class="feedback feedback--${type}">${message}</div>`;
    console.log(`Feedback exibido: ${type} - ${message}`);
  },

  toggleLoading(isLoading) {
    this.elements.searchBtn.disabled = isLoading;
    this.elements.searchBtn.innerHTML = isLoading ? '<span class="btn__loading"></span> Buscando...' : 'Buscar';
    console.log('Estado de loading:', isLoading);
  }
};

// Módulo para gerenciar o formulário
const FormManager = {
  requiredElements: {
    form: DOM.getElement('form'),
    submitBtn: DOM.getElement('submitBtn'),
    nomeInput: DOM.getElement('nomeInput'),
    mensagemInput: DOM.getElement('mensagemInput')
  },

  init() {
    if (!DOM.validateElements(this.requiredElements)) return;
    this.setupEventListeners();
    this.setCurrentYear();
  },

  setupEventListeners() {
    DOM.getElement('form').addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.handleSubmit();
    });
  },

  async handleSubmit() {
    const nome = DOM.getElement('nomeInput').value.trim();
    const mensagem = DOM.getElement('mensagemInput').value.trim();

    if (!nome || !mensagem) {
      alert('Por favor, preencha os campos Nome e Mensagem.');
      return;
    }

    const formData = new FormData();
    formData.append('nome', nome);
    formData.append('mensagem', mensagem);
    if (DOM.getElement('dataInput').value) formData.append('data', DOM.getElement('dataInput').value);
    if (DOM.getElement('fotoInput').files[0]) formData.append('foto', DOM.getElement('fotoInput').files[0]);
    if (Spotify.elements.selectedTrackInput?.value) formData.append('spotify', Spotify.elements.selectedTrackInput.value);
    if (Spotify.elements.previewUrlInput?.value) formData.append('previewUrl', Spotify.elements.previewUrlInput.value);

    try {
      DOM.getElement('submitBtn').classList.add('loading');
      DOM.getElement('submitBtn').disabled = true;

      console.log('Enviando formulário com dados:', {
        nome,
        mensagem,
        data: DOM.getElement('dataInput').value,
        hasFoto: !!DOM.getElement('fotoInput').files[0],
        spotify: Spotify.elements.selectedTrackInput?.value,
        previewUrl: Spotify.elements.previewUrlInput?.value
      });

      const response = await fetch(`${process.env.BACKEND_URL || 'https://messagelove-backend.onrender.com'}/api/cards`, {
        method: 'POST',
        body: formData
      });

      console.log('Resposta do envio:', { status: response.status, url: response.url });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Erro ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Cartão criado:', data);
      this.showCardPreview(data.cardData);
    } catch (error) {
      console.error('Erro ao enviar formulário:', error);
      let errorMessage = error.message;
      if (error.message.includes('Failed to fetch')) {
        errorMessage = 'Não foi possível conectar ao servidor em https://messagelove-backend.onrender.com/api/cards. Verifique se: 1) O backend está rodando; 2) O CORS está configurado para https://messagelove-frontend.vercel.app; 3) A conexão está estável.';
      }
      alert(`Erro: ${errorMessage}`);
    } finally {
      DOM.getElement('submitBtn').classList.remove('loading');
      DOM.getElement('submitBtn').disabled = false;
    }
  },

  showCardPreview(cardData) {
    const previewContainer = document.createElement('div');
    previewContainer.className = 'card-preview';
    previewContainer.innerHTML = `
      <h2>Prévia do Cartão</h2>
      <p><strong>Nome:</strong> ${cardData.nome}</p>
      <p><strong>Data:</strong> ${cardData.data || 'Não especificada'}</p>
      <p><strong>Mensagem:</strong> ${cardData.mensagem}</p>
      ${cardData.previewUrl ? `
        <div>
          <h3>Áudio</h3>
          <div class="audio-player">
            <button class="play-pause-btn" aria-label="Tocar ou pausar prévia">
              <span class="play-icon">▶️</span>
              <span class="pause-icon" style="display: none;">⏸️</span>
            </button>
            <div class="progress-bar">
              <div class="progress"></div>
            </div>
            <span class="duration">0:00 / 0:30</span>
            <audio class="card-audio-preview" preload="metadata">
              <source src="${cardData.previewUrl}" type="audio/mpeg">
              Seu navegador não suporta o elemento de áudio.
            </audio>
          </div>
          <div class="preview-error" style="display: none;">
            Não foi possível reproduzir a prévia. Pode estar bloqueada na sua região.
          </div>
        </div>
      ` : ''}
      ${cardData.foto ? `<img src="${cardData.foto}" alt="Foto do cartão" class="preview" />` : ''}
    `;

    const audioElement = previewContainer.querySelector('.card-audio-preview');
    if (audioElement) {
      AudioPlayer.initialize(
        audioElement,
        previewContainer.querySelector('.play-pause-btn'),
        previewContainer.querySelector('.play-icon'),
        previewContainer.querySelector('.pause-icon'),
        previewContainer.querySelector('.progress'),
        previewContainer.querySelector('.duration'),
        previewContainer.querySelector('.preview-error')
      );
    }

    document.body.appendChild(previewContainer);
  },

  setCurrentYear() {
    const currentYear = DOM.getElement('currentYear');
    if (currentYear) currentYear.textContent = new Date().getFullYear();
  }
};

// Inicialização
function init() {
  console.log('Inicializando aplicação...');
  setTimeout(() => {
    PhotoManager.init();
    Spotify.init();
    FormManager.init();
  }, 100);
}

init();