// dashboard-webpot/user_dashboard/js/auth.js - Authentication check for dashboard

// Redirect to login if not authenticated
function requireDashboardAuth() {
  if (!isAuthenticated()) {
    window.location.href = '../../auth.html';
    return false;
  }
  return true;
}

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
  window.location.href = '../../index.html';
}
