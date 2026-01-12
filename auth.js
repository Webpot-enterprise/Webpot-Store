// ========== AUTHENTICATION STATE MANAGEMENT ==========

let currentTab = 'login';
let isLoading = false;

// Initialize auth page on load
document.addEventListener('DOMContentLoaded', function() {
    initializeAuthPage();
});

function initializeAuthPage() {
    // Set up Google Identity Services with client ID from config
    if (WEBPOT_CONFIG.OAUTH_CLIENT_ID) {
        const gIdOnload = document.getElementById('g_id_onload');
        if (gIdOnload) {
            gIdOnload.setAttribute('data-client_id', WEBPOT_CONFIG.OAUTH_CLIENT_ID);
        }
        
        // Initialize Google Accounts library
        if (window.google && window.google.accounts) {
            window.google.accounts.id.initialize({
                client_id: WEBPOT_CONFIG.OAUTH_CLIENT_ID,
                callback: handleGoogleResponse,
                auto_select: false
            });
        }
    }

    // Add form submit listeners
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }

    // Set initial active tab
    switchTab('login');
}

// ========== TAB SWITCHING ==========

function switchTab(tabName) {
    currentTab = tabName;
    
    // Update tab buttons
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-tab') === tabName) {
            btn.classList.add('active');
        }
    });

    // Update form visibility
    const forms = document.querySelectorAll('.auth-form');
    forms.forEach(form => {
        form.classList.remove('active');
    });

    if (tabName === 'login') {
        const loginForm = document.getElementById('loginForm');
        if (loginForm) loginForm.classList.add('active');
    } else if (tabName === 'register') {
        const registerForm = document.getElementById('registerForm');
        if (registerForm) registerForm.classList.add('active');
    }

    // Clear any existing alerts
    removeAllAlerts();
}

// ========== PASSWORD VISIBILITY TOGGLE ==========

function togglePasswordVisibility(inputId) {
    const input = document.getElementById(inputId);
    if (!input) return;

    const isPassword = input.type === 'password';
    input.type = isPassword ? 'text' : 'password';
    
    // Update button emoji
    const button = event.currentTarget;
    button.textContent = isPassword ? '👁️‍🗨️' : '👁️';
}

// ========== PASSWORD STRENGTH METER ==========

function updatePasswordStrength(password) {
    let strength = 0;
    let feedback = 'Weak';

    // Check length
    if (password.length >= 8) strength += 1;
    if (password.length >= 12) strength += 1;

    // Check for numbers
    if (/\d/.test(password)) strength += 1;

    // Check for uppercase
    if (/[A-Z]/.test(password)) strength += 1;

    // Check for special characters
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) strength += 1;

    // Determine strength level
    if (strength <= 1) {
        feedback = 'Weak';
    } else if (strength === 2 || strength === 3) {
        feedback = 'Medium';
    } else if (strength >= 4) {
        feedback = 'Strong';
    }

    // Update visual indicator
    const indicator = document.getElementById('strengthIndicator');
    const strengthText = document.getElementById('strengthText');

    if (indicator && strengthText) {
        const widthMap = { 'Weak': '33%', 'Medium': '66%', 'Strong': '100%' };
        const colorMap = {
            'Weak': 'linear-gradient(90deg, #ef4444, #f87171)',
            'Medium': 'linear-gradient(90deg, #f59e0b, #fbbf24)',
            'Strong': 'linear-gradient(90deg, #00d4ff, #b000ff)'
        };

        indicator.style.width = widthMap[feedback];
        indicator.style.background = colorMap[feedback];
        strengthText.textContent = feedback;
    }

    return { strength, feedback };
}

// ========== EMAIL/PASSWORD LOGIN ==========

async function handleLogin(event) {
    event.preventDefault();

    if (isLoading) return;

    const emailInput = document.getElementById('loginEmail');
    const passwordInput = document.getElementById('loginPassword');

    // Validate inputs
    if (!emailInput || !emailInput.value.trim()) {
        showAlert('Please enter your email address', 'error');
        return;
    }

    if (!passwordInput || !passwordInput.value) {
        showAlert('Please enter your password', 'error');
        return;
    }

    // Basic email validation
    if (!isValidEmail(emailInput.value)) {
        showAlert('Please enter a valid email address', 'error');
        return;
    }

    isLoading = true;
    setButtonLoading(true);

    try {
        // Send login request to backend
        const response = await fetch(WEBPOT_CONFIG.API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'login',
                email: emailInput.value.trim(),
                password: passwordInput.value
            })
        });

        const data = await response.json();

        if (data.status === 'success' && data.user) {
            // Save user data to localStorage
            localStorage.setItem('webpotUserLoggedIn', 'true');
            localStorage.setItem('webpotUserName', data.user.name || '');
            localStorage.setItem('webpotUserEmail', data.user.email || '');
            localStorage.setItem('webpotUserProfilePic', data.user.profilePic || '');

            // Redirect to home page
            showAlert('Login successful! Redirecting...', 'success');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);
        } else {
            showAlert(data.message || 'Login failed. Please try again.', 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        showAlert('Network error. Please check your connection and try again.', 'error');
    } finally {
        isLoading = false;
        setButtonLoading(false);
    }
}

// ========== EMAIL/PASSWORD REGISTRATION ==========

async function handleRegister(event) {
    event.preventDefault();

    if (isLoading) return;

    const nameInput = document.getElementById('registerName');
    const emailInput = document.getElementById('registerEmail');
    const passwordInput = document.getElementById('registerPassword');
    const confirmInput = document.getElementById('registerConfirm');

    // Validate inputs
    if (!nameInput || !nameInput.value.trim()) {
        showAlert('Please enter your full name', 'error');
        return;
    }

    if (!emailInput || !emailInput.value.trim()) {
        showAlert('Please enter your email address', 'error');
        return;
    }

    if (!isValidEmail(emailInput.value)) {
        showAlert('Please enter a valid email address', 'error');
        return;
    }

    if (!passwordInput || passwordInput.value.length < 6) {
        showAlert('Password must be at least 6 characters long', 'error');
        return;
    }

    if (passwordInput.value !== confirmInput.value) {
        showAlert('Passwords do not match', 'error');
        return;
    }

    // Check password strength
    const strengthResult = updatePasswordStrength(passwordInput.value);
    if (strengthResult.strength < 2) {
        showAlert('Password is too weak. Please use a stronger password.', 'error');
        return;
    }

    isLoading = true;
    setButtonLoading(true);

    try {
        // Send registration request to backend
        const response = await fetch(WEBPOT_CONFIG.API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'register',
                name: nameInput.value.trim(),
                email: emailInput.value.trim(),
                password: passwordInput.value
            })
        });

        const data = await response.json();

        if (data.status === 'success' && data.user) {
            // Save user data to localStorage
            localStorage.setItem('webpotUserLoggedIn', 'true');
            localStorage.setItem('webpotUserName', data.user.name || '');
            localStorage.setItem('webpotUserEmail', data.user.email || '');
            localStorage.setItem('webpotUserProfilePic', data.user.profilePic || '');

            // Redirect to home page
            showAlert('Account created successfully! Redirecting...', 'success');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);
        } else if (data.status === 'user_already_exists') {
            showAlert('This email is already registered. Please log in instead.', 'error');
            // Switch to login tab and pre-fill email
            switchTab('login');
            document.getElementById('loginEmail').value = emailInput.value;
        } else {
            showAlert(data.message || 'Registration failed. Please try again.', 'error');
        }
    } catch (error) {
        console.error('Registration error:', error);
        showAlert('Network error. Please check your connection and try again.', 'error');
    } finally {
        isLoading = false;
        setButtonLoading(false);
    }
}

// ========== GOOGLE LOGIN FLOW ==========

async function handleGoogleResponse(response) {
    if (!response.credential) {
        showAlert('Google login failed. Please try again.', 'error');
        return;
    }

    isLoading = true;
    setButtonLoading(true);

    try {
        // Decode JWT to extract user data
        const token = response.credential;
        const userData = decodeJWT(token);

        if (!userData || !userData.email) {
            showAlert('Failed to extract user information from Google.', 'error');
            return;
        }

        // Send to backend for verification and account creation/login
        const backendResponse = await fetch(WEBPOT_CONFIG.API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'google_login',
                name: userData.name || '',
                email: userData.email,
                profilePic: userData.picture || ''
            })
        });

        const backendData = await backendResponse.json();

        if (backendData.status === 'success' && backendData.user) {
            // Save user data to localStorage
            localStorage.setItem('webpotUserLoggedIn', 'true');
            localStorage.setItem('webpotUserName', backendData.user.name || userData.name || '');
            localStorage.setItem('webpotUserEmail', backendData.user.email || userData.email);
            localStorage.setItem('webpotUserProfilePic', backendData.user.profilePic || userData.picture || '');

            // Redirect to home page
            showAlert('Login successful! Redirecting...', 'success');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);
        } else {
            showAlert(backendData.message || 'Google login failed. Please try again.', 'error');
        }
    } catch (error) {
        console.error('Google login error:', error);
        showAlert('An error occurred during Google login. Please try again.', 'error');
    } finally {
        isLoading = false;
        setButtonLoading(false);
    }
}

// Trigger Google Sign-In when button is clicked
function triggerGoogleLogin() {
    if (window.google && window.google.accounts && window.google.accounts.id) {
        window.google.accounts.id.prompt();
    }
}

// Decode JWT without verification (Google handles verification)
function decodeJWT(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split('')
                .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
        );
        return JSON.parse(jsonPayload);
    } catch (error) {
        console.error('JWT decode error:', error);
        return null;
    }
}

// ========== FORGOT PASSWORD (PLACEHOLDER) ==========

function toggleForgotPassword(event) {
    event.preventDefault();
    showAlert('Password reset functionality will be implemented soon.', 'success');
    // TODO: Implement password reset flow
}

// ========== UTILITY FUNCTIONS ==========

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function setButtonLoading(loading) {
    const currentForm = document.querySelector('.auth-form.active');
    if (!currentForm) return;

    const submitBtn = currentForm.querySelector('.btn-submit');
    if (!submitBtn) return;

    if (loading) {
        submitBtn.classList.add('loading');
        submitBtn.disabled = true;
    } else {
        submitBtn.classList.remove('loading');
        submitBtn.disabled = false;
    }
}

// ========== ALERT SYSTEM ==========

function showAlert(message, type = 'error') {
    removeAllAlerts();

    const currentForm = document.querySelector('.auth-form.active');
    if (!currentForm) return;

    const alert = document.createElement('div');
    alert.className = `alert ${type}`;
    alert.textContent = message;
    alert.setAttribute('role', 'alert');

    // Insert at the beginning of the form
    currentForm.insertBefore(alert, currentForm.firstChild);

    // Auto-remove success alerts after 4 seconds
    if (type === 'success') {
        setTimeout(() => {
            alert.remove();
        }, 4000);
    }
}

function removeAllAlerts() {
    const alerts = document.querySelectorAll('.alert');
    alerts.forEach(alert => alert.remove());
}

// ========== KEYBOARD SHORTCUTS ==========

document.addEventListener('keydown', function(event) {
    // Switch tabs with keyboard
    if (event.ctrlKey || event.metaKey) {
        if (event.key === '1') {
            switchTab('login');
        } else if (event.key === '2') {
            switchTab('register');
        }
    }
});

// ========== FALLBACK FOR MISSING CONFIG ==========

if (typeof WEBPOT_CONFIG === 'undefined' || !WEBPOT_CONFIG.API_URL) {
    console.error('WEBPOT_CONFIG is not properly defined. Please check config.js');
    document.addEventListener('DOMContentLoaded', function() {
        showAlert('Configuration error. Please contact support.', 'error');
    });
}
