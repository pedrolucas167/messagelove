const registerForm = document.getElementById('registerForm');
const notificationArea = document.getElementById('appNotificationArea');

const showNotification = (message, type) => {
  const notification = document.createElement('div');
  notification.className = `notification notification--${type}`;
  notification.textContent = message;
  notificationArea.appendChild(notification);
  setTimeout(() => notification.remove(), 5000);
};

const handleRegister = async (event) => {
  event.preventDefault();
  const submitBtn = registerForm.querySelector('button[type="submit"]');
  const btnText = submitBtn.querySelector('.btn-text');
  const btnLoading = submitBtn.querySelector('.btn-loading');

  btnText.classList.add('hidden');
  btnLoading.classList.remove('hidden');
  submitBtn.disabled = true;

  const formData = new FormData(registerForm);
  const data = Object.fromEntries(formData);

  try {
    const response = await fetch('https://messagelove-backend.onrender.com/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || 'Erro ao registrar.');
    }

    localStorage.setItem('token', result.token);
    localStorage.setItem('user', JSON.stringify(result.user));
    showNotification('Registro realizado com sucesso!', 'success');
    setTimeout(() => window.location.href = '/index.html', 1000);
  } catch (error) {
    showNotification(error.message, 'error');
  } finally {
    btnText.classList.remove('hidden');
    btnLoading.classList.add('hidden');
    submitBtn.disabled = false;
  }
};

registerForm.addEventListener('submit', handleRegister);