// dashboard-webpot/user_dashboard/js/script.js
// SINGLE dashboard bootstrap & orchestration file

/* ============================================
   HARD PAGE GUARD — REAL STOP
============================================ */

const __IS_DASHBOARD__ = (() => {
  const p = window.location.pathname;
  return p.includes('/dashboard') || p.includes('/user_dashboard');
})();

if (!__IS_DASHBOARD__) {
  console.log('[Dashboard] Not a dashboard page — aborting script');
  throw new Error('Dashboard script aborted');
}

/* ============================================
   GLOBAL DASHBOARD STATE (SINGLE SOURCE)
============================================ */

window.DASHBOARD_STATE = {
  user: null,
  orders: [],
  notifications: [],
  referrals: null,
  activity: [],
  session: { expiresAt: null }
};

/* ============================================
   SAFE STATE UPDATE
============================================ */

function setDashboardState(key, value) {
  DASHBOARD_STATE[key] = value;
  document.dispatchEvent(
    new CustomEvent('dashboard:state-updated', {
      detail: { key, value }
    })
  );
}

/* ============================================
   DASHBOARD BOOTSTRAP
============================================ */

async function bootstrapDashboard() {
  // 1️⃣ Ensure auth helpers exist
  if (
    typeof isAuthenticated !== 'function' ||
    typeof getAuthToken !== 'function'
  ) {
    console.error('[Dashboard] Auth helpers missing');
    return;
  }

  // 2️⃣ Auth check
  if (!isAuthenticated()) {
    clearAuthToken();
    clearUserData();
    window.location.href = '/auth.html';
    return;
  }

  // 3️⃣ Load user
  const user = getCurrentUser();
  if (!user || !user.user_id) {
    window.location.href = '/auth.html';
    return;
  }

  setDashboardState('user', user);

  // 4️⃣ Start session expiry tracking
  startSessionExpiryTracking();

  // 5️⃣ Load dashboard data
  await loadDashboardData();

  // 6️⃣ Initialize UI enhancements
  initializeEnhancements();
}

/* ============================================
   SESSION EXPIRY
============================================ */

function startSessionExpiryTracking() {
  updateSessionExpiryIndicator();
  setInterval(updateSessionExpiryIndicator, 60000);
}

function updateSessionExpiryIndicator() {
  const el = document.getElementById('sessionExpiryText');
  if (!el) return;

  // Safe access to getTokenExpiry with optional chaining
  const getTokenExpiryFn = typeof getTokenExpiry === 'function' 
    ? getTokenExpiry 
    : null;

  const expiry = getTokenExpiryFn?.();
  if (!expiry || typeof expiry !== 'number') {
    // Token expiry not available, skip update
    return;
  }

  const diff = expiry - Date.now();
  if (diff <= 0) {
    if (typeof clearAuthToken === 'function') {
      clearAuthToken();
    }
    if (typeof clearUserData === 'function') {
      clearUserData();
    }
    window.location.href = '/auth.html';
    return;
  }

  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(mins / 60);

  el.textContent =
    hrs > 0
      ? `Session expires in ${hrs}h ${mins % 60}m`
      : `Session expires in ${mins}m`;
}

/* ============================================
   DATA LOADING
============================================ */

async function loadDashboardData() {
  try {
    const orders = await fetchUserOrders();
    setDashboardState('orders', orders);

    updateStatsCards?.(orders);
    renderOrders?.(orders);
  } catch (err) {
    console.error('[Dashboard] Failed to load orders', err);
  }

  try {
    updateProfileSection?.(DASHBOARD_STATE.user);
  } catch (err) {
    console.warn('[Dashboard] Profile render failed', err);
  }
}

/* ============================================
   ENHANCEMENTS
============================================ */

function initializeEnhancements() {
  setupNotificationButton?.();
  initializeReferrals?.();

  const logoutBtn = document.querySelector('.logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', logoutUserFromDashboard);
  }
}

/* ============================================
   ENTRY POINT
============================================ */

document.addEventListener('DOMContentLoaded', bootstrapDashboard);
