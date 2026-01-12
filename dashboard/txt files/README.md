# WebPot Dashboard

A professional, modern dashboard with a sleek black and white theme featuring smooth animations and comprehensive user management features.

## 🎨 Features

### Design & Theme
- **Black & White Color Scheme**: Professional minimalist aesthetic
- **Smooth Animations**: Elegant transitions and micro-interactions
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Modern UI**: Clean, intuitive interface with attention to detail

### User Features

#### 1. **User Profile Section**
- User name and avatar display
- Contact information (phone, email)
- Wallet balance tracking
- Unique referral code with one-click copy functionality
- Professional profile card with gradient design

#### 2. **Orders Management**
- Complete order history with status tracking
- Real-time order status indicators:
  - 🟠 **Pending**: Awaiting confirmation
  - 🔵 **Processing**: Being prepared
  - 🔷 **Shipped**: In transit
  - 🟢 **Delivered**: Successfully received
  - 🔴 **Cancelled**: Order cancelled
- Filter orders by status
- Order details display (items, quantities, total)
- Quick action buttons (View, Download Invoice)
- Order timeline and descriptions

#### 3. **Dashboard Overview**
- Quick stats cards showing:
  - Total Orders
  - Total Earnings
  - Referrals count
- Animated stat counters
- Professional header with welcome message

#### 4. **Navigation**
- Fixed navbar with navigation links
- Notification bell with badge
- User avatar with hover effects
- Sidebar menu with active state indicators
- Quick access to all dashboard sections

## 🚀 Getting Started

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- No external dependencies required (uses CDN for Font Awesome icons)

### Installation

1. **Clone or download the project**
   ```bash
   # Navigate to the dashboard folder
   cd dashboard-webpot
   ```

2. **Open in browser**
   - Double-click `index.html` to open locally
   - Or use a local server for best experience:
   
   ```bash
   # Using Python 3
   python -m http.server 8000
   
   # Using Python 2
   python -m SimpleHTTPServer 8000
   
   # Using Node.js (if http-server is installed)
   http-server
   ```

3. **Access the dashboard**
   - Open your browser and navigate to `http://localhost:8000`

## 📁 Project Structure

```
dashboard-webpot/
├── index.html          # Main dashboard HTML
├── css/
│   └── style.css       # All styling and animations
├── js/
│   └── script.js       # Dashboard functionality
└── README.md           # This file
```

## 🎯 Key Components

### Color Palette
```
Primary Dark:      #0a0a0a (Black)
Primary Light:     #ffffff (White)
Secondary Dark:    #1a1a1a (Dark Gray)
Secondary Light:   #f5f5f5 (Light Gray)
Accent Gray:       #666666 (Medium Gray)
Border Gray:       #e0e0e0 (Border)
```

### Animation Effects
- **Slide Down**: Navbar entrance
- **Slide Up**: Content emergence
- **Scale In**: Profile image zoom
- **Pulse**: Notification badge and status indicators
- **Fade In**: Smooth visibility transitions
- **Hover Transforms**: Interactive element feedback
- **Shimmer**: Gradient overlay on cards

## 💻 Customization

### Update User Profile
Edit `userData` object in `js/script.js`:

```javascript
const userData = {
    name: 'Your Name',
    phone: 'Your Phone',
    email: 'Your Email',
    wallet: 'Your Wallet Balance',
    referralCode: 'Your Referral Code'
};
```

### Update Orders
Modify `ordersData` array in `js/script.js` to add/remove orders:

```javascript
{
    id: 'ORD-001',
    date: 'Jan 10, 2024',
    status: 'delivered', // pending, processing, shipped, delivered, cancelled
    items: [
        { name: 'Product Name', quantity: 1, price: 99.99 }
    ],
    total: 99.99,
    description: 'Order description'
}
```

### Change Theme Colors
Modify CSS variables in `css/style.css`:

```css
:root {
    --primary-dark: #0a0a0a;
    --primary-light: #ffffff;
    /* ... other variables ... */
}
```

## 🎬 Animation Details

### Available Animations
1. **slideDown**: Navbar entrance effect
2. **slideUp**: Content fade-in with upward movement
3. **slideInLeft**: Sidebar entrance
4. **scaleIn**: Profile image appearance
5. **fadeIn**: Smooth visibility transition
6. **pulse**: Continuous breathing effect for badges
7. **expandWidth**: Underline animation for active nav items

### Customizing Animations
All animations are defined in `css/style.css` and can be modified:

```css
@keyframes slideUp {
    from {
        transform: translateY(20px);
        opacity: 0;
    }
    to {
        transform: translateY(0);
        opacity: 1;
    }
}
```

## 📱 Responsive Breakpoints

- **Desktop**: 1200px and above - Full layout
- **Tablet**: 768px - 1024px - Adjusted grid layouts
- **Mobile**: Below 768px - Optimized single column
- **Small Mobile**: Below 480px - Minimal layout

## 🔧 JavaScript Functions

### Core Functions

- `loadUserProfile()` - Initialize user profile data
- `loadOrders(filter)` - Load and filter orders
- `createOrderCard(order, index)` - Generate order card HTML
- `copyToClipboard()` - Copy referral code to clipboard
- `viewOrderDetails(orderId)` - View detailed order information
- `downloadInvoice(orderId)` - Trigger invoice download
- `showNotification(message, type)` - Display toast notifications
- `animateOnScroll()` - Trigger animations on scroll

## 🎨 Status Badge Colors

| Status | Background | Text | Icon |
|--------|-----------|------|------|
| Pending | #ffe4b5 | #ff8c00 | 🟠 |
| Processing | #e0e7ff | #4f46e5 | 🔵 |
| Shipped | #dbeafe | #0284c7 | 🔷 |
| Delivered | #dcfce7 | #16a34a | 🟢 |
| Cancelled | #fee2e2 | #dc2626 | 🔴 |

## 🔄 Integration Guide

To integrate with a backend API:

### Replace Sample Data
```javascript
// Instead of hardcoded data, fetch from API
async function loadUserProfile() {
    const response = await fetch('/api/user/profile');
    const data = await response.json();
    // Update UI with real data
}

async function loadOrders(filter = 'all') {
    const response = await fetch(`/api/orders?status=${filter}`);
    const orders = await response.json();
    // Display real orders
}
```

## 🚀 Performance Tips

1. **Use a CDN** for Font Awesome instead of local files
2. **Minify CSS and JavaScript** for production
3. **Lazy load images** using the built-in image observer
4. **Enable gzip compression** on your server
5. **Use CSS animations** instead of JavaScript for better performance

## 📝 Browser Support

- Chrome/Chromium: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support
- Edge: ✅ Full support
- IE 11: ⚠️ Partial support (animations may not work)

## 📄 License

This dashboard is provided as-is for use with your WebPot website.

## 🤝 Support

For questions or issues, refer to the inline code comments or modify the JavaScript functions as needed.

## 🎯 Future Enhancements

- [ ] Dark mode toggle
- [ ] Search functionality
- [ ] Advanced filtering
- [ ] Export reports
- [ ] Real-time notifications
- [ ] Chart analytics
- [ ] User settings management
- [ ] Multi-language support

---

**Created for WebPot** - Professional Dashboard Solution
