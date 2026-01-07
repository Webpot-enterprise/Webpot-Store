// Dashboard Variables
let currentOrderID = null;
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzl4co-7Ov-l46Bd7YXSojDZe_pbX6mq--2fWnmNQ0_t2chRXrMYXFjCAEuk7DTsdL9/exec';
const MY_UPI_ID = 'kakadiyasuprince@okhdfcbank';

// Parse URL parameters and verify username
function verifyURLUserParameter() {
    const webpotUserName = localStorage.getItem('webpotUserName');
    
    if (!webpotUserName) {
        // User not logged in, redirect to auth
        window.location.href = 'auth.html';
        return false;
    }
    
    return true;
}

// Prices object based on your tiers
const servicePrices = {
    'starter': 2999,
    'basic': 5999,
    'premium': 6999
};

// Session Timeout Handler (30 minutes of inactivity)
let sessionTimeoutInterval;
const SESSION_TIMEOUT_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds

function initSessionTimeout() {
    // Only initialize for logged-in users
    const isLoggedIn = localStorage.getItem('webpotUserLoggedIn');
    if (!isLoggedIn) {
        return;
    }
    
    // Function to reset the timeout
    function resetSessionTimeout() {
        // Clear existing timeout
        if (sessionTimeoutInterval) {
            clearTimeout(sessionTimeoutInterval);
        }
        
        // Set new timeout
        sessionTimeoutInterval = setTimeout(() => {
            // Session expired - log out user
            console.log('Session expired due to inactivity');
            localStorage.removeItem('webpotUserLoggedIn');
            localStorage.removeItem('webpotUserEmail');
            localStorage.removeItem('webpotUserName');
            localStorage.removeItem('webpotUserProfilePic');
            
            alert('Your session has expired due to inactivity. Please log in again.');
            window.location.href = 'auth.html';
        }, SESSION_TIMEOUT_DURATION);
    }
    
    // Reset timeout on user activity
    document.addEventListener('mousemove', resetSessionTimeout);
    document.addEventListener('keypress', resetSessionTimeout);
    document.addEventListener('click', resetSessionTimeout);
    
    // Initialize timeout on load
    resetSessionTimeout();
}

// Authentication Check on Page Load
window.addEventListener('DOMContentLoaded', () => {
    // First verify URL parameter matches user
    if (!verifyURLUserParameter()) {
        return;
    }
    
    const isLoggedIn = localStorage.getItem('webpotUserLoggedIn');
    if (!isLoggedIn) {
        window.location.href = 'auth.html';
        return;
    }

    // Display user information
    const userName = localStorage.getItem('webpotUserName');
    const userEmail = localStorage.getItem('webpotUserEmail');
    const userProfilePic = localStorage.getItem('webpotUserProfilePic');
    
    document.getElementById('welcomeName').textContent = userName || 'User';
    document.getElementById('profileName').textContent = userName || '-';
    document.getElementById('profileEmail').textContent = userEmail || '-';
    document.getElementById('memberSince').textContent = new Date().toLocaleDateString('en-IN');
    
    // Check if user is admin and show admin portal link
    const masterAdminEmail = 'kakadiyasuprince@gmail.com'; // Set your master admin email here
    const adminPortalLink = document.getElementById('adminPortalLink');
    if (adminPortalLink) {
        if (userEmail === masterAdminEmail) {
            adminPortalLink.style.display = 'flex';
        } else {
            adminPortalLink.style.display = 'none';
        }
    }
    
    // Display profile picture if available
    const profilePicElement = document.getElementById('dashboardProfilePic');
    if (profilePicElement && userProfilePic) {
        profilePicElement.src = userProfilePic;
        profilePicElement.style.display = 'block';
    }

    // Load dashboard data
    loadDashboardData();

    // Setup sidebar navigation
    setupSidebarNavigation();
    
    // Setup sidebar toggle button
    const sidebarToggleBtn = document.getElementById('sidebarToggle');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    
    if (sidebarToggleBtn) {
        sidebarToggleBtn.addEventListener('click', toggleSidebar);
    }
    
    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', closeSidebar);
    }
    
    // Close sidebar when window is resized to desktop size
    window.addEventListener('resize', () => {
        if (window.innerWidth > 992) {
            closeSidebar();
        }
    });
    
    // Initialize session timeout
    initSessionTimeout();
    
    // Initialize review section
    const reviewSection = document.getElementById('reviewName');
    if (reviewSection) {
        initializeReviewSection();
    }
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
                    switchDashboardSection(section);
                    navItems.forEach(ni => ni.classList.remove('active'));
                    item.classList.add('active');
                }
            }
            // Close sidebar on mobile when link is clicked
            const sidebar = document.querySelector('.sidebar');
            if (sidebar && sidebar.classList.contains('active')) {
                closeSidebar();
            }
        });
    });
}

// Sidebar Toggle Function
function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.querySelector('.sidebar-overlay');
    
    if (sidebar) {
        sidebar.classList.toggle('active');
    }
    if (overlay) {
        overlay.classList.toggle('active');
        // Only enable pointer-events when overlay is active
        if (overlay.classList.contains('active')) {
            overlay.style.pointerEvents = 'auto';
        } else {
            overlay.style.pointerEvents = 'none';
        }
    }
}

// Close Sidebar
function closeSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.querySelector('.sidebar-overlay');
    
    if (sidebar) {
        sidebar.classList.remove('active');
    }
    if (overlay) {
        overlay.classList.remove('active');
        overlay.style.pointerEvents = 'none';
    }
}

// Open Sidebar
function openSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.querySelector('.sidebar-overlay');
    
    if (sidebar) {
        sidebar.classList.add('active');
    }
    if (overlay) {
        overlay.classList.add('active');
        overlay.style.pointerEvents = 'auto';
    }
}
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

// Switch Dashboard View (alternative name for switchSection)
function switchDashboardView(viewId) {
    switchSection(viewId);
    // Close sidebar on mobile after selecting a section
    if (window.innerWidth <= 992) {
        closeSidebar();
    }
}

// Load Dashboard Data from Google Apps Script
function loadDashboardData() {
    const userEmail = localStorage.getItem('webpotUserEmail');
    const tbody = document.getElementById('ordersTableBody');
    
    // Show skeleton loaders before fetch
    showSkeletonLoaders(tbody, 3);
    
    fetch(APPS_SCRIPT_URL + '?action=get_user_data&email=' + encodeURIComponent(userEmail))
        .then(res => res.json())
        .then(data => {
            if (data.status === 'success') {
                // Display referral ID if available
                if (data.referralCode) {
                    document.getElementById('referralId').textContent = data.referralCode;
                }
                if (data.orders) {
                    populateDashboard(data.orders);
                }
                // If backend provides serviceType and currentStatus, use refreshDashboard
                if (data.serviceType && data.currentStatus) {
                    refreshDashboard(data.serviceType, data.currentStatus);
                }
            } else {
                console.log('No data found or error in response');
                populateDashboard([]);
            }
        })
        .catch(err => {
            console.error('Error loading dashboard data:', err);
            populateDashboard([]);
        });
}

function showSkeletonLoaders(tbody, count) {
    tbody.innerHTML = '';
    for (let i = 0; i < count; i++) {
        const skeletonRow = document.createElement('tr');
        skeletonRow.className = 'skeleton-row';
        skeletonRow.innerHTML = `
            <td><div class="skeleton-cell"></div></td>
            <td><div class="skeleton-cell"></div></td>
            <td><div class="skeleton-cell"></div></td>
            <td><div class="skeleton-cell"></div></td>
            <td><div class="skeleton-cell"></div></td>
            <td><div class="skeleton-cell"></div></td>
        `;
        tbody.appendChild(skeletonRow);
    }
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
        const due = parseFloat(order.dueAmount) || (amount - paid);

        totalSpent += amount;
        totalDue += due;
    });

    // Update stat cards with formatted currency
    document.getElementById('displayTotal').textContent = '₹' + totalSpent.toLocaleString('en-IN', {maximumFractionDigits: 2});
    document.getElementById('displayDue').textContent = '₹' + totalDue.toLocaleString('en-IN', {maximumFractionDigits: 2});
    
    // Animate counters
    animateDashboardCounters(totalSpent, totalDue);
    
    // Determine current phase based on latest order
    let currentPhase = 'No Active Orders';
    let phaseClass = 'status-pending';
    if (orders.length > 0) {
        const latestOrder = orders[0]; // Most recent order (typically first in list)
        const orderStatus = (latestOrder.status || 'Processing').toLowerCase();
        
        if (orderStatus.includes('completed')) {
            currentPhase = 'Completed';
            phaseClass = 'status-completed';
        } else if (orderStatus.includes('partial')) {
            currentPhase = 'Partial Payment';
            phaseClass = 'status-partial';
        } else if (orderStatus.includes('pending')) {
            currentPhase = 'Pending';
            phaseClass = 'status-pending';
        } else {
            currentPhase = orderStatus.charAt(0).toUpperCase() + orderStatus.slice(1);
            phaseClass = 'status-pending';
        }
    }
    
    document.getElementById('displayStatus').textContent = currentPhase;
    document.getElementById('displayStatus').className = phaseClass;
    
    // Update action message
    const actionMessage = totalDue > 0 ? 
        '💰 You have ₹' + totalDue.toLocaleString('en-IN', {maximumFractionDigits: 2}) + ' pending. Complete your payment to continue.' : 
        '✓ All payments are up to date!';
    document.getElementById('actionMessage').textContent = actionMessage;

    // Populate orders table
    const tableBody = document.getElementById('ordersTableBody');
    if (orders.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 2rem;">No orders found. Get started with your first order!</td></tr>';
    } else {
        tableBody.innerHTML = '';
        orders.forEach(order => {
            const amount = parseFloat(order.amount) || 0;
            const paid = parseFloat(order.paidAmount) || 0;
            const due = parseFloat(order.dueAmount) || (amount - paid);
            
            // Parse date properly
            let orderDate = 'N/A';
            if (order.date) {
                try {
                    if (typeof order.date === 'string') {
                        orderDate = order.date;
                    } else if (order.date instanceof Date) {
                        orderDate = order.date.toLocaleDateString('en-IN');
                    }
                } catch (e) {
                    orderDate = 'N/A';
                }
            }
            
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
                `<button class="pay-btn" onclick="openPaymentModal('${order.orderId}', ${due})">Pay ₹${due.toLocaleString('en-IN', {maximumFractionDigits: 2})}</button>` : 
                '<span style="color: var(--neon-blue);">✓ Paid</span>';

            const invoiceBtn = `<button class="pay-btn" onclick="generateInvoice({orderId: '${order.orderId}', date: '${order.date}', service: '${order.service}', amount: ${amount}, paidAmount: ${paid}, dueAmount: ${due}, status: '${order.status}'})">📄 Invoice</button>`;

            const row = `
                <tr>
                    <td>${orderDate}</td>
                    <td><strong>${order.orderId}</strong></td>
                    <td>${order.service}</td>
                    <td>₹${amount.toLocaleString('en-IN')}</td>
                    <td>₹${Math.max(0, due).toLocaleString('en-IN')}</td>
                    <td><span class="status-badge ${statusClass}">${status}</span></td>
                    <td>${invoiceBtn} ${actionBtn}</td>
                </tr>
            `;
            tableBody.innerHTML += row;
        });
    }

    // Update activity log
    const lastLogin = localStorage.getItem('webpotLastLogin') || new Date().toLocaleString('en-IN');
    document.getElementById('lastLoginTime').textContent = lastLogin;
    localStorage.setItem('webpotLastLogin', new Date().toLocaleString('en-IN'));
    
    // Update progress tracker for the first active order
    if (orders.length > 0) {
        updateProgressTracker(orders[0]);
    }
    
    // Render order cards
    renderOrderCards(orders);
}

// Render orders as cards in the orders section
function renderOrderCards(orders) {
    const cardsContainer = document.getElementById('ordersCardsContainer');
    if (!cardsContainer) return;
    
    if (orders.length === 0) {
        cardsContainer.innerHTML = '';
        return;
    }
    
    cardsContainer.innerHTML = '';
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
        
        const card = document.createElement('div');
        card.className = 'order-card';
        card.innerHTML = `
            <div class="order-card-header">
                <div class="order-service-name">${order.service || 'N/A'}</div>
                <div class="order-date">${orderDate}</div>
            </div>
            <div class="order-card-body">
                <div class="order-detail">
                    <span class="order-detail-label">Order ID:</span>
                    <span class="order-detail-value">${order.orderId || 'N/A'}</span>
                </div>
                <div class="order-detail">
                    <span class="order-detail-label">Total Price:</span>
                    <span class="order-detail-value">₹${amount.toLocaleString('en-IN')}</span>
                </div>
                <div class="order-detail">
                    <span class="order-detail-label">Due Amount:</span>
                    <span class="order-detail-value">₹${Math.max(0, due).toLocaleString('en-IN')}</span>
                </div>
                <div class="order-detail">
                    <span class="order-detail-label">Status:</span>
                    <span class="order-status ${statusClass}">${status}</span>
                </div>
            </div>
        `;
        cardsContainer.appendChild(card);
    });
}

function refreshDashboard(serviceType, currentStatus) {
    const total = servicePrices[serviceType.toLowerCase()];
    const due = total / 2;

    // 1. Update Financials
    document.getElementById('displayTotal').innerText = `₹${total.toLocaleString('en-IN')}`;
    document.getElementById('displayDue').innerText = `₹${due.toLocaleString('en-IN')}`;

    // 2. Update Status and Action Messages
    const statusEl = document.getElementById('displayStatus');
    const messageEl = document.getElementById('actionMessage');
    
    statusEl.className = ''; // Clear existing classes

    if (currentStatus === 'Pending') {
        statusEl.innerText = 'Pending';
        statusEl.classList.add('status-pending');
        messageEl.innerText = "Payment Received. Our team is currently verifying your transaction via the backend. Please wait for activation.";
    } 
    else if (currentStatus === 'Active') {
        statusEl.innerText = 'Active Order';
        statusEl.classList.add('status-active');
        messageEl.innerText = "Order Verified! Your website is now in the development phase. The dashboard will refresh once the site is ready.";
    } 
    else if (currentStatus === 'Delivered') {
        statusEl.innerText = 'Delivered';
        statusEl.classList.add('status-delivered');
        messageEl.innerText = `Your website is ready! Please clear the remaining due of ₹${due.toLocaleString('en-IN')} to receive your final files.`;
    }
}

// Open Payment Modal
function openPaymentModal(orderId, dueAmount) {
    currentOrderID = orderId;
    document.getElementById('paymentModal').style.display = 'block';
    document.body.style.overflow = 'hidden';
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
    
    // Handle UPI App Button
    const payViaAppBtn = document.getElementById('payViaAppBtn');
    if (payViaAppBtn) {
        // Set the href to the UPI link
        payViaAppBtn.href = upiLink;
        
        // Detect if user is on mobile
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
        
        if (isMobile) {
            // Show button on mobile
            payViaAppBtn.style.display = 'inline-block';
        } else {
            // Hide button on desktop
            payViaAppBtn.style.display = 'none';
        }
    }
    
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
    // Clear pending order data
    window.pendingOrderData = null;
    
    // Reset payment form
    const paymentForm = document.getElementById('paymentForm');
    if (paymentForm) {
        paymentForm.reset();
    }
    
    // Clear QR code container and stop timer
    const qrContainer = document.getElementById('qrCodeContainer');
    if (qrContainer) {
        qrContainer.innerHTML = '';
    }
    
    // Clear any running timers
    if (window.qrTimerInterval) {
        clearInterval(window.qrTimerInterval);
    }
    
    document.getElementById('paymentModal').style.display = 'none';
    document.body.style.overflow = '';
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

// ============== FEATURE 2: PDF INVOICES ==============

function generateInvoice(order) {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF();
    
    const cyan = [0, 212, 255];
    const dark = [26, 26, 46];
    const text = [200, 200, 200];

    // Header background
    pdf.setFillColor(...dark);
    pdf.rect(0, 0, 210, 40, 'F');
    
    // WEBPOT brand - 22pt bold
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(22);
    pdf.setTextColor(...cyan);
    pdf.text('WEBPOT', 20, 25);
    
    // Tax Invoice label - 10pt normal
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.setTextColor(...text);
    pdf.text('Tax Invoice', 150, 25);

    // Invoice No - 12pt bold
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.setTextColor(...cyan);
    pdf.text(`Invoice No: ${order.orderId}`, 20, 55);
    
    // Date and Status - 10pt normal
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.setTextColor(...text);
    pdf.text(`Date: ${new Date(order.date).toLocaleDateString('en-IN')}`, 20, 65);
    pdf.text(`Status: ${order.status}`, 20, 75);

    // Client Details section heading
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.setTextColor(...cyan);
    pdf.text('Client Details:', 20, 95);
    
    // Client details content
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.setTextColor(...text);
    const userName = localStorage.getItem('webpotUserName') || 'N/A';
    const userEmail = localStorage.getItem('webpotUserEmail') || 'N/A';
    
    pdf.text(`Name: ${userName}`, 20, 105);
    pdf.text(`Email: ${userEmail}`, 20, 115);

    // Invoice details table
    const tableData = [
        ['Description', 'Amount (₹)'],
        [order.service, order.amount.toFixed(2)],
        ['Paid Amount', `-₹${order.paidAmount.toFixed(2)}`],
        ['Due Amount', `₹${order.dueAmount.toFixed(2)}`]
    ];

    pdf.autoTable({
        startY: 130,
        head: [tableData[0]],
        body: tableData.slice(1),
        headStyles: { 
            fillColor: cyan, 
            textColor: dark, 
            fontStyle: 'bold',
            fontSize: 11,
            font: 'helvetica'
        },
        bodyStyles: { 
            textColor: text, 
            fillColor: [22, 33, 62],
            fontSize: 10,
            font: 'helvetica'
        },
        margin: 20
    });

    // Footer
    const finalY = pdf.lastAutoTable.finalY + 20;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.setTextColor(...text);
    pdf.text('Thank you for choosing Webpot!', 20, finalY);
    pdf.text('For support: engagewebpot@gmail.com', 20, finalY + 10);

    pdf.save(`Invoice_Webpot_${order.orderId}.pdf`);
}

// ============== FEATURE 4: TESTIMONIALS ==============

let selectedRating = 0;

function initializeReviewSection() {
    const stars = document.querySelectorAll('#starRating .star');
    stars.forEach(star => {
        star.addEventListener('click', () => {
            selectedRating = parseInt(star.getAttribute('data-value'));
            document.getElementById('ratingValue').textContent = selectedRating + ' stars';
            
            stars.forEach((s, index) => {
                if (index < selectedRating) {
                    s.style.opacity = '1';
                    s.style.color = '#00d4ff';
                } else {
                    s.style.opacity = '0.3';
                    s.style.color = '#666';
                }
            });
        });
    });
}

function submitReview() {
    const name = document.getElementById('reviewName').value.trim() || 'Anonymous';
    const service = document.getElementById('reviewService').value;
    const rating = selectedRating;
    const comment = document.getElementById('reviewComment').value.trim();
    const email = localStorage.getItem('webpotUserEmail');

    if (!service || rating === 0 || !comment) {
        alert('Please fill in all fields');
        return;
    }

    const btn = event.target;
    const originalText = btn.textContent;
    btn.textContent = 'Submitting...';
    btn.disabled = true;

    fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify({
            action: 'submit_review',
            name: name,
            email: email,
            service: service,
            rating: rating,
            comment: comment
        })
    })
    .then(res => res.json())
    .then(data => {
        if (data.status === 'success') {
            alert('Thank you! Your review has been submitted for approval.');
            document.getElementById('reviewName').value = '';
            document.getElementById('reviewService').value = '';
            document.getElementById('reviewComment').value = '';
            selectedRating = 0;
            document.getElementById('ratingValue').textContent = '0 stars';
            const stars = document.querySelectorAll('#starRating .star');
            stars.forEach(s => {
                s.style.opacity = '0.3';
                s.style.color = '#666';
            });
        } else {
            alert('Error: ' + data.message);
        }
        btn.textContent = originalText;
        btn.disabled = false;
    })
    .catch(err => {
        console.error('Error:', err);
        alert('Failed to submit review');
        btn.textContent = originalText;
        btn.disabled = false;
    });
}

// ========== ORDER PROGRESS STEPPER ==========
function updateProgressBar(status) {
    const statusStepper = document.getElementById('statusStepper');
    if (!statusStepper) return;
    
    // Status mapping to steps
    const statusSteps = {
        'pending': 0,
        'order_placed': 0,
        'designing': 1,
        'developing': 2,
        'completed': 3,
        'delivered': 3
    };
    
    const normalizedStatus = (status || 'pending').toLowerCase();
    const currentStep = statusSteps[normalizedStatus] || 0;
    
    // Get all step dots and lines
    const dots = statusStepper.querySelectorAll('.progress-dot');
    const lines = statusStepper.querySelectorAll('.progress-line');
    
    // Update dots
    dots.forEach((dot, index) => {
        if (index < currentStep) {
            dot.classList.add('completed');
            dot.classList.remove('active');
        } else if (index === currentStep) {
            dot.classList.add('active');
            dot.classList.remove('completed');
        } else {
            dot.classList.remove('active', 'completed');
        }
    });
    
    // Update lines
    lines.forEach((line, index) => {
        if (index < currentStep) {
            line.style.background = 'var(--accent)';
        } else {
            line.style.background = 'var(--border-color)';
        }
    });
}

// ========== ORDER PROGRESS TRACKER ==========
function updateProgressTracker(order) {
    const tracker = document.getElementById('orderProgressTracker');
    if (!tracker || !order) return;
    
    // Show the tracker
    tracker.style.display = 'block';
    
    // Map order status to progress steps
    const statusMap = {
        'pending': 0,
        'order_placed': 0,
        'designing': 1,
        'developing': 2,
        'in_review': 3,
        'final_review': 3,
        'completed': 4,
        'delivered': 4
    };
    
    const status = (order.status || 'pending').toLowerCase();
    const currentStep = statusMap[status] || 0;
    
    // Update step classes
    const steps = tracker.querySelectorAll('.progress-step');
    steps.forEach((step, index) => {
        step.classList.remove('completed', 'in-progress');
        if (index < currentStep) {
            step.classList.add('completed');
        } else if (index === currentStep && currentStep < 4) {
            step.classList.add('in-progress');
        }
    });
    
    // Update progress lines
    const lines = tracker.querySelectorAll('.progress-line');
    lines.forEach((line, index) => {
        if (index < currentStep - 1) {
            line.style.background = 'var(--primary-accent)';
        }
    });
}

// ========== ANIMATED COUNTERS ==========
function animateCounter(element, targetValue, duration = 1000) {
    if (!element) return;
    
    const startValue = 0;
    const difference = targetValue - startValue;
    const stepDuration = Math.floor(duration / Math.abs(difference));
    let currentValue = startValue;
    const interval = setInterval(() => {
        currentValue += Math.ceil(difference / (duration / stepDuration));
        if (Math.abs(currentValue - targetValue) < Math.abs(difference / (duration / stepDuration))) {
            currentValue = targetValue;
            clearInterval(interval);
        }
        element.textContent = '₹' + currentValue.toLocaleString('en-IN');
    }, stepDuration);
}

function animateDashboardCounters(totalAmount, dueAmount) {
    const totalEl = document.getElementById('displayTotal');
    const dueEl = document.getElementById('displayDue');
    
    if (totalEl && !totalEl.dataset.animated) {
        totalEl.dataset.animated = 'true';
        animateCounter(totalEl, totalAmount, 800);
    }
    
    if (dueEl && !dueEl.dataset.animated) {
        dueEl.dataset.animated = 'true';
        animateCounter(dueEl, dueAmount, 800);
    }
}
