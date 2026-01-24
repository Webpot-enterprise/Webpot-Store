// dashboard-webpot/user_dashboard/js/ui.js
// PURE UI RENDERING — no state ownership, no side effects

/* ============================================
   PROFILE
============================================ */

function updateProfileSection(user) {
  if (!user) return;

  const setText = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val || '-';
  };

  const setImage = (id, src) => {
    const el = document.getElementById(id);
    if (el) el.src = src || '../assets/default pfp.webp';
  };

  setText('userName', user.full_name || user.name);
  setText('profileHeaderEmail', user.email);
  setText('userEmail', user.email);
  setText('userPhone', user.phone);

  setImage('profileImageDisplay', user.profile_image);
  setImage('navbarProfileImage', user.profile_image);

  if (user.status) {
    const statusEl = document.getElementById('userStatus');
    if (statusEl) {
      statusEl.textContent = user.status;
      statusEl.className = `status-badge status-${user.status}`;
    }
  }

  if (user.last_login) {
    setText('lastLogin', formatDate(user.last_login));
  }

  if (user.created_at) {
    setText('memberSince', formatDate(user.created_at));
  }
}

/* ============================================
   STATS
============================================ */

function updateStatsCards(orders = []) {
  const values = document.querySelectorAll('.stat-value');
  if (!values.length) return;

  const totalSpent = orders.reduce(
    (sum, o) => sum + (parseFloat(o.total_amount) || 0),
    0
  );

  values[0].textContent = orders.length;
  values[1].textContent = formatCurrency(totalSpent);
  values[2].textContent = orders.filter(o =>
    ['pending', 'processing'].includes(o.order_status)
  ).length;
}

/* ============================================
   ORDERS
============================================ */

function renderOrders(orders = []) {
  const container = document.getElementById('ordersContainer');
  if (!container) return;

  if (!orders.length) {
    container.innerHTML = `
      <div class="empty-state">
        <p>📦 No orders yet</p>
        <small>Create your first order to see it here</small>
      </div>`;
    return;
  }

  container.innerHTML = orders
    .slice(0, 10)
    .map(order => `
      <div class="order-card">
        <div class="order-header">
          <div>
            <strong>${order.service_type || 'Service'}</strong><br/>
            <small>${formatDate(order.order_date)}</small>
          </div>
          <span class="status-badge status-${order.order_status}">
            ${order.order_status}
          </span>
        </div>
        <div class="order-amount">${formatCurrency(order.total_amount)}</div>
        ${createOrderTimeline(order)}
      </div>
    `)
    .join('');
}

/* ============================================
   SESSIONS
============================================ */

function renderSessions(sessions = []) {
  const el = document.getElementById('sessionsContainer');
  if (!el) return;

  el.innerHTML = !sessions.length
    ? `<div class="empty-state">No active sessions</div>`
    : sessions.map(s => `
        <div class="session-item">
          <strong>${s.device_info || 'Unknown device'}</strong>
          <small>${s.ip_address}</small>
        </div>
      `).join('');
}

/* ============================================
   ACTIVITY
============================================ */

function renderActivityLog(logs = []) {
  const el = document.getElementById('activityLog');
  if (!el) return;

  el.innerHTML = !logs.length
    ? `<div class="empty-state">No activity yet</div>`
    : logs.map(log => `
        <div class="activity-item">
          <span>${log.action}</span>
          <small>${getRelativeTime(log.timestamp)}</small>
        </div>
      `).join('');
}

/* ============================================
   UTILITIES
============================================ */

function formatDate(date) {
  try {
    return new Date(date).toLocaleString();
  } catch {
    return '-';
  }
}

function formatCurrency(amount) {
  return '₹' + (parseFloat(amount) || 0).toFixed(2);
}

/* ============================================
   TIMELINE
============================================ */

function createOrderTimeline(order) {
  const steps = ['pending', 'processing', 'completed'];
  const idx = steps.indexOf(order.order_status);

  return `
    <div class="order-timeline">
      ${steps.map((s, i) => `
        <span class="timeline-dot ${i <= idx ? 'active' : ''}">
          ${s}
        </span>
      `).join('')}
    </div>
  `;
}

/* ============================================
   NOTIFICATIONS
============================================ */

function populateNotificationPanel(notifications = []) {
  const el = document.getElementById('notificationContent');
  if (!el) return;

  el.innerHTML = !notifications.length
    ? `<div class="empty-state">No notifications</div>`
    : notifications.map(n => `
        <div class="notification-item">
          <strong>${n.title}</strong>
          <small>${getRelativeTime(n.created_at)}</small>
        </div>
      `).join('');
}

function updateNotificationBadge(count = 0) {
  const badge = document.querySelector('.notification-badge');
  if (badge) {
    badge.style.display = count ? 'inline-flex' : 'none';
    badge.textContent = count > 9 ? '9+' : count;
  }
}
