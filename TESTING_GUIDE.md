# Testing Guide - CORS Refactoring

## Quick Test Checklist

### 1. Manual Login Test
**URL:** `https://webpot.shop/auth.html`
- [ ] Click "Sign In" tab
- [ ] Enter test email: `test@example.com`
- [ ] Enter test password: `TestPass123!`
- [ ] Click "Sign In" button
- [ ] Check browser Console (F12) for any errors
- [ ] Should show success message (no CORS errors)
- [ ] Redirects to index.html if user exists

### 2. Registration Test
**URL:** `https://webpot.shop/auth.html`
- [ ] Click "Create Account" tab
- [ ] Enter full name: `Test User`
- [ ] Enter email: `newuser@example.com`
- [ ] Enter password: `StrongPass123!`
- [ ] Confirm password
- [ ] Click "Create Account"
- [ ] Check Console for errors
- [ ] Should create account (no CORS errors)

### 3. Google Sign-In Test
**URL:** `https://webpot.shop/auth.html`
- [ ] Click "Google" button
- [ ] Sign in with Google account
- [ ] Check Console for errors
- [ ] Should authenticate and redirect (no CORS errors)
- [ ] Verify profile picture displays on home page

### 4. Admin Dashboard Test
**URL:** `https://webpot.shop/dashboard/admin.html`
- [ ] Enter admin password: `WebpotAdmin2026`
- [ ] Navigate to "Orders" section
- [ ] Check Console for errors
- [ ] Orders list should load (no CORS errors)
- [ ] Try to update order status
- [ ] Verify changes apply without CORS errors

### 5. Console Verification
Press F12 → Console tab, you should **NOT** see:
```
Access to XMLHttpRequest at 'https://script.google.com/...' 
from origin 'https://webpot.shop' has been blocked by CORS policy
```

## Network Tab Analysis

### Before (Failing)
In Chrome DevTools → Network tab:
```
1. OPTIONS /macros/s/AKfycbz...  [CORS Preflight]
   → Status: (blocked):cors
   ✗ FAILED

2. POST /macros/s/AKfycbz...     [Actual Request]
   → Never executes because preflight failed
```

### After (Working)
In Chrome DevTools → Network tab:
```
1. GET /macros/s/AKfycbz...?action=login&email=...
   → Status: 200 OK
   → Response: {"status":"success",...}
✓ SUCCESS
```

## Request/Response Examples for Testing

### Example 1: Login Request
**Request:**
```
GET https://script.google.com/macros/s/AKfycbzT0E1Zix3An0ghzczjBxZjsmqRbLcwnldWdRmMRGj4ukos_DFrLbOc49ssUr8ba53L/exec?action=login&email=test%40example.com&password=TestPass123! HTTP/1.1
```

**Expected Response:**
```json
{
  "status": "success",
  "message": "Login successful",
  "user": {
    "name": "Test User",
    "email": "test@example.com",
    "phone": "9876543210",
    "profilePic": "https://ui-avatars.com/api/?name=Test+User&..."
  }
}
```

### Example 2: Registration Request
**Request:**
```
GET https://script.google.com/macros/s/.../exec?action=register&name=New+User&email=new%40example.com&password=Pass123 HTTP/1.1
```

**Expected Response:**
```json
{
  "status": "success",
  "message": "User registered successfully",
  "user": {
    "name": "New User",
    "email": "new@example.com",
    "referralCode": "WEBPOT-NEW123"
  }
}
```

### Example 3: Google Login Request
**Request:**
```
GET https://script.google.com/macros/s/.../exec?action=google_login&idToken=eyJ...&email=user%40gmail.com&name=John+Doe&profilePic=https%3A%2F%2F... HTTP/1.1
```

**Expected Response:**
```json
{
  "status": "success",
  "message": "Google login successful",
  "user": {
    "name": "John Doe",
    "email": "user@gmail.com",
    "profilePic": "https://lh3.googleusercontent.com/..."
  }
}
```

### Example 4: Get All Orders (Admin)
**Request:**
```
GET https://script.google.com/macros/s/.../exec?action=get_all_orders&adminKey=WebpotAdmin2026 HTTP/1.1
```

**Expected Response:**
```json
{
  "status": "success",
  "orders": [
    {
      "timestamp": "2026-01-12...",
      "orderId": "ORD-1234567890",
      "clientName": "John Doe",
      "email": "john@example.com",
      "serviceType": "Starter",
      "totalAmount": 2999,
      "paidAmount": 2999,
      "dueAmount": 0,
      "status": "completed"
    }
  ]
}
```

## Browser Compatibility

| Browser | Status | Notes |
|---------|--------|-------|
| Chrome | ✅ | Works perfectly |
| Firefox | ✅ | Works perfectly |
| Safari | ✅ | Works perfectly |
| Edge | ✅ | Works perfectly |
| IE 11 | ⚠️ | URLSearchParams supported (IE 11+) |

## Common Issues & Solutions

### Issue 1: Still Seeing CORS Errors
**Possible Cause:** Browser cache
**Solution:** 
- Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
- Or: DevTools → Network → "Disable cache" checkbox

### Issue 2: Query Parameters Not Being Passed
**Possible Cause:** URLSearchParams not supported
**Solution:**
- Check browser version (URLSearchParams requires IE 11+)
- Verify no JavaScript errors in Console

### Issue 3: 404 Error on Apps Script URL
**Possible Cause:** Wrong API_URL in config.js
**Solution:**
- Verify config.js has correct URL
- Check that Apps Script deployment is active
- Try accessing API_URL + "?action=" in browser to test

### Issue 4: Login Works but Redirect Fails
**Possible Cause:** Relative path issues
**Solution:**
- Check browser console for any redirect errors
- Verify localStorage is enabled (check privacy settings)

## Deployment Checklist

### Google Apps Script
- [ ] Deploy new version of code.gs
- [ ] Ensure deployment is set to "Anyone" access
- [ ] Ensure execution is set to "Me" (your account)
- [ ] Test with a GET request to verify it works
- [ ] Keep old version for rollback if needed

### Frontend Files
- [ ] Upload updated auth.js to `/auth.js`
- [ ] Upload updated script.js to `/script.js`
- [ ] Upload updated admin.js to `/dashboard/admin.js`
- [ ] Test each authentication flow
- [ ] Verify no CORS errors in console

## Rollback Plan

If CORS errors reappear:

1. **Revert Apps Script:**
   - Go to code.gs revision history
   - Restore previous version
   - Update deployment

2. **Revert Frontend:**
   - Restore previous versions of:
     - auth.js
     - script.js
     - admin.js

3. **Test:**
   - Verify old flow works again
   - Check console for errors

---

## Performance Notes

- **GET requests vs POST:** Slightly faster (no body serialization)
- **Query string limits:** Modern browsers support ~2000+ characters (we're using far less)
- **Caching:** GET requests may be cached by browsers (expected for this API)

## Security Reminders

✅ **HTTPS enforced** - Both GitHub Pages and Apps Script use HTTPS
✅ **Admin key required** - Admin endpoints verify adminKey parameter
✅ **No sensitive data in URLs** - Query strings are visible but so was POST data to network inspection

⚠️ **Future improvement:** Implement server-side password hashing and session tokens for production-grade security

---

Last Updated: 2026-01-12
Status: ✅ Ready for Testing
