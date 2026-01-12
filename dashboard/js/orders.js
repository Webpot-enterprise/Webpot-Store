// =============================================
// ORDERS PAGE - JAVASCRIPT FUNCTIONALITY
// =============================================

// Sample orders data with user details
const userOrders = [
    {
        id: 'ORD-001',
        userName: 'John Doe',
        email: 'john.doe@webpot.com',
        servicePlan: 'Premium',
        totalAmount: 299.99,
        dueAmount: 0,
        status: 'delivered',
        date: 'Jan 10, 2024',
        description: 'Successfully delivered on Jan 11, 2024'
    },
    {
        id: 'ORD-002',
        userName: 'Sarah Johnson',
        email: 'sarah.j@webpot.com',
        servicePlan: 'Standard',
        totalAmount: 149.99,
        dueAmount: 0,
        status: 'shipped',
        date: 'Jan 09, 2024',
        description: 'In transit to the customer'
    },
    {
        id: 'ORD-003',
        userName: 'Michael Chen',
        email: 'michael.chen@webpot.com',
        servicePlan: 'Basic',
        totalAmount: 49.99,
        dueAmount: 49.99,
        status: 'processing',
        date: 'Jan 08, 2024',
        description: 'Being prepared for shipment'
    },
    {
        id: 'ORD-004',
        userName: 'Emily Rodriguez',
        email: 'emily.r@webpot.com',
        servicePlan: 'Premium',
        totalAmount: 299.99,
        dueAmount: 150,
        status: 'pending',
        date: 'Jan 07, 2024',
        description: 'Awaiting payment confirmation'
    },
    {
        id: 'ORD-005',
        userName: 'David Wilson',
        email: 'david.w@webpot.com',
        servicePlan: 'Standard',
        totalAmount: 149.99,
        dueAmount: 0,
        status: 'delivered',
        date: 'Jan 05, 2024',
        description: 'Delivered on Jan 06, 2024'
    },
    {
        id: 'ORD-006',
        userName: 'Lisa Anderson',
        email: 'lisa.a@webpot.com',
        servicePlan: 'Basic',
        totalAmount: 49.99,
        dueAmount: 0,
        status: 'delivered',
        date: 'Jan 03, 2024',
        description: 'Delivered on Jan 04, 2024'
    },
    {
        id: 'ORD-007',
        userName: 'Robert Brown',
        email: 'robert.b@webpot.com',
        servicePlan: 'Premium',
        totalAmount: 299.99,
        dueAmount: 299.99,
        status: 'cancelled',
        date: 'Jan 01, 2024',
        description: 'Cancelled by customer'
    },
    {
        id: 'ORD-008',
        userName: 'Jennifer Lee',
        email: 'jennifer.lee@webpot.com',
        servicePlan: 'Standard',
        totalAmount: 149.99,
        dueAmount: 75,
        status: 'pending',
        date: 'Dec 30, 2023',
        description: 'Awaiting payment'
    },
    {
        id: 'ORD-009',
        userName: 'Thomas Martinez',
        email: 'thomas.m@webpot.com',
        servicePlan: 'Basic',
        totalAmount: 49.99,
        dueAmount: 0,
        status: 'delivered',
        date: 'Dec 28, 2023',
        description: 'Delivered on Dec 29, 2023'
    },
    {
        id: 'ORD-010',
        userName: 'Amanda Taylor',
        email: 'amanda.t@webpot.com',
        servicePlan: 'Premium',
        totalAmount: 299.99,
        dueAmount: 0,
        status: 'shipped',
        date: 'Dec 25, 2023',
        description: 'Out for delivery'
    }
];

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    loadOrders();
    setupEventListeners();
    updateSummaryStats();
    setupSidebarNavigation();
});

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
