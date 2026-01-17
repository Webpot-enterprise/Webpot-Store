/**
 * js/auth.js - Complete Authentication System
 * Features:
 * - Login with email/password
 * - Google OAuth Sign-In
 * - User registration with validation
 * - Terms & Privacy scroll-to-agree modal
 * - Tab switching
 * - Client-side form validation
 */

// ============================================
// TAB SWITCHING
// ============================================

let currentAuthTab = 'login'; // Track which tab is active for Google auth

function initTabSwitching() {
  const loginTabBtn = document.getElementById('loginTabBtn');
  const registerTabBtn = document.getElementById('registerTabBtn');
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');

  loginTabBtn.addEventListener('click', (e) => {
    e.preventDefault();
    switchTab('login', loginTabBtn, registerTabBtn, loginForm, registerForm);
  });

  registerTabBtn.addEventListener('click', (e) => {
    e.preventDefault();
    switchTab('register', loginTabBtn, registerTabBtn, loginForm, registerForm);
  });
}

function switchTab(tabName, loginBtn, registerBtn, loginForm, registerForm) {
  currentAuthTab = tabName; // Track active tab for Google auth
  
  if (tabName === 'login') {
    loginBtn.classList.add('active');
    registerBtn.classList.remove('active');
    loginForm.classList.add('active');
    registerForm.classList.remove('active');
    loginForm.style.display = 'flex';
    registerForm.style.display = 'none';
  } else {
    registerBtn.classList.add('active');
    loginBtn.classList.remove('active');
    registerForm.classList.add('active');
    loginForm.classList.remove('active');
    loginForm.style.display = 'none';
    registerForm.style.display = 'flex';
  }
}

// ============================================
// PASSWORD STRENGTH INDICATOR
// ============================================

function calculatePasswordStrength(password) {
  let strength = 0;
  const requirements = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
  };

  // Count met requirements
  Object.values(requirements).forEach(met => {
    if (met) strength++;
  });

  // Determine strength level
  let level = 'weak';
  if (strength === 5) {
    level = 'strong';
  } else if (strength >= 4) {
    level = 'good';
  } else if (strength >= 3) {
    level = 'medium';
  } else {
    level = 'weak';
  }

  return { level, strength, requirements };
}

function updatePasswordStrengthUI(password) {
  const container = document.getElementById('passwordStrengthContainer');
  const fill = document.getElementById('passwordStrengthFill');
  const label = document.getElementById('passwordStrengthLabel');
  const registerBtn = document.querySelector('#registerForm button[type="submit"]');

  if (!password) {
    container.style.display = 'none';
    if (registerBtn) registerBtn.disabled = true;
    return;
  }

  container.style.display = 'block';

  const { level, strength, requirements } = calculatePasswordStrength(password);

  // Update strength bar
  fill.className = `password-strength-fill ${level}`;
  label.className = level;
  label.textContent = level.charAt(0).toUpperCase() + level.slice(1);

  // Update requirement indicators
  updateRequirementUI('req-length', requirements.length);
  updateRequirementUI('req-uppercase', requirements.uppercase);
  updateRequirementUI('req-lowercase', requirements.lowercase);
  updateRequirementUI('req-number', requirements.number);
  updateRequirementUI('req-special', requirements.special);

  // Enable/disable submit button based on strength
  if (registerBtn) {
    registerBtn.disabled = level !== 'good' && level !== 'strong';
  }
}

function updateRequirementUI(id, met) {
  const element = document.getElementById(id);
  if (!element) return;

  if (met) {
    element.classList.add('met');
    element.classList.remove('unmet');
  } else {
    element.classList.add('unmet');
    element.classList.remove('met');
  }
}

// ============================================
// AUTHENTICATION VALIDATION

function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validatePassword(password) {
  return password.length >= 8;
}

function validateName(name) {
  return name.trim().length >= 2;
}

function clearErrorMessage(fieldId) {
  const errorEl = document.getElementById(fieldId);
  if (errorEl) {
    errorEl.textContent = '';
  }
}

function showFieldError(fieldId, message) {
  const errorEl = document.getElementById(fieldId);
  if (errorEl) {
    errorEl.textContent = message;
  }
}

function clearAllErrors(formId) {
  const form = document.getElementById(formId);
  if (form) {
    const errorElements = form.querySelectorAll('.input-error, .auth-error-message');
    errorElements.forEach(el => {
      el.textContent = '';
    });
  }
}

// ============================================
// FORM SUBMISSION - LOGIN
// ============================================

async function loginUser(email, password) {
  try {
    const res = await apiCall('/users', {
      method: 'POST',
      action: API_CONFIG.ACTIONS.LOGIN,
      body: { email, password }
    });

    if (res.success && res.data.token && res.data.user) {
      handleAuthSuccess(res.data.token, res.data.user);
    } else {
      showErrorMessage(res.data?.error || 'Login failed', 'loginError');
    }
  } catch (e) {
    console.error('Login error:', e);
    showErrorMessage('Login error. Please try again.', 'loginError');
  }
}

async function submitLoginForm(event) {
  event.preventDefault();
  clearAllErrors('loginForm');

  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value.trim();
  const submitBtn = event.target.querySelector('button[type="submit"]');

  // Validate
  if (!email) {
    showFieldError('loginEmailError', 'Email is required');
    return;
  }
  if (!validateEmail(email)) {
    showFieldError('loginEmailError', 'Please enter a valid email');
    return;
  }
  if (!password) {
    showFieldError('loginPasswordError', 'Password is required');
    return;
  }

  // Show loading
  setButtonLoading(submitBtn, true);

  try {
    await loginUser(email, password);
  } finally {
    setButtonLoading(submitBtn, false);
  }
}

// ============================================
// FORM SUBMISSION - REGISTER
// ============================================

async function registerUser(name, email, password) {
  try {
    const res = await apiCall('/users', {
      method: 'POST',
      action: API_CONFIG.ACTIONS.REGISTER,
      body: { name, email, password }
    });

    if (res.success && res.data.token && res.data.user) {
      handleAuthSuccess(res.data.token, res.data.user);
    } else {
      showErrorMessage(res.data?.error || 'Registration failed', 'registerError');
    }
  } catch (e) {
    console.error('Registration error:', e);
    showErrorMessage('Registration error. Please try again.', 'registerError');
  }
}

async function submitRegisterForm(event) {
  event.preventDefault();
  clearAllErrors('registerForm');

  const name = document.getElementById('registerName').value.trim();
  const email = document.getElementById('registerEmail').value.trim();
  const password = document.getElementById('registerPassword').value.trim();
  const confirmPassword = document.getElementById('registerConfirmPassword').value.trim();
  const termsCheckbox = document.getElementById('termsCheckbox');
  const submitBtn = event.target.querySelector('button[type="submit"]');

  // Validate
  if (!name) {
    showFieldError('registerNameError', 'Full name is required');
    return;
  }
  if (!validateName(name)) {
    showFieldError('registerNameError', 'Name must be at least 2 characters');
    return;
  }
  if (!email) {
    showFieldError('registerEmailError', 'Email is required');
    return;
  }
  if (!validateEmail(email)) {
    showFieldError('registerEmailError', 'Please enter a valid email');
    return;
  }
  if (!password) {
    showFieldError('registerPasswordError', 'Password is required');
    return;
  }
  if (!validatePassword(password)) {
    showFieldError('registerPasswordError', 'Password must be at least 8 characters');
    return;
  }
  
  // Check password strength (must be "good" or "strong")
  const { level } = calculatePasswordStrength(password);
  if (level !== 'good' && level !== 'strong') {
    showFieldError('registerPasswordError', `Password strength is ${level}. Please meet all requirements above.`);
    return;
  }
  
  if (password !== confirmPassword) {
    showFieldError('registerConfirmPasswordError', 'Passwords do not match');
    return;
  }
  if (!termsCheckbox.checked) {
    showFieldError('termsError', 'You must agree to Terms & Privacy');
    return;
  }

  // Show loading
  setButtonLoading(submitBtn, true);

  try {
    await registerUser(name, email, password);
  } finally {
    setButtonLoading(submitBtn, false);
  }
}

// ============================================
// GOOGLE OAUTH
// ============================================

window.onGoogleSignIn = function(response) {
  if (response.credential) {
    loginWithGoogle(response.credential);
  } else {
    const errorTarget = currentAuthTab === 'register' ? 'registerError' : 'loginError';
    showErrorMessage('Google sign-in failed', errorTarget);
  }
};

async function loginWithGoogle(googleIdToken) {
  try {
    const res = await apiCall('/users', {
      method: 'POST',
      action: API_CONFIG.ACTIONS.GOOGLE_LOGIN,
      body: { idToken: googleIdToken }
    });

    if (res.success && res.data.token && res.data.user) {
      handleAuthSuccess(res.data.token, res.data.user);
    } else {
      const errorTarget = currentAuthTab === 'register' ? 'registerError' : 'loginError';
      showErrorMessage(res.data?.error || 'Google authentication failed', errorTarget);
    }
  } catch (e) {
    console.error('Google authentication error:', e);
    const errorTarget = currentAuthTab === 'register' ? 'registerError' : 'loginError';
    showErrorMessage('Google authentication error', errorTarget);
  }
}

// ============================================
// AUTHENTICATION SUCCESS
// ============================================

function handleAuthSuccess(token, user) {
  setAuthToken(token);
  setUserData(user);
  // Store login time for session expiry calculation (24-hour tokens)
  localStorage.setItem('webpot_login_time', Date.now().toString());
  showSuccessMessage('Login successful! Redirecting...');
  setTimeout(() => {
    window.location.href = '/index.html';
  }, 1500);
}

// ============================================
// SCROLL-TO-AGREE MODAL
// ============================================

function initScrollToAgreeModal() {
  const modal = document.getElementById('termsModal');
  const modalOverlay = document.querySelector('.auth-modal-overlay');
  const modalClose = document.querySelector('.auth-modal-close');
  const termsCheckbox = document.getElementById('termsCheckbox');
  const termsLink = document.getElementById('termsLink');
  const privacyLink = document.getElementById('privacyLink');
  const modalBody = document.getElementById('modalBody');
  const modalNextBtn = document.getElementById('modalNextBtn');
  const scrollPrompt = document.getElementById('scrollPrompt');
  const modalTitle = document.getElementById('modalTitle');

  let currentStep = 'terms'; // 'terms' or 'privacy'
  let termsScrolled = false;
  let privacyScrolled = false;

  // Prevent default checkbox behavior
  termsCheckbox.addEventListener('click', (e) => {
    if (!termsCheckbox.checked) {
      e.preventDefault();
      openModal();
    }
  });

  // Open modal from terms/privacy links
  termsLink.addEventListener('click', (e) => {
    e.preventDefault();
    openModal();
  });

  privacyLink.addEventListener('click', (e) => {
    e.preventDefault();
    currentStep = 'privacy';
    openModal();
  });

  // Close modal
  modalClose.addEventListener('click', closeModal);
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) {
      closeModal();
    }
  });

  function openModal() {
    modal.removeAttribute('hidden');
    modal.style.display = 'flex';
    currentStep = 'terms';
    termsScrolled = false;
    privacyScrolled = false;
    loadTermsContent();
    modalBody.scrollTop = 0;
  }

  function closeModal() {
    modal.setAttribute('hidden', '');
    modal.style.display = 'none';
    termsScrolled = false;
    privacyScrolled = false;
    currentStep = 'terms';
  }

  function loadTermsContent() {
    fetch('./html/terms.html')
      .then(res => res.text())
      .then(html => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const content = doc.body.innerText;
        modalTitle.textContent = 'Terms & Conditions';
        modalBody.innerText = content;
        updateScrollPrompt();
      })
      .catch(err => {
        console.error('Error loading terms:', err);
        modalBody.innerText = 'Error loading Terms & Conditions. Please try again.';
      });
  }

  function loadPrivacyContent() {
    fetch('./html/privacy.html')
      .then(res => res.text())
      .then(html => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const content = doc.body.innerText;
        modalTitle.textContent = 'Privacy Policy';
        modalBody.innerText = content;
        updateScrollPrompt();
      })
      .catch(err => {
        console.error('Error loading privacy:', err);
        modalBody.innerText = 'Error loading Privacy Policy. Please try again.';
      });
  }

  function updateScrollPrompt() {
    const scrollHeight = modalBody.scrollHeight;
    const clientHeight = modalBody.clientHeight;
    const scrollTop = modalBody.scrollTop;
    const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10;

    if (isAtBottom) {
      scrollPrompt.classList.add('hidden');
      modalNextBtn.disabled = false;

      if (currentStep === 'terms') {
        termsScrolled = true;
        modalNextBtn.textContent = 'Next: Privacy Policy';
      } else {
        privacyScrolled = true;
        modalNextBtn.textContent = 'I Agree & Continue';
      }
    } else {
      scrollPrompt.classList.remove('hidden');
      modalNextBtn.disabled = true;
    }
  }

  // Scroll event listener
  modalBody.addEventListener('scroll', updateScrollPrompt);

  // Next button
  modalNextBtn.addEventListener('click', () => {
    if (currentStep === 'terms' && termsScrolled) {
      currentStep = 'privacy';
      loadPrivacyContent();
      modalBody.scrollTop = 0;
    } else if (currentStep === 'privacy' && privacyScrolled) {
      // Auto-check and close
      termsCheckbox.checked = true;
      closeModal();
      // Enable submit button
      const submitBtn = document.querySelector('#registerForm button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = false;
      }
    }
  });
}

// ============================================
// UI HELPERS
// ============================================

function setButtonLoading(btn, isLoading) {
  if (!btn) return;
  if (isLoading) {
    btn.disabled = true;
    const btnText = btn.querySelector('.btn-text');
    const btnLoader = btn.querySelector('.btn-loader');
    if (btnText) btnText.style.display = 'none';
    if (btnLoader) btnLoader.style.display = 'flex';
  } else {
    btn.disabled = false;
    const btnText = btn.querySelector('.btn-text');
    const btnLoader = btn.querySelector('.btn-loader');
    if (btnText) btnText.style.display = 'inline-block';
    if (btnLoader) btnLoader.style.display = 'none';
  }
}

function showErrorMessage(message, elementId = 'loginError') {
  const errorEl = document.getElementById(elementId);
  if (errorEl) {
    errorEl.textContent = message;
    errorEl.style.display = 'block';
  }
}

function showSuccessMessage(message = '') {
  let successEl = document.querySelector('.success-message');
  
  if (!successEl) {
    const form = document.querySelector('.auth-form.active');
    if (form) {
      successEl = document.createElement('div');
      successEl.className = 'success-message';
      form.insertBefore(successEl, form.firstChild);
    }
  }

  if (successEl) {
    if (message) successEl.textContent = message;
    successEl.style.display = 'block';
    setTimeout(() => {
      if (successEl) {
        successEl.style.display = 'none';
      }
    }, 3000);
  }
}

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  // Tab switching
  initTabSwitching();

  // Form submissions
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');

  if (loginForm) {
    loginForm.addEventListener('submit', submitLoginForm);
  }

  if (registerForm) {
    registerForm.addEventListener('submit', submitRegisterForm);
  }

  // Terms & Privacy modal
  initScrollToAgreeModal();

  // Add real-time validation (optional)
  document.getElementById('loginEmail')?.addEventListener('blur', () => {
    const email = document.getElementById('loginEmail').value.trim();
    if (email && !validateEmail(email)) {
      showFieldError('loginEmailError', 'Please enter a valid email');
    } else {
      clearErrorMessage('loginEmailError');
    }
  });

  document.getElementById('registerPassword')?.addEventListener('input', () => {
    const password = document.getElementById('registerPassword').value;
    updatePasswordStrengthUI(password);
    clearErrorMessage('registerPasswordError');
  });

  document.getElementById('registerPassword')?.addEventListener('blur', () => {
    const password = document.getElementById('registerPassword').value;
    if (password && !validatePassword(password)) {
      showFieldError('registerPasswordError', 'Password must be at least 8 characters');
    } else {
      clearErrorMessage('registerPasswordError');
    }
  });

  document.getElementById('registerConfirmPassword')?.addEventListener('change', () => {
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('registerConfirmPassword').value;
    if (password && confirmPassword && password !== confirmPassword) {
      showFieldError('registerConfirmPasswordError', 'Passwords do not match');
    } else {
      clearErrorMessage('registerConfirmPasswordError');
    }
  });

  // Real-time email validation
  document.getElementById('registerEmail')?.addEventListener('blur', () => {
    const email = document.getElementById('registerEmail').value.trim();
    if (email && !validateEmail(email)) {
      showFieldError('registerEmailError', 'Please enter a valid email');
    } else {
      clearErrorMessage('registerEmailError');
    }
  });

  // Real-time name validation
  document.getElementById('registerName')?.addEventListener('blur', () => {
    const name = document.getElementById('registerName').value.trim();
    if (name && !validateName(name)) {
      showFieldError('registerNameError', 'Name must be at least 2 characters');
    } else {
      clearErrorMessage('registerNameError');
    }
  });
});
