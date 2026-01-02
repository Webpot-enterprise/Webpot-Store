// Admin Dashboard Variables
const ADMIN_KEY = 'WebpotAdmin2026';
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzVFw6UYPH-_mB4Yf67PjnFcigs96WwgNhphaJU1WYIxEFqGIsFWr77e6DYHgSDYiBr/exec';

let allOrders = [];

// Admin Login Handler
function adminLogin(event) {
    event.preventDefault();
    
    const passwordInput = document.getElementById('adminPassword');
    const password = passwordInput.value.trim();
    const errorDiv = document.getElementById('loginError');
    
    if (password === ADMIN_KEY) {
        // Hide login section, show dashboard
        document.getElementById('loginSection').style.display = 'none';
        document.getElementById('dashboardSection').style.display = 'block';
        
        // Load all orders
        loadAllOrders();
        
        // Clear password field
        passwordInput.value = '';
        errorDiv.style.display = 'none';
    } else {
        // Show error
        errorDiv.style.display = 'block';
        passwordInput.focus();
        passwordInput.select();
    }
}

// Admin Logout Handler
function adminLogout() {
    if (confirm('Are you sure you want to logout?')) {
        document.getElementById('dashboardSection').style.display = 'none';
        document.getElementById('loginSection').style.display = 'flex';
        document.getElementById('adminPassword').value = '';
        document.getElementById('adminPassword').focus();
        allOrders = [];
    }
}

// Load All Orders from Backend
function loadAllOrders() {
    const payload = {
        action: 'get_all_orders',
        adminKey: ADMIN_KEY
    };
    
    fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify(payload)
    })
    .then(res => res.json())
    .then(data => {
        if (data.status === 'success') {
            allOrders = data.orders;
            renderOrdersTable();
            updateStats();
        } else {
            alert('Error loading orders: ' + data.message);
        }
    })
    .catch(err => {
        console.error('Error:', err);
        alert('Failed to load orders. Please try again.');
    });
}

// Render Orders Table
function renderOrdersTable() {
    const tableBody = document.getElementById('ordersTableBody');
    
    if (allOrders.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="11" style="text-align: center; padding: 2rem; color: #888888;">No orders found.</td></tr>';
        return;
    }
    
    tableBody.innerHTML = '';
    
    allOrders.forEach(order => {
        const orderDate = new Date(order.date).toLocaleDateString('en-IN');
        const totalAmount = parseFloat(order.totalAmount) || 0;
        const paidAmount = parseFloat(order.paidAmount) || 0;
        const dueAmount = parseFloat(order.dueAmount) || 0;
        const status = order.status || 'Pending';
        
        // Determine status badge class
        let statusClass = 'status-pending';
        if (status === 'Active') statusClass = 'status-active';
        else if (status === 'Completed') statusClass = 'status-completed';
        else if (status === 'Partial') statusClass = 'status-partial';
        
        // Action button - only show if not Active
        let actionHTML = '';
        if (status !== 'Active') {
            actionHTML = `<button class="btn-approve" onclick="approveOrder('${order.orderId}', '${order.email}')">Approve</button>`;
        } else {
            actionHTML = '<span style="color: #888888;">—</span>';
        }
        
        const row = `
            <tr>
                <td>${orderDate}</td>
                <td><strong>${order.orderId}</strong></td>
                <td>${order.name}</td>
                <td>${order.email}</td>
                <td>${order.service}</td>
                <td>₹${totalAmount.toLocaleString('en-IN')}</td>
                <td>₹${paidAmount.toLocaleString('en-IN')}</td>
                <td>₹${dueAmount.toLocaleString('en-IN')}</td>
                <td>${order.transactionId || '—'}</td>
                <td><span class="status-badge ${statusClass}">${status}</span></td>
                <td>${actionHTML}</td>
            </tr>
        `;
        tableBody.innerHTML += row;
    });
}

// Approve / Activate Order
function approveOrder(orderId, email) {
    if (!confirm(`Are you sure you want to approve order ${orderId}?`)) {
        return;
    }
    
    const payload = {
        action: 'update_status',
        adminKey: ADMIN_KEY,
        orderId: orderId,
        status: 'Active'
    };
    
    fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify(payload)
    })
    .then(res => res.json())
    .then(data => {
        if (data.status === 'success') {
            alert('Order approved! User notification email has been sent.');
            
            // Update the local order object
            const order = allOrders.find(o => o.orderId === orderId);
            if (order) {
                order.status = 'Active';
            }
            
            // Re-render table
            renderOrdersTable();
            updateStats();
        } else {
            alert('Error updating status: ' + data.message);
        }
    })
    .catch(err => {
        console.error('Error:', err);
        alert('Failed to update order status. Please try again.');
    });
}

// Update Statistics
function updateStats() {
    let totalOrders = allOrders.length;
    let activeOrders = allOrders.filter(o => o.status === 'Active').length;
    let pendingOrders = allOrders.filter(o => o.status === 'Pending').length;
    let totalRevenue = allOrders.reduce((sum, o) => sum + (parseFloat(o.paidAmount) || 0), 0);
    
    document.getElementById('totalOrders').textContent = totalOrders;
    document.getElementById('activeOrders').textContent = activeOrders;
    document.getElementById('pendingOrders').textContent = pendingOrders;
    document.getElementById('totalRevenue').textContent = '₹' + totalRevenue.toLocaleString('en-IN');
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    // Focus on password input
    document.getElementById('adminPassword').focus();
});
