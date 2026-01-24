// dashboard-webpot/user_dashboard/js/orders.js
// Orders page behavior — data-driven, safe, scoped

/* ============================================
   PAGE GUARD
============================================ */

(function () {
  const page = document.body?.dataset?.page;
  if (page !== 'orders') {
    return; // 🚫 Only run on orders page
  }
})();

/* ============================================
   ORDER FILTERING (DATA-DRIVEN)
============================================ */

/**
 * Filter orders by status and re-render
 * @param {string} status
 */
function filterOrdersByStatus(status) {
  if (!window.DASHBOARD_STATE || !Array.isArray(DASHBOARD_STATE.orders)) {
    return;
  }

  let filtered = DASHBOARD_STATE.orders;

  if (status !== 'all') {
    filtered = filtered.filter(o =>
      (o.order_status || '').toLowerCase() === status.toLowerCase()
    );
  }

  if (typeof renderOrders === 'function') {
    renderOrders(filtered);
  }
}

/* ============================================
   ORDER ACTIONS
============================================ */

/**
 * View order details (simple fallback)
 * @param {string} orderId
 */
function viewOrderDetails(orderId) {
  const order = DASHBOARD_STATE.orders.find(o => o.order_id === orderId);
  if (!order) return;

  alert(
    `Order ID: ${order.order_id}\n` +
    `Service: ${order.service_type}\n` +
    `Status: ${order.order_status}\n` +
    `Amount: ${order.total_amount} ${order.currency}`
  );
}

/**
 * Redirect to payment page for pending order
 * @param {string} orderId
 */
function completePayment(orderId) {
  window.location.href =
    `/templates/payment.html?order_id=${encodeURIComponent(orderId)}`;
}

/* ============================================
   INIT
============================================ */

document.addEventListener('DOMContentLoaded', () => {
  console.log('Orders page ready');
});
