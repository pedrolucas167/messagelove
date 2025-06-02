// Envolvemos todo o código em uma IIFE para criar um escopo privado
(function(window, document) {
  'use strict';

  // --- !!! COLE SUAS DEFINIÇÕES COMPLETAS DOS MÓDULOS EXISTENTES AQUI !!! ---
  // NotificationManager, Utils, AppConfig, DOM, AudioPlayerManager (completo), 
  // PhotoManager (completo), Spotify (módulo de busca, completo), FormManager (completo)
  // O código abaixo depende que eles estejam definidos e funcionais.

  // Exemplo (SUBSTITUA PELO SEU CÓDIGO REAL E COMPLETO):
  const NotificationManager = {
    _notificationContainer: null, _defaultDuration: 3000, _animationDuration: 500,
    init: function() { if(!this._notificationContainer && document.body) {this._notificationContainer = document.createElement('div'); this._notificationContainer.id='appNotificationArea'; this._notificationContainer.setAttribute('aria-live','polite'); this._notificationContainer.setAttribute('role','log'); document.body.appendChild(this._notificationContainer); console.log("NotificationManager inicializado.");}else if(document.getElementById('appNotificationArea')){this._notificationContainer=document.getElementById('appNotificationArea');} else {console.error("NotificationManager: Falha ao encontrar ou criar container.")}},
    _removeMessage: function(el){if(!el.parentElement)return;el.classList.add('notification--removing');setTimeout(()=>{if(el.parentElement)el.remove();},this._animationDuration);},
    _showMessage: function(msg,type='info',dur=this._defaultDuration){if(!this._notificationContainer)this.init();if(!this._notificationContainer){console.error(`[Notify][${type}] ${msg} (Container não pronto)`); return;}const el=document.createElement('div');el.className=`notification notification--${type}`;el.textContent=msg;const cb=document.createElement('button');cb.innerHTML='×';cb.className='notification__close';cb.setAttribute('aria-label','Fechar');cb.onclick=()=>this._removeMessage(el);el.appendChild(cb);this._notificationContainer.appendChild(el);if(dur)setTimeout(()=>this._removeMessage(el),dur);},
    showSuccess: function(msg,dur){this._showMessage(msg,'success',dur);},
    showError: function(msg,dur){this._showMessage(msg,'error',dur||5000);},
    showInfo: function(msg,dur){this._showMessage(msg,'info',dur);}
  };
  const Utils = { /* ... Sua definição completa ... */ 
    toggleButtonLoading:function(btn,isLoading,loadingTxt='Carregando...',defaultHtml=null){if(!btn)return;if(isLoading){if(!btn.classList.contains('btn--loading')){btn.dataset.originalContent=btn.innerHTML;btn.innerHTML=`<span class="btn__loading"></span> ${loadingTxt}`;btn.disabled=true;btn.classList.add('btn--loading');}}else{if(btn.classList.contains('btn--loading')){const oc=btn.dataset.originalContent||defaultHtml||'Ação';btn.innerHTML=oc;btn.disabled=false;delete btn.dataset.originalContent;btn.classList.remove('btn--loading');}}},
    formatTime:function(s){if(!isFinite(s)||s<0)return'0:00';const m=Math.floor(s/60);const secs=Math.floor(s%60);return`${m}:${secs<10?'0':''}${secs}`;},
  };
  const PROD_BACKEND_URL='https://messagelove-backend.onrender.com';
  const AppConfig={getFrontendBaseUrl:function(){return`${window.location.protocol}//${window.location.host}`;},getBackendUrl:function(){console.log('Usando URL backend:',PROD_BACKEND_URL);return PROD_BACKEND_URL;}};
  const DOM={form:document.getElementById('cardForm'),nomeInput:document.getElementById('nome'),dataInput:document.getElementById('data'),mensagemInput:document.getElementById('mensagem'),fotoInput:document.getElementById('fotoUpload'),fotoPreview:document.getElementById('fotoPreview'),removeFotoBtn:document.getElementById('removeFoto'),submitBtn:document.getElementById('submitBtn'),currentYear:document.getElementById('currentYear'),fieldset:document.querySelector('fieldset'),previewContainer:document.querySelector('[data-js="preview-container"]')};
  // !!! COLE SEU AudioPlayerManager COMPLETO AQUI !!!
  const AudioPlayerManager={createPlayer:function(t,pCtx='track'){const el=document.createElement('div');el.className='audio-player';el.setAttribute('data-track-name',t.name||'esta faixa');el.innerHTML=`<button class="play-pause-btn"aria-label="Tocar prévia de ${t.name||'faixa'}"><span class="play-icon">▶️</span><span class="pause-icon"style="display:none">⏸️</span></button><div class="progress-bar-container"><div class="progress-bar"></div></div><span class="duration">0:00 / 0:00</span><audio class="audio-element"preload="metadata"><source src="${t.previewUrl}"type="audio/mpeg">Seu navegador não suporta.</audio><div class="preview-error"style="display:none">Prévia indisponível.</div>`;this._initPlayerLogic(el,pCtx);return el;},_initPlayerLogic:function(pEl,pCtx){ const aE=pEl.querySelector('.audio-element'); const playPauseBtn = pEl.querySelector('.play-pause-btn'); const errorEl = pEl.querySelector('.preview-error'); if(aE && playPauseBtn && errorEl) { aE.addEventListener('error',(e)=>{console.error('AudioPlayerManager Error:',e); errorEl.textContent = `Erro ao carregar prévia para ${pEl.dataset.trackName || 'faixa'}.`; errorEl.style.display='block';}); /* Cole sua lógica COMPLETA de eventos (loadedmetadata, timeupdate, ended, play, click no botão, etc.) aqui */ } else { console.error("AudioPlayerManager: Elementos do player não encontrados em _initPlayerLogic", pEl);}}};
  // !!! COLE SEU PhotoManager COMPLETO AQUI !!!
  const PhotoManager={init:function(){if(!DOM.fotoInput || !DOM.removeFotoBtn || !DOM.fotoPreview){console.warn("PhotoManager: Elementos não encontrados."); return;}DOM.fotoInput.addEventListener('change',()=>this._handleFileSelect());DOM.removeFotoBtn.addEventListener('click',()=>this.removePhoto()); console.log("PhotoManager: Inicializado.")},_handleFileSelect:function(){const f=DOM.fotoInput.files[0];if(!f)return;if(f.size>5*1024*1024){NotificationManager.showError('Imagem > 5MB');return;}const r=new FileReader();r.onload=()=>{DOM.fotoPreview.src=r.result;DOM.fotoPreview.style.display='block';DOM.removeFotoBtn.style.display='flex';if(DOM.previewContainer)DOM.previewContainer.hidden=false;};r.readAsDataURL(f);},removePhoto:function(){if(!DOM.fotoInput || !DOM.fotoPreview || !DOM.removeFotoBtn) return; DOM.fotoInput.value='';DOM.fotoPreview.src='#';DOM.fotoPreview.style.display='none';DOM.removeFotoBtn.style.display='none';if(DOM.previewContainer)DOM.previewContainer.hidden=true;}};
  // !!! COLE SEU MÓDULO Spotify (BUSCA) COMPLETO AQUI !!!
  const Spotify = { 
      backendUrl: AppConfig.getBackendUrl(), originalSearchBtnContent: '<span class="search-icon">🔍</span> Buscar',
      searchInput: null, searchBtn: null, resultsContainer: null, selectedTrackInput: null, previewUrlInput: null,
      init: function() { 
        this._createAndInsertSection(); 
        this.searchInput = document.getElementById('spotifySearch');
        this.searchBtn = document.getElementById('searchSpotifyBtn');
        this.resultsContainer = document.getElementById('spotifyResults');
        this.selectedTrackInput = document.getElementById('selectedSpotifyTrack');
        this.previewUrlInput = document.getElementById('previewUrl');
        if (!this.searchInput || !this.searchBtn || !this.resultsContainer){ NotificationManager.showError("Erro ao carregar componentes de busca Spotify."); return;}
        this._setupEventListeners(); console.log('Módulo Spotify (Busca) inicializado.'); 
      },
      _createAndInsertSection: function() { /* Sua lógica COMPLETA para criar e inserir a seção de busca */ if(!DOM.fieldset) { console.error("Spotify: Fieldset não encontrado para inserir seção."); return;} const sc = document.createElement('div'); sc.innerHTML = '<label for="spotifySearch">Busca Spotify Placeholder</label><input id="spotifySearch" name="spotifyQuery"/><button type="button" id="searchSpotifyBtn">Buscar</button><div id="spotifyResults"></div><input type="hidden" id="selectedSpotifyTrack" name="spotify"/><input type="hidden" id="previewUrl" name="previewUrl"/>'; const submitBtnGroup = DOM.submitBtn ? DOM.submitBtn.closest('.form-group') : null; if (submitBtnGroup) DOM.fieldset.insertBefore(sc, submitBtnGroup); else DOM.fieldset.appendChild(sc); },
      _setupEventListeners: function() { if(this.searchBtn && this.searchInput) {this.searchBtn.addEventListener('click', ()=>this.search()); /* Adicione debounce ao input aqui */ } },
      search: async function() { if(!this.searchInput) return; const q = this.searchInput.value; if(!q) {this.showFeedback("Digite algo para buscar.", "info"); return;} console.log(`Busca Spotify por: ${q}`); Utils.toggleButtonLoading(this.searchBtn, true, "Buscando..."); try { /* Sua lógica COMPLETA de fetch e tratamento de resultados aqui */ this.showFeedback(`Resultados para ${q}...`, 'info');} catch(e) {this.showFeedback("Erro na busca.", "error");} finally {Utils.toggleButtonLoading(this.searchBtn, false, "Buscando...", this.originalSearchBtnContent);}},
      showFeedback: function(message, type) { if(this.resultsContainer) this.resultsContainer.innerHTML = `<div class="feedback feedback--${type}">${message}</div>`; },
      resetSpotifySection: function() { /* Sua lógica COMPLETA de reset */ if(this.resultsContainer) this.resultsContainer.innerHTML = ''; if(this.searchInput) this.searchInput.value = '';},
      _displayResults: function(tracks) { /* Sua lógica COMPLETA de display */},
      _createTrackElement: function(track) { /* Sua lógica COMPLETA de criação de elemento */ return document.createElement('div');},
      _selectTrack: function(track, el) { /* Sua lógica COMPLETA de seleção */},
      _showSelectedTrackFeedback: function(track) { /* Sua lógica COMPLETA de feedback */ }
  };
  // !!! COLE SEU FormManager COMPLETO AQUI !!!
  const FormManager={ backendUrl: AppConfig.getBackendUrl(), originalSubmitBtnContent: 'Criar Cartão Mensagem', init: function() { if(DOM.form) { DOM.form.addEventListener('submit', async (e)=>{e.preventDefault(); await this._handleSubmit();}); console.log("FormManager inicializado.");} else {console.error("FormManager: Formulário principal não encontrado."); return;} this._setCurrentYear();}, _clearFormState: function(){ if(DOM.form) DOM.form.reset(); PhotoManager.removePhoto(); Spotify.resetSpotifySection(); }, _handleSubmit: async function() { /* Sua lógica COMPLETA de submit */ NotificationManager.showInfo("Formulário enviado (simulação)."); this._clearFormState();}, _showCardPreview: function(cardData, viewLink) { /* Sua lógica COMPLETA de preview */ }, _setCurrentYear: function(){ if(DOM.currentYear)DOM.currentYear.textContent=new Date().getFullYear();}};
  // --- FIM DOS MÓDULOS EXISTENTES ---


  // --- MÓDULO: SpotifyAuthService (para login/logout com Spotify) ---
  const SpotifyAuthService = {
    SPOTIFY_CLIENT_ID: '395d435fc0e04ba48f1eef95c6672195', // !!! SUBSTITUA PELO SEU CLIENT ID REAL !!!
    PRODUCTION_REDIRECT_URI: 'https://messagelove-frontend.vercel.app/spotify-callback',
    DEVELOPMENT_REDIRECT_URI: 'http://localhost:3000/spotify-callback', // !!! AJUSTE A PORTA LOCAL AQUI !!!
    REDIRECT_URI: '', 

    LS_CODE_VERIFIER_KEY: 'spotify_pkce_code_verifier',
    LS_ACCESS_TOKEN_KEY: 'spotify_user_access_token',
    LS_REFRESH_TOKEN_KEY: 'spotify_user_refresh_token',
    LS_TOKEN_EXPIRES_AT_KEY: 'spotify_user_token_expires_at',

    _generateRandomString: function(length) {
      let text = ''; const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      for (let i = 0; i < length; i++) text += possible.charAt(Math.floor(Math.random() * possible.length));
      return text;
    },
    _generateCodeChallenge: async function(codeVerifier) {
      const data = new TextEncoder().encode(codeVerifier);
      const digest = await window.crypto.subtle.digest('SHA-256', data);
      return btoa(String.fromCharCode(...new Uint8Array(digest)))
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    },
    redirectToSpotifyLogin: async function() {
      try {
        const codeVerifier = this._generateRandomString(128);
        const codeChallenge = await this._generateCodeChallenge(codeVerifier);
        localStorage.setItem(this.LS_CODE_VERIFIER_KEY, codeVerifier);
        const authUrl = new URL("https://api.spotify.com/v1/me/player/play?device_id=");
        authUrl.search = new URLSearchParams({
          response_type: 'code', client_id: this.SPOTIFY_CLIENT_ID,
          scope: 'streaming user-read-email user-read-private user-modify-playback-state user-read-playback-state user-read-currently-playing',
          redirect_uri: this.REDIRECT_URI, code_challenge_method: 'S256', code_challenge: codeChallenge,
        }).toString();
        window.location.href = authUrl.toString();
      } catch (error) { 
        console.error("SpotifyAuth: Erro ao preparar login:", error);
        NotificationManager.showError("Não foi possível iniciar o login com Spotify. Verifique o console.");
      }
    },
    handleSpotifyCallback: async function() {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const error = urlParams.get('error');
      
      const basePath = this.REDIRECT_URI.substring(0, this.REDIRECT_URI.lastIndexOf('/')) || '/';
      window.history.replaceState({}, document.title, basePath); // Limpa query params da URL

      if (error) {
        console.error('SpotifyAuth: Erro no callback Spotify:', error);
        NotificationManager.showError(`Erro de login com Spotify: ${error}. Tente novamente.`);
        this._cleanupAuthData(); 
        App.updateAuthUI();     
        return false;
      }
      const codeVerifier = localStorage.getItem(this.LS_CODE_VERIFIER_KEY);
      if (!code || !codeVerifier) {
        console.log('SpotifyAuth: Callback sem código ou verifier. Pode ser um acesso direto à URL de callback.');
        return false; 
      }
      try {
        const response = await fetch("https://accounts.spotify.com/api/token", {
          method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            grant_type: 'authorization_code', // <<< CORRIGIDO DE 'breeding:'
            code: code, redirect_uri: this.REDIRECT_URI,
            client_id: this.SPOTIFY_CLIENT_ID, code_verifier: codeVerifier,
          }),
        });
        if (!response.ok) {
          const errData = await response.json().catch(()=>({error_description:'Erro desconhecido do servidor de token.'}));
          console.error("SpotifyAuth: Falha na troca de código por token:", response.status, errData);
          throw new Error(`Falha ao obter token: ${errData.error_description || response.statusText}`);
        }
        const tokenData = await response.json(); 
        this._storeTokenData(tokenData);
        localStorage.removeItem(this.LS_CODE_VERIFIER_KEY);
        NotificationManager.showSuccess("Login com Spotify realizado com sucesso!");
        
        if (typeof SpotifyPlaybackService.onUserLoggedInToSpotify === 'function') {
            SpotifyPlaybackService.onUserLoggedInToSpotify();
        }
        if (typeof App.updateAuthUI === 'function') {
            App.updateAuthUI();
        }
        // Opcional: window.location.href = basePath; // Se quiser redirecionar para a home após o callback
        return true;
      } catch (err) {
        console.error('SpotifyAuth: Erro ao trocar código por token:', err);
        NotificationManager.showError(`Erro ao finalizar login com Spotify: ${err.message}`);
        this._cleanupAuthData(); 
        if (typeof App.updateAuthUI === 'function') App.updateAuthUI();
        return false;
      }
    },
    _storeTokenData: function(tokenData) {
      if (!tokenData || !tokenData.access_token) {
        console.error("SpotifyAuth: _storeTokenData chamado com dados de token inválidos:", tokenData);
        return;
      }
      localStorage.setItem(this.LS_ACCESS_TOKEN_KEY, tokenData.access_token);
      if (tokenData.refresh_token) {
        localStorage.setItem(this.LS_REFRESH_TOKEN_KEY, tokenData.refresh_token);
      }
      localStorage.setItem(this.LS_TOKEN_EXPIRES_AT_KEY, (Date.now() + tokenData.expires_in * 1000).toString());
      console.log("SpotifyAuth: Tokens armazenados.");
    },
    _cleanupAuthData: function() {
      localStorage.removeItem(this.LS_CODE_VERIFIER_KEY); 
      localStorage.removeItem(this.LS_ACCESS_TOKEN_KEY);
      localStorage.removeItem(this.LS_REFRESH_TOKEN_KEY); 
      localStorage.removeItem(this.LS_TOKEN_EXPIRES_AT_KEY);
      // LS_DEVICE_ID_KEY será limpo pelo SpotifyPlaybackService.onUserLoggedOut
      if (SpotifyPlaybackService && typeof SpotifyPlaybackService.onUserLoggedOut === 'function') {
        SpotifyPlaybackService.onUserLoggedOut(); 
      }
    },
    getValidAccessToken: async function() {
      let accessToken = localStorage.getItem(this.LS_ACCESS_TOKEN_KEY);
      let expiresAt = parseInt(localStorage.getItem(this.LS_TOKEN_EXPIRES_AT_KEY), 10);
      if (accessToken && expiresAt && Date.now() < expiresAt - (60 * 1000)) { // 1 min buffer
        return accessToken;
      }
      const refreshToken = localStorage.getItem(this.LS_REFRESH_TOKEN_KEY);
      if (!refreshToken) {
        if(accessToken) NotificationManager.showError('Sua sessão Spotify expirou. Por favor, faça login novamente.');
        this._cleanupAuthData(); 
        if (typeof App.updateAuthUI === 'function') App.updateAuthUI(); 
        return null;
      }
      console.log('SpotifyAuth: Access token expirado ou próximo de expirar. Tentando renovar...');
      try {
        const response = await fetch("https://accounts.spotify.com/api/token", {
          method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: refreshToken, client_id: this.SPOTIFY_CLIENT_ID }),
        });
        if (!response.ok) {
          const errData = await response.json().catch(()=>({error_description:'Erro ao renovar token.'}));
          console.error("SpotifyAuth: Falha ao renovar token:", response.status, errData);
          let msg = `Sua sessão Spotify expirou (${errData.error_description||response.statusText}). Por favor, faça login novamente.`;
          if(errData.error==='invalid_grant') msg="Sua autorização do Spotify expirou ou foi revogada. Por favor, faça login novamente.";
          NotificationManager.showError(msg); this._cleanupAuthData(); 
          if (typeof App.updateAuthUI === 'function') App.updateAuthUI(); 
          return null;
        }
        const tokenData = await response.json(); this._storeTokenData(tokenData);
        console.log('SpotifyAuth: Token renovado com sucesso.'); return tokenData.access_token;
      } catch (error) {
        console.error('SpotifyAuth: Erro de rede ao renovar token:', error);
        NotificationManager.showError("Erro de rede ao tentar renovar sua sessão Spotify.");
        this._cleanupAuthData(); 
        if (typeof App.updateAuthUI === 'function') App.updateAuthUI(); 
        return null;
      }
    },
    spotifyLogout: function() {
      console.log("SpotifyAuth: Fazendo logout..."); 
      this._cleanupAuthData();
      NotificationManager.showInfo("Você foi desconectado do Spotify.");
      if (typeof App.updateAuthUI === 'function') App.updateAuthUI();
    },
    isUserLoggedIn: function() {
      const accessToken = localStorage.getItem(this.LS_ACCESS_TOKEN_KEY);
      const expiresAt = parseInt(localStorage.getItem(this.LS_TOKEN_EXPIRES_AT_KEY), 10);
      return !!(accessToken && expiresAt && Date.now() < expiresAt - (10 * 1000)); // 10s buffer
    },
    init: function() {
      this.REDIRECT_URI = (window.location.hostname==='localhost'||window.location.hostname==='127.0.0.1') 
                          ? this.DEVELOPMENT_REDIRECT_URI : this.PRODUCTION_REDIRECT_URI;
      console.log("SpotifyAuthService inicializado. Redirect URI usado:", this.REDIRECT_URI);
      // Verifica se a URL atual é a de callback para processá-la
      // Ajuste '/spotify-callback' se o nome da sua rota/página de callback for diferente.
      if (window.location.pathname.endsWith('/spotify-callback')) { 
        this.handleSpotifyCallback();
      }
    }
  };

  // --- MÓDULO: SpotifyPlaybackService (para o Web Playback SDK) ---
  const SpotifyPlaybackService = {
    LS_DEVICE_ID_KEY: 'spotify_messagelove_device_id', 
    spotifyPlayerInstance: null,
    currentPlaybackDeviceId: null,

    initializeWebPlaybackSDK: async function() {
      if (this.spotifyPlayerInstance) { console.log("SpotifyPlaybackService: Player SDK já está inicializado."); return; }
      
      const initialToken = await SpotifyAuthService.getValidAccessToken();
      if (!initialToken) {
        console.log("SpotifyPlaybackService: Usuário não logado ou token inválido. Player SDK não será inicializado.");
        return;
      }

      if (typeof Spotify === 'undefined' || !Spotify.Player) {
        console.error("SpotifyPlaybackService: Spotify SDK (Spotify.Player) não está carregado globalmente. Verifique a inclusão do script no HTML.");
        NotificationManager.showError("Erro ao carregar o player de música do Spotify.");
        return;
      }
      console.log("SpotifyPlaybackService: Inicializando Web Playback SDK...");

      this.spotifyPlayerInstance = new Spotify.Player({
          name:'Messagelove Web Player', 
          getOAuthToken: cb => { // Spotify SDK chama esta função para obter um token
            SpotifyAuthService.getValidAccessToken().then(token => {
              if (token) {
                cb(token);
              } else {
                console.error("SpotifyPlaybackService: Falha ao fornecer token para getOAuthToken do SDK.");
                cb(null); // Ou não chamar cb, o SDK pode tratar
              }
            });
          },
          volume:0.5
      });

      this.spotifyPlayerInstance.addListener('ready',({device_id})=>{ 
        console.log('SpotifyPlaybackService: Player SDK pronto. Device ID:', device_id);
        this.currentPlaybackDeviceId = device_id; 
        localStorage.setItem(this.LS_DEVICE_ID_KEY, device_id); 
        NotificationManager.showInfo("Player do Spotify conectado!");
      });
      this.spotifyPlayerInstance.addListener('not_ready',({device_id})=>{ 
        console.log('SpotifyPlaybackService: Device ID registrado, mas player não está pronto:', device_id);
        this.currentPlaybackDeviceId = null; 
        localStorage.removeItem(this.LS_DEVICE_ID_KEY);
      });
      this.spotifyPlayerInstance.addListener('initialization_error', ({message})=>{ console.error("SpotifyPlaybackService: Erro de inicialização do player:",message); NotificationManager.showError(`Erro de inicialização do player: ${message}`)});
      this.spotifyPlayerInstance.addListener('authentication_error',({message})=>{ console.error("SpotifyPlaybackService: Erro de autenticação do player:",message); NotificationManager.showError(`Erro de autenticação do player: ${message}. Tente logar novamente.`); SpotifyAuthService.spotifyLogout();});
      this.spotifyPlayerInstance.addListener('account_error',({message})=>{ console.error("SpotifyPlaybackService: Erro de conta Spotify:",message); NotificationManager.showError(`Erro de conta Spotify: ${message}. É necessário ser Premium para tocar músicas completas.`);});
      this.spotifyPlayerInstance.addListener('playback_error',({message})=>{ console.error("SpotifyPlaybackService: Erro de reprodução:",message); NotificationManager.showError(`Erro ao reproduzir música: ${message}`)});
      
      this.spotifyPlayerInstance.addListener('player_state_changed',(state)=>{ 
        if(!state){ console.warn("SpotifyPlaybackService: Estado do player é null."); /* TODO: updatePlayerUI(null); */ return; }
        /* console.log('SpotifyPlaybackService: Estado do player alterado:', state); */
        /* TODO: Chamar uma função App.updatePlayerUI(state) para atualizar sua interface */
      });

      this.spotifyPlayerInstance.connect().then(success => {
        if(success) console.log('SpotifyPlaybackService: Web Playback SDK conectado com sucesso!');
        else console.warn('SpotifyPlaybackService: Falha ao conectar o Web Playback SDK. Pode requerer interação do usuário.');
      });
    },
    onUserLoggedInToSpotify: function() { // Chamado pelo SpotifyAuthService após login
      console.log("SpotifyPlaybackService: onUserLoggedInToSpotify chamado.");
      if (window.Spotify && typeof window.Spotify.Player === 'function') {
        this.initializeWebPlaybackSDK();
      } else {
        console.log("SpotifyPlaybackService: SDK Spotify (global) ainda não carregado, aguardando onSpotifyWebPlaybackSDKReady.");
        // window.onSpotifyWebPlaybackSDKReady (definido em this.init) cuidará da inicialização
      }
    },
    onUserLoggedOut: function() { // Chamado pelo SpotifyAuthService ao deslogar
      console.log("SpotifyPlaybackService: Usuário deslogou, desconectando e limpando player.");
      if (this.spotifyPlayerInstance) {
          this.spotifyPlayerInstance.disconnect();
          this.spotifyPlayerInstance = null;
      }
      this.currentPlaybackDeviceId = null;
      localStorage.removeItem(this.LS_DEVICE_ID_KEY);
      // TODO: Atualizar UI para refletir que o player não está mais ativo
    },
    transferPlaybackToThisDevice: async function(play = false) {
      const deviceId = this.currentPlaybackDeviceId || localStorage.getItem(this.LS_DEVICE_ID_KEY);
      if (!deviceId) { NotificationManager.showError("Player do Spotify não está ativo localmente para transferência."); return false; }
      const token = await SpotifyAuthService.getValidAccessToken(); 
      if (!token) return false; // getValidAccessToken já notifica
      
      console.log(`SpotifyPlaybackService: Transferindo playback para device ${deviceId}, play: ${play}`);
      try {
        const response = await fetch('https://open.spotify.com/embed/track/$',{ // Endpoint /me/player
          method:'PUT', headers:{'Authorization':`Bearer ${token}`,'Content-Type':'application/json'},
          body:JSON.stringify({device_ids:[deviceId], play:play})
        });
        if(!response.ok) { 
          const errData = await response.json().catch(()=>({})); 
          console.error('SpotifyPlaybackService: Erro ao transferir playback:', response.status, errData.error?.message || response.statusText);
          NotificationManager.showError(`Falha ao ativar player: ${errData.error?.message||response.statusText}`); 
          return false; 
        }
        console.log("SpotifyPlaybackService: Playback transferido com sucesso."); return true;
      } catch(e){ 
        console.error('SpotifyPlaybackService: Erro de rede ao transferir playback:', e);
        NotificationManager.showError("Erro de rede ao tentar ativar o player."); return false;
      }
    },
    playTrackOnSpotify: async function(trackUri) {
      const deviceId = this.currentPlaybackDeviceId || localStorage.getItem(this.LS_DEVICE_ID_KEY);
      if(!deviceId){ NotificationManager.showError("Player do Spotify não está pronto ou selecionado."); return false; }
      const token = await SpotifyAuthService.getValidAccessToken(); 
      if(!token) return false; // getValidAccessToken já notifica

      console.log(`SpotifyPlaybackService: Tentando tocar ${trackUri} em ${deviceId}`);
      try {
        const response = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`,{ // Endpoint /me/player/play
          method:'PUT', headers:{'Authorization':`Bearer ${token}`,'Content-Type':'application/json'},
          body:JSON.stringify({uris:[trackUri]})
        });
        if(!response.ok){
          const errData = await response.json().catch(()=>({error:{message:`HTTP ${response.status}`}}));
          console.error('SpotifyPlaybackService: Erro da API Spotify ao tocar:', response.status, errData);
          let readableError = errData.error?.message || `Erro ${response.status} ao tocar música.`;
          if(errData.error?.reason === 'NO_ACTIVE_DEVICE' || errData.error?.reason === 'PLAYER_COMMAND_FAILED' || response.status === 404){
            NotificationManager.showInfo('Player não ativo ou comando falhou. Tentando ativar...');
            const transferSuccess = await this.transferPlaybackToThisDevice(true); // Tenta transferir e começar a tocar
            if(transferSuccess){ 
              console.log("SpotifyPlaybackService: Transferência bem-sucedida, tentando tocar música novamente em 1s...");
              return new Promise(resolve => setTimeout(async () => {
                  const playSuccessAgain = await this.playTrackOnSpotify(trackUri); 
                  resolve(playSuccessAgain);
              }, 1000)); // Pequeno delay para a transferência efetivar
            } else { 
              readableError = 'Não foi possível ativar o player web. Verifique o app Spotify ou tente recarregar a página.'; 
            }
          } else if(errData.error?.reason === 'PREMIUM_REQUIRED') readableError = 'É necessário Spotify Premium para tocar músicas completas.';
          else if(response.status === 403) readableError = 'Não foi possível tocar a música. Verifique suas permissões.';
          NotificationManager.showError(readableError); return false;
        }
        console.log(`SpotifyPlaybackService: Música ${trackUri} enviada para tocar.`); 
        // Sucesso implícito, player_state_changed deve refletir
        return true;
      }catch(e){ 
        console.error('SpotifyPlaybackService: Erro de rede ao tocar música:', e);
        NotificationManager.showError("Erro de rede ao tentar tocar a música."); return false;
      }
    },
    init: function() {
      window.onSpotifyWebPlaybackSDKReady = () => {
        console.log("Spotify Web Playback SDK (global) está pronto (chamado via window.onSpotifyWebPlaybackSDKReady).");
        if (SpotifyAuthService.isUserLoggedIn()) { // Verifica se já está logado para inicializar
          this.initializeWebPlaybackSDK();
        }
      };
      console.log("SpotifyPlaybackService inicializado e onSpotifyWebPlaybackSDKReady configurado.");
    }
  };

  // --- Módulo Principal da Aplicação ---
  const App = {
    init: function() {
      console.log('Aplicação Messagelove inicializando...');
      NotificationManager.init(); 
      SpotifyAuthService.init(); 
      SpotifyPlaybackService.init();

      // Inicializa seus módulos existentes (CERTIFIQUE-SE QUE ESTÃO COMPLETOS ACIMA)
      PhotoManager.init();
      Spotify.init(); 
      FormManager.init();

      const loginBtn = document.getElementById('loginWithSpotifyBtn');
      if (loginBtn) {
          loginBtn.addEventListener('click', () => SpotifyAuthService.redirectToSpotifyLogin());
      }
      const logoutBtn = document.getElementById('logoutSpotifyBtn');
      if (logoutBtn) { 
          logoutBtn.addEventListener('click', () => SpotifyAuthService.spotifyLogout());
      }
      
      this.updateAuthUI(); // Define o estado inicial dos botões de login/logout

      // Listener para botões de play (exemplo)
      document.body.addEventListener('click', function(event) {
        const playButton = event.target.closest('[data-play-track-uri]'); // Use um atributo data no seu HTML
        if (playButton) {
            const trackUri = playButton.dataset.playTrackUri;
            if (trackUri) {
                if (SpotifyAuthService.isUserLoggedIn()) {
                    console.log(`App: Usuário clicou para tocar ${trackUri}`);
                    SpotifyPlaybackService.playTrackOnSpotify(trackUri);
                } else {
                    NotificationManager.showInfo("Faça login com Spotify para tocar músicas completas.");
                    // Opcional: redirecionar para login: SpotifyAuthService.redirectToSpotifyLogin();
                }
            }
        }
      });
      console.log('Aplicação Messagelove pronta.');
    },
    updateAuthUI: function() {
      const loginBtn = document.getElementById('loginWithSpotifyBtn');
      const logoutBtn = document.getElementById('logoutSpotifyBtn');
      if (loginBtn && logoutBtn) { // Garante que os botões existem
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


if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', App.init.bind(App)); 
} else {
  App.init(); 
}
})(window, document);