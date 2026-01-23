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
// ============================================
// POPEYE: UI HELPER FUNCTIONS
// ============================================

/**
 * Create skeleton loader HTML for loading states
 */
function createSkeletonLoader(type = 'card') {
  if (type === 'card') {
    return `
      <div class="skeleton-loader">
        <div class="skeleton skeleton-header"></div>
        <div class="skeleton skeleton-line"></div>
        <div class="skeleton skeleton-line"></div>
        <div class="skeleton skeleton-line short"></div>
      </div>
    `;
  }
  if (type === 'table-row') {
    return `
      <tr class="skeleton-row">
        <td><div class="skeleton skeleton-cell"></div></td>
        <td><div class="skeleton skeleton-cell"></div></td>
        <td><div class="skeleton skeleton-cell"></div></td>
        <td><div class="skeleton skeleton-cell"></div></td>
      </tr>
    `;
  }
  return '';
}

/**
 * Create order timeline visualization
 */
function createOrderTimeline(order) {
  const status = order.order_status || 'pending';
  const timeline = {
    pending: ['pending', 'processing', 'shipped', 'delivered'],
    processing: ['pending', 'processing', 'shipped', 'delivered'],
    shipped: ['pending', 'processing', 'shipped', 'delivered'],
    delivered: ['pending', 'processing', 'shipped', 'delivered'],
    cancelled: ['pending', 'cancelled'],
    failed: ['pending', 'failed']
  };
  
  const steps = timeline[status] || timeline.pending;
  const currentIdx = steps.indexOf(status);
  
  let html = '<div class="order-timeline">';
  steps.forEach((step, idx) => {
    const isCompleted = idx < currentIdx;
    const isActive = idx === currentIdx;
    const classes = ['timeline-step'];
    if (isCompleted) classes.push('completed');
    if (isActive) classes.push('active');
    
    html += `<div class="${classes.join(' ')}">
      <div class="timeline-dot"></div>
      <div class="timeline-label">${step.charAt(0).toUpperCase() + step.slice(1)}</div>
    </div>`;
    
    if (idx < steps.length - 1) {
      const connectorClass = isCompleted ? 'timeline-connector completed' : 'timeline-connector';
      html += `<div class="${connectorClass}"></div>`;
    }
  });
  html += '</div>';
  return html;
}

/**
 * Show soft error toast notification (non-blocking)
 */
function showErrorToast(message, duration = 5000) {
  const container = document.getElementById('toast-container') || createToastContainer();
  const toast = document.createElement('div');
  toast.className = 'toast toast-error';
  const toastId = 'toast-' + Date.now();
  toast.id = toastId;
  toast.innerHTML = `
    <span class="toast-icon">⚠️</span>
    <span class="toast-message">${message}</span>
    <button class="toast-close" onclick="this.parentElement.remove()">✕</button>
  `;
  container.appendChild(toast);
  
  setTimeout(() => {
    const el = document.getElementById(toastId);
    if (el) el.remove();
  }, duration);
}

/**
 * Show success toast notification
 */
function showSuccessToast(message, duration = 4000) {
  const container = document.getElementById('toast-container') || createToastContainer();
  const toast = document.createElement('div');
  toast.className = 'toast toast-success';
  const toastId = 'toast-' + Date.now();
  toast.id = toastId;
  toast.innerHTML = `
    <span class="toast-icon">✓</span>
    <span class="toast-message">${message}</span>
    <button class="toast-close" onclick="this.parentElement.remove()">✕</button>
  `;
  container.appendChild(toast);
  
  setTimeout(() => {
    const el = document.getElementById(toastId);
    if (el) el.remove();
  }, duration);
}

/**
 * Create or get toast container
 */
function createToastContainer() {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  return container;
}

/**
 * Format time remaining (e.g., "2h 30m")
 */
function formatTimeRemaining(expiryDate) {
  const now = new Date();
  const diff = expiryDate - now;
  if (diff <= 0) return 'expired';
  
  const totalMinutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

/**
 * Format currency value
 */
function formatCurrency(amount) {
  return '₹' + (parseFloat(amount) || 0).toFixed(2);
}

/**
 * Get relative time (e.g., "2 hours ago")
 */
function getRelativeTime(date) {
  if (!date) return '';
  const now = new Date();
  const past = new Date(date);
  const diffMs = now - past;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 30) return `${diffDays}d ago`;
  return formatDate(date);
}

// ============================================
// POPEYE: REFERRAL MANAGEMENT
// ============================================

/**
 * Initialize and display referral card
 * SAFE: Shows placeholder if data is unavailable
 */
function initializeReferrals() {
  const state = getDashboardState('referrals');
  if (!state || !state.code) {
    const section = document.getElementById('referralSection');
    if (section) {
      section.style.display = 'block';
      document.getElementById('referralCode').textContent = 'Contact support for your code';
    }
    return;
  }
  
  const section = document.getElementById('referralSection');
  if (section) {
    section.style.display = 'block';
    document.getElementById('referralCode').textContent = state.code;
    document.getElementById('referralUsageCount').textContent = state.usageCount || 0;
    document.getElementById('referralStatus').textContent = (state.status || 'active').toUpperCase();
  }
}

/**
 * Copy referral code to clipboard
 */
function copyReferralCode() {
  const codeEl = document.getElementById('referralCode');
  if (!codeEl) return;
  
  const code = codeEl.textContent;
  navigator.clipboard.writeText(code).then(() => {
    const btn = event.target;
    btn.classList.add('copied');
    btn.textContent = 'Copied!';
    showSuccessToast('Referral code copied!', 3000);
    
    setTimeout(() => {
      btn.classList.remove('copied');
      btn.textContent = 'Copy';
    }, 2000);
  }).catch(() => {
    showErrorToast('Failed to copy code');
  });
}

// ============================================
// POPEYE: NOTIFICATION CENTER
// ============================================

/**
 * Toggle notification panel visibility
 */
function toggleNotificationPanel() {
  const panel = document.getElementById('notificationPanel');
  if (panel) {
    panel.classList.toggle('active');
  }
}

/**
 * Populate notification panel with data
 * SAFE: Shows empty state if no notifications
 */
function populateNotificationPanel(notifications = []) {
  const content = document.getElementById('notificationContent');
  if (!content) return;
  
  if (!notifications || notifications.length === 0) {
    content.innerHTML = `
      <div style="padding: 24px; text-align: center; color: rgba(230, 237, 243, 0.6);">
        <p>📬 No notifications yet</p>
        <small>We'll notify you when something important happens</small>
      </div>
    `;
    return;
  }
  
  let html = '';
  notifications.slice(0, 20).forEach(notif => {
    html += `
      <div class="notification-item">
        <div style="color: #e6edf3; font-weight: 500;">${notif.title || 'Notification'}</div>
        <div style="color: rgba(230, 237, 243, 0.7); font-size: 13px; margin-top: 4px;">${notif.message || ''}</div>
        <div class="notification-time">${getRelativeTime(notif.created_at || notif.timestamp)}</div>
      </div>
    `;
  });
  
  content.innerHTML = html;
}

/**
 * Update notification badge count
 */
function updateNotificationBadge(count = 0) {
  const badge = document.querySelector('.notification-badge');
  if (badge) {
    badge.textContent = count > 9 ? '9+' : count;
    badge.style.display = count > 0 ? 'inline-flex' : 'none';
  }
}

/**
 * Attach notification button click handler
 */
function setupNotificationButton() {
  const notifBtn = document.querySelector('.notification-btn');
  if (notifBtn) {
    notifBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      toggleNotificationPanel();
    });
  }
  
  document.addEventListener('click', (e) => {
    const panel = document.getElementById('notificationPanel');
    const btn = document.querySelector('.notification-btn');
    if (panel && btn && !panel.contains(e.target) && !btn.contains(e.target)) {
      if (panel.classList.contains('active')) {
        panel.classList.remove('active');
      }
    }
  });
}

// ============================================
// POPEYE: ENHANCE ORDERS WITH TIMELINE
// ============================================

/**
 * Render orders with timeline visualization
 * ENHANCED: Adds order lifecycle timeline
 */
function renderOrdersWithTimeline(orders) {
  const container = document.getElementById('ordersContainer');
  if (!container) return;
  
  allOrders = orders || [];
  
  if (!orders || orders.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <p>📦 No orders yet</p>
        <small>Your orders will appear here once available. You can create orders using Pay Later.</small>
      </div>
    `;
    return;
  }
  
  let html = '<div style="display: flex; flex-direction: column; gap: 20px;">';
  
  orders.slice(0, 10).forEach((order, idx) => {
    html += `
      <div style="background: rgba(26, 29, 36, 0.4); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 8px; padding: 16px;">
        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px;">
          <div>
            <div style="color: #e6edf3; font-weight: 600;">Order ${order.order_id || '—'}</div>
            <div style="color: rgba(230, 237, 243, 0.7); font-size: 12px;">${order.service_type || 'Service'} • ${formatCurrency(order.total_amount)}</div>
          </div>
          <span class="status-badge status-${(order.order_status || 'pending').toLowerCase()}">${order.order_status || 'Pending'}</span>
        </div>
        ${createOrderTimeline(order)}
        <div style="color: rgba(230, 237, 243, 0.5); font-size: 12px; margin-top: 12px;">
          ${formatDate(new Date(order.order_date))}
        </div>
      </div>
    `;
  });
  
  html += '</div>';
  container.innerHTML = html;
}