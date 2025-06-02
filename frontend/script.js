(function(window, document) {
  'use strict';

  // --- Módulos Utilitários e de Configuração ---
  const NotificationManager = {
    _notificationContainer: null, _defaultDuration: 3000, _animationDuration: 500,
    init: function() { 
      this._notificationContainer = document.getElementById('appNotificationArea');
      if(!this._notificationContainer && document.body) {
        this._notificationContainer = document.createElement('div'); 
        this._notificationContainer.id='appNotificationArea'; 
        this._notificationContainer.setAttribute('aria-live','polite'); 
        this._notificationContainer.setAttribute('role','log'); 
        document.body.appendChild(this._notificationContainer); 
        console.log("NotificationManager: Container criado e inicializado.");
      } else if (this._notificationContainer) {
        console.log("NotificationManager: Inicializado (container existente).");
      } else {
        console.error("NotificationManager: Falha ao encontrar ou criar container (document.body não pronto?).");
      }
    },
    _removeMessage: function(el){if(!el.parentElement)return;el.classList.add('notification--removing');setTimeout(()=>{if(el.parentElement)el.remove();},this._animationDuration);},
    _showMessage: function(msg,type='info',dur=this._defaultDuration){if(!this._notificationContainer)this.init();if(!this._notificationContainer){console.error(`[Notify][${type}] ${msg} (Container não pronto)`); return;}const el=document.createElement('div');el.className=`notification notification--${type}`;el.textContent=msg;const cb=document.createElement('button');cb.innerHTML='&times;';cb.className='notification__close';cb.setAttribute('aria-label','Fechar');cb.onclick=()=>this._removeMessage(el);el.appendChild(cb);this._notificationContainer.appendChild(el);if(dur)setTimeout(()=>this._removeMessage(el),dur);},
    showSuccess: function(msg,dur){this._showMessage(msg,'success',dur);},
    showError: function(msg,dur){this._showMessage(msg,'error',dur||5000);},
    showInfo: function(msg,dur){this._showMessage(msg,'info',dur);}
  };

  const Utils = { 
    toggleButtonLoading:function(btn,isLoading,loadingTxt='Carregando...',defaultHtml=null){if(!btn)return;if(isLoading){if(!btn.classList.contains('btn--loading')){btn.dataset.originalContent=btn.innerHTML;btn.innerHTML=`<span class="btn__loading"></span> ${loadingTxt}`;btn.disabled=true;btn.classList.add('btn--loading');}}else{if(btn.classList.contains('btn--loading')){const oc=btn.dataset.originalContent||defaultHtml||'Ação';btn.innerHTML=oc;btn.disabled=false;delete btn.dataset.originalContent;btn.classList.remove('btn--loading');}}},
    formatTime:function(s){if(!isFinite(s)||s<0)return'0:00';const m=Math.floor(s/60);const secs=Math.floor(s%60);return`${m}:${secs<10?'0':''}${secs}`;},
  };

  const PROD_BACKEND_URL='https://messagelove-backend.onrender.com';
  const AppConfig={
    getFrontendBaseUrl:function(){return`${window.location.protocol}//${window.location.host}`;},
    getBackendUrl:function(){
      // Como você não usa mais backend local, sempre retorna o de produção
      // console.log('Usando URL backend:',PROD_BACKEND_URL); 
      return PROD_BACKEND_URL;
    }
  };

  const DOM={
    form:document.getElementById('cardForm'),
    nomeInput:document.getElementById('nome'),
    dataInput:document.getElementById('data'),
    mensagemInput:document.getElementById('mensagem'),
    fotoInput:document.getElementById('fotoUpload'),
    fotoPreview:document.getElementById('fotoPreview'),
    removeFotoBtn:document.getElementById('removeFoto'),
    submitBtn:document.getElementById('submitBtn'),
    currentYear:document.getElementById('currentYear'),
    fieldset:document.querySelector('fieldset'),
    previewContainer:document.querySelector('[data-js="preview-container"]')
    // Adicione aqui outros seletores DOM que seus módulos usam
  };

  // --- Módulos da Aplicação Principal (Previews, Fotos, Busca de Músicas, Formulário) ---
  const AudioPlayerManager={
    createPlayer:function(track, playerContext = 'track'){
      const playerElement = document.createElement('div');
      playerElement.className = 'audio-player';
      playerElement.setAttribute('data-track-name', track.name || 'esta faixa');
      playerElement.innerHTML = `
        <button class="play-pause-btn" aria-label="Tocar prévia de ${track.name || 'faixa'}">
          <span class="play-icon">▶️</span><span class="pause-icon" style="display: none;">⏸️</span>
        </button>
        <div class="progress-bar-container"><div class="progress-bar"></div></div>
        <span class="duration">0:00 / 0:00</span>
        <audio class="audio-element" preload="metadata">
          <source src="${track.previewUrl}" type="audio/mpeg">
          Seu navegador não suporta o elemento de áudio.
        </audio>
        <div class="preview-error" style="display: none;">Não foi possível reproduzir a prévia.</div>`;
      this._initPlayerLogic(playerElement, playerContext);
      return playerElement;
    },
    _initPlayerLogic:function(playerElement, playerContext){
      const audioElement = playerElement.querySelector('.audio-element');
      const playPauseBtn = playerElement.querySelector('.play-pause-btn');
      const playIcon = playElement.querySelector('.play-icon');
      const pauseIcon = playerElement.querySelector('.pause-icon');
      const progressBarContainer = playerElement.querySelector('.progress-bar-container');
      const progressBar = playerElement.querySelector('.progress-bar');
      const durationElement = playerElement.querySelector('.duration');
      const errorElement = playerElement.querySelector('.preview-error');
      const trackName = playerElement.dataset.trackName || (playerContext === 'card' ? 'música' : 'prévia');

      if (!audioElement || !playPauseBtn || !progressBar || !durationElement || !errorElement || !playIcon || !pauseIcon || !progressBarContainer) {
        console.error("AudioPlayerManager: Elementos do player não encontrados em _initPlayerLogic", playerElement);
        if(errorElement) { errorElement.textContent = "Erro ao inicializar player."; errorElement.style.display = 'block';}
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
        playIcon.style.display = 'inline'; pauseIcon.style.display = 'none';
        playPauseBtn.setAttribute('aria-label', `Tocar ${trackName}`);
        audioElement.currentTime = 0; progressBar.style.width = '0%';
      });
      audioElement.addEventListener('play', () => {
        document.querySelectorAll('audio.audio-element').forEach(otherAudio => {
          if (otherAudio !== audioElement && !otherAudio.paused) {
            otherAudio.pause();
            // Resetar UI de outros players
            const otherPlayerRoot = otherAudio.closest('.audio-player');
            if(otherPlayerRoot){
                const otherBtn = otherPlayerRoot.querySelector('.play-pause-btn');
                const otherPlayIcon = otherPlayerRoot.querySelector('.play-icon');
                const otherPauseIcon = otherPlayerRoot.querySelector('.pause-icon');
                if(otherBtn && otherPlayIcon && otherPauseIcon){
                    otherPlayIcon.style.display = 'inline'; otherPauseIcon.style.display = 'none';
                    otherBtn.setAttribute('aria-label', `Tocar ${otherPlayerRoot.dataset.trackName || 'prévia'}`);
                }
            }
          }
        });
      });
      audioElement.addEventListener('error', (e) => {
        console.error('AudioPlayerManager Error:', e, `Track: ${trackName}`);
        errorElement.textContent = `Erro ao carregar prévia para "${trackName}".`;
        errorElement.style.display = 'block';
        playPauseBtn.style.display = 'none'; // Esconde o botão se o áudio não carregar
        progressBarContainer.style.display = 'none';
      });
      playPauseBtn.addEventListener('click', () => {
        if (audioElement.paused) {
          audioElement.play().catch(e => {
            console.error(`Play error for ${trackName}:`, e);
            errorElement.textContent = `Não foi possível tocar "${trackName}".`;
            errorElement.style.display = 'block';
          });
          playIcon.style.display = 'none'; pauseIcon.style.display = 'inline';
          playPauseBtn.setAttribute('aria-label', `Pausar ${trackName}`);
        } else {
          audioElement.pause();
          playIcon.style.display = 'inline'; pauseIcon.style.display = 'none';
          playPauseBtn.setAttribute('aria-label', `Tocar ${trackName}`);
        }
      });
      progressBarContainer.addEventListener('click', (event) => {
        if (!isFinite(audioElement.duration) || audioElement.duration === 0) return;
        const rect = progressBarContainer.getBoundingClientRect();
        const offsetX = event.clientX - rect.left;
        audioElement.currentTime = (offsetX / rect.width) * audioElement.duration;
      });
    }
  };

  const PhotoManager={
    init:function(){
      if(!DOM.fotoInput || !DOM.fotoPreview || !DOM.removeFotoBtn || !DOM.previewContainer){
        console.warn("PhotoManager: Elementos de upload não encontrados."); return;
      }
      DOM.fotoInput.addEventListener('change',()=>this._handleFileSelect());
      DOM.removeFotoBtn.addEventListener('click',()=>this.removePhoto()); 
      console.log("PhotoManager: Inicializado.")
    },
    _handleFileSelect:function(){
      const file = DOM.fotoInput.files[0];
      if (!file) return;
      const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
      if (!validTypes.includes(file.type)) {
        NotificationManager.showError('Selecione uma imagem JPG, PNG ou GIF.');
        DOM.fotoInput.value = ''; return;
      }
      if(file.size > 5 * 1024 * 1024){ // 5MB
        NotificationManager.showError('A imagem deve ter no máximo 5MB.');
        DOM.fotoInput.value = ''; return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        DOM.fotoPreview.src = reader.result; DOM.fotoPreview.style.display = 'block';
        DOM.removeFotoBtn.style.display = 'flex'; DOM.previewContainer.hidden = false;
      };
      reader.readAsDataURL(file);
    },
    removePhoto:function(){
      DOM.fotoInput.value=''; DOM.fotoPreview.src='#'; DOM.fotoPreview.style.display='none';
      DOM.removeFotoBtn.style.display='none'; DOM.previewContainer.hidden=true;
    }
  };

  const Spotify = { // Módulo Spotify para BUSCA de previews
    backendUrl: AppConfig.getBackendUrl(), 
    originalSearchBtnContent: '<span class="search-icon">🔍</span> Buscar',
    searchInput: null, searchBtn: null, resultsContainer: null, 
    selectedTrackInput: null, previewUrlInput: null, // Estes são para o FormManager

    init: function() { 
      this._createAndInsertSection(); 
      this.searchInput = document.getElementById('spotifySearch'); 
      this.searchBtn = document.getElementById('searchSpotifyBtn'); 
      this.resultsContainer = document.getElementById('spotifyResults');
      this.selectedTrackInput = document.getElementById('selectedSpotifyTrack'); // Para o formulário
      this.previewUrlInput = document.getElementById('previewUrl'); // Para o formulário

      if (!this.searchInput || !this.searchBtn || !this.resultsContainer || !this.selectedTrackInput || !this.previewUrlInput){ 
        NotificationManager.showError("Erro ao carregar componentes de busca Spotify."); return;
      }
      this._setupEventListeners(); 
      console.log('Módulo Spotify (Busca de Previews) inicializado.'); 
    },
    _createAndInsertSection: function() {
      if(!DOM.fieldset) { console.error("Spotify: Fieldset não encontrado para inserir seção de busca."); return;}
      const sectionContainer = document.createElement('div');
      sectionContainer.className = 'form-group spotify-section-wrapper'; // Reutilizando sua classe
      sectionContainer.innerHTML = `
        <label for="spotifySearch">Adicionar música do Spotify (Opcional - Previews)</label>
        <div class="spotify-search-container">
          <input type="text" id="spotifySearch" placeholder="Pesquisar música ou artista..." 
                 class="spotify-search-input" aria-label="Pesquisar música no Spotify (Previews)" />
          <button type="button" id="searchSpotifyBtn" class="btn btn--spotify">
            ${this.originalSearchBtnContent}
          </button>
        </div>
        <div id="spotifyResults" class="spotify-results" aria-live="polite"></div>
        {/* Inputs hidden para o FormManager usar ao enviar o formulário */}
        <input type="hidden" id="selectedSpotifyTrack" name="spotifyTrackId"/> 
        <input type="hidden" id="previewUrl" name="previewUrl"/>
        <input type="hidden" id="spotifyTrackName" name="spotifyTrackName"/>
        <input type="hidden" id="spotifyAlbumImage" name="spotifyAlbumImage"/>
        <small class="field-hint">Busque e selecione uma música para adicionar um preview ao cartão.</small>
      `;
      const submitBtnGroup = DOM.submitBtn ? DOM.submitBtn.closest('.form-group') : null;
      if (submitBtnGroup) DOM.fieldset.insertBefore(sectionContainer, submitBtnGroup);
      else DOM.fieldset.appendChild(sectionContainer);
    },
    _setupEventListeners: function() { 
      if(this.searchBtn && this.searchInput) {
        let searchTimeout;
        this.searchBtn.addEventListener('click', ()=>this.search()); 
        this.searchInput.addEventListener('input', () => {
          clearTimeout(searchTimeout);
          searchTimeout = setTimeout(() => this.search(), 500); // Debounce
        });
      } 
    },
    search: async function() { 
      if(!this.searchInput || !this.searchBtn) return; 
      const query = this.searchInput.value.trim(); 
      if(!q) {this.showFeedback("Digite algo para buscar.", "info"); return;}
      
      Utils.toggleButtonLoading(this.searchBtn, true, "Buscando..."); 
      try { 
        const response = await fetch(`${this.backendUrl}/api/spotify/search?q=${encodeURIComponent(query)}`);
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: `Erro na busca: ${response.statusText}`}));
          throw new Error(errorData.message);
        }
        const tracks = await response.json();
        this._displayResults(tracks);
      } catch(e) {
        console.error("Erro na busca Spotify (frontend):", e);
        this.showFeedback(`Erro na busca: ${e.message}. Verifique a conexão ou o backend.`, "error");
      } finally {
        Utils.toggleButtonLoading(this.searchBtn, false, "Buscando...", this.originalSearchBtnContent);
      }
    },
    _displayResults: function(tracks) {
      if(!this.resultsContainer || !DOM.fieldset) return;
      this.resultsContainer.innerHTML = ''; 
      const oldSelectedFeedback = DOM.fieldset.querySelector('.selected-track-info');
      if (oldSelectedFeedback) oldSelectedFeedback.remove();

      if (!tracks || tracks.length === 0) {
        this.showFeedback("Nenhuma música encontrada com esse termo.", "info");
        return;
      }
      const fragment = document.createDocumentFragment();
      tracks.forEach(track => {
        if (track && track.id && track.name) fragment.appendChild(this._createTrackElement(track));
      });
      this.resultsContainer.appendChild(fragment);
    },
    _createTrackElement: function(track) {
      const element = document.createElement('div');
      element.className = 'spotify-track';
      element.setAttribute('data-track-id', track.id);
      element.innerHTML = `
        <img src="${track.albumImage || '/assets/placeholder-album.png'}" alt="Capa do álbum ${track.albumName || 'Desconhecido'}" class="track-image">
        <div class="track-info">
          <h4 class="track-name">${track.name}</h4>
          <p class="track-artist">${track.artists ? track.artists.join(', ') : 'Artista Desconhecido'}</p>
        </div>
        ${track.previewUrl ? `<button type="button" class="btn select-track-btn" aria-label="Selecionar música ${track.name}">Selecionar</button>` : '<span class="no-preview-text">Sem prévia</span>'}
      `;
      if (track.previewUrl) { // Apenas adiciona listener se pode ser selecionada (tem preview)
          const selectBtn = element.querySelector('.select-track-btn');
          if(selectBtn) selectBtn.addEventListener('click', () => this._selectTrack(track, element));
      }
      return element;
    },
    _selectTrack: function(track, selectedElement) {
      if(!this.selectedTrackInput || !this.previewUrlInput || !DOM.fieldset) return;
      
      // Limpa seleção anterior na UI
      document.querySelectorAll('.spotify-track.selected').forEach(el => {
        el.classList.remove('selected');
        const btn = el.querySelector('.select-track-btn');
        if (btn) btn.textContent = 'Selecionar';
      });
      selectedElement.classList.add('selected');
      const selectBtn = selectedElement.querySelector('.select-track-btn');
      if (selectBtn) selectBtn.textContent = 'Selecionado ✓';

      // Guarda os dados para o formulário
      this.selectedTrackInput.value = track.id;
      this.previewUrlInput.value = track.previewUrl;
      // Guarda outros dados que podem ser úteis para o FormManager ou para o card.html
      document.getElementById('spotifyTrackName').value = track.name || '';
      document.getElementById('spotifyAlbumImage').value = track.albumImage || '';


      this._showSelectedTrackFeedback(track);
    },
    _showSelectedTrackFeedback: function(track) {
      if(!DOM.fieldset || !this.resultsContainer) return;
      let feedbackDiv = DOM.fieldset.querySelector('.selected-track-info');
      if (!feedbackDiv) {
        feedbackDiv = document.createElement('div');
        feedbackDiv.className = 'selected-track-info feedback feedback--success'; // Reutilizando classes
        if (this.resultsContainer.parentNode) {
            this.resultsContainer.parentNode.insertBefore(feedbackDiv, this.resultsContainer);
        } else { DOM.fieldset.appendChild(feedbackDiv);  }
      }
      feedbackDiv.innerHTML = `Música para preview selecionada: <strong>${track.name}</strong>`;
    },
    showFeedback: function(msg, type) { if(this.resultsContainer) this.resultsContainer.innerHTML = `<div class="feedback feedback--${type}">${msg}</div>`; },
    resetSpotifySection: function() { 
      if(this.resultsContainer) this.resultsContainer.innerHTML = ''; 
      if(this.searchInput) this.searchInput.value = '';
      if(this.selectedTrackInput) this.selectedTrackInput.value = '';
      if(this.previewUrlInput) this.previewUrlInput.value = '';
      document.getElementById('spotifyTrackName').value = '';
      document.getElementById('spotifyAlbumImage').value = '';
      const oldSelectedFeedback = DOM.fieldset ? DOM.fieldset.querySelector('.selected-track-info') : null;
      if (oldSelectedFeedback) oldSelectedFeedback.remove();
    }
  };

  const FormManager={ 
    backendUrl: AppConfig.getBackendUrl(), 
    originalSubmitBtnContent: 'Criar Cartão Mensagem', 
    init: function() { 
      if(DOM.form) { 
        DOM.form.addEventListener('submit', async (e)=>{
          e.preventDefault(); 
          await this._handleSubmit();
        });
        console.log("FormManager inicializado.");
      } else {
        console.error("FormManager: Formulário principal não encontrado."); return;
      } 
      this._setCurrentYear();
    }, 
    _clearFormState: function(){ 
      if(DOM.form) DOM.form.reset(); 
      PhotoManager.removePhoto(); 
      Spotify.resetSpotifySection(); // Módulo de busca de previews
    }, 
    _handleSubmit: async function() {
      if(!DOM.nomeInput || !DOM.mensagemInput || !DOM.submitBtn || !DOM.form) {
          NotificationManager.showError("Erro: Elementos do formulário não encontrados.");
          return;
      }
      const nome = DOM.nomeInput.value.trim();
      const mensagem = DOM.mensagemInput.value.trim();
      if (!nome || !mensagem) {
        NotificationManager.showError('Por favor, preencha Nome e Mensagem.'); return;
      }
      
      // Usar new FormData(DOM.form) pega todos os campos com 'name'
      const formData = new FormData(DOM.form); 
      // Os campos hidden 'spotifyTrackId', 'previewUrl', 'spotifyTrackName', 'spotifyAlbumImage'
      // já têm o atributo 'name' no HTML injetado pelo Spotify._createAndInsertSection,
      // então serão incluídos automaticamente se tiverem valor.
      // Se você quisesse adicionar algo que não está no form com 'name', faria:
      // formData.append('campoExtra', 'valorExtra');

      Utils.toggleButtonLoading(DOM.submitBtn, true, "Enviando...");
      try {
        const response = await fetch(`${this.backendUrl}/api/cards`, {
          method: 'POST',
          body: formData 
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: `Erro no servidor: ${response.statusText}` }));
          throw new Error(errorData.message);
        }
        const result = await response.json();
        NotificationManager.showSuccess('Cartão criado com sucesso!');
        this._showCardPreview(result.cardData, result.viewLink); // Usa os dados retornados
        this._clearFormState();
      } catch (error) {
        console.error("FormManager: Erro ao enviar formulário:", error);
        NotificationManager.showError(`Erro ao enviar: ${error.message}`);
      } finally {
        Utils.toggleButtonLoading(DOM.submitBtn, false, "Enviando...", this.originalSubmitBtnContent);
      }
    }, 
    _showCardPreview: function(cardData, viewLink) { 
        // Implementação completa da prévia do cartão, similar à que tínhamos.
        const existingPreview = document.querySelector('.card-preview-wrapper');
        if(existingPreview) existingPreview.remove();

        const wrapper = document.createElement('div');
        wrapper.className = 'card-preview-wrapper';
        const container = document.createElement('div');
        container.className = 'card-preview'; // Reutilize seu CSS .card-preview

        let dataFmt = cardData.data ? Utils.formatTime(new Date(cardData.data+'T00:00:00').getTime()/1000) : 'Não especificada';
         try { // Formatação de data mais robusta
            if (cardData.data) {
                const dateObj = new Date(cardData.data + 'T00:00:00');
                if (!isNaN(dateObj.getTime())) {
                     dataFmt = dateObj.toLocaleDateString('pt-BR', { timeZone: 'UTC', day:'2-digit', month:'2-digit', year:'numeric' });
                } else { dataFmt = cardData.data; }
            }
        } catch (e) { dataFmt = cardData.data || 'Não especificada'; }


        container.innerHTML = `
            <div class="card-preview-header">
                <h2>Cartão Criado!</h2>
                <button type="button" class="close-preview-btn" aria-label="Fechar prévia">&times;</button>
            </div>
            <p><strong>Para:</strong> ${cardData.nome || 'N/A'}</p>
            <p><strong>Data:</strong> ${dataFmt}</p>
            <p><strong>Mensagem:</strong> ${cardData.mensagem ? cardData.mensagem.replace(/\n/g, '<br>') : 'N/A'}</p>
            ${cardData.fotoUrl ? `<div class="preview-image-container"><img src="${cardData.fotoUrl}" alt="Foto do cartão" class="preview-image"/></div>` : ''}
            <div class="preview-audio-container">
                ${cardData.previewUrl && cardData.spotifyTrackName ? `<h3>Música (Preview): ${cardData.spotifyTrackName}</h3>` : (cardData.previewUrl ? '<h3>Preview da Música:</h3>' : '')}
            </div>
            <p class="preview-link-info">Link para compartilhar: <a href="${viewLink}" target="_blank" rel="noopener noreferrer">${viewLink}</a></p>
            <button type="button" class="btn btn--secondary close-preview-btn-bottom">Fechar Prévia</button>
        `;

        if (cardData.previewUrl) {
            const audioContainer = container.querySelector('.preview-audio-container');
            const trackInfoForPlayer = { name: cardData.spotifyTrackName || 'Preview', previewUrl: cardData.previewUrl };
            audioContainer.appendChild(AudioPlayerManager.createPlayer(trackInfoForPlayer, 'card-preview'));
        }
        
        container.querySelectorAll('.close-preview-btn, .close-preview-btn-bottom').forEach(btn => {
            btn.addEventListener('click', () => wrapper.remove());
        });

        wrapper.appendChild(container);
        document.body.appendChild(wrapper);
        wrapper.scrollIntoView({behavior: 'smooth', block: 'center'});
    }, 
    _setCurrentYear: function(){ if(DOM.currentYear)DOM.currentYear.textContent=new Date().getFullYear();}};
  // --- FIM DOS MÓDULOS DA APLICAÇÃO PRINCIPAL ---


  // --- MÓDULO: SpotifyAuthService (para login/logout com Spotify e Playback SDK) ---
  const SpotifyAuthService = {
    SPOTIFY_CLIENT_ID: '395d435fc0e04ba48f1eef95c6672195', // !!! SEU CLIENT ID REAL AQUI !!!
    PRODUCTION_REDIRECT_URI: 'https://messagelove-frontend.vercel.app/spotify-callback',
    DEVELOPMENT_REDIRECT_URI: 'http://localhost:3000/spotify-callback', // !!! AJUSTE A PORTA LOCAL AQUI !!!
    REDIRECT_URI: '', 
    LS_CODE_VERIFIER_KEY: 'spotify_pkce_code_verifier',
    LS_ACCESS_TOKEN_KEY: 'spotify_user_access_token',
    LS_REFRESH_TOKEN_KEY: 'spotify_user_refresh_token',
    LS_TOKEN_EXPIRES_AT_KEY: 'spotify_user_token_expires_at',

    _generateRandomString: function(length) { /* ... (implementação mantida) ... */ let t='';const p='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';for(let i=0;i<length;i++)t+=p.charAt(Math.floor(Math.random()*p.length));return t; },
    _generateCodeChallenge: async function(codeVerifier) { /* ... (implementação mantida) ... */ const d=new TextEncoder().encode(codeVerifier);const h=await window.crypto.subtle.digest('SHA-256',d);return btoa(String.fromCharCode(...new Uint8Array(h))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,''); },
    redirectToSpotifyLogin: async function() { /* ... (implementação mantida) ... */ try{const cV=this._generateRandomString(128);const cC=await this._generateCodeChallenge(cV);localStorage.setItem(this.LS_CODE_VERIFIER_KEY,cV);const aU=new URL("https://api.spotify.com/v1/me/player/play?device_id=");aU.search=new URLSearchParams({response_type:'code',client_id:this.SPOTIFY_CLIENT_ID,scope:'streaming user-read-email user-read-private user-modify-playback-state user-read-playback-state user-read-currently-playing',redirect_uri:this.REDIRECT_URI,code_challenge_method:'S256',code_challenge:cC}).toString();window.location.href=aU.toString();}catch(e){console.error("SpotifyAuth: Erro login prep:",e);NotificationManager.showError("Erro ao iniciar login Spotify.");}},
    handleSpotifyCallback: async function() { /* ... (implementação mantida) ... */ const p=new URLSearchParams(window.location.search);const c=p.get('code');const e=p.get('error');const bP=this.REDIRECT_URI.substring(0,this.REDIRECT_URI.lastIndexOf('/'))||'/';window.history.replaceState({},document.title,bP);if(e){console.error('SpotifyAuth: Callback error:',e);NotificationManager.showError(`Login Spotify error: ${e}.`);this._cleanupAuthData();App.updateAuthUI();return false;}const cV=localStorage.getItem(this.LS_CODE_VERIFIER_KEY);if(!c||!cV){console.log('SpotifyAuth: Callback sem code/verifier.');return false;}try{const r=await fetch("https://accounts.spotify.com/api/token",{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'authorization_code',code:c,redirect_uri:this.REDIRECT_URI,client_id:this.SPOTIFY_CLIENT_ID,code_verifier:cV})});if(!r.ok){const ed=await r.json().catch(()=>({error_description:'Token server error.'}));console.error("SpotifyAuth: Token exchange fail:",r.status,ed);throw new Error(`Token fetch fail: ${ed.error_description||r.statusText}`);}const tD=await r.json();this._storeTokenData(tD);localStorage.removeItem(this.LS_CODE_VERIFIER_KEY);NotificationManager.showSuccess("Login Spotify OK!");if(typeof SpotifyPlaybackService.onUserLoggedInToSpotify==='function')SpotifyPlaybackService.onUserLoggedInToSpotify();if(typeof App.updateAuthUI==='function')App.updateAuthUI();return true;}catch(err){console.error('SpotifyAuth: Token exchange error:',err);NotificationManager.showError(`Login finalization error: ${err.message}`);this._cleanupAuthData();if(typeof App.updateAuthUI==='function')App.updateAuthUI();return false;}},
    _storeTokenData: function(tokenData) { /* ... (implementação mantida) ... */ if(!tokenData||!tokenData.access_token){console.error("SpotifyAuth: storeTokenData invalid data:",tokenData);return;}localStorage.setItem(this.LS_ACCESS_TOKEN_KEY,tokenData.access_token);if(tokenData.refresh_token)localStorage.setItem(this.LS_REFRESH_TOKEN_KEY,tokenData.refresh_token);const expInMs=tokenData.expires_in*1000;localStorage.setItem(this.LS_TOKEN_EXPIRES_AT_KEY,(Date.now()+expInMs).toString());console.log(`SpotifyAuth: Tokens stored. Expires in ${tokenData.expires_in}s.`);},
    _cleanupAuthData: function() { /* ... (implementação mantida) ... */ localStorage.removeItem(this.LS_CODE_VERIFIER_KEY);localStorage.removeItem(this.LS_ACCESS_TOKEN_KEY);localStorage.removeItem(this.LS_REFRESH_TOKEN_KEY);localStorage.removeItem(this.LS_TOKEN_EXPIRES_AT_KEY);if(SpotifyPlaybackService&&typeof SpotifyPlaybackService.onUserLoggedOut==='function')SpotifyPlaybackService.onUserLoggedOut();},
    getValidAccessToken: async function() { /* ... (implementação mantida) ... */ let aT=localStorage.getItem(this.LS_ACCESS_TOKEN_KEY);let eA=parseInt(localStorage.getItem(this.LS_TOKEN_EXPIRES_AT_KEY),10);if(aT&&eA&&Date.now()<eA-60000)return aT;const rT=localStorage.getItem(this.LS_REFRESH_TOKEN_KEY);if(!rT){if(aT)NotificationManager.showError('Sessão Spotify expirada. Faça login.');this._cleanupAuthData();if(typeof App.updateAuthUI==='function')App.updateAuthUI();return null;}console.log('SpotifyAuth: Renovando token...');try{const r=await fetch("https://accounts.spotify.com/api/token",{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'refresh_token',refresh_token:rT,client_id:this.SPOTIFY_CLIENT_ID})});if(!r.ok){const ed=await r.json().catch(()=>({error_description:'Erro renovar.'}));let msg=`Sessão Spotify expirada (${ed.error_description||r.statusText}). Faça login.`;if(ed.error==='invalid_grant')msg="Autorização Spotify revogada. Faça login.";NotificationManager.showError(msg);this._cleanupAuthData();if(typeof App.updateAuthUI==='function')App.updateAuthUI();return null;}const tD=await r.json();this._storeTokenData(tD);console.log('SpotifyAuth: Token renovado.');return tD.access_token;}catch(e){console.error('SpotifyAuth: Erro rede ao renovar:',e);NotificationManager.showError("Erro rede ao renovar sessão Spotify.");this._cleanupAuthData();if(typeof App.updateAuthUI==='function')App.updateAuthUI();return null;}},
    spotifyLogout: function() { /* ... (implementação mantida) ... */ console.log("SpotifyAuth: Logout...");this._cleanupAuthData();NotificationManager.showInfo("Desconectado do Spotify.");if(typeof App.updateAuthUI==='function')App.updateAuthUI();},
    isUserLoggedIn: function() { /* ... (implementação mantida) ... */ const aT=localStorage.getItem(this.LS_ACCESS_TOKEN_KEY);const eA=parseInt(localStorage.getItem(this.LS_TOKEN_EXPIRES_AT_KEY),10);return!!(aT&&eA&&Date.now()<eA-10000);},
    init: function() {this.REDIRECT_URI=(window.location.hostname==='localhost'||window.location.hostname==='127.0.0.1')?this.DEVELOPMENT_REDIRECT_URI:this.PRODUCTION_REDIRECT_URI;console.log("SpotifyAuthService inicializado. Redirect URI:",this.REDIRECT_URI);if(window.location.pathname.endsWith('/spotify-callback'))this.handleSpotifyCallback();}
  };

  const SpotifyPlaybackService = {
    LS_DEVICE_ID_KEY: 'spotify_messagelove_device_id', 
    spotifyPlayerInstance: null,
    currentPlaybackDeviceId: null,

    initializeWebPlaybackSDK: async function() { /* ... (implementação completa como na resposta anterior, já está bem limpa) ... */ if(this.spotifyPlayerInstance){console.log("PlaybackService: Player já init.");return;}const t=await SpotifyAuthService.getValidAccessToken();if(!t){console.log("PlaybackService: Token inválido, player não init.");return;}if(typeof Spotify==='undefined'||!Spotify.Player){NotificationManager.showError("SDK Player Spotify não carregado.");console.error("Spotify.Player undefined.");return;}console.log("PlaybackService: Init Player SDK...");this.spotifyPlayerInstance=new Spotify.Player({name:'Messagelove Web Player',getOAuthToken:cb=>SpotifyAuthService.getValidAccessToken().then(vT=>cb(vT||null)),volume:0.5});this.spotifyPlayerInstance.addListener('ready',({device_id})=>{this.currentPlaybackDeviceId=device_id;localStorage.setItem(this.LS_DEVICE_ID_KEY,device_id);NotificationManager.showInfo("Player Spotify conectado!");console.log("Player SDK Ready, Device ID:",device_id);});this.spotifyPlayerInstance.addListener('not_ready',({device_id})=>{console.log("Device not ready:",device_id);this.currentPlaybackDeviceId=null;localStorage.removeItem(this.LS_DEVICE_ID_KEY);});this.spotifyPlayerInstance.addListener('initialization_error',({message})=>{console.error("Player Init Error:",message);NotificationManager.showError(`Player Init Error: ${message}`)});this.spotifyPlayerInstance.addListener('authentication_error',({message})=>{console.error("Player Auth Error:",message);NotificationManager.showError(`Player Auth Error: ${message}`);SpotifyAuthService.spotifyLogout();});this.spotifyPlayerInstance.addListener('account_error',({message})=>{console.error("Player Account Error:",message);NotificationManager.showError(`Player Account Error: ${message}. Premium necessário.`);});this.spotifyPlayerInstance.addListener('playback_error',({message})=>{console.error("Player Playback Error:",message);NotificationManager.showError(`Player Playback Error: ${message}`)});this.spotifyPlayerInstance.addListener('player_state_changed',(st)=>{if(!st){console.warn("Player state null");/* TODO: App.updatePlayerUI(null); */return;}/* console.log("Player state:",st); TODO: App.updatePlayerUI(st); */});this.spotifyPlayerInstance.connect().then(s=>console.log(s?"Player SDK conectado!":"Player SDK falha conectar."));},
    onUserLoggedInToSpotify: function() { /* ... (implementação mantida) ... */ console.log("PlaybackService: onUserLoggedInToSpotify.");if(window.Spotify&&typeof window.Spotify.Player==='function')this.initializeWebPlaybackSDK();else console.log("SDK Spotify global não carregado.");},
    onUserLoggedOut: function() { /* ... (implementação mantida) ... */ console.log("PlaybackService: Usuário deslogou.");if(this.spotifyPlayerInstance)this.spotifyPlayerInstance.disconnect();this.spotifyPlayerInstance=null;this.currentPlaybackDeviceId=null;localStorage.removeItem(this.LS_DEVICE_ID_KEY);/* TODO: App.updatePlayerUI(null); */},
    transferPlaybackToThisDevice: async function(play=false) { /* ... (implementação completa como na resposta anterior, já está bem limpa) ... */ const dID=this.currentPlaybackDeviceId||localStorage.getItem(this.LS_DEVICE_ID_KEY);if(!dID){NotificationManager.showError("Player não ativo localmente.");return false;}const tk=await SpotifyAuthService.getValidAccessToken();if(!tk)return false;console.log(`PlaybackService: Transferindo para ${dID}, play:${play}`);try{const r=await fetch('https://open.spotify.com/embed/track/$',{method:'PUT',headers:{'Authorization':`Bearer ${tk}`,'Content-Type':'application/json'},body:JSON.stringify({device_ids:[dID],play:play})});if(!r.ok){const ed=await r.json().catch(()=>({error:{message:r.statusText}}));NotificationManager.showError(`Falha ao ativar player: ${ed.error?.message||r.statusText}`);return false;}console.log("Playback transferido.");return true;}catch(e){console.error("Erro rede ao transferir:",e);NotificationManager.showError("Erro rede ao ativar player.");return false;}},
    playTrackOnSpotify: async function(trackUri) { /* ... (implementação completa como na resposta anterior, já está bem limpa) ... */ const dID=this.currentPlaybackDeviceId||localStorage.getItem(this.LS_DEVICE_ID_KEY);if(!dID){NotificationManager.showError("Player não pronto.");return false;}const tk=await SpotifyAuthService.getValidAccessToken();if(!tk)return false;console.log(`PlaybackService: Tocando ${trackUri} em ${dID}`);try{const r=await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${dID}`,{method:'PUT',headers:{'Authorization':`Bearer ${tk}`,'Content-Type':'application/json'},body:JSON.stringify({uris:[trackUri]})});if(!r.ok){const ed=await r.json().catch(()=>({error:{message:`HTTP ${r.status}`}}));let rE=ed.error?.message||`Erro ${r.status} ao tocar.`;if(ed.error?.reason==='NO_ACTIVE_DEVICE'||ed.error?.reason==='PLAYER_COMMAND_FAILED'||r.status===404){NotificationManager.showInfo('Player inativo. Tentando ativar...');const tS=await this.transferPlaybackToThisDevice(true);if(tS){console.log("Transfer OK, tentando tocar de novo em 1s...");return new Promise(res=>setTimeout(async()=>{res(await this.playTrackOnSpotify(trackUri))},1000));}else{rE='Não foi possível ativar player web.';}}else if(ed.error?.reason==='PREMIUM_REQUIRED')rE='Spotify Premium necessário.';else if(r.status===403)rE='Não foi possível tocar. Verifique permissões.';NotificationManager.showError(rE);return false;}console.log("Música enviada ao player.");return true;}catch(e){console.error("Erro rede ao tocar:",e);NotificationManager.showError("Erro rede ao tocar música.");return false;}},
    init: function() {window.onSpotifyWebPlaybackSDKReady=()=>{console.log("SDK Spotify global pronto.");if(SpotifyAuthService.isUserLoggedIn())this.initializeWebPlaybackSDK();};console.log("SpotifyPlaybackService inicializado.");}
  };

  const App = {
    init: function() {
      console.log('Aplicação Messagelove inicializando...');
      NotificationManager.init(); 
      SpotifyAuthService.init(); 
      SpotifyPlaybackService.init();

      PhotoManager.init();
      Spotify.init(); 
      FormManager.init();

      const loginBtn = document.getElementById('loginWithSpotifyBtn');
      if (loginBtn) loginBtn.addEventListener('click', () => SpotifyAuthService.redirectToSpotifyLogin());
      
      const logoutBtn = document.getElementById('logoutSpotifyBtn');
      if (logoutBtn) logoutBtn.addEventListener('click', () => SpotifyAuthService.spotifyLogout());
      
      this.updateAuthUI();

      document.body.addEventListener('click', function(event) {
        const playButton = event.target.closest('[data-play-track-uri]');
        if (playButton) {
            const trackUri = playButton.dataset.playTrackUri;
            if (trackUri) {
                if (SpotifyAuthService.isUserLoggedIn()) {
                    console.log(`App: Usuário clicou para tocar ${trackUri}`);
                    SpotifyPlaybackService.playTrackOnSpotify(trackUri);
                } else {
                    NotificationManager.showInfo("Faça login com Spotify para tocar músicas completas.");
                }
            }
        }
      });
      console.log('Aplicação Messagelove pronta.');
    },
    updateAuthUI: function() {
      const loginBtn = document.getElementById('loginWithSpotifyBtn');
      const logoutBtn = document.getElementById('logoutSpotifyBtn');
      if (loginBtn && logoutBtn) {
        if (SpotifyAuthService.isUserLoggedIn()) {
          loginBtn.style.display = 'none';
          logoutBtn.style.display = 'inline-block';
        } else {
          loginBtn.style.display = 'inline-block';
          logoutBtn.style.display = 'none';
        }
      }
    }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', App.init.bind(App)); 
  else App.init();

})(window, document);