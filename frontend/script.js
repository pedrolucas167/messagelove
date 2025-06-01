// Envolvemos todo o código em uma IIFE para criar um escopo privado
(function(window, document) {
  'use strict';

  // --- SEUS MÓDULOS EXISTENTES (NotificationManager, Utils, AppConfig, DOM, etc.) ---
  // ... (cole aqui as definições completas dos seus módulos: 
  //      NotificationManager, Utils, AppConfig, DOM, AudioPlayerManager, 
  //      PhotoManager, Spotify (o módulo de busca), FormManager) ...
  // Exemplo de como eles começam:
  /*
  const NotificationManager = { ... };
  const Utils = { ... };
  const AppConfig = { ... };
  const DOM = { ... };
  const AudioPlayerManager = { ... };
  const PhotoManager = { ... };
  const Spotify = { // Este é o seu módulo Spotify existente para busca
      backendUrl: AppConfig.getBackendUrl(),
      originalSearchBtnContent: '<span class="search-icon">🔍</span> Buscar',
      // ... resto do seu módulo Spotify de busca ...
      init: function() { // Exemplo de como o init dele se parece
          // ... lógica de init do Spotify (busca) ...
          console.log('Módulo Spotify (Busca) inicializado.');
      },
      // ... outras funções do Spotify (busca) ...
  };
  const FormManager = { ... };
  */

  // --- NOVO MÓDULO: SpotifyAuthService (para login/logout com Spotify) ---
  const SpotifyAuthService = {
    SPOTIFY_CLIENT_ID: 'SEU_SPOTIFY_CLIENT_ID_AQUI', // !!! SUBSTITUA PELO SEU CLIENT ID !!!
    PRODUCTION_REDIRECT_URI: 'https://messagelove-frontend.vercel.app/spotify-callback', // Callback em produção
    DEVELOPMENT_REDIRECT_URI: 'http://localhost:3000/spotify-callback', // !!! AJUSTE A PORTA LOCAL DO SEU FRONTEND !!!
    REDIRECT_URI: '', // Será definido no init

    LS_CODE_VERIFIER_KEY: 'spotify_pkce_code_verifier',
    LS_ACCESS_TOKEN_KEY: 'spotify_user_access_token',
    LS_REFRESH_TOKEN_KEY: 'spotify_user_refresh_token',
    LS_TOKEN_EXPIRES_AT_KEY: 'spotify_user_token_expires_at',

    _generateRandomString: function(length) {
      let text = '';
      const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      for (let i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
      }
      return text;
    },

    _generateCodeChallenge: async function(codeVerifier) {
      const encoder = new TextEncoder();
      const data = encoder.encode(codeVerifier);
      const digest = await window.crypto.subtle.digest('SHA-256', data);
      return btoa(String.fromCharCode(...new Uint8Array(digest)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
    },

    redirectToSpotifyLogin: async function() {
      const codeVerifier = this._generateRandomString(128);
      const codeChallenge = await this._generateCodeChallenge(codeVerifier);
      localStorage.setItem(this.LS_CODE_VERIFIER_KEY, codeVerifier);

      const authUrl = new URL("https://api.spotify.com/v1/me/player/play?device_id=");
      authUrl.search = new URLSearchParams({
        response_type: 'code',
        client_id: this.SPOTIFY_CLIENT_ID,
        scope: 'streaming user-read-email user-read-private user-modify-playback-state user-read-playback-state user-read-currently-playing',
        redirect_uri: this.REDIRECT_URI,
        code_challenge_method: 'S256',
        code_challenge: codeChallenge,
      }).toString();
      window.location.href = authUrl.toString();
    },

    handleSpotifyCallback: async function() {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const error = urlParams.get('error');

      // Limpa os parâmetros da URL para evitar que o código seja processado novamente em um refresh
      window.history.replaceState({}, document.title, this.REDIRECT_URI.substring(0, this.REDIRECT_URI.lastIndexOf('/')) || '/');


      if (error) {
        console.error('Erro no callback do Spotify:', error);
        NotificationManager.showError(`Erro de login com Spotify: ${error}. Tente novamente.`);
        this._cleanupAuthData();
        // window.location.href = '/'; // Redireciona para home
        return;
      }

      const codeVerifier = localStorage.getItem(this.LS_CODE_VERIFIER_KEY);
      if (!code || !codeVerifier) {
        console.error('Callback do Spotify: Código de autorização ou code_verifier não encontrado.');
        // Não mostrar erro se for apenas um carregamento normal da página de callback sem código
        return;
      }

      try {
        const response = await fetch("https://accounts.spotify.com/api/token", {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: this.REDIRECT_URI,
            client_id: this.SPOTIFY_CLIENT_ID,
            code_verifier: codeVerifier,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(`Falha ao obter token: ${errorData.error_description || response.statusText}`);
        }

        const tokenData = await response.json();
        this._storeTokenData(tokenData);
        localStorage.removeItem(this.LS_CODE_VERIFIER_KEY);
        NotificationManager.showSuccess("Login com Spotify realizado com sucesso!");
        
        // Notificar o serviço do player que o login foi bem-sucedido
        SpotifyPlaybackService.onUserLoggedInToSpotify();
        
        // Redireciona para a página principal (ou de onde o login foi iniciado)
        // window.location.href = '/'; // Ajuste conforme necessário
      } catch (err) {
        console.error('Erro ao trocar código por token:', err);
        NotificationManager.showError(`Erro ao finalizar login com Spotify: ${err.message}`);
        this._cleanupAuthData();
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
      localStorage.removeItem(SpotifyPlaybackService.LS_DEVICE_ID_KEY); // Limpa device_id também
      // Adicional: informar ao PlayerService que o usuário deslogou
      if (SpotifyPlaybackService.spotifyPlayerInstance) {
        SpotifyPlaybackService.spotifyPlayerInstance.disconnect();
        SpotifyPlaybackService.spotifyPlayerInstance = null;
        SpotifyPlaybackService.currentPlaybackDeviceId = null;
      }
    },

    getValidAccessToken: async function() {
      let accessToken = localStorage.getItem(this.LS_ACCESS_TOKEN_KEY);
      let expiresAt = parseInt(localStorage.getItem(this.LS_TOKEN_EXPIRES_AT_KEY), 10);

      if (accessToken && expiresAt && Date.now() < expiresAt - (60 * 1000)) { // Buffer de 1 min
        return accessToken;
      }

      const refreshToken = localStorage.getItem(this.LS_REFRESH_TOKEN_KEY);
      if (!refreshToken) {
        console.log('SpotifyAuth: Refresh token não disponível. Login necessário.');
        this._cleanupAuthData();
        return null;
      }

      console.log('SpotifyAuth: Access token expirado ou próximo de expirar. Tentando renovar...');
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
          const errorData = await response.json().catch(() => ({}));
          console.error('SpotifyAuth: Falha ao renovar token:', errorData.error_description || response.statusText);
          NotificationManager.showError("Sua sessão Spotify expirou. Por favor, faça login novamente.");
          this._cleanupAuthData();
          // Opcional: forçar redirecionamento para login
          // this.redirectToSpotifyLogin();
          return null;
        }

        const tokenData = await response.json();
        this._storeTokenData(tokenData);
        console.log('SpotifyAuth: Token renovado com sucesso.');
        return tokenData.access_token;
      } catch (error) {
        console.error('SpotifyAuth: Erro de rede ao renovar token:', error);
        NotificationManager.showError("Erro de rede ao tentar renovar sessão Spotify.");
        this._cleanupAuthData();
        return null;
      }
    },

    spotifyLogout: function() {
      console.log("SpotifyAuth: Fazendo logout...");
      this._cleanupAuthData();
      NotificationManager.showInfo("Você foi desconectado do Spotify.");
      // Atualize a UI para refletir o estado de logout
      // Ex: document.getElementById('userSpecificContent').style.display = 'none';
      // document.getElementById('loginWithSpotifyBtn').style.display = 'block';
      // window.location.reload(); // Simples, mas pode ser disruptivo
    },

    isUserLoggedIn: function() {
      return !!localStorage.getItem(this.LS_ACCESS_TOKEN_KEY);
    },
    
    init: function() {
      this.REDIRECT_URI = window.location.hostname === 'localhost' ? this.DEVELOPMENT_REDIRECT_URI : this.PRODUCTION_REDIRECT_URI;
      console.log("SpotifyAuthService inicializado. Redirect URI:", this.REDIRECT_URI);

      // Lógica para o botão de login (que você tinha fora da IIFE)
      const loginBtn = document.getElementById('loginWithSpotifyBtn');
      if (loginBtn) {
        loginBtn.addEventListener('click', () => this.redirectToSpotifyLogin());
      } else {
        // Se o botão de login não for encontrado no HTML, o usuário não poderá logar.
        // Isso pode ser normal se o botão só aparece em certas condições.
        // console.warn("Botão 'loginWithSpotifyBtn' não encontrado no DOM.");
      }

      // Lógica para o callback (que você tinha fora da IIFE)
      // Verifique se o pathname TERMINA com /spotify-callback ou o nome da sua rota de callback.
      // Ajuste '/spotify-callback' se o nome da sua rota for diferente.
      if (window.location.pathname.endsWith('/spotify-callback')) {
        this.handleSpotifyCallback();
      }
    }
  };

  // --- NOVO MÓDULO: SpotifyPlaybackService (para o Web Playback SDK) ---
  const SpotifyPlaybackService = {
    LS_DEVICE_ID_KEY: 'spotify_messagelove_device_id',
    spotifyPlayerInstance: null,
    currentPlaybackDeviceId: null,

    initializeWebPlaybackSDK: async function() {
      if (this.spotifyPlayerInstance) {
        console.log("SpotifyPlaybackService: Player SDK já está inicializado.");
        return;
      }
      
      const initialToken = await SpotifyAuthService.getValidAccessToken();
      if (!initialToken) {
        console.log("SpotifyPlaybackService: Usuário não logado no Spotify ou token inválido. Player SDK não será inicializado.");
        return;
      }

      if (typeof Spotify === 'undefined' || !Spotify.Player) {
        console.error("SpotifyPlaybackService: Spotify SDK (Spotify.Player) não está carregado globalmente.");
        NotificationManager.showError("Erro ao carregar o player de música do Spotify.");
        return;
      }
      console.log("SpotifyPlaybackService: Inicializando Web Playback SDK...");

      this.spotifyPlayerInstance = new Spotify.Player({
        name: 'Messagelove Player',
        getOAuthToken: async (cb) => {
          const token = await SpotifyAuthService.getValidAccessToken();
          if (token) {
            cb(token);
          } else {
            console.error("SpotifyPlaybackService: Falha ao obter token para o SDK. O usuário pode precisar logar novamente.");
            // Não chamar cb() ou chamar cb(null) pode fazer o SDK entrar em estado de erro.
            // A lógica em getValidAccessToken já tenta limpar e notificar.
          }
        },
        volume: 0.5
      });

      this.spotifyPlayerInstance.addListener('ready', ({ device_id }) => {
        console.log('SpotifyPlaybackService: Player SDK pronto com Device ID:', device_id);
        this.currentPlaybackDeviceId = device_id;
        localStorage.setItem(this.LS_DEVICE_ID_KEY, device_id);
        NotificationManager.showInfo("Player do Spotify conectado!");
      });

      this.spotifyPlayerInstance.addListener('not_ready', ({ device_id }) => {
        console.log('SpotifyPlaybackService: Device ID registrado, mas player não está pronto:', device_id);
        this.currentPlaybackDeviceId = null;
        localStorage.removeItem(this.LS_DEVICE_ID_KEY);
      });

      // Adicione outros listeners (initialization_error, authentication_error, account_error, playback_error, player_state_changed) aqui...
      // Exemplo:
      this.spotifyPlayerInstance.addListener('authentication_error', ({ message }) => {
        console.error('SpotifyPlaybackService: Falha de autenticação do player:', message);
        NotificationManager.showError(`Erro de autenticação do player: ${message}. Tente logar novamente.`);
        SpotifyAuthService.spotifyLogout();
      });
      this.spotifyPlayerInstance.addListener('account_error', ({ message }) => {
        console.error('SpotifyPlaybackService: Erro de conta (ex: não Premium):', message);
        NotificationManager.showError(`Erro de conta Spotify: ${message}. É necessário ser Premium para tocar músicas completas.`);
      });
       this.spotifyPlayerInstance.addListener('player_state_changed', (state) => {
        if (!state) {
          console.warn('SpotifyPlaybackService: Estado do player alterado para null.');
          // Atualize sua UI para refletir que nada está tocando ou o player está inativo
          // Ex: updatePlayerUI(null); // Você precisará criar esta função
          return;
        }
        // console.log('SpotifyPlaybackService: Estado do player alterado:', state);
        // Ex: updatePlayerUI(state);
      });


      this.spotifyPlayerInstance.connect().then(success => {
        if (success) {
          console.log('SpotifyPlaybackService: Web Playback SDK conectado com sucesso!');
        } else {
          console.warn('SpotifyPlaybackService: Falha ao conectar o Web Playback SDK.');
        }
      });
    },

    onUserLoggedInToSpotify: function() {
      console.log("SpotifyPlaybackService: Chamado onUserLoggedInToSpotify.");
      if (window.Spotify && typeof window.Spotify.Player === 'function') {
        this.initializeWebPlaybackSDK();
      } else {
        console.log("SpotifyPlaybackService: SDK do Spotify (global) ainda não carregado, aguardando onSpotifyWebPlaybackSDKReady.");
        // window.onSpotifyWebPlaybackSDKReady já está configurado para chamar initializeWebPlaybackSDK quando estiver pronto
      }
    },
    
    playTrackOnSpotify: async function(trackUri) { // trackUri é "spotify:track:ID_DA_MUSICA"
      const deviceId = localStorage.getItem(this.LS_DEVICE_ID_KEY);
      if (!deviceId) {
        NotificationManager.showError("Player do Spotify não está pronto ou não foi selecionado.");
        console.error("SpotifyPlaybackService: Device ID não encontrado.");
        return false;
      }

      const accessToken = await SpotifyAuthService.getValidAccessToken();
      if (!accessToken) {
        NotificationManager.showError("Sua sessão Spotify expirou. Por favor, faça login novamente.");
        return false;
      }

      try {
        const response = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ uris: [trackUri] }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('SpotifyPlaybackService: Erro da API ao tocar:', response.status, errorData);
          let readableError = errorData.error?.message || `Erro ${response.status} ao tocar música.`;
          // Adicione tratamento para erros específicos como PREMIUM_REQUIRED, NO_ACTIVE_DEVICE, etc.
          NotificationManager.showError(readableError);
          return false;
        }
        console.log(`SpotifyPlaybackService: Música ${trackUri} enviada para device ${deviceId}`);
        NotificationManager.showInfo(`Tocando ${trackUri.split(':').pop()}...`); // Mostra ID da faixa
        return true;
      } catch (error) {
        console.error('SpotifyPlaybackService: Erro de rede ao tocar música:', error);
        NotificationManager.showError("Erro de rede ao tentar tocar a música.");
        return false;
      }
    },
    
    // Adicione aqui métodos de controle do player se quiser expô-los
    // Ex: togglePlay, nextTrack, previousTrack, etc.
    // Eles chamariam os métodos correspondentes em this.spotifyPlayerInstance

    init: function() {
      // window.onSpotifyWebPlaybackSDKReady é o principal ponto de entrada para inicializar o player
      // quando o script do SDK do Spotify é carregado.
      window.onSpotifyWebPlaybackSDKReady = () => {
        console.log("Spotify Web Playback SDK (global) está pronto para ser usado.");
        // Se o usuário já estiver logado (ex: token no localStorage), tenta inicializar o player.
        // Isso é útil para quando a página é recarregada e o usuário já estava logado.
        if (SpotifyAuthService.isUserLoggedIn()) {
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
      
      // Inicializa os serviços de autenticação e player primeiro.
      // SpotifyAuthService.init() configura os listeners para o botão de login
      // e para o callback do Spotify.
      SpotifyAuthService.init(); 
      // SpotifyPlaybackService.init() configura o window.onSpotifyWebPlaybackSDKReady
      // para que, quando o SDK do Spotify estiver carregado, ele tente inicializar o player
      // se o usuário já estiver logado.
      SpotifyPlaybackService.init();

      // Inicializa os módulos existentes
      PhotoManager.init();
      Spotify.init(); // Este é o seu módulo Spotify para BUSCA de músicas
      FormManager.init();

      // Exemplo de como você poderia adicionar um botão de logout
      const logoutBtn = document.getElementById('logoutSpotifyBtn'); // Crie este botão no seu HTML
      if (logoutBtn && SpotifyAuthService) { // Verifica se o módulo está definido
          logoutBtn.addEventListener('click', () => SpotifyAuthService.spotifyLogout());
      }

      // Exemplo de como um botão para tocar uma música específica funcionaria:
      // Suponha que você tenha um botão em algum lugar com data-track-uri="spotify:track:XYZ"
      // document.querySelectorAll('[data-js-play-spotify-track]').forEach(btn => {
      //   btn.addEventListener('click', function() {
      //     if (SpotifyAuthService.isUserLoggedIn()) {
      //       const trackUri = this.dataset.trackUri;
      //       SpotifyPlaybackService.playTrackOnSpotify(trackUri);
      //     } else {
      //       NotificationManager.showInfo("Por favor, faça login com o Spotify para tocar músicas completas.");
      //       // Opcional: Chamar SpotifyAuthService.redirectToSpotifyLogin();
      //     }
      //   });
      // });


      if (typeof tsParticles !== 'undefined' && typeof initParticles === 'function') {
        // initParticles();
      }
      console.log('Aplicação Messagelove pronta.');
    }
  };

  // Inicializa a aplicação
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', App.init);
  } else {
    App.init(); // DOM já carregado
  }

  // Opcional: Expor módulos principais para debug ou para serem chamados por outros scripts (se necessário)
  // window.MyApp = {
  //   NotificationManager,
  //   Utils,
  //   AppConfig,
  //   DOM,
  //   SpotifyAuthService,
  //   SpotifyPlaybackService,
  //   App
  // };

})(window, document);