// dashboard-webpot/user_dashboard/js/api.js
// Dashboard API integration — aligned with Apps Script backend

/* ============================================
   USER DATA
============================================ */

/**
 * Get current user email safely
 */
function getUserEmail() {
  const user = typeof getUserData === 'function' ? getUserData() : null;
  return user && user.email ? user.email : '';
}

/* ============================================
   ORDERS
============================================ */

/**
 * Fetch orders for the currently authenticated user
 * Backend-supported via action=getUserOrders
 */
async function fetchUserOrders() {
  try {
    const token = typeof getAuthToken === 'function'
      ? getAuthToken()
      : null;

    if (!token) {
      console.warn('No auth token available for fetchUserOrders');
      return [];
    }

    const res = await apiCall('getUserOrders', { token });

    if (res && Array.isArray(res.orders)) {
      return res.orders;
    }

    console.warn('Unexpected getUserOrders response:', res);
    return [];
  } catch (err) {
    console.error('Failed to fetch user orders:', err);
    return [];
  }
}

/* ============================================
   SESSIONS (PLACEHOLDER)
============================================ */

/**
 * Backend does not yet expose session read APIs.
 * Safe placeholder for future use.
 */
async function fetchUserSessions() {
  return [];
}

/* ============================================
   ACTIVITY LOGS (PLACEHOLDER)
============================================ */

/**
 * Backend does not yet expose log read APIs.
 * Safe placeholder for future use.
 */
async function fetchActivityLogs() {
  return [];
}
