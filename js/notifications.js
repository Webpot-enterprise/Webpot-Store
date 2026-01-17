/**
 * Notifications Module
 * Handles fetching, caching, and managing notifications from backend API
 * Features: localStorage caching, mark-as-read, real-time sync, unread count tracking
 */

let notificationsCache = [];
let unreadCount = 0;
const CACHE_KEY = 'webpot_notifications_cache';
const UNREAD_KEY = 'webpot_notifications_unread';
const SYNC_INTERVAL = 5 * 60 * 1000;

function initializeNotifications() {
  loadCachedNotifications();
  fetchNotifications();
  startNotificationSync();
  updateNotificationBell();
}

async function fetchNotifications() {
  try {
    const token = localStorage.getItem('webpot_auth_token');
    if (!token) return;
    
    const response = await apiCall(
      '/notifications',
      'GET',
      { action: 'getNotifications' },
      {}
    );
    
    if (response && response.success && response.data && Array.isArray(response.data.notifications)) {
      notificationsCache = response.data.notifications;
      localStorage.setItem(CACHE_KEY, JSON.stringify(notificationsCache));
      calculateUnreadCount();
      updateNotificationBell();
      renderNotifications();
      console.log('Notifications synced:', notificationsCache.length);
    }
  } catch (error) {
    console.error('Error fetching notifications:', error);
    loadCachedNotifications();
  }
}

function loadCachedNotifications() {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      notificationsCache = JSON.parse(cached);
      calculateUnreadCount();
    }
  } catch (error) {
    console.error('Error loading cached notifications:', error);
    notificationsCache = [];
  }
}

function calculateUnreadCount() {
  unreadCount = notificationsCache.filter(n => !n.read_status || n.read_status === false).length;
  localStorage.setItem(UNREAD_KEY, unreadCount.toString());
}

async function markNotificationAsRead(notificationId) {
  try {
    const notification = notificationsCache.find(n => n.id === notificationId);
    if (notification) {
      notification.read_status = true;
      calculateUnreadCount();
      updateNotificationBell();
      renderNotifications();
    }
    
    const token = localStorage.getItem('webpot_auth_token');
    if (!token) return;
    
    const response = await apiCall(
      '/notifications',
      'POST',
      { action: 'markAsRead' },
      { notification_id: notificationId }
    );
    
    if (!response.success && notification) {
      notification.read_status = false;
      calculateUnreadCount();
      updateNotificationBell();
    }
  } catch (error) {
    console.error('Error marking notification as read:', error);
  }
}

async function markAllAsRead() {
  try {
    notificationsCache.forEach(n => n.read_status = true);
    calculateUnreadCount();
    updateNotificationBell();
    renderNotifications();
    
    const token = localStorage.getItem('webpot_auth_token');
    if (!token) return;
    
    const response = await apiCall(
      '/notifications',
      'POST',
      { action: 'markAllAsRead' },
      {}
    );
    
    if (!response.success) {
      fetchNotifications();
    }
  } catch (error) {
    console.error('Error marking all as read:', error);
  }
}

async function deleteNotification(notificationId) {
  try {
    const index = notificationsCache.findIndex(n => n.id === notificationId);
    if (index > -1) {
      notificationsCache.splice(index, 1);
      calculateUnreadCount();
      updateNotificationBell();
      renderNotifications();
    }
    
    const token = localStorage.getItem('webpot_auth_token');
    if (!token) return;
    
    const response = await apiCall(
      '/notifications',
      'POST',
      { action: 'deleteNotification' },
      { notification_id: notificationId }
    );
    
    if (!response.success) {
      fetchNotifications();
    }
  } catch (error) {
    console.error('Error deleting notification:', error);
  }
}

function updateNotificationBell() {
  const badge = document.querySelector('.notification-badge');
  if (badge) {
    if (unreadCount > 0) {
      badge.style.display = 'block';
      badge.textContent = unreadCount > 9 ? '9+' : unreadCount;
    } else {
      badge.style.display = 'none';
    }
  }
}

function renderNotifications() {
  const list = document.querySelector('.notification-list');
  if (!list) return;
  
  if (notificationsCache.length === 0) {
    list.innerHTML = '<div style="padding: 1.5rem; text-align: center; color: var(--text-muted);">No notifications</div>';
    return;
  }
  
  list.innerHTML = notificationsCache.map(notification => {
    const date = formatNotificationDate(notification.timestamp);
    const unreadClass = !notification.read_status ? 'notification-unread' : '';
    
    return `
      <div class="notification-item ${unreadClass}" data-id="${notification.id}">
        <div class="notification-item-content">
          <h4>${escapeHtml(notification.title)}</h4>
          <p>${escapeHtml(notification.message)}</p>
          <span class="notification-item-date">${date}</span>
        </div>
        <div class="notification-item-actions">
          ${!notification.read_status ? '<button class="notification-action-btn" onclick="markNotificationAsRead(' + notification.id + ')" title="Mark as read">✓</button>' : ''}
          <button class="notification-action-btn delete" onclick="deleteNotification(' + notification.id + ')" title="Delete">✕</button>
        </div>
      </div>
    `;
  }).join('');
}

function formatNotificationDate(timestamp) {
  if (!timestamp) return '';
  
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return diffMins + 'm ago';
  if (diffHours < 24) return diffHours + 'h ago';
  if (diffDays < 7) return diffDays + 'd ago';
  
  return date.toLocaleDateString('en-IN', {
    month: 'short',
    day: 'numeric'
  });
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function startNotificationSync() {
  setInterval(fetchNotifications, SYNC_INTERVAL);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      fetchNotifications();
    }
  });
}

function toggleNotifications() {
  const dropdown = document.querySelector('.notification-dropdown');
  if (!dropdown) return;
  dropdown.classList.toggle('active');
  if (dropdown.classList.contains('active')) {
    document.addEventListener('click', closeNotificationsOnClickOutside);
  } else {
    document.removeEventListener('click', closeNotificationsOnClickOutside);
  }
}

function closeNotificationsOnClickOutside(event) {
  const dropdown = document.querySelector('.notification-dropdown');
  const bell = document.querySelector('.notification-btn');
  if (dropdown && !dropdown.contains(event.target) && !bell?.contains(event.target)) {
    dropdown.classList.remove('active');
    document.removeEventListener('click', closeNotificationsOnClickOutside);
  }
}

document.addEventListener('DOMContentLoaded', initializeNotifications);

const notificationStyles = `
  .notification-item {
    padding: 1rem;
    border-bottom: 1px solid rgba(0, 212, 255, 0.1);
    display: flex;
    gap: 1rem;
    justify-content: space-between;
    align-items: flex-start;
    transition: all 0.3s ease;
  }
  .notification-item:hover {
    background: rgba(0, 212, 255, 0.05);
  }
  .notification-item.notification-unread {
    background: rgba(0, 212, 255, 0.08);
    border-left: 3px solid var(--neon-blue);
  }
  .notification-item-content {
    flex: 1;
    min-width: 0;
  }
  .notification-item-content h4 {
    margin: 0 0 0.25rem 0;
    font-size: 0.9rem;
    color: var(--text-light);
    font-weight: 600;
  }
  .notification-item-content p {
    margin: 0 0 0.5rem 0;
    font-size: 0.8rem;
    color: var(--text-muted);
    line-height: 1.4;
  }
  .notification-item-date {
    font-size: 0.75rem;
    color: var(--text-muted);
    opacity: 0.7;
  }
  .notification-item-actions {
    display: flex;
    gap: 0.5rem;
    flex-shrink: 0;
  }
  .notification-action-btn {
    width: 24px;
    height: 24px;
    border: none;
    background: rgba(0, 212, 255, 0.1);
    color: var(--neon-blue);
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.75rem;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
  }
  .notification-action-btn:hover {
    background: rgba(0, 212, 255, 0.2);
    box-shadow: 0 0 8px rgba(0, 212, 255, 0.3);
  }
  .notification-action-btn.delete:hover {
    background: rgba(255, 68, 68, 0.2);
    color: #ff4444;
  }
  .mark-all-btn {
    width: 100%;
    padding: 0.5rem;
    margin-top: 0.5rem;
    background: transparent;
    border: 1px solid var(--neon-blue);
    color: var(--neon-blue);
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.75rem;
    font-weight: 600;
    transition: all 0.3s ease;
  }
  .mark-all-btn:hover {
    background: rgba(0, 212, 255, 0.1);
  }
`;

if (document.head) {
  const style = document.createElement('style');
  style.textContent = notificationStyles;
  document.head.appendChild(style);
}
