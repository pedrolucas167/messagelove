/**
 * @file script.js
 * @description Script para a página de CRIAÇÃO de cartões (index.html), lida com formulário, upload, YouTube e envio para o backend.
 * @author Pedro Marques
 * @version 2.5.0 (UX Modal & Bug Fixes)
 */
const CardCreatorApp = (() => {
    // 1. Configurações e Estado
    const config = { /* ... sem alterações ... */ };
    const state = { /* ... sem alterações ... */ };

    // 2. Seletores do DOM (ATUALIZADO PARA O MODAL)
    const elements = {
        cardForm: document.getElementById('cardForm'),
        submitBtn: document.getElementById('submitBtn'),
        submitBtnText: document.querySelector('#submitBtn .btn-text'),
        submitBtnLoading: document.querySelector('#submitBtn .btn-loading'),
        deInput: document.getElementById('deInput'),
        nomeInput: document.getElementById('nome'),
        mensagemInput: document.getElementById('mensagem'),
        dataInput: document.getElementById('data'),
        fotoUploadInput: document.getElementById('fotoUpload'),
        fotoPreviewContainer: document.querySelector('[data-js="preview-container"]'),
        fotoPreviewImg: document.querySelector('[data-js="foto-preview"]'),
        removeFotoBtn: document.querySelector('[data-js="remove-foto"]'),
        youtubeUrlInput: document.getElementById('youtubeUrlInput'),
        addYoutubeUrlBtn: document.getElementById('addYoutubeUrlBtn'),
        youtubeErrorEl: document.getElementById('youtubeError'),
        youtubePreviewContainer: document.getElementById('youtubePreviewContainer'),
        youtubePlayerIframe: document.getElementById('youtubePlayer'),
        youtubeVideoIdInputHidden: document.getElementById('youtubeVideoId'),
        appNotificationArea: document.getElementById('appNotificationArea'),
        // Seletores do MODAL
        successModal: document.getElementById('successModal'),
        closeModalBtn: document.getElementById('closeModalBtn'),
        createAnotherBtn: document.getElementById('createAnotherBtn'),
        generatedCardLinkInput: document.getElementById('generatedCardLink'),
        copyLinkBtn: document.getElementById('copyLinkBtn'),
        viewCardBtn: document.getElementById('viewCardBtn'),
    };

    // 3. Funções Utilitárias (sem alterações)
    const utils = { /* ... sem alterações ... */ };

    // 4. Módulo de Lógica do YouTube (sem alterações, mas o CSP deve corrigir)
    const youtube = { /* ... sem alterações ... */ };

    // 5. Módulo de Lógica da Foto (sem alterações)
    const photo = { /* ... sem alterações ... */ };

    // 6. Módulo de Lógica do Formulário e Modal (REATORADO)
    const form = {
        setSubmitButtonState(isLoading) {
            if (elements.submitBtn) {
                elements.submitBtn.disabled = isLoading;
                if(elements.submitBtnText) elements.submitBtnText.hidden = isLoading;
                if(elements.submitBtnLoading) elements.submitBtnLoading.hidden = !isLoading;
            }
        },

        openSuccessModal(cardId) {
            const cardUrl = `${window.location.origin}/card.html?id=${cardId}`;
            
            elements.cardForm.hidden = true; // Esconde o formulário
            elements.successModal.hidden = false;
            
            // Força o navegador a aplicar o display antes de adicionar a classe de animação
            setTimeout(() => {
                elements.successModal.classList.add('active');
            }, 10);
            
            elements.generatedCardLinkInput.value = cardUrl;
            elements.viewCardBtn.href = cardUrl;
        },

        closeSuccessModal() {
            elements.successModal.classList.remove('active');
            // Espera a animação de saída terminar antes de esconder o elemento
            setTimeout(() => {
                elements.successModal.hidden = true;
            }, 300); // 300ms é a duração da transição no CSS
        },

        async copyLinkToClipboard() { /* ... sem alterações ... */ },
        
        // CORRIGIDO: Removido o 'finally' para um controle mais preciso do estado do botão
        async handleSubmit(event) {
            event.preventDefault();

            if (!elements.deInput.value.trim() || !elements.nomeInput.value.trim() || !elements.mensagemInput.value.trim()) {
                utils.showNotification('Por favor, preencha seu nome, o do destinatário e a mensagem.', 'error');
                return;
            }

            this.setSubmitButtonState(true);

            const formData = new FormData(elements.cardForm); // Forma mais simples de pegar os dados
            formData.set('de', elements.deInput.value.trim());
            formData.set('para', elements.nomeInput.value.trim());
            formData.set('mensagem', elements.mensagemInput.value.trim());
            
            // Opcional: remover campos que não devem ser enviados se vazios
            if (!elements.dataInput.value) formData.delete('data');
            if (!elements.youtubeVideoIdInputHidden.value) formData.delete('youtubeVideoId');
            if (!elements.fotoUploadInput.files[0]) formData.delete('foto');

            try {
                const response = await fetch(`${config.API_URL}/cards`, {
                    method: 'POST',
                    body: formData,
                });

                const result = await response.json();
                if (!response.ok) {
                    throw new Error(result.message || `Erro ${response.status}`);
                }

                if (result.cardId) {
                    this.openSuccessModal(result.cardId);
                } else {
                    throw new Error('ID do cartão não foi recebido do servidor.');
                }
            } catch (error) {
                console.error('Erro no envio do formulário:', error);
                utils.showNotification(`Falha ao criar o cartão: ${error.message}`, 'error', 7000);
                this.setSubmitButtonState(false); // Reativa o botão APENAS em caso de erro
            }
        }
    };

    // 7. Vinculação de Eventos (ATUALIZADO)
    const bindEvents = () => {
        if (elements.cardForm) elements.cardForm.addEventListener('submit', form.handleSubmit.bind(form));
        if (elements.fotoUploadInput) elements.fotoUploadInput.addEventListener('change', photo.handleUpload.bind(photo));
        if (elements.removeFotoBtn) elements.removeFotoBtn.addEventListener('click', photo.remove.bind(photo));
        if (elements.addYoutubeUrlBtn) elements.addYoutubeUrlBtn.addEventListener('click', youtube.initPlayer.bind(youtube));
        
        // Eventos do Modal
        if (elements.copyLinkBtn) elements.copyLinkBtn.addEventListener('click', form.copyLinkToClipboard.bind(form));
        if (elements.closeModalBtn) elements.closeModalBtn.addEventListener('click', form.closeSuccessModal.bind(form));
        if (elements.createAnotherBtn) elements.createAnotherBtn.addEventListener('click', () => window.location.reload());
        if (elements.successModal) {
            elements.successModal.addEventListener('click', (e) => {
                if (e.target === elements.successModal) { // Fecha se clicar no overlay
                    form.closeSuccessModal();
                }
            });
        }
    };
    
    // 8. Inicialização
    const init = () => {
        console.log(`DOM Content Loaded - Iniciando CardCreatorApp. API_URL: ${config.API_URL}`);
        bindEvents();
    };

    return {
        init,
        onYouTubeApiReady: youtube.onApiReady.bind(youtube)
    };
})();

document.addEventListener('DOMContentLoaded', CardCreatorApp.init);

function onYouTubeIframeAPIReady() {
    CardCreatorApp.onYouTubeApiReady();
}