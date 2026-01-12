# Google Login CORS Error Fix

## Issue
When registering with Google account, you're getting:
- `Access to fetch... has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header`
- `TypeError: Failed to fetch`

## Root Cause
1. The CORS headers we added to `code.gs` haven't been deployed yet
2. Missing `doOptions()` function to handle preflight requests

## Solution Applied

### 1. Added doOptions() Function to code.gs
- Handles OPTIONS preflight requests from browsers
- Returns CORS headers for any incoming request
- Allows credentials and content-type headers

### 2. CORS Headers Already Added to doGet()
- Success responses include CORS headers
- Error responses include CORS headers
- All requests now properly handled

## What You Need To Do

### ✅ CRITICAL: Redeploy Google Apps Script

1. Go to **Google Apps Script** project
2. Click **Deploy** button (top right)
3. Click **"New Deployment"** (or **"New"** if you see it)
4. Select **Type: Web app**
5. Set **Execute as: Your Account**
6. Set **Who has access: Anyone**
7. Click **Deploy**
8. ✅ **Copy the new deployment URL** and update if needed

### If Deployment URL Changed:
1. Open [dashboard/html/index.html](dashboard/html/index.html)
2. Search for `WEBPOT_CONFIG`
3. Find the line with `API_URL`
4. Paste the new deployment URL there
5. Do the same in `config.js` if it exists

### Update config.js if needed:
1. Check [config.js](config.js)
2. Update `WEBPOT_CONFIG.API_URL` with new deployment URL

## After Redeployment

Try Google login again - it should now work without CORS errors.

## Testing

1. Go to sign-up page
2. Click "Google" button
3. Complete Google sign-in flow
4. You should be redirected to dashboard
5. Verify user data appears correctly

## Files Modified
- `code.gs`: Added `doOptions()` function + CORS headers in doGet()

## Why This Works

- **doOptions()** handles preflight requests (required by browsers before actual requests)
- **CORS headers** tell browser the request is allowed from any origin
- **GET requests only** avoids complex CORS requirements
