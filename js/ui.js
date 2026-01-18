// UI Module - UI interactions and DOM manipulation

/**
 * Toggle mobile menu
 */
function toggleMenu() {
  const navMenu = document.getElementById('navMenu');
  if (navMenu) {
    navMenu.classList.toggle('active');
  }
}

/**
 * Close mobile menu
 */
function closeMenu() {
  const navMenu = document.getElementById('navMenu');
  if (navMenu) {
    navMenu.classList.remove('active');
  }
}

/**
 * Open order modal
 */
function openOrderModal() {
  // Check authentication first
  if (!isAuthenticated()) {
    alert('Please login first to place an order');
    window.location.href = '/auth.html';
    return;
  }
  
  const modal = document.getElementById('orderModal');
  if (modal) {
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
  }
}

/**
 * Close order modal
 */
function closeOrderModal() {
  const modal = document.getElementById('orderModal');
  if (modal) {
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
  }
}

/**
 * Open payment modal
 */
function openPaymentModal() {
  const modal = document.getElementById('paymentModal');
  if (modal) {
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
  }
}

/**
 * Close payment modal
 */
function closePaymentModal() {
  const modal = document.getElementById('paymentModal');
  if (modal) {
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
  }
}

/**
 * Close modal when clicking outside content
 */
window.onclick = function(event) {
  const orderModal = document.getElementById('orderModal');
  const paymentModal = document.getElementById('paymentModal');
  
  if (event.target === orderModal) {
    closeOrderModal();
  }
  if (event.target === paymentModal) {
    closePaymentModal();
  }
};

/**
 * Toggle notifications dropdown
 */
function toggleNotifications() {
  const dropdown = document.getElementById('notificationDropdown');
  if (dropdown) {
    dropdown.classList.toggle('active');
  }
}

/**
 * Show plan comparison
 * @param {string} view - 'cards' or 'table'
 */
function showPlanComparison(view) {
  const cardsView = document.getElementById('cards-view');
  const tableView = document.getElementById('table-view');
  const toggleBtns = document.querySelectorAll('.toggle-btn');
  
  if (view === 'cards') {
    if (cardsView) cardsView.style.display = 'flex';
    if (tableView) tableView.style.display = 'none';
  } else {
    if (cardsView) cardsView.style.display = 'none';
    if (tableView) tableView.style.display = 'block';
  }
  
  // Update button states
  toggleBtns.forEach(btn => {
    btn.classList.remove('active');
  });
  if (event.target) {
    event.target.classList.add('active');
  }
}

/**
 * Show success message
 * @param {string} message - Optional success message to display
 */
function showSuccessMessage(message = '') {
  // Try to find success message div
  let successMessage = document.getElementById('successMessage');
  
  // If on auth page, look for forms and show in a temporary div
  if (!successMessage) {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    if (loginForm || registerForm) {
      successMessage = document.createElement('div');
      successMessage.className = 'success-message';
      successMessage.id = 'successMessage';
      const targetForm = loginForm && loginForm.style.display !== 'none' ? loginForm : registerForm;
      if (targetForm) {
        targetForm.insertAdjacentElement('afterbegin', successMessage);
      }
    }
  }
  
  if (successMessage) {
    if (message) {
      successMessage.textContent = message;
    }
    successMessage.style.display = 'block';
    successMessage.classList.add('show');
    
    setTimeout(() => {
      successMessage.style.display = 'none';
      successMessage.classList.remove('show');
      if (message && successMessage.parentNode) {
        successMessage.textContent = '';
      }
    }, 3000);
  }
}

/**
 * Show error message
 * @param {string} message - Error message to display
 */
function showErrorMessage(message) {
  // Try to show error in error message div if it exists
  const errorDiv = document.getElementById('loginError') || 
                   document.getElementById('registerError');
  
  if (errorDiv) {
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    errorDiv.classList.add('show');
    return;
  }
  
  // Fallback to alert
  alert(message);
}

/**
 * Scroll to top
 */
function scrollToTop() {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
}

/**
 * Show/hide scroll to top button based on scroll position
 */
window.addEventListener('scroll', () => {
  const scrollToTopBtn = document.getElementById('scrollToTopBtn');
  if (scrollToTopBtn) {
    if (window.pageYOffset > 300) {
      scrollToTopBtn.style.display = 'block';
    } else {
      scrollToTopBtn.style.display = 'none';
    }
  }
});
