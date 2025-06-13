/**
 * @file script.js
 * @description Script principal para a criação e manipulação de cartões personalizados no Messagelove.
 * @author Pedro Marques
 * @version 2.1.2
 */

document.addEventListener('DOMContentLoaded', () => {
    // Configurações e Constantes
    const IS_LOCAL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const API_URL = IS_LOCAL 
        ? 'http://localhost:3001/api' 
        : 'https://messagelove-backend.onrender.com/api'; // Corrigido: removido /cards
    console.log(`API_URL: ${API_URL}`);

    // Verifica se a API_URL é válida
    if (!API_URL.startsWith('http')) {
        console.error('API_URL inválida:', API_URL);
        showNotification('Erro: Configuração de API inválida.', { type: 'error' });
        return;
    }

    // Verifica se a API está acessível
    fetch(`${API_URL}/`, { method: 'GET' })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Erro ao acessar a API: ${response.status} ${response.statusText}`);
            }
            console.log('API acessível');
        })
        .catch(error => {
            console.error('Erro ao verificar a API:', error);
            showNotification('Não foi possível acessar a API. Verifique sua conexão ou tente novamente mais tarde.', { type: 'error' });
        });

    // Seleção de Elementos do DOM
    const elements = {
        form: document.getElementById('cardForm'),
        submitBtn: document.getElementById('submitBtn'),
        notificationArea: document.getElementById('appNotificationArea'),
        currentYearSpan: document.getElementById('currentYear'),
        fotoUpload: document.getElementById('fotoUpload'),
        fotoPreviewContainer: document.getElementById('fotoPreviewContainer'),
        fotoPreview: document.getElementById('fotoPreview'),
        removeFotoBtn: document.getElementById('removeFotoBtn'),
        youtubeUrlInput: document.getElementById('youtubeUrlInput'),
        addYoutubeUrlBtn: document.getElementById('addYoutubeUrlBtn'),
        youtubeError: document.getElementById('youtubeError'),
        youtubePreviewContainer: document.getElementById('youtubePreviewContainer'),
        youtubePlayer: document.getElementById('youtubePlayer'),
        youtubeVideoId: document.getElementById('youtubeVideoId'),
        removeYoutubeBtn: document.getElementById('removeYoutubeBtn'),
    };

    if (!elements.form) {
        console.error('Formulário #cardForm não encontrado.');
        return;
    }
    if (!elements.submitBtn) {
        console.error('Botão #submitBtn não encontrado.');
        return;
    }

    // Funções Auxiliares
    const showNotification = (content, { type = 'info', duration = 5000 } = {}) => {
        const notification = document.createElement('div');
        notification.className = `notification notification--${type}`;
        notification.textContent = content;
        const closeBtn = document.createElement('button');
        closeBtn.className = 'notification__close';
        closeBtn.textContent = '×';
        closeBtn.addEventListener('click', () => notification.remove());
        notification.appendChild(closeBtn);
        elements.notificationArea.appendChild(notification);
        setTimeout(() => {
            notification.classList.add('notification--removing');
            setTimeout(() => notification.remove(), 500);
        }, duration);
    };

    const copyToClipboard = async (text) => {
        try {
            await navigator.clipboard.writeText(text);
            showNotification('Link copiado!', { type: 'success' });
        } catch (error) {
            showNotification('Erro ao copiar o link.', { type: 'error' });
        }
    };

    const toggleButtonLoading = (isLoading) => {
        elements.submitBtn.disabled = isLoading;
        elements.submitBtn.classList.toggle('btn--loading', isLoading);
        elements.submitBtn.querySelector('.btn-text').hidden = isLoading;
        elements.submitBtn.querySelector('.btn-loading').hidden = !isLoading;
    };

    const resetFormAndPreviews = () => {
        elements.form.reset();
        elements.fotoPreviewContainer.hidden = true;
        elements.youtubePreviewContainer.classList.remove('active');
        elements.youtubeVideoId.value = '';
        elements.youtubePlayer.src = '';
    };

    const extractYouTubeId = (url) => {
        if (!url) return null;
        const patterns = [
            /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([^&]+)/,
            /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([^?]+)/,
            /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([^?]+)/,
            /(?:https?:\/\/)?(?:www\.)?youtube\.com\/v\/([^?]+)/,
            /(?:https?:\/\/)?(?:www\.)?youtube\.com\/shorts\/([^?]+)/
        ];
        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match && match[1]) return match[1].split('&')[0];
        }
        return null;
    };

    // Lógica de Manipulação da UI
    const handleYouTubeUrl = () => {
        const url = elements.youtubeUrlInput.value.trim();
        const videoId = extractYouTubeId(url);
        if (videoId) {
            elements.youtubeError.textContent = '';
            elements.youtubePlayer.src = `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`;
            elements.youtubeVideoId.value = videoId;
            elements.youtubePreviewContainer.classList.add('active');
        } else {
            elements.youtubeError.textContent = 'Link do YouTube inválido.';
            elements.youtubePreviewContainer.classList.remove('active');
            elements.youtubeVideoId.value = '';
        }
    };

    const handleFotoUpload = (event) => {
        const file = event.target.files[0];
        if (file) {
            if (!file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) {
                showNotification('Imagem inválida (máx. 5MB, JPG/PNG/GIF).', { type: 'error' });
                event.target.value = '';
                return;
            }
            const reader = new FileReader();
            reader.onload = (e) => {
                elements.fotoPreview.src = e.target.result;
                elements.fotoPreviewContainer.hidden = false;
            };
            reader.readAsDataURL(file);
        }
    };

    const displaySuccessState = (result) => {
        const cardUrl = `${window.location.origin}/card/${result.id}`;
        showNotification(`Cartão criado! Link: ${cardUrl}`, { type: 'success', duration: 10000 });
        copyToClipboard(cardUrl);
    };

    // Lógica Principal
    const handleFormSubmit = async (event) => {
        event.preventDefault();
        const url = `${API_URL}/cards`;
        console.log('URL da requisição:', url);
        console.log('Enviando formulário:', [...new FormData(elements.form).entries()]);
        toggleButtonLoading(true);
        try {
            const formData = new FormData(elements.form);
            const response = await fetch(url, {
                method: 'POST',
                body: formData,
            });
            let result;
            try {
                result = await response.json();
            } catch (jsonError) {
                console.error('Resposta não é JSON:', await response.text());
                throw new Error(`Resposta inválida do servidor: ${response.status} ${response.statusText}`);
            }
            if (!response.ok) {
                throw new Error(result.error || result.errors?.join(', ') || `Erro na API: ${response.status} ${response.statusText}`);
            }
            displaySuccessState(result);
            showNotification('Cartão criado com sucesso!', { type: 'success' });
            resetFormAndPreviews();
        } catch (error) {
            console.error('Erro ao enviar:', error);
            showNotification(`Erro: ${error.message}`, { type: 'error' });
        } finally {
            toggleButtonLoading(false);
        }
    };

    // Registro de Event Listeners
    elements.form.addEventListener('submit', handleFormSubmit);
    elements.addYoutubeUrlBtn?.addEventListener('click', handleYouTubeUrl);
    elements.youtubeUrlInput?.addEventListener('keypress', (e) => e.key === 'Enter' && (e.preventDefault(), handleYouTubeUrl()));
    elements.removeYoutubeBtn?.addEventListener('click', () => {
        elements.youtubeUrlInput.value = '';
        handleYouTubeUrl();
    });
    elements.fotoUpload?.addEventListener('change', handleFotoUpload);
    elements.removeFotoBtn?.addEventListener('click', () => {
        elements.fotoUpload.value = '';
        elements.fotoPreviewContainer.hidden = true;
    });

    elements.currentYearSpan && (elements.currentYearSpan.textContent = new Date().getFullYear());
    document.body.classList.remove('no-js');
});