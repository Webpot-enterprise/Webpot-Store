/**
 * js/auth.js - Complete Authentication System
 * Features:
 * - Login with email/password
 * - Google OAuth Sign-In
 * - User registration with validation
 * - Terms & Privacy scroll-to-agree modal
 * - Tab switching
 * - Client-side form validation
 * - Password strength meter (animated)
 */

// ============================================
// TAB SWITCHING
// ============================================

let currentAuthTab = 'login';

function initTabSwitching() {
  const loginTabBtn = document.getElementById('loginTabBtn');
  const registerTabBtn = document.getElementById('registerTabBtn');
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');

  loginTabBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    switchTab('login', loginTabBtn, registerTabBtn, loginForm, registerForm);
  });

  registerTabBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    switchTab('register', loginTabBtn, registerTabBtn, loginForm, registerForm);
  });
}

function switchTab(tab, loginBtn, registerBtn, loginForm, registerForm) {
  currentAuthTab = tab;

  if (tab === 'login') {
    loginBtn.classList.add('active');
    registerBtn.classList.remove('active');
    loginForm.style.display = 'flex';
    registerForm.style.display = 'none';
  } else {
    registerBtn.classList.add('active');
    loginBtn.classList.remove('active');
    loginForm.style.display = 'none';
    registerForm.style.display = 'flex';
  }
}

// ============================================
// PASSWORD STRENGTH LOGIC (CORE)
// ============================================

function calculatePasswordStrength(password) {
  let score = 0;

  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { level: 'weak', score };
  if (score === 2) return { level: 'okay', score };
  if (score === 3) return { level: 'good', score };
  return { level: 'strong', score };
}

function updatePasswordStrengthUI(password) {
  const bar = document.getElementById('passwordStrengthBar');
  const text = document.getElementById('passwordStrengthText');

  if (!bar || !text) return;

  if (!password) {
    bar.style.width = '0%';
    bar.style.background = '#ef4444';
    bar.style.boxShadow = 'none';
    text.textContent = 'Enter a password';
    return;
  }

  const { level } = calculatePasswordStrength(password);

  const config = {
    weak:   { w: 25, c: '#ef4444', t: 'Weak' },
    okay:   { w: 50, c: '#facc15', t: 'Okay' },
    good:   { w: 75, c: '#22c55e', t: 'Good' },
    strong: { w: 100, c: '#16a34a', t: 'Strong' }
  };

  const cfg = config[level];

  bar.style.width = cfg.w + '%';
  bar.style.background = cfg.c;
  bar.style.boxShadow = `0 0 10px ${cfg.c}88`;
  text.textContent = cfg.t;
}

// ============================================
// VALIDATION HELPERS
// ============================================

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePassword(password) {
  return password.length >= 8;
}

function validateName(name) {
  return name.trim().length >= 2;
}

function showFieldError(id, msg) {
  const el = document.getElementById(id);
  if (el) el.textContent = msg;
}

function clearErrorMessage(id) {
  const el = document.getElementById(id);
  if (el) el.textContent = '';
}

function clearAllErrors(formId) {
  document
    .getElementById(formId)
    ?.querySelectorAll('.input-error, .auth-error-message')
    .forEach(e => e.textContent = '');
}

// ============================================
// LOGIN
// ============================================

async function submitLoginForm(e) {
  e.preventDefault();
  clearAllErrors('loginForm');

  const email = loginEmail.value.trim();
  const password = loginPassword.value.trim();

  if (!validateEmail(email)) {
    showFieldError('loginEmailError', 'Invalid email');
    return;
  }
  if (!password) {
    showFieldError('loginPasswordError', 'Password required');
    return;
  }

  await loginUser(email, password);
}

// ============================================
// REGISTER
// ============================================

async function submitRegisterForm(e) {
  e.preventDefault();
  clearAllErrors('registerForm');

  const name = registerName.value.trim();
  const email = registerEmail.value.trim();
  const password = registerPassword.value;
  const confirm = registerConfirmPassword.value;
  const checkbox = termsCheckbox;

  if (!validateName(name)) {
    showFieldError('registerNameError', 'Name too short');
    return;
  }

  if (!validateEmail(email)) {
    showFieldError('registerEmailError', 'Invalid email');
    return;
  }

  const { level } = calculatePasswordStrength(password);
  if (level !== 'good' && level !== 'strong') {
    showFieldError('registerPasswordError', 'Password too weak');
    return;
  }

  if (password !== confirm) {
    showFieldError('registerConfirmPasswordError', 'Passwords do not match');
    return;
  }

  if (!checkbox.checked) {
    showFieldError('termsError', 'Please accept Terms & Privacy');
    return;
  }

  await registerUser(name, email, password);
}

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  initTabSwitching();

  loginForm?.addEventListener('submit', submitLoginForm);
  registerForm?.addEventListener('submit', submitRegisterForm);

  registerPassword?.addEventListener('input', (e) => {
    updatePasswordStrengthUI(e.target.value);
    clearErrorMessage('registerPasswordError');
  });
});
