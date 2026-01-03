const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzy7Q-698-wKYvagSqUAWF_TiqKOOdl0hw_nVBSelY9qScQKL80km_nyXNEU08bifPL/exec';
const ADMIN_KEY = 'WebpotAdmin2026';

// Authentication Check
window.addEventListener('DOMContentLoaded', () => {
    const adminPassword = localStorage.getItem('webpotAdminAuth');
    if (adminPassword !== ADMIN_KEY) {
        const pass = prompt('Enter Admin Password:');
        if (pass === ADMIN_KEY) {
            localStorage.setItem('webpotAdminAuth', ADMIN_KEY);
            initAdmin();
        } else {
            alert('Invalid password');
            window.location.href = '../index.html';
        }
    } else {
        initAdmin();
    }
});

function initAdmin() {
    setupSidebarNavigation();
    loadAllOrders();
    loadAllUsers();
    loadAllReviews();
}

function setupSidebarNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            if (item.getAttribute('onclick') !== 'logoutAdmin()') {
                e.preventDefault();
                const section = item.getAttribute('data-section');
                if (section) {
                    switchAdminSection(section);
                    navItems.forEach(ni => ni.classList.remove('active'));
                    item.classList.add('active');
                }
            }
        });
    });
}

function switchAdminSection(sectionName) {
    const sections = document.querySelectorAll('.admin-section');
    sections.forEach(section => section.classList.remove('active'));
    const activeSection = document.getElementById(sectionName);
    if (activeSection) activeSection.classList.add('active');
}

function logoutAdmin() {
    localStorage.removeItem('webpotAdminAuth');
    window.location.href = '../index.html';
}

// ============== ORDERS MANAGEMENT ==============

function loadAllOrders() {
    fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify({
            action: 'get_all_orders',
            adminKey: ADMIN_KEY
        })
    })
    .then(res => res.json())
    .then(data => {
        if (data.status === 'success') {
            populateOrdersTable(data.orders);
        } else {
            alert('Error loading orders: ' + data.message);
        }
    })
    .catch(err => console.error('Error:', err));
}

function populateOrdersTable(orders) {
    const tbody = document.getElementById('ordersBody');
    tbody.innerHTML = '';

    if (orders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8">No orders found</td></tr>';
        return;
    }

    orders.forEach(order => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${new Date(order.date).toLocaleDateString('en-IN')}</td>
            <td>${order.orderId}</td>
            <td>${order.name}</td>
            <td>${order.email}</td>
            <td>${order.service}</td>
            <td>₹${parseFloat(order.totalAmount).toFixed(2)}</td>
            <td>
                <select onchange="updateOrderStatus('${order.orderId}', this.value)">
                    <option value="${order.status}" selected>${order.status}</option>
                    <option value="Active">Active</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Pending">Pending</option>
                </select>
            </td>
            <td>
                <button class="action-btn" onclick="viewOrderDetails('${order.orderId}')">View</button>
            </td>
        `;
    });
}

function updateOrderStatus(orderId, newStatus) {
    fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify({
            action: 'update_status',
            orderId: orderId,
            status: newStatus,
            adminKey: ADMIN_KEY
        })
    })
    .then(res => res.json())
    .then(data => {
        if (data.status === 'success') {
            alert('Order status updated');
            loadAllOrders();
        } else {
            alert('Error: ' + data.message);
        }
    })
    .catch(err => console.error('Error:', err));
}

function viewOrderDetails(orderId) {
    alert('Order ID: ' + orderId + '\nDetailed view to be implemented');
}

// ============== USER MANAGEMENT ==============

function loadAllUsers() {
    fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify({
            action: 'get_all_users',
            adminKey: ADMIN_KEY
        })
    })
    .then(res => res.json())
    .then(data => {
        if (data.status === 'success') {
            populateUsersTable(data.users);
        } else {
            alert('Error loading users: ' + data.message);
        }
    })
    .catch(err => console.error('Error:', err));
}

function populateUsersTable(users) {
    const tbody = document.getElementById('usersBody');
    tbody.innerHTML = '';

    if (users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6">No users found</td></tr>';
        return;
    }

    users.forEach(user => {
        const row = tbody.insertRow();
        const statusColor = user.status === 'Banned' ? '#ff6b6b' : '#00d4ff';
        row.innerHTML = `
            <td>${user.name}</td>
            <td>${user.email}</td>
            <td>${user.phone || 'N/A'}</td>
            <td style="color: ${statusColor}; font-weight: bold;">${user.status}</td>
            <td>${new Date(user.created).toLocaleDateString('en-IN')}</td>
            <td>
                ${user.status !== 'Banned' ? 
                    `<button class="action-btn" onclick="banUser('${user.email}')">Ban User</button>` :
                    '<span style="color: #ff6b6b;">Banned</span>'
                }
            </td>
        `;
    });
}

function banUser(email) {
    if (confirm(`Are you sure you want to ban ${email}?`)) {
        fetch(APPS_SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify({
                action: 'ban_user',
                email: email,
                adminKey: ADMIN_KEY
            })
        })
        .then(res => res.json())
        .then(data => {
            if (data.status === 'success') {
                alert('User banned successfully');
                loadAllUsers();
            } else {
                alert('Error: ' + data.message);
            }
        })
        .catch(err => console.error('Error:', err));
    }
}

// ============== REVIEW MODERATION ==============

function loadAllReviews() {
    fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify({
            action: 'get_public_reviews'
        })
    })
    .then(res => res.json())
    .then(data => {
        if (data.status === 'success') {
            populateReviewsTable(data.reviews);
        } else {
            document.getElementById('reviewsBody').innerHTML = '<tr><td colspan="6">No reviews yet</td></tr>';
        }
    })
    .catch(err => console.error('Error:', err));
}

function populateReviewsTable(reviews) {
    const tbody = document.getElementById('reviewsBody');
    tbody.innerHTML = '';

    if (reviews.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6">No reviews found</td></tr>';
        return;
    }

    reviews.forEach(review => {
        const row = tbody.insertRow();
        const stars = '⭐'.repeat(review.rating);
        row.innerHTML = `
            <td>${review.name}</td>
            <td>${review.service}</td>
            <td>${stars}</td>
            <td>${review.comment.substring(0, 50)}...</td>
            <td><span style="color: #00d4ff;">Approved</span></td>
            <td>
                <button class="action-btn" onclick="viewReview('${review.name}')">View</button>
            </td>
        `;
    });
}

function viewReview(name) {
    alert('Review from: ' + name + '\nFull view to be implemented');
}
