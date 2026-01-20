// dashboard-webpot/user_dashboard/js/auth.js - Dashboard-specific auth utilities
// Note: requireDashboardAuth() is defined in script.js as the single source of truth

// Get current user data
function getCurrentUser() {
  return getUserData();
}

// Get current user ID
function getCurrentUserId() {
  const user = getUserData();
  return user ? user.user_id : null;
}

// Logout user
function logoutUserFromDashboard() {
  clearAuthToken();
  clearUserData();
  // Redirect to root-level homepage, not dashboard-relative path
  window.location.href = '/index.html';
}