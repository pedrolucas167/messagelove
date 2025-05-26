// SUGESTÃO: Definir URLs base do backend de forma centralizada ou garantir
// que process.env.BACKEND_URL seja injetado corretamente se usado.
// Exemplo de como você já faz com fallback, o que é bom:
const FALLBACK_BACKEND_URL = 'https://messagelove-backend.onrender.com';
const LOCAL_DEV_BACKEND_URL = 'https://localhost:3001'; // Para desenvolvimento local do backend do Spotify

// Você pode querer uma forma de alternar entre elas ou usar uma única URL base configurável.
// Por ora, vou usar a estrutura que você tem no FormManager para o Spotify também.

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
  // spotifySection: document.querySelector('[data-js="spotify-section"]') // Ver nota abaixo
  // SUGESTÃO: Se a seção do Spotify é sempre criada dinamicamente,
  // este seletor pode não ser necessário, ou poderia ser um placeholder
  // para onde a seção é inserida. Ex: spotifyInsertionPoint: document.getElementById('spotify-insertion-point')
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
      // SUGESTÃO: Usar um feedback visual integrado em vez de alert.
      alert('Por favor, selecione uma imagem JPG ou PNG.');
      DOM.fotoInput.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB
      // SUGESTÃO: Usar um feedback visual integrado em vez de alert.
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
  // Define a URL base da API do Spotify.
  // Use process.env se injetado por um build step, ou um fallback.
  // Para desenvolvimento, pode ser 'https://localhost:3001'. Para produção, o seu BACKEND_URL.
  // Aqui, estou usando a mesma lógica que você tem no FormManager,
  // assumindo que o mesmo backend lida com Spotify e Cards.
  // Se forem backends diferentes (ex: Spotify em localhost:3001 e Cards em onrender), ajuste conforme necessário.
  backendUrl: (typeof process !== 'undefined' && process.env && process.env.BACKEND_URL) || FALLBACK_BACKEND_URL,
  // Se o endpoint do Spotify estiver sempre em localhost:3001 durante o desenvolvimento, mesmo que o de cards esteja em outro lugar:
  // backendUrl: (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') ? LOCAL_DEV_BACKEND_URL : ((typeof process !== 'undefined' && process.env && process.env.BACKEND_URL) || FALLBACK_BACKEND_URL),


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
    // SUGESTÃO: Considerar um elemento placeholder mais estável para inserção se a estrutura do formulário mudar.
    // Ex: const placeholder = document.getElementById('spotify-section-placeholder');
    // if (placeholder) placeholder.appendChild(this.section);
    // else DOM.fieldset.insertBefore(this.section, DOM.submitBtn.closest('.form-group'));
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
      
      // MODIFICAÇÃO: Usar a URL do backend configurada.
      // Se o seu backend do Spotify estiver em localhost:3001 no desenvolvimento,
      // e o backend principal (para cards) estiver em outro lugar,
      // você pode precisar de uma configuração de URL diferente aqui.
      // Por simplicidade, estou usando a mesma `this.backendUrl` que seria usada para cards.
      // Se o Spotify sempre usa localhost:3001, você pode hardcodar ou usar uma constante específica.
      // Ex: const spotifyApiUrl = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') ? LOCAL_DEV_BACKEND_URL : this.backendUrl;
      const spotifyApiUrl = this.backendUrl; // Ajuste se necessário para seu setup.

      const response = await fetch(`${spotifyApiUrl}/api/spotify/search?q=${encodeURIComponent(query)}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Resposta do backend (Spotify search):', {
        status: response.status,
        statusText: response.statusText,
        url: response.url
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `Erro na requisição: ${response.statusText}` }));
        console.error('Erro na resposta (Spotify search):', errorData);
        throw new Error(errorData.message || `Erro ${response.status}: ${response.statusText}`);
      }

      const tracks = await response.json();
      console.log('Faixas recebidas:', tracks);
      
      if (!Array.isArray(tracks)) {
        console.error('Resposta inválida do servidor (Spotify search): não é um array', tracks);
        throw new Error('Resposta inválida do servidor: os dados das faixas não são um array.');
      }
      
      this.displayResults(tracks);
    } catch (error) {
      console.error('Erro na busca (Spotify search):', error);
      let errorMessage = error.message;
      if (error.message.includes('Failed to fetch')) {
        errorMessage = `Não foi possível conectar ao servidor em ${this.backendUrl}/api/spotify/search. Verifique se: 1) O backend está rodando (com HTTPS se necessário); 2) O CORS está configurado corretamente; 3) Não há bloqueios devido a HTTP/HTTPS misto; 4) Os certificados SSL estão válidos.`;
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

  // SUGESTÃO: A lógica do player de áudio é muito similar à de FormManager.showCardPreview.
  // Considere refatorar para uma função/classe helper reutilizável.
  // Ex: function createAudioPlayer(trackName, previewUrl, containerClass) { ... }
  createTrackElement(track) {
    const element = document.createElement('div');
    element.className = 'spotify-track';
    element.innerHTML = `
      <img src="${track.albumImage}" alt="Capa do álbum ${track.albumName}" 
           class="track-image" width="60" height="60" loading="lazy" />
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
              <div class="progress-bar-container">
                <div class="progress-bar"></div>
              </div>
              <span class="duration">0:00 / 0:30</span>
              <audio class="track-preview" preload="metadata">
                <source src="${track.previewUrl}" type="audio/mpeg">
                Seu navegador não suporta o elemento de áudio.
              </audio>
            </div>
            <div class="preview-error" style="display: none;">
              Não foi possível reproduzir a prévia.
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
    const progressBar = element.querySelector('.progress-bar'); // Modificado para pegar a barra interna
    const durationElement = element.querySelector('.duration');
    const errorElement = element.querySelector('.preview-error');
    
    if (audioElement && playPauseBtn) { // Adicionado verificação para playPauseBtn
      audioElement.addEventListener('loadedmetadata', () => {
        if (isFinite(audioElement.duration)) {
          durationElement.textContent = `0:00 / ${formatTime(audioElement.duration)}`;
        }
      });

      audioElement.addEventListener('timeupdate', () => {
        const currentTime = audioElement.currentTime;
        const duration = audioElement.duration;
        if (isFinite(duration) && duration > 0) {
          const progressPercent = (currentTime / duration) * 100;
          if (progressBar) progressBar.style.width = `${progressPercent}%`;
          durationElement.textContent = `${formatTime(currentTime)} / ${formatTime(duration)}`;
        }
      });

      audioElement.addEventListener('ended', () => {
        playPauseBtn.setAttribute('aria-label', `Tocar prévia de ${track.name}`);
        if (playIcon) playIcon.style.display = 'inline';
        if (pauseIcon) pauseIcon.style.display = 'none';
        audioElement.currentTime = 0;
        if (progressBar) progressBar.style.width = '0%';
      });

      audioElement.addEventListener('play', () => {
        document.querySelectorAll('audio.track-preview, audio.card-audio-preview').forEach(otherAudio => {
          if (otherAudio !== audioElement && !otherAudio.paused) {
            otherAudio.pause();
            // Resetar o botão do outro player
            const otherPlayerContainer = otherAudio.closest('.audio-player');
            if (otherPlayerContainer) {
                const otherBtn = otherPlayerContainer.querySelector('.play-pause-btn');
                const otherPlayIcon = otherPlayerContainer.querySelector('.play-icon');
                const otherPauseIcon = otherPlayerContainer.querySelector('.pause-icon');
                if (otherBtn && otherPlayIcon && otherPauseIcon) {
                    otherPlayIcon.style.display = 'inline';
                    otherPauseIcon.style.display = 'none';
                    otherBtn.setAttribute('aria-label', `Tocar prévia de ${otherAudio.closest('.spotify-track, .card-preview')?.querySelector('.track-name, h2+p strong')?.textContent || 'faixa'}`);
                }
            }
          }
        });
      });

      audioElement.addEventListener('error', () => {
        console.error(`Erro ao reproduzir prévia para ${track.name}:`, audioElement.error);
        if (errorElement) errorElement.style.display = 'block';
        const playerDiv = audioElement.closest('.audio-player');
        if (playerDiv) playerDiv.style.display = 'none';
      });

      playPauseBtn.addEventListener('click', () => {
        if (audioElement.paused) {
          audioElement.play().catch(e => {
            console.error("Erro ao tentar tocar o áudio:", e);
            if (errorElement) errorElement.style.display = 'block';
             const playerDiv = audioElement.closest('.audio-player');
             if (playerDiv) playerDiv.style.display = 'none';
          });
          playPauseBtn.setAttribute('aria-label', `Pausar prévia de ${track.name}`);
          if (playIcon) playIcon.style.display = 'none';
          if (pauseIcon) pauseIcon.style.display = 'inline';
        } else {
          audioElement.pause();
          playPauseBtn.setAttribute('aria-label', `Tocar prévia de ${track.name}`);
          if (playIcon) playIcon.style.display = 'inline';
          if (pauseIcon) pauseIcon.style.display = 'none';
        }
      });
    }

    element.querySelector('.select-track-btn')
      .addEventListener('click', () => this.selectTrack(track, element));
    
    return element;
  },

  selectTrack(track, element) {
    // Remover feedback antigo de seleção se houver
    const oldFeedback = this.resultsContainer.querySelector('.selected-track-info');
    if (oldFeedback) oldFeedback.remove();

    document.querySelectorAll('.spotify-track').forEach(el => {
      el.classList.remove('selected');
      const btn = el.querySelector('.select-track-btn');
      if (btn) btn.textContent = 'Selecionar';
    });
    
    element.classList.add('selected');
    const selectBtn = element.querySelector('.select-track-btn');
    if (selectBtn) selectBtn.textContent = 'Selecionado ✓';
    
    this.selectedTrackInput.value = track.id;
    this.previewUrlInput.value = track.previewUrl || '';
    
    this.showSelectedTrackFeedback(track);
  },

  showSelectedTrackFeedback(track) {
    // Insere o feedback como o primeiro filho do resultsContainer
    // para que apareça acima dos resultados da busca.
    const feedbackDiv = document.createElement('div');
    feedbackDiv.className = 'selected-track-info feedback feedback--success'; // Adicionei classes de feedback
    feedbackDiv.innerHTML = `
        Música selecionada: <strong>${track.name}</strong> - ${track.artists.join(', ')}
        ${track.previewUrl ? '<br><em>Prévia disponível</em>' : '<br><em>Esta música não tem prévia disponível.</em>'}
    `;
    this.resultsContainer.insertAdjacentElement('afterbegin', feedbackDiv);
    console.log('Feedback de música selecionada exibido:', track.name);
  },

  showFeedback(message, type = 'info') {
    // Limpa o feedback de seleção se houver, para não acumular.
    const oldSelectedFeedback = this.resultsContainer.querySelector('.selected-track-info');
    if (oldSelectedFeedback) oldSelectedFeedback.remove();
    
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
  // Define a URL base da API de Cards.
  // Use process.env se injetado, ou um fallback.
  backendUrl: (typeof process !== 'undefined' && process.env && process.env.BACKEND_URL) || FALLBACK_BACKEND_URL,

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
      // SUGESTÃO: Usar um feedback visual integrado em vez de alert.
      alert('Por favor, preencha os campos Nome e Mensagem.');
      return;
    }

    const formData = new FormData();
    formData.append('nome', nome);
    formData.append('mensagem', mensagem);
    if (DOM.dataInput.value) formData.append('data', DOM.dataInput.value);
    if (DOM.fotoInput.files[0]) formData.append('foto', DOM.fotoInput.files[0]);
    
    // Acessar os inputs do Spotify através do DOM, pois o objeto Spotify pode não estar no escopo direto.
    const selectedTrackEl = document.getElementById('selectedSpotifyTrack');
    const previewUrlEl = document.getElementById('previewUrl');

    if (selectedTrackEl && selectedTrackEl.value) formData.append('spotify', selectedTrackEl.value);
    if (previewUrlEl && previewUrlEl.value) formData.append('previewUrl', previewUrlEl.value);


    try {
      DOM.submitBtn.classList.add('loading');
      DOM.submitBtn.disabled = true;
      DOM.submitBtn.innerHTML = '<span class="btn__loading"></span> Enviando...';


      console.log('Enviando formulário com dados:', Object.fromEntries(formData));

      // --- MODIFICAÇÃO: REMOVIDA CHAMADA FETCH DESNECESSÁRIA PARA SPOTIFY SEARCH ---
      // const spotifyResponse = await fetch(`${this.backendUrl}/api/spotify/search?q=${encodeURIComponent(query)}`, { ... }); 
      // Esta chamada não faz sentido aqui e a variável 'query' não está definida.

      const response = await fetch(`${this.backendUrl}/api/cards`, {
        method: 'POST',
        body: formData
        // Não defina 'Content-Type' manualmente para FormData; o navegador faz isso com o boundary correto.
      });

      console.log('Resposta do envio (cards):', {
        status: response.status,
        statusText: response.statusText,
        url: response.url
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `Erro na requisição: ${response.statusText}` }));
        console.error('Erro na resposta (cards):', errorData);
        throw new Error(errorData.message || `Erro ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Cartão criado:', data);

      // SUGESTÃO: Considerar limpar o formulário ou dar um feedback mais proeminente de sucesso.
      this.showCardPreview(data.cardData); 
      // DOM.form.reset(); // Exemplo de como limpar o formulário
      // PhotoManager.removePhoto(); // Limpar foto
      // Limpar seleção do Spotify se necessário
      // if (selectedTrackEl) selectedTrackEl.value = '';
      // if (previewUrlEl) previewUrlEl.value = '';
      // const spotifyResultsContainer = document.getElementById('spotifyResults');
      // if (spotifyResultsContainer) spotifyResultsContainer.innerHTML = '<p>Formulário enviado com sucesso!</p>';


    } catch (error) {
      console.error('Erro ao enviar formulário:', error);
      let errorMessage = error.message;
      if (error.message.includes('Failed to fetch')) {
        errorMessage = `Não foi possível conectar ao servidor em ${this.backendUrl}/api/cards. Verifique se o backend está rodando e acessível, e se as configurações de CORS permitem a origem do frontend.`;
      }
      // SUGESTÃO: Usar um feedback visual integrado em vez de alert.
      alert(`Erro ao enviar: ${errorMessage}`);
    } finally {
      DOM.submitBtn.classList.remove('loading');
      DOM.submitBtn.disabled = false;
      DOM.submitBtn.textContent = 'Criar Cartão'; // Restaura o texto original do botão
    }
  },

  // SUGESTÃO: A lógica do player de áudio é muito similar à de Spotify.createTrackElement.
  // Considere refatorar para uma função/classe helper reutilizável.
  showCardPreview(cardData) {
    // Remover prévia anterior se houver
    const existingPreview = document.querySelector('.card-preview-wrapper');
    if (existingPreview) existingPreview.remove();

    const previewWrapper = document.createElement('div');
    previewWrapper.className = 'card-preview-wrapper'; // Para poder remover/estilizar o container todo

    const previewContainer = document.createElement('div');
    previewContainer.className = 'card-preview';
    
    let dataFormatada = 'Não especificada';
    if (cardData.data) {
        try {
            // Tenta formatar a data assumindo que ela vem no formato YYYY-MM-DD
            const [year, month, day] = cardData.data.split('-');
            dataFormatada = `${day}/${month}/${year}`;
        } catch (e) {
            console.warn("Não foi possível formatar a data:", cardData.data);
            dataFormatada = cardData.data; // Usa o valor original se o split falhar
        }
    }
    
    previewContainer.innerHTML = `
      <div class="card-preview-header">
        <h2>Cartão Criado!</h2>
        <button type="button" class="close-preview-btn" aria-label="Fechar prévia">&times;</button>
      </div>
      <p><strong>Nome:</strong> ${cardData.nome}</p>
      <p><strong>Data:</strong> ${dataFormatada}</p>
      <p><strong>Mensagem:</strong> ${cardData.mensagem}</p>
      ${cardData.previewUrl ? `
        <div>
          <h3>Música Selecionada</h3>
          <div class="audio-player">
            <button class="play-pause-btn" aria-label="Tocar ou pausar prévia">
              <span class="play-icon">▶️</span>
              <span class="pause-icon" style="display: none;">⏸️</span>
            </button>
            <div class="progress-bar-container">
                <div class="progress-bar card-progress"></div>
            </div>
            <span class="duration card-duration">0:00 / 0:30</span>
            <audio class="card-audio-preview" preload="metadata">
              <source src="${cardData.previewUrl}" type="audio/mpeg">
              Seu navegador não suporta o elemento de áudio.
            </audio>
          </div>
          <div class="preview-error" style="display: none;">
            Não foi possível reproduzir a prévia.
          </div>
        </div>
      ` : ''}
      ${cardData.foto ? `<img src="${cardData.foto}" alt="Foto do cartão" class="preview-image" />` : ''}
      <p><small>Link do cartão: <a href="/card/${cardData.id}" target="_blank">/card/${cardData.id}</a></small></p>
    `;

    const audioElement = previewContainer.querySelector('.card-audio-preview');
    const playPauseBtn = previewContainer.querySelector('.play-pause-btn');
    const playIcon = previewContainer.querySelector('.play-icon');
    const pauseIcon = previewContainer.querySelector('.pause-icon');
    const progressBar = previewContainer.querySelector('.card-progress');
    const durationElement = previewContainer.querySelector('.card-duration');
    const errorElement = previewContainer.querySelector('.preview-error');
    const closeBtn = previewContainer.querySelector('.close-preview-btn');

    if (closeBtn) {
        closeBtn.addEventListener('click', () => previewWrapper.remove());
    }
    
    if (audioElement && playPauseBtn) {
      audioElement.addEventListener('loadedmetadata', () => {
        if (isFinite(audioElement.duration)) {
            durationElement.textContent = `0:00 / ${formatTime(audioElement.duration)}`;
        }
      });

      audioElement.addEventListener('timeupdate', () => {
        const currentTime = audioElement.currentTime;
        const duration = audioElement.duration;
        if (isFinite(duration) && duration > 0) {
            const progressPercent = (currentTime / duration) * 100;
            if (progressBar) progressBar.style.width = `${progressPercent}%`;
            durationElement.textContent = `${formatTime(currentTime)} / ${formatTime(duration)}`;
        }
      });

      audioElement.addEventListener('ended', () => {
        playPauseBtn.setAttribute('aria-label', 'Tocar prévia');
        if (playIcon) playIcon.style.display = 'inline';
        if (pauseIcon) pauseIcon.style.display = 'none';
        audioElement.currentTime = 0;
        if (progressBar) progressBar.style.width = '0%';
      });

      audioElement.addEventListener('error', () => {
        console.error('Erro ao reproduzir prévia no cartão:', audioElement.error);
        if (errorElement) errorElement.style.display = 'block';
        const playerDiv = audioElement.closest('.audio-player');
        if (playerDiv) playerDiv.style.display = 'none';
      });

      playPauseBtn.addEventListener('click', () => {
        if (audioElement.paused) {
          audioElement.play().catch(e => {
            console.error("Erro ao tentar tocar o áudio da prévia do cartão:", e);
            if (errorElement) errorElement.style.display = 'block';
            const playerDiv = audioElement.closest('.audio-player');
            if (playerDiv) playerDiv.style.display = 'none';
          });
          playPauseBtn.setAttribute('aria-label', 'Pausar prévia');
          if (playIcon) playIcon.style.display = 'none';
          if (pauseIcon) pauseIcon.style.display = 'inline';
        } else {
          audioElement.pause();
          playPauseBtn.setAttribute('aria-label', 'Tocar prévia');
          if (playIcon) playIcon.style.display = 'inline';
          if (pauseIcon) pauseIcon.style.display = 'none';
        }
      });
    }
    previewWrapper.appendChild(previewContainer);
    document.body.appendChild(previewWrapper); // Anexa o wrapper ao body
     // Scroll para a prévia
    previewWrapper.scrollIntoView({ behavior: 'smooth', block: 'center' });
  },

  setCurrentYear() {
    if (DOM.currentYear) {
      DOM.currentYear.textContent = new Date().getFullYear();
    }
  }
};

function formatTime(seconds) {
  if (!isFinite(seconds) || seconds < 0) return '0:00'; // Adiciona uma verificação
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
}

function initApp() { // Renomeado para evitar conflito com DOM.init se existir
  console.log('Inicializando aplicação...');
  // SUGESTÃO: Usar DOMContentLoaded para garantir que o DOM está pronto.
  // document.addEventListener('DOMContentLoaded', () => {
  //   PhotoManager.init();
  //   Spotify.init();
  //   FormManager.init();
  // });
  // O setTimeout pode ser uma forma de aguardar outros scripts ou renderizações,
  // mas DOMContentLoaded é geralmente mais robusto para inicialização baseada no DOM.
  setTimeout(() => {
    PhotoManager.init();
    Spotify.init();
    FormManager.init();
  }, 100); 
}

initApp(); // Chama a função de inicialização renomeada