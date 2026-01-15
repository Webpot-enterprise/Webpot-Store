// Orders Module - Order and payment handling

const SERVICE_PRICES = {
  'Starter': 2999,
  'Basic': 5999,
  'Premium': 9999
};

let selectedService = null;
let selectedPrice = null;
let qrTimer = null;

/**
 * Select a service plan
 * @param {string} service - Service name
 * @param {number} price - Service price
 */
function selectService(service, price) {
  selectedService = service;
  selectedPrice = price;
  const serviceSelect = document.getElementById('service');
  if (serviceSelect) {
    serviceSelect.value = service;
    updateServicePrice();
  }
  openOrderModal();
}

/**
 * Update service price display based on selection
 */
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

/**
 * Submit order form
 * @param {Event} event - Form submission event
 */
async function submitOrder(event) {
  event.preventDefault();
  
  const service = document.getElementById('service').value;
  
  if (!service) {
    alert('Please select a service');
    return;
  }
  
  // SECTION 11.3: Input Validation
  const name = document.getElementById('oname').value.trim();
  const email = document.getElementById('oemail').value.trim();
  const phone = document.getElementById('ophone').value.trim();
  
  // Validate required fields
  if (!name || !email || !phone) {
    alert('Please fill in all required fields');
    return;
  }
  
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    alert('Please enter a valid email address');
    return;
  }
  
  // Validate phone format (basic - at least 10 digits)
  const phoneRegex = /\d{10,}/;
  if (!phoneRegex.test(phone.replace(/\D/g, ''))) {
    alert('Please enter a valid phone number (at least 10 digits)');
    return;
  }
  
  const formData = {
    service: service,
    amount: selectedPrice,
    advanceAmount: Math.round(selectedPrice / 2),
    name: name,
    email: email,
    phone: phone,
    details: document.getElementById('details').value.trim()
  };
  
  // Store order data for payment
  sessionStorage.setItem('orderData', JSON.stringify(formData));
  
  closeOrderModal();
  openPaymentModal();
  generateUPIQR(formData.advanceAmount);
}

/**
 * Generate UPI QR Code
 * @param {number} amount - Amount to charge
 */
function generateUPIQR(amount) {
  const container = document.getElementById('qrCodeContainer');
  const payAmount = document.getElementById('payAmount');
  
  if (!container) return;
  
  // Clear previous QR code
  container.innerHTML = '';
  
  // UPI Payment String Format
  const upiString = `upi://pay?pa=engagewebpot@upi&pn=Webpot&am=${amount}&tn=Website Order`;
  
  if (payAmount) {
    payAmount.textContent = `Amount: ₹${amount}`;
  }
  
  try {
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

/**
 * QR Code countdown timer
 */
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

/**
 * Regenerate QR code
 */
function regenerateQR() {
  const orderData = JSON.parse(sessionStorage.getItem('orderData') || '{}');
  generateUPIQR(orderData.advanceAmount || 1500);
}

/**
 * Verify payment and submit order
 * @param {Event} event - Form submission event
 */
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
  
  const result = await submitOrder(paymentData);
  
  if (result.success) {
    closePaymentModal();
    showSuccessMessage();
    const orderForm = document.getElementById('orderForm');
    if (orderForm) orderForm.reset();
    sessionStorage.removeItem('orderData');
    
    // Redirect to dashboard after success
    setTimeout(() => {
      window.location.href = 'dashboard-webpot/user dashboard/html/index.html';
    }, 2000);
  } else {
    alert('Error submitting order: ' + (result.error || 'Please try again.'));
  }
}

/**
 * Pay later and go to dashboard
 */
function payLater() {
  const orderData = JSON.parse(sessionStorage.getItem('orderData') || '{}');
  
  if (orderData.email) {
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
