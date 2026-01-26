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
// AUTH SUCCESS TOAST
// ============================================

function showAuthSuccessToast(message = 'Logged in successfully, redirecting...') {
  // Create toast container if it doesn't exist
  let toast = document.getElementById('authSuccessToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'authSuccessToast';
    toast.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(10, 14, 26, 0.95);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(0, 212, 255, 0.3);
      border-radius: 12px;
      padding: 32px 40px;
      text-align: center;
      color: #00d4ff;
      font-size: 16px;
      font-weight: 600;
      z-index: 9999;
      box-shadow: 0 0 40px rgba(0, 212, 255, 0.15);
      animation: authToastFadeIn 0.3s ease;
    `;
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.style.display = 'block';

  // Add animation keyframes if not already present
  if (!document.getElementById('authToastStyles')) {
    const style = document.createElement('style');
    style.id = 'authToastStyles';
    style.innerHTML = `
      @keyframes authToastFadeIn {
        from {
          opacity: 0;
          transform: translate(-50%, -55%);
        }
        to {
          opacity: 1;
          transform: translate(-50%, -50%);
        }
      }
      @keyframes authToastFadeOut {
        from {
          opacity: 1;
          transform: translate(-50%, -50%);
        }
        to {
          opacity: 0;
          transform: translate(-50%, -45%);
        }
      }
    `;
    document.head.appendChild(style);
  }

  // Auto-hide after 2 seconds
  setTimeout(() => {
    toast.style.animation = 'authToastFadeOut 0.3s ease';
    setTimeout(() => {
      toast.style.display = 'none';
      toast.style.animation = 'authToastFadeIn 0.3s ease';
    }, 300);
  }, 2000);
}

// ============================================
// GOOGLE SIGN-IN HANDLER
// ============================================

async function onGoogleSignIn(response) {
  try {
    const result = await googleLogin(response.credential);
    
    if (result.success) {
      // Show success toast and redirect to home
      showAuthSuccessToast('Logged in successfully, redirecting...');
      setTimeout(() => {
        window.location.href = './index.html';
      }, 2500);
    } else {
      // Show error message
      const errorMsg = result.message || 'Google login failed. Please try again.';
      if (currentAuthTab === 'login') {
        showFieldError('loginError', errorMsg);
      } else {
        showFieldError('registerError', errorMsg);
      }
    }
  } catch (error) {
    console.error('Google sign-in error:', error);
    showFieldError('loginError', 'An error occurred during Google sign-in');
  }
}

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
// TERMS & PRIVACY MODAL FLOW
// ============================================

let termsAgrementState = {
  currentStep: null, // 'terms' or 'privacy'
  termsScrolled: false,
  privacyScrolled: false,
  autoTransitionTimer: null // for canceling auto-transition if user scrolls up
};

/**
 * Load Terms or Privacy content into modal
 * Removes duplicate back-links and header navigation
 * Updates modal title and button state
 */
async function loadModalContent(step) {
  const modalBody = document.getElementById('modalBody');
  const modalTitle = document.getElementById('modalTitle');
  const scrollPrompt = document.getElementById('scrollPrompt');
  const nextBtn = document.getElementById('modalNextBtn');

  if (!modalBody) return;

  const filePath = step === 'terms' ? './html/terms.html' : './html/privacy.html';
  
  try {
    const response = await fetch(filePath);
    if (!response.ok) throw new Error(`Failed to load ${step}`);
    
    const html = await response.text();
    
    // Parse and clean content
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // Remove navigation header and back links
    const navHeader = doc.querySelector('.nav-header');
    if (navHeader) navHeader.remove();
    
    const backLinks = doc.querySelectorAll('.back-btn, .back-link');
    backLinks.forEach(link => link.remove());
    
    // Get container and extract only content (skip h1 title)
    const container = doc.querySelector('.terms-container, .privacy-container');
    let contentHTML = '';
    if (container) {
      // Extract inner content
      contentHTML = container.innerHTML;
      // Remove the h1 title if present (we'll use modal title instead)
      const h1 = container.querySelector('h1');
      if (h1) {
        contentHTML = contentHTML.replace(h1.outerHTML, '');
      }
    }
    
    // Fade out effect
    modalBody.style.opacity = '0.7';
    
    // Small delay for visual transition
    setTimeout(() => {
      modalBody.innerHTML = contentHTML || '<p>Unable to load content.</p>';
      modalBody.scrollTop = 0;
      modalBody.style.opacity = '1';
    }, 150);
    
    termsAgrementState.currentStep = step;
    
    if (step === 'terms') {
      modalTitle.textContent = 'Terms & Conditions';
      nextBtn.textContent = 'Next: Privacy Policy';
      nextBtn.disabled = true;
      termsAgrementState.termsScrolled = false;
      scrollPrompt.style.display = 'block';
      scrollPrompt.textContent = '📖 Scroll to the bottom to continue';
    } else {
      modalTitle.textContent = 'Privacy Policy';
      nextBtn.textContent = 'I Agree';
      nextBtn.disabled = true;
      termsAgrementState.privacyScrolled = false;
      scrollPrompt.style.display = 'block';
      scrollPrompt.textContent = '📖 Scroll to the bottom to continue';
    }
  } catch (error) {
    console.error('Error loading modal content:', error);
    modalBody.innerHTML = '<p>Error loading content. Please try again.</p>';
  }
}

/**
 * Detect when user scrolls to bottom of modal
 * Handles auto-transition and scroll state tracking
 */
function handleModalScroll() {
  const modalBody = document.getElementById('modalBody');
  const scrollPrompt = document.getElementById('scrollPrompt');
  const nextBtn = document.getElementById('modalNextBtn');

  if (!modalBody) return;

  // Calculate if user is at bottom (within 10px tolerance)
  const isScrolledToBottom = 
    modalBody.scrollHeight - modalBody.scrollTop - modalBody.clientHeight < 10;

  if (isScrolledToBottom) {
    // Clear any pending auto-transition
    if (termsAgrementState.autoTransitionTimer) {
      clearTimeout(termsAgrementState.autoTransitionTimer);
    }

    // Update UI to show scroll is complete
    scrollPrompt.style.display = 'none';
    scrollPrompt.textContent = '✓ Scroll complete';
    scrollPrompt.classList.add('scroll-complete');
    
    nextBtn.disabled = false;

    // Track which document was scrolled
    if (termsAgrementState.currentStep === 'terms') {
      termsAgrementState.termsScrolled = true;
      
      // Auto-transition to Privacy after 2 seconds
      termsAgrementState.autoTransitionTimer = setTimeout(() => {
        loadModalContent('privacy');
      }, 2000);
    } else if (termsAgrementState.currentStep === 'privacy') {
      termsAgrementState.privacyScrolled = true;
      
      // Auto-complete after 2 seconds
      termsAgrementState.autoTransitionTimer = setTimeout(() => {
        completeTermsAgreement();
      }, 2000);
    }
  } else if (termsAgrementState.autoTransitionTimer) {
    // User scrolled up - cancel auto-transition
    clearTimeout(termsAgrementState.autoTransitionTimer);
    termsAgrementState.autoTransitionTimer = null;
    
    // Reset scroll prompt
    scrollPrompt.classList.remove('scroll-complete');
    scrollPrompt.textContent = '📖 Scroll to the bottom to continue';
    scrollPrompt.style.display = 'block';
  }
}

function openTermsModal() {
  const checkbox = document.getElementById('termsCheckbox');
  const modal = document.getElementById('termsModal');

  if (!modal) return;

  // Prevent default checkbox behavior
  checkbox.checked = false;

  // Reset state
  termsAgrementState.termsScrolled = false;
  termsAgrementState.privacyScrolled = false;
  if (termsAgrementState.autoTransitionTimer) {
    clearTimeout(termsAgrementState.autoTransitionTimer);
    termsAgrementState.autoTransitionTimer = null;
  }

  // Show modal
  modal.removeAttribute('hidden');

  // Load Terms & Conditions
  loadModalContent('terms');

  // Attach scroll listener
  const modalBody = document.getElementById('modalBody');
  if (modalBody) {
    modalBody.addEventListener('scroll', handleModalScroll);
  }
}

function closeTermsModal() {
  const modal = document.getElementById('termsModal');
  const modalBody = document.getElementById('modalBody');
  const checkbox = document.getElementById('termsCheckbox');

  if (modal) {
    modal.setAttribute('hidden', '');
  }

  // Remove scroll listener
  if (modalBody) {
    modalBody.removeEventListener('scroll', handleModalScroll);
  }

  // Cancel any pending auto-transition
  if (termsAgrementState.autoTransitionTimer) {
    clearTimeout(termsAgrementState.autoTransitionTimer);
    termsAgrementState.autoTransitionTimer = null;
  }

  // Uncheck checkbox if modal closed without completing
  if (!termsAgrementState.privacyScrolled) {
    checkbox.checked = false;
  }

  // Reset state
  termsAgrementState.currentStep = null;
  termsAgrementState.termsScrolled = false;
  termsAgrementState.privacyScrolled = false;
}

function completeTermsAgreement() {
  const checkbox = document.getElementById('termsCheckbox');
  
  // Cancel any pending timer
  if (termsAgrementState.autoTransitionTimer) {
    clearTimeout(termsAgrementState.autoTransitionTimer);
    termsAgrementState.autoTransitionTimer = null;
  }
  
  checkbox.checked = true;
  closeTermsModal();
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

  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value.trim();

  if (!validateEmail(email)) {
    showFieldError('loginEmailError', 'Invalid email');
    return;
  }
  if (!password) {
    showFieldError('loginPasswordError', 'Password required');
    return;
  }

  try {
    const result = await loginUser(email, password);
    
    if (result.success) {
      // Show success toast and redirect to home
      showAuthSuccessToast('Logged in successfully, redirecting...');
      setTimeout(() => {
        window.location.href = './index.html';
      }, 2500);
    } else {
      // Show API error
      const errorMsg = result.message || 'Login failed. Please try again.';
      showFieldError('loginError', errorMsg);
    }
  } catch (error) {
    console.error('Login error:', error);
    showFieldError('loginError', 'An error occurred. Please try again.');
  }
}

// ============================================
// REGISTER
// ============================================

async function submitRegisterForm(e) {
  e.preventDefault();
  clearAllErrors('registerForm');

  const name = document.getElementById('registerName').value.trim();
  const email = document.getElementById('registerEmail').value.trim();
  const password = document.getElementById('registerPassword').value;
  const confirm = document.getElementById('registerConfirmPassword').value;
  const checkbox = document.getElementById('termsCheckbox');

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

  try {
    const result = await registerUser(name, email, password);
    
    if (result.success) {
      // Show success toast and redirect to home
      showAuthSuccessToast('Logged in successfully, redirecting...');
      setTimeout(() => {
        window.location.href = './index.html';
      }, 2500);
    } else {
      // Show API error
      const errorMsg = result.message || 'Registration failed. Please try again.';
      showFieldError('registerError', errorMsg);
    }
  } catch (error) {
    console.error('Registration error:', error);
    showFieldError('registerError', 'An error occurred. Please try again.');
  }
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

  // Terms & Privacy Modal Listeners
  const termsCheckbox = document.getElementById('termsCheckbox');
  const modalCloseBtn = document.querySelector('.auth-modal-close');
  const modalOverlay = document.getElementById('termsModal');
  const modalNextBtn = document.getElementById('modalNextBtn');

  termsCheckbox?.addEventListener('click', (e) => {
    e.preventDefault();
    openTermsModal();
  });

  modalCloseBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    closeTermsModal();
  });

  modalOverlay?.addEventListener('click', (e) => {
    if (e.target === modalOverlay) {
      closeTermsModal();
    }
  });

  modalNextBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    if (termsAgrementState.currentStep === 'terms') {
      loadModalContent('privacy');
    } else if (termsAgrementState.currentStep === 'privacy') {
      completeTermsAgreement();
    }
  });
});

