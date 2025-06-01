// spotifyAuth.js

// --- Configurações e Constantes ---
const SPOTIFY_CLIENT_ID = '395d435fc0e04ba48f1eef95c6672195';
const PRODUCTION_REDIRECT_URI = 'https://messagelove-frontend.vercel.app/spotify-callback';
const DEVELOPMENT_REDIRECT_URI = 'http://localhost:3000/spotify-callback'; // Ajuste a porta se necessário
const REDIRECT_URI = window.location.hostname === 'localhost' ? DEVELOPMENT_REDIRECT_URI : PRODUCTION_REDIRECT_URI;
const LS_DEVICE_ID_KEY = 'spotify_device_id';

const SPOTIFY_AUTH_SCOPES = [
  'streaming',
  'user-read-email',
  'user-read-private',
  'user-modify-playback-state',
  'user-read-playback-state',
  'user-read-currently-playing'
].join(' ');

// Chaves para localStorage
const LS_CODE_VERIFIER_KEY = 'spotify_pkce_code_verifier';
const LS_ACCESS_TOKEN_KEY = 'spotify_user_access_token';
const LS_REFRESH_TOKEN_KEY = 'spotify_user_refresh_token';
const LS_TOKEN_EXPIRES_AT_KEY = 'spotify_user_token_expires_at';

// --- Funções Auxiliares PKCE ---
function generateRandomString(length) {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from({ length }, () => possible.charAt(Math.floor(Math.random() * possible.length))).join('');
}

async function generateCodeChallenge(codeVerifier) {
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const digest = await window.crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

// --- Funções de Autenticação ---

/**
 * Inicia o fluxo de login do Spotify redirecionando o usuário.
 */
async function redirectToSpotifyLogin() {
  const codeVerifier = generateRandomString(128);
  const codeChallenge = await generateCodeChallenge(codeVerifier);

  localStorage.setItem(LS_CODE_VERIFIER_KEY, codeVerifier);

  const authUrl = new URL('https://accounts.spotify.com/authorize');
  const params = {
    response_type: 'code',
    client_id: SPOTIFY_CLIENT_ID,
    scope: SPOTIFY_AUTH_SCOPES,
    redirect_uri: REDIRECT_URI,
    code_challenge_method: 'S256',
    code_challenge: codeChallenge,
  };
  authUrl.search = new URLSearchParams(params).toString();
  window.location.href = authUrl.toString();
}

/**
 * Lida com o callback do Spotify após o login, trocando o código por um access token.
 */
async function handleSpotifyCallback() {
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');
  const error = urlParams.get('error');

  if (error) {
    console.error('Erro no callback do Spotify:', error);
    NotificationManager?.showError?.(`Erro de login com Spotify: ${error}`) ?? console.log(`Erro de login com Spotify: ${error}`);
    cleanupAuthData();
    window.history.replaceState({}, document.title, window.location.pathname);
    return;
  }

  const codeVerifier = localStorage.getItem(LS_CODE_VERIFIER_KEY);

  if (!code || !codeVerifier) {
    console.error('Código de autorização ou code_verifier não encontrado.');
    return;
  }

  try {
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: REDIRECT_URI,
        client_id: SPOTIFY_CLIENT_ID,
        code_verifier: codeVerifier,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Falha ao obter token: ${errorData.error_description || response.statusText}`);
    }

    const data = await response.json();
    storeTokenData(data);
    localStorage.removeItem(LS_CODE_VERIFIER_KEY);
    window.history.replaceState({}, document.title, window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/') + 1) || '/');
    window.location.href = window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/') + 1) || '/';
  } catch (err) {
    console.error('Erro ao trocar código por token:', err);
    NotificationManager?.showError?.(`Erro ao finalizar login: ${err.message}`) ?? console.log(`Erro ao finalizar login: ${err.message}`);
    cleanupAuthData();
  }
}

/**
 * Armazena os dados do token no localStorage.
 * @param {Object} tokenData - Dados do token retornados pela API do Spotify.
 */
function storeTokenData(tokenData) {
  localStorage.setItem(LS_ACCESS_TOKEN_KEY, tokenData.access_token);
  if (tokenData.refresh_token) {
    localStorage.setItem(LS_REFRESH_TOKEN_KEY, tokenData.refresh_token);
  }
  localStorage.setItem(LS_TOKEN_EXPIRES_AT_KEY, (Date.now() + tokenData.expires_in * 1000).toString());
}

/**
 * Limpa todos os dados de autenticação do localStorage.
 */
function cleanupAuthData() {
  localStorage.removeItem(LS_CODE_VERIFIER_KEY);
  localStorage.removeItem(LS_ACCESS_TOKEN_KEY);
  localStorage.removeItem(LS_REFRESH_TOKEN_KEY);
  localStorage.removeItem(LS_TOKEN_EXPIRES_AT_KEY);
  localStorage.removeItem(LS_DEVICE_ID_KEY);
}

/**
 * Obtém um access token válido, renovando-o se necessário.
 * @returns {Promise<string|null>} O access token ou null se não puder ser obtido/renovado.
 */
async function getValidAccessToken() {
  const accessToken = localStorage.getItem(LS_ACCESS_TOKEN_KEY);
  const expiresAt = parseInt(localStorage.getItem(LS_TOKEN_EXPIRES_AT_KEY), 10);

  if (accessToken && expiresAt && Date.now() < expiresAt - 60 * 1000) {
    return accessToken;
  }

  const refreshToken = localStorage.getItem(LS_REFRESH_TOKEN_KEY);
  if (!refreshToken) {
    console.log('Refresh token não disponível. Login necessário.');
    cleanupAuthData();
    return null;
  }

  console.log('Access token expirado ou ausente. Tentando renovar...');
  try {
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: SPOTIFY_CLIENT_ID,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Falha ao renovar token:', errorData.error_description || response.statusText);
      cleanupAuthData();
      return null;
    }

    const data = await response.json();
    storeTokenData(data);
    console.log('Token renovado com sucesso.');
    return data.access_token;
  } catch (error) {
    console.error('Erro de rede ao renovar token:', error);
    cleanupAuthData();
    return null;
  }
}

/**
 * Faz logout, limpando os tokens do Spotify.
 */
function spotifyLogout() {
  cleanupAuthData();
  NotificationManager?.showInfo?.('Você foi desconectado do Spotify.') ?? console.log('Você foi desconectado do Spotify.');
}

/**
 * Toca uma faixa no Spotify.
 * @param {string} trackUri - URI da faixa (ex: "spotify:track:ID_DA_MUSICA").
 * @returns {Promise<boolean>} True se a reprodução for iniciada com sucesso, false caso contrário.
 */
async function playTrackOnSpotify(trackUri) {
  const deviceId = localStorage.getItem(LS_DEVICE_ID_KEY);
  if (!deviceId) {
    console.error('Device ID não encontrado. Não é possível tocar a música.');
    NotificationManager?.showError?.('Player do Spotify não está pronto ou não foi selecionado.') ?? console.log('Player do Spotify não está pronto.');
    return false;
  }

  const accessToken = await getValidAccessToken();
  if (!accessToken) {
    NotificationManager?.showError?.('Sua sessão Spotify expirou. Faça login novamente.') ?? console.log('Sessão Spotify expirada.');
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
      console.error('Erro da API do Spotify ao tentar tocar:', response.status, errorData);
      let readableError = errorData.error?.message || `Erro ${response.status}`;
      if (errorData.error?.reason === 'PREMIUM_REQUIRED') {
        readableError = 'É necessário Spotify Premium para tocar músicas completas.';
      } else if (response.status === 403) {
        readableError = 'Não foi possível tocar a música. Verifique suas permissões ou se o player está ativo.';
      } else if (response.status === 404 && errorData.error?.reason === 'NO_ACTIVE_DEVICE') {
        readableError = 'Nenhum dispositivo ativo encontrado. Tente selecionar o "Messagelove Player" no app Spotify.';
      }
      NotificationManager?.showError?.(readableError) ?? console.log(readableError);
      return false;
    }
    console.log(`Música ${trackUri} enviada para tocar no device ${deviceId}`);
    return true;
  } catch (error) {
    console.error('Erro de rede ao tentar tocar música:', error);
    NotificationManager?.showError?.('Erro de rede ao tentar tocar a música.') ?? console.log('Erro de rede ao tentar tocar.');
    return false;
  }
}

/**
 * Transfere a reprodução para o dispositivo atual.
 * @param {string} deviceId - ID do dispositivo.
 * @param {string} token - Access token.
 * @returns {Promise<void>}
 */
async function transferPlaybackToThisDevice(deviceId, token) {
  if (!deviceId || !token) return;
  try {
    const response = await fetch('https://api.spotify.com/v1/me/player', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ device_ids: [deviceId], play: false }),
    });
    if (!response.ok) {
      console.error('Erro ao transferir reprodução:', response.statusText);
    }
  } catch (error) {
    console.error('Erro de rede ao transferir reprodução:', error);
  }
}

// Exporta funções para uso global
window.SpotifyAuth = { redirectToSpotifyLogin, handleSpotifyCallback, getValidAccessToken, spotifyLogout, storeTokenData };
window.SpotifyPlayer = { playTrackOnSpotify, transferPlaybackToThisDevice };