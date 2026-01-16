// js/auth.js - Handles authentication logic for login/register/Google

// Register user
async function registerUser(name, email, password) {
  try {
    const res = await apiCall('/users', {
      method: 'POST',
      action: API_CONFIG.ACTIONS.REGISTER,
      body: { name, email, password }
    });
    if (res.success && res.data.token && res.data.user) {
      handleAuthSuccess(res.data.token, res.data.user);
    } else {
      showErrorMessage(res.data?.error || 'Registration failed');
    }
  } catch (e) {
    showErrorMessage('Registration error');
  }
}

// Login user
async function loginUser(email, password) {
  try {
    const res = await apiCall('/users', {
      method: 'POST',
      action: API_CONFIG.ACTIONS.LOGIN,
      body: { email, password }
    });
    if (res.success && res.data.token && res.data.user) {
      handleAuthSuccess(res.data.token, res.data.user);
    } else {
      showErrorMessage(res.data?.error || 'Login failed');
    }
  } catch (e) {
    showErrorMessage('Login error');
  }
}

// Google OAuth login
async function loginWithGoogle(googleIdToken) {
  try {
    const res = await apiCall('/users', {
      method: 'POST',
      action: API_CONFIG.ACTIONS.GOOGLE_LOGIN,
      body: { idToken: googleIdToken }
    });
    if (res.success && res.data.token && res.data.user) {
      handleAuthSuccess(res.data.token, res.data.user);
    } else {
      showErrorMessage(res.data?.error || 'Google login failed');
    }
  } catch (e) {
    showErrorMessage('Google login error');
  }
}

// Handle successful authentication
function handleAuthSuccess(token, user) {
  setAuthToken(token);
  setUserData(user);
  showSuccessMessage('Login successful! Redirecting...');
  setTimeout(() => {
    window.location.href = 'index.html';
  }, 1000);
}

// Google Sign-In callback
window.onGoogleSignIn = function(response) {
  if (response.credential) {
    loginWithGoogle(response.credential);
  } else {
    showErrorMessage('Google sign-in failed');
  }
};

// Form event listeners
if (document.getElementById('loginForm')) {
  document.getElementById('loginForm').onsubmit = function(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    loginUser(email, password);
  };
}
if (document.getElementById('registerForm')) {
  document.getElementById('registerForm').onsubmit = function(e) {
    e.preventDefault();
    const name = document.getElementById('registerName').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value;
    registerUser(name, email, password);
  };
}
