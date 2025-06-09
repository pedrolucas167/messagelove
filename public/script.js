document.addEventListener('DOMContentLoaded', () => {

    // --- Seletores do DOM ---
    const form = document.getElementById('cardForm');
    if (!form) {
        console.error('Formulário #cardForm não encontrado. O script não será executado.');
        return;
    }

    const submitBtn = document.getElementById('submitBtn');
    const notificationArea = document.getElementById('appNotificationArea');
    const currentYearSpan = document.getElementById('currentYear');
    
    // Elementos do Upload de Foto
    const fotoUpload = document.getElementById('fotoUpload');
    const fotoPreviewContainer = document.getElementById('fotoPreviewContainer');
    const fotoPreview = document.getElementById('fotoPreview');
    const removeFotoBtn = document.getElementById('removeFotoBtn');
    
    // Elementos do YouTube
    const youtubeUrlInput = document.getElementById('youtubeUrlInput');
    const addYoutubeUrlBtn = document.getElementById('addYoutubeUrlBtn');
    const youtubeError = document.getElementById('youtubeError');
    const youtubePreviewContainer = document.getElementById('youtubePreviewContainer');
    const youtubePlayer = document.getElementById('youtubePlayer');
    const youtubeVideoId = document.getElementById('youtubeVideoId');
    const removeYoutubeBtn = document.getElementById('removeYoutubeBtn');

    // --- Configurações ---
    const IS_LOCAL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const API_URL = IS_LOCAL
        ? 'http://localhost:3001/api'
        : 'https://messagelove-backend.onrender.com/api';

    // --- Funções Auxiliares ---
    const showNotification = (content, { type = 'info', duration = 5000 } = {}) => {
        // ... (sua função showNotification, sem alterações)
    };

    const copyToClipboard = (text) => {
        // ... (sua função copyToClipboard, sem alterações)
    };

    const toggleButtonLoading = (isLoading) => {
        if (!submitBtn) return;
        const text = submitBtn.querySelector('.btn-text');
        const loading = submitBtn.querySelector('.btn-loading');
        submitBtn.disabled = isLoading;
        if (text) text.style.visibility = isLoading ? 'hidden' : 'visible';
        if (loading) loading.hidden = !isLoading;
    };

    const resetFormAndPreviews = () => {
        form.reset();
        // Reset Foto
        if (fotoPreviewContainer) fotoPreviewContainer.hidden = true;
        if (fotoUpload) fotoUpload.value = '';
        // Reset YouTube
        if (youtubePreviewContainer) youtubePreviewContainer.hidden = true;
        if (youtubePlayer) youtubePlayer.src = 'about:blank';
        if (youtubeVideoId) youtubeVideoId.value = '';
        if (youtubeUrlInput) youtubeUrlInput.value = '';
    };
    
    // --- Lógica de UI (YouTube, Foto) ---

    function extractYouTubeId(url) {
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
    }

    function handleYouTubeUrl() {
        const url = youtubeUrlInput.value.trim();
        const videoId = extractYouTubeId(url);
        
        youtubeError.textContent = ''; // Limpa erro anterior
        
        if (videoId) {
            // URL CORRIGIDA E SEGURA
            youtubePlayer.src = `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`;
            youtubeVideoId.value = videoId;
            youtubePreviewContainer.hidden = false;
        } else if (url) {
            youtubeError.textContent = 'Por favor, insira um link válido do YouTube.';
            youtubePreviewContainer.hidden = true;
            youtubeVideoId.value = '';
        } else {
            youtubePreviewContainer.hidden = true;
            youtubeVideoId.value = '';
        }
    }

    function handleFotoUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) {
            showNotification('Por favor, selecione uma imagem válida (JPG, PNG, GIF) de até 5MB.', { type: 'error' });
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
    
    // --- Lógica Principal do Formulário ---

    const displaySuccessState = (result) => {
        // ... (sua função displaySuccessState, sem alterações)
    };

    const handleFormSubmit = async (event) => {
        event.preventDefault();
        const formData = new FormData(form);
        
        const de = formData.get('de')?.trim();
        const para = formData.get('para')?.trim();
        const mensagem = formData.get('mensagem')?.trim();

        if (!de || !para || !mensagem) {
            showNotification('Por favor, preencha os campos "De", "Para" e "Mensagem".', { type: 'warning' });
            return;
        }
        
        toggleButtonLoading(true);

        try {
            const response = await fetch(`${API_URL}/cards`, { method: 'POST', body: formData });
            if (!response.ok) {
                // ... (seu tratamento de erro, sem alterações)
            }
            const result = await response.json();
            displaySuccessState(result);
        } catch (error) {
            // ... (seu tratamento de erro, sem alterações)
        } finally {
            toggleButtonLoading(false);
        }
    };

    // --- Anexar Event Listeners ---
    form.addEventListener('submit', handleFormSubmit);
    
    if (addYoutubeUrlBtn) addYoutubeUrlBtn.addEventListener('click', handleYouTubeUrl);
    if (youtubeUrlInput) youtubeUrlInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleYouTubeUrl();
        }
    });
    if (removeYoutubeBtn) removeYoutubeBtn.addEventListener('click', () => {
        youtubeUrlInput.value = '';
        handleYouTubeUrl(); // Re-avalia para esconder o preview
    });
    
    if (fotoUpload) fotoUpload.addEventListener('change', handleFotoUpload);
    if (removeFotoBtn) removeFotoBtn.addEventListener('click', () => {
        fotoUpload.value = '';
        fotoPreviewContainer.hidden = true;
    });

    // Inicialização
    if (currentYearSpan) currentYearSpan.textContent = new Date().getFullYear();
});