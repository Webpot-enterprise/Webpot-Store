// dashboard-webpot/user_dashboard/js/script.js - Dashboard initialization and data loading

// ============================================
// SESSION EXPIRY TRACKER
// ============================================

/**
 * Get token expiry from stored token data
 * Tokens are created with 24-hour expiry from backend
 */
function getTokenExpiry() {
  const token = getAuthToken();
  if (!token) return null;
  
  // Try to get from stored user data (if backend returns it)
  const userData = getUserData();
  if (userData && userData.token_expires_at) {
    return new Date(userData.token_expires_at);
  }
  
  // Fallback: assume 24-hour expiry from login time
  // This is estimated based on typical token lifecycle
  const loginTime = localStorage.getItem('webpot_login_time');
  if (loginTime) {
    const expiryTime = new Date(parseInt(loginTime) + 24 * 60 * 60 * 1000);
    return expiryTime;
  }
  
  return null;
}

/**
 * Format time remaining in human-readable format
 * Returns string like "24h 30m" or "5m"
 */
function formatTimeRemaining(expiryDate) {
  const now = new Date();
  const diff = expiryDate - now;
  
  if (diff <= 0) {
    return 'expired';
  }
  
  const totalMinutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

/**
 * Update session expiry indicator in navbar
 */
function updateSessionExpiryIndicator() {
  const indicator = document.getElementById('sessionExpiryIndicator');
  const expiryText = document.getElementById('sessionExpiryText');
  
  if (!indicator || !expiryText) return;
  
  const expiry = getTokenExpiry();
  if (!expiry) {
    indicator.style.display = 'none';
    return;
  }
  
  const remaining = formatTimeRemaining(expiry);
  if (remaining === 'expired') {
    clearAuthToken();
    clearUserData();
    window.location.href = '../../auth.html';
    return;
  }
  
  // Display indicator
  indicator.style.display = 'block';
  expiryText.textContent = `Session expires in ${remaining}`;
  
  // Warning state when less than 10 minutes remaining
  const totalMinutes = Math.floor((expiry - new Date()) / (1000 * 60));
  if (totalMinutes < 10) {
    indicator.classList.add('warning');
  } else {
    indicator.classList.remove('warning');
  }
}

/**
 * Start session expiry tracking (updates every minute)
 */
function startSessionExpiryTracking() {
  // Update immediately
  updateSessionExpiryIndicator();
  
  // Update every minute
  setInterval(updateSessionExpiryIndicator, 60000);
}

// ============================================
// DASHBOARD DATA LOADING
// ============================================
async function loadDashboardData() {
  if (!requireDashboardAuth()) return;
  
  const user = getCurrentUser();
  if (!user || !user.user_id) {
    window.location.href = '../../index.html';
    return;
  }
  
  // Update profile
  updateProfileSection(user);
  
  // Load orders
  showLoading('ordersContainer');
  const orders = await fetchUserOrders(user.user_id);
  updateStatsCards(orders);
  renderOrders(orders);
  
  // Load sessions
  showLoading('sessionsContainer');
  const sessions = await fetchUserSessions(user.user_id);
  renderSessions(sessions);
  
  // Load activity log
  showLoading('activityLog');
  const logs = await fetchActivityLogs(user.user_id);
  renderActivityLog(logs);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
  // Inject shared config and api files if not already loaded
  if (typeof API_CONFIG === 'undefined') {
    const script = document.createElement('script');
    script.src = '../../js/config.js';
    document.head.appendChild(script);
  }
  
  if (typeof apiCall === 'undefined') {
    const script = document.createElement('script');
    script.src = '../../js/api.js';
    document.head.appendChild(script);
  }
  
  // Small delay to allow config to load
  setTimeout(() => {
    loadDashboardData();
    startSessionExpiryTracking();
  }, 500);
});

// Logout from dashboard
document.addEventListener('DOMContentLoaded', function() {
  const logoutBtn = document.querySelector('.logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', logoutUserFromDashboard);
  }
});
