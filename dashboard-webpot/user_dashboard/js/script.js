// dashboard-webpot/user_dashboard/js/script.js - Dashboard initialization and data loading

// ============================================
// PAGE DETECTION - ONLY RUN ON DASHBOARD PAGES
// ============================================

// Guard entire dashboard script - only execute if this is a dashboard page
const isDashboardPage = () => {
  const pathname = window.location.pathname;
  return pathname.includes('/dashboard') || pathname.includes('/user_dashboard');
};

// Exit early if not on a dashboard page
if (!isDashboardPage()) {
  console.log('Not on dashboard page, skipping dashboard initialization');
  // Prevent rest of script from executing
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {};
  }
  // In a browser, we need to prevent DOMContentLoaded handlers
  // This comment marks where dashboard code should have executed
}

// ============================================
// AUTH GUARD - PREVENT UNAUTHENTICATED ACCESS
// ============================================

/**
 * Check if user is authenticated
 * Redirect to login if not
 */
/**
 * Centralized auth guard for dashboard
 * Single source of truth for authentication checks
 * Waits for scripts to load before checking auth state
 */
function requireDashboardAuth() {
  // Check if auth helpers are available (scripts loaded)
  if (typeof isAuthenticated !== 'function' || typeof getAuthToken !== 'function') {
    console.warn('Auth helpers not yet available, waiting for scripts to load...');
    return false;
  }
  
  // Check if user has valid token
  if (!isAuthenticated()) {
    console.warn('User is not authenticated. Redirecting to login...');
    clearAuthToken();
    clearUserData();
    // Redirect to root-level auth page (not dashboard-relative path)
    window.location.href = '/auth.html';
    return false;
  }
  
  // User is authenticated
  return true;
}

// ============================================
// POPEYE: LIGHTWEIGHT GLOBAL STATE LAYER
// ============================================

/**
 * Centralized dashboard state - Single source of truth
 * Existing code continues to work independently
 * New Popeye features consume state incrementally
 */
window.DASHBOARD_STATE = {
  user: null,
  orders: [],
  stats: { totalOrders: 0, totalSpent: 0, pendingOrders: 0 },
  notifications: [],
  referrals: null,
  activity: [],
  session: { expiresAt: null },
  loading: { orders: false, notifications: false, activity: false },
  errors: { orders: null, notifications: null, activity: null }
};

/**
 * Safe state updater - merge partial updates
 * Triggers 'dashboard-state-changed' event for reactive UI
 */
function updateDashboardState(key, value) {
  const oldValue = window.DASHBOARD_STATE[key];
  if (typeof value === 'object' && value !== null && typeof oldValue === 'object') {
    window.DASHBOARD_STATE[key] = { ...oldValue, ...value };
  } else {
    window.DASHBOARD_STATE[key] = value;
  }
  document.dispatchEvent(new CustomEvent('dashboard-state-changed', {
    detail: { key, value: window.DASHBOARD_STATE[key] }
  }));
}

/**
 * Get state value safely
 */
function getDashboardState(key) {
  return window.DASHBOARD_STATE[key] || null;
}

/**
 * Calculate order statistics from orders array
 */
function calculateOrderStats(orders) {
  if (!orders || !orders.length) {
    return { totalOrders: 0, totalSpent: 0, pendingOrders: 0 };
  }
  const spent = orders.reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0);
  const pending = orders.filter(o => o.order_status === 'pending' || o.order_status === 'processing').length;
  return { totalOrders: orders.length, totalSpent: spent, pendingOrders: pending };
}

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
    // Redirect to root-level auth page on session expiry
    window.location.href = '/auth.html';
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
    // Redirect to homepage if user data is invalid
    window.location.href = '/index.html';
    return;
  }
  
  // POPEYE: Populate state with user data
  updateDashboardState('user', {
    id: user.user_id,
    name: user.full_name || user.name,
    email: user.email,
    avatar: user.profile_image
  });
  
  // Profile loading is supported by backend
  updateProfileSection(user);
  
  // ============================================
  // OPTIONAL DATA - Backend APIs not yet available
  // ============================================
  // These calls return stubs (empty arrays) because the backend
  // does not yet support read APIs for orders, sessions, and logs.
  // The frontend gracefully displays empty state messages.
  // TODO: Uncomment once backend implements these read APIs
  
  // Fetch orders (stub - always returns [])
  const orders = await fetchUserOrders(user.user_id);
  updateStatsCards(orders);
  renderOrders(orders);
  
  // POPEYE: Populate state and calculate stats
  updateDashboardState('orders', orders);
  const stats = calculateOrderStats(orders);
  updateDashboardState('stats', stats);
  
  // Fetch sessions (stub - always returns [])
  const sessions = await fetchUserSessions(user.user_id);
  renderSessions(sessions);
  
  // Fetch activity log (stub - always returns [])
  const logs = await fetchActivityLogs(user.user_id);
  renderActivityLog(logs);
  
  // POPEYE: Populate activity state
  updateDashboardState('activity', logs);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
  // Guard: Only run on dashboard pages
  if (!isDashboardPage()) {
    console.log('Skipping dashboard initialization - not on dashboard page');
    return;
  }
  
  // Verify auth - use centralized guard
  if (!requireDashboardAuth()) {
    console.warn('Dashboard auth check failed. Will retry when helpers are available.');
    // Retry after a brief delay to allow scripts to load
    setTimeout(() => {
      if (requireDashboardAuth()) {
        loadDashboardData();
        startSessionExpiryTracking();
        initializePopeyeFeatures();
      }
    }, 500);
    return;
  }
  
  // Load dashboard data and start tracking
  loadDashboardData();
  startSessionExpiryTracking();
  initializePopeyeFeatures();
});

/**
 * POPEYE: Initialize all Popeye feature enhancements
 * Safe fallback: Features degrade gracefully if data unavailable
 */
function initializePopeyeFeatures() {
  console.log('[Popeye] Initializing enhancements...');
  
  // Setup notification button and panel
  setupNotificationButton();
  
  // Initialize referral card
  initializeReferrals();
  
  // Listen to state changes for reactive updates
  document.addEventListener('dashboard-state-changed', (e) => {
    const { key, value } = e.detail;
    
    if (key === 'notifications') {
      populateNotificationPanel(value);
      updateNotificationBadge(value.length);
    }
    
    if (key === 'orders') {
      renderOrdersWithTimeline(value);
    }
  });
}

// Logout from dashboard
document.addEventListener('DOMContentLoaded', function() {
  // Guard: Only run on dashboard pages
  if (!isDashboardPage()) {
    return;
  }
  
  const logoutBtn = document.querySelector('.logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', logoutUserFromDashboard);
  }
});
