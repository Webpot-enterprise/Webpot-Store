// dashboard-webpot/user_dashboard/js/api.js
// Dashboard API integration — aligned with Apps Script backend

/* ============================================
   SAFE API CALL WRAPPER
============================================ */

/**
 * Safe wrapper for API calls from dashboard context
 * Falls back to main apiCall if available
 */
async function dashboardApiCall(action, options = {}) {
  // Use main apiCall if available in global scope
  if (typeof window.apiCall === 'function') {
    return window.apiCall('/user', {
      method: 'POST',
      action: action,
      body: options.body || {},
      ...options
    });
  }

  // Fallback: simple fetch wrapper
  const token = typeof getAuthToken === 'function' ? getAuthToken() : null;
  if (!token) {
    return { success: false, error: 'Not authenticated' };
  }

  try {
    const baseUrl = (typeof window.API_CONFIG !== 'undefined' && window.API_CONFIG?.BASE_URL)
      ? window.API_CONFIG.BASE_URL
      : 'https://api-gateway.engagewebpot.workers.dev';

    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        action: action,
        ...options.body
      })
    });

    if (!response.ok) {
      return { success: false, error: 'API request failed' };
    }

    return await response.json();
  } catch (err) {
    console.error(`Dashboard API call failed for action ${action}:`, err);
    return { success: false, error: err.message };
  }
}

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

    const res = await dashboardApiCall('getUserOrders', { token });

    // Handle different response formats
    if (res && res.success && Array.isArray(res.orders)) {
      return res.orders;
    }

    if (res && Array.isArray(res.orders)) {
      return res.orders;
    }

    if (Array.isArray(res)) {
      return res;
    }

    // Try to get from cached orders in localStorage as fallback
    const cached = localStorage.getItem('user_orders');
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        console.warn('Failed to parse cached orders');
      }
    }

    console.warn('Unexpected getUserOrders response:', res);
    return [];
  } catch (err) {
    console.error('Failed to fetch user orders:', err);
    
    // Fallback to cached orders
    const cached = localStorage.getItem('user_orders');
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        console.warn('Failed to parse cached orders');
      }
    }

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
