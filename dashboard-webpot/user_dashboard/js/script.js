// dashboard-webpot/user_dashboard/js/script.js
// SINGLE dashboard bootstrap & orchestration file

/* ============================================
   PAGE GUARD — HARD STOP
============================================ */

(function () {
  const pathname = window.location.pathname;
  const isDashboard =
    pathname.includes('/dashboard') ||
    pathname.includes('/user_dashboard');

  if (!isDashboard) {
    return; // 🚫 HARD EXIT — nothing below runs
  }
})();

/* ============================================
   GLOBAL DASHBOARD STATE
============================================ */

window.DASHBOARD_STATE = {
  user: null,
  orders: [],
  stats: {},
  notifications: [],
  referrals: null,
  activity: [],
  session: { expiresAt: null }
};

/* ============================================
   DASHBOARD BOOTSTRAP
============================================ */

async function bootstrapDashboard() {
  // 1️⃣ Ensure auth helpers exist
  if (
    typeof isAuthenticated !== 'function' ||
    typeof getAuthToken !== 'function'
  ) {
    console.error('Auth helpers not loaded');
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

  DASHBOARD_STATE.user = user;

  // 4️⃣ Start session expiry tracking
  startSessionExpiryTracking();

  // 5️⃣ Load data
  await loadDashboardData();

  // 6️⃣ Initialize enhancements
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

  const expiry = getTokenExpiry();
  if (!expiry) return;

  const diff = expiry - Date.now();
  if (diff <= 0) {
    clearAuthToken();
    clearUserData();
    window.location.href = '/auth.html';
    return;
  }

  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(mins / 60);
  el.textContent =
    hrs > 0 ? `Session expires in ${hrs}h ${mins % 60}m`
            : `Session expires in ${mins}m`;
}

/* ============================================
   DATA LOADING
============================================ */

async function loadDashboardData() {
  try {
    const orders = await fetchUserOrders();
    DASHBOARD_STATE.orders = orders;

    updateStatsCards(orders);
    renderOrders?.(orders);
  } catch (err) {
    console.warn('Failed to load orders', err);
  }

  try {
    updateProfileSection?.(DASHBOARD_STATE.user);
  } catch {}
}

/* ============================================
   ENHANCEMENTS (SAFE)
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
