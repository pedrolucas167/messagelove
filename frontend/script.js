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
  spotifySection: document.querySelector('[data-js="spotify-section"]')
};

const PhotoManager = {
  init() {
    if (!DOM.fotoInput || !DOM.fotoPreview || !DOM.removeFotoBtn || !DOM.previewContainer) {
      console.error('Elementos de upload de foto não encontrados:', {
        fotoInput: !!DOM.fotoInput,
        fotoPreview: !!DOM.fotoPreview,
        removeFotoBtn: !!DOM.removeFotoBtn,
        previewContainer: !!DOM.previewContainer
      });
      return;
    }
    this.setupEventListeners();
  },

  setupEventListeners() {
    DOM.fotoInput.addEventListener('change', () => this.handleFileSelect());
    DOM.removeFotoBtn.addEventListener('click', () => this.removePhoto());
  },

  handleFileSelect() {
    const file = DOM.fotoInput.files[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      alert('Por favor, selecione uma imagem JPG ou PNG.');
      DOM.fotoInput.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('A imagem deve ter no máximo 5MB.');
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
    DOM.fotoPreview.src = '';
    DOM.fotoPreview.style.display = 'none';
    DOM.removeFotoBtn.style.display = 'none';
    DOM.previewContainer.hidden = true;
  }
};

const Spotify = {
  init() {
    this.section = this.createSection();
    this.insertSection();
    
    this.searchInput = document.getElementById('spotifySearch');
    this.searchBtn = document.getElementById('searchSpotifyBtn');
    this.resultsContainer = document.getElementById('spotifyResults');
    this.selectedTrackInput = document.getElementById('selectedSpotifyTrack');
    this.previewUrlInput = document.getElementById('previewUrl');
    
    if (!this.searchInput || !this.searchBtn || !this.resultsContainer || !this.selectedTrackInput || !this.previewUrlInput) {
      console.error('Elementos do Spotify não encontrados:', {
        searchInput: !!this.searchInput,
        searchBtn: !!this.searchBtn,
        resultsContainer: !!this.resultsContainer,
        selectedTrackInput: !!this.selectedTrackInput,
        previewUrlInput: !!this.previewUrlInput
      });
      return;
    }
    
    console.log('Spotify inicializado com sucesso');
    this.setupEventListeners();
  },

  createSection() {
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
    return container;
  },

  insertSection() {
    DOM.fieldset.insertBefore(this.section, DOM.submitBtn.closest('.form-group'));
    console.log('Seção do Spotify inserida no DOM');
  },

  setupEventListeners() {
    this.searchBtn.addEventListener('click', () => {
      console.log('Botão de busca clicado');
      this.search();
    });
    let timeout;
    this.searchInput.addEventListener('input', () => {
      console.log('Input detectado:', this.searchInput.value);
      clearTimeout(timeout);
      timeout = setTimeout(() => this.search(), 500);
    });
  },

  async search() {
    const query = this.searchInput.value.trim();
    
    if (!query) {
      this.showFeedback('Digite o nome da música ou artista', 'error');
      return;
    }

    try {
      this.toggleLoading(true);
      console.log('Iniciando busca com query:', query);
      
      const response = await fetch(`https://localhost:3001/api/spotify/search?q=${encodeURIComponent(query)}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Resposta do backend:', {
        status: response.status,
        statusText: response.statusText,
        url: response.url
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Erro na resposta:', errorData);
        throw new Error(errorData.message || `Erro ${response.status}: ${response.statusText}`);
      }

      const tracks = await response.json();
      console.log('Faixas recebidas:', tracks);
      
      if (!Array.isArray(tracks)) {
        throw new Error('Resposta inválida do servidor: não é um array');
      }
      
      this.displayResults(tracks);
    } catch (error) {
      console.error('Erro na busca:', error);
      let errorMessage = error.message;
      if (error.message.includes('Failed to fetch')) {
        errorMessage = 'Não foi possível conectar ao servidor em https://localhost:3001/api/spotify/search. Verifique se: 1) O backend está rodando com HTTPS na porta 3001; 2) O CORS está configurado para http://127.0.0.1:5500; 3) Não há bloqueios devido a HTTP/HTTPS misto; 4) Os certificados SSL estão válidos.';
      }
      this.showFeedback(errorMessage, 'error');
    } finally {
      this.toggleLoading(false);
    }
  },

  displayResults(tracks) {
    this.resultsContainer.innerHTML = '';
    console.log('Exibindo resultados:', tracks.length);
    
    if (!tracks.length) {
      this.showFeedback('Nenhuma música encontrada. Tente outro termo.', 'info');
      return;
    }

    const fragment = document.createDocumentFragment();
    
    tracks.forEach(track => {
      const trackElement = this.createTrackElement(track);
      fragment.appendChild(trackElement);
    });
    
    this.resultsContainer.appendChild(fragment);
    console.log('Resultados inseridos no DOM');
  },

  createTrackElement(track) {
    const element = document.createElement('div');
    element.className = 'spotify-track';
    element.innerHTML = `
      <img src="${track.albumImage}" alt="Capa do álbum ${track.albumName}" 
           class="track-image" width="60" height="60" />
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
      <button type="button" class="btn select-track-btn" 
              data-track-id="${track.id}" aria-label="Selecionar ${track.name}">
        Selecionar
      </button>
    `;
    
    const audioElement = element.querySelector('.track-preview');
    const playPauseBtn = element.querySelector('.play-pause-btn');
    const playIcon = element.querySelector('.play-icon');
    const pauseIcon = element.querySelector('.pause-icon');
    const progressBar = element.querySelector('.progress');
    const durationElement = element.querySelector('.duration');
    const errorElement = element.querySelector('.preview-error');
    
    if (audioElement) {
      audioElement.addEventListener('loadedmetadata', () => {
        durationElement.textContent = `0:00 / ${formatTime(audioElement.duration)}`;
      });

      audioElement.addEventListener('timeupdate', () => {
        const currentTime = audioElement.currentTime;
        const duration = audioElement.duration || 30;
        const progressPercent = (currentTime / duration) * 100;
        progressBar.style.width = `${progressPercent}%`;
        durationElement.textContent = `${formatTime(currentTime)} / ${formatTime(duration)}`;
      });

      audioElement.addEventListener('ended', () => {
        playPauseBtn.setAttribute('aria-label', `Tocar prévia de ${track.name}`);
        playIcon.style.display = 'inline';
        pauseIcon.style.display = 'none';
        audioElement.currentTime = 0;
        progressBar.style.width = '0%';
      });

      audioElement.addEventListener('play', () => {
        document.querySelectorAll('.track-preview').forEach(otherAudio => {
          if (otherAudio !== audioElement) {
            otherAudio.pause();
            otherAudio.currentTime = 0;
            const otherBtn = otherAudio.closest('.audio-player').querySelector('.play-pause-btn');
            otherBtn.querySelector('.play-icon').style.display = 'inline';
            otherBtn.querySelector('.pause-icon').style.display = 'none';
            otherBtn.setAttribute('aria-label', `Tocar prévia de ${otherAudio.closest('.spotify-track').querySelector('.track-name').textContent}`);
          }
        });
      });

      audioElement.addEventListener('error', () => {
        console.error(`Erro ao reproduzir prévia para ${track.name}:`, audioElement.error);
        errorElement.style.display = 'block';
        audioElement.closest('.audio-player').style.display = 'none';
      });

      playPauseBtn.addEventListener('click', () => {
        if (audioElement.paused) {
          audioElement.play();
          playPauseBtn.setAttribute('aria-label', `Pausar prévia de ${track.name}`);
          playIcon.style.display = 'none';
          pauseIcon.style.display = 'inline';
        } else {
          audioElement.pause();
          playPauseBtn.setAttribute('aria-label', `Tocar prévia de ${track.name}`);
          playIcon.style.display = 'inline';
          pauseIcon.style.display = 'none';
        }
      });
    }

    element.querySelector('.select-track-btn')
      .addEventListener('click', () => this.selectTrack(track, element));
    
    return element;
  },

  selectTrack(track, element) {
    document.querySelectorAll('.spotify-track').forEach(el => {
      el.classList.remove('selected');
      el.querySelector('.select-track-btn').textContent = 'Selecionar';
    });
    
    element.classList.add('selected');
    element.querySelector('.select-track-btn').textContent = 'Selecionado ✓';
    this.selectedTrackInput.value = track.id;
    this.previewUrlInput.value = track.previewUrl || '';
    
    this.showSelectedTrackFeedback(track);
  },

  showSelectedTrackFeedback(track) {
    this.resultsContainer.insertAdjacentHTML('afterbegin',
      `<div class="selected-track-info">
        Música selecionada: <strong>${track.name}</strong> - ${track.artists.join(', ')}
        ${track.previewUrl ? '<br><em>Prévia disponível</em>' : '<br><em>Esta música não tem prévia disponível.</em>'}
      </div>`
    );
    console.log('Feedback de música selecionada exibido:', track.name);
  },

  showFeedback(message, type = 'info') {
    this.resultsContainer.innerHTML = 
      `<div class="feedback feedback--${type}">${message}</div>`;
    console.log(`Feedback exibido: ${type} - ${message}`);
  },

  toggleLoading(isLoading) {
    this.searchBtn.disabled = isLoading;
    this.searchBtn.innerHTML = isLoading 
      ? '<span class="btn__loading"></span> Buscando...' 
      : 'Buscar';
    console.log('Estado de loading:', isLoading);
  }
};

const FormManager = {
  init() {
    if (!DOM.form || !DOM.submitBtn || !DOM.nomeInput || !DOM.mensagemInput) {
      console.error('Elementos do formulário não encontrados:', {
        form: !!DOM.form,
        submitBtn: !!DOM.submitBtn,
        nomeInput: !!DOM.nomeInput,
        mensagemInput: !!DOM.mensagemInput
      });
      return;
    }
    this.setupEventListeners();
    this.setCurrentYear();
  },

  setupEventListeners() {
    DOM.form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.handleSubmit();
    });
  },

  async handleSubmit() {
    const nome = DOM.nomeInput.value.trim();
    const mensagem = DOM.mensagemInput.value.trim();

    if (!nome || !mensagem) {
      alert('Por favor, preencha os campos Nome e Mensagem.');
      return;
    }

    const formData = new FormData();
    formData.append('nome', nome);
    formData.append('mensagem', mensagem);
    if (DOM.dataInput.value) formData.append('data', DOM.dataInput.value);
    if (DOM.fotoInput.files[0]) formData.append('foto', DOM.fotoInput.files[0]);
    if (DOM.selectedTrackInput?.value) formData.append('spotify', DOM.selectedTrackInput.value);
    if (DOM.previewUrlInput?.value) formData.append('previewUrl', DOM.previewUrlInput.value);

    try {
      DOM.submitBtn.classList.add('loading');
      DOM.submitBtn.disabled = true;

      console.log('Enviando formulário com dados:', {
        nome,
        mensagem,
        data: DOM.dataInput.value,
        hasFoto: !!DOM.fotoInput.files[0],
        spotify: DOM.selectedTrackInput?.value,
        previewUrl: DOM.previewUrlInput?.value
      });


      const spotifyResponse = await fetch(`${process.env.BACKEND_URL || 'https://messagelove-backend.onrender.com'}/api/spotify/search?q=${encodeURIComponent(query)}`, {
  method: 'GET',
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  }
});


const response = await fetch(`${process.env.BACKEND_URL || 'https://messagelove-backend.onrender.com'}/api/cards`, {
  method: 'POST',
  body: formData
});

      console.log('Resposta do envio:', {
        status: response.status,
        statusText: response.statusText,
        url: response.url
      });

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
        errorMessage = 'Não foi possível conectar ao servidor em https://messagelove-backend.onrender.com/api/cards. Verifique se o backend está rodando com HTTPS e se o CORS está configurado para http://127.0.0.1:5500.';
      }
      alert(`Erro: ${errorMessage}`);
    } finally {
      DOM.submitBtn.classList.remove('loading');
      DOM.submitBtn.disabled = false;
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
    const playPauseBtn = previewContainer.querySelector('.play-pause-btn');
    const playIcon = previewContainer.querySelector('.play-icon');
    const pauseIcon = previewContainer.querySelector('.pause-icon');
    const progressBar = previewContainer.querySelector('.progress');
    const durationElement = previewContainer.querySelector('.duration');
    const errorElement = previewContainer.querySelector('.preview-error');
    
    if (audioElement) {
      audioElement.addEventListener('loadedmetadata', () => {
        durationElement.textContent = `0:00 / ${formatTime(audioElement.duration)}`;
      });

      audioElement.addEventListener('timeupdate', () => {
        const currentTime = audioElement.currentTime;
        const duration = audioElement.duration || 30;
        const progressPercent = (currentTime / duration) * 100;
        progressBar.style.width = `${progressPercent}%`;
        durationElement.textContent = `${formatTime(currentTime)} / ${formatTime(duration)}`;
      });

      audioElement.addEventListener('ended', () => {
        playPauseBtn.setAttribute('aria-label', 'Tocar prévia');
        playIcon.style.display = 'inline';
        pauseIcon.style.display = 'none';
        audioElement.currentTime = 0;
        progressBar.style.width = '0%';
      });

      audioElement.addEventListener('error', () => {
        console.error('Erro ao reproduzir prévia no cartão:', audioElement.error);
        errorElement.style.display = 'block';
        audioElement.closest('.audio-player').style.display = 'none';
      });

      playPauseBtn.addEventListener('click', () => {
        if (audioElement.paused) {
          audioElement.play();
          playPauseBtn.setAttribute('aria-label', 'Pausar prévia');
          playIcon.style.display = 'none';
          pauseIcon.style.display = 'inline';
        } else {
          audioElement.pause();
          playPauseBtn.setAttribute('aria-label', 'Tocar prévia');
          playIcon.style.display = 'inline';
          pauseIcon.style.display = 'none';
        }
      });
    }

    document.body.appendChild(previewContainer);
  },

  setCurrentYear() {
    if (DOM.currentYear) {
      DOM.currentYear.textContent = new Date().getFullYear();
    }
  }
};

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
}

function init() {
  console.log('Inicializando aplicação...');
  setTimeout(() => {
    PhotoManager.init();
    Spotify.init();
    FormManager.init();
  }, 100);
}

init();