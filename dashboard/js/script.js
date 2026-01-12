// =============================================
// WEBPOT DASHBOARD - JAVASCRIPT FUNCTIONALITY
// =============================================

// Sample user data
const userData = {
    name: 'John Doe',
    phone: '+1 (555) 123-4567',
    email: 'john.doe@webpot.com',
    wallet: '$2,450.00',
    referralCode: 'WP-JD-2024-A1B2C3'
};

// Sample orders data
const ordersData = [
    {
        id: 'ORD-001',
        date: 'Jan 10, 2024',
        status: 'delivered',
        items: [
            { name: 'Premium Package', quantity: 1, price: 99.99 }
        ],
        total: 99.99,
        description: 'Successfully delivered'
    },
    {
        id: 'ORD-002',
        date: 'Jan 09, 2024',
        status: 'shipped',
        items: [
            { name: 'Basic Package', quantity: 2, price: 49.99 }
        ],
        total: 99.98,
        description: 'In transit to your location'
    },
    {
        id: 'ORD-003',
        date: 'Jan 08, 2024',
        status: 'processing',
        items: [
            { name: 'Pro Package', quantity: 1, price: 149.99 }
        ],
        total: 149.99,
        description: 'Being prepared for shipment'
    },
    {
        id: 'ORD-004',
        date: 'Jan 07, 2024',
        status: 'pending',
        items: [
            { name: 'Standard Package', quantity: 1, price: 79.99 }
        ],
        total: 79.99,
        description: 'Awaiting confirmation'
    },
    {
        id: 'ORD-005',
        date: 'Jan 05, 2024',
        status: 'delivered',
        items: [
            { name: 'Starter Package', quantity: 3, price: 29.99 }
        ],
        total: 89.97,
        description: 'Delivered on Jan 06, 2024'
    },
    {
        id: 'ORD-006',
        date: 'Jan 03, 2024',
        status: 'cancelled',
        items: [
            { name: 'Enterprise Package', quantity: 1, price: 299.99 }
        ],
        total: 299.99,
        description: 'Cancelled by user'
    },
    {
        id: 'ORD-007',
        date: 'Jan 01, 2024',
        status: 'delivered',
        items: [
            { name: 'Premium Package', quantity: 1, price: 99.99 }
        ],
        total: 99.99,
        description: 'Delivered on Jan 02, 2024'
    },
    {
        id: 'ORD-008',
        date: 'Dec 30, 2023',
        status: 'shipped',
        items: [
            { name: 'Pro Package', quantity: 2, price: 149.99 }
        ],
        total: 299.98,
        description: 'Out for delivery'
    }
];

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
    initializeProfileImage();
    loadUserProfile();
    loadOrders();
    setupEventListeners();
    animateOnScroll();
});

// Load user profile data
function loadUserProfile() {
    document.getElementById('userName').textContent = userData.name;
    document.getElementById('userPhone').textContent = userData.phone;
    document.getElementById('userEmail').textContent = userData.email;
    document.getElementById('userWallet').textContent = userData.wallet;
    document.getElementById('referralCode').textContent = userData.referralCode;
}

// Load and display orders
function loadOrders(filter = 'all') {
    const ordersContainer = document.getElementById('ordersContainer');
    ordersContainer.innerHTML = '';

    let filteredOrders = ordersData;
    
    if (filter !== 'all') {
        filteredOrders = ordersData.filter(order => order.status === filter);
    }

    if (filteredOrders.length === 0) {
        ordersContainer.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1;">
                <i class="fas fa-inbox"></i>
                <p>No orders found</p>
            </div>
        `;
        return;
    }

    filteredOrders.forEach((order, index) => {
        const orderCard = createOrderCard(order, index);
        ordersContainer.appendChild(orderCard);
    });
}

// Create order card element
function createOrderCard(order, index) {
    const card = document.createElement('div');
    card.className = 'order-card';
    card.style.animationDelay = `${index * 0.05}s`;

    const itemsHTML = order.items.map(item => `
        <div class="detail-row">
            <label>${item.name}</label>
            <value>Qty: ${item.quantity}</value>
        </div>
    `).join('');

    card.innerHTML = `
        <div class="order-header">
            <div>
                <div class="order-id">${order.id}</div>
                <div class="order-date">${order.date}</div>
            </div>
            <span class="order-status ${order.status}">
                ${capitalizeFirst(order.status)}
            </span>
        </div>

        <div class="order-details">
            ${itemsHTML}
            <p style="color: var(--accent-gray); font-size: 0.9rem; margin-top: 1rem;">
                ${order.description}
            </p>
        </div>

        <div class="order-total">
            <span>Total:</span>
            <span class="amount">$${order.total.toFixed(2)}</span>
        </div>

        <div class="order-actions">
            <button class="action-btn" onclick="viewOrderDetails('${order.id}')">
                <i class="fas fa-eye" style="margin-right: 0.5rem;"></i> View
            </button>
            <button class="action-btn primary" onclick="downloadInvoice('${order.id}')">
                <i class="fas fa-download" style="margin-right: 0.5rem;"></i> Invoice
            </button>
        </div>
    `;

    return card;
}

// Setup event listeners
function setupEventListeners() {
    const statusFilter = document.getElementById('statusFilter');
    statusFilter.addEventListener('change', function() {
        loadOrders(this.value);
    });

    // Edit profile button
    const editBtn = document.querySelector('.edit-btn');
    if (editBtn) {
        editBtn.addEventListener('click', openEditModal);
    }
}

// Copy referral code to clipboard
function copyToClipboard() {
    const referralCode = document.getElementById('referralCode').textContent;
    navigator.clipboard.writeText(referralCode).then(() => {
        showNotification('Referral code copied to clipboard!', 'success');
    }).catch(err => {
        console.error('Failed to copy:', err);
        showNotification('Failed to copy referral code', 'error');
    });
}

// View order details
function viewOrderDetails(orderId) {
    const order = ordersData.find(o => o.id === orderId);
    if (order) {
        showNotification(`Viewing details for order ${orderId}`, 'info');
        console.log('Order Details:', order);
        // You can expand this to show a modal with detailed information
    }
}

// Download invoice
function downloadInvoice(orderId) {
    const order = ordersData.find(o => o.id === orderId);
    if (order) {
        showNotification(`Downloading invoice for order ${orderId}...`, 'success');
        // Simulate invoice download
        console.log('Invoice downloaded:', order.id);
    }
}

// Open edit profile modal (placeholder)
function openEditModal() {
    showNotification('Edit profile feature coming soon!', 'info');
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
        z-index: 1000;
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

// Animate elements on scroll
function animateOnScroll() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.animation = 'slideUp 0.5s ease-out forwards';
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observe elements that should animate
    document.querySelectorAll('.stat-card, .order-card, .section').forEach(el => {
        observer.observe(el);
    });
}

// Add animation styles to document
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

    @keyframes float {
        0%, 100% {
            transform: translateY(0px);
        }
        50% {
            transform: translateY(-10px);
        }
    }

    @keyframes shimmer {
        0% {
            background-position: -1000px 0;
        }
        100% {
            background-position: 1000px 0;
        }
    }
`;
document.head.appendChild(style);

// Optional: Add smooth scroll behavior for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth' });
        }
    });
});

// Performance optimization: Lazy load images
if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.add('loaded');
                observer.unobserve(img);
            }
        });
    });

    document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
    });
}

// =============================================
// PROFILE MODAL FUNCTIONALITY
// =============================================

let currentProfileImage = null;
let cameraStream = null;

// Initialize profile - create default avatar with first letter
function initializeProfileImage() {
    if (!currentProfileImage) {
        currentProfileImage = createDefaultAvatar(userData.name);
        updateProfileImages();
    }
}

// Create default avatar with user's first letter
function createDefaultAvatar(userName) {
    const canvas = document.createElement('canvas');
    canvas.width = 150;
    canvas.height = 150;
    
    const ctx = canvas.getContext('2d');
    
    // Create gradient background
    const gradient = ctx.createLinearGradient(0, 0, 150, 150);
    gradient.addColorStop(0, '#2563eb');
    gradient.addColorStop(1, '#1d4ed8');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 150, 150);
    
    // Draw first letter
    const firstLetter = userName.charAt(0).toUpperCase();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 80px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(firstLetter, 75, 75);
    
    return canvas.toDataURL('image/png');
}

// Open profile modal
function openProfileModal() {
    const modal = document.getElementById('profileModal');
    const profileImageDisplay = document.getElementById('profileImageDisplay');
    const profileModalImage = document.getElementById('profileModalImage');
    const profileModalName = document.getElementById('profileModalName');
    const profileModalEmail = document.getElementById('profileModalEmail');
    const profileModalPhone = document.getElementById('profileModalPhone');

    // Initialize profile image if needed
    if (!currentProfileImage) {
        initializeProfileImage();
    }

    // Update modal with user data
    profileModalImage.src = currentProfileImage;
    profileModalName.textContent = userData.name;
    profileModalEmail.textContent = userData.email;
    profileModalPhone.textContent = userData.phone;

    modal.style.display = 'block';
}

// Close profile modal
function closeProfileModal() {
    const modal = document.getElementById('profileModal');
    modal.style.display = 'none';
}

// Handle profile photo upload from local storage
function handleProfilePhotoUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
        showNotification('Please select an image file', 'error');
        return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
        showNotification('File size must be less than 5MB', 'error');
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        currentProfileImage = e.target.result;
        updateProfileImages();
        showNotification('Profile photo updated successfully!', 'success');
    };
    reader.readAsDataURL(file);
}

// Start camera
function startCamera() {
    const cameraModal = document.getElementById('cameraModal');
    const video = document.getElementById('cameraVideo');

    cameraModal.style.display = 'block';

    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
        .then(stream => {
            cameraStream = stream;
            video.srcObject = stream;
        })
        .catch(err => {
            showNotification('Unable to access camera: ' + err.message, 'error');
            console.error('Camera access error:', err);
            cameraModal.style.display = 'none';
        });
}

// Close camera
function closeCamera() {
    const cameraModal = document.getElementById('cameraModal');
    cameraModal.style.display = 'none';

    if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        cameraStream = null;
    }
}

// Capture photo from camera
function capturePhoto() {
    const video = document.getElementById('cameraVideo');
    const canvas = document.getElementById('cameraCanvas');
    const context = canvas.getContext('2d');

    // Set canvas dimensions to video dimensions
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    context.drawImage(video, 0, 0);

    // Convert canvas to image data URL
    currentProfileImage = canvas.toDataURL('image/jpeg');
    updateProfileImages();
    showNotification('Profile photo captured successfully!', 'success');

    closeCamera();
}

// Remove profile photo
function removeProfilePhoto() {
    currentProfileImage = createDefaultAvatar(userData.name);
    updateProfileImages();
    showNotification('Profile photo removed - showing default avatar', 'info');
}

// Update all profile images on page
function updateProfileImages() {
    const profileImageDisplay = document.getElementById('profileImageDisplay');
    const profileModalImage = document.getElementById('profileModalImage');
    const navbarProfileImage = document.getElementById('navbarProfileImage');

    if (profileImageDisplay) {
        profileImageDisplay.src = currentProfileImage;
    }
    if (profileModalImage) {
        profileModalImage.src = currentProfileImage;
    }
    if (navbarProfileImage) {
        navbarProfileImage.src = currentProfileImage;
    }
}

// Close modal when clicking outside
window.addEventListener('click', function(event) {
    const profileModal = document.getElementById('profileModal');
    const cameraModal = document.getElementById('cameraModal');

    if (event.target === profileModal) {
        profileModal.style.display = 'none';
    }
    if (event.target === cameraModal) {
        closeCamera();
    }
});

console.log('WebPot Dashboard initialized successfully!');
