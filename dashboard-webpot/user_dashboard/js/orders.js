// dashboard-webpot/user_dashboard/js/orders.js - Orders page management

// ============================================
// ORDERS API CALLS
// ============================================

/**
 * Fetch user's orders from backend
 * @param {string} userId - User ID from auth token
 * @returns {Promise<Array>} Array of order objects
 */
async function fetchUserOrders(userId) {
  try {
    const response = await apiCall({
      action: 'getUserOrders',
      user_id: userId
    });
    
    if (response && response.success && response.data) {
      return response.data || [];
    }
    
    console.warn('Failed to fetch orders:', response?.error);
    return [];
  } catch (error) {
    console.error('Error fetching orders:', error);
    return [];
  }
}

// ============================================
// ORDERS DISPLAY & FILTERING
// ============================================

/**
 * Update statistics cards with order data
 * @param {Array} orders - Array of order objects
 */
function updateStatsCards(orders) {
  if (!Array.isArray(orders)) orders = [];
  
  // Calculate stats
  const totalOrders = orders.length;
  const totalSpends = orders.reduce((sum, order) => {
    return sum + (parseFloat(order.total_amount) || 0);
  }, 0);
  
  // Update DOM
  const totalOrdersEl = document.querySelector('.stat-value') || null;
  const totalSpendsEl = document.querySelectorAll('.stat-value')[1] || null;
  
  if (totalOrdersEl) {
    totalOrdersEl.textContent = totalOrders;
  }
  
  if (totalSpendsEl) {
    totalSpendsEl.textContent = '₹' + totalSpends.toFixed(2);
  }
}

/**
 * Render orders into the orders container
 * @param {Array} orders - Array of order objects
 */
function renderOrders(orders) {
  const container = document.getElementById('ordersContainer');
  if (!container) return;
  
  if (!Array.isArray(orders) || orders.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <p>No orders yet. <a href="../../index.html">Place your first order</a></p>
      </div>
    `;
    return;
  }
  
  let ordersHTML = '';
  
  orders.forEach(order => {
    const orderDate = new Date(order.order_date).toLocaleDateString();
    const statusClass = `status-${order.order_status?.toLowerCase() || 'pending'}`;
    
    ordersHTML += `
      <div class="order-card" data-order-id="${order.order_id}">
        <div class="order-header">
          <div class="order-info">
            <h3>Order #${order.order_id}</h3>
            <p class="order-date">${orderDate}</p>
          </div>
          <div class="order-amount">
            <p class="amount">₹${parseFloat(order.total_amount).toFixed(2)}</p>
            <span class="status-badge ${statusClass}">${order.order_status || 'Pending'}</span>
          </div>
        </div>
        <div class="order-details">
          <p><strong>Service:</strong> ${order.service_type || 'N/A'}</p>
          <p><strong>Email:</strong> ${order.customer_email || 'N/A'}</p>
          <p><strong>Payment:</strong> ${order.payment_method || 'N/A'}</p>
        </div>
        <div class="order-footer">
          <button class="btn-small" onclick="viewOrderDetails('${order.order_id}')">View Details</button>
          ${order.order_status === 'pending_payment' ? 
            `<button class="btn-small btn-primary" onclick="completePayment('${order.order_id}')">Complete Payment</button>` 
            : ''}
        </div>
      </div>
    `;
  });
  
  container.innerHTML = ordersHTML;
}

/**
 * Filter orders by status
 * @param {string} status - Status filter value ('all', 'pending', 'processing', etc.)
 */
function filterOrdersByStatus(status) {
  const orders = document.querySelectorAll('.order-card');
  
  orders.forEach(card => {
    const badge = card.querySelector('.status-badge');
    const cardStatus = badge?.textContent.toLowerCase() || '';
    
    if (status === 'all' || cardStatus.includes(status.toLowerCase())) {
      card.style.display = 'block';
    } else {
      card.style.display = 'none';
    }
  });
}

/**
 * View order details in modal
 * @param {string} orderId - Order ID
 */
function viewOrderDetails(orderId) {
  const card = document.querySelector(`[data-order-id="${orderId}"]`);
  if (!card) return;
  
  const details = card.querySelector('.order-details').textContent;
  alert(`Order Details:\n${details}`);
}

/**
 * Complete payment for pending order
 * @param {string} orderId - Order ID
 */
function completePayment(orderId) {
  // Redirect to payment page with order ID
  window.location.href = `../../templates/payment.html?order_id=${orderId}`;
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Show loading state in container
 * @param {string} containerId - Container element ID
 */
function showLoading(containerId) {
  const container = document.getElementById(containerId);
  if (container) {
    container.innerHTML = '<div class="loading"><p>Loading...</p></div>';
  }
}

/**
 * Show error state in container
 * @param {string} containerId - Container element ID
 * @param {string} message - Error message
 */
function showError(containerId, message) {
  const container = document.getElementById(containerId);
  if (container) {
    container.innerHTML = `<div class="error"><p>${message}</p></div>`;
  }
}

// ============================================
// PAGE INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', function() {
  // Auth guard is handled in script.js
  // Just ensure orders page specific functionality is ready
  console.log('Orders page initialized');
});
