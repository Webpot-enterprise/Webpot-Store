// =============================================
// WEBPOT DASHBOARD - CONFIGURATION FILE
// Easy customization without editing main files
// =============================================

// Copy this to a new file called config.js and include it before script.js
// Then uncomment the lines you want to customize

// =============================================
// USER PROFILE CONFIGURATION
// =============================================

const userConfig = {
    // User Information
    name: 'John Doe',
    phone: '+1 (555) 123-4567',
    email: 'john.doe@webpot.com',
    wallet: '$2,450.00',
    referralCode: 'WP-JD-2024-A1B2C3',
    
    // Avatar Image URL
    avatarUrl: 'https://via.placeholder.com/120',
    
    // Dashboard Stats
    totalOrders: 24,
    totalEarnings: 2450,
    referralsCount: 8
};

// =============================================
// THEME CONFIGURATION
// =============================================

const themeConfig = {
    // Primary Colors
    primaryDark: '#0a0a0a',      // Main dark background
    primaryLight: '#ffffff',      // Main light background
    
    // Secondary Colors
    secondaryDark: '#1a1a1a',    // Secondary dark
    secondaryLight: '#f5f5f5',   // Secondary light
    
    // Accent Colors
    accentGray: '#666666',       // Medium gray for text
    borderGray: '#e0e0e0',       // Border color
    
    // Status Colors
    statusColors: {
        pending: { bg: '#ffe4b5', text: '#ff8c00' },
        processing: { bg: '#e0e7ff', text: '#4f46e5' },
        shipped: { bg: '#dbeafe', text: '#0284c7' },
        delivered: { bg: '#dcfce7', text: '#16a34a' },
        cancelled: { bg: '#fee2e2', text: '#dc2626' }
    }
};

// =============================================
// ANIMATION CONFIGURATION
// =============================================

const animationConfig = {
    // Animation Speeds (in milliseconds)
    slideDownDuration: 500,
    slideUpDuration: 500,
    slideInDuration: 500,
    scaleInDuration: 500,
    fadeInDuration: 500,
    hoverTransitionDuration: 300,
    
    // Animation Stagger (delay between elements)
    cardStagger: 50,  // ms between each card animation
    
    // Enable/Disable Animations
    enableAnimations: true,
    enableHoverEffects: true,
    enableScrollAnimations: true
};

// =============================================
// SAMPLE ORDERS (for easy modification)
// =============================================

const orderTemplates = {
    // Basic order template
    template: {
        id: 'ORD-XXX',
        date: 'Jan XX, 2024',
        status: 'pending',  // pending, processing, shipped, delivered, cancelled
        items: [
            { name: 'Product Name', quantity: 1, price: 99.99 }
        ],
        total: 99.99,
        description: 'Order description'
    },

    // Quick templates for common statuses
    templates: {
        pending: {
            status: 'pending',
            description: 'Awaiting confirmation'
        },
        processing: {
            status: 'processing',
            description: 'Being prepared for shipment'
        },
        shipped: {
            status: 'shipped',
            description: 'In transit to your location'
        },
        delivered: {
            status: 'delivered',
            description: 'Successfully delivered'
        },
        cancelled: {
            status: 'cancelled',
            description: 'Order was cancelled'
        }
    }
};

// =============================================
// API CONFIGURATION
// =============================================

const apiConfig = {
    // Set your API base URL here
    baseURL: 'https://api.webpot.com',
    
    // API Endpoints
    endpoints: {
        userProfile: '/api/user/profile',
        userOrders: '/api/user/orders',
        userStats: '/api/user/stats',
        downloadInvoice: '/api/orders/{id}/invoice',
        getReferralCode: '/api/user/referral-code'
    },
    
    // API Headers
    headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_API_TOKEN'
    },
    
    // Timeout in milliseconds
    timeout: 10000,
    
    // Enable/Disable API
    enableAPI: false  // Set to true when ready to use API
};

// =============================================
// NOTIFICATION CONFIGURATION
// =============================================

const notificationConfig = {
    // Notification duration (milliseconds)
    duration: 3000,
    
    // Notification position
    position: 'top-right',  // top-left, top-right, bottom-left, bottom-right
    
    // Notification types and colors
    types: {
        success: { bg: '#16a34a', icon: '✓' },
        error: { bg: '#dc2626', icon: '✕' },
        info: { bg: '#0284c7', icon: 'ℹ' },
        warning: { bg: '#ff8c00', icon: '⚠' }
    }
};

// =============================================
// FEATURE FLAGS
// =============================================

const featureFlags = {
    // Profile Section
    showProfileCard: true,
    allowProfileEdit: true,
    showWallet: true,
    showReferralCode: true,
    
    // Orders Section
    showOrders: true,
    allowOrderFilter: true,
    showOrderDetails: true,
    allowInvoiceDownload: true,
    
    // Sidebar
    showSidebar: true,
    collapsibleSidebar: true,
    
    // Navbar
    showNotifications: true,
    showSearch: false,  // Ready for future implementation
    
    // Animations
    enableScrollAnimations: true,
    enableHoverAnimations: true,
    
    // Dark Mode (for future implementation)
    enableDarkMode: false,
    enableThemeToggle: false
};

// =============================================
// HELPER FUNCTION TO APPLY CONFIG
// =============================================

function applyThemeConfig(config) {
    const root = document.documentElement;
    root.style.setProperty('--primary-dark', config.primaryDark);
    root.style.setProperty('--primary-light', config.primaryLight);
    root.style.setProperty('--secondary-dark', config.secondaryDark);
    root.style.setProperty('--secondary-light', config.secondaryLight);
    root.style.setProperty('--accent-gray', config.accentGray);
    root.style.setProperty('--border-gray', config.borderGray);
}

// =============================================
// EXPORT CONFIGURATION
// =============================================

// Use these configurations in your JavaScript:
// 
// Example 1: Apply theme
// applyThemeConfig(themeConfig);
//
// Example 2: Access user data
// console.log(userConfig.name);
//
// Example 3: Use API config
// fetch(apiConfig.baseURL + apiConfig.endpoints.userProfile);
//
// Example 4: Check feature flags
// if (featureFlags.showOrders) { ... }

// =============================================
// HOW TO USE THIS FILE
// =============================================

/*
1. Copy this content to a new file called 'config.js'
2. Place config.js in the same directory as index.html
3. Add this line to index.html before closing </body>:
   <script src="js/config.js"></script>
   <script src="js/script.js"></script>

4. Now modify this file instead of script.js for easier customization

5. The configurations are automatically available throughout your dashboard
*/

// =============================================
// EXAMPLE: CUSTOM ORDERS
// =============================================

/*
const customOrders = [
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
        status: 'processing',
        items: [
            { name: 'Basic Package', quantity: 2, price: 49.99 }
        ],
        total: 99.98,
        description: 'Being prepared for shipment'
    }
    // Add more orders here
];
*/

// =============================================
// EXAMPLE: CUSTOM API INTEGRATION
// =============================================

/*
async function loadUserDataFromAPI() {
    try {
        const response = await fetch(
            apiConfig.baseURL + apiConfig.endpoints.userProfile,
            {
                headers: apiConfig.headers,
                timeout: apiConfig.timeout
            }
        );
        
        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Update user config
        Object.assign(userConfig, data);
        
        // Reload dashboard with new data
        loadUserProfile();
        
    } catch (error) {
        console.error('Failed to load user data:', error);
        showNotification('Failed to load user data', 'error');
    }
}

// Call this function on dashboard initialization
// loadUserDataFromAPI();
*/

console.log('WebPot Configuration loaded successfully');
