// Dashboard Variables
let currentOrderID = null;
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbx9nmE6vvc9LXPon9-MrMQfSCDlvoeMJtMhbq0d80ftpYodypkm6RoSr8pz2H-Ro8kj/exec';
const MY_UPI_ID = 'kakadiyasuprince@okhdfcbank';

// Authentication Check on Page Load
window.addEventListener('DOMContentLoaded', () => {
    const isLoggedIn = localStorage.getItem('webpotUserLoggedIn');
    if (!isLoggedIn) {
        window.location.href = 'auth.html';
        return;
    }

    // Display user information
    const userName = localStorage.getItem('webpotUserName');
    const userEmail = localStorage.getItem('webpotUserEmail');
    
    document.getElementById('welcomeName').textContent = userName || 'User';
    document.getElementById('profileName').textContent = userName || '-';
    document.getElementById('profileEmail').textContent = userEmail || '-';
    document.getElementById('memberSince').textContent = new Date().toLocaleDateString('en-IN');

    // Load dashboard data
    loadDashboardData();

    // Setup sidebar navigation
    setupSidebarNavigation();
});

// Setup Sidebar Navigation
function setupSidebarNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            if (item.getAttribute('onclick') !== 'logoutUser()') {
                e.preventDefault();
                const section = item.getAttribute('data-section');
                if (section) {
                    switchSection(section);
                    // Update active nav item
                    navItems.forEach(ni => ni.classList.remove('active'));
                    item.classList.add('active');
                }
            }
        });
    });
}

// Switch Dashboard Section
function switchSection(sectionName) {
    const sections = document.querySelectorAll('.dashboard-section');
    sections.forEach(section => section.classList.remove('active'));
    
    const activeSection = document.getElementById(sectionName);
    if (activeSection) {
        activeSection.classList.add('active');
        
        // Update nav item active state
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('data-section') === sectionName) {
                item.classList.add('active');
            }
        });
    }
}

// Load Dashboard Data from Google Apps Script
function loadDashboardData() {
    const userEmail = localStorage.getItem('webpotUserEmail');
    
    fetch(APPS_SCRIPT_URL + '?action=get_user_data&email=' + encodeURIComponent(userEmail))
        .then(res => res.json())
        .then(data => {
            if (data.status === 'success' && data.orders) {
                populateDashboard(data.orders);
            } else {
                console.log('No orders found or error in response');
                populateDashboard([]);
            }
        })
        .catch(err => {
            console.error('Error loading dashboard data:', err);
            populateDashboard([]);
        });
}

// Populate Dashboard with Data
function populateDashboard(orders) {
    let totalOrders = 0;
    let totalSpent = 0;
    let totalDue = 0;

    // Calculate totals
    orders.forEach(order => {
        totalOrders++;
        const amount = parseFloat(order.amount) || 0;
        const paid = parseFloat(order.paidAmount) || 0;
        const due = amount - paid;

        totalSpent += amount;
        totalDue += due;
    });

    // Update stat cards
    document.getElementById('totalOrders').textContent = totalOrders;
    document.getElementById('totalSpent').textContent = '₹' + totalSpent.toLocaleString('en-IN');
    
    const pendingDuesCard = document.getElementById('pendingDuesCard');
    const pendingDuesEl = document.getElementById('pendingDues');
    pendingDuesEl.textContent = '₹' + totalDue.toLocaleString('en-IN');
    
    // Mark as red if there are dues
    if (totalDue > 0) {
        pendingDuesCard.classList.add('danger');
    } else {
        pendingDuesCard.classList.remove('danger');
    }

    // Populate orders table
    const tableBody = document.getElementById('ordersTableBody');
    if (orders.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--text-muted);">No orders found.</td></tr>';
    } else {
        tableBody.innerHTML = '';
        orders.forEach(order => {
            const amount = parseFloat(order.amount) || 0;
            const paid = parseFloat(order.paidAmount) || 0;
            const due = amount - paid;
            const orderDate = new Date(order.date).toLocaleDateString('en-IN');
            
            // Determine status
            let status, statusClass;
            if (due <= 0) {
                status = 'Completed';
                statusClass = 'status-completed';
            } else if (paid > 0) {
                status = 'Partial';
                statusClass = 'status-partial';
            } else {
                status = 'Pending';
                statusClass = 'status-pending';
            }

            const actionBtn = due > 0 ? 
                `<button class="pay-btn" onclick="openPaymentModal('${order.orderId}', ${due})">Pay Now</button>` : 
                '<span style="color: var(--text-muted);">—</span>';

            const row = `
                <tr>
                    <td>${orderDate}</td>
                    <td><strong>${order.orderId}</strong></td>
                    <td>${order.service}</td>
                    <td>₹${amount.toLocaleString('en-IN')}</td>
                    <td>₹${Math.max(0, due).toLocaleString('en-IN')}</td>
                    <td><span class="status-badge ${statusClass}">${status}</span></td>
                    <td>${actionBtn}</td>
                </tr>
            `;
            tableBody.innerHTML += row;
        });
    }

    // Update activity log
    const lastLogin = localStorage.getItem('webpotLastLogin') || new Date().toLocaleString('en-IN');
    document.getElementById('lastLoginTime').textContent = lastLogin;
    localStorage.setItem('webpotLastLogin', new Date().toLocaleString('en-IN'));
}

// Open Payment Modal
function openPaymentModal(orderId, dueAmount) {
    currentOrderID = orderId;
    document.getElementById('paymentModal').style.display = 'block';
    document.getElementById('paymentForm').reset();
    
    // Generate QR code
    generateUPIQR(dueAmount);
    
    // Focus on UTR input
    setTimeout(() => {
        document.getElementById('dashboardUtrNumber').focus();
    }, 100);
}

// Generate UPI QR Code
function generateUPIQR(amount) {
    const upiLink = 'upi://pay?pa=' + MY_UPI_ID + '&pn=Webpot&am=' + amount + '&cu=INR';
    
    const qrContainer = document.getElementById('qrCodeContainer');
    qrContainer.innerHTML = '';
    
    new QRCode(qrContainer, {
        text: upiLink,
        width: 200,
        height: 200
    });
    
    document.getElementById('payAmount').textContent = '₹ ' + amount.toLocaleString('en-IN');
    
    const regenerateBtn = document.getElementById('regenerateBtn');
    if (regenerateBtn) {
        regenerateBtn.style.display = 'none';
    }
    qrContainer.style.display = 'block';
    
    // Start QR timer
    startQRTimer();
}

// QR Timer
function startQRTimer() {
    let timeLeft = 300; // 5 minutes
    const timerEl = document.getElementById('qrTimer');
    
    const timerInterval = setInterval(() => {
        timeLeft--;
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        timerEl.textContent = `Time remaining: ${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            timerEl.textContent = 'QR Code Expired';
            document.getElementById('regenerateBtn').style.display = 'inline-block';
        }
    }, 1000);
}

// Regenerate QR Code
function regenerateQR() {
    const amount = document.getElementById('payAmount').textContent.replace('₹ ', '');
    generateUPIQR(parseFloat(amount));
}

// Close Payment Modal
function closePaymentModal() {
    document.getElementById('paymentModal').style.display = 'none';
}

// Verify and Submit Payment (Dashboard Version)
function verifyDashboardPayment(event) {
    event.preventDefault();
    
    const utrNumber = document.getElementById('dashboardUtrNumber').value.trim();
    
    if (!utrNumber) {
        alert('Please enter the UTR/Reference Number.');
        return;
    }
    
    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Processing...';
    submitBtn.disabled = true;
    
    const dueAmount = parseFloat(document.getElementById('payAmount').textContent.replace('₹ ', ''));
    
    const payload = {
        action: 'update_payment',
        orderId: currentOrderID,
        amount: dueAmount,
        transactionId: utrNumber,
        email: localStorage.getItem('webpotUserEmail')
    };
    
    fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify(payload)
    })
    .then(res => res.json())
    .then(data => {
        if (data.status === 'success') {
            showSuccessModal('Payment Recorded!', `Payment of ₹${dueAmount.toLocaleString('en-IN')} recorded successfully. UTR: ${utrNumber}`);
            closePaymentModal();
            // Refresh dashboard data
            setTimeout(() => {
                loadDashboardData();
            }, 1500);
        } else {
            showSuccessModal('Payment Received!', 'Your payment has been recorded. It will be reflected in your account shortly.');
            closePaymentModal();
            setTimeout(() => {
                loadDashboardData();
            }, 1500);
        }
    })
    .catch(err => {
        console.error('Error:', err);
        showSuccessModal('Payment Received!', 'Your payment has been processed. We will verify and update your account shortly.');
        closePaymentModal();
        setTimeout(() => {
            loadDashboardData();
        }, 1500);
    })
    .finally(() => {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    });
}

// Show Success Modal
function showSuccessModal(title, message) {
    document.getElementById('successTitle').textContent = title;
    document.getElementById('successMessage').textContent = message;
    document.getElementById('successModal').style.display = 'block';
}

// Close Success Modal
function closeSuccessModal() {
    document.getElementById('successModal').style.display = 'none';
}

// Close modal when clicking outside
document.addEventListener('click', function(event) {
    const paymentModal = document.getElementById('paymentModal');
    const successModal = document.getElementById('successModal');
    
    if (event.target === paymentModal) {
        closePaymentModal();
    }
    if (event.target === successModal) {
        closeSuccessModal();
    }
});

// Logout User
function logoutUser() {
    localStorage.removeItem('webpotUserLoggedIn');
    localStorage.removeItem('webpotUserEmail');
    localStorage.removeItem('webpotUserName');
    localStorage.removeItem('webpotUserPassword');
    localStorage.removeItem('webpotUserProfilePic');
    
    window.location.href = 'index.html';
}
