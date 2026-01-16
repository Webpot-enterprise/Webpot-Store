// dashboard-webpot/user_dashboard/js/script.js - Dashboard initialization and data loading

// Load all dashboard data
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
  setTimeout(loadDashboardData, 500);
});

// Logout from dashboard
document.addEventListener('DOMContentLoaded', function() {
  const logoutBtn = document.querySelector('.logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', logoutUserFromDashboard);
  }
});
