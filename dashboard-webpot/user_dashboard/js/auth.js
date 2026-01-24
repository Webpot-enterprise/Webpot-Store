// dashboard-webpot/user_dashboard/js/auth.js
// Dashboard-specific auth helpers
// Auth truth is owned by script.js (bootstrapDashboard)

/* ============================================
   SAFE USER ACCESSORS
============================================ */

/**
 * Get current authenticated user safely
 * @returns {object|null}
 */
function getCurrentUser() {
  if (typeof getUserData !== 'function') {
    console.warn('getUserData() not available');
    return null;
  }

  const user = getUserData();
  if (!user || typeof user !== 'object') {
    return null;
  }

  return user;
}

/**
 * Get current user ID safely
 * @returns {string|null}
 */
function getCurrentUserId() {
  const user = getCurrentUser();
  return user && user.user_id ? user.user_id : null;
}

/* ============================================
   LOGOUT HANDLER
============================================ */

/**
 * Logout user from dashboard safely
 */
function logoutUserFromDashboard() {
  try {
    if (typeof clearAuthToken === 'function') {
      clearAuthToken();
    }

    if (typeof clearUserData === 'function') {
      clearUserData();
    }
  } catch (err) {
    console.error('Error during logout cleanup:', err);
  }

  // Always redirect to root homepage
  window.location.href = '/index.html';
}
