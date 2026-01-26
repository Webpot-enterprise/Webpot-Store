// Prevent duplicate initialization if config is already loaded
if (window.API_CONFIG) {
  // Config already initialized, skip
  (() => {})(); // No-op to avoid errors
} else {
  window.API_CONFIG = {
    // Cloudflare Worker Gateway URL (Primary endpoint)
    BASE_URL: 'https://api-gateway.engagewebpot.workers.dev',
    CLOUDFLARE_WORKER: 'https://api-gateway.engagewebpot.workers.dev',
    
    // Google Apps Script Web App URL (used for direct testing only)
    GAS_URL: 'https://script.google.com/macros/s/AKfycbxb5XesTNnxNySyUVuDBU6Vjyk2PBDia5pbyULneRBVYnGExxisZY7zXFBJ48nDekwe/exec',
    
    // Request timeout (milliseconds)
    TIMEOUT: 10000,
    
    // Debug logging
    DEBUG: false,
    
    // Authentication token storage
    AUTH_TOKEN_KEY: 'webpot_auth_token',
    AUTH_TOKEN_EXPIRY_KEY: 'webpot_auth_token_expiry',
    USER_DATA_KEY: 'webpot_user_data',
    
    // API Actions
    ACTIONS: {
      LOGIN: 'login',
      REGISTER: 'register',
      GOOGLE_LOGIN: 'googleLogin',
      VERIFY_TOKEN: 'verifyToken',
      GET_USER: 'getUser',
      UPDATE_USER: 'updateUser',
      SUBMIT_CONTACT: 'submitContact',
      SUBMIT_ORDER: 'submitOrder',
      GET_TESTIMONIALS: 'getTestimonials',
      VERIFY_PAYMENT: 'verifyPayment'
    },
    
    // Feature flags
    FEATURES: {
      ENABLE_UPI: true,
      ENABLE_NOTIFICATIONS: true,
      ENABLE_TESTIMONIALS: true
    }
  };

  // Helper function to get stored auth token
  function getAuthToken() {
    return localStorage.getItem(API_CONFIG.AUTH_TOKEN_KEY);
  }

  // Helper function to save auth token
  function setAuthToken(token) {
    localStorage.setItem(API_CONFIG.AUTH_TOKEN_KEY, token);
  }
}

// Helper function to remove auth token
function clearAuthToken() {
  localStorage.removeItem(API_CONFIG.AUTH_TOKEN_KEY);
}

// Helper function to get user data
function getUserData() {
  const data = localStorage.getItem(API_CONFIG.USER_DATA_KEY);
  return data ? JSON.parse(data) : null;
}

// Helper function to save user data
function setUserData(userData) {
  localStorage.setItem(API_CONFIG.USER_DATA_KEY, JSON.stringify(userData));
}

// Helper function to clear user data
function clearUserData() {
  localStorage.removeItem(API_CONFIG.USER_DATA_KEY);
}

// Check if user is authenticated
function isAuthenticated() {
  return getAuthToken() !== null;
}

// Get token expiry time (24 hours from now, or from storage if available)
function getTokenExpiry() {
  try {
    const expiryStr = localStorage.getItem(API_CONFIG.AUTH_TOKEN_EXPIRY_KEY);
    if (expiryStr) {
      const expiry = parseInt(expiryStr, 10);
      return isNaN(expiry) ? null : expiry;
    }
    return null;
  } catch (err) {
    return null;
  }
}

// Save token expiry time
function setTokenExpiry(expiryTime) {
  try {
    localStorage.setItem(
      API_CONFIG.AUTH_TOKEN_EXPIRY_KEY || 'webpot_auth_token_expiry',
      String(expiryTime)
    );
  } catch (err) {
    console.warn('Failed to save token expiry:', err);
  }
}

// Redirect to login if not authenticated
function requireAuth() {
  if (!isAuthenticated()) {
    window.location.href = '/auth.html';
    return false;
  }
  return true;
}
