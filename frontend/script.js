document.addEventListener('DOMContentLoaded', function() {
  // Elementos DOM
  const form = document.getElementById('cardForm');
  const fotoInput = document.getElementById('fotoUpload');
  const audioInput = document.getElementById('audioUpload');
  const fotoPreview = document.getElementById('fotoPreview');
  const audioPreview = document.getElementById('audioPreview');
  const removeFotoBtn = document.getElementById('removeFoto');
  const removeAudioBtn = document.getElementById('removeAudio');
  const submitBtn = document.getElementById('submitBtn');
  const currentYear = document.getElementById('currentYear');
  
  // Configuração do Spotify
  const spotifySection = document.createElement('div');
  spotifySection.innerHTML = `
    <div class="form-group">
      <label>Adicionar música do Spotify</label>
      <div class="spotify-search-container">
        <input type="text" id="spotifySearch" placeholder="Pesquisar música no Spotify..." class="spotify-search-input" />
        <button type="button" id="searchSpotifyBtn" class="spotify-search-btn">Buscar</button>
      </div>
      <div id="spotifyResults" class="spotify-results"></div>
      <input type="hidden" id="selectedSpotifyTrack" name="spotify" />
      <small class="field-hint">Busque e selecione uma música diretamente do Spotify</small>
    </div>
  `;
  
  // Inserir a seção do Spotify antes do botão de submit
  const submitButton = form.querySelector('button[type="submit"]');
  form.querySelector('fieldset.form-section').appendChild(spotifySection);

  // Elementos do Spotify
  const spotifySearchInput = document.getElementById('spotifySearch');
  const searchSpotifyBtn = document.getElementById('searchSpotifyBtn');
  const spotifyResults = document.getElementById('spotifyResults');
  const selectedSpotifyTrack = document.getElementById('selectedSpotifyTrack');

  // Atualizar ano no footer
  currentYear.textContent = new Date().getFullYear();

  // Event Listeners
  fotoInput.addEventListener('change', handleFotoUpload);
  removeFotoBtn.addEventListener('click', clearFotoUpload);
  audioInput.addEventListener('change', handleAudioUpload);
  removeAudioBtn.addEventListener('click', clearAudioUpload);
  searchSpotifyBtn.addEventListener('click', searchSpotify);
  spotifySearchInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') searchSpotify();
  });
  form.addEventListener('submit', handleFormSubmit);

  // Funções de manipulação de arquivos
  function handleFotoUpload() {
    const file = fotoInput.files[0];
    if (file && file.type.match('image.*')) {
      if (file.size > 5 * 1024 * 1024) {
        alert('A imagem deve ter no máximo 5MB');
        clearFotoUpload();
        return;
      }

      const reader = new FileReader();
      reader.onload = e => {
        fotoPreview.src = e.target.result;
        fotoPreview.style.display = 'block';
        removeFotoBtn.style.display = 'block';
      };
      reader.readAsDataURL(file);
    } else if (file) {
      alert('Por favor, selecione um arquivo de imagem válido (JPG, PNG)');
      clearFotoUpload();
    }
  }

  function clearFotoUpload() {
    fotoInput.value = '';
    fotoPreview.src = '';
    fotoPreview.style.display = 'none';
    removeFotoBtn.style.display = 'none';
  }

  function handleAudioUpload() {
    const file = audioInput.files[0];
    if (file && file.type.match('audio.*')) {
      if (file.size > 10 * 1024 * 1024) {
        alert('O áudio deve ter no máximo 10MB');
        clearAudioUpload();
        return;
      }

      audioPreview.src = URL.createObjectURL(file);
      audioPreview.style.display = 'block';
      removeAudioBtn.style.display = 'block';
    } else if (file) {
      alert('Por favor, selecione um arquivo de áudio válido (MP3)');
      clearAudioUpload();
    }
  }

  function clearAudioUpload() {
    audioInput.value = '';
    audioPreview.src = '';
    audioPreview.style.display = 'none';
    removeAudioBtn.style.display = 'none';
  }

  // Funções do Spotify
  async function searchSpotify() {
    const query = spotifySearchInput.value.trim();
    if (!query) {
      alert('Por favor, digite o nome da música ou artista');
      return;
    }

    try {
      searchSpotifyBtn.disabled = true;
      searchSpotifyBtn.textContent = 'Buscando...';
      spotifyResults.innerHTML = '<div class="loading">Carregando resultados...</div>';

      const response = await fetch(`http://localhost:3001/api/spotify/search?q=${encodeURIComponent(query)}`);
      
      if (!response.ok) {
        throw new Error('Erro ao buscar no Spotify');
      }

      const tracks = await response.json();
      
      if (tracks.length === 0) {
        spotifyResults.innerHTML = '<div class="no-results">Nenhuma música encontrada. Tente outro termo.</div>';
        return;
      }

      spotifyResults.innerHTML = '';
      tracks.forEach(track => {
        const trackElement = document.createElement('div');
        trackElement.className = 'spotify-track';
        trackElement.innerHTML = `
          <img src="${track.albumImage}" alt="${track.albumName}" class="track-image" />
          <div class="track-info">
            <h4 class="track-name">${track.name}</h4>
            <p class="track-artist">${track.artists.join(', ')}</p>
            <p class="track-album">${track.albumName}</p>
          </div>
          <button type="button" class="select-track-btn" data-track-id="${track.id}">Selecionar</button>
        `;
        spotifyResults.appendChild(trackElement);
      });

      document.querySelectorAll('.select-track-btn').forEach(btn => {
        btn.addEventListener('click', function() {
          const trackId = this.getAttribute('data-track-id');
          selectSpotifyTrack(trackId, this);
        });
      });

    } catch (error) {
      console.error('Erro na busca do Spotify:', error);
      spotifyResults.innerHTML = `<div class="error">Erro ao buscar músicas: ${error.message}</div>`;
    } finally {
      searchSpotifyBtn.disabled = false;
      searchSpotifyBtn.textContent = 'Buscar';
    }
  }

  function selectSpotifyTrack(trackId, clickedBtn) {
    document.querySelectorAll('.spotify-track').forEach(track => {
      track.classList.remove('selected');
      track.querySelector('.select-track-btn').textContent = 'Selecionar';
    });

    clickedBtn.closest('.spotify-track').classList.add('selected');
    clickedBtn.textContent = 'Selecionado ✓';
    selectedSpotifyTrack.value = trackId;
    
    const trackName = clickedBtn.closest('.spotify-track').querySelector('.track-name').textContent;
    const artistName = clickedBtn.closest('.spotify-track').querySelector('.track-artist').textContent;
    
    spotifyResults.insertAdjacentHTML('afterbegin', 
      `<div class="selected-track-info">
        Música selecionada: <strong>${trackName}</strong> - ${artistName}
      </div>`
    );
  }

  // Função de envio do formulário
  async function handleFormSubmit(e) {
    e.preventDefault();

    const nome = document.getElementById('nome').value.trim();
    const mensagem = document.getElementById('mensagem').value.trim();
    
    if (!nome) {
      alert('Por favor, preencha o nome do destinatário.');
      document.getElementById('nome').focus();
      return;
    }
    
    if (!mensagem) {
      alert('Por favor, escreva uma mensagem.');
      document.getElementById('mensagem').focus();
      return;
    }

    submitBtn.disabled = true;
    submitBtn.classList.add('loading');

    try {
      const formData = new FormData();
      formData.append('nome', nome);
      formData.append('mensagem', mensagem);

      const data = document.getElementById('data').value.trim();
      if (data) formData.append('data', data);

      const fotoFile = fotoInput.files[0];
      if (fotoFile) formData.append('foto', fotoFile);

      const audioFile = audioInput.files[0];
      if (audioFile) formData.append('audio', audioFile);

      if (selectedSpotifyTrack.value) {
        formData.append('spotify', selectedSpotifyTrack.value);
      }

      const response = await fetch('http://localhost:3001/api/cards', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao criar cartão');
      }

      const result = await response.json();
      
      if (result.viewLink) {
        window.location.href = result.viewLink;
      } else {
        throw new Error('Link de visualização não recebido');
      }
      
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao criar cartão: ' + error.message);
    } finally {
      submitBtn.disabled = false;
      submitBtn.classList.remove('loading');
    }
  }
});