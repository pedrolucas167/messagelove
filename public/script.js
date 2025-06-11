/**
 * @file script.js
 * @description Script principal para a criação e manipulação de cartões personalizados no Messagelove.
 * @author Pedro Marques
 * @version 2.0.0
 */

// O evento DOMContentLoaded garante que o script só será executado após o carregamento completo da página.
document.addEventListener('DOMContentLoaded', () => {

    // =========================================================================
    // --- 1. CONFIGURAÇÕES E CONSTANTES ---
    // =========================================================================
    // Define variáveis e constantes globais para o funcionamento do script,
    // como a URL da API, facilitando a troca entre ambientes de desenvolvimento e produção.

    const IS_LOCAL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const API_URL = IS_LOCAL 
        ? 'http://localhost:3001/api' 
        : 'https://messagelove-backend.onrender.com/api';


    // =========================================================================
    // --- 2. SELEÇÃO DE ELEMENTOS DO DOM ---
    // =========================================================================
    // Agrupa todas as referências a elementos HTML em um só lugar.
    // Isso melhora a organização e facilita a manutenção caso os IDs mudem.

    const form = document.getElementById('cardForm');
    const submitBtn = document.getElementById('submitBtn');
    const notificationArea = document.getElementById('appNotificationArea');
    const currentYearSpan = document.getElementById('currentYear');

    // Elementos de Upload de Foto
    const fotoUpload = document.getElementById('fotoUpload');
    const fotoPreviewContainer = document.getElementById('fotoPreviewContainer');
    const fotoPreview = document.getElementById('fotoPreview');
    const removeFotoBtn = document.getElementById('removeFotoBtn');
    
    // Elementos de Vídeo do YouTube
    const youtubeUrlInput = document.getElementById('youtubeUrlInput');
    const addYoutubeUrlBtn = document.getElementById('addYoutubeUrlBtn');
    const youtubeError = document.getElementById('youtubeError');
    const youtubePreviewContainer = document.getElementById('youtubePreviewContainer');
    const youtubePlayer = document.getElementById('youtubePlayer');
    const youtubeVideoId = document.getElementById('youtubeVideoId');
    const removeYoutubeBtn = document.getElementById('removeYoutubeBtn');
    
    // Verificação de segurança: interrompe o script se o formulário principal não for encontrado.
    if (!form) {
        console.error('Formulário #cardForm não encontrado. O script não será executado.');
        return;
    }


    // =========================================================================
    // --- 3. FUNÇÕES AUXILIARES (HELPERS) ---
    // =========================================================================
    // Funções genéricas e reutilizáveis que dão suporte a outras partes do código,
    // como exibir notificações, copiar para a área de transferência, etc.

    /**
     * @description Exibe uma notificação dinâmica na tela.
     * @param {string|Node} content - O texto ou elemento HTML a ser mostrado.
     * @param {object} options - Opções como tipo ('info', 'success', 'error') e duração em ms.
     */
    const showNotification = (content, { type = 'info', duration = 5000 } = {}) => { /* ... implementação ... */ };

    /**
     * @description Copia um texto para a área de transferência do usuário usando a API do Navegador.
     * @param {string} text - O texto a ser copiado.
     */
    const copyToClipboard = (text) => { /* ... implementação ... */ };
    
    /**
     * @description Alterna o estado de carregamento do botão de submit.
     * @param {boolean} isLoading - Define se o estado de loading está ativo.
     */
    const toggleButtonLoading = (isLoading) => { /* ... implementação ... */ };

    /**
     * @description Limpa todos os campos do formulário e reseta os previews de mídia.
     */
    const resetFormAndPreviews = () => { /* ... implementação ... */ };
    

    // =========================================================================
    // --- 4. LÓGICA DE MANIPULAÇÃO DA UI ---
    // =========================================================================
    // Funções responsáveis por responder às interações do usuário e atualizar a interface.

    /**
     * @description Valida uma URL do YouTube, extrai o ID e exibe o player de vídeo.
     */
    function handleYouTubeUrl() { /* ... implementação ... */ }

    /**
     * @description Valida o arquivo de imagem selecionado e exibe um preview.
     * @param {Event} event - O evento 'change' do input de arquivo.
     */
    function handleFotoUpload(event) { /* ... implementação ... */ }

    /**
     * @description Exibe a tela de sucesso após a criação do cartão, com o link para cópia.
     * @param {object} result - O objeto retornado pela API, contendo o ID do cartão.
     */
    const displaySuccessState = (result) => { /* ... implementação ... */ };


    // =========================================================================
    // --- 5. LÓGICA PRINCIPAL (CORE) ---
    // =========================================================================
    // Contém a lógica de negócio mais importante, como o envio do formulário para a API.

    /**
     * @description Captura o evento de submit, valida os campos, monta os dados
     * e envia para a API. Gerencia os estados de sucesso e erro.
     * @param {Event} event - O evento de submit do formulário.
     */
    const handleFormSubmit = async (event) => { /* ... implementação ... */ };


    // =========================================================================
    // --- 6. REGISTRO DE EVENT LISTENERS ---
    // =========================================================================
    // Ponto central onde todas as funções são vinculadas aos eventos do usuário
    // (cliques, envios de formulário, etc.).

    form.addEventListener('submit', handleFormSubmit);
    
    // Listeners para a funcionalidade do YouTube
    addYoutubeUrlBtn?.addEventListener('click', handleYouTubeUrl);
    youtubeUrlInput?.addEventListener('keypress', (e) => e.key === 'Enter' && (e.preventDefault(), handleYouTubeUrl()));
    removeYoutubeBtn?.addEventListener('click', () => {
        youtubeUrlInput.value = '';
        handleYouTubeUrl(); 
    });
    
    // Listeners para a funcionalidade de Upload de Foto
    fotoUpload?.addEventListener('change', handleFotoUpload);
    removeFotoBtn?.addEventListener('click', () => {
        fotoUpload.value = '';
        fotoPreviewContainer.hidden = true;
    });


    // =========================================================================
    // --- 7. INICIALIZAÇÃO ---
    // =========================================================================
    // Executa códigos que precisam rodar assim que o script é carregado,
    // como definir o ano atual no rodapé.
    
    if (currentYearSpan) {
        currentYearSpan.textContent = new Date().getFullYear();
    }

    // (As implementações das funções foram omitidas com '/* ... */' para focar na estrutura,
    // mas devem ser mantidas como na versão anterior do seu código).
});