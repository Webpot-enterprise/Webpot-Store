// Handle Google Sign-In callback
function handleCredentialResponse(response) {
    const base64Url = response.credential.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    
    const userData = JSON.parse(jsonPayload);
    
    // Send to Google Apps Script backend
    const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwygph08gPs4wdwagXyfT7hH1udQG8F_dny0BwjUbBMCWtkXlEVbNOzIqSJisPN8FSB/exec';
    
    fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify({
            action: 'register', // Updated to match new backend router
            name: userData.name,
            email: userData.email,
            password: 'google_oauth_' + userData.sub
        })
    })
    .then(res => res.json())
    .then(data => {
        // Allow login if success OR if user already exists
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
    const button = event.currentTarget; // Safer than event.target
    const isPassword = field.type === 'password';
    field.type = isPassword ? 'text' : 'password';
    button.textContent = isPassword ? '👁️‍🗨️' : '👁️';
}

// Handle LOGIN
function handleLogin(event) {
    event.preventDefault();
    
    const emailOrPhone = document.getElementById('login-email-or-phone').value.trim(); // Added trim()
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
    
    const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwygph08gPs4wdwagXyfT7hH1udQG8F_dny0BwjUbBMCWtkXlEVbNOzIqSJisPN8FSB/exec';
    
    fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify({
            action: 'login', // Matches backend router
            email: emailOrPhone, // CRITICAL FIX: Sending as 'email' so backend finds it
            password: password
        })
    })
    .then(res => res.json())
    .then(data => {
        if (data.status === 'success') {
            // Success
            localStorage.setItem('webpotUserLoggedIn', 'true');
            localStorage.setItem('webpotUserEmail', data.user.email);
            localStorage.setItem('webpotUserName', data.user.name);
            
            showSuccessModal('Welcome Back!', `Welcome, ${data.user.name}!`);
            setTimeout(() => window.location.href = 'index.html', 2000);
            
        } else if (data.status === 'user_not_found') {
            alert('User not found. Please create an account.');
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        } else {
            alert('Login failed: ' + data.message);
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
    const password = document.getElementById('register-password').value;
    const confirm = document.getElementById('register-confirm').value;
    
    if (password !== confirm) {
        alert('Passwords do not match!');
        return;
    }
    
    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Creating account...';
    submitBtn.disabled = true;
    
    const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwygph08gPs4wdwagXyfT7hH1udQG8F_dny0BwjUbBMCWtkXlEVbNOzIqSJisPN8FSB/exec';
    
    fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify({
            action: 'register',
            name: name,
            email: email,
            password: password
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
            // Auto switch to login tab
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

