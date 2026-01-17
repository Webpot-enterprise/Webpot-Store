// Configuration for the Webpot application
// DEPRECATED: Core config moved to js/api.js
// This file provides backwards-compatible helper functions

// Note: API_CONFIG must be loaded from api.js before these functions are called
// Hardcoded storage keys for backwards compatibility

// Legacy storage keys (must match api.js)
const AUTH_TOKEN_STORAGE_KEY = 'webpot_auth_token';
const USER_DATA_STORAGE_KEY = 'webpot_user_data';

// Helper function to get stored auth token
function getAuthToken() {
  return localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
}

// Helper function to save auth token
function setAuthToken(token) {
  localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
}

// Helper function to remove auth token
function clearAuthToken() {
  localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
}

// Helper function to get user data
function getUserData() {
  const data = localStorage.getItem(USER_DATA_STORAGE_KEY);
  return data ? JSON.parse(data) : null;
}

// Helper function to save user data
function setUserData(userData) {
  localStorage.setItem(USER_DATA_STORAGE_KEY, JSON.stringify(userData));
}

// Helper function to clear user data
function clearUserData() {
  localStorage.removeItem(USER_DATA_STORAGE_KEY);
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
