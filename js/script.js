// Main Frontend Script for Webpot
// Handles all interactions, forms, modals, and API calls

// ============================================================================
// DOM MANIPULATION & UI FUNCTIONS
// ============================================================================

// Toggle mobile menu
function toggleMenu() {
  const navMenu = document.getElementById('navMenu');
  if (navMenu) {
    navMenu.classList.toggle('active');
  }
}

// Close mobile menu
function closeMenu() {
  const navMenu = document.getElementById('navMenu');
  if (navMenu) {
    navMenu.classList.remove('active');
  }
}

// Toggle user dropdown menu
function toggleUserMenu(event) {
  event.stopPropagation();
  const userDropdown = document.getElementById('userDropdown');
  if (userDropdown) {
    userDropdown.classList.toggle('active');
  }
}

// Close dropdowns when clicking outside
document.addEventListener('click', function() {
  const userDropdown = document.getElementById('userDropdown');
  if (userDropdown && userDropdown.classList.contains('active')) {
    userDropdown.classList.remove('active');
  }
});

// ============================================================================
// SERVICE & ORDER FUNCTIONS
// ============================================================================

const SERVICE_PRICES = {
  'Starter': 2999,
  'Basic': 5999,
  'Premium': 9999
};

let selectedService = null;
let selectedPrice = null;

// Select a service plan
function selectService(service, price) {
  selectedService = service;
  selectedPrice = price;
  document.getElementById('service').value = service;
  updateServicePrice();
  openOrderModal();
}

// Update service price display based on selection
function updateServicePrice() {
  const serviceSelect = document.getElementById('service');
  const amountInput = document.getElementById('amount');
  
  if (!serviceSelect || !amountInput) return;
  
  const selectedService = serviceSelect.value;
  
  if (selectedService && SERVICE_PRICES[selectedService]) {
    const price = SERVICE_PRICES[selectedService];
    const advanceAmount = Math.round(price / 2);
    amountInput.value = `₹${advanceAmount} (50% advance)`;
    selectedPrice = price;
  } else {
    amountInput.value = '';
    selectedPrice = null;
  }
}

// ============================================================================
// MODAL FUNCTIONS
// ============================================================================

// Open order modal
function openOrderModal() {
  const modal = document.getElementById('orderModal');
  if (modal) {
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
  }
}

// Close order modal
function closeOrderModal() {
  const modal = document.getElementById('orderModal');
  if (modal) {
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
  }
}

// Close payment modal
function closePaymentModal() {
  const modal = document.getElementById('paymentModal');
  if (modal) {
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
  }
}

// Close modal when clicking outside content
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

// ============================================================================
// FORM SUBMISSION FUNCTIONS
// ============================================================================

// Submit contact form
async function submitForm(event) {
  event.preventDefault();
  
  const formData = {
    name: document.getElementById('name').value,
    email: document.getElementById('email').value,
    phone: document.getElementById('phone').value,
    message: document.getElementById('message').value
  };
  
  try {
    // Call API to submit contact form
    const response = await fetch(API_CONFIG.CLOUDFLARE_WORKER, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: API_CONFIG.ACTIONS.SUBMIT_CONTACT,
        data: formData
      })
    });
    
    if (response.ok) {
      showSuccessMessage();
      document.getElementById('contactForm').reset();
    } else {
      alert('Error submitting form. Please try again.');
    }
  } catch (error) {
    console.error('Error submitting contact form:', error);
    alert('Error submitting form. Please try again.');
  }
}

// Submit order form
async function submitOrder(event) {
  event.preventDefault();
  
  const service = document.getElementById('service').value;
  
  if (!service) {
    alert('Please select a service');
    return;
  }
  
  const formData = {
    service: service,
    amount: selectedPrice,
    advanceAmount: Math.round(selectedPrice / 2),
    name: document.getElementById('oname').value,
    email: document.getElementById('oemail').value,
    phone: document.getElementById('ophone').value,
    details: document.getElementById('details').value
  };
  
  // Store order data for payment
  sessionStorage.setItem('orderData', JSON.stringify(formData));
  
  closeOrderModal();
  openPaymentModal();
  generateUPIQR(formData.advanceAmount);
}

// ============================================================================
// PAYMENT & QR CODE FUNCTIONS
// ============================================================================

let qrTimer = null;

// Generate UPI QR Code
function generateUPIQR(amount) {
  const container = document.getElementById('qrCodeContainer');
  const payAmount = document.getElementById('payAmount');
  
  if (!container) return;
  
  // Clear previous QR code
  container.innerHTML = '';
  
  // UPI Payment String Format
  // upi://pay?pa=upi_id&pn=name&am=amount&tn=description
  const upiString = `upi://pay?pa=engagewebpot@upi&pn=Webpot&am=${amount}&tn=Website Order`;
  
  if (payAmount) {
    payAmount.textContent = `Amount: ₹${amount}`;
  }
  
  try {
    // Generate QR code using the library loaded from CDN
    if (typeof QRCode !== 'undefined') {
      new QRCode(container, {
        text: upiString,
        width: 200,
        height: 200,
        colorDark: '#000000',
        colorLight: '#FFFFFF'
      });
    }
  } catch (error) {
    console.error('Error generating QR code:', error);
    container.innerHTML = '<p style="color: red;">Error generating QR code</p>';
  }
  
  // Set up UPI App link
  const payViaAppBtn = document.getElementById('payViaAppBtn');
  if (payViaAppBtn) {
    payViaAppBtn.href = upiString;
    payViaAppBtn.style.display = 'inline-block';
  }
  
  // Start countdown timer
  startQRTimer();
}

// QR Code countdown timer
function startQRTimer() {
  let timeRemaining = 300; // 5 minutes
  const timerDisplay = document.getElementById('qrTimer');
  const regenerateBtn = document.getElementById('regenerateBtn');
  
  if (qrTimer) clearInterval(qrTimer);
  
  qrTimer = setInterval(function() {
    timeRemaining--;
    
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    
    if (timerDisplay) {
      timerDisplay.textContent = `Time remaining: ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    
    if (timeRemaining <= 0) {
      clearInterval(qrTimer);
      if (timerDisplay) {
        timerDisplay.textContent = 'QR Code expired. Click "Regenerate QR" to get a new one.';
      }
      if (regenerateBtn) {
        regenerateBtn.style.display = 'inline-block';
      }
    }
  }, 1000);
  
  if (regenerateBtn) {
    regenerateBtn.style.display = 'none';
  }
}

// Regenerate QR code
function regenerateQR() {
  const orderData = JSON.parse(sessionStorage.getItem('orderData') || '{}');
  generateUPIQR(orderData.advanceAmount || 1500);
}

// Verify payment and submit order
async function verifyAndSubmitPayment(event) {
  event.preventDefault();
  
  const utrNumber = document.getElementById('utrNumber').value.trim();
  
  if (!utrNumber) {
    alert('Please enter UPI Reference ID / UTR');
    return;
  }
  
  const orderData = JSON.parse(sessionStorage.getItem('orderData') || '{}');
  
  const paymentData = {
    ...orderData,
    utrNumber: utrNumber,
    timestamp: new Date().toISOString(),
    paymentStatus: 'pending'
  };
  
  try {
    const response = await fetch(API_CONFIG.CLOUDFLARE_WORKER, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: API_CONFIG.ACTIONS.SUBMIT_ORDER,
        data: paymentData
      })
    });
    
    if (response.ok) {
      closePaymentModal();
      showSuccessMessage();
      document.getElementById('orderForm').reset();
      sessionStorage.removeItem('orderData');
      
      // Redirect to dashboard after success
      setTimeout(() => {
        window.location.href = 'dashboard-webpot/user dashboard/html/index.html';
      }, 2000);
    } else {
      alert('Error submitting order. Please try again.');
    }
  } catch (error) {
    console.error('Error submitting payment:', error);
    alert('Error submitting order. Please check your connection and try again.');
  }
}

// Pay later and go to dashboard
function payLater() {
  const orderData = JSON.parse(sessionStorage.getItem('orderData') || '{}');
  
  if (orderData.email) {
    // Store order as pending
    const pendingOrders = JSON.parse(localStorage.getItem('pendingOrders') || '[]');
    pendingOrders.push({
      ...orderData,
      timestamp: new Date().toISOString(),
      status: 'pending_payment'
    });
    localStorage.setItem('pendingOrders', JSON.stringify(pendingOrders));
  }
  
  closePaymentModal();
  window.location.href = 'dashboard-webpot/user dashboard/html/index.html';
}

// ============================================================================
// NOTIFICATIONS FUNCTIONS
// ============================================================================

// Toggle notifications dropdown
function toggleNotifications() {
  const dropdown = document.getElementById('notificationDropdown');
  if (dropdown) {
    dropdown.classList.toggle('active');
  }
}

// Load notifications
async function loadNotifications() {
  const notificationList = document.getElementById('notificationList');
  
  if (!notificationList) return;
  
  try {
    const response = await fetch(API_CONFIG.CLOUDFLARE_WORKER + '?action=getNotifications');
    const data = await response.json();
    
    if (data.notifications && data.notifications.length > 0) {
      notificationList.innerHTML = data.notifications
        .map(n => `<div class="notification-item"><strong>${n.title}</strong><p>${n.message}</p></div>`)
        .join('');
      
      const badge = document.getElementById('notificationBadge');
      if (badge) {
        badge.style.display = 'inline-block';
      }
    } else {
      notificationList.innerHTML = '<p style="padding: 1rem; color: #999;">No new notifications</p>';
    }
  } catch (error) {
    console.error('Error loading notifications:', error);
    notificationList.innerHTML = '<p style="padding: 1rem; color: #999;">No new notifications</p>';
  }
}

// ============================================================================
// AUTHENTICATION FUNCTIONS
// ============================================================================

// Update UI based on authentication status
function updateAuthUI() {
  const isAuth = isAuthenticated();
  const loginBtn = document.getElementById('loginBtn');
  const userMenu = document.getElementById('userMenu');
  
  if (loginBtn) loginBtn.style.display = isAuth ? 'none' : 'inline-block';
  if (userMenu) userMenu.style.display = isAuth ? 'flex' : 'none';
  
  if (isAuth) {
    const userData = getUserData();
    if (userData) {
      const userName = document.getElementById('userName');
      const userProfilePic = document.getElementById('userProfilePic');
      
      if (userName) userName.textContent = userData.name || 'User';
      if (userProfilePic) {
        userProfilePic.src = userData.profilePic || 'default pfp.webp';
        userProfilePic.onerror = function() {
          this.src = 'default pfp.webp';
        };
      }
    }
  }
}

// Logout user
function logoutUser() {
  clearAuthToken();
  clearUserData();
  updateAuthUI();
  
  // Close user menu
  const userDropdown = document.getElementById('userDropdown');
  if (userDropdown) userDropdown.classList.remove('active');
  
  // Redirect to home
  window.location.href = '/';
}

// ============================================================================
// TESTIMONIALS
// ============================================================================

// Load testimonials from API or local storage
async function loadTestimonials() {
  const testimonialsGrid = document.getElementById('testimonialsGrid');
  
  if (!testimonialsGrid) return;
  
  try {
    const response = await fetch(API_CONFIG.CLOUDFLARE_WORKER + '?action=getTestimonials');
    const data = await response.json();
    
    if (data.testimonials && data.testimonials.length > 0) {
      testimonialsGrid.innerHTML = data.testimonials
        .map(t => `
          <div class="testimonial-card">
            <div class="stars">${'★'.repeat(t.rating)}</div>
            <p>"${t.message}"</p>
            <p><strong>${t.name}</strong></p>
            <p style="color: var(--text-muted);">${t.company || ''}</p>
          </div>
        `)
        .join('');
    }
  } catch (error) {
    console.error('Error loading testimonials:', error);
    // Show fallback testimonials
    showFallbackTestimonials();
  }
}

// Fallback testimonials if API fails
function showFallbackTestimonials() {
  const testimonialsGrid = document.getElementById('testimonialsGrid');
  
  if (!testimonialsGrid) return;
  
  const fallbackTestimonials = [
    {
      name: 'Raj Kumar',
      company: 'Tech Startup',
      message: 'Webpot delivered our website on time and exceeded our expectations. The team was professional and responsive.',
      rating: 5
    },
    {
      name: 'Priya Singh',
      company: 'E-commerce Business',
      message: 'Great service! Our website is now converting visitors to customers. Highly recommend Webpot!',
      rating: 5
    },
    {
      name: 'Amit Patel',
      company: 'Small Business Owner',
      message: 'The support team is excellent. They helped us with everything we needed and made the process smooth.',
      rating: 5
    }
  ];
  
  testimonialsGrid.innerHTML = fallbackTestimonials
    .map(t => `
      <div class="testimonial-card">
        <div class="stars">${'★'.repeat(t.rating)}</div>
        <p>"${t.message}"</p>
        <p><strong>${t.name}</strong></p>
        <p style="color: var(--text-muted);">${t.company || ''}</p>
      </div>
    `)
    .join('');
}

// ============================================================================
// SERVICE PLAN COMPARISON
// ============================================================================

// Show plan comparison
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
  event.target.classList.add('active');
}

// ============================================================================
// SUCCESS MESSAGE DISPLAY
// ============================================================================

// Show success message
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

// ============================================================================
// SCROLL TO TOP
// ============================================================================

const scrollToTopBtn = document.getElementById('scrollToTopBtn');

// Show/hide scroll to top button
window.addEventListener('scroll', () => {
  if (scrollToTopBtn) {
    if (window.pageYOffset > 300) {
      scrollToTopBtn.style.display = 'block';
    } else {
      scrollToTopBtn.style.display = 'none';
    }
  }
});

// Scroll to top
function scrollToTop() {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
}

// ============================================================================
// PAGE INITIALIZATION
// ============================================================================

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
  // Update auth UI
  updateAuthUI();
  
  // Load testimonials if available
  if (API_CONFIG.FEATURES.ENABLE_TESTIMONIALS) {
    loadTestimonials();
  }
  
  // Load notifications if available
  if (API_CONFIG.FEATURES.ENABLE_NOTIFICATIONS) {
    loadNotifications();
  }
  
  // Set copyright year
  const currentYear = new Date().getFullYear();
  const copyrightElements = document.querySelectorAll('footer p');
  copyrightElements.forEach(el => {
    if (el.textContent.includes('2025')) {
      el.textContent = el.textContent.replace('2025', currentYear);
    }
  });
});

// Auto-update testimonials every 30 minutes
setInterval(() => {
  if (API_CONFIG.FEATURES.ENABLE_TESTIMONIALS) {
    loadTestimonials();
  }
}, 30 * 60 * 1000);
