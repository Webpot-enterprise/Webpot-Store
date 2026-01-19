// dashboard-webpot/user_dashboard/js/script.js - Dashboard initialization and data loading

// ============================================
// AUTH GUARD - PREVENT UNAUTHENTICATED ACCESS
// ============================================

/**
 * Check if user is authenticated
 * Redirect to login if not
 */
function requireDashboardAuth() {
  // Wait for auth helpers to be available
  if (typeof isAuthenticated !== 'function') {
    console.error('Auth helpers not loaded yet');
    return false;
  }
  
  // Check if user has valid token
  if (!isAuthenticated()) {
    console.warn('User is not authenticated. Redirecting to login...');
    clearAuthToken();
    clearUserData();
    window.location.href = '../../auth.html';
    return false;
  }
  
  // User is authenticated
  return true;
}

/**
 * Guard dashboard initialization
 * Runs immediately on page load
 */
(function dashboardAuthGuard() {
  // Check if auth helpers are available
  if (typeof isAuthenticated === 'function' && typeof getAuthToken === 'function') {
    if (!isAuthenticated()) {
      window.location.href = '../../auth.html';
    }
  }
})();

// ============================================
// API CALL STATE MANAGEMENT
// ============================================

/**
 * Track API call states to prevent duplicate submissions
 * and manage button states during loading
 */
const apiStateManager = {
  pending: new Set(),
  
  /**
   * Mark an API action as pending
   * @param {string} actionKey - Unique key for the action
   */
  setPending(actionKey) {
    this.pending.add(actionKey);
    this.updateButtonStates();
  },
  
  /**
   * Mark an API action as complete
   * @param {string} actionKey - Unique key for the action
   */
  setComplete(actionKey) {
    this.pending.delete(actionKey);
    this.updateButtonStates();
  },
  
  /**
   * Check if an action is pending
   * @param {string} actionKey - Unique key for the action
   * @returns {boolean} True if pending
   */
  isPending(actionKey) {
    return this.pending.has(actionKey);
  },
  
  /**
   * Check if any actions are pending
   * @returns {boolean} True if any actions are pending
   */
  hasAnyPending() {
    return this.pending.size > 0;
  },
  
  /**
   * Update button states based on pending actions
   */
  updateButtonStates() {
    const allButtons = document.querySelectorAll('button[data-api-action]');
    allButtons.forEach(btn => {
      const action = btn.getAttribute('data-api-action');
      if (this.pending.has(action)) {
        btn.disabled = true;
        btn.setAttribute('data-loading-text', btn.textContent);
        btn.textContent = 'Processing...';
      } else {
        btn.disabled = false;
        const originalText = btn.getAttribute('data-loading-text');
        if (originalText) {
          btn.textContent = originalText;
          btn.removeAttribute('data-loading-text');
        }
      }
    });
  },
  
  /**
   * Reset all pending states
   */
  reset() {
    this.pending.clear();
    this.updateButtonStates();
  }
};

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
  // Verify auth helpers are available
  if (typeof isAuthenticated !== 'function' || typeof getAuthToken !== 'function') {
    console.error('Auth helpers not available. Please ensure scripts are loaded in correct order.');
    setTimeout(() => {
      window.location.href = '../../auth.html';
    }, 1000);
    return;
  }
  
  // Load dashboard data and start tracking
  loadDashboardData();
  startSessionExpiryTracking();
});

// Logout from dashboard
document.addEventListener('DOMContentLoaded', function() {
  const logoutBtn = document.querySelector('.logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', logoutUserFromDashboard);
  }
});
