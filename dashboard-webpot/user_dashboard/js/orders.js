// dashboard-webpot/user_dashboard/js/orders.js - Orders page management

// ============================================
// NOTE: API FUNCTION DEFINITIONS ARE IN api.js
// ============================================
// fetchUserOrders() - defined in api.js
// updateStatsCards() - defined in ui.js
// renderOrders() - defined in ui.js
//
// This file handles orders-specific page behavior only.
// See api.js for backend communication
// See ui.js for rendering logic

// ============================================
// ORDERS DISPLAY & FILTERING
// ============================================

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
