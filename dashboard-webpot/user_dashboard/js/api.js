// dashboard-webpot/user_dashboard/js/api.js - Dashboard API integration

// Fetch user profile data
async function fetchUserProfile(userId) {
  try {
    const res = await apiCall('/users', {
      method: 'GET',
      action: 'getUserById',
      body: { user_id: userId }
    });
    if (res.success && res.data.user) {
      return res.data.user;
    }
    return null;
  } catch (e) {
    console.error('Error fetching user profile:', e);
    return null;
  }
}

// Fetch user's orders
// STUB: Backend does not yet support read orders. Only order creation (Pay Later) is supported.
// TODO: Once backend implements getOrders/getUserOrders, replace with real API call
async function fetchUserOrders(userId) {
  console.warn('[STUB] fetchUserOrders called but backend read API not available yet');
  // Return empty array - orders will display empty state
  return [];
}

// Fetch user's sessions
// STUB: Backend does not support session read API.
// TODO: Once backend implements getSessions, replace with real API call
async function fetchUserSessions(userId) {
  console.warn('[STUB] fetchUserSessions called but backend read API not available yet');
  // Return empty array - sessions will show placeholder
  return [];
}

// Fetch active auth tokens
// STUB: Backend does not support auth token read API.
// TODO: Once backend implements getAuthTokens, replace with real API call
async function fetchAuthTokens(userId) {
  console.warn('[STUB] fetchAuthTokens called but backend read API not available yet');
  // Return empty array
  return [];
}

// Fetch activity logs
// STUB: Backend does not support activity log read API.
// TODO: Once backend implements getLogs, replace with real API call
async function fetchActivityLogs(userId, limit = 20) {
  console.warn('[STUB] fetchActivityLogs called but backend read API not available yet');
  // Return empty array - activity will show placeholder
  return [];}

// Get user email from auth token data
function getUserEmail() {
  const userData = getUserData();
  return userData ? userData.email : '';
}
