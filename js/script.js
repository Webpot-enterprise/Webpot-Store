// Main Application Entry Point
// Initializes all modules and sets up page on load

/**
 * Initialize the application
 */
document.addEventListener('DOMContentLoaded', function() {
  // Update authentication UI
  updateAuthUI();
  
  // Load testimonials if feature is enabled and function exists
  if (API_CONFIG.FEATURES.ENABLE_TESTIMONIALS && typeof loadTestimonials === 'function') {
    loadTestimonials();
  }
  
  // Load notifications if feature is enabled and function exists
  if (API_CONFIG.FEATURES.ENABLE_NOTIFICATIONS && typeof loadNotifications === 'function') {
    loadNotifications();
  }
  
  // Update copyright year dynamically
  updateCopyrightYear();
  
  // Initialize tooltips or other global features
  initializeGlobalFeatures();
});

/**
 * Update copyright year to current year
 */
function updateCopyrightYear() {
  const currentYear = new Date().getFullYear();
  const copyrightElements = document.querySelectorAll('footer p');
  copyrightElements.forEach(el => {
    if (el.textContent.includes('2025')) {
      el.textContent = el.textContent.replace('2025', currentYear);
    }
  });
}

/**
 * Initialize any global features or polyfills
 */
function initializeGlobalFeatures() {
  // Add any global initialization code here
  console.log('Webpot Application Initialized');
}

/**
 * Auto-refresh testimonials every 30 minutes
 */
setInterval(() => {
  if (API_CONFIG.FEATURES.ENABLE_TESTIMONIALS && typeof loadTestimonials === 'function') {
    loadTestimonials();
  }
}, 30 * 60 * 1000);

/**
 * Auto-refresh notifications every 5 minutes
 */
setInterval(() => {
  if (API_CONFIG.FEATURES.ENABLE_NOTIFICATIONS && typeof loadNotifications === 'function') {
    loadNotifications();
  }
}, 5 * 60 * 1000);
