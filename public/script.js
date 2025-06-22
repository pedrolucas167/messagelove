/**
 * @file script.js
 * @description Script principal para a aplicação MessageLove. Gerencia a lógica de negócio,
 * estado da aplicação, autenticação e comunicação com a API.
 * @author Pedro Marques
 * @version 6.0.0
 */
document.addEventListener('DOMContentLoaded', () => {
    const MessageLoveApp = (() => {
        // ... Módulos config, state ... (permanecem iguais)
        const config = {
            API_URL: window.location.hostname.includes('localhost') ? 'http://localhost:3001/api' : 'https://messagelove-backend.onrender.com/api'
        };
        const state = { currentUser: null };

        // Elementos que a lógica de negócio PRECISA controlar
        const elements = {
            welcomeSection: document.getElementById('welcomeSection'),
            dashboardSection: document.getElementById('dashboardSection'),
            creationSection: document.getElementById('creationSection'),
            logoutBtn: document.getElementById('logoutBtn'),
            loginForm: document.getElementById('loginForm'),
            loginSubmitBtn: document.getElementById('loginSubmitBtn'),
            registerForm: document.getElementById('registerForm'),
            registerSubmitBtn: document.getElementById('registerSubmitBtn'),
            appNotificationArea: document.getElementById('appNotificationArea'),
        };

        // ... Módulo api ... (permanece o mesmo)
        const api = { /* ... seu módulo API está perfeito, sem alterações ... */ };

        // ... Módulo ui ... (sem as funções do modal)
        const ui = {
            showView(viewName) { /* ... sem alterações ... */ },
            updateAuthUI() { /* ... sem alterações ... */ },
            setButtonLoading(btn, isLoading) { /* ... sem alterações ... */ },
            showNotification(message, type = 'info', duration = 5000) { /* ... implementação da notificação, sem alterações ... */ }
        };

        const auth = {
            handleLoginSuccess(result, isRegistration = false) {
                localStorage.setItem('token', result.token);
                localStorage.setItem('user', JSON.stringify(result.user));
                state.currentUser = result.user;
                
                // ALTERADO: Usa a função global do outro script para fechar o modal
                if (window.AppUI && typeof window.AppUI.closeModal === 'function') {
                    window.AppUI.closeModal();
                }
                
                elements.loginForm.reset();
                elements.registerForm.reset();

                const welcomeMessage = isRegistration 
                    ? `Bem-vindo, ${result.user.name}!` 
                    : `Login realizado com sucesso!`;
                ui.showNotification(welcomeMessage, 'success');
                ui.updateAuthUI();
            },
            logout() { /* ... sem alterações ... */ },
            async login(event) { /* ... sem alterações, a lógica interna já está correta ... */ },
            async register(event) { /* ... sem alterações, a lógica interna já está correta ... */ },
            init() { /* ... sem alterações ... */ }
        };

        // REMOVIDO: O módulo `modal` inteiro foi removido daqui e agora vive em `ui-interactions.js`

        const bindEvents = () => {
            // ALTERADO: Apenas os eventos que disparam a LÓGICA DE NEGÓCIO são registrados aqui
            elements.logoutBtn?.addEventListener('click', auth.logout);
            elements.loginForm?.addEventListener('submit', auth.login.bind(auth));
            elements.registerForm?.addEventListener('submit', auth.register.bind(auth));
        };
        
        const init = () => {
            console.log('MessageLoveApp Lógica Inicializada.');
            auth.init();
            bindEvents();
        };

        return { init };
    })();

    // Garante que a lógica principal só rode depois que a UI estiver pronta
    if (window.AppUI) {
        MessageLoveApp.init();
    }
});