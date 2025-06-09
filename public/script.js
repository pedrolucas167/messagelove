document.addEventListener('DOMContentLoaded', () => {

    // --- Seletores do DOM ---
    const form = document.getElementById('cardForm');
    const submitBtn = document.getElementById('submitBtn');
    const notificationArea = document.getElementById('appNotificationArea');

    // --- Configurações ---
    const IS_LOCAL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const API_URL = IS_LOCAL
        ? 'http://localhost:3001/api'
        : 'https://messagelove-backend.onrender.com/api';

    // --- Funções Auxiliares (sem alterações) ---
    const showNotification = (content, { type = 'info', duration = 5000, isHtml = false } = {}) => {
        const notification = document.createElement('div');
        notification.className = `notification notification--${type}`;
        if (isHtml) {
            notification.innerHTML = content;
        } else {
            notification.textContent = content;
        }
        const closeBtn = document.createElement('button');
        closeBtn.className = 'notification__close';
        closeBtn.innerHTML = '&times;';
        const closeAction = () => {
            notification.classList.add('notification--removing');
            notification.addEventListener('animationend', () => notification.remove());
        };
        closeBtn.onclick = closeAction;
        notification.prepend(closeBtn);
        notificationArea.appendChild(notification);
        if (duration !== null) {
            setTimeout(closeAction, duration);
        }
        return notification;
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text).then(() => {
            showNotification('Link copiado!', { type: 'success', duration: 3000 });
        }).catch(err => {
            console.error('Falha ao copiar o link:', err);
            showNotification('Não foi possível copiar o link.', { type: 'error' });
        });
    };

    const toggleButtonLoading = (button, isLoading) => {
        button.disabled = isLoading;
        const text = button.querySelector('.btn-text');
        const loading = button.querySelector('.btn-loading');
        if (text && loading) {
            text.style.visibility = isLoading ? 'hidden' : 'visible';
            loading.hidden = !isLoading;
        }
    };

    const resetFormAndPreviews = () => {
        form.reset();
        document.querySelector('[data-js="preview-container"]')?.setAttribute('hidden', 'true');
        const fotoUpload = document.getElementById('fotoUpload');
        if (fotoUpload) fotoUpload.value = '';
        document.getElementById('youtubePreviewContainer')?.classList.remove('active');
        const youtubeUrlInput = document.getElementById('youtubeUrlInput');
        if (youtubeUrlInput) youtubeUrlInput.value = '';
        const youtubeVideoId = document.getElementById('youtubeVideoId');
        if (youtubeVideoId) youtubeVideoId.value = '';
    };

    // --- Lógica Principal ---

    const displaySuccessState = (result) => {
        showNotification('Cartão criado com sucesso!', { type: 'success' });
        const viewLink = result.viewLink || `${window.location.origin}/card.html?id=${result.id}`;
        const linkHtml = `
            <span>Link: <a href="${viewLink}" target="_blank">Clique para ver</a></span>
            <button class="btn-copy-link" style="margin-left: 10px;">Copiar</button>
        `;
        const linkNotification = showNotification(linkHtml, { type: 'info', duration: null, isHtml: true });
        linkNotification.querySelector('.btn-copy-link').addEventListener('click', () => copyToClipboard(viewLink));
        resetFormAndPreviews();
    };

    const handleFormSubmit = async (event) => {
        event.preventDefault();

        const formData = new FormData(form);
        
        // --- NOVO: Bloco de Validação ---
        const de = formData.get('de')?.trim();
        const para = formData.get('para')?.trim();
        const mensagem = formData.get('mensagem')?.trim();

        if (!de || !para || !mensagem) {
            showNotification('Por favor, preencha os campos "De", "Para" e "Mensagem".', { type: 'warning' });
            return; // Interrompe a execução aqui se a validação falhar
        }
        // --- FIM DO Bloco de Validação ---

        toggleButtonLoading(submitBtn, true);

        try {
            const response = await fetch(`${API_URL}/cards`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                // Tenta extrair uma mensagem de erro do JSON, senão usa o texto puro
                let errorMessage = `Erro ${response.status}: ${response.statusText}`;
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorData.error || errorMessage;
                } catch (e) {
                    // Se o corpo não for JSON, podemos tentar ler como texto
                    const textError = await response.text();
                    if(textError) errorMessage = textError;
                }
                throw new Error(errorMessage);
            }

            const result = await response.json();
            displaySuccessState(result);

        } catch (error) {
            console.error('Erro ao criar cartão:', error.message);
            // Mostra a mensagem de erro mais detalhada que pegamos no 'if (!response.ok)'
            showNotification(`Falha ao criar o cartão: ${error.message}`, { type: 'error' });
        } finally {
            toggleButtonLoading(submitBtn, false);
        }
    };

    // --- Anexar Event Listeners ---
    if (form) {
        form.addEventListener('submit', handleFormSubmit);
    } else {
        console.error('Elemento do formulário #cardForm não encontrado.');
    }
});