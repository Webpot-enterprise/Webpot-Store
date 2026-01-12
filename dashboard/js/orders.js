// =============================================
// ORDERS PAGE - JAVASCRIPT FUNCTIONALITY
// =============================================

// Orders data (will be populated from backend)
let userOrders = [];

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    fetchCustomerOrders();
    setupEventListeners();
    setupSidebarNavigation();
});

// Fetch customer orders from backend
function fetchCustomerOrders() {
    const userEmail = localStorage.getItem('userEmail');
    
    if (!userEmail) {
        console.error('User email not found. Please log in.');
        window.location.href = '../auth.html';
        return;
    }

    const apiUrl = `${WEBPOT_CONFIG.API_URL}?action=get_customer_orders&email=${encodeURIComponent(userEmail)}`;
    
    fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                // Transform backend orders to format expected by UI
                userOrders = data.data.map(order => ({
                    id: order.orderId,
                    userName: order.customerName || 'N/A',
                    email: userEmail,
                    servicePlan: order.service || 'Standard',
                    totalAmount: parseFloat(order.amount) || 0,
                    dueAmount: 0, // All amounts are paid in current system
                    status: order.status.toLowerCase(),
                    date: new Date(order.date).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric' 
                    }),
                    description: `Order processed on ${new Date(order.date).toLocaleDateString()}`
                }));

                loadOrders();
                updateSummaryStats();
            } else {
                console.error('Failed to fetch orders:', data.message);
                showErrorMessage('Failed to load orders. Please refresh the page.');
            }
        })
        .catch(error => {
            console.error('Error fetching orders:', error);
            showErrorMessage('Failed to load orders. Please check your connection.');
        });
}

// Show error message in table
function showErrorMessage(message) {
    const tableBody = document.getElementById('ordersTableBody');
    if (tableBody) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 2rem;">
                    <div class="empty-state">
                        <i class="fas fa-exclamation-circle"></i>
                        <p>${message}</p>
                    </div>
                </td>
            </tr>
        `;
    }
}

// Load and display orders
function loadOrders(filter = 'all', searchTerm = '') {
    const tableBody = document.getElementById('ordersTableBody');
    tableBody.innerHTML = '';

    let filteredOrders = userOrders;

    // Filter by status
    if (filter !== 'all') {
        filteredOrders = filteredOrders.filter(order => order.status === filter);
    }

    // Filter by search term
    if (searchTerm.trim() !== '') {
        const term = searchTerm.toLowerCase();
        filteredOrders = filteredOrders.filter(order => 
            order.userName.toLowerCase().includes(term) ||
            order.email.toLowerCase().includes(term) ||
            order.id.toLowerCase().includes(term)
        );
    }

    // Display orders or empty state
    if (filteredOrders.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 2rem;">
                    <div class="empty-state">
                        <i class="fas fa-inbox"></i>
                        <p>No orders found</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    filteredOrders.forEach((order, index) => {
        const row = createOrderRow(order, index);
        tableBody.appendChild(row);
    });
}

// Create order table row
function createOrderRow(order, index) {
    const row = document.createElement('tr');
    row.style.animation = `slideUp 0.3s ease-out ${index * 0.05}s backwards`;

    const statusClass = order.status.toLowerCase();
    const dueAmountClass = order.dueAmount > 0 ? 'negative' : 'positive';

    row.innerHTML = `
        <td><strong>${order.id}</strong></td>
        <td>${order.userName}</td>
        <td>${order.email}</td>
        <td>${order.servicePlan}</td>
        <td class="amount-cell">$${order.totalAmount.toFixed(2)}</td>
        <td class="amount-cell ${dueAmountClass}">$${order.dueAmount.toFixed(2)}</td>
        <td>
            <span class="status-badge ${statusClass}">
                ${capitalizeFirst(order.status)}
            </span>
        </td>
        <td>
            <div class="action-buttons">
                <button class="action-btn" onclick="viewOrderDetails('${order.id}')">
                    <i class="fas fa-eye"></i> View
                </button>
                <button class="action-btn" onclick="downloadInvoice('${order.id}')">
                    <i class="fas fa-download"></i> Invoice
                </button>
            </div>
        </td>
    `;

    return row;
}

// View order details in modal
function viewOrderDetails(orderId) {
    const order = userOrders.find(o => o.id === orderId);
    if (!order) return;

    const modal = document.getElementById('orderModal');
    const modalBody = document.getElementById('orderModalBody');

    const dueAmountClass = order.dueAmount > 0 ? 'negative' : 'positive';

    modalBody.innerHTML = `
        <div class="detail-section">
            <h3>Order Information</h3>
            <div class="detail-row">
                <label>Order ID:</label>
                <value>${order.id}</value>
            </div>
            <div class="detail-row">
                <label>Order Date:</label>
                <value>${order.date}</value>
            </div>
            <div class="detail-row">
                <label>Status:</label>
                <value>
                    <span class="status-badge ${order.status.toLowerCase()}">
                        ${capitalizeFirst(order.status)}
                    </span>
                </value>
            </div>
        </div>

        <div class="detail-section">
            <h3>Customer Information</h3>
            <div class="detail-row">
                <label>Customer Name:</label>
                <value>${order.userName}</value>
            </div>
            <div class="detail-row">
                <label>Email:</label>
                <value>${order.email}</value>
            </div>
        </div>

        <div class="detail-section">
            <h3>Service Details</h3>
            <div class="detail-row">
                <label>Service Plan:</label>
                <value>${order.servicePlan}</value>
            </div>
        </div>

        <div class="detail-section">
            <h3>Payment Information</h3>
            <div class="detail-row">
                <label>Total Amount:</label>
                <value><strong>$${order.totalAmount.toFixed(2)}</strong></value>
            </div>
            <div class="detail-row">
                <label>Due Amount:</label>
                <value class="amount-cell ${dueAmountClass}"><strong>$${order.dueAmount.toFixed(2)}</strong></value>
            </div>
        </div>

        <div class="detail-section">
            <h3>Description</h3>
            <p style="padding: 0.75rem 0;">${order.description}</p>
        </div>
    `;

    modal.style.display = 'block';
}

// Download invoice
function downloadInvoice(orderId) {
    const order = userOrders.find(o => o.id === orderId);
    if (!order) return;

    showNotification(`Downloading invoice for order ${orderId}...`, 'success');
    console.log('Invoice downloaded for:', order.id);
    
    // Simulate invoice generation (in real app, this would generate/download a PDF)
    setTimeout(() => {
        showNotification(`Invoice for ${order.id} ready!`, 'success');
    }, 1000);
}

// Setup event listeners
function setupEventListeners() {
    // Status filter
    const statusFilter = document.getElementById('statusFilter');
    statusFilter.addEventListener('change', function() {
        const searchTerm = document.getElementById('searchFilter').value;
        loadOrders(this.value, searchTerm);
    });

    // Search filter
    const searchFilter = document.getElementById('searchFilter');
    searchFilter.addEventListener('input', function() {
        const status = document.getElementById('statusFilter').value;
        loadOrders(status, this.value);
    });

    // Modal close button
    const modal = document.getElementById('orderModal');
    const closeBtn = document.querySelector('.close');
    
    closeBtn.onclick = function() {
        modal.style.display = 'none';
    }

    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    }
}

// Update summary statistics
function updateSummaryStats() {
    const totalOrders = userOrders.length;
    const pendingCount = userOrders.filter(o => o.status === 'pending').length;
    const processingCount = userOrders.filter(o => o.status === 'processing').length;
    const deliveredCount = userOrders.filter(o => o.status === 'delivered').length;
    const totalRevenue = userOrders.reduce((sum, order) => sum + order.totalAmount, 0);

    document.getElementById('totalOrders').textContent = totalOrders;
    document.getElementById('pendingCount').textContent = pendingCount;
    document.getElementById('processingCount').textContent = processingCount;
    document.getElementById('deliveredCount').textContent = deliveredCount;
    document.getElementById('totalRevenue').textContent = `$${totalRevenue.toFixed(2)}`;
}

// Setup sidebar navigation
function setupSidebarNavigation() {
    const menuItems = document.querySelectorAll('.sidebar-content .menu-item');
    menuItems.forEach(item => {
        item.addEventListener('click', function() {
            // Remove active class from all items
            menuItems.forEach(m => m.classList.remove('active'));
            // Add active class to clicked item
            this.classList.add('active');
        });
    });
}

// Show notifications
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        background-color: ${type === 'success' ? '#16a34a' : type === 'error' ? '#dc2626' : '#0284c7'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
        z-index: 1001;
        animation: slideInNotification 0.3s ease-out;
        max-width: 300px;
        font-weight: 600;
    `;
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOutNotification 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Helper function to capitalize first letter
function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// Add animation styles
const style = document.createElement('style');
style.innerHTML = `
    @keyframes slideInNotification {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes slideOutNotification {
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

console.log('Orders page initialized successfully!');
