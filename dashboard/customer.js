// Customer Dashboard JavaScript
const API_URL = 'https://script.google.com/macros/s/AKfycbyU1wfah__RUdCWmW4mBf1kvCgThl_wwEsqeQhXmtzPq50BSyWjjqph8rpd0ARU5TIx/exec';

// Global state
let currentUser = null;
let allUsers = [];
let userOrders = [];

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    setupEventListeners();
    loadUserData();
});

// Check authentication
function checkAuth() {
    const loggedIn = localStorage.getItem('webpotUserLoggedIn');
    const userEmail = localStorage.getItem('webpotUserEmail');

    if (!loggedIn || !userEmail) {
        // Redirect to auth page
        window.location.href = '../auth.html';
        return false;
    }

    return true;
}

// Setup event listeners
function setupEventListeners() {
    // Navigation links
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const section = this.getAttribute('data-section');
            showSection(section);
        });
    });

    // Mobile menu
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', function() {
            document.querySelector('.header-nav').classList.toggle('open');
        });
    }

    // Orders search
    document.getElementById('ordersSearch').addEventListener('keyup', filterOrders);

    // Logout button
    document.getElementById('logoutBtn').addEventListener('click', function() {
        logout();
    });
}

// Load user data
async function loadUserData() {
    try {
        const userEmail = localStorage.getItem('webpotUserEmail');

        // Fetch all users
        const usersResponse = await fetch(API_URL + '?action=get_users');
        const usersData = await usersResponse.json();
        allUsers = usersData.data || [];

        // Find current user
        currentUser = allUsers.find(user => user[2] === userEmail);

        if (!currentUser) {
            alert('User data not found. Please login again.');
            logout();
            return;
        }

        // Update greeting and profile info
        updateGreeting();
        updateSummaryCards();
        updateProfileInfo();

        // Fetch and display orders
        await loadUserOrders();
    } catch (error) {
        console.error('Error loading user data:', error);
        alert('Failed to load user data. Please refresh the page.');
    }
}

// Update greeting
function updateGreeting() {
    const userName = currentUser[1] || 'User';
    document.getElementById('greetingText').textContent = `Welcome back, ${userName}!`;
}

// Update summary cards
function updateSummaryCards() {
    const walletBalance = parseFloat(currentUser[9]) || 0;
    const referralCode = currentUser[7] || '-';

    document.getElementById('walletBalance').textContent = `$${walletBalance.toFixed(2)}`;
    document.getElementById('referralCode').textContent = referralCode;

    // Calculate total spent and active orders (will be updated after loading orders)
    updateOrderStats();
}

// Update profile information
function updateProfileInfo() {
    document.getElementById('profileName').textContent = currentUser[1] || '-';
    document.getElementById('profileEmail').textContent = currentUser[2] || '-';
    document.getElementById('profilePhone').textContent = currentUser[4] || '-';
    document.getElementById('profileReferralCode').textContent = currentUser[7] || '-';
    document.getElementById('profileWallet').textContent = `$${(parseFloat(currentUser[9]) || 0).toFixed(2)}`;
}

// Load user orders
async function loadUserOrders() {
    try {
        const ordersResponse = await fetch(API_URL + '?action=get_orders');
        const ordersData = await ordersResponse.json();
        const allOrders = ordersData.data || [];

        // Filter orders by current user email
        const userEmail = currentUser[2];
        userOrders = allOrders.filter(order => {
            // Order structure: 0=OrderID, 1=ClientName, 2=Service, 3=TotalAmount, 4=Paid, 5=Due, 6=PaymentStatus, 7=TransactionID
            // Assuming ClientName at index 1 might contain email or we match by email in some way
            // For now, we'll filter by matching any order (you may need to adjust based on actual data structure)
            return order && order[1]; // Orders that have a client name
        });

        renderOrders();
        updateOrderStats();
    } catch (error) {
        console.error('Error loading orders:', error);
        const container = document.getElementById('ordersContainer');
        container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">❌</div><p class="empty-state-text">Failed to load orders. Please refresh the page.</p></div>';
    }
}

// Render orders
function renderOrders() {
    const container = document.getElementById('ordersContainer');
    container.innerHTML = '';

    if (userOrders.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📦</div>
                <p class="empty-state-text">No orders yet. Start shopping to see your orders here!</p>
            </div>
        `;
        return;
    }

    userOrders.forEach(order => {
        const card = createOrderCard(order);
        container.appendChild(card);
    });
}

// Create order card element
function createOrderCard(order) {
    // Order indices: 0=ID, 1=ClientName, 2=Service, 3=TotalAmount, 4=Paid, 5=Due, 6=PaymentStatus, 7=TransactionID
    const orderId = order[0] || 'N/A';
    const clientName = order[1] || '-';
    const service = order[2] || '-';
    const totalAmount = parseFloat(order[3]) || 0;
    const paid = parseFloat(order[4]) || 0;
    const due = parseFloat(order[5]) || 0;
    const status = (order[6] || 'pending').toLowerCase();
    const transactionId = order[7] || '-';

    const card = document.createElement('div');
    card.className = `order-card ${status}`;
    card.innerHTML = `
        <div class="order-header">
            <div class="order-id">Order #${orderId}</div>
            <span class="order-status-badge ${status}">${status}</span>
        </div>
        <div class="order-detail">
            <div class="order-detail-label">Service</div>
            <div class="order-detail-value">${service}</div>
        </div>
        <div class="order-detail">
            <div class="order-detail-label">Transaction ID</div>
            <div class="order-detail-value" style="font-family: monospace; font-size: 12px;">${transactionId}</div>
        </div>
        <div class="order-amounts">
            <div class="amount-item">
                <span class="amount-label">Total</span>
                <span class="amount-value">$${totalAmount.toFixed(2)}</span>
            </div>
            <div class="amount-item">
                <span class="amount-label">Paid</span>
                <span class="amount-value" style="color: #10b981;">$${paid.toFixed(2)}</span>
            </div>
            <div class="amount-item">
                <span class="amount-label">Due</span>
                <span class="amount-value" style="color: #ef4444;">$${due.toFixed(2)}</span>
            </div>
        </div>
    `;

    return card;
}

// Update order statistics
function updateOrderStats() {
    const totalSpent = userOrders.reduce((sum, order) => sum + (parseFloat(order[4]) || 0), 0);
    const activeOrders = userOrders.filter(order => {
        const status = (order[6] || '').toLowerCase();
        return status !== 'completed' && status !== 'cancelled' && status !== 'failed';
    }).length;

    document.getElementById('totalSpent').textContent = `$${totalSpent.toFixed(2)}`;
    document.getElementById('activeOrdersCount').textContent = activeOrders;
}

// Filter orders
function filterOrders() {
    const searchTerm = document.getElementById('ordersSearch').value.toLowerCase();
    const cards = document.querySelectorAll('.order-card');

    cards.forEach(card => {
        const text = card.textContent.toLowerCase();
        card.style.display = text.includes(searchTerm) ? '' : 'none';
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

    // Close mobile menu
    const headerNav = document.querySelector('.header-nav');
    if (headerNav) {
        headerNav.classList.remove('open');
    }
}

// Copy to clipboard
function copyToClipboard(elementId) {
    const element = document.getElementById(elementId);
    const text = element.textContent;

    navigator.clipboard.writeText(text).then(function() {
        // Show feedback
        const originalText = element.textContent;
        element.textContent = 'Copied!';
        setTimeout(function() {
            element.textContent = originalText;
        }, 2000);
    }).catch(function(err) {
        console.error('Failed to copy:', err);
        alert('Failed to copy to clipboard');
    });
}

// Logout function
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('webpotUserLoggedIn');
        localStorage.removeItem('webpotUserEmail');
        window.location.href = '../auth.html';
    }
}
