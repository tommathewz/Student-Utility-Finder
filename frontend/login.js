const ADMIN_EMAIL = 'admin@test.com';
const ADMIN_PASSWORD = 'admin123';

const loginForm = document.getElementById('loginForm');

loginForm.addEventListener('submit', (event) => {
  event.preventDefault();

  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    sessionStorage.setItem('isAdmin', 'true');
    window.location.href = 'index.html';
    return;
  }

  alert('Invalid credentials');
});
