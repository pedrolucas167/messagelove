// frontend/script.js
document.addEventListener('DOMContentLoaded', () => {

    // --- Seletores do DOM ---
    const form = document.getElementById('cardForm');
    const submitBtn = document.getElementById('submitBtn');
    const notificationArea = document.getElementById('appNotificationArea');
    
    // Seletores para resetar os previews
    const previewContainer = document.querySelector('[data-js="preview-container"]');
    const fotoUploadInput = document.getElementById('fotoUpload');
    const youtubePreviewContainer = document.getElementById('youtubePreviewContainer');
    const youtubeUrlInput = document.getElementById('youtubeUrlInput');
    const youtubeVideoIdInput = document.getElementById('youtubeVideoId');


  // --- Configurações ---
// Define a URL da API dinamicamente, com base no ambiente (local ou produção).
const IS_LOCAL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const API_URL = IS_LOCAL
    ? 'http://localhost:3001/api'
    : 'https://messagelove-backend.onrender.com/api'; // URL do backend em produção

    // --- Funções Auxiliares ---

    /**
     * Mostra uma notificação na tela.
     * @param {string} message - A mensagem a ser exibida.
     * @param {string} type - O tipo de notificação ('success', 'error', 'info').
     */
    const showNotification = (message, type = 'info') => {
        const notification = document.createElement('div');
        notification.className = `notification notification--${type}`;
        notification.textContent = message;

        const closeBtn = document.createElement('button');
        closeBtn.className = 'notification__close';
        closeBtn.innerHTML = '&times;';
        closeBtn.onclick = () => {
            notification.classList.add('notification--removing');
            notification.addEventListener('animationend', () => notification.remove());
        };

        notification.appendChild(closeBtn);
        notificationArea.appendChild(notification);

        setTimeout(() => {
            closeBtn.click();
        }, 5000); // Remove a notificação após 5 segundos
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

        if (isLoading) {
            text.style.visibility = 'hidden';
            loading.hidden = false;
        } else {
            text.style.visibility = 'visible';
            loading.hidden = true;
        }
    };
    
    /**
     * Reseta completamente o formulário e seus previews.
     */
    const resetFormAndPreviews = () => {
        form.reset(); // Reseta os valores dos inputs
        
        // Esconde o preview da imagem
        if (previewContainer) {
            previewContainer.hidden = true;
        }
        // Limpa o valor do input de arquivo
        if (fotoUploadInput) {
            fotoUploadInput.value = '';
        }
        
        // Esconde o preview do YouTube e limpa os campos
        if (youtubePreviewContainer) {
            youtubePreviewContainer.classList.remove('active');
        }
        if (youtubeUrlInput) {
           youtubeUrlInput.value = '';
        }
        if (youtubeVideoIdInput) {
           youtubeVideoIdInput.value = '';
        }
    };


    // --- Lógica Principal ---

    /**
     * Manipula a submissão do formulário de criação de cartão.
     * @param {Event} event - O evento de submissão.
     */
    const handleFormSubmit = async (event) => {
        event.preventDefault();
        toggleButtonLoading(submitBtn, true);

        // FormData lida nativamente com 'multipart/form-data', o que é essencial para uploads de arquivos.
        const formData = new FormData(form);
        
        // NOTA IMPORTANTE PARA O BACKEND:
        // Como estamos enviando um arquivo, o backend precisa usar uma lib como o 'multer'
        // para processar 'multipart/form-data' em vez de 'application/json'.
        // Por enquanto, o backend atual não salvará a foto.

        try {
            const response = await fetch(`${API_URL}/cards`, {
                method: 'POST',
                // Ao usar FormData, não definimos o 'Content-Type'. O navegador faz isso por nós.
                body: formData,
            });

            const result = await response.json();

            if (!response.ok) {
                // Se a API retornar um erro (ex: validação), usa a mensagem dela.
                const errorMessage = result.errors ? result.errors.map(e => e.msg).join(', ') : 'Falha ao criar o cartão.';
                throw new Error(errorMessage);
            }

            console.log('Cartão criado com sucesso:', result);
            showNotification('Cartão criado com sucesso! O link para compartilhamento foi gerado.', 'success');
            
            // Mostra o link para o usuário (poderia ser em um modal no futuro)
            const viewLink = result.viewLink || `${window.location.origin}/card.html?id=${result.cardData.id}`;
            showNotification(`Link para visualização: ${viewLink}`, 'info');

            resetFormAndPreviews();

        } catch (error) {
            console.error('Erro ao criar cartão:', error);
            showNotification(`Erro: ${error.message}`, 'error');
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

    // A lógica para listar os cartões pode ser adicionada aqui no futuro,
    // quando houver uma seção na página para exibi-los.
});