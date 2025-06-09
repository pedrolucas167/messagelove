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

    // --- Funções Auxiliares Refatoradas ---
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
        text.style.visibility = isLoading ? 'hidden' : 'visible';
        loading.hidden = !isLoading;
    };

    const resetFormAndPreviews = () => {
        form.reset();
        document.querySelector('[data-js="preview-container"]')?.setAttribute('hidden', 'true');
        document.getElementById('fotoUpload').value = '';
        document.getElementById('youtubePreviewContainer')?.classList.remove('active');
        document.getElementById('youtubeUrlInput').value = '';
        document.getElementById('youtubeVideoId').value = '';
    };

    // --- Lógica Principal ---

    const displaySuccessState = (result) => {
        showNotification('Cartão criado com sucesso!', { type: 'success' });
        const viewLink = result.viewLink || `${window.location.origin}/card.html?id=${result.id}`; // Ajustado para usar result.id
        const linkHtml = `
            <span>Link para visualização: <a href="${viewLink}" target="_blank">${viewLink}</a></span>
            <button class="btn-copy-link" style="margin-left: 10px;">Copiar</button>
        `;
        const linkNotification = showNotification(linkHtml, { type: 'info', duration: null, isHtml: true });
        linkNotification.querySelector('.btn-copy-link').addEventListener('click', () => copyToClipboard(viewLink));
        resetFormAndPreviews();
    };

    const handleFormSubmit = async (event) => {
        event.preventDefault();
        toggleButtonLoading(submitBtn, true);

        const formData = new FormData(form);

        // --- CÓDIGO DE DEBURAÇÃO ADICIONADO ---
        console.log("--- Verificando os dados do FormData antes do envio ---");
        for (const [key, value] of formData.entries()) {
            if (value instanceof File) {
                console.log(`Campo -> ${key}:`, `Arquivo -> ${value.name}`);
            } else {
                console.log(`Campo -> ${key}:`, `Valor -> "${value}"`);
            }
        }
        console.log("----------------------------------------------------");
        // --- FIM DO CÓDIGO DE DEBURAÇÃO ---

        try {
            const response = await fetch(`${API_URL}/cards`, {
                method: 'POST',
                body: formData,
            });

            // O `response.json()` vai falhar se a resposta for um erro 500 (HTML)
            // Precisamos verificar o status antes de tentar fazer o parse
            if (!response.ok) {
                const errorText = await response.text(); // Pega o corpo da resposta como texto
                throw new Error(`O servidor respondeu com erro ${response.status}. Resposta: ${errorText}`);
            }

            const result = await response.json();

            console.log('Cartão criado com sucesso:', result);
            displaySuccessState(result);

        } catch (error) {
            console.error('Erro ao criar cartão:', error.message);
            showNotification(`Erro: ${error.message}`, { type: 'error' });
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