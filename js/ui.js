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
 */
function showSuccessMessage() {
  const successMessage = document.getElementById('successMessage');
  
  if (successMessage) {
    successMessage.style.display = 'block';
    successMessage.classList.add('show');
    
    setTimeout(() => {
      successMessage.style.display = 'none';
      successMessage.classList.remove('show');
    }, 4000);
  }
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
