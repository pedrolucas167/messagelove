// ui-interactions.js

/**
 * @file ui-interactions.js
 * @description Gerencia interações visuais globais como animações de partículas e o comportamento do modal de autenticação.
 * @author Pedro Marques
 * @version 1.0.0
 */
(() => {
    // Expõe funções de controle para outros scripts poderem usar (ex: script.js)
    window.AppUI = {};

    const elements = {
        // Partículas
        particleCanvas: document.getElementById('particle-canvas'),
        // Modal
        authModal: document.getElementById('authModal'),
        closeAuthModalBtn: document.getElementById('closeAuthModalBtn'),
        modalContent: document.querySelector('#authModal .modal-content'),
        // Botões de abertura do Modal
        openLoginBtn: document.getElementById('openLoginBtn'),
        openRegisterBtn: document.getElementById('openRegisterBtn'),
        // Containers dos Forms
        loginFormContainer: document.getElementById('loginFormContainer'),
        registerFormContainer: document.getElementById('registerFormContainer'),
        resetPasswordFormContainer: document.getElementById('resetPasswordFormContainer'),
        // Links de troca de Forms
        showRegisterBtn: document.getElementById('showRegisterBtn'),
        showLoginBtn: document.getElementById('showLoginBtn'),
        showForgotPasswordBtn: document.getElementById('showForgotPasswordBtn'),
        showLoginFromResetBtn: document.getElementById('showLoginFromResetBtn'),
        // Rodapé
        currentYear: document.getElementById('currentYear'),
    };

    const particles = {
        init() {
            const canvas = elements.particleCanvas;
            if (!canvas) return;

            const ctx = canvas.getContext('2d');
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            let particlesArray;

            const createParticles = () => {
                particlesArray = [];
                const particleDensity = window.innerWidth < 768 ? 20000 : 9000;
                const numberOfParticles = (canvas.height * canvas.width) / particleDensity;
                
                for (let i = 0; i < numberOfParticles; i++) {
                    particlesArray.push({
                        x: Math.random() * canvas.width, y: Math.random() * canvas.height,
                        size: Math.random() * 2 + 1,
                        directionX: Math.random() * 0.4 - 0.2, directionY: Math.random() * 0.4 - 0.2,
                        color: 'rgba(217, 70, 239, 0.5)'
                    });
                }
            };

            const animateParticles = () => {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                particlesArray.forEach(p => {
                    p.x += p.directionX;
                    p.y += p.directionY;
                    if (p.x > canvas.width || p.x < 0) p.directionX *= -1;
                    if (p.y > canvas.height || p.y < 0) p.directionY *= -1;
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                    ctx.fillStyle = p.color;
                    ctx.fill();
                });
                requestAnimationFrame(animateParticles);
            };

            createParticles();
            animateParticles();

            let resizeTimeout;
            window.addEventListener('resize', () => {
                clearTimeout(resizeTimeout);
                resizeTimeout = setTimeout(() => {
                    canvas.width = window.innerWidth;
                    canvas.height = window.innerHeight;
                    createParticles();
                }, 250);
            });
        }
    };

    const modal = {
        showForm(formToShow) {
            [elements.loginFormContainer, elements.registerFormContainer, elements.resetPasswordFormContainer].forEach(form => {
                form?.classList.add('hidden');
            });
            formToShow?.classList.remove('hidden');
        },
        open(initialForm) {
            if (!elements.authModal) return;
            elements.authModal.classList.remove('hidden');
            requestAnimationFrame(() => {
                elements.authModal.classList.remove('opacity-0');
                elements.modalContent.classList.remove('scale-95');
            });
            this.showForm(initialForm);
        },
        close() {
            if (!elements.authModal) return;
            elements.authModal.classList.add('opacity-0');
            elements.modalContent.classList.add('scale-95');
            setTimeout(() => elements.authModal.classList.add('hidden'), 300);
        },
        bindEvents() {
            elements.openLoginBtn?.addEventListener('click', () => this.open(elements.loginFormContainer));
            elements.openRegisterBtn?.addEventListener('click', () => this.open(elements.registerFormContainer));
            elements.closeAuthModalBtn?.addEventListener('click', () => this.close());
            elements.authModal?.addEventListener('click', e => {
                if(e.target === elements.authModal) this.close();
            });
            
            elements.showRegisterBtn?.addEventListener('click', () => this.showForm(elements.registerFormContainer));
            elements.showLoginBtn?.addEventListener('click', () => this.showForm(elements.loginFormContainer));
            elements.showForgotPasswordBtn?.addEventListener('click', () => this.showForm(elements.resetPasswordFormContainer));
            elements.showLoginFromResetBtn?.addEventListener('click', () => this.showForm(elements.loginFormContainer));
        }
    };

    const init = () => {
        particles.init();
        modal.bindEvents();
        if (elements.currentYear) {
            elements.currentYear.textContent = new Date().getFullYear();
        }
        
        // Expondo os controles do modal globalmente de forma segura
        window.AppUI.openModal = modal.open.bind(modal);
        window.AppUI.closeModal = modal.close.bind(modal);
        window.AppUI.showAuthForm = modal.showForm.bind(modal);

        console.log('UI Interactions Inicializadas.');
    };

    document.addEventListener('DOMContentLoaded', init);
})();