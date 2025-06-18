/**
 * @file script.js
 * @description Script principal para o Messagelove.
 * @author Pedro Marques
 * @version 3.0.0
 */
document.addEventListener('DOMContentLoaded', () => {
    // --- 1. CONFIGURAÇÕES ---
    const API_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
        ? 'http://localhost:3001/api'
        : 'https://messagelove-backend.onrender.com/api';

    // --- 2. SELEÇÃO DE ELEMENTOS DO DOM ---
    const elements = {
        form: document.getElementById('cardForm'),
        submitBtn: document.getElementById('submitBtn'),
        notificationArea: document.getElementById('appNotificationArea'),
        currentYearSpan: document.getElementById('currentYear'),
        foto: {
            upload: document.getElementById('fotoUpload'),
            previewContainer: document.getElementById('fotoPreviewContainer'),
            preview: document.getElementById('fotoPreview'),
            removeBtn: document.getElementById('removeFotoBtn'),
        },
        youtube: {
            urlInput: document.getElementById('youtubeUrlInput'),
            addBtn: document.getElementById('addYoutubeUrlBtn'),
            error: document.getElementById('youtubeError'),
            previewContainer: document.getElementById('youtubePreviewContainer'),
            player: document.getElementById('youtubePlayer'),
            videoIdInput: document.getElementById('youtubeVideoId'),
            removeBtn: document.getElementById('removeYoutubeBtn'),
        }
    };
    if (!elements.form) return console.error('Formulário principal não encontrado.');

    // --- 3. FUNÇÕES AUXILIARES ---
    const showNotification = (message, type = 'info', duration = 5000) => {
        const notification = document.createElement('div');
        notification.className = `notification notification--${type}`;
        notification.innerHTML = `<span>${message}</span><button class="notification__close" onclick="this.parentElement.remove()">×</button>`;
        elements.notificationArea.innerHTML = '';
        elements.notificationArea.appendChild(notification);
        if (duration) setTimeout(() => notification.remove(), duration);
    };

    const copyToClipboard = async (text) => {
        try {
            await navigator.clipboard.writeText(text);
            showNotification('Link copiado!', 'success', 3000);
        } catch (error) {
            showNotification('Erro ao copiar.', 'error');
        }
    };

    const toggleButtonLoading = (isLoading) => {
        elements.submitBtn.disabled = isLoading;
        elements.submitBtn.classList.toggle('btn--loading', isLoading);
    };

    const resetFormAndPreviews = () => {
        elements.form.reset();
        elements.foto.previewContainer.hidden = true;
        elements.youtube.previewContainer.classList.remove('active');
        elements.youtube.player.src = 'about:blank';
    };

    const extractYouTubeId = (url) => url.match(/(?:v=|\/embed\/|\.be\/|shorts\/)([^?&]+)/)?.[1] || null;

    // --- 4. LÓGICA DA UI ---
    const handleYouTubeUrl = () => {
        const url = elements.youtube.urlInput.value;
        const videoId = extractYouTubeId(url);
        elements.youtube.error.textContent = '';
        if (videoId) {
            elements.youtube.player.src = `https://www.youtube.com/embed/$${videoId}?rel=0`;
            elements.youtube.videoIdInput.value = videoId;
            elements.youtube.previewContainer.classList.add('active');
        } else if (url) {
            elements.youtube.error.textContent = 'Link do YouTube inválido.';
            elements.youtube.previewContainer.classList.remove('active');
        }
    };

    const handleFotoUpload = (event) => {
        const file = event.target.files[0];
        if (!file) return;
        if (!file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) {
            return showNotification('Imagem inválida (máx. 5MB).', 'error');
        }
        const reader = new FileReader();
        reader.onload = (e) => {
            elements.foto.preview.src = e.target.result;
            elements.foto.previewContainer.hidden = false;
        };
        reader.readAsDataURL(file);
    };

    const displaySuccessState = (result) => {
        const cardUrl = new URL(`card.html?id=${result.cardId}`, window.location.origin).href;
        elements.notificationArea.innerHTML = `
            <div class="notification notification--success">
                <span>Cartão criado com sucesso!</span>
                <div class="success-actions">
                    <input type="text" value="${cardUrl}" readonly onclick="this.select()" />
                    <button id="copyUrlBtn" class="btn">Copiar</button>
                </div>
                <button class="notification__close" onclick="this.parentElement.remove()">×</button>
            </div>
        `;
        document.getElementById('copyUrlBtn').addEventListener('click', () => copyToClipboard(cardUrl));
    };

    // --- 5. LÓGICA PRINCIPAL ---
    const handleFormSubmit = async (event) => {
        event.preventDefault();
        toggleButtonLoading(true);

        try {
            const formData = new FormData(elements.form);
            if (!formData.get('de') || !formData.get('para') || !formData.get('mensagem')) {
                throw new Error('Por favor, preencha os campos obrigatórios.');
            }

            const response = await fetch(`${API_URL}/cards`, { method: 'POST', body: formData });
            const result = await response.json().catch(() => response.text());

            if (!response.ok) {
                const errorMessage = result?.message || (typeof result === 'string' ? result : 'Erro desconhecido no servidor.');
                throw new Error(errorMessage);
            }

            displaySuccessState(result);
            resetFormAndPreviews();
        } catch (error) {
            console.error('Erro ao enviar:', error);
            showNotification(error.message, 'error');
        } finally {
            toggleButtonLoading(false);
        }
    };

    // --- 6. REGISTRO DE EVENTOS ---
    elements.form.addEventListener('submit', handleFormSubmit);
    elements.foto.upload.addEventListener('change', handleFotoUpload);
    elements.foto.removeBtn.addEventListener('click', () => {
        elements.foto.upload.value = '';
        elements.foto.previewContainer.hidden = true;
    });
    elements.youtube.addBtn.addEventListener('click', handleYouTubeUrl);
    elements.youtube.urlInput.addEventListener('keypress', (e) => e.key === 'Enter' && (e.preventDefault(), handleYouTubeUrl()));
    elements.youtube.removeBtn.addEventListener('click', () => {
        elements.youtube.urlInput.value = '';
        elements.youtube.previewContainer.classList.remove('active');
        elements.youtube.player.src = 'about:blank';
    });
    
    // --- 7. INICIALIZAÇÃO ---
    if (elements.currentYearSpan) elements.currentYearSpan.textContent = new Date().getFullYear();
    document.body.classList.remove('no-js');
});