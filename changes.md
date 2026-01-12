# Webpot Store - Pending Changes

This document tracks all requested changes, modifications, and fixes that are awaiting execution.

---

## How This Works

- All changes requested by the user will be documented here
- Changes will NOT be performed until explicitly instructed with "Perform these changes" or "Next changes"
- Once changes are performed, they will be removed from this document
- Each change includes the file, location, and exact modification needed

---

## Current Pending Changes

### CORS Fix: Add google_login Handler to Google Apps Script

**Problem:** 
- Google OAuth requests fail because `google_login` action case is missing from doPost switch statement
- CORS headers are correctly configured but handler doesn't exist

**Solution:**
Add `google_login` case to switch statement and create `handleGoogleLogin` function that:
1. Checks if user exists by email
2. If exists → logs them in and returns user data
3. If not exists → creates new user with Google data
4. Returns user with profile picture from Google

**Changes to code.gs:**
1. Add to switch statement in doPost (around line 89):
```javascript
case 'google_login':
  response = handleGoogleLogin(data);
  break;
```

2. Add new function before utility functions section:
```javascript
function handleGoogleLogin(data) {
  try {
    var sheet = getSheet('Users Sheet');
    var values = sheet.getDataRange().getValues();
    
    // Check if user already exists by email
    for (var i = 1; i < values.length; i++) {
      if (values[i][2] === data.email) {
        // User exists - return their data
        return {
          status: 'success',
          message: 'Google login successful',
          user: {
            name: values[i][1],
            email: values[i][2],
            phone: values[i][4],
            profilePic: data.profilePic || values[i][10] || `https://ui-avatars.com/api/?name=${encodeURIComponent(values[i][1])}&background=0ad4ff&color=fff&rounded=true`
          }
        };
      }
    }
    
    // User doesn't exist - create new account via Google
    var referralCode = generateReferralCode(data.name);
    var timestamp = new Date();
    
    sheet.appendRow([
      timestamp,
      data.name,
      data.email,
      Math.random().toString(36).substring(2, 15), // Random password for OAuth users
      '', // Phone (empty for Google signup)
      'active',
      timestamp,
      referralCode,
      '', // Referred by
      0, // Wallet balance
      data.profilePic || '' // Google profile picture
    ]);
    
    // Send notification
    sendAdminNotification('REGISTER', {
      name: data.name,
      email: data.email,
      referralCode: referralCode
    });
    
    logSecurityEvent(data.email, 'GOOGLE_LOGIN_NEW_USER', data.ipAddress);
    
    return {
      status: 'success',
      message: 'Google login successful - account created',
      user: {
        name: data.name,
        email: data.email,
        phone: '',
        profilePic: data.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name)}&background=0ad4ff&color=fff&rounded=true`
      }
    };
  } catch (error) {
    return { status: 'error', message: error.toString() };
  }
}
```

---

## Temporary References & Workarounds

### CORS Policy Error - Solution Strategy (Node.js Proxy Server)

**Problem:** 
Browser CORS policy blocks direct requests from frontend (https://webpot.shop/) to Google Apps Script backend.

**Solution:**
Create a Node.js/Express proxy server with CORS enabled to forward requests between frontend and Google Apps Script.

**How it works:**
```
Client (webpot.shop) 
    ↓ (HTTP request with CORS)
Express Proxy Server (CORS enabled)
    ↓ (Server-to-server, no CORS issues)
Google Apps Script Backend
    ↓ (Response)
Express Proxy Server
    ↓ (Response with CORS headers)
Client (webpot.shop)
```

**Implementation Steps:**
1. Deploy a Node.js/Express server with CORS middleware
2. Create proxy endpoints that forward requests to Google Apps Script
3. Update `config.js` to point `API_URL` to proxy server instead of direct Google Apps Script URL
4. Example proxy configuration:
   ```javascript
   const express = require("express");
   const cors = require("cors");
   const app = express();
   
   app.use(cors({
     origin: ["https://webpot.shop", "http://localhost:5500"],
     methods: ["GET", "POST", "OPTIONS"],
     credentials: true
   }));
   
   app.post("/api/auth", async (req, res) => {
     const gasResponse = await fetch("https://script.google.com/macros/s/AKfycbzsTMQqugs2egDgh_xTvpExdGNOmbLB2rOMW0LtkqY2Nr4gl3UWi4kZhFpDtdsSPiQd/exec", {
       method: "POST",
       headers: { "Content-Type": "application/json" },
       body: JSON.stringify(req.body)
     });
     const data = await gasResponse.json();
     res.json(data);
   });
   
   app.listen(5000, () => console.log("Proxy server listening on 5000"));
   ```

5. Update `config.js`:
   ```javascript
   const WEBPOT_CONFIG = {
     OAUTH_CLIENT_ID: '522296612988-...',
     API_URL: 'https://proxy-server-domain.com/api/auth' // Instead of direct GAS URL
   };
   ```

**Benefits:**
- Solves CORS issues without modifying Google Apps Script
- Adds security layer between frontend and backend
- Can add middleware for validation, logging, rate limiting
- No code changes needed in auth.js or auth.html

**Deployment Options:**
- Vercel (Free tier available)
- Heroku (Simple deployment)
- AWS Lambda + API Gateway
- Google Cloud Run
- Custom VPS

---

### CORS Policy Error - Google Apps Script OPTIONS Request (Temporary)
```javascript
fetch("https://script.google.com/macros/s/AKfycbzsTMQqugs2egDgh_xTvpExdGNOmbLB2rOMW0LtkqY2Nr4gl3UWi4kZhFpDtdsSPiQd/exec", {
  "headers": {
    "accept": "*/*",
    "accept-language": "en-GB,en-US;q=0.9,en;q=0.8",
    "priority": "u=1, i",
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "cross-site"
  },
  "referrer": "https://webpot.shop/",
  "body": null,
  "method": "OPTIONS",
  "mode": "cors",
  "credentials": "omit"
});
```
**Purpose:** OPTIONS preflight request for CORS validation with Google Apps Script backend.
**Status:** Temporary reference for debugging cross-origin requests.

### Google Login API Call - Production Request (Temporary)
```javascript
fetch("https://script.google.com/macros/s/AKfycbzsTMQqugs2egDgh_xTvpExdGNOmbLB2rOMW0LtkqY2Nr4gl3UWi4kZhFpDtdsSPiQd/exec", {
  "headers": {
    "content-type": "application/json",
    "sec-ch-ua": "\"Google Chrome\";v=\"143\", \"Chromium\";v=\"143\", \"Not A(Brand\";v=\"24\"",
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": "\"Windows\""
  },
  "referrer": "https://webpot.shop/",
  "body": "{\"action\":\"google_login\",\"name\":\"Versannon\",\"email\":\"skninja128@gmail.com\",\"profilePic\":\"https://lh3.googleusercontent.com/a/ACg8ocLxGvA9LVjlCLv8hl8YfuvDAiSlyXbMkIuT610_EEq_D0apiQ_7=s96-c\"}",
  "method": "POST",
  "mode": "cors",
  "credentials": "omit"
});
```
**Purpose:** Production Google login API call with user data.
**Payload:** Google OAuth user info (name, email, profile picture)
**Status:** Temporary reference for API testing.

---

## Completed Changes Archive

✅ **Color Scheme Update: Black & Gray - January 12, 2026**

### Files Modified:
1. **auth.css** - Changed primary colors from neon to grayscale
   - CSS Variables updated:
     - `--neon-blue: #00d4ff` → `#b0b0b0` (light gray)
     - `--neon-purple: #b000ff` → `#808080` (medium gray)
     - `--neon-pink: #ff0099` → `#707070` (dark gray)
     - `--border-color: rgba(0, 212, 255, 0.1)` → `rgba(176, 176, 176, 0.1)`
   - All rgba color references updated throughout (10+ instances)
   - Gradient backgrounds now use gray tones: `linear-gradient(135deg, #a0a0a0, #606060)`

2. **styles.css** - Updated login button and navigation colors
   - `.login-btn`: Changed background to gray gradient and updated hover shadow
   - `.user-profile-btn`: Updated border colors from neon blue to light gray
   - `.user-profile-pic`: Changed border from `#00d4ff` to `#b0b0b0`
   - `.user-dropdown`: Changed border color to gray
   - `.dropdown-item:hover`: Updated colors and border from neon to gray

### Result:
- Auth page now displays with a professional black & gray color scheme
- Login button in main navigation uses the same gray gradient
- User profile dropdown maintains the gray theme
- All interactive elements updated for consistency

---

✅ **Previously Completed (January 12, 2026)**

### 1. Login/Dashboard Navigation (index.html)
- Added new `<div class="nav-auth">` container in navigation
- Login button for unauthenticated users
- User profile dropdown with name, profile picture, "Go To Dashboard" link, and logout button
- Dynamic display based on localStorage authentication state

### 2. Auth State Management (script.js)
- Added `initAuthState()` - Checks localStorage and updates nav on page load
- Added `displayLoginButton()` - Shows login button when not authenticated
- Added `displayUserMenu()` - Shows user profile with name and picture when authenticated
- Added `toggleUserMenu()` - Handles dropdown toggle
- Added `logoutUser()` - Clears localStorage and redirects to home
- Integrated into DOMContentLoaded event

### 3. Authentication Navigation Styling (styles.css)
- `.nav-auth` - Flex container for auth controls
- `.login-btn` - Gradient button with hover effects
- `.user-menu` - Relative positioning for dropdown
- `.user-profile-btn` - Profile button with border and hover effects
- `.user-profile-pic` - Circular profile image with border
- `.user-dropdown` - Glassmorphism dropdown menu with animations
- `.dropdown-item` - Menu items with hover effects
- `.logout-btn` - Special styling for logout button
- Mobile responsive design with media query for screens ≤600px

---

**Location:** In the `<header>` section, within the `<nav>` element

**Change:** Replace the current nav structure to include:
- A new `<div class="nav-auth">` container that will dynamically show either:
  - **When NOT logged in:** A "Login" button linking to `auth.html`
  - **When logged in:** A user profile dropdown with:
    - User's profile picture (circular)
    - Username display
    - "Go To Dashboard" link
    - "Logout" button

**Current structure:**
```html
<ul class="nav-menu" id="navMenu">
    <li><a href="#home" onclick="closeMenu()">Home</a></li>
    <li><a href="#about" onclick="closeMenu()">About</a></li>
    <li><a href="#services" onclick="closeMenu()">Services</a></li>
    <li><a href="#contact" onclick="closeMenu()">Contact</a></li>
</ul>
<div class="notification-wrapper">
    ...
</div>
<button class="cta-btn" onclick="openOrderModal()">Get Started</button>
```

**New structure needed:**
```html
<ul class="nav-menu" id="navMenu">
    <li><a href="#home" onclick="closeMenu()">Home</a></li>
    <li><a href="#about" onclick="closeMenu()">About</a></li>
    <li><a href="#services" onclick="closeMenu()">Services</a></li>
    <li><a href="#contact" onclick="closeMenu()">Contact</a></li>
</ul>

<!-- NEW: Auth Navigation Container -->
<div class="nav-auth" id="navAuth">
    <!-- Login Button (shown when NOT logged in) -->
    <a href="auth.html" class="login-btn" id="loginBtn">Login</a>
    
    <!-- User Profile Dropdown (shown when logged in) -->
    <div class="user-menu" id="userMenu" style="display: none;">
        <button class="user-profile-btn" onclick="toggleUserMenu(event)">
            <img class="user-profile-pic" id="userProfilePic" src="" alt="Profile">
            <span class="user-name" id="userName"></span>
            <span class="dropdown-arrow">▼</span>
        </button>
        <div class="user-dropdown" id="userDropdown">
            <a href="dashboard/customer.html" class="dropdown-item">Go To Dashboard</a>
            <button class="dropdown-item logout-btn" onclick="logoutUser()">Logout</button>
        </div>
    </div>
</div>

<div class="notification-wrapper">
    ...
</div>
<button class="cta-btn" onclick="openOrderModal()">Get Started</button>
```

---

### 2. Add Auth State Management (script.js)

**Location:** Add new function block at the beginning of script.js (after the backend communication functions)

**Change:** Add authentication initialization and management functions:

```javascript
// ========== AUTHENTICATION STATE MANAGEMENT ==========

// Check if user is logged in and update nav accordingly
function initAuthState() {
    const isLoggedIn = localStorage.getItem('webpotUserLoggedIn') === 'true';
    
    if (isLoggedIn) {
        displayUserMenu();
    } else {
        displayLoginButton();
    }
}

// Show login button (when not logged in)
function displayLoginButton() {
    const loginBtn = document.getElementById('loginBtn');
    const userMenu = document.getElementById('userMenu');
    
    if (loginBtn) loginBtn.style.display = 'inline-block';
    if (userMenu) userMenu.style.display = 'none';
}

// Show user menu with profile (when logged in)
function displayUserMenu() {
    const loginBtn = document.getElementById('loginBtn');
    const userMenu = document.getElementById('userMenu');
    const userProfilePic = document.getElementById('userProfilePic');
    const userName = document.getElementById('userName');
    
    const name = localStorage.getItem('webpotUserName') || 'User';
    const profilePic = localStorage.getItem('webpotUserProfilePic') || '';
    
    if (loginBtn) loginBtn.style.display = 'none';
    if (userMenu) userMenu.style.display = 'flex';
    if (userName) userName.textContent = name;
    if (userProfilePic && profilePic) {
        userProfilePic.src = profilePic;
    } else {
        // Fallback: Use initials or default avatar
        userProfilePic.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Ccircle cx="50" cy="50" r="50" fill="%23cccccc"/%3E%3Ctext x="50" y="60" font-size="50" text-anchor="middle" fill="white" font-weight="bold"%3E' + (name.charAt(0).toUpperCase()) + '%3C/text%3E%3C/svg%3E';
    }
}

// Toggle user dropdown menu
function toggleUserMenu(event) {
    event.stopPropagation();
    const dropdown = document.getElementById('userDropdown');
    if (dropdown) {
        dropdown.classList.toggle('active');
    }
}

// Close dropdown when clicking outside
document.addEventListener('click', function(e) {
    const userMenu = document.getElementById('userMenu');
    const dropdown = document.getElementById('userDropdown');
    
    if (userMenu && !userMenu.contains(e.target)) {
        if (dropdown) dropdown.classList.remove('active');
    }
});

// Logout user
function logoutUser() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('webpotUserLoggedIn');
        localStorage.removeItem('webpotUserName');
        localStorage.removeItem('webpotUserEmail');
        localStorage.removeItem('webpotUserProfilePic');
        
        displayLoginButton();
        alert('You have been logged out successfully.');
        window.location.href = 'index.html';
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    initAuthState();
});
```

---

### 3. Add Auth Navigation Styling (styles.css)

**Location:** Add new CSS rules for authentication navigation styling

**Change:** Add the following CSS classes at the end of styles.css:

```css
/* ========== AUTHENTICATION NAVIGATION ========== */

.nav-auth {
    display: flex;
    align-items: center;
    gap: 15px;
    margin-left: auto;
    margin-right: 10px;
}

.login-btn {
    padding: 8px 20px;
    background: linear-gradient(135deg, #00d4ff, #b000ff);
    color: white;
    border-radius: 20px;
    text-decoration: none;
    font-weight: 600;
    font-size: 14px;
    transition: all 0.3s ease;
    cursor: pointer;
    border: none;
    display: inline-block;
}

.login-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(0, 212, 255, 0.4);
}

.user-menu {
    position: relative;
}

.user-profile-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    background: transparent;
    border: 2px solid rgba(0, 212, 255, 0.3);
    border-radius: 25px;
    padding: 5px 10px;
    cursor: pointer;
    color: white;
    font-size: 14px;
    font-weight: 600;
    transition: all 0.3s ease;
}

.user-profile-btn:hover {
    border-color: #00d4ff;
    box-shadow: 0 0 15px rgba(0, 212, 255, 0.3);
}

.user-profile-pic {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid #00d4ff;
}

.dropdown-arrow {
    font-size: 10px;
    transition: transform 0.3s ease;
}

.user-profile-btn:hover .dropdown-arrow {
    transform: rotate(180deg);
}

.user-dropdown {
    position: absolute;
    top: 100%;
    right: 0;
    background: rgba(20, 25, 35, 0.95);
    border: 1px solid rgba(0, 212, 255, 0.3);
    border-radius: 10px;
    min-width: 200px;
    margin-top: 10px;
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.5);
    opacity: 0;
    visibility: hidden;
    transform: translateY(-10px);
    transition: all 0.3s ease;
    z-index: 1000;
    backdrop-filter: blur(10px);
}

.user-dropdown.active {
    opacity: 1;
    visibility: visible;
    transform: translateY(0);
}

.dropdown-item {
    display: block;
    padding: 12px 20px;
    color: white;
    text-decoration: none;
    border: none;
    background: transparent;
    cursor: pointer;
    width: 100%;
    text-align: left;
    font-size: 14px;
    transition: all 0.3s ease;
}

.dropdown-item:hover {
    background: rgba(0, 212, 255, 0.1);
    color: #00d4ff;
    border-left: 3px solid #00d4ff;
    padding-left: 17px;
}

.logout-btn {
    border-top: 1px solid rgba(0, 212, 255, 0.2);
}

.logout-btn:hover {
    background: rgba(255, 0, 0, 0.1);
    color: #ff6b6b;
    border-left-color: #ff6b6b;
}

/* Mobile responsive */
@media (max-width: 600px) {
    .nav-auth {
        margin-right: 0;
        margin-left: 10px;
    }
    
    .login-btn {
        padding: 6px 16px;
        font-size: 13px;
    }
    
    .user-profile-btn {
        padding: 4px 8px;
        font-size: 12px;
    }
    
    .user-profile-pic {
        width: 28px;
        height: 28px;
    }
    
    .user-dropdown {
        right: -10px;
        min-width: 180px;
    }
    
    .user-name {
        max-width: 80px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
}
```

---

## Summary of Changes

1. **index.html** - Add new `<div class="nav-auth">` container with login button and user profile dropdown
2. **script.js** - Add authentication state management functions (initAuthState, displayUserMenu, displayLoginButton, logoutUser, etc.)
3. **styles.css** - Add CSS styling for login button, user profile button, dropdown menu, and responsive design

---

## Completed Changes Archive

✅ **Successfully Performed - January 12, 2026**

### 1. Login/Dashboard Navigation (index.html)
- Added new `<div class="nav-auth">` container in navigation
- Login button for unauthenticated users
- User profile dropdown with name, profile picture, "Go To Dashboard" link, and logout button
- Dynamic display based on localStorage authentication state

### 2. Auth State Management (script.js)
- Added `initAuthState()` - Checks localStorage and updates nav on page load
- Added `displayLoginButton()` - Shows login button when not authenticated
- Added `displayUserMenu()` - Shows user profile with name and picture when authenticated
- Added `toggleUserMenu()` - Handles dropdown toggle
- Added `logoutUser()` - Clears localStorage and redirects to home
- Integrated into DOMContentLoaded event

### 3. Authentication Navigation Styling (styles.css)
- `.nav-auth` - Flex container for auth controls
- `.login-btn` - Neon gradient button with hover effects
- `.user-menu` - Relative positioning for dropdown
- `.user-profile-btn` - Profile button with border and hover effects
- `.user-profile-pic` - Circular profile image with border
- `.user-dropdown` - Glassmorphism dropdown menu with animations
- `.dropdown-item` - Menu items with hover effects
- `.logout-btn` - Special styling for logout button
- Mobile responsive design with media query for screens ≤600px

### Implementation Flow
1. User not logged in → Sees "Login" button
2. User clicks Login → Redirected to auth.html
3. User logs in/registers → Returns to index.html with localStorage data
4. `initAuthState()` detects localStorage on page load
5. Nav automatically updates to show user profile, "Go To Dashboard", and Logout options
6. User clicks Logout → localStorage cleared, redirected to home

