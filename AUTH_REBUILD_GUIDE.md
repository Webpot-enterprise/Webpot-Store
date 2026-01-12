# Login System Rebuild Guide

## What Has Been Removed ✓

Your website has been completely cleaned of the old login system:

### Deleted Files
- `auth.html` - The login/register page
- `auth.css` - Login page styles  
- `auth.js` - All authentication code (750 lines)

### Removed Backend Functions
- User registration handler
- User login handler
- Password reset functions
- 2FA/OTP verification
- User database management
- All authentication API endpoints

### Frontend Cleanup
- Login navigation link removed
- Dashboard link removed from nav menu
- User profile display removed
- All localStorage auth references removed
- Order form now accessible without login

---

## Next: Building Your New Login System

### Step 1: Choose Your Authentication Method

**Option A: Traditional Email/Password**
```
- Simple and familiar
- You control everything
- Need secure password storage (bcrypt/argon2)
- Best for: Full control, custom workflows
```

**Option B: OAuth (Google/GitHub/Facebook)**
```
- Quick setup
- No password management
- User data from provider
- Best for: Speed, delegation
```

**Option C: Passwordless (Magic Links/OTP)**
```
- Modern and secure
- Email-based verification
- No password to forget
- Best for: User convenience
```

**Option D: Firebase Auth**
```
- Managed solution
- Multiple auth methods included
- Real-time database
- Best for: Full-featured app

### Step 2: Update Backend Configuration

1. **Update `config.js`:**
```javascript
const WEBPOT_CONFIG = {
  API_BASE_URL: 'your-backend-url',
  AUTH_PROVIDER: 'google|firebase|custom', // Choose one
  JWT_SECRET: 'your-secret-key', // If using JWT
  // Add other config as needed
};
```

2. **Update `code.gs`** (Google Apps Script backend):
   - Add user registration handler
   - Add login validation endpoint
   - Add session/token management
   - Add password reset flow
   - Add database operations for users

### Step 3: Create New Frontend

1. **Create new `auth.html`:**
   - Login form (email + password)
   - Registration form (name, email, password)
   - Forgot password form
   - Reset password flow
   - Account verification (if needed)

2. **Create new `auth.js`:**
   - Login submission handler
   - Registration submission handler
   - Password reset flow
   - Token/session storage
   - Redirect to dashboard on success

3. **Update `index.html`:**
   - Add back login link
   - Add user profile dropdown
   - Add logout button
   - Conditional navigation based on auth state

4. **Update `script.js`:**
   - Check if user is logged in on page load
   - Update navigation based on auth state
   - Handle logout
   - Redirect to login if needed for protected pages

### Step 4: Implement Protected Pages

1. **Dashboard (`dashboard/customer.html`)**
   - Check if user is authenticated
   - Show user's orders
   - Show user profile
   - Allow order tracking

2. **Admin Panel (`webpot-admin/admin.html`)**
   - Admin-only access control
   - Verify admin role on backend

---

## Code Examples

### Simple Email/Password Login

**HTML Form (auth.html):**
```html
<form id="loginForm" onsubmit="handleLogin(event)">
  <input type="email" id="email" required placeholder="Email">
  <input type="password" id="password" required placeholder="Password">
  <button type="submit">Login</button>
</form>
```

**JavaScript Handler (auth.js):**
```javascript
async function handleLogin(event) {
  event.preventDefault();
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  
  const response = await fetch('YOUR_API_URL/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  
  const data = await response.json();
  
  if (data.status === 'success') {
    // Store auth token
    localStorage.setItem('authToken', data.token);
    localStorage.setItem('userId', data.userId);
    localStorage.setItem('userName', data.userName);
    
    // Redirect to home
    window.location.href = 'index.html';
  } else {
    alert('Login failed: ' + data.message);
  }
}
```

**Backend Handler (code.gs):**
```javascript
function handleLogin(data) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Users');
  var values = sheet.getDataRange().getValues();
  
  // Check email and password
  for (var i = 1; i < values.length; i++) {
    if (values[i][1] === data.email && values[i][2] === data.password) {
      // Generate token (simple example)
      var token = generateToken(data.email);
      
      return {
        status: 'success',
        token: token,
        userId: values[i][0],
        userName: values[i][3]
      };
    }
  }
  
  return { status: 'error', message: 'Invalid credentials' };
}
```

---

## Security Checklist

Before launching your new auth system:

- [ ] Passwords hashed with bcrypt or similar (NEVER plain text)
- [ ] HTTPS/SSL enabled on all pages
- [ ] CSRF tokens on all forms
- [ ] Rate limiting on login attempts
- [ ] Input validation on backend
- [ ] SQL injection prevention (if using SQL)
- [ ] XSS prevention (sanitize user input)
- [ ] Secure session storage
- [ ] Password reset email verification
- [ ] Email confirmation for new accounts
- [ ] Account lockout after failed attempts
- [ ] Logging of auth events

---

## Testing Checklist

- [ ] User can register new account
- [ ] User can login with correct credentials
- [ ] Login fails with wrong password
- [ ] Login fails with non-existent email
- [ ] User stays logged in after page refresh
- [ ] User can logout
- [ ] Protected pages redirect to login when not authenticated
- [ ] Password reset works via email
- [ ] User profile shows after login
- [ ] Navigation updates based on login state

---

## Files to Create/Modify

**New/Modified:**
- Create new `auth.html` - Login/signup page
- Create new `auth.js` - Auth handling code
- Create new `auth.css` - Auth styling
- Update `index.html` - Add login link, user menu
- Update `script.js` - Check auth state on load
- Update `config.js` - Add API endpoints
- Update `code.gs` - Add auth handlers

---

## Quick Start Recommendation

1. **Start with Firebase** if you want fastest setup (includes auth + database)
2. **Or use Google OAuth** if you just need simple login
3. **Or build custom** if you need full control

All three work with your current setup. Choose based on your needs and timeline!

Good luck with your new authentication system! 🚀
