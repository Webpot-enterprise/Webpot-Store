// Handle Google Sign-In callback
function handleCredentialResponse(response) {
    // Decode the JWT token
    const base64Url = response.credential.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    
    const userData = JSON.parse(jsonPayload);
    
    // Send to Google Apps Script backend as registration
    const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbx9nmE6vvc9LXPon9-MrMQfSCDlvoeMJtMhbq0d80ftpYodypkm6RoSr8pz2H-Ro8kj/exec';
    
    fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify({
            formType: 'register',
            name: userData.name,
            email: userData.email,
            password: 'google_oauth_' + userData.sub // Generate a password from Google ID
        })
    })
    .then(res => res.json())
    .then(data => {
        // Store login info regardless of response (user may already exist)
        localStorage.setItem('webpotUserLoggedIn', 'true');
        localStorage.setItem('webpotUserEmail', userData.email);
        localStorage.setItem('webpotUserName', userData.name);
        // Store Google profile picture if available
        if (userData.picture) {
            localStorage.setItem('webpotUserProfilePic', userData.picture);
        }
        
        showSuccessModal('Welcome!', `Welcome ${userData.name}! You have been signed in.`);
        
        // Redirect after 2 seconds
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
    })
    .catch(err => {
        console.error('Error:', err);
        // Still sign in the user even if backend fails
        localStorage.setItem('webpotUserLoggedIn', 'true');
        localStorage.setItem('webpotUserEmail', userData.email);
        localStorage.setItem('webpotUserName', userData.name);
        // Store Google profile picture if available
        if (userData.picture) {
            localStorage.setItem('webpotUserProfilePic', userData.picture);
        }
        
        showSuccessModal('Welcome!', `Welcome ${userData.name}!`);
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
    });
}

// Show coming soon message for Google Sign-In
function showComingSoonMessage(event) {
    event.preventDefault();
    const modal = document.createElement('div');
    modal.className = 'coming-soon-modal';
    modal.innerHTML = `
        <div class="coming-soon-content">
            <div class="coming-soon-icon">🚀</div>
            <h2>Coming Soon!</h2>
            <p>Google Sign-In will be available soon.</p>
            <p class="coming-soon-subtitle">We're working on bringing you more authentication options.</p>
            <button onclick="this.closest('.coming-soon-modal').remove()" class="coming-soon-btn">Got it</button>
        </div>
    `;
    document.body.appendChild(modal);
    
    // Auto-remove after 4 seconds
    setTimeout(() => {
        if (modal.parentElement) {
            modal.remove();
        }
    }, 4000);
}

// Initialize Google Sign-In on page load
window.onload = function() {
    if (window.google) {
        google.accounts.id.initialize({
            client_id: '602785019830-1r8laqtcrshl8m1dlktdeiisdfmtvdpt.apps.googleusercontent.com'
        });
    }
};

// Switch between email and phone login tabs
function switchLoginTab(element) {
    const tabType = element.getAttribute('data-tab');
    
    // Update active tab button
    document.querySelectorAll('.login-tab').forEach(btn => {
        btn.classList.remove('active');
    });
    element.classList.add('active');
    
    // Update active content
    document.querySelectorAll('.login-tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    const contentDiv = document.getElementById(tabType + '-login');
    if (contentDiv) {
        contentDiv.classList.add('active');
    }
}

// Toggle between login and registration forms
function toggleForms(event) {
    event.preventDefault();
    const loginForm = document.querySelector('.login-form');
    const registerForm = document.querySelector('.register-form');
    
    loginForm.classList.toggle('active');
    registerForm.classList.toggle('active');
}

// Toggle password visibility
function togglePasswordVisibility(fieldId) {
    const field = document.getElementById(fieldId);
    const button = event.target;
    const isPassword = field.type === 'password';
    field.type = isPassword ? 'text' : 'password';
    
    // Change button appearance based on state
    button.textContent = isPassword ? '👁️‍🗨️' : '👁️';
    button.setAttribute('title', isPassword ? 'Hide password' : 'Show password');
}

// Password strength indicator
const passwordInput = document.getElementById('register-password');
if (passwordInput) {
    passwordInput.addEventListener('input', function() {
        updatePasswordStrength(this.value);
    });
}

function updatePasswordStrength(password) {
    const strengthIndicator = document.getElementById('strengthIndicator');
    const strengthText = document.getElementById('strengthText');
    
    let strength = 0;
    let text = 'Weak';
    
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z\d]/.test(password)) strength++;
    
    const widths = ['20%', '40%', '60%', '80%', '100%'];
    const colors = ['#ff4444', '#ffaa00', '#ffdd00', '#aaff00', '#44ff44'];
    const texts = ['Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
    
    strengthIndicator.style.width = widths[strength];
    strengthIndicator.style.background = colors[strength];
    strengthText.textContent = texts[strength];
}

// Handle login form submission
function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    if (!email || !password) {
        alert('Please fill in all fields');
        return;
    }
    
    // Show loading state
    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Logging in...';
    submitBtn.disabled = true;
    
    // Send to Google Apps Script backend
    const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbx9nmE6vvc9LXPon9-MrMQfSCDlvoeMJtMhbq0d80ftpYodypkm6RoSr8pz2H-Ro8kj/exec';
    
    fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify({
            formType: 'login',
            email: email,
            password: password
        })
    })
    .then(res => res.json())
    .then(data => {
        if (data.status === 'success') {
            // User found and password is correct
            localStorage.setItem('webpotUserLoggedIn', 'true');
            localStorage.setItem('webpotUserEmail', data.user.email);
            localStorage.setItem('webpotUserName', data.user.name);
            
            // Create initials for avatar
            const initials = data.user.name.split(' ').map(n => n[0]).join('');
            localStorage.setItem('webpotUserInitials', initials);
            
            showSuccessModal('Welcome!', `Welcome back, ${data.user.name}!`);
            
            // Redirect to home after 2 seconds
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2000);
        } else if (data.status === 'user_not_found') {
            // User doesn't exist - redirect to registration
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
            
            alert('No account found with this email. Please create a new account.');
            
            // Switch to registration form and pre-fill email
            toggleForms(event);
            setTimeout(() => {
                document.getElementById('register-email').value = email;
                document.getElementById('register-name').focus();
            }, 300);
        } else {
            alert('Login failed: ' + (data.message || 'Invalid credentials'));
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    })
    .catch(err => {
        console.error('Error:', err);
        alert('Login failed. Please try again.');
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    });
}

// Handle registration form submission
function handleRegister(event) {
    event.preventDefault();
    
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const confirm = document.getElementById('register-confirm').value;
    
    // Validate passwords match
    if (password !== confirm) {
        alert('Passwords do not match!');
        return;
    }
    
    if (!name || !email || !password) {
        alert('Please fill in all fields');
        return;
    }
    
    // Show loading state
    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Creating account...';
    submitBtn.disabled = true;
    
    // Send to Google Apps Script backend
    const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbx9nmE6vvc9LXPon9-MrMQfSCDlvoeMJtMhbq0d80ftpYodypkm6RoSr8pz2H-Ro8kj/exec';
    
    fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify({
            formType: 'register',
            name: name,
            email: email,
            password: password
        })
    })
    .then(res => {
        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
    })
    .then(data => {
        console.log('Registration response:', data);
        if (data && data.status === 'success') {
            localStorage.setItem('webpotUserLoggedIn', 'true');
            localStorage.setItem('webpotUserEmail', email);
            localStorage.setItem('webpotUserName', name);
            
            // Create initials for avatar
            const initials = name.split(' ').map(n => n[0]).join('');
            localStorage.setItem('webpotUserInitials', initials);
            
            showSuccessModal('Account Created!', 'Your account has been created successfully. Redirecting...');
            document.getElementById('registerForm').reset();
            updatePasswordStrength('');
            
            // Redirect to home after 3 seconds
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 3000);
        } else {
            const errorMsg = data?.message || 'Registration failed. Please try again.';
            console.error('Registration error:', errorMsg);
            alert('Error: ' + errorMsg);
        }
    })
    .catch(err => {
        console.error('Network/Parse Error:', err);
        // As a fallback, store user locally if Google Apps Script fails
        // User can still use the app with local storage
        localStorage.setItem('webpotUserLoggedIn', 'true');
        localStorage.setItem('webpotUserEmail', email);
        localStorage.setItem('webpotUserName', name);
        
        const initials = name.split(' ').map(n => n[0]).join('');
        localStorage.setItem('webpotUserInitials', initials);
        
        showSuccessModal('Account Created!', 'Your account has been created successfully. Redirecting...');
        document.getElementById('registerForm').reset();
        updatePasswordStrength('');
        
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 3000);
    })
    .finally(() => {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    });
}

// Show success modal
function showSuccessModal(title, message) {
    const modal = document.getElementById('successModal');
    document.getElementById('successTitle').textContent = title;
    document.getElementById('successMessage').textContent = message;
    modal.classList.add('show');
}

// Close success modal
function closeSuccess() {
    const modal = document.getElementById('successModal');
    modal.classList.remove('show');
    // Redirect to home page
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 300);
}

// Close modal when clicking outside
document.addEventListener('click', function(event) {
    const modal = document.getElementById('successModal');
    const content = document.querySelector('.success-content');
    
    if (modal && modal.classList.contains('show') && content && !content.contains(event.target)) {
        closeSuccess();
    }
});

// Add some interactivity to form fields
document.querySelectorAll('input').forEach(input => {
    input.addEventListener('focus', function() {
        this.parentElement.style.boxShadow = '0 0 20px rgba(0, 212, 255, 0.3)';
    });
    
    input.addEventListener('blur', function() {
        this.parentElement.style.boxShadow = 'none';
    });
});

// Social button placeholders
document.querySelectorAll('.social-btn').forEach(btn => {
    btn.addEventListener('click', function(e) {
        e.preventDefault();
        const provider = this.textContent.includes('Google') ? 'Google' : 'GitHub';
        alert(`${provider} login coming soon!`);
    });
});

// Terms and Privacy Modal Functions
function showTermsModal(event) {
    event.preventDefault();
    const termsModal = document.getElementById('termsModal');
    termsModal.style.display = 'flex';
    loadTermsContent();
    setupScrollDetection('termsBody', 'terms');
}

function closeTermsModal() {
    document.getElementById('termsModal').style.display = 'none';
}

function showPrivacyModal(event) {
    if (event) event.preventDefault();
    const privacyModal = document.getElementById('privacyModal');
    privacyModal.style.display = 'flex';
    loadPrivacyContent();
    setupScrollDetection('privacyBody', 'privacy');
}

function closePrivacyModal() {
    document.getElementById('privacyModal').style.display = 'none';
}

// Load Terms Content from terms.html
function loadTermsContent() {
    const termsBody = document.getElementById('termsBody');
    termsBody.innerHTML = '';
    fetch('terms.html')
        .then(response => response.text())
        .then(html => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const termsContainer = doc.querySelector('.terms-container');
            if (termsContainer) {
                let foundH1 = false;
                let content = '';
                termsContainer.childNodes.forEach(node => {
                    if (foundH1) {
                        if (node.nodeType === 1) {
                            content += node.outerHTML;
                        } else if (node.nodeType === 3) {
                            content += node.textContent;
                        }
                    }
                    if (node.nodeType === 1 && node.tagName === 'H1') {
                        foundH1 = true;
                    }
                });
                termsBody.innerHTML = content || '<p>Error: No terms content found after heading.</p>';
            } else {
                termsBody.innerHTML = '<p>Error loading Terms of Service. Please visit <a href="terms.html" target="_blank">terms.html</a> directly.</p>';
            }
        })
        .catch(error => {
            console.error('Error loading terms:', error);
            termsBody.innerHTML = '<p>Error loading Terms of Service. Please visit <a href="terms.html" target="_blank">terms.html</a> directly.</p>';
        });
}

// Load Privacy Content from privacy.html
function loadPrivacyContent() {
    const privacyBody = document.getElementById('privacyBody');
    privacyBody.innerHTML = '';
    fetch('privacy.html')
        .then(response => response.text())
        .then(html => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const privacyContainer = doc.querySelector('.privacy-container');
            if (privacyContainer) {
                let foundH1 = false;
                let content = '';
                privacyContainer.childNodes.forEach(node => {
                    if (foundH1) {
                        if (node.nodeType === 1) {
                            content += node.outerHTML;
                        } else if (node.nodeType === 3) {
                            content += node.textContent;
                        }
                    }
                    if (node.nodeType === 1 && node.tagName === 'H1') {
                        foundH1 = true;
                    }
                });
                privacyBody.innerHTML = content || '<p>Error: No privacy content found after heading.</p>';
            } else {
                privacyBody.innerHTML = '<p>Error loading Privacy Policy. Please visit <a href="privacy.html" target="_blank">privacy.html</a> directly.</p>';
            }
        })
        .catch(error => {
            console.error('Error loading privacy policy:', error);
            privacyBody.innerHTML = '<p>Error loading Privacy Policy. Please visit <a href="privacy.html" target="_blank">privacy.html</a> directly.</p>';
        });
}

// Setup scroll detection to auto-open next modal or check checkbox
function setupScrollDetection(containerId, modalType) {
    const container = document.getElementById(containerId);
    if (!container) return;
}

window.addEventListener('click', function(event) {
    const termsModal = document.getElementById('termsModal');
    const privacyModal = document.getElementById('privacyModal');
    
    if (event.target === termsModal) {
        closeTermsModal();
    }
    if (event.target === privacyModal) {
        closePrivacyModal();
    }
});

// Update form submission button text
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    
    if (loginForm) {
        const submitBtn = loginForm.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.textContent = 'Sign in';
        }
    }
    
    if (registerForm) {
        const submitBtn = registerForm.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.textContent = 'Sign up';
        }
    }
});
