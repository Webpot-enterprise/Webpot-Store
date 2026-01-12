// Admin Dashboard JavaScript
const API_URL = 'https://script.google.com/macros/s/AKfycbyU1wfah__RUdCWmW4mBf1kvCgThl_wwEsqeQhXmtzPq50BSyWjjqph8rpd0ARU5TIx/exec';

// Global data storage
let allUsers = [];
let allOrders = [];

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    setupEventListeners();
    loadDashboardData();
});

// Check authentication
function checkAuth() {
    const authToken = localStorage.getItem('webpotAdminAuth');
    if (!authToken) {
        alert('Unauthorized access. Please login.');
        window.location.href = '../auth.html';
        return false;
    }
    return true;
}

// Setup event listeners
function setupEventListeners() {
    // Sidebar navigation
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const section = this.getAttribute('data-section');
            if (section === 'logout') {
                logout();
                return;
            }
            showSection(section);
        });
    });

    // Mobile sidebar toggle
    const toggleBtn = document.getElementById('toggleSidebar');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', function() {
            document.querySelector('.sidebar').classList.toggle('open');
        });
    }

    const mobileSidebarToggle = document.getElementById('mobileSidebarToggle');
    if (mobileSidebarToggle) {
        mobileSidebarToggle.addEventListener('click', function() {
            document.querySelector('.sidebar').classList.toggle('open');
        });
    }

    // Search functionality
    document.getElementById('usersSearch').addEventListener('keyup', filterUsersTable);
    document.getElementById('ordersSearch').addEventListener('keyup', filterOrdersTable);

    // Modal handling
    setupModalListeners();

    // Logout button
    document.getElementById('logoutBtn').addEventListener('click', function(e) {
        e.preventDefault();
        logout();
    });
}

// Load all dashboard data
async function loadDashboardData() {
    try {
        // Fetch users
        const usersResponse = await fetch(API_URL + '?action=get_users');
        const usersData = await usersResponse.json();
        allUsers = usersData.data || [];

        // Fetch orders
        const ordersResponse = await fetch(API_URL + '?action=get_orders');
        const ordersData = await ordersResponse.json();
        allOrders = ordersData.data || [];

        // Update dashboard
        updateDashboardStats();
        renderUsersTable();
        renderOrdersTable();
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        alert('Failed to load data. Please refresh the page.');
    }
}

// Update dashboard statistics
function updateDashboardStats() {
    const totalUsers = allUsers.length;
    const totalOrders = allOrders.length;
    const activeUsers = allUsers.filter(u => u[5] && u[5].toLowerCase() !== 'banned').length;
    const pendingOrders = allOrders.filter(o => o[6] && o[6].toLowerCase() === 'pending').length;

    document.getElementById('totalUsers').textContent = totalUsers;
    document.getElementById('totalOrders').textContent = totalOrders;
    document.getElementById('activeUsers').textContent = activeUsers;
    document.getElementById('pendingOrders').textContent = pendingOrders;
}

// Render users table
function renderUsersTable() {
    const tbody = document.getElementById('usersTableBody');
    tbody.innerHTML = '';

    if (allUsers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="loading">No users found</td></tr>';
        return;
    }

    allUsers.forEach((user, index) => {
        const row = document.createElement('tr');
        const profilePic = user[10] || 'https://via.placeholder.com/32';
        const status = user[5] || 'inactive';
        const statusClass = status.toLowerCase() === 'banned' ? 'banned' : (status.toLowerCase() === 'active' ? 'active' : 'inactive');

        row.innerHTML = `
            <td><img src="${profilePic}" alt="Profile" class="profile-pic" onerror="this.src='https://via.placeholder.com/32'"></td>
            <td>${user[1] || '-'}</td>
            <td>${user[2] || '-'}</td>
            <td>${user[4] || '-'}</td>
            <td><span class="status-badge ${statusClass}"></span><span class="status-text">${status}</span></td>
            <td><code>${user[7] || '-'}</code></td>
            <td>$${user[9] || '0'}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn-secondary" onclick="openBanModal('${user[2]}', '${user[1]}')">Ban</button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Render orders table
function renderOrdersTable() {
    const tbody = document.getElementById('ordersTableBody');
    tbody.innerHTML = '';

    if (allOrders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="loading">No orders found</td></tr>';
        return;
    }

    allOrders.forEach((order, index) => {
        const row = document.createElement('tr');
        // Order structure: 0=ID, 1=ClientName, 2=Service, 3=TotalAmount, 4=Paid, 5=Due, 6=PaymentStatus, 7=TransactionID
        const status = order[6] || 'pending';
        
        row.innerHTML = `
            <td><strong>${order[0] || '-'}</strong></td>
            <td>${order[1] || '-'}</td>
            <td>${order[2] || '-'}</td>
            <td>$${order[3] || '0'}</td>
            <td>$${order[4] || '0'}</td>
            <td>$${order[5] || '0'}</td>
            <td><span class="status-text">${status}</span></td>
            <td><code>${order[7] || '-'}</code></td>
            <td>
                <div class="action-buttons">
                    <button class="btn-primary" onclick="openStatusModal('${order[0]}')">Update</button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Filter users table
function filterUsersTable() {
    const searchTerm = document.getElementById('usersSearch').value.toLowerCase();
    const tbody = document.getElementById('usersTableBody');
    const rows = tbody.querySelectorAll('tr');

    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
}

// Filter orders table
function filterOrdersTable() {
    const searchTerm = document.getElementById('ordersSearch').value.toLowerCase();
    const tbody = document.getElementById('ordersTableBody');
    const rows = tbody.querySelectorAll('tr');

    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
}

// Show section
function showSection(sectionName) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));

    // Show selected section
    document.getElementById(sectionName).classList.add('active');
    document.querySelector(`[data-section="${sectionName}"]`).classList.add('active');

    // Update page title
    const titles = {
        'dashboard': 'Dashboard',
        'orders': 'Orders Management',
        'users': 'Users Management',
        'reviews': 'Reviews'
    };
    document.getElementById('pageTitle').textContent = titles[sectionName] || 'Dashboard';

    // Close sidebar on mobile
    if (window.innerWidth <= 768) {
        document.querySelector('.sidebar').classList.remove('open');
    }
}

// Modal functions
function setupModalListeners() {
    // Status modal
    const statusModal = document.getElementById('statusModal');
    const statusForm = document.getElementById('statusForm');
    const statusClose = statusModal.querySelector('.close');

    statusClose.addEventListener('click', () => statusModal.style.display = 'none');
    statusForm.addEventListener('submit', handleStatusUpdate);

    // Ban modal
    const banModal = document.getElementById('banModal');
    const banForm = document.getElementById('banForm');
    const banClose = banModal.querySelector('.close');

    banClose.addEventListener('click', () => banModal.style.display = 'none');
    banForm.addEventListener('submit', handleBanUser);

    // Close modal when clicking outside
    window.addEventListener('click', function(e) {
        if (e.target === statusModal) statusModal.style.display = 'none';
        if (e.target === banModal) banModal.style.display = 'none';
    });
}

function openStatusModal(orderId) {
    document.getElementById('orderIdInput').value = orderId;
    document.getElementById('statusSelect').value = '';
    document.getElementById('statusModal').style.display = 'flex';
}

function openBanModal(email, name) {
    document.getElementById('userEmailInput').value = email;
    document.getElementById('banConfirmText').textContent = `Are you sure you want to ban the user "${name}" (${email})?`;
    document.getElementById('banModal').style.display = 'flex';
}

async function handleStatusUpdate(e) {
    e.preventDefault();
    const orderId = document.getElementById('orderIdInput').value;
    const newStatus = document.getElementById('statusSelect').value;

    if (!newStatus) {
        alert('Please select a status');
        return;
    }

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            body: JSON.stringify({
                action: 'update_status',
                orderId: orderId,
                newStatus: newStatus
            })
        });

        const result = await response.json();
        if (result.success) {
            alert('Order status updated successfully');
            document.getElementById('statusModal').style.display = 'none';
            loadDashboardData();
        } else {
            alert('Error updating status: ' + (result.message || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error updating status:', error);
        alert('Failed to update status');
    }
}

async function handleBanUser(e) {
    e.preventDefault();
    const email = document.getElementById('userEmailInput').value;

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            body: JSON.stringify({
                action: 'ban_user',
                email: email
            })
        });

        const result = await response.json();
        if (result.success) {
            alert('User banned successfully');
            document.getElementById('banModal').style.display = 'none';
            loadDashboardData();
        } else {
            alert('Error banning user: ' + (result.message || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error banning user:', error);
        alert('Failed to ban user');
    }
}

// Logout function
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('webpotAdminAuth');
        window.location.href = '../auth.html';
    }
}
