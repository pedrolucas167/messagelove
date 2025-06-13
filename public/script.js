/**
 * @file script.js
 * @description Script principal para a criação e manipulação de cartões personalizados no Messagelove.
 * @author Pedro Marques
 * @version 2.0.0
 */

document.addEventListener('DOMContentLoaded', () => {
    // =========================================================================
    // --- 1. CONFIGURAÇÕES E CONSTANTES ---
    // =========================================================================
    const IS_LOCAL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const API_URL = IS_LOCAL 
        ? 'http://localhost:3001/api' 
        : 'https://messagelove-backend.onrender.com/api';

    // =========================================================================
    // --- 2. SELEÇÃO DE ELEMENTOS DO DOM ---
    // =========================================================================
    const form = document.getElementById('cardForm');
    const submitBtn = document.getElementById('submitBtn');
    const notificationArea = document.getElementById('appNotificationArea');
    const currentYearSpan = document.getElementById('currentYear');
    const fotoUpload = document.getElementById('fotoUpload');
    const fotoPreviewContainer = document.getElementById('fotoPreviewContainer');
    const fotoPreview = document.getElementById('fotoPreview');
    const removeFotoBtn = document.getElementById('removeFotoBtn');
    const youtubeUrlInput = document.getElementById('youtubeUrlInput');
    const addYoutubeUrlBtn = document.getElementById('addYoutubeUrlBtn');
    const youtubeError = document.getElementById('youtubeError');
    const youtubePreviewContainer = document.getElementById('youtubePreviewContainer');
    const youtubePlayer = document.getElementById('youtubePlayer');
    const youtubeVideoId = document.getElementById('youtubeVideoId');
    const removeYoutubeBtn = document.getElementById('removeYoutubeBtn');

    if (!form) {
        console.error('Formulário #cardForm não encontrado. O script não será executado.');
        return;
    }
    if (!submitBtn) {
        console.error('Botão #submitBtn não encontrado.');
        return;
    }

    // =========================================================================
    // --- 3. FUNÇÕES AUXILIARES (HELPERS) ---
    // =========================================================================
    const showNotification = (content, { type = 'info', duration = 5000 } = {}) => {
        const notification = document.createElement('div');
        notification.className = `notification notification--${type}`;
        notification.textContent = content;
        
        const closeBtn = document.createElement('button');
        closeBtn.className = 'notification__close';
        closeBtn.textContent = '×';
        closeBtn.addEventListener('click', () => notification.remove());
        notification.appendChild(closeBtn);
        
        notificationArea.appendChild(notification);
        setTimeout(() => {
            notification.classList.add('notification--removing');
            setTimeout(() => notification.remove(), 500);
        }, duration);
    };

    const copyToClipboard = async (text) => {
        try {
            await navigator.clipboard.writeText(text);
            showNotification('Link copiado para a área de transferência!', { type: 'success' });
        } catch (error) {
            console.error('Erro ao copiar:', error);
            showNotification('Erro ao copiar o link.', { type: 'error' });
        }
    };

    const toggleButtonLoading = (isLoading) => {
        submitBtn.disabled = isLoading;
        submitBtn.classList.toggle('btn--loading', isLoading);
        submitBtn.querySelector('.btn-text').hidden = isLoading;
        submitBtn.querySelector('.btn-loading').hidden = !isLoading;
    };

    const resetFormAndPreviews = () => {
        form.reset();
        fotoPreviewContainer.hidden = true;
        youtubePreviewContainer.classList.remove('active');
        youtubeVideoId.value = '';
        youtubePlayer.src = '';
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

    // =========================================================================
    // --- 4. LÓGICA DE MANIPULAÇÃO DA UI ---
    // =========================================================================
    const handleYouTubeUrl = () => {
        const url = youtubeUrlInput.value.trim();
        const videoId = extractYouTubeId(url);
        if (videoId) {
            youtubeError.textContent = '';
            youtubePlayer.src = `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`;
            youtubeVideoId.value = videoId;
            youtubePreviewContainer.classList.add('active');
        } else {
            youtubeError.textContent = 'Por favor, insira um link válido do YouTube.';
            youtubePreviewContainer.classList.remove('active');
            youtubeVideoId.value = '';
        }
    };

    const handleFotoUpload = (event) => {
        const file = event.target.files[0];
        if (file) {
            if (!file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) {
                showNotification('Por favor, selecione uma imagem válida (máx. 5MB).', { type: 'error' });
                event.target.value = '';
                return;
            }
            const reader = new FileReader();
            reader.onload = (e) => {
                fotoPreview.src = e.target.result;
                fotoPreviewContainer.hidden = false;
            };
            reader.readAsDataURL(file);
        }
    };

    const displaySuccessState = (result) => {
        const cardUrl = `${window.location.origin}/card/${result.id}`;
        showNotification(`Cartão criado! Link: ${cardUrl}`, { type: 'success', duration: 10000 });
        copyToClipboard(cardUrl);
    };

    // =========================================================================
    // --- 5. LÓGICA PRINCIPAL (CORE) ---
    // =========================================================================
    const handleFormSubmit = async (event) => {
        event.preventDefault();
        console.log('Formulário enviado!');
        toggleButtonLoading(true);
        try {
            const formData = new FormData(form);
            const response = await fetch(`${API_URL}/cards`, {
                method: 'POST',
                body: formData,
            });
            if (!response.ok) {
                throw new Error(`Erro na API: ${response.statusText}`);
            }
            const result = await response.json();
            displaySuccessState(result);
            showNotification('Cartão criado com sucesso!', { type: 'success' });
            resetFormAndPreviews();
        } catch (error) {
            console.error('Erro ao enviar formulário:', error);
            showNotification(`Erro: ${error.message}`, { type: 'error' });
        } finally {
            toggleButtonLoading(false);
        }
    };

    // =========================================================================
    // --- 6. REGISTRO DE EVENT LISTENERS ---
    // =========================================================================
    form.addEventListener('submit', handleFormSubmit);
    addYoutubeUrlBtn?.addEventListener('click', handleYouTubeUrl);
    youtubeUrlInput?.addEventListener('keypress', (e) => e.key === 'Enter' && (e.preventDefault(), handleYouTubeUrl()));
        removeYoutubeBtn?.addEventListener('click', () => {
            youtubeUrlInput.value = '';
            youtubePlayer.src = '';
            youtubeVideoId.value = '';
            youtubePreviewContainer.classList.remove('active');
        });
    
    });