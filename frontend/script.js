// Envolvemos todo o código em uma IIFE para criar um escopo privado
(function(window, document) {
  'use strict';

  const NotificationManager = {
    _notificationContainer: null, _defaultDuration: 3000, _animationDuration: 500,
    init: function() {
      if (!this._notificationContainer && document.body) {
        this._notificationContainer = document.createElement('div');
        this._notificationContainer.id = 'appNotificationArea';
        document.body.appendChild(this._notificationContainer);
        console.log("NotificationManager inicializado.");
      }
    },
    _removeMessage: function(el) {
      if (!el.parentElement) return;
      el.classList.add('notification--removing');
      setTimeout(() => {
        if (el.parentElement) el.remove();
      }, this._animationDuration);
    },
    _showMessage: function(msg, type = 'info', dur = this._defaultDuration) {
      if (!this._notificationContainer) this.init();
      const el = document.createElement('div');
      el.className = `notification notification--${type}`;
      el.textContent = msg;
      const cb = document.createElement('button');
      cb.innerHTML = '×';
      cb.className = 'notification__close';
      cb.onclick = () => this._removeMessage(el);
      el.appendChild(cb);
      this._notificationContainer.appendChild(el);
      if (dur) setTimeout(() => this._removeMessage(el), dur);
    },
    showSuccess: function(msg, dur) { this._showMessage(msg, 'success', dur); },
    showError: function(msg, dur) { this._showMessage(msg, 'error', dur || 5000); },
    showInfo: function(msg, dur) { this._showMessage(msg, 'info', dur); }
  };

  const Utils = {
    toggleButtonLoading: function(btn, isLoading, loadingTxt = 'Carregando...', defaultHtml = null) {
      if (!btn) return;
      if (isLoading) {
        if (!btn.classList.contains('btn--loading')) {
          btn.dataset.originalContent = btn.innerHTML;
          btn.innerHTML = `<span class="btn__loading"></span> ${loadingTxt}`;
          btn.disabled = true;
          btn.classList.add('btn--loading');
        }
      } else {
        if (btn.classList.contains('btn--loading')) {
          const oc = btn.dataset.originalContent || defaultHtml || 'Ação';
          btn.innerHTML = oc;
          btn.disabled = false;
          delete btn.dataset.originalContent;
          btn.classList.remove('btn--loading');
        }
      }
    },
    formatTime: function(s) {
      if (!isFinite(s) || s < 0) return '0:00';
      const m = Math.floor(s / 60);
      const secs = Math.floor(s % 60);
      return `${m}:${secs < 10 ? '0' : ''}${secs}`;
    },
  };

  const PROD_BACKEND_URL = 'https://messagelove-backend.onrender.com';
  const AppConfig = {
    getFrontendBaseUrl: function() { return `${window.location.protocol}//${window.location.host}`; },
    getBackendUrl: function() { console.log('Usando URL backend:', PROD_BACKEND_URL); return PROD_BACKEND_URL; }
  };

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
    previewContainer: document.querySelector('[data-js="preview-container"]')
  };

  const AudioPlayerManager = {
    createPlayer: function(t, pCtx = 'track') {
      const el = document.createElement('div');
      el.className = 'audio-player';
      el.setAttribute('data-track-name', t.name || 'esta faixa');
      el.innerHTML = `<button class="play-pause-btn" aria-label="Tocar prévia de ${t.name || 'faixa'}"><span class="play-icon">▶️</span><span class="pause-icon" style="display:none">⏸️</span></button><div class="progress-bar-container"><div class="progress-bar"></div></div><span class="duration">0:00 / 0:00</span><audio class="audio-element" preload="metadata"><source src="${t.previewUrl}" type="audio/mpeg">Seu navegador não suporta.</audio><div class="preview-error" style="display:none">Prévia indisponível.</div>`;
      this._initPlayerLogic(el, pCtx);
      return el;
    },
    _initPlayerLogic: function(pEl, pCtx) {
      const aE = pEl.querySelector('.audio-element');
      if (aE) aE.addEventListener('error', (e) => {
        console.error('AudioPlayerManager Error:', e);
        pEl.querySelector('.preview-error').style.display = 'block';
      });
    }
  };

  const PhotoManager = {
    init: function() {
      if (!DOM.fotoInput) return;
      DOM.fotoInput.addEventListener('change', () => this._handleFileSelect());
      if (DOM.removeFotoBtn) DOM.removeFotoBtn.addEventListener('click', () => this.removePhoto());
    },
    _handleFileSelect: function() {
      const f = DOM.fotoInput.files[0];
      if (!f) return;
      if (f.size > 5 * 1024 * 1024) {
        NotificationManager.showError('Imagem > 5MB');
        return;
      }
      const r = new FileReader();
      r.onload = () => {
        DOM.fotoPreview.src = r.result;
        DOM.fotoPreview.style.display = 'block';
        if (DOM.removeFotoBtn) DOM.removeFotoBtn.style.display = 'flex';
        if (DOM.previewContainer) DOM.previewContainer.hidden = false;
      };
      r.readAsDataURL(f);
    },
    removePhoto: function() {
      DOM.fotoInput.value = '';
      DOM.fotoPreview.src = '#';
      DOM.fotoPreview.style.display = 'none';
      if (DOM.removeFotoBtn) DOM.removeFotoBtn.style.display = 'none';
      if (DOM.previewContainer) DOM.previewContainer.hidden = true;
    }
  };

  const Spotify = {
    backendUrl: AppConfig.getBackendUrl(),
    originalSearchBtnContent: '<span class="search-icon">🔍</span> Buscar',
    init: function() {
      this.searchBtn = document.getElementById('searchSpotifyBtn');
      if (this.searchBtn) console.log('Módulo Spotify (Busca) inicializado.');
    },
    search: async function() { console.log("Busca Spotify chamada..."); },
    showFeedback: function(message, type) {
      const el = document.getElementById('spotifyResults');
      if (el) el.innerHTML = `<div class="feedback feedback--${type}">${message}</div>`;
    },
    resetSpotifySection: function() {
      const el = document.getElementById('spotifyResults');
      if (el) el.innerHTML = '';
    },
    _createAndInsertSection: function() {},
    _displayResults: function(tracks) {},
    _createTrackElement: function(track) { return document.createElement('div'); },
    _selectTrack: function(track, el) {},
    _showSelectedTrackFeedback: function(track) {}
  };

  const FormManager = {
    backendUrl: AppConfig.getBackendUrl(),
    originalSubmitBtnContent: 'Criar Cartão Mensagem',
    init: function() {
      if (DOM.form) {
        DOM.form.addEventListener('submit', async (e) => {
          e.preventDefault();
          await this._handleSubmit();
        });
        console.log("FormManager inicializado.");
      }
      this._setCurrentYear();
    },
    _clearFormState: function() {
      if (DOM.form) DOM.form.reset();
      PhotoManager.removePhoto();
      Spotify.resetSpotifySection();
    },
    _handleSubmit: async function() {},
    _showCardPreview: function(cardData, viewLink) {},
    _setCurrentYear: function() {
      if (DOM.currentYear) DOM.currentYear.textContent = new Date().getFullYear();
    }
  };

  // --- MÓDULO: SpotifyAuthService (para login/logout com Spotify) ---
  const SpotifyAuthService = {
    SPOTIFY_CLIENT_ID: '395d435fc0e04ba48f1eef95c6672195',
    PRODUCTION_REDIRECT_URI: 'https://messagelove-frontend.vercel.app/spotify-callback',
    DEVELOPMENT_REDIRECT_URI: 'http://localhost:3000/spotify-callback',
    REDIRECT_URI: '',

    LS_CODE_VERIFIER_KEY: 'spotify_pkce_code_verifier',
    LS_ACCESS_TOKEN_KEY: 'spotify_user_access_token',
    LS_REFRESH_TOKEN_KEY: 'spotify_user_refresh_token',
    LS_TOKEN_EXPIRES_AT_KEY: 'spotify_user_token_expires_at',

    _generateRandomString: function(length) {
      const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      return Array.from({ length }, () => possible.charAt(Math.floor(Math.random() * possible.length))).join('');
    },
    _generateCodeChallenge: async function(codeVerifier) {
      const encoder = new TextEncoder();
      const data = encoder.encode(codeVerifier);
      const digest = await window.crypto.subtle.digest('SHA-256', data);
      return btoa(String.fromCharCode(...new Uint8Array(digest)))
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    },
    redirectToSpotifyLogin: async function() {
      try {
        const codeVerifier = this._generateRandomString(128);
        const codeChallenge = await this._generateCodeChallenge(codeVerifier);
        localStorage.setItem(this.LS_CODE_VERIFIER_KEY, codeVerifier);
        const authUrl = new URL("https://accounts.spotify.com/authorize");
        authUrl.search = new URLSearchParams({
          response_type: 'code',
          client_id: this.SPOTIFY_CLIENT_ID,
          scope: 'streaming user-read-email user-read-private user-modify-playback-state user-read-playback-state user-read-currently-playing',
          redirect_uri: this.REDIRECT_URI,
          code_challenge_method: 'S256',
          code_challenge: codeChallenge,
        }).toString();
        window.location.href = authUrl.toString();
      } catch (error) {
        console.error("SpotifyAuth: Erro ao preparar login:", error);
        NotificationManager.showError("Não foi possível iniciar o login com Spotify.");
      }
    },
    handleSpotifyCallback: async function() {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const error = urlParams.get('error');

      const basePath = this.REDIRECT_URI.substring(0, this.REDIRECT_URI.lastIndexOf('/')) || '/';
      window.history.replaceState({}, document.title, basePath);

      if (error) {
        console.error('SpotifyAuth: Erro no callback Spotify:', error);
        NotificationManager.showError(`Erro de login com Spotify: ${error}. Tente novamente.`);
        this._cleanupAuthData();
        App.updateAuthUI();
        return false;
      }
      const codeVerifier = localStorage.getItem(this.LS_CODE_VERIFIER_KEY);
      if (!code || !codeVerifier) {
        console.log('SpotifyAuth: Callback sem código ou verifier.');
        return false;
      }
      try {
        const response = await fetch("https://accounts.spotify.com/api/token", {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            breeding: 'authorization_code',
            code: code,
            redirect_uri: this.REDIRECT_URI,
            client_id: this.SPOTIFY_CLIENT_ID,
            code_verifier: codeVerifier,
          }),
        });
        if (!response.ok) {
          const errData = await response.json().catch(() => ({ error_description: 'Erro desconhecido do servidor de token.' }));
          throw new Error(`Falha ao obter token: ${errData.error_description || response.statusText}`);
        }
        const tokenData = await response.json();
        this._storeTokenData(tokenData);
        localStorage.removeItem(this.LS_CODE_VERIFIER_KEY);
        NotificationManager.showSuccess("Login com Spotify realizado!");
        SpotifyPlaybackService.onUserLoggedInToSpotify();
        App.updateAuthUI();
        return true;
      } catch (err) {
        console.error('SpotifyAuth: Erro ao trocar código por token:', err);
        NotificationManager.showError(`Erro ao finalizar login: ${err.message}`);
        this._cleanupAuthData();
        App.updateAuthUI();
        return false;
      }
    },
    _storeTokenData: function(tokenData) {
      localStorage.setItem(this.LS_ACCESS_TOKEN_KEY, tokenData.access_token);
      if (tokenData.refresh_token) {
        localStorage.setItem(this.LS_REFRESH_TOKEN_KEY, tokenData.refresh_token);
      }
      localStorage.setItem(this.LS_TOKEN_EXPIRES_AT_KEY, (Date.now() + tokenData.expires_in * 1000).toString());
    },
    _cleanupAuthData: function() {
      localStorage.removeItem(this.LS_CODE_VERIFIER_KEY);
      localStorage.removeItem(this.LS_ACCESS_TOKEN_KEY);
      localStorage.removeItem(this.LS_REFRESH_TOKEN_KEY);
      localStorage.removeItem(this.LS_TOKEN_EXPIRES_AT_KEY);
      if (SpotifyPlaybackService && typeof SpotifyPlaybackService.onUserLoggedOut === 'function') {
        SpotifyPlaybackService.onUserLoggedOut();
      }
    },
    getValidAccessToken: async function() {
      let accessToken = localStorage.getItem(this.LS_ACCESS_TOKEN_KEY);
      let expiresAt = parseInt(localStorage.getItem(this.LS_TOKEN_EXPIRES_AT_KEY), 10);
      if (accessToken && expiresAt && Date.now() < expiresAt - (60 * 1000)) {
        return accessToken;
      }
      const refreshToken = localStorage.getItem(this.LS_REFRESH_TOKEN_KEY);
      if (!refreshToken) {
        if (accessToken) NotificationManager.showError('Sessão Spotify expirada. Faça login novamente.');
        this._cleanupAuthData();
        App.updateAuthUI();
        return null;
      }
      console.log('SpotifyAuth: Renovando token de acesso...');
      try {
        const response = await fetch("https://accounts.spotify.com/api/token", {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: refreshToken,
            client_id: this.SPOTIFY_CLIENT_ID,
          }),
        });
        if (!response.ok) {
          const errData = await response.json().catch(() => ({ error_description: 'Erro ao renovar token.' }));
          let msg = `Sessão Spotify expirou (${errData.error_description || response.statusText}). Faça login.`;
          if (errData.error === 'invalid_grant') msg = "Autorização Spotify revogada. Faça login.";
          NotificationManager.showError(msg);
          this._cleanupAuthData();
          App.updateAuthUI();
          return null;
        }
        const tokenData = await response.json();
        this._storeTokenData(tokenData);
        console.log('SpotifyAuth: Token renovado.');
        return tokenData.access_token;
      } catch (error) {
        console.error('SpotifyAuth: Erro de rede ao renovar token:', error);
        NotificationManager.showError("Erro de rede ao renovar sessão Spotify.");
        this._cleanupAuthData();
        App.updateAuthUI();
        return null;
      }
    },
    spotifyLogout: function() {
      console.log("SpotifyAuth: Logout...");
      this._cleanupAuthData();
      NotificationManager.showInfo("Desconectado do Spotify.");
      App.updateAuthUI();
    },
    isUserLoggedIn: function() {
      const accessToken = localStorage.getItem(this.LS_ACCESS_TOKEN_KEY);
      const expiresAt = parseInt(localStorage.getItem(this.LS_TOKEN_EXPIRES_AT_KEY), 10);
      return !!(accessToken && expiresAt && Date.now() < expiresAt - (10 * 1000));
    },
    init: function() {
      this.REDIRECT_URI = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
        ? this.DEVELOPMENT_REDIRECT_URI : this.PRODUCTION_REDIRECT_URI;
      console.log("SpotifyAuthService inicializado. Redirect URI:", this.REDIRECT_URI);
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
      if (this.spotifyPlayerInstance) return;
      const token = await SpotifyAuthService.getValidAccessToken();
      if (!token) return;
      if (typeof Spotify === 'undefined' || !Spotify.Player) {
        NotificationManager.showError("SDK Player Spotify não carregado.");
        return;
      }
      console.log("SpotifyPlaybackService: Inicializando Player SDK...");
      this.spotifyPlayerInstance = new Spotify.Player({
        name: 'Messagelove Player',
        getOAuthToken: SpotifyAuthService.getValidAccessToken.bind(SpotifyAuthService),
        volume: 0.5
      });
      this.spotifyPlayerInstance.addListener('ready', ({ device_id }) => {
        this.currentPlaybackDeviceId = device_id;
        localStorage.setItem(this.LS_DEVICE_ID_KEY, device_id);
        NotificationManager.showInfo("Player Spotify conectado!");
      });
      this.spotifyPlayerInstance.addListener('not_ready', () => {
        this.currentPlaybackDeviceId = null;
        localStorage.removeItem(this.LS_DEVICE_ID_KEY);
      });
      this.spotifyPlayerInstance.addListener('authentication_error', ({ message }) => {
        NotificationManager.showError(`Player Auth Error: ${message}`);
        SpotifyAuthService.spotifyLogout();
      });
      this.spotifyPlayerInstance.addListener('account_error', ({ message }) => {
        NotificationManager.showError(`Player Account Error: ${message}. Premium é necessário.`);
      });
      this.spotifyPlayerInstance.addListener('player_state_changed', (state) => {
        if (!state) return;
      });
      this.spotifyPlayerInstance.connect();
    },
    onUserLoggedInToSpotify: function() {
      console.log("SpotifyPlaybackService: Usuário logado, tentando inicializar SDK.");
      if (window.Spotify && typeof window.Spotify.Player === 'function') this.initializeWebPlaybackSDK();
      else console.log("SDK Spotify global não carregado, aguardando onSpotifyWebPlaybackSDKReady.");
    },
    onUserLoggedOut: function() {
      console.log("SpotifyPlaybackService: Usuário deslogado, desconectando player.");
      if (this.spotifyPlayerInstance) this.spotifyPlayerInstance.disconnect();
      this.spotifyPlayerInstance = null;
      this.currentPlaybackDeviceId = null;
      localStorage.removeItem(this.LS_DEVICE_ID_KEY);
    },
    transferPlaybackToThisDevice: async function(play = false) {
      if (!this.currentPlaybackDeviceId) return false;
      const token = await SpotifyAuthService.getValidAccessToken();
      if (!token) return false;
      try {
        const response = await fetch('https://api.spotify.com/v1/me/player', {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ device_ids: [this.currentPlaybackDeviceId], play })
        });
        return response.ok;
      } catch (e) {
        console.error('Erro ao transferir reprodução:', e);
        return false;
      }
    },
    playTrackOnSpotify: async function(trackUri) {
      const deviceId = this.currentPlaybackDeviceId || localStorage.getItem(this.LS_DEVICE_ID_KEY);
      if (!deviceId) {
        NotificationManager.showError("Player Spotify não pronto.");
        return false;
      }
      const token = await SpotifyAuthService.getValidAccessToken();
      if (!token) return false;
      try {
        const response = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ uris: [trackUri] })
        });
        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          if (errData.error?.reason === 'NO_ACTIVE_DEVICE' || response.status === 404) {
            NotificationManager.showInfo('Player inativo, tentando ativar...');
            const transferred = await this.transferPlaybackToThisDevice(true);
            if (transferred) {
              return new Promise(resolve => setTimeout(async () => {
                resolve(await this.playTrackOnSpotify(trackUri));
              }, 1000));
            }
          }
          NotificationManager.showError(`Erro ao tocar: ${errData.error?.message || response.statusText}`);
          return false;
        }
        return true;
      } catch (e) {
        NotificationManager.showError("Erro de rede ao tocar.");
        return false;
      }
    },
    init: function() {
      window.onSpotifyWebPlaybackSDKReady = () => {
        console.log("SDK Spotify global pronto.");
        if (SpotifyAuthService.isUserLoggedIn()) this.initializeWebPlaybackSDK();
      };
      console.log("SpotifyPlaybackService inicializado.");
    }
  };

  // --- Módulo Principal da Aplicação ---
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
      if (loginBtn) {
        loginBtn.addEventListener('click', () => SpotifyAuthService.redirectToSpotifyLogin());
      }
      const logoutBtn = document.getElementById('logoutSpotifyBtn');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', () => SpotifyAuthService.spotifyLogout());
      }

      this.updateAuthUI();

      document.body.addEventListener('click', function(event) {
        const playButton = event.target.closest('[data-play-track-uri]');
        if (playButton) {
          const trackUri = playButton.dataset.playTrackUri;
          if (trackUri) {
            if (SpotifyAuthService.isUserLoggedIn()) {
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

  // Inicializa a aplicação
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', App.init);
  } else {
    App.init();
  }

})(window, document);