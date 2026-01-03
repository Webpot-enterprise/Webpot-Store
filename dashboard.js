// Dashboard Variables
let currentOrderID = null;
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbytVOTbt78wKn3TVjypTy4tkGiGUpetyXhw7VB6nJZmnMPsPWoW6xHMr71xNUCTvEq1/exec';
const MY_UPI_ID = 'kakadiyasuprince@okhdfcbank';

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
    const tbody = document.getElementById('ordersTableBody');
    
    // Show skeleton loaders before fetch
    showSkeletonLoaders(tbody, 3);
    
    fetch(APPS_SCRIPT_URL + '?action=get_user_data&email=' + encodeURIComponent(userEmail))
        .then(res => res.json())
        .then(data => {
            if (data.status === 'success') {
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
        const due = amount - paid;

        totalSpent += amount;
        totalDue += due;
    });

    // Update stat cards
    document.getElementById('displayTotal').textContent = '₹' + totalSpent.toLocaleString('en-IN');
    document.getElementById('displayDue').textContent = '₹' + totalDue.toLocaleString('en-IN');
    
    // Determine current phase based on orders
    let currentPhase = 'No Active Orders';
    if (orders.length > 0) {
        const latestOrder = orders[orders.length - 1];
        currentPhase = latestOrder.status || 'Processing';
    }
    document.getElementById('displayStatus').textContent = currentPhase;
    document.getElementById('displayStatus').className = 'status-pending'; // Default class
    
    // Update action message
    const actionMessage = totalDue > 0 ? 
        'You have pending payments. Please complete your payments to continue.' : 
        'All payments are up to date. Your dashboard is ready!';
    document.getElementById('actionMessage').textContent = actionMessage;

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
