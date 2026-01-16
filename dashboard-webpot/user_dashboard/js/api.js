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
async function fetchUserOrders(userId) {
  try {
    const res = await apiCall('/orders', {
      method: 'GET',
      action: 'getOrders'
    });
    if (res.success && res.data.orders) {
      return res.data.orders.filter(o => o.user_id === userId || o.customer_email === getUserEmail());
    }
    return [];
  } catch (e) {
    console.error('Error fetching orders:', e);
    return [];
  }
}

// Fetch user's sessions
async function fetchUserSessions(userId) {
  try {
    const res = await apiCall('/sessions', {
      method: 'GET',
      action: 'getSessions'
    });
    if (res.success && res.data.sessions) {
      return res.data.sessions.filter(s => s.user_id === userId);
    }
    return [];
  } catch (e) {
    console.error('Error fetching sessions:', e);
    return [];
  }
}

// Fetch active auth tokens
async function fetchAuthTokens(userId) {
  try {
    const res = await apiCall('/auth', {
      method: 'GET',
      action: 'getAuthTokens'
    });
    if (res.success && res.data.tokens) {
      return res.data.tokens.filter(t => t.user_id === userId && new Date(t.expires_at) > new Date());
    }
    return [];
  } catch (e) {
    console.error('Error fetching tokens:', e);
    return [];
  }
}

// Fetch activity logs
async function fetchActivityLogs(userId, limit = 20) {
  try {
    const res = await apiCall('/logs', {
      method: 'GET',
      action: 'getLogs'
    });
    if (res.success && res.data.logs) {
      return res.data.logs
        .filter(l => l.user_id === userId)
        .slice(0, limit);
    }
    return [];
  } catch (e) {
    console.error('Error fetching logs:', e);
    return [];
  }
}

// Get user email from auth token data
function getUserEmail() {
  const userData = getUserData();
  return userData ? userData.email : '';
}
