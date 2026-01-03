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
        // Ensure profile container is visible
        if (profileDiv) {
            profileDiv.style.display = 'flex';
            profileDiv.style.visibility = 'visible';
        }
        
        // Show profile picture if available
        if (profilePic && userProfilePic) {
            profilePic.src = userProfilePic;
            profilePic.style.display = 'inline-block';
            profilePic.title = userName;
            profilePic.style.cursor = 'pointer';
            profilePic.onclick = () => window.location.href = 'dashboard.html';
        }
        
        // Set user name and make it clickable
        if (userNameDisplay) {
            userNameDisplay.textContent = userName.split(' ')[0]; // Show first name
            userNameDisplay.style.display = 'inline';
            userNameDisplay.style.cursor = 'pointer';
            userNameDisplay.onclick = () => window.location.href = 'dashboard.html';
        }
        
        // Show logout button
        if (logoutBtn) {
            logoutBtn.style.display = 'inline-block';
        }
        
        // Hide login link
        if (loginLink) {
            loginLink.parentElement.style.display = 'none';
        }
    } else {
        // Hide profile section when not logged in
        if (profileDiv) {
            profileDiv.style.display = 'none';
        }
        
        if (profilePic) profilePic.style.display = 'none';
        if (userNameDisplay) userNameDisplay.textContent = '';
        if (userNameDisplay) userNameDisplay.style.display = 'none';
        if (logoutBtn) logoutBtn.style.display = 'none';
        
        // Show login link
        if (loginLink) {
            loginLink.parentElement.style.display = 'block';
        }
    }
}

// Update navigation state based on login status
function updateNavState() {
    const isLoggedIn = localStorage.getItem('webpotUserLoggedIn');
    const userName = localStorage.getItem('webpotUserName');
    
    const navUserName = document.getElementById('navUserName');
    const userNavInfo = document.getElementById('userNavInfo');
    const loginLink = document.querySelector('a[href="auth.html"]');
    
    if (isLoggedIn && userName) {
        // Show user nav info
        if (userNavInfo) {
            userNavInfo.style.display = 'flex';
        }

        // Set user name
        if (navUserName) {
            navUserName.textContent = userName.split(' ')[0]; // First name
        }

        // Populate profile pic in nav if available
        const navProfilePic = document.getElementById('navProfilePic');
        const storedPic = localStorage.getItem('webpotUserProfilePic');
        if (navProfilePic && storedPic) {
            navProfilePic.src = storedPic;
            navProfilePic.style.display = 'inline-block';
        } else if (navProfilePic) {
            navProfilePic.style.display = 'none';
        }

        // Hide login link
        if (loginLink) {
            loginLink.parentElement.style.display = 'none';
        }
    } else {
        // Hide user nav info
        if (userNavInfo) {
            userNavInfo.style.display = 'none';
        }

        // Hide nav profile pic if exists
        const navProfilePic = document.getElementById('navProfilePic');
        if (navProfilePic) navProfilePic.style.display = 'none';

        // Show login link
        if (loginLink) {
            loginLink.parentElement.style.display = 'block';
        }
    }
}

// Logout from navigation
function navLogout() {
    localStorage.removeItem('webpotUserLoggedIn');
    localStorage.removeItem('webpotUserEmail');
    localStorage.removeItem('webpotUserName');
    localStorage.removeItem('webpotUserProfilePic');
    window.location.reload();
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

// Session Timeout Handler (30 minutes of inactivity)
let sessionTimeoutInterval;
const SESSION_TIMEOUT_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds

function initSessionTimeout() {
    // Only initialize for logged-in users
    const isLoggedIn = localStorage.getItem('webpotUserLoggedIn');
    if (!isLoggedIn) {
        return;
    }
    
    // Function to reset the timeout
    function resetSessionTimeout() {
        // Clear existing timeout
        if (sessionTimeoutInterval) {
            clearTimeout(sessionTimeoutInterval);
        }
        
        // Set new timeout
        sessionTimeoutInterval = setTimeout(() => {
            // Session expired - log out user
            console.log('Session expired due to inactivity');
            localStorage.removeItem('webpotUserLoggedIn');
            localStorage.removeItem('webpotUserEmail');
            localStorage.removeItem('webpotUserName');
            localStorage.removeItem('webpotUserProfilePic');
            
            alert('Your session has expired due to inactivity. Please log in again.');
            window.location.href = 'auth.html';
        }, SESSION_TIMEOUT_DURATION);
    }
    
    // Reset timeout on user activity
    document.addEventListener('mousemove', resetSessionTimeout);
    document.addEventListener('keypress', resetSessionTimeout);
    document.addEventListener('click', resetSessionTimeout);
    
    // Initialize timeout on load
    resetSessionTimeout();
}

// Observe service cards on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    displayUserProfile(); // Show user profile on page load
    updateNavState(); // Update navigation state (show/hide user nav info)
    loadUpdates(); // Load updates from updates.html
    loadTestimonials(); // Load testimonials section
    initSessionTimeout(); // Initialize session timeout
    
    const serviceCards = document.querySelectorAll('.service-card');
    
    // Fallback: if IntersectionObserver not supported, show cards immediately
    if (!('IntersectionObserver' in window)) {
        serviceCards.forEach(card => {
            card.classList.add('in-view');
        });
    } else {
        // Use observer for supported browsers
        serviceCards.forEach(card => {
            observer.observe(card);
        });
    }
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

// Global order modal function - checks login before opening
window.openOrderModal = function() {
    const isLoggedIn = localStorage.getItem('webpotUserLoggedIn');
    
    if (!isLoggedIn) {
        // User not logged in - redirect to auth
        window.location.href = 'auth.html';
        return;
    }
    
    // User is logged in - open order modal
    const orderModal = document.getElementById('orderModal');
    if (orderModal) {
        orderModal.style.display = 'block';
    }
    closeMenu();
};

function closeOrderModal() {
    document.getElementById('orderModal').style.display = 'none';
}

function closePaymentModal() {
    // Clear QR timer when modal is closed
    if (qrTimerInterval) {
        clearInterval(qrTimerInterval);
    }
    
    // Clear pending order data
    window.pendingOrderData = null;
    
    // Reset payment form
    const paymentForm = document.getElementById('paymentForm');
    if (paymentForm) {
        paymentForm.reset();
    }
    
    // Reset order form
    const orderForm = document.getElementById('orderForm');
    if (orderForm) {
        orderForm.reset();
    }
    
    // Clear QR code container
    const qrContainer = document.getElementById('qrCodeContainer');
    if (qrContainer) {
        qrContainer.innerHTML = '';
    }
    
    document.getElementById('paymentModal').style.display = 'none';
}

window.onclick = function(event) {
    const orderModal = document.getElementById('orderModal');
    const paymentModal = document.getElementById('paymentModal');
    if (event.target === orderModal) {
        orderModal.style.display = 'none';
    }
    // Prevent closing payment modal by clicking on it - user must use Cancel button
    if (event.target === paymentModal && event.target.id === 'paymentModal') {
        // Do NOT close the modal
        return;
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

// QR Timer Variable
let qrTimerInterval;

// Update service price dynamically
function updateServicePrice() {
    const serviceSelect = document.getElementById('service');
    const amountField = document.getElementById('amount');
    const selectedService = serviceSelect.value;
    
    if (selectedService && servicePricing[selectedService]) {
        const price = servicePricing[selectedService];
        const halfPrice = Math.round(price / 2);
        amountField.value = '₹ ' + halfPrice.toLocaleString('en-IN') + ' (50% Advance of Monthly Fee)';
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
// 1. Handle "Place Order" click - Opens QR Modal
function submitOrder(event) {
    event.preventDefault();
    
    // Get Form Values
    const service = document.getElementById('service').value;
    const name = document.getElementById('oname').value;
    const email = document.getElementById('oemail').value;
    const phone = document.getElementById('ophone').value;
    const details = document.getElementById('details') ? document.getElementById('details').value : '';
    
    // Clean up amount string to number
    let cleanAmount = 0;
    if(servicePricing[service]) {
        cleanAmount = servicePricing[service];
    }

    if (!service || !name || !email || !phone) {
        alert('Please fill in all required fields');
        return;
    }

    // Save data temporarily
    window.pendingOrderData = {
        action: 'order',
        service: service,
        amount: cleanAmount,
        name: name,
        email: email,
        phone: phone,
        details: details
    };

    // Show Payment Modal
    document.getElementById('orderModal').style.display = 'none';
    const payModal = document.getElementById('paymentModal');
    if(payModal) {
        payModal.style.display = 'flex';
        // FIX: Actually generate the QR code now!
        generateUPIQR(cleanAmount, name);
    } else {
        alert("Payment Modal not found in HTML");
    }
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
    
    // Ensure regenerate button is hidden and QR container is visible
    const regenerateBtn = document.getElementById('regenerateBtn');
    if (regenerateBtn) {
        regenerateBtn.style.display = 'none';
    }
    qrContainer.style.display = 'block';
    
    // Handle UPI App Button
    const payViaAppBtn = document.getElementById('payViaAppBtn');
    if (payViaAppBtn) {
        // Set the href to the UPI link
        payViaAppBtn.href = upiLink;
        
        // Detect if user is on mobile
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
        
        if (isMobile) {
            // Show button on mobile
            payViaAppBtn.style.display = 'inline-block';
        } else {
            // Hide button on desktop
            payViaAppBtn.style.display = 'none';
        }
    }
    
    // Start the timer for QR code
    startQRTimer();
}

// Start QR Timer (5-minute countdown)
function startQRTimer() {
    // Clear any existing timer
    if (qrTimerInterval) {
        clearInterval(qrTimerInterval);
    }
    
    let timeRemaining = 300; // 5 minutes in seconds
    const timerElement = document.getElementById('qrTimer');
    
    // Update timer display immediately
    if (timerElement) {
        timerElement.style.display = 'block';
        timerElement.textContent = 'Time remaining: 05:00';
    }
    
    qrTimerInterval = setInterval(() => {
        timeRemaining--;
        
        // Format time as MM:SS
        const minutes = Math.floor(timeRemaining / 60);
        const seconds = timeRemaining % 60;
        const timeStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        
        if (timerElement) {
            timerElement.textContent = `Time remaining: ${timeStr}`;
        }
        
        // When timer hits 0
        if (timeRemaining <= 0) {
            clearInterval(qrTimerInterval);
            
            // Clear QR code container
            const qrContainer = document.getElementById('qrCodeContainer');
            if (qrContainer) {
                qrContainer.innerHTML = '';
                qrContainer.style.display = 'none';
            }
            
            // Hide timer text
            if (timerElement) {
                timerElement.style.display = 'none';
            }
            
            // Show regenerate button
            const regenerateBtn = document.getElementById('regenerateBtn');
            if (regenerateBtn) {
                regenerateBtn.style.display = 'block';
            }
        }
    }, 1000);
}

// Regenerate QR Code
function regenerateQR() {
    // FIX: Use pendingOrderData instead of orderDetails
    const orderData = window.pendingOrderData;
    if (orderData) {
        generateUPIQR(orderData.amount, orderData.name);
    }
}

// Verify and Submit Payment
// 2. Handle "Verify & Submit" click - Sends Data + UTR
function verifyAndSubmitPayment(event) {
    event.preventDefault();
    
    const utrInput = document.getElementById('utrNumber'); // Ensure input ID matches HTML
    const utrValue = utrInput.value.trim();

    if (!utrValue) {
        alert("Please enter the UPI Reference ID / UTR.");
        return;
    }

    // Add UTR to payload
    window.pendingOrderData.transactionId = utrValue;

    // Show loading text
    const verifyBtn = event.target.querySelector('button[type="submit"]');
    const originalText = verifyBtn.textContent;
    verifyBtn.textContent = "Verifying...";
    verifyBtn.disabled = true;

    // Send to Backend
    const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbytVOTbt78wKn3TVjypTy4tkGiGUpetyXhw7VB6nJZmnMPsPWoW6xHMr71xNUCTvEq1/exec';

    fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify(window.pendingOrderData)
    })
    .then(res => res.json())
    .then(data => {
        if (data.status === 'success') {
            document.getElementById('paymentModal').style.display = 'none';
            showSuccessModal('Order Confirmed!', `Order ID: ${data.orderId}. We will contact you shortly.`);
            
            // Cleanup
            document.getElementById('orderForm').reset();
            utrInput.value = '';
            window.pendingOrderData = null;
        } else {
            alert('Error: ' + data.message);
        }
    })
    .catch(err => {
        console.error('Error:', err);
        alert('Network error. Please try again.');
    })
    .finally(() => {
        verifyBtn.textContent = originalText;
        verifyBtn.disabled = false;
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
    const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbytVOTbt78wKn3TVjypTy4tkGiGUpetyXhw7VB6nJZmnMPsPWoW6xHMr71xNUCTvEq1/exec';
    
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

// Pay Later Function
function payLater() {
    if (!window.pendingOrderData) return;
    
    const submitBtn = document.querySelector('button[onclick="payLater()"]');
    if(submitBtn) {
        submitBtn.textContent = 'Processing...';
        submitBtn.disabled = true;
    }
    
    // Send order with NO transaction ID (Backend will mark as Pending / Due)
    const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbytVOTbt78wKn3TVjypTy4tkGiGUpetyXhw7VB6nJZmnMPsPWoW6xHMr71xNUCTvEq1/exec';
    
    fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify(window.pendingOrderData)
    })
    .then(res => res.json())
    .then(data => {
        if (data.status === 'success') {
            alert('Order Placed! You can pay later from your Dashboard.');
            window.location.href = 'dashboard.html';
        } else {
            alert('Error: ' + data.message);
        }
    })
    .catch(err => {
        console.error('Error:', err);
        alert('Network error. Please try again.');
    });
}

function loadTestimonials() {
    const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbytVOTbt78wKn3TVjypTy4tkGiGUpetyXhw7VB6nJZmnMPsPWoW6xHMr71xNUCTvEq1/exec';
    
    fetch(APPS_SCRIPT_URL + '?action=get_public_reviews', {
        method: 'GET'
    })
    .then(res => res.json())
    .then(data => {
        if (data.status === 'success') {
            renderTestimonials(data.reviews);
        }
    })
    .catch(err => console.error('Error loading testimonials:', err));
}

function renderTestimonials(reviews) {
    const grid = document.getElementById('testimonialsGrid');
    if (!grid) return;

    if (reviews.length === 0) {
        grid.innerHTML = '<p style="text-align: center; color: #999; grid-column: 1/-1;">No reviews yet. Be the first to share!</p>';
        return;
    }

    grid.innerHTML = reviews.map(review => `
        <div class="testimonial-card">
            <div class="testimonial-author">${review.name}</div>
            <div class="testimonial-service">${review.service}</div>
            <div class="testimonial-rating">${'⭐'.repeat(review.rating)}</div>
            <div class="testimonial-comment">"${review.comment}"</div>
        </div>
    `).join('');
}