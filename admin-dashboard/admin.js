// Admin Dashboard JavaScript
// Hardcoded credentials
const ADMIN_CREDENTIALS = {
    username: 'Webpot-Admin',
    password: 'webpot.2026!!'
};

// Global data storage
let allUsers = [];
let allOrders = [];

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is already logged in
    const isAuthenticated = localStorage.getItem('webpotAdminAuth') === 'true';
    
    if (isAuthenticated) {
        // User is logged in, show dashboard
        showDashboard();
    } else {
        // User is not logged in, setup login form
        setupLoginForm();
    }
});

// Setup login form
function setupLoginForm() {
    const loginForm = document.getElementById('loginForm');
    const errorMessage = document.getElementById('errorMessage');
    
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        // Validate credentials
        if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
            // Credentials are correct
            localStorage.setItem('webpotAdminAuth', 'true');
            localStorage.setItem('webpotAdminLoginTime', new Date().toISOString());
            
            // Hide login page and show dashboard
            showDashboard();
        } else {
            // Invalid credentials
            errorMessage.textContent = 'Invalid username or password. Please try again.';
            errorMessage.classList.add('show');
            
            // Clear password field
            document.getElementById('password').value = '';
        }
    });
}

// Show dashboard after login
function showDashboard() {
    // Hide login page
    document.getElementById('loginPage').style.display = 'none';
    
    // Show dashboard content
    const dashboardContent = document.getElementById('dashboardContent');
    dashboardContent.classList.add('show');
    dashboardContent.style.display = 'block';
    
    // Initialize dashboard
    setupNavigation();
    setupEventListeners();
    loadDashboardData();
}

// Check authentication
function checkAuth() {
    const authToken = localStorage.getItem('webpotAdminAuth');
    if (!authToken || authToken !== 'true') {
        // Redirect to login
        document.getElementById('loginPage').style.display = 'flex';
        document.getElementById('dashboardContent').style.display = 'none';
        return false;
    }
    return true;
}

// Setup robust navigation
function setupNavigation() {
    document.querySelectorAll('.nav-item').forEach(link => {
        link.addEventListener('click', (e) => {
            if (link.id === 'logoutBtn') {
                e.preventDefault();
                logout();
                return;
            }
            e.preventDefault();
            
            // Remove active class from all items
            document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
            
            // Hide all sections
            document.querySelectorAll('.dashboard-section').forEach(s => s.style.display = 'none');
            
            // Add active class to clicked item
            link.classList.add('active');
            
            // Show target section
            const target = document.getElementById(link.getAttribute('data-section'));
            if (target) {
                target.style.display = 'block';
                updatePageTitle(link.getAttribute('data-section'));
            }
        });
    });
}

// Update page title based on section
function updatePageTitle(section) {
    const titles = {
        'dashboard': 'Dashboard',
        'orders': 'Orders Management',
        'users': 'Users Management',
        'reviews': 'Reviews'
    };
    document.getElementById('pageTitle').textContent = titles[section] || 'Dashboard';
}

// Setup event listeners
function setupEventListeners() {
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
}

// Load all dashboard data
async function loadDashboardData() {
    try {
        // Show loading state
        document.getElementById('pageTitle').textContent = 'Loading...';
        
        // Fetch users
        const usersResponse = await fetch(WEBPOT_CONFIG.API_URL + '?action=get_all_users');
        const usersData = await usersResponse.json();
        allUsers = usersData.data || [];

        // Fetch orders
        const ordersResponse = await fetch(WEBPOT_CONFIG.API_URL + '?action=get_all_orders');
        const ordersData = await ordersResponse.json();
        allOrders = ordersData.data || [];

        // Update dashboard
        updateDashboardStats();
        renderUsersTable();
        renderOrdersTable();
        
        // Update page title back
        updatePageTitle('dashboard');
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        alert('Failed to load data. Please refresh the page.');
    }
}

// Update dashboard statistics
function updateDashboardStats() {
    const totalUsers = allUsers.length;
    const totalOrders = allOrders.length;
    const activeUsers = allUsers.filter(u => u.status && u.status.toLowerCase() !== 'banned').length;
    const pendingOrders = allOrders.filter(o => o.status && o.status.toLowerCase() === 'pending').length;

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
        const profilePic = user.profilePic || 'https://via.placeholder.com/32';
        const status = user.status || 'inactive';
        const statusClass = status.toLowerCase() === 'banned' ? 'banned' : (status.toLowerCase() === 'active' ? 'active' : 'inactive');

        row.innerHTML = `
            <td><img src="${profilePic}" alt="Profile" class="profile-pic" onerror="this.src='https://via.placeholder.com/32'"></td>
            <td>${user.name || '-'}</td>
            <td>${user.email || '-'}</td>
            <td>${user.phone || '-'}</td>
            <td><span class="status-badge ${statusClass}"></span><span class="status-text">${status}</span></td>
            <td><code>${user.referralCode || '-'}</code></td>
            <td>₹${user.walletBalance || '0'}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn-secondary" onclick="openBanModal('${user.email}', '${user.name}')">Ban</button>
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
        const status = order.status || 'pending';
        const statusClass = getStatusClass(status);
        
        row.innerHTML = `
            <td><strong>${order.orderId || '-'}</strong></td>
            <td>${order.clientName || '-'}</td>
            <td>${order.serviceType || '-'}</td>
            <td>₹${order.totalAmount || '0'}</td>
            <td>₹${order.paidAmount || '0'}</td>
            <td>₹${order.dueAmount || '0'}</td>
            <td><span class="status-badge ${statusClass}">${status}</span></td>
            <td><code>${order.transactionId || '-'}</code></td>
            <td>
                <div class="action-buttons">
                    <button class="btn-primary" onclick="openStatusModal('${order.orderId}')">Update</button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Get status class for styling
function getStatusClass(status) {
    const statusLower = status.toLowerCase();
    if (statusLower === 'completed' || statusLower === 'success') return 'success';
    if (statusLower === 'pending') return 'pending';
    if (statusLower === 'processing') return 'processing';
    if (statusLower === 'failed' || statusLower === 'cancelled') return 'error';
    return 'pending';
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
    // Status modal - Click outside to close
    const statusModal = document.getElementById('statusModal');
    if (statusModal) {
        window.addEventListener('click', function(e) {
            if (e.target === statusModal) statusModal.style.display = 'none';
        });
    }

    // Ban modal - Click outside to close
    const banModal = document.getElementById('banModal');
    if (banModal) {
        window.addEventListener('click', function(e) {
            if (e.target === banModal) banModal.style.display = 'none';
        });
    }

    // Status form submission
    const statusForm = document.getElementById('statusForm');
    if (statusForm) {
        statusForm.addEventListener('submit', handleStatusUpdate);
    }

    // Ban form submission
    const banForm = document.getElementById('banForm');
    if (banForm) {
        banForm.addEventListener('submit', handleBanUser);
    }
}

function openStatusModal(orderId) {
    const modal = document.getElementById('statusModal');
    document.getElementById('orderIdInput').value = orderId;
    document.getElementById('statusSelect').value = '';
    modal.style.display = 'flex';
}

function openBanModal(email, name) {
    const modal = document.getElementById('banModal');
    document.getElementById('userEmailInput').value = email;
    document.getElementById('banConfirmText').textContent = `Are you sure you want to ban the user "${name}" (${email})?`;
    modal.style.display = 'flex';
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
        const url = new URL(WEBPOT_CONFIG.API_URL);
        url.searchParams.append('action', 'update_status');
        url.searchParams.append('type', 'order');
        url.searchParams.append('id', orderId);
        url.searchParams.append('status', newStatus);

        const response = await fetch(url.toString());
        const result = await response.json();
        
        if (result.status === 'success') {
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
        const url = new URL(WEBPOT_CONFIG.API_URL);
        url.searchParams.append('action', 'ban_user');
        url.searchParams.append('email', email);

        const response = await fetch(url.toString());
        const result = await response.json();
        
        if (result.status === 'success') {
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
        localStorage.removeItem('webpotAdminLoginTime');
        // Reload the page to show login form
        location.reload();
    }
}
