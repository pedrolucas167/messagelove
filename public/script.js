/**
 * @file script.js
 * @description Script para a página de CRIAÇÃO de cartões (index.html), lida com formulário, upload, YouTube e envio para o backend.
 * @author Pedro Marques
 * @version 1.0.0
 */

let youtubeCreatorPlayer = null; // Instância do player do YouTube para a página de criação

window.onYouTubeIframeAPIReady = function() {
    console.log('API do YouTube carregada e pronta (modo CRIAÇÃO).');
    // Se houver um input de URL preenchido, inicializa o player de pré-visualização.
    if (typeof window.initCreatorPlayer === 'function') {
        window.initCreatorPlayer();
    }
};

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded - Iniciando script.js (Modo CRIAÇÃO)');

    // --- Configurações e Constantes ---
    const IS_LOCAL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const API_URL = IS_LOCAL
        ? 'http://localhost:3001/api'
        : 'https://messagelove-backend.onrender.com/api';
    console.log(`API_URL para criação: ${API_URL}`);

    // --- Seletores do DOM (Específicos para CRIAÇÃO) ---
    const cardForm = document.getElementById('cardForm');
    const submitBtn = document.getElementById('submitBtn');
    const nomeInput = document.getElementById('nome');
    const mensagemInput = document.getElementById('mensagem');
    const dataInput = document.getElementById('data');
    const fotoUploadInput = document.getElementById('fotoUpload');
    const fotoCreatorPreviewContainer = document.querySelector('[data-js="preview-container"]');
    const fotoCreatorPreviewImg = document.querySelector('[data-js="foto-preview"]');
    const removeFotoBtn = document.querySelector('[data-js="remove-foto"]');
    const youtubeUrlInput = document.getElementById('youtubeUrlInput');
    const addYoutubeUrlBtn = document.getElementById('addYoutubeUrlBtn');
    const youtubeErrorEl = document.getElementById('youtubeError');
    const youtubeCreatorPreviewContainer = document.getElementById('youtubePreviewContainer');
    const youtubeCreatorPlayerIframe = document.getElementById('youtubePlayer');
    const youtubeVideoIdInputHidden = document.getElementById('youtubeVideoId');
    const appNotificationArea = document.getElementById('appNotificationArea'); // Para notificações

    // --- Funções Auxiliares (Comuns para este arquivo) ---
    const showNotification = (message, type = 'info', duration = 3000) => {
        if (!appNotificationArea) {
            console.warn('Área de notificação não encontrada. Não é possível exibir a notificação.');
            return;
        }
        const notificationEl = document.createElement('div');
        notificationEl.className = `notification notification--${type}`;
        notificationEl.innerHTML = `
            <span>${message}</span>
            <button class="notification__close">×</button>
        `;
        appNotificationArea.appendChild(notificationEl);

        const closeBtn = notificationEl.querySelector('.notification__close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                notificationEl.classList.add('notification--removing');
                notificationEl.addEventListener('animationend', () => notificationEl.remove());
            });
        }
        if (duration) {
            setTimeout(() => {
                notificationEl.classList.add('notification--removing');
                notificationEl.addEventListener('animationend', () => notificationEl.remove());
            }, duration);
        }
    };

    // --- Funções do Modo de CRIAÇÃO ---

    // Lógica de Upload de Foto para a página de CRIAÇÃO
    if (fotoUploadInput && fotoCreatorPreviewContainer && fotoCreatorPreviewImg && removeFotoBtn) {
        fotoUploadInput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    fotoCreatorPreviewImg.src = e.target.result;
                    fotoCreatorPreviewContainer.hidden = false;
                };
                reader.readAsDataURL(file);
            } else {
                fotoCreatorPreviewImg.src = '';
                fotoCreatorPreviewContainer.hidden = true;
            }
        });

        removeFotoBtn.addEventListener('click', () => {
            fotoUploadInput.value = '';
            fotoCreatorPreviewImg.src = '';
            fotoCreatorPreviewContainer.hidden = true;
        });
    }

    // Função para inicializar o player de criação
    window.initCreatorPlayer = () => {
        if (!youtubeUrlInput || !youtubeCreatorPlayerIframe || !youtubeCreatorPreviewContainer || !youtubeVideoIdInputHidden) {
            console.warn('Elementos do player de criação não encontrados para inicializar.');
            return;
        }
        const url = youtubeUrlInput.value.trim();
        if (url) {
            const regExp = /(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
            const match = url.match(regExp);
            if (match && match[1]) {
                const videoId = match[1];
                youtubeVideoIdInputHidden.value = videoId;
                youtubeCreatorPreviewContainer.classList.add('active');
                if (typeof YT !== 'undefined' && typeof YT.Player !== 'undefined') {
                    if (youtubeCreatorPlayer) {
                        youtubeCreatorPlayer.loadVideoById(videoId);
                    } else {
                        youtubeCreatorPlayer = new YT.Player(youtubeCreatorPlayerIframe, {
                            height: '100%',
                            width: '100%',
                            videoId: videoId,
                            playerVars: { 'controls': 1, 'rel': 0, 'modestbranding': 1 },
                            events: {
                                'onReady': (event) => { console.log('Player de CRIAÇÃO pronto.'); },
                                'onError': (error) => {
                                    console.error('Erro no player de criação do YouTube:', error);
                                    if (youtubeErrorEl) youtubeErrorEl.textContent = 'Não foi possível carregar o vídeo. Verifique o link.';
                                    if (youtubeCreatorPreviewContainer) youtubeCreatorPreviewContainer.classList.remove('active');
                                }
                            }
                        });
                    }
                } else {
                    // Fallback simples para pré-visualização sem API do YouTube carregada ainda
                    youtubeCreatorPlayerIframe.src = `http://www.youtube.com/embed/${videoId}?enablejsapi=1&controls=1`; // Corrigido o URL
                    if (youtubeErrorEl) youtubeErrorEl.textContent = 'API do YouTube ainda não carregada. Pré-visualização simples.';
                }
            } else {
                if (youtubeErrorEl) youtubeErrorEl.textContent = 'Link do YouTube inválido. Por favor, verifique.';
                if (youtubeCreatorPreviewContainer) youtubeCreatorPreviewContainer.classList.remove('active');
                youtubeVideoIdInputHidden.value = '';
            }
        }
    };

    // Lógica de Adicionar Vídeo do YouTube para a página de CRIAÇÃO (listener do botão)
    if (addYoutubeUrlBtn) {
        addYoutubeUrlBtn.addEventListener('click', () => {
            const url = youtubeUrlInput.value.trim();
            if (youtubeErrorEl) youtubeErrorEl.textContent = '';

            if (!url) {
                if (youtubeErrorEl) youtubeErrorEl.textContent = 'Por favor, insira um link do YouTube.';
                return;
            }
            window.initCreatorPlayer(); // Chama a função que já faz a lógica de extração e inicialização
        });
    }

    // Lógica de envio do Formulário de CRIAÇÃO
    if (cardForm) {
        cardForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const nomeInputEl = document.getElementById('nome');
            const mensagemInputEl = document.getElementById('mensagem');
            const dataInputEl = document.getElementById('data');

            if (!nomeInput || !nomeInput.value.trim() || !mensagemInput || !mensagemInput.value.trim()) {
                showNotification('Por favor, preencha o nome do destinatário e a mensagem.', 'error');
                return;
            }

            if (submitBtn) {
                submitBtn.disabled = true;
                const btnText = submitBtn.querySelector('.btn-text');
                const btnLoading = submitBtn.querySelector('.btn-loading');
                if (btnText) btnText.hidden = true;
                if (btnLoading) btnLoading.hidden = false;
            }

            const formData = new FormData();
            formData.append('de', 'Anônimo'); // Ou adicione um campo 'de' no HTML
            formData.append('para', nomeInput.value.trim());
            formData.append('mensagem', mensagemInput.value.trim());

            if (dataInput && dataInput.value) {
                formData.append('data', dataInput.value);
            }
            if (youtubeVideoIdInputHidden && youtubeVideoIdInputHidden.value) {
                formData.append('youtubeVideoId', youtubeVideoIdInputHidden.value);
            }
            if (fotoUploadInput && fotoUploadInput.files && fotoUploadInput.files[0]) {
                formData.append('foto', fotoUploadInput.files[0]);
            }

            try {
                const response = await fetch(`${API_URL}/cards`, {
                    method: 'POST',
                    body: formData,
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Erro desconhecido ao criar cartão.');
                }

                const result = await response.json();
                const cardId = result.cardId;

                if (cardId) {
                    showNotification('Cartão criado com sucesso!', 'success', 5000);
                    // *** REDIRECIONAR PARA A PÁGINA DE VISUALIZAÇÃO ***
                    const viewPageUrl = `/card.html?id=${cardId}`;
                    setTimeout(() => {
                        window.location.href = viewPageUrl;
                    }, 1000);

                } else {
                    showNotification('Erro: ID do cartão não recebido do servidor.', 'error');
                }

            } catch (error) {
                console.error('Erro no envio do formulário:', error);
                showNotification(`Falha ao criar o cartão: ${error.message}`, 'error', 7000);
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    const btnText = submitBtn.querySelector('.btn-text');
                    const btnLoading = submitBtn.querySelector('.btn-loading');
                    if (btnText) btnText.hidden = false;
                    if (btnLoading) btnLoading.hidden = true;
                }
            }
        });
    } // Fim if (cardForm)
}); // Fim do DOMContentLoaded