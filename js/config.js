// Configuration for the Webpot application
// All API and authentication settings

const API_CONFIG = {
  // Cloudflare Worker Gateway URL
  CLOUDFLARE_WORKER: 'https://webpot-api.yourdomain.workers.dev',
  
  // Google Apps Script Web App URL (used for direct testing only)
  GAS_URL: 'https://script.google.com/macros/s/AKfycbxb5XesTNnxNySyUVuDBU6Vjyk2PBDia5pbyULneRBVYnGExxisZY7zXFBJ48nDekwe/exec',
  
  // Authentication token storage
  AUTH_TOKEN_KEY: 'webpot_auth_token',
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

// Redirect to login if not authenticated
function requireAuth() {
  if (!isAuthenticated()) {
    window.location.href = '/auth.html';
    return false;
  }
  return true;
}
