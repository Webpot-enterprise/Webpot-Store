// Handle Google Sign-In callback
function handleCredentialResponse(response) {
    const base64Url = response.credential.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    
    const userData = JSON.parse(jsonPayload);
    
    // Send to Google Apps Script backend
    const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbytVOTbt78wKn3TVjypTy4tkGiGUpetyXhw7VB6nJZmnMPsPWoW6xHMr71xNUCTvEq1/exec';
    
    fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify({
            action: 'register',
            name: userData.name,
            email: userData.email,
            password: 'google_oauth_' + userData.sub
        })
    })
    .then(res => res.json())
    .then(data => {
        if (data.status === 'success' || data.status === 'user_already_exists') {
            localStorage.setItem('webpotUserLoggedIn', 'true');
            localStorage.setItem('webpotUserEmail', userData.email);
            localStorage.setItem('webpotUserName', userData.name);
            if (userData.picture) localStorage.setItem('webpotUserProfilePic', userData.picture);
            
            showSuccessModal('Welcome!', `Welcome ${userData.name}!`);
            setTimeout(() => window.location.href = 'index.html', 2000);
        } else {
            alert('Google Sign-In failed: ' + data.message);
        }
    })
    .catch(err => console.error('Error:', err));
}

// Toggle between login and registration forms
function toggleForms(event) {
    if(event) event.preventDefault();
    const loginForm = document.querySelector('.login-form');
    const registerForm = document.querySelector('.register-form');
    
    loginForm.classList.toggle('active');
    registerForm.classList.toggle('active');
}

// Toggle password visibility
function togglePasswordVisibility(fieldId) {
    const field = document.getElementById(fieldId);
    const button = event.currentTarget;
    const isPassword = field.type === 'password';
    field.type = isPassword ? 'text' : 'password';
    button.textContent = isPassword ? '👁️‍🗨️' : '👁️';
}

// Handle LOGIN
function handleLogin(event) {
    event.preventDefault();
    
    const emailOrPhone = document.getElementById('login-email-or-phone').value.trim();
    const password = document.getElementById('login-password').value;
    
    if (!emailOrPhone || !password) {
        alert('Please fill in all fields');
        return;
    }
    
    // Show loading state
    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Logging in...';
    submitBtn.disabled = true;
    
    const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbytVOTbt78wKn3TVjypTy4tkGiGUpetyXhw7VB6nJZmnMPsPWoW6xHMr71xNUCTvEq1/exec';
    
    fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify({
            action: 'login',
            loginInput: emailOrPhone,
            password: password
        })
    })
    .then(res => res.json())
    .then(data => {
        if (data.status === 'otp_required') {
            document.getElementById('loginForm').style.display = 'none';
            openOTPModal(data.email);
        } else if (data.status === 'success') {
            localStorage.setItem('webpotUserLoggedIn', 'true');
            localStorage.setItem('webpotUserEmail', data.user.email);
            localStorage.setItem('webpotUserName', data.user.name);
            
            showSuccessModal('Welcome Back!', `Welcome, ${data.user.name}!`);
            setTimeout(() => window.location.href = 'index.html', 2000);
        } else if (data.status === 'user_banned') {
            alert('This account has been banned. Please contact support.');
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        } else if (data.status === 'user_not_found') {
            alert('User not found. Please create an account.');
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        } else {
            alert(data.message);
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    })
    .catch(err => {
        console.error('Error:', err);
        alert('Network error. Please try again.');
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    });
}

// Handle REGISTRATION
function handleRegister(event) {
    event.preventDefault();
    
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value.trim();
    const phone = document.getElementById('register-phone').value.trim();
    const password = document.getElementById('register-password').value;
    const confirm = document.getElementById('register-confirm').value;
    const referralCode = document.getElementById('register-referral').value.trim();
    
    if (password !== confirm) {
        alert('Passwords do not match!');
        return;
    }
    
    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Creating account...';
    submitBtn.disabled = true;
    
    const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbytVOTbt78wKn3TVjypTy4tkGiGUpetyXhw7VB6nJZmnMPsPWoW6xHMr71xNUCTvEq1/exec';
    
    fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify({
            action: 'register',
            name: name,
            email: email,
            phone: phone,
            password: password,
            referralCode: referralCode
        })
    })
    .then(res => res.json())
    .then(data => {
        if (data.status === 'success') {
            localStorage.setItem('webpotUserLoggedIn', 'true');
            localStorage.setItem('webpotUserEmail', email);
            localStorage.setItem('webpotUserName', name);
            
            showSuccessModal('Account Created!', 'Redirecting...');
            setTimeout(() => window.location.href = 'index.html', 2000);
            
        } else if (data.status === 'user_already_exists') {
            alert('This email is already registered. Please log in.');
            toggleForms(); 
            document.getElementById('login-email-or-phone').value = email;
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        } else {
            alert('Error: ' + data.message);
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    })
    .catch(err => {
        console.error('Error:', err);
        alert('Registration failed due to network error.');
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    });
}

// Modal Helpers
function showSuccessModal(title, message) {
    const modal = document.getElementById('successModal');
    if(modal) {
        document.getElementById('successTitle').textContent = title;
        document.getElementById('successMessage').textContent = message;
        modal.classList.add('show');
    }
}

function closeSuccess() {
    const modal = document.getElementById('successModal');
    if(modal) modal.classList.remove('show');
}

// --- FORCED READ LOGIC ---
let termsScrolled = false;
let privacyScrolled = false;

document.addEventListener('DOMContentLoaded', () => {
    loadLegalContent();
    setupScrollListeners();
});

// Load external HTML content into modals
function loadLegalContent() {
    // Load Terms
    fetch('terms.html')
        .then(res => res.text())
        .then(html => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            // Try to get container, fallback to body
            const content = doc.querySelector('.terms-container') || doc.body;
            document.getElementById('termsBody').innerHTML = content.innerHTML;
        })
        .catch(e => console.error('Error loading terms:', e));

    // Load Privacy
    fetch('privacy.html')
        .then(res => res.text())
        .then(html => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const content = doc.querySelector('.privacy-container') || doc.body;
            document.getElementById('privacyBody').innerHTML = content.innerHTML;
        })
        .catch(e => console.error('Error loading privacy:', e));
}

// Handle Checkbox Click
function handleTermsClick(event) {
    const checkbox = event.target;

    // If already checked via the flow, allow unchecking (optional) or do nothing
    if (checkbox.checked && !privacyScrolled) {
        event.preventDefault(); // Stop it from checking immediately
        checkbox.checked = false;
        
        // Start the Flow
        document.getElementById('termsModal').style.display = 'flex';
        // Reset scroll positions
        document.getElementById('termsBody').scrollTop = 0;
        document.getElementById('privacyBody').scrollTop = 0;
    }
}

// Setup Scroll Detection
function setupScrollListeners() {
    const termsBody = document.getElementById('termsBody');
    const privacyBody = document.getElementById('privacyBody');

    // Terms Scroll Listener
    termsBody.addEventListener('scroll', function() {
        // Check if scrolled to bottom (allow 10px buffer)
        if (this.scrollTop + this.clientHeight >= this.scrollHeight - 10) {
            if (!termsScrolled) {
                termsScrolled = true;
                // Small delay for UX, then switch to Privacy
                setTimeout(() => {
                    closeTermsModal();
                    openPrivacyModal();
                }, 500);
            }
        }
    });

    // Privacy Scroll Listener
    privacyBody.addEventListener('scroll', function() {
        if (this.scrollTop + this.clientHeight >= this.scrollHeight - 10) {
            if (!privacyScrolled) {
                privacyScrolled = true;
                setTimeout(() => {
                    closePrivacyModal();
                    // Auto Tick the Checkbox
                    const checkbox = document.getElementById('termsCheckbox');
                    checkbox.checked = true;
                    // Visual feedback
                    checkbox.parentElement.style.color = '#00d4ff'; 
                    checkbox.parentElement.classList.add('verified');
                }, 500);
            }
        }
    });
}

// Helper to open Privacy specifically for the flow
function openPrivacyModal() {
    document.getElementById('privacyModal').style.display = 'flex';
}

// Standard Close functions (ensure these exist or match your existing ones)
function closeTermsModal() {
    document.getElementById('termsModal').style.display = 'none';
}

function closePrivacyModal() {
    document.getElementById('privacyModal').style.display = 'none';
}

// ============== FEATURE 1: FORGOT PASSWORD ==============

function openForgotPasswordModal(event) {
    event.preventDefault();
    const modal = document.getElementById('forgotPasswordModal');
    modal.classList.add('active');
    document.getElementById('resetStep1').classList.add('active');
    document.getElementById('resetStep2').classList.remove('active');
}

function closeForgotPasswordModal() {
    const modal = document.getElementById('forgotPasswordModal');
    modal.classList.remove('active');
    document.getElementById('reset-email').value = '';
    document.getElementById('reset-code').value = '';
    document.getElementById('reset-password').value = '';
    document.getElementById('reset-confirm').value = '';
}

function submitResetEmail(event) {
    event.preventDefault();
    const email = document.getElementById('reset-email').value.trim();

    if (!email) {
        alert('Please enter your email');
        return;
    }

    const btn = event.target.querySelector('button[type="submit"]');
    const originalText = btn.textContent;
    btn.textContent = 'Sending...';
    btn.disabled = true;

    const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbytVOTbt78wKn3TVjypTy4tkGiGUpetyXhw7VB6nJZmnMPsPWoW6xHMr71xNUCTvEq1/exec';

    fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify({
            action: 'request_reset',
            email: email
        })
    })
    .then(res => res.json())
    .then(data => {
        if (data.status === 'success') {
            document.getElementById('resetStep1').classList.remove('active');
            document.getElementById('resetStep2').classList.add('active');
            alert('Code sent to your email!');
        } else {
            alert('Error: ' + data.message);
            btn.textContent = originalText;
            btn.disabled = false;
        }
    })
    .catch(err => {
        console.error('Error:', err);
        alert('Network error. Please try again.');
        btn.textContent = originalText;
        btn.disabled = false;
    });
}

function submitResetPassword(event) {
    event.preventDefault();
    const email = document.getElementById('reset-email').value.trim();
    const code = document.getElementById('reset-code').value.trim();
    const newPass = document.getElementById('reset-password').value;
    const confirm = document.getElementById('reset-confirm').value;

    if (newPass !== confirm) {
        alert('Passwords do not match');
        return;
    }

    const btn = event.target.querySelector('button[type="submit"]');
    const originalText = btn.textContent;
    btn.textContent = 'Resetting...';
    btn.disabled = true;

    const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbytVOTbt78wKn3TVjypTy4tkGiGUpetyXhw7VB6nJZmnMPsPWoW6xHMr71xNUCTvEq1/exec';

    fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify({
            action: 'verify_reset',
            email: email,
            code: code,
            newPassword: newPass
        })
    })
    .then(res => res.json())
    .then(data => {
        if (data.status === 'success') {
            showSuccessModal('Password Reset!', 'Your password has been reset. Please log in.');
            setTimeout(() => {
                closeForgotPasswordModal();
                toggleForms();
                document.getElementById('login-email-or-phone').value = email;
            }, 1500);
        } else {
            alert('Error: ' + data.message);
            btn.textContent = originalText;
            btn.disabled = false;
        }
    })
    .catch(err => {
        console.error('Error:', err);
        alert('Network error. Please try again.');
        btn.textContent = originalText;
        btn.disabled = false;
    });
}

// ============== FEATURE 5: 2FA (EMAIL OTP) ==============

function openOTPModal(email) {
    window.pendingOTPEmail = email;
    const modal = document.getElementById('otpModal');
    modal.classList.add('active');
}

function closeOTPModal() {
    const modal = document.getElementById('otpModal');
    modal.classList.remove('active');
    document.getElementById('login-otp').value = '';
    window.pendingOTPEmail = null;
}

function goBackToLogin() {
    closeOTPModal();
    document.getElementById('loginForm').style.display = 'block';
}

function verifyOTP(event) {
    event.preventDefault();
    const otp = document.getElementById('login-otp').value.trim();
    const email = window.pendingOTPEmail;

    if (!otp || !email) {
        alert('Please enter the OTP');
        return;
    }

    const btn = event.target.querySelector('button[type="submit"]');
    const originalText = btn.textContent;
    btn.textContent = 'Verifying...';
    btn.disabled = true;

    const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbytVOTbt78wKn3TVjypTy4tkGiGUpetyXhw7VB6nJZmnMPsPWoW6xHMr71xNUCTvEq1/exec';

    fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify({
            action: 'verify_login_otp',
            email: email,
            otp: otp
        })
    })
    .then(res => res.json())
    .then(data => {
        if (data.status === 'success') {
            localStorage.setItem('webpotUserLoggedIn', 'true');
            localStorage.setItem('webpotUserEmail', data.user.email);
            localStorage.setItem('webpotUserName', data.user.name);

            showSuccessModal('Welcome!', `Welcome, ${data.user.name}!`);
            setTimeout(() => window.location.href = 'index.html', 2000);
        } else {
            alert('Error: ' + data.message);
            btn.textContent = originalText;
            btn.disabled = false;
        }
    })
    .catch(err => {
        console.error('Error:', err);
        alert('Network error. Please try again.');
        btn.textContent = originalText;
        btn.disabled = false;
    });
}

