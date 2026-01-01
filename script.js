// Mobile Menu Toggle Functions
function toggleMenu() {
    const navMenu = document.getElementById('navMenu');
    navMenu.classList.toggle('active');
}

function closeMenu() {
    const navMenu = document.getElementById('navMenu');
    navMenu.classList.remove('active');
}

// Close menu when clicking outside
document.addEventListener('click', function(event) {
    const navMenu = document.getElementById('navMenu');
    const menuToggle = document.getElementById('menuToggle');
    if (!navMenu.contains(event.target) && !menuToggle.contains(event.target)) {
        navMenu.classList.remove('active');
    }
});

// Intersection Observer for scroll-triggered animations
const observerOptions = {
    threshold: 0.2,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
        }
    });
}, observerOptions);

// Display user profile when logged in
function displayUserProfile() {
    const userName = localStorage.getItem('webpotUserName');
    const userEmail = localStorage.getItem('webpotUserEmail');
    const userProfilePic = localStorage.getItem('webpotUserProfilePic');
    const isLoggedIn = localStorage.getItem('webpotUserLoggedIn');
    
    const profileDiv = document.getElementById('userProfile');
    const profilePic = document.getElementById('profilePic');
    const userNameDisplay = document.getElementById('userNameDisplay');
    const logoutBtn = document.getElementById('logoutBtn');
    const loginLink = document.querySelector('a[href="auth.html"]');
    
    if (isLoggedIn && userName) {
        // Show profile picture if available
        if (userProfilePic) {
            profilePic.src = userProfilePic;
            profilePic.style.display = 'block';
            profilePic.title = userName;
        }
        
        userNameDisplay.textContent = userName.split(' ')[0]; // Show first name
        logoutBtn.style.display = 'inline-block';
        
        // Hide login link
        if (loginLink) {
            loginLink.style.display = 'none';
        }
    } else {
        profilePic.style.display = 'none';
        userNameDisplay.textContent = '';
        logoutBtn.style.display = 'none';
        
        // Show login link
        if (loginLink) {
            loginLink.style.display = 'inline';
        }
    }
}

// Logout user
function logoutUser() {
    localStorage.removeItem('webpotUserLoggedIn');
    localStorage.removeItem('webpotUserEmail');
    localStorage.removeItem('webpotUserName');
    localStorage.removeItem('webpotUserProfilePic');
    
    displayUserProfile();
    window.location.href = 'index.html';
}

// Observe service cards on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    displayUserProfile(); // Show user profile on page load
    loadUpdates(); // Load updates from updates.html
    const serviceCards = document.querySelectorAll('.service-card');
    serviceCards.forEach(card => {
        observer.observe(card);
    });
});

// Modal Functions
function checkLoginStatus() {
    const isLoggedIn = localStorage.getItem('webpotUserLoggedIn');
    if (!isLoggedIn) {
        window.location.href = 'auth.html';
        return false;
    }
    return true;
}

function openOrderModal() {
    if (!checkLoginStatus()) return;
    document.getElementById('orderModal').style.display = 'block';
    closeMenu();
}

function closeOrderModal() {
    document.getElementById('orderModal').style.display = 'none';
}

function closePaymentModal() {
    document.getElementById('paymentModal').style.display = 'none';
}

window.onclick = function(event) {
    const orderModal = document.getElementById('orderModal');
    const paymentModal = document.getElementById('paymentModal');
    if (event.target === orderModal) {
        orderModal.style.display = 'none';
    }
    if (event.target === paymentModal) {
        paymentModal.style.display = 'none';
    }
}

// Service pricing mapping
const servicePricing = {
    'Starter': 2999,
    'Basic': 5999,
    'Premium': 9999
};

// UPI Configuration
const MY_UPI_ID = 'kakadiyasuprince@okhdfcbank';

// Update service price dynamically
function updateServicePrice() {
    const serviceSelect = document.getElementById('service');
    const amountField = document.getElementById('amount');
    const selectedService = serviceSelect.value;
    
    if (selectedService && servicePricing[selectedService]) {
        const price = servicePricing[selectedService];
        const halfPrice = Math.round(price / 2);
        amountField.value = '₹ ' + halfPrice.toLocaleString('en-IN') + ' (50% advance)';
        amountField.classList.add('price-update-animation');
        setTimeout(() => {
            amountField.classList.remove('price-update-animation');
        }, 300);
    } else {
        amountField.value = '';
    }
}

// Select Service
function selectService(serviceName, price) {
    openOrderModal();
    document.getElementById('service').value = serviceName;
    updateServicePrice();
}

// Submit Order Form - Show Payment Modal with QR Code
function submitOrder(event) {
    event.preventDefault();
    
    const service = document.getElementById('service').value;
    const amount = document.getElementById('amount').value;
    const name = document.getElementById('oname').value;
    const email = document.getElementById('oemail').value;
    const phone = document.getElementById('ophone').value;
    const details = document.getElementById('details') ? document.getElementById('details').value : '';
    const birthdate = document.getElementById('birthdate') ? document.getElementById('birthdate').value : '';
    const deadline = document.getElementById('deadline') ? document.getElementById('deadline').value : '';
    
    // Extract numeric amount
    let amountValue = 0;
    if (service && servicePricing[service]) {
        amountValue = Math.round(servicePricing[service] / 2); // Half price
    }
    
    if (!service || !name || !email || !phone || !amountValue) {
        alert('Please fill in all required fields');
        return;
    }
    
    // Store order details for payment
    window.orderDetails = {
        service: service,
        amount: amountValue,
        name: name,
        email: email,
        phone: phone,
        details: details,
        birthdate: birthdate,
        deadline: deadline
    };
    
    // Hide order modal and show payment modal
    closeOrderModal();
    document.getElementById('paymentModal').style.display = 'block';
    document.getElementById('paymentForm').reset();
    
    // Generate QR code
    generateUPIQR(amountValue, name);
    
    // Focus on UTR input
    setTimeout(() => {
        document.getElementById('utrNumber').focus();
    }, 100);
}

// Generate UPI QR Code
function generateUPIQR(amount, name) {
    // Construct the UPI URL
    const upiLink = 'upi://pay?pa=' + MY_UPI_ID + '&pn=Webpot&am=' + amount + '&cu=INR';
    
    // Clear the QR code container
    const qrContainer = document.getElementById('qrCodeContainer');
    qrContainer.innerHTML = '';
    
    // Generate QR code
    new QRCode(qrContainer, {
        text: upiLink,
        width: 200,
        height: 200
    });
    
    // Update the amount display
    document.getElementById('payAmount').textContent = '₹ ' + amount.toLocaleString('en-IN');
}

// Verify and Submit Payment
function verifyAndSubmitPayment(event) {
    event.preventDefault();
    
    const utrNumber = document.getElementById('utrNumber').value.trim();
    
    // Validate UTR number
    if (!utrNumber) {
        alert('Please enter a valid UPI Reference ID / UTR');
        return;
    }
    
    const orderDetails = window.orderDetails;
    
    // Show loading state
    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Processing...';
    submitBtn.disabled = true;
    
    // Show success animation
    showOrderSuccessAnimation();
    
    // Send order data to backend
    const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbx9nmE6vvc9LXPon9-MrMQfSCDlvoeMJtMhbq0d80ftpYodypkm6RoSr8pz2H-Ro8kj/exec';
    
    const payload = {
        formType: 'order',
        name: orderDetails.name,
        email: orderDetails.email,
        phone: orderDetails.phone,
        service: orderDetails.service,
        amount: orderDetails.amount,
        details: orderDetails.details,
        birthdate: orderDetails.birthdate,
        deadline: orderDetails.deadline,
        paymentMethod: 'UPI',
        transactionId: utrNumber
    };
    
    fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify(payload)
    })
    .then(res => res.json())
    .then(data => {
        // Success animation already shown
        setTimeout(() => {
            showSuccessModal('Order Confirmed!', `Thank you! Your order for ${orderDetails.service} service has been confirmed. UPI Reference: ${utrNumber}`);
            closePaymentModal();
            document.getElementById('orderForm').reset();
            document.getElementById('paymentForm').reset();
            document.getElementById('amount').value = '';
        }, 1500);
    })
    .catch(err => {
        console.error('Error:', err);
        showSuccessModal('Payment Received!', 'Your payment has been processed. We will contact you shortly.');
        closePaymentModal();
        document.getElementById('orderForm').reset();
        document.getElementById('paymentForm').reset();
        document.getElementById('amount').value = '';
    })
    .finally(() => {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    });
}

// Order success animation
function showOrderSuccessAnimation() {
    const animationDiv = document.createElement('div');
    animationDiv.className = 'success-animation';
    animationDiv.innerHTML = `
        <div class="success-animation-content">
            <svg class="success-checkmark" viewBox="0 0 24 24" fill="none">
                <circle class="success-checkmark-circle" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"></circle>
                <path class="success-checkmark-path" d="M8 12l2 2 6-6" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" style="stroke-dasharray: 10; animation: checkmark 0.6s ease-out 0.3s forwards;"></path>
            </svg>
        </div>
    `;
    
    document.body.appendChild(animationDiv);
    
    // Create confetti
    for (let i = 0; i < 12; i++) {
        createConfetti();
    }
    
    // Remove animation after it completes
    setTimeout(() => {
        animationDiv.remove();
    }, 2000);
}

// Create confetti particles
function createConfetti() {
    const confetti = document.createElement('div');
    confetti.className = 'confetti-piece';
    confetti.style.left = Math.random() * window.innerWidth + 'px';
    confetti.style.top = '-10px';
    confetti.style.width = (Math.random() * 10 + 5) + 'px';
    confetti.style.height = (Math.random() * 10 + 5) + 'px';
    confetti.style.backgroundColor = ['#00d4ff', '#b000ff', '#ff0099'][Math.floor(Math.random() * 3)];
    confetti.style.borderRadius = '50%';
    confetti.style.animation = `confetti ${Math.random() * 2 + 2}s ease-in-out forwards`;
    confetti.style.opacity = '0.8';
    
    document.body.appendChild(confetti);
    
    setTimeout(() => confetti.remove(), 4000);
}

// Submit Contact Form to Google Sheets
function submitForm(event) {
    event.preventDefault();
    
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const phone = document.getElementById('phone').value;
    const message = document.getElementById('message').value;
    
    if (!name || !email || !message) {
        alert('Please fill in all required fields');
        return;
    }
    
    // Send to Google Apps Script backend
    const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbx9nmE6vvc9LXPon9-MrMQfSCDlvoeMJtMhbq0d80ftpYodypkm6RoSr8pz2H-Ro8kj/exec';
    
    // Show loading state
    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Sending...';
    submitBtn.disabled = true;
    
    fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify({
            formType: 'contact',
            name: name,
            email: email,
            phone: phone,
            message: message
        })
    })
    .then(res => res.json())
    .then(data => {
        if (data.status === 'success') {
            showSuccessModal('Message Sent!', 'We have received your inquiry and will contact you shortly.');
            event.target.reset();
        } else {
            alert('Error: ' + (data.message || 'Failed to send message'));
        }
    })
    .catch(err => {
        console.error('Error:', err);
        alert('Failed to send message. Please try again.');
    })
    .finally(() => {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    });
}

// Show Success Modal
function showSuccessModal(title, message) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content">
            <h2>${title}</h2>
            <p>${message}</p>
            <button onclick="this.closest('.modal-overlay').remove()" class="btn-primary">Close</button>
        </div>
    `;
    document.body.appendChild(modal);
    
    setTimeout(() => {
        if (modal.parentElement) {
            modal.remove();
        }
    }, 4000);
}

// Show Success Message
function showSuccessMessage() {
    const successMsg = document.getElementById('successMessage');
    if (successMsg) {
        successMsg.style.display = 'block';
        
        setTimeout(() => {
            successMsg.style.display = 'none';
        }, 2000);
    }
}

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth' });
        }
    });
});

// Scroll to Top Button Functionality
const scrollToTopBtn = document.getElementById('scrollToTopBtn');

// Show button when scrolled down
window.addEventListener('scroll', () => {
    if (window.pageYOffset > 300) {
        scrollToTopBtn.classList.add('show');
    } else {
        scrollToTopBtn.classList.remove('show');
    }
});

// Scroll to top function
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// Toggle notification dropdown
function toggleNotifications() {
    const dropdown = document.getElementById('notificationDropdown');
    dropdown.classList.toggle('active');
}

// Load updates from updates.html
function loadUpdates() {
    const notificationList = document.getElementById('notificationList');
    
    fetch('updates.html')
        .then(response => response.text())
        .then(html => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const updatesContainer = doc.querySelector('.updates-container');
            
            if (updatesContainer) {
                notificationList.innerHTML = updatesContainer.innerHTML;
                
                // Add click handlers to update items
                document.querySelectorAll('.update-item').forEach(item => {
                    item.addEventListener('click', function() {
                        const title = this.querySelector('.update-title').textContent;
                        const description = this.querySelector('.update-description').textContent;
                        alert(`${title}\n\n${description}`);
                    });
                });
            }
        })
        .catch(err => {
            console.error('Error loading updates:', err);
            notificationList.innerHTML = '<div style="padding: 1rem; text-align: center; color: var(--text-muted);">Unable to load updates</div>';
        });
}

// Close notification dropdown when clicking outside
document.addEventListener('click', function(event) {
    const notificationWrapper = document.querySelector('.notification-wrapper');
    const dropdown = document.getElementById('notificationDropdown');
    
    if (notificationWrapper && !notificationWrapper.contains(event.target)) {
        dropdown.classList.remove('active');
    }
});