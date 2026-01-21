// dashboard-webpot/user_dashboard/js/ui.js - Dashboard UI rendering

// Update profile section with user data
function updateProfileSection(user) {
  if (!user) return;
  
  document.getElementById('userName').textContent = user.full_name || user.name || 'User';
  document.getElementById('profileHeaderEmail').textContent = user.email || '-';
  document.getElementById('profileImageDisplay').src = user.profile_image || '../assets/default pfp.webp';
  document.getElementById('navbarProfileImage').src = user.profile_image || '../assets/default pfp.webp';
  
  document.getElementById('userEmail').textContent = user.email || '-';
  document.getElementById('userPhone').textContent = user.phone || '-';
  
  // Status badge
  const statusEl = document.getElementById('userStatus');
  if (statusEl && user.status) {
    statusEl.textContent = user.status.charAt(0).toUpperCase() + user.status.slice(1);
    statusEl.className = `status-badge status-${user.status}`;
  }
  
  // Last login
  if (user.last_login) {
    const lastLoginEl = document.getElementById('lastLogin');
    if (lastLoginEl) {
      lastLoginEl.textContent = formatDate(new Date(user.last_login));
    }
  }
  
  // Member since
  if (user.created_at) {
    const memberEl = document.getElementById('memberSince');
    if (memberEl) {
      memberEl.textContent = formatDate(new Date(user.created_at));
    }
  }
}

// Update stats cards
function updateStatsCards(orders) {
  if (!orders || orders.length === 0) {
    document.querySelector('.stat-value:nth-child(1)').textContent = '0';
    document.querySelector('.stat-value:nth-child(2)').textContent = '₹0.00';
    document.querySelector('.stat-value:nth-child(3)').textContent = '0';
    return;
  }
  
  const totalSpends = orders.reduce((sum, o) => {
    return sum + (parseFloat(o.total_amount) || 0);
  }, 0);
  
  const statCards = document.querySelectorAll('.stat-value');
  if (statCards.length >= 2) {
    statCards[0].textContent = orders.length.toString();
    statCards[1].textContent = '₹' + totalSpends.toFixed(2);
  }
}

// Render orders table
function renderOrders(orders) {
  const container = document.getElementById('ordersContainer');
  if (!container) return;
  
  // Store all orders for filtering
  allOrders = orders || [];
  
  if (!orders || orders.length === 0) {
    // Intentional empty state - backend read API not yet available
    container.innerHTML = `
      <div class="empty-state">
        <p>Orders will appear here once available.</p>
        <small>Order history is coming soon. You can still create orders using Pay Later.</small>
      </div>
    `;
    return;
  }
  
  let html = '<table class="orders-table"><thead><tr><th>Order ID</th><th>Date</th><th>Service</th><th>Amount</th><th>Status</th></tr></thead><tbody>';
  
  orders.slice(0, 10).forEach(order => {
    const status = order.order_status || 'pending';
    const statusClass = `status-${status.toLowerCase()}`;
    html += `
      <tr>
        <td>${order.order_id || '-'}</td>
        <td>${formatDate(new Date(order.order_date)) || '-'}</td>
        <td>${order.service_type || '-'}</td>
        <td>₹${order.total_amount || '0'}</td>
        <td><span class="status-badge ${statusClass}">${status}</span></td>
      </tr>
    `;
  });
  
  html += '</tbody></table>';
  container.innerHTML = html;
}

// Render sessions table
function renderSessions(sessions) {
  const container = document.getElementById('sessionsContainer');
  if (!container) return;
  
  if (!sessions || sessions.length === 0) {
    // Intentional empty state - session tracking not yet available
    container.innerHTML = `
      <div class="empty-state">
        <p>Session history will appear here.</p>
        <small>Device and login session tracking is coming soon.</small>
      </div>
    `;
    return;
  }
  
  let html = '<table class="sessions-table"><thead><tr><th>Device</th><th>IP Address</th><th>Created</th><th>Expires</th><th>Status</th></tr></thead><tbody>';
  
  sessions.slice(0, 5).forEach(session => {
    const isActive = new Date(session.expires_at) > new Date();
    const statusClass = isActive ? 'status-active' : 'status-expired';
    html += `
      <tr>
        <td>${session.device_info || 'Unknown'}</td>
        <td>${session.ip_address || '-'}</td>
        <td>${formatDate(new Date(session.created_at))}</td>
        <td>${formatDate(new Date(session.expires_at))}</td>
        <td><span class="status-badge ${statusClass}">${isActive ? 'Active' : 'Expired'}</span></td>
      </tr>
    `;
  });
  
  html += '</tbody></table>';
  container.innerHTML = html;
}

// Render activity log
function renderActivityLog(logs) {
  const container = document.getElementById('activityLog');
  if (!container) return;
  
  if (!logs || logs.length === 0) {
    // Intentional empty state - activity logging not yet available
    container.innerHTML = `
      <div class="empty-state">
        <p>No activity data available.</p>
        <small>Activity tracking is coming soon.</small>
      </div>
    `;
    return;
  }
  
  let html = '<div class="activity-timeline">';
  
  logs.forEach(log => {
    html += `
      <div class="activity-item">
        <span class="activity-time">${formatDate(new Date(log.timestamp))}</span>
        <span class="activity-action">${log.action}</span>
        <span class="activity-details">${log.details || ''}</span>
      </div>
    `;
  });
  
  html += '</div>';
  container.innerHTML = html;
}

// Format date helper
function formatDate(date) {
  if (!date) return '-';
  try {
    const d = new Date(date);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch (e) {
    return '-';
  }
}

// Show loading state
function showLoading(elementId) {
  const el = document.getElementById(elementId);
  if (el) {
    el.innerHTML = '<div class="loading-spinner">Loading...</div>';
  }
}

// Show error state
function showError(elementId, message) {
  const el = document.getElementById(elementId);
  if (el) {
    el.innerHTML = `<div class="error-state"><p>${message || 'Error loading data'}</p></div>`;
  }
}

// Copy to clipboard
function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    alert('Copied to clipboard!');
  });
}

// Filter orders by status
let allOrders = [];
function filterOrdersByStatus(status) {
  if (status === 'all') {
    renderOrders(allOrders);
  } else {
    const filtered = allOrders.filter(o => 
      (o.order_status || 'pending').toLowerCase() === status.toLowerCase()
    );
    renderOrders(filtered);
  }
}

// Navigate to settings page
function goToSettings() {
  window.location.href = 'settings.html';
}
