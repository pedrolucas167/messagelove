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

    /**
     * Mostra uma notificação na tela.
     * @param {string} content - A mensagem ou HTML a ser exibido.
     * @param {object} options - Opções para a notificação.
     * @param {string} [options.type='info'] - Tipo ('success', 'error', 'info').
     * @param {number|null} [options.duration=5000] - Duração em ms para fechar. Nulo para não fechar automaticamente.
     * @param {boolean} [options.isHtml=false] - Define se o conteúdo é HTML.
     */
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

        notification.prepend(closeBtn); // Adiciona o botão no início
        notificationArea.appendChild(notification);

        if (duration !== null) {
            setTimeout(closeAction, duration);
        }
        
        // Permite que o código externo adicione listeners ao botão de copiar, se existir
        return notification;
    };

    /**
     * Copia um texto para a área de transferência e mostra uma confirmação.
     * @param {string} text - O texto a ser copiado.
     */
    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text).then(() => {
            showNotification('Link copiado!', { type: 'success', duration: 3000 });
        }).catch(err => {
            console.error('Falha ao copiar o link:', err);
            showNotification('Não foi possível copiar o link.', { type: 'error' });
        });
    };

    /**
     * Alterna o estado de carregamento de um botão.
     * @param {HTMLButtonElement} button - O elemento do botão.
     * @param {boolean} isLoading - True para mostrar o loading, false para esconder.
     */
    const toggleButtonLoading = (button, isLoading) => {
        button.disabled = isLoading;
        const text = button.querySelector('.btn-text');
        const loading = button.querySelector('.btn-loading');
        text.style.visibility = isLoading ? 'hidden' : 'visible';
        loading.hidden = !isLoading;
    };

    /**
     * Reseta completamente o formulário e seus previews.
     */
    const resetFormAndPreviews = () => {
        form.reset();
        document.querySelector('[data-js="preview-container"]')?.setAttribute('hidden', 'true');
        document.getElementById('fotoUpload').value = '';
        document.getElementById('youtubePreviewContainer')?.classList.remove('active');
        document.getElementById('youtubeUrlInput').value = '';
        document.getElementById('youtubeVideoId').value = '';
    };

    // --- Lógica Principal ---

    /**
     * Exibe o estado de sucesso, mostrando o link e resetando o formulário.
     * @param {object} result - O objeto de resultado da API.
     */
    const displaySuccessState = (result) => {
        showNotification('Cartão criado com sucesso!', { type: 'success' });
        
        const viewLink = result.viewLink || `${window.location.origin}/card.html?id=${result.cardData.id}`;

        // Cria uma notificação persistente com o link e um botão de copiar
        const linkHtml = `
            <span>Link para visualização: ${viewLink}</span>
            <button class="btn-copy-link">Copiar</button>
        `;
        const linkNotification = showNotification(linkHtml, { type: 'info', duration: null, isHtml: true });

        // Adiciona o evento de clique ao botão "Copiar" recém-criado
        linkNotification.querySelector('.btn-copy-link').addEventListener('click', () => copyToClipboard(viewLink));

        resetFormAndPreviews();
    };

    /**
     * Manipula a submissão do formulário de criação de cartão.
     * @param {Event} event - O evento de submissão.
     */
    const handleFormSubmit = async (event) => {
        event.preventDefault();
        toggleButtonLoading(submitBtn, true);

        try {
            const response = await fetch(`${API_URL}/cards`, {
                method: 'POST',
                body: new FormData(form),
            });

            const result = await response.json();

            if (!response.ok) {
                const errorMessage = result.errors ? result.errors.map(e => e.msg).join(', ') : 'Falha ao criar o cartão.';
                throw new Error(errorMessage);
            }

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