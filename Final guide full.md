# Complete Production Deployment Guide
## GitHub Pages + Google Sheets + Google Apps Script + Cloudflare Workers

**Last Updated:** January 2026  
**Version:** 1.0 - Production Ready  
**Scope:** Web Application Deployment (Cloud Architecture)

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Prerequisites](#2-prerequisites)
3. [Google Sheets Setup](#3-google-sheets-setup)
4. [Google Apps Script Setup](#4-google-apps-script-setup)
5. [Cloudflare Worker Setup](#5-cloudflare-worker-setup)
6. [Cloudflare Worker Code](#6-cloudflare-worker-code)
7. [Frontend Integration (GitHub Pages)](#7-frontend-integration-github-pages)
8. [GitHub Pages Deployment](#8-github-pages-deployment)
9. [Testing Checklist](#9-testing-checklist-critical)
10. [Common Problems & Solutions](#10-common-problems--solutions)
11. [Production Hardening](#11-production-hardening-optional-but-recommended)

---

## 1. Architecture Overview

### The Complete Request/Response Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER BROWSER (GitHub Pages)                   │
│                   (yoursite.github.io)                           │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐   │
│  │ Frontend Application (HTML/CSS/JavaScript)             │   │
│  │ - Static files served from GitHub Pages                │   │
│  │ - Makes FETCH requests to API                          │   │
│  │ - Uses https://api.yourdomain.com/api/*                │   │
│  └────────────────────────────────────────────────────────┘   │
│                         ▲                                        │
│                         │ HTTPS Request                          │
│                         │ /api/orders?action=getOrders           │
│                         │                                        │
└─────────────────────────┼────────────────────────────────────────┘
                          │
                          │ (Cloudflare handles CORS)
                          │
┌─────────────────────────▼────────────────────────────────────────┐
│              CLOUDFLARE WORKER (Reverse Proxy)                    │
│              (api.yourdomain.com)                                 │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐   │
│  │ Route: /api/* → Forward to Google Apps Script          │   │
│  │ - Adds CORS headers to all responses                   │   │
│  │ - Handles OPTIONS preflight requests                   │   │
│  │ - Forwards request body, query params, headers         │   │
│  │ - Normalizes responses                                 │   │
│  └────────────────────────────────────────────────────────┘   │
│                         ▲                                        │
│                         │ HTTP Request to GAS Web App URL       │
│                         │ /api/orders?action=getOrders          │
│                         │                                        │
└─────────────────────────┼────────────────────────────────────────┘
                          │
                          │
┌─────────────────────────▼────────────────────────────────────────┐
│        GOOGLE APPS SCRIPT (Backend API)                           │
│        (script.google.com/macros/s/.../exec)                      │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐   │
│  │ doGet / doPost handler                                 │   │
│  │ - Routes requests by ?action= parameter                │   │
│  │ - Queries Google Sheets directly                       │   │
│  │ - Returns JSON response                                │   │
│  │ - No authentication needed (public web app)            │   │
│  └────────────────────────────────────────────────────────┘   │
│                         ▲                                        │
│                         │ Direct read/write                      │
│                         │                                        │
└─────────────────────────┼────────────────────────────────────────┘
                          │
                          │
┌─────────────────────────▼────────────────────────────────────────┐
│              GOOGLE SHEETS (Database)                             │
│              (docs.google.com/spreadsheets/...)                   │
│                                                                  │
│  Users | Sessions | AuthTokens | Logs | Orders | ReferralCodes  │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Why Cloudflare Workers is Required

| Problem | Solution | Details |
|---------|----------|---------|
| **CORS Errors** | Cloudflare adds CORS headers | Browsers block direct GAS calls across origins |
| **Preflight Requests** | Handle OPTIONS method | Browser sends OPTIONS before POST to check permissions |
| **Direct Origin Exposure** | Hide GAS URL behind Cloudflare domain | Security - don't expose GAS URL publicly |
| **Custom Domain** | Use your own domain instead of Cloudflare's | Professional appearance and easy URL management |
| **Request Forwarding** | Rewrite /api/* routes to GAS | Clean, consistent API endpoints |

### The Three-Tier Request Flow (Detailed)

1. **Frontend (Browser)** → Makes HTTPS request to `https://api.yourdomain.com/api/orders?action=getOrders`
2. **Cloudflare Worker** → Receives request, validates it's valid, adds CORS headers, forwards to GAS URL, receives response, adds CORS headers again, returns to browser
3. **Google Apps Script** → Receives request, parses `?action=` parameter, queries Google Sheets, returns JSON
4. **Google Sheets** → Stores and retrieves all data (acts as database)

---

## 2. Prerequisites

### Required Accounts (All Free Tier Sufficient)

| Service | Tier | Required? | Purpose |
|---------|------|-----------|---------|
| **GitHub** | Free | ✅ YES | Host frontend static files via GitHub Pages |
| **Google** | Free (with Google Account) | ✅ YES | Google Apps Script + Google Sheets |
| **Cloudflare** | Free | ✅ YES | Reverse proxy, CORS handler, custom domain |
| **Domain Registrar** | Any | ⚠️ OPTIONAL | If you want custom domain (not required for testing) |

### What Must Already Exist

Before starting this guide, you MUST have:

- [ ] A GitHub account with repository created
- [ ] Repository has basic HTML/CSS/JS frontend files ready
- [ ] A Google account (personal or workspace)
- [ ] A Cloudflare account
- [ ] **Optional:** Domain registered and nameservers configured to Cloudflare

### Credentials to Gather

You'll need these values throughout setup. **Keep them secure and never commit to git:**

| Item | Where to Find | Example Format |
|------|---------------|-----------------|
| **Google Sheet ID** | URL between `/d/` and `/edit` | `1A2B3C4D5E6F7G8H9I` |
| **GAS Web App URL** | Deploy → New Deployment → Copy URL | `https://script.google.com/macros/s/AKFYC.../exec` |
| **Cloudflare Zone ID** | Account Home → select domain → API token section | Long alphanumeric string |
| **Cloudflare API Token** | Settings → API tokens → Create token | Bearer token for authentication |
| **GitHub Pages URL** | Repository Settings → Pages → Current domain | `https://username.github.io/repo` |

---

## 3. Google Sheets Setup

### Step 1: Create the Master Google Sheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Click **"+ New"** → Select **"Blank Spreadsheet"**
3. Click the **"Untitled spreadsheet"** at the top to rename it
4. Name it: **`Production-Backend-Database`**
5. Press **Enter**
6. **⚠️ CRITICAL:** Click **Share** → Share with your email address and ensure **Editor** access is selected
7. **Do NOT** make this public to "Anyone with the link" unless you intend public database access

### Step 2: Get and Save Your Sheet ID

1. Look at the browser URL: `https://docs.google.com/spreadsheets/d/XXXXX/edit`
2. Copy the long string between `/d/` and `/edit` - this is your **Sheet ID**
3. Save this securely - you'll need it for Google Apps Script
4. **Example Sheet ID:** `1CbFocUID9WLRrX34Xx093qxGC7V5CpZWRIU4H5NRTnM7pDBpLcZboPX2`

### Step 3: Create Required Tabs and Columns

Create the following tabs at the bottom of your sheet. For each tab, ensure **row 1 contains headers** (critical for GAS to work):

#### Tab 1: `Users`

| A | B | C | D | E | F | G | H | I | J |
|---|---|---|---|---|---|---|---|---|---|
| `user_id` | `email` | `password_hash` | `auth_provider` | `full_name` | `created_at` | `updated_at` | `status` | `google_oauth_id` | `last_login` |

**Data Validation:**
- Column D (auth_provider): Dropdown list → `manual,google_oauth`
- Column H (status): Dropdown list → `active,inactive,suspended,pending_verification`

#### Tab 2: `Sessions`

| A | B | C | D | E | F | G |
|---|---|---|---|---|---|---|
| `session_id` | `user_id` | `token` | `created_at` | `expires_at` | `ip_address` | `device_info` |

**Data Validation:**
- Column E (expires_at): Date format only

#### Tab 3: `AuthTokens`

| A | B | C | D | E | F |
|---|---|---|---|---|---|
| `token_id` | `user_id` | `token_hash` | `created_at` | `expires_at` | `token_type` |

**Data Validation:**
- Column F (token_type): Dropdown list → `refresh_token,access_token,reset_token`

#### Tab 4: `Logs`

| A | B | C | D | E | F |
|---|---|---|---|---|---|
| `log_id` | `user_id` | `action` | `timestamp` | `ip_address` | `details` |

**Data Validation:**
- Column C (action): Dropdown list → `login,register,logout,password_reset,oauth_auth,token_refresh,access_denied,order_placed,order_updated,confirmation_sent,fetch_orders,fetch_order_details`

#### Tab 5: `Orders`

| A | B | C | D | E | F | G | H | I | J | K | L | M | N |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `order_id` | `user_id` | `customer_email` | `customer_name` | `order_date` | `total_amount` | `currency` | `order_status` | `service_type` | `service_details` | `delivery_date` | `payment_method` | `referral_code_used` | `confirmation_sent` |

**Data Validation:**
- Column E (order_date): Date format only
- Column G (currency): Dropdown → `USD,EUR,GBP,INR`
- Column H (order_status): Dropdown → `pending,processing,shipped,delivered,cancelled`
- Column I (service_type): Dropdown → `Starter,Basic,Premium`
- Column L (payment_method): Dropdown → `credit_card,debit_card,paypal,bank_transfer,other`
- Column N (confirmation_sent): Dropdown → `yes,no,pending`

#### Tab 6: `ReferralCodes`

| A | B | C | D | E | F | G | H | I | J |
|---|---|---|---|---|---|---|---|---|---|
| `code_id` | `referral_code` | `user_id` | `created_by` | `created_at` | `expires_at` | `discount_percentage` | `max_uses` | `current_uses` | `status` |

**Data Validation:**
- Columns E & F (dates): Date format only
- Column J (status): Dropdown → `active,inactive,expired`

### Step 4: Lock Headers (CRITICAL)

For **each tab**:
1. Click the row number **"1"** to select the entire first row
2. Click **Format** → **Freeze** → **1 row**
3. This prevents accidental header deletion

### Common Mistakes to Avoid

| Mistake | Impact | Solution |
|---------|--------|----------|
| Wrong header names | GAS can't find columns | Match exactly: `user_id`, `order_id`, etc. |
| No data validation | Invalid data enters database | Add dropdowns for status, type fields |
| Public sharing | Security risk if sensitive data | Share only with specific email addresses |
| Headers in row 2 instead of row 1 | GAS lookup fails | Always use row 1 for headers |
| Unfrozen headers | Accidental deletion possible | Freeze row 1 on every tab |
| Mixed column order | GAS queries return wrong data | Keep column order consistent |

---

## 4. Google Apps Script Setup

### Step 1: Create a New Google Apps Script Project

1. Go to [Google Apps Script](https://script.google.com)
2. Click **"+ New Project"** or **"Create Project"**
3. Name it: **`Production-Web-API`**
4. In the editor, you'll see a default `Code.gs` file with a `myFunction()` placeholder
5. Delete the placeholder code and replace it with the complete code shown in Section 6

### Step 2: Link Your Google Sheet

At the top of your `Code.gs` file, add:

```javascript
// ============================================================================
// CONFIGURATION
// ============================================================================

// Production Sheet ID: 1CbFocUID9WLRrX34Xx093qxGC7V5CpZWRIU4H5NRTnM7pDBpLcZboPX2
const SHEET_ID = "1CbFocUID9WLRrX34Xx093qxGC7V5CpZWRIU4H5NRTnM7pDBpLcZboPX2";
const SHEET = SpreadsheetApp.openById(SHEET_ID);

// ============================================================================
// MAIN HANDLERS (DO NOT MODIFY)
// ============================================================================

function doGet(e) {
  return handleRequest(e, 'GET');
}

function doPost(e) {
  return handleRequest(e, 'POST');
}
```

**⚠️ WARNING:** Replace `1CbFocUID9WLRrX34Xx093qxGC7V5CpZWRIU4H5NRTnM7pDBpLcZboPX2` with **your actual Sheet ID** from Section 3.

### Step 3: Create Library Functions

You'll need helper functions to:
- Parse query parameters
- Convert Sheets data to JSON
- Handle errors gracefully
- Log all requests

These are included in the full code template in Section 6.

### Step 4: Deploy as Web App

This is the **MOST CRITICAL** step and most commonly done incorrectly:

1. Click **Deploy** (top right button)
2. Click **"New Deployment"**
3. Click the **gear icon** → Select **"Web app"**
4. Set the following options:

   | Setting | Value | Why |
   |---------|-------|-----|
   | **Execute as** | Your Google Account | Must be your account for Sheet access |
   | **Who has access** | **Anyone** | Cloudflare Worker must call it without auth |

5. Click **Deploy**
6. You'll see a dialog with the Web App URL
7. **Copy and save this URL immediately** - this is your GAS Web App URL
8. Click **Close**

**⚠️ CRITICAL WARNINGS:**

| Warning | Problem | Solution |
|---------|---------|----------|
| Deploy as "Me" but "Only myself" access | Frontend can't call it | Change "Who has access" to "Anyone" |
| Copy old URL from previous deploy | It won't work for new code | Always use the newest deployment URL |
| Forget to save the URL | Can't configure Cloudflare | Copy immediately to a text file |
| Redeploy without creating new deployment | Old code still runs | Always select "New Deployment," never update |

### Step 5: Update Deployments

If you modify your `Code.gs` in the future:

1. Click **Deploy** → **Manage Deployments**
2. Click the pencil icon on the current deployment
3. Click **"Create new version"**
4. The URL stays the same, but new code is now active

---

## 5. Cloudflare Worker Setup

### Step 1: Create a Cloudflare Account

1. Go to [Cloudflare](https://www.cloudflare.com)
2. Sign up for a free account (or log in if you have one)
3. Verify your email

### Step 2: Add Your Domain to Cloudflare

**Option A: If You Have a Custom Domain**

1. Click **"Add site"** in Cloudflare dashboard
2. Enter your domain (e.g., `yourdomain.com`)
3. Select **Free** plan
4. Cloudflare will show you new nameservers
5. Go to your domain registrar (GoDaddy, Namecheap, etc.)
6. Update nameservers to Cloudflare's nameservers
7. Wait 24-48 hours for DNS propagation
8. Return to Cloudflare to verify

**Option B: If Testing Without Custom Domain**

- Use Cloudflare's free domain: `yoursite.workers.dev`
- Still works, but less professional
- Can upgrade to custom domain later

### Step 3: Create a Cloudflare Worker

1. In Cloudflare dashboard, click **"Workers"** (left sidebar)
2. Click **"Create a Service"** or **"Create Worker"**
3. Name it: **`api-gateway`**
4. Click **Create Service**
5. You'll be in the editor with default code
6. **Replace all code** with the complete Worker code from Section 6
7. Click **Save and Deploy**

### Step 4: Configure the Worker Route

1. After deployment, click **"Triggers"** tab (in the Worker settings)
2. Under **"Routes,"** click **"Add Route"**
3. Enter the following route configuration:

   | Setting | Value | Example |
   |---------|-------|---------|
   | Route | `api.yourdomain.com/api/*` | `api.yourdomain.com/api/*` |
   | Zone | Select your domain | yourdomain.com |

   **For testing without custom domain:**
   - Route: `yoursite.workers.dev/api/*`
   - This will be your Worker URL automatically

4. Click **Save**

### Step 5: DNS Configuration (Custom Domain Only)

If using a custom domain:

1. Go to **DNS** tab in Cloudflare
2. Click **"Add record"**
3. Configure:

   | Setting | Value | Notes |
   |---------|-------|-------|
   | **Type** | CNAME | Not A record |
   | **Name** | `api` | This creates `api.yourdomain.com` |
   | **Target** | `yoursite.workers.dev` | Cloudflare Worker URL |
   | **Proxy status** | Proxied (orange cloud) | Must be orange, not gray |

4. Click **Save**
5. Wait 5-10 minutes for DNS propagation
6. Test the route: Open browser and visit `https://api.yourdomain.com/api/test`

### Step 6: Configure Worker Environment Variables (Optional but Recommended)

1. In Worker settings, click **"Settings"** tab
2. Under **"Environment Variables,"** click **"Add Variable"**
3. Add:

   ```
   GAS_URL = [your Google Apps Script Web App URL]
   ```

4. Click **Encrypt** before saving
5. Update your Worker code to use: `const GAS_URL = ENV.GAS_URL;`

---

## 6. Cloudflare Worker Code

### Complete Worker Script

Copy and paste this entire code into your Cloudflare Worker. **Replace `YOUR_GAS_URL` with your actual Google Apps Script Web App URL.**

**Production GAS URL**: `https://script.google.com/macros/s/AKfycbwyb7w0ZFQpGdcCbrm1KfhYyI_0Bsws1CycGT8otylvQlV-tOf1A6vJLVUum37L5vX6/exec`

```javascript
// ============================================================================
// CLOUDFLARE WORKER - API GATEWAY
// ============================================================================
// Purpose: Handle CORS, preflight requests, and forward to Google Apps Script
// Origin: Frontend (GitHub Pages) → Cloudflare Worker → Google Apps Script
// ============================================================================

// ============================================================================
// CONFIGURATION
// ============================================================================

// Replace this with your actual Google Apps Script Web App URL
// Production URL: https://script.google.com/macros/s/AKfycbwyb7w0ZFQpGdcCbrm1KfhYyI_0Bsws1CycGT8otylvQlV-tOf1A6vJLVUum37L5vX6/exec
const GAS_URL = "https://script.google.com/macros/s/AKfycbwyb7w0ZFQpGdcCbrm1KfhYyI_0Bsws1CycGT8otylvQlV-tOf1A6vJLVUum37L5vX6/exec";

// Allowed origins for CORS (strict exact-match only)
// Do NOT use wildcard patterns or localhost origins in production
const ALLOWED_ORIGINS = [
  "https://username.github.io",        // Replace with your GitHub Pages URL
  "https://yourdomain.com",             // Replace with your custom domain
  "https://api.yourdomain.com"          // Your Cloudflare domain
];

// ============================================================================
// MAIN REQUEST HANDLER
// ============================================================================

export default {
  async fetch(request, env, ctx) {
    // Get the request URL and extract the path
    const url = new URL(request.url);
    const path = url.pathname;

    // Get the origin from the request headers
    const origin = request.headers.get("Origin") || request.headers.get("Referer");

    // ========================================================================
    // HANDLE OPTIONS PREFLIGHT REQUEST (CRITICAL)
    // ========================================================================
    // Browsers send OPTIONS before POST to check if cross-origin request is allowed

    if (request.method === "OPTIONS") {
      return handleCORSPreflight(origin);
    }

    // ========================================================================
    // HANDLE VALID API REQUESTS (/api/*)
    // ========================================================================

    if (path.startsWith("/api/")) {
      // Forward the request to Google Apps Script
      const response = await forwardToGAS(request, url, path);

      // Add CORS headers to the response
      return addCORSHeaders(response, origin);
    }

    // ========================================================================
    // HANDLE INVALID ROUTES (404)
    // ========================================================================

    return new Response(
      JSON.stringify({
        error: "Route not found",
        path: path,
        message: "Only /api/* routes are supported"
      }),
      {
        status: 404,
        headers: addCORSHeaders(new Response(), origin).headers
      }
    );
  }
};

// ============================================================================
// CORS PREFLIGHT HANDLER
// ============================================================================
// Handles OPTIONS requests (browser preflight checks)

function handleCORSPreflight(origin) {
  return new Response(null, {
    status: 204, // No Content
    headers: {
      "Access-Control-Allow-Origin": isOriginAllowed(origin) ? origin : "null",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS, PUT, DELETE",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
      "Access-Control-Max-Age": "86400", // Cache preflight for 24 hours
      "Access-Control-Allow-Credentials": "true"
    }
  });
}

// ============================================================================
// FORWARD REQUEST TO GOOGLE APPS SCRIPT
// ============================================================================
// Preserves method, query parameters, headers, and request body

async function forwardToGAS(request, url, path) {
  try {
    // All routing is performed via ?action= query parameter
    // Path-based routing is not used - GAS uses query parameters only
    // Preserve query parameters
    const gasURL = new URL(GAS_URL);
    
    // Copy all query parameters from original request
    for (const [key, value] of url.searchParams.entries()) {
      gasURL.searchParams.append(key, value);
    }

    // Prepare request options for GAS
    const options = {
      method: request.method,
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Cloudflare-Worker"
      }
    };

    // Forward request body if it exists (for POST/PUT requests)
    if (request.method !== "GET" && request.method !== "HEAD") {
      try {
        const contentType = request.headers.get("Content-Type") || "application/json";
        options.headers["Content-Type"] = contentType;
        
        // Read the request body
        const body = await request.text();
        if (body) {
          options.body = body;
        }
      } catch (e) {
        console.error("Error reading request body:", e);
      }
    }

    // Forward the request to Google Apps Script
    // Note: All routing is handled via ?action= query parameter, not path-based routing
    const response = await fetch(gasURL.toString(), options);

    // Parse and normalize the response
    const responseBody = await response.text();
    
    // Try to parse as JSON, or return as-is
    let finalBody = responseBody;
    try {
      finalBody = JSON.stringify(JSON.parse(responseBody), null, 2);
    } catch (e) {
      // Response is not JSON, return as-is
    }

    return new Response(finalBody, {
      status: response.status,
      headers: {
        "Content-Type": "application/json",
        ...Object.fromEntries(response.headers.entries())
      }
    });

  } catch (error) {
    console.error("Error forwarding to GAS:", error);
    return new Response(
      JSON.stringify({
        error: "Gateway Error",
        message: error.message,
        details: "Failed to reach Google Apps Script"
      }),
      {
        status: 502, // Bad Gateway
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}

// ============================================================================
// CORS HEADERS HELPER
// ============================================================================
// Adds CORS headers to the response

function addCORSHeaders(response, origin) {
  const headers = new Headers(response.headers);
  
  if (isOriginAllowed(origin)) {
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Access-Control-Allow-Credentials", "true");
  } else {
    headers.set("Access-Control-Allow-Origin", "null");
  }

  headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE");
  headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
  headers.set("Access-Control-Max-Age", "86400");

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: headers
  });
}

// ============================================================================
// ORIGIN VALIDATION
// ============================================================================
// Checks if the request origin is in the allowed list

function isOriginAllowed(origin) {
  if (!origin) return false;
  
  // Strict exact-match only - no wildcards or pattern matching
  return ALLOWED_ORIGINS.includes(origin);
}

// ============================================================================
// ERROR HANDLING
// ============================================================================
// All errors are caught and returned as JSON with appropriate status codes

```

### What This Worker Does

| Function | Purpose | Critical? |
|----------|---------|-----------|
| **OPTIONS Preflight** | Responds to browser preflight checks | ✅ YES - Without this, POST fails |
| **Query Parameter Forwarding** | Preserves `?action=getOrders` | ✅ YES - GAS needs these params |
| **Request Body Forwarding** | Sends POST body to GAS | ✅ YES - For POST requests |
| **CORS Headers on Response** | Adds `Access-Control-Allow-Origin` header | ✅ YES - Browser requires this |
| **Error Handling** | Returns 502 if GAS is unreachable | ⚠️ IMPORTANT - Helps debugging |
| **Origin Validation** | Only allows whitelisted origins | ⚠️ SECURITY - Prevents abuse |

### Key Configuration Points

```javascript
// 1. REPLACE THIS WITH YOUR GAS URL
// Production example: https://script.google.com/macros/s/AKfycbwyb7w0ZFQpGdcCbrm1KfhYyI_0Bsws1CycGT8otylvQlV-tOf1A6vJLVUum37L5vX6/exec
const GAS_URL = "https://script.google.com/macros/s/AKfycbwyb7w0ZFQpGdcCbrm1KfhYyI_0Bsws1CycGT8otylvQlV-tOf1A6vJLVUum37L5vX6/exec";

// 2. ADD YOUR GITHUB PAGES AND DOMAIN URLS HERE
const ALLOWED_ORIGINS = [
  "https://username.github.io",      // Your GitHub Pages
  "https://yourdomain.com",          // Your custom domain
  "https://api.yourdomain.com"       // Your Cloudflare worker domain
];
```

---

## 7. Frontend Integration (GitHub Pages)

### Step 1: Recommended Folder Structure

Organize your GitHub Pages repository like this:

```
your-repo/
├── index.html                 (Main entry point)
├── css/
│   ├── style.css
│   └── ...
├── js/
│   ├── api.js                 (API configuration and fetch functions)
│   ├── orders.js              (Order-related logic)
│   ├── users.js               (User-related logic)
│   └── ...
├── html/
│   ├── orders.html
│   ├── settings.html
│   └── ...
├── assets/
│   ├── images/
│   └── ...
└── .github/
    └── workflows/             (GitHub Actions for deployment)
```

### Step 2: API Configuration File

Create `js/api.js` to centralize all API configuration:

```javascript
// ============================================================================
// API CONFIGURATION
// ============================================================================
// This file centralizes all API calls to your backend
// Ensures consistency across the entire frontend

// CONFIGURATION
const API_CONFIG = {
  // Your Cloudflare Worker URL (or GitHub Pages testing URL)
  BASE_URL: "https://api.yourdomain.com",
  
  // Timeout for all requests (milliseconds)
  TIMEOUT: 10000,
  
  // Whether to log all requests (set to false in production)
  DEBUG: false
};

// ============================================================================
// FETCH HELPER FUNCTION
// ============================================================================
// Wraps fetch() with error handling, timeout, and CORS support

async function apiCall(endpoint, options = {}) {
  const {
    method = "GET",
    body = null,
    headers = {},
    action = null
  } = options;

  // Build the full URL
  let url = `${API_CONFIG.BASE_URL}/api${endpoint}`;
  
  // Add ?action= parameter if provided
  if (action) {
    url += `?action=${encodeURIComponent(action)}`;
  }

  // Default headers
  const defaultHeaders = {
    "Content-Type": "application/json"
  };

  // Merge headers
  const finalHeaders = { ...defaultHeaders, ...headers };

  // Log request if debugging is enabled
  if (API_CONFIG.DEBUG) {
    console.log(`[API] ${method} ${url}`, { body, headers: finalHeaders });
  }

  try {
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

    // Make the request
    const response = await fetch(url, {
      method: method,
      headers: finalHeaders,
      body: body ? JSON.stringify(body) : null,
      signal: controller.signal
      // Note: Google Apps Script Web Apps do not rely on browser cookies
      // Authentication, if needed, must be token-based (passed in request body or headers)
    });

    // Clear timeout
    clearTimeout(timeoutId);

    // Log response if debugging
    if (API_CONFIG.DEBUG) {
      console.log(`[API] Response: ${response.status} ${response.statusText}`);
    }

    // Check if response is OK
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`API Error ${response.status}: ${errorData.error || response.statusText}`);
    }

    // Parse and return JSON
    const data = await response.json();
    return {
      success: true,
      data: data
    };

  } catch (error) {
    // Handle different error types
    if (error.name === "AbortError") {
      console.error(`[API] Timeout: Request took longer than ${API_CONFIG.TIMEOUT}ms`);
      return {
        success: false,
        error: "Request Timeout",
        message: "The server took too long to respond. Check your connection or try again."
      };
    }

    if (error instanceof TypeError && error.message.includes("Failed to fetch")) {
      console.error("[API] Network Error: Unable to reach the API", error);
      return {
        success: false,
        error: "Network Error",
        message: "Unable to reach the server. Check your internet connection or verify the API URL is correct."
      };
    }

    console.error("[API] Error:", error);
    return {
      success: false,
      error: error.name || "Unknown Error",
      message: error.message || "An unexpected error occurred"
    };
  }
}

// ============================================================================
// SPECIFIC API ENDPOINTS (Examples)
// ============================================================================

// Get all orders
async function getOrders() {
  return apiCall("/orders", {
    method: "GET",
    action: "getOrders"
  });
}

// Get a specific order by ID
async function getOrderById(orderId) {
  return apiCall(`/orders?id=${orderId}`, {
    method: "GET",
    action: "getOrderById"
  });
}

// Create a new order
async function createOrder(orderData) {
  return apiCall("/orders", {
    method: "POST",
    action: "createOrder",
    body: orderData
  });
}

// Update an existing order
async function updateOrder(orderId, orderData) {
  return apiCall(`/orders?id=${orderId}`, {
    method: "POST",
    action: "updateOrder",
    body: orderData
  });
}

// Get all users (admin only)
async function getUsers() {
  return apiCall("/users", {
    method: "GET",
    action: "getUsers"
  });
}

// Get logs (admin only)
async function getLogs() {
  return apiCall("/logs", {
    method: "GET",
    action: "getLogs"
  });
}

```

### Step 3: Using the API in Your HTML/JavaScript

**DO THIS:** Use the centralized API functions

```html
<!-- In your HTML file -->
<button onclick="loadOrders()">Load Orders</button>
<div id="orders-container"></div>

<script src="js/api.js"></script>
<script>
async function loadOrders() {
  const result = await getOrders();
  
  if (result.success) {
    const orders = result.data;
    console.log("Orders loaded:", orders);
    // Display orders in your UI
  } else {
    console.error("Failed to load orders:", result.error);
    alert("Error: " + result.message);
  }
}
</script>
```

**DO NOT DO THIS:** Hardcoding URLs or calling GAS directly

```javascript
// ❌ WRONG - Direct GAS call will fail with CORS error
fetch("https://script.google.com/macros/s/AKfyc.../exec?action=getOrders")

// ❌ WRONG - Hardcoding URL in multiple places
fetch("https://api.yourdomain.com/api/orders?action=getOrders")

// ✅ RIGHT - Use centralized api.js
getOrders().then(result => {
  // Handle result
});
```

### Step 4: Required API URL Format Rules

| Format | Example | ✅/❌ | Reason |
|--------|---------|-------|--------|
| `/api/` prefix required | `/api/orders` | ✅ | Cloudflare Worker routes on this |
| `?action=` parameter | `?action=getOrders` | ✅ | Google Apps Script reads this |
| Full URL with domain | `https://api.yourdomain.com/api/orders` | ✅ | Complete path from browser |
| No trailing slash | `/api/orders` not `/api/orders/` | ⚠️ | Some servers strict about this |
| **Direct GAS URL** | `https://script.google.com/...` | ❌ | CORS blocks this from browser |
| Query params in body | POST body instead of URL | ❌ | GAS expects URL parameters |

---

## 8. GitHub Pages Deployment

### Step 1: Repository Setup

1. Go to [GitHub](https://github.com)
2. Create a **new public repository** (required for free GitHub Pages)
3. Name it: `yourusername.github.io` **OR** `project-name`
4. Clone it locally: `git clone https://github.com/yourusername/repo.git`

### Step 2: Add Your Frontend Files

Copy your frontend files into the repository:

```
your-repo/
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── api.js
│   └── main.js
└── assets/
    └── images/
```

Commit and push:

```bash
git add .
git commit -m "Initial frontend deployment"
git push origin main
```

### Step 3: Enable GitHub Pages

1. Go to your repository on GitHub
2. Click **Settings** (top right)
3. Click **Pages** (left sidebar)
4. Under "Source," select:
   - Branch: `main`
   - Folder: `/ (root)`
5. Click **Save**
6. GitHub will show your Pages URL: `https://yourusername.github.io`
7. Wait 1-2 minutes for deployment

### Step 4: Verify Deployment

1. Visit `https://yourusername.github.io`
2. Your site should be live
3. Check browser console (F12) for any JavaScript errors

### Step 5: Update API_CONFIG for Production

In `js/api.js`, update the base URL to your Cloudflare Worker:

```javascript
const API_CONFIG = {
  BASE_URL: "https://api.yourdomain.com",  // Your Cloudflare Worker
  TIMEOUT: 10000,
  DEBUG: false  // Disable debug logging in production
};
```

### Step 6: Custom Domain (Optional)

If you want to use a custom domain for your GitHub Pages site:

1. Go to **Settings** → **Pages**
2. Under "Custom domain," enter your domain
3. GitHub creates a `CNAME` file
4. Configure your domain registrar to point to GitHub:
   - Add CNAME record: `name.yourdomain.com` → `yourusername.github.io`
   - Wait 24 hours for DNS propagation

### Common Publishing Mistakes

| Mistake | Problem | Solution |
|---------|---------|----------|
| Repository named `webpot` instead of `yourusername.github.io` | Site URL is `yourusername.github.io/webpot` | Rename repo or accept longer URL |
| Branch is `master` not `main` | Pages doesn't detect it | Change branch in Settings → Pages to `master` |
| Selected folder `/docs` but files are in root | 404 errors | Select `/ (root)` in Pages settings |
| Didn't commit and push | Changes don't appear on live site | Always `git add .`, `git commit`, `git push` |
| Private repository | GitHub Pages disabled | Make repo public or use paid tier |
| CSS/JS files don't load | Paths are wrong | Use relative paths: `css/style.css` not `/css/style.css` |

---

## 9. Testing Checklist (CRITICAL)

### Pre-Testing Verification

Before testing, ensure:

- [ ] Google Sheet created with all 6 tabs
- [ ] Column headers match exactly (row 1 frozen)
- [ ] Google Apps Script deployed as Web App (Anyone access)
- [ ] Cloudflare Worker deployed and routes configured
- [ ] GitHub Pages repository created and published
- [ ] `api.js` with API_CONFIG pointing to your Cloudflare Worker
- [ ] Browser console open (F12) to watch for errors

### Test 1: Cloudflare Worker is Reachable

**What:** Verify the Worker domain responds to requests

**How:**
1. Open browser and visit: `https://api.yourdomain.com/api/test`
2. Expected response:

```json
{
  "error": "Route not found",
  "path": "/api/test",
  "message": "Only /api/* routes are supported"
}
```

**If you get:**
- `ERR_NAME_NOT_RESOLVED` - DNS not configured, wait 10 minutes
- Blank page or timeout - Worker not deployed, check Cloudflare
- 404 Not Found - Route not configured, check Settings → Routes

### Test 2: Google Apps Script is Reachable

**What:** Verify GAS responds to requests via Cloudflare Worker (DO NOT test direct calls from browser)

**⚠️ IMPORTANT:** Direct browser fetch calls to Google Apps Script WILL FAIL with CORS errors. This is expected and correct. GAS must be called through Cloudflare Worker only.

**How to Test (via curl - not browser):**

On your terminal/command line:

```bash
curl "https://script.google.com/macros/s/AKfycbxb5XesTNnxNySyUVuDBU6Vjyk2PBDia5pbyULneRBVYnGExxisZY7zXFBJ48nDekwe/exec?action=test"
```

**Production URL used above.** For your own deployment, replace with your actual GAS Web App URL.

**Expected:** Response should show JSON or error message from GAS

**If you get:**
- 403 Forbidden - GAS deployment access is wrong, redeploy as "Anyone"
- 404 - GAS URL is incorrect
- HTML error page - GAS has an error, check the code

**Note:** Direct browser calls to GAS will ALWAYS fail with CORS errors - this is why Cloudflare Worker is required.

### Test 3: CORS Preflight Works

**What:** Verify Cloudflare Worker handles OPTIONS requests

**How:**
1. In browser console:

```javascript
fetch("https://api.yourdomain.com/api/orders", {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify({ test: "data" })
})
  .then(r => {
    console.log("Status:", r.status);
    console.log("Headers:", {
      corsOrigin: r.headers.get("Access-Control-Allow-Origin"),
      corsMethods: r.headers.get("Access-Control-Allow-Methods")
    });
    return r.json();
  })
  .then(d => console.log("Response:", d))
  .catch(e => console.error("Error:", e));
```

**Expected:** Response with 200 or 500 status, CORS headers present

**If you get:**
- CORS error in console - Cloudflare not adding headers, check Worker code
- 404 - Worker route not configured

### Test 4: End-to-End API Call

**What:** Test complete flow: Frontend → Cloudflare → GAS → Sheets

**How:**
1. On your GitHub Pages site, open browser console
2. Add test data to your Google Sheet (Sheets tab `Orders`, add a row manually)
3. Run in console:

```javascript
// Assuming you've imported api.js
getOrders().then(result => {
  console.log("Result:", result);
  if (result.success) {
    console.log("Data:", result.data);
  } else {
    console.log("Error:", result.error);
  }
});
```

**Expected:** Console logs the orders from your Google Sheet

**If you get:**
- `result.success = false` with "Network Error" - Check API_CONFIG.BASE_URL
- `result.success = false` with "Gateway Error" - GAS unreachable, check deployment
- Empty array `[]` - No data in Sheets, add test rows first

### Test 5: CORS is Actually Working

**What:** Verify browser allows cross-origin request

**How:**
1. On your GitHub Pages site, open DevTools (F12) → Network tab
2. Make an API call from your frontend
3. Click on the API request in the Network tab
4. Look at Response Headers:

```
Access-Control-Allow-Origin: https://yourusername.github.io
Access-Control-Allow-Methods: GET, POST, OPTIONS, PUT, DELETE
```

**Expected:** Headers are present and origin matches your site

**If headers are missing:**
- Cloudflare Worker not adding headers, check Worker code
- GAS returning HTML instead of JSON, check doGet/doPost

### Test 6: Data Write Test

**What:** Verify POST requests write to Google Sheets

**How:**
1. In browser console, run:

```javascript
const newOrder = {
  order_id: "TEST-001",
  customer_name: "Test User",
  customer_email: "test@example.com",
  total_amount: 99.99
};

createOrder(newOrder).then(result => {
  console.log("Create result:", result);
  
  // Now fetch to verify it was written
  setTimeout(() => {
    getOrders().then(ordersResult => {
      console.log("Orders after create:", ordersResult.data);
    });
  }, 1000);
});
```

2. Check your Google Sheet manually - new row should appear in `Orders` tab

**If data doesn't write:**
- Check GAS code has `appendRow()` for new data
- Verify Sheet ID is correct in GAS
- Check Sheet tab names match in GAS code

### Test 7: Admin Only Endpoints

**What:** Verify sensitive endpoints can be protected

**How:**
1. Frontend should add authentication check before calling admin endpoints:

```javascript
async function getUsers() {
  // Check if user is authenticated and is admin
  if (!isUserAdmin()) {
    return {
      success: false,
      error: "Unauthorized",
      message: "You don't have permission to access user data"
    };
  }
  
  return apiCall("/users", {
    method: "GET",
    action: "getUsers"
  });
}
```

2. Or protect in GAS by checking request headers

**Expected:** Only authenticated users can call these endpoints

---

## 10. Common Problems & Solutions

### Problem 1: CORS Error in Browser Console

**Error Message:**
```
Access to fetch at 'https://script.google.com/...' from origin 'https://yourusername.github.io' 
has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

**Root Cause:** Calling GAS directly instead of through Cloudflare Worker

**Solution:**
1. Verify `api.js` has correct BASE_URL pointing to Cloudflare
2. All fetch calls must use relative paths: `/api/orders` not full GAS URL
3. Check API_CONFIG object:

```javascript
const API_CONFIG = {
  BASE_URL: "https://api.yourdomain.com",  // ← Should be Cloudflare URL
  TIMEOUT: 10000,
  DEBUG: false
};
```

---

### Problem 2: Cloudflare Worker Route Not Firing

**Symptom:** Requests to `/api/*` return 404 or are not being intercepted

**Root Cause:** Worker route not configured correctly

**Solution:**
1. Go to Cloudflare Dashboard → Workers
2. Click your worker → Settings → Triggers
3. Verify route is configured:
   - Pattern: `api.yourdomain.com/api/*` (or `yoursite.workers.dev/api/*` for testing)
   - Zone: Your domain is selected
4. Click Save and wait 30 seconds
5. Test: `curl https://api.yourdomain.com/api/test`

---

### Problem 3: OPTIONS Preflight Failing

**Error Message:**
```
CORS error: Request blocked - CORS policy
OPTIONS request received 404 response
```

**Root Cause:** Cloudflare Worker not returning 204 for OPTIONS requests

**Solution:**
1. Check Worker code has `handleCORSPreflight()` function
2. Verify OPTIONS handler returns 204 status:

```javascript
if (request.method === "OPTIONS") {
  return handleCORSPreflight(origin);
}
```

3. Verify headers in OPTIONS response:
   - `Access-Control-Allow-Methods: GET, POST, OPTIONS, PUT, DELETE`
   - `Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With`

---

### Problem 4: Google Apps Script Returns 403 Forbidden

**Error Message:**
```
Error: 403 Forbidden - you do not have permission to access this resource
```

**Root Cause:** Web App deployment access is not set to "Anyone"

**Solution:**
1. Go to Google Apps Script editor
2. Click Deploy → Manage Deployments
3. Click pencil icon → Settings
4. Change "Who has access" to **"Anyone"**
5. Click Update
6. Test again with curl:

```bash
curl "https://script.google.com/macros/s/AKfycbwyb7w0ZFQpGdcCbrm1KfhYyI_0Bsws1CycGT8otylvQlV-tOf1A6vJLVUum37L5vX6/exec?action=test"
```

**Using production GAS URL above.**

---

### Problem 5: Silent 404 Errors

**Symptom:** API calls seem to go through but return empty or error responses

**Root Cause:** GAS code doesn't have handler for the requested action

**Solution:**
1. Check that `?action=` parameter matches a function in GAS:

```javascript
function doGet(e) {
  const action = e.parameter.action;
  
  // Must have a case for every action used in frontend
  switch(action) {
    case "getOrders":
      return getOrders();
    case "createOrder":
      return createOrder(e.parameter);
    default:
      return errorResponse("Unknown action: " + action, 404);
  }
}
```

2. Verify frontend is sending correct action parameter:

```javascript
// Check Network tab in DevTools to see full URL
console.log("Full URL:", `${API_CONFIG.BASE_URL}/api/orders?action=getOrders`);
```

---

### Problem 6: JSON Parsing Errors

**Error Message:**
```
Unexpected token < in JSON at position 0
```

**Root Cause:** Response is HTML (error page) not JSON

**Solution:**
1. Check GAS code returns JSON:

```javascript
function doGet(e) {
  // ✅ CORRECT - returns JSON
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
  
  // ❌ WRONG - returns HTML
  return HtmlService.createHtmlOutput("<h1>Error</h1>");
}
```

2. Check for errors in GAS by running test:

```bash
curl "https://script.google.com/macros/s/AKfycbwyb7w0ZFQpGdcCbrm1KfhYyI_0Bsws1CycGT8otylvQlV-tOf1A6vJLVUum37L5vX6/exec?action=test"
```

**Using production GAS URL above.**

---

### Problem 7: GitHub Pages Site Returns 404

**Symptom:** Visit `https://yourusername.github.io` → 404 error

**Root Cause:** GitHub Pages not enabled or configuration wrong

**Solution:**
1. Go to Repository → Settings → Pages
2. Verify:
   - Source branch is correct (`main` or `master`)
   - Source folder is `/ (root)` unless files are in `/docs`
3. Check that `index.html` exists in repository root
4. Commit and push changes:

```bash
git add .
git commit -m "Fix GitHub Pages"
git push origin main
```

5. Wait 1-2 minutes and refresh

---

### Problem 8: API Returns Data but Site Doesn't Update

**Symptom:** API call succeeds but HTML doesn't change

**Root Cause:** JavaScript not updating DOM correctly

**Solution:**
1. Add logging to verify data received:

```javascript
getOrders().then(result => {
  console.log("API Response:", result);  // ← Check console
  
  if (result.success) {
    const orders = result.data;
    console.log("Orders:", orders);
    
    // Update DOM
    const container = document.getElementById("orders-container");
    if (!container) {
      console.error("Element #orders-container not found");
      return;
    }
    
    container.innerHTML = orders.map(order => 
      `<div>${order.customer_name}: $${order.total_amount}</div>`
    ).join("");
  }
});
```

2. Verify HTML element exists:

```html
<!-- Make sure this exists in your HTML -->
<div id="orders-container"></div>
```

---

### Problem 9: Cloudflare DNS Not Propagating

**Symptom:** `ERR_NAME_NOT_RESOLVED` when visiting `api.yourdomain.com`

**Root Cause:** DNS changes take time, or nameservers not updated

**Solution:**
1. Verify nameservers are pointing to Cloudflare
2. Wait 24-48 hours for full propagation
3. Check DNS status:

```bash
# On Mac/Linux
nslookup api.yourdomain.com

# On Windows
nslookup api.yourdomain.com
```

4. Look for Cloudflare IP addresses in response

---

### Problem 10: Worker Timeout (Request Takes Too Long)

**Symptom:** API calls timeout, take >30 seconds

**Root Cause:** GAS is slow or overloaded

**Solution:**
1. Increase timeout in `api.js`:

```javascript
const API_CONFIG = {
  BASE_URL: "https://api.yourdomain.com",
  TIMEOUT: 30000,  // ← Increased from 10000
  DEBUG: false
};
```

2. Optimize GAS queries (use direct cell ranges, not entire sheets)
3. Add caching to Cloudflare Worker:

```javascript
// Cache GET requests for 60 seconds
if (request.method === "GET") {
  return new Response(response.body, {
    headers: {
      ...response.headers,
      "Cache-Control": "max-age=60"
    }
  });
}
```

---

## 11. Production Hardening (Optional but Recommended)

### 11.1: Rate Limiting (Advanced / Optional)

**Purpose:** Prevent abuse and DDoS attacks

**⚠️ NOTE:** This implementation requires Cloudflare KV storage setup, which is not covered in this guide. For most low-to-medium traffic applications, this hardening is optional.

**Implementation in Cloudflare Worker (requires additional KV setup):**

```javascript
// Add at top of fetch handler
const clientIP = request.headers.get("CF-Connecting-IP");
const rateLimitKey = `rate-limit:${clientIP}`;

// Get request count from Cloudflare KV (requires KV binding configuration)
const count = await rateLimitKV.get(rateLimitKey) || 0;

if (count > 100) {  // 100 requests per minute
  return new Response(
    JSON.stringify({ error: "Rate limit exceeded" }),
    { status: 429 }
  );
}

// Increment counter
await rateLimitKV.put(rateLimitKey, parseInt(count) + 1, { expirationTtl: 60 });
```

**For KV Setup:** See [Cloudflare KV Documentation](https://developers.cloudflare.com/workers/runtime-apis/kv/) - this requires creating a KV namespace and binding it to your Worker.

### 11.2: Hide Google Apps Script Origin

**Purpose:** Don't expose GAS URL publicly in error messages

**Implementation in Worker:**

```javascript
// Never return error with GAS_URL visible
const response = await fetch(gasURL);
if (!response.ok) {
  return new Response(
    JSON.stringify({
      error: "Backend Error",
      message: "Please try again later"
      // Do NOT include GAS_URL or actual error details
    }),
    { status: 500 }
  );
}
```

### 11.3: Input Validation

**Purpose:** Prevent malicious data from entering database

**Implementation in GAS:**

```javascript
function handleCreateOrder(params) {
  // Validate required fields
  if (!params.customer_name || !params.customer_email) {
    return errorResponse("Missing required fields", 400);
  }
  
  // Validate email format
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(params.customer_email)) {
    return errorResponse("Invalid email format", 400);
  }
  
  // Validate amount is number
  if (isNaN(parseFloat(params.total_amount))) {
    return errorResponse("Invalid amount", 400);
  }
  
  // Proceed with safe data
  return createOrder(params);
}
```

### 11.4: Environment Variables

**Cloudflare Worker with Environment Variables:**

1. In Cloudflare Dashboard → Worker Settings
2. Add variable: `GAS_URL` = Your GAS URL
3. In Worker code:

```javascript
// Using environment bindings
export default {
  async fetch(request, env, ctx) {
    const GAS_URL = env.GAS_URL;
    // Use GAS_URL in code
  }
};
```

### 11.5: HTTPS Everywhere

**Ensure all connections use HTTPS:**

```javascript
// In Cloudflare Dashboard → SSL/TLS
// Set SSL/TLS encryption mode to "Full (strict)"

// In Worker, redirect HTTP to HTTPS
if (url.protocol !== "https:") {
  return new Response(null, {
    status: 301,
    headers: {
      Location: url.toString().replace("http://", "https://")
    }
  });
}
```

### 11.6: Content Security Policy (CSP)

**Prevent injection attacks:**

```javascript
// Add CSP headers in Worker
headers: {
  "Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block"
}
```

### 11.7: Monitoring & Logging

**Track API usage:**

```javascript
// Log all requests to Cloudflare Analytics
async function logRequest(request, response) {
  console.log({
    timestamp: new Date().toISOString(),
    method: request.method,
    path: new URL(request.url).pathname,
    statusCode: response.status,
    clientIP: request.headers.get("CF-Connecting-IP")
  });
}
```

### 11.8: Backup Strategy

**Regular backups of Google Sheets:**

1. Set up Google Sheet to auto-export to Google Drive
2. Enable version history (right-click Sheet → Version history)
3. Consider Google Sheets API to automated backups to GitHub

---

## Quick Reference Checklist

### Pre-Launch Verification

- [ ] Google Sheet created with 6 tabs and correct headers
- [ ] Google Apps Script deployed as Web App (Anyone access)
- [ ] GAS Sheet ID matches actual Sheet ID
- [ ] Cloudflare account created and domain added
- [ ] Cloudflare Worker created and deployed
- [ ] Worker route configured: `/api/*`
- [ ] Worker has correct GAS URL
- [ ] GitHub Pages repository created and public
- [ ] GitHub Pages enabled in repository settings
- [ ] Frontend files pushed to GitHub
- [ ] `api.js` has correct Cloudflare Worker URL
- [ ] All CORS headers in Worker code
- [ ] No direct GAS calls from frontend

### Post-Launch Verification

- [ ] Can reach `https://api.yourdomain.com/api/test`
- [ ] Browser console shows no CORS errors
- [ ] GitHub Pages site loads without 404s
- [ ] API calls return data from Google Sheets
- [ ] New data writes successfully to Sheets
- [ ] GitHub Pages caching not causing stale data (use cache busting)

### Production Checklist

- [ ] API_CONFIG.DEBUG set to `false`
- [ ] Error messages don't expose GAS URL
- [ ] Rate limiting enabled in Cloudflare
- [ ] HTTPS enforced everywhere
- [ ] Google Sheet permissions reviewed
- [ ] Sensitive data not logged to console
- [ ] Backup strategy documented
- [ ] Monitoring alerts configured

---

## Support & Troubleshooting Resources

| Resource | Purpose |
|----------|---------|
| [Google Apps Script Docs](https://developers.google.com/apps-script) | API reference and tutorials |
| [Cloudflare Worker Docs](https://developers.cloudflare.com/workers/) | Worker configuration and examples |
| [MDN Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API) | JavaScript fetch documentation |
| [GitHub Pages Docs](https://docs.github.com/en/pages) | GitHub Pages configuration |

---

## Conclusion

You now have a complete, production-ready architecture:

- **Frontend:** GitHub Pages (static, fast, free)
- **API Gateway:** Cloudflare Workers (CORS-enabled, caching, security)
- **Backend:** Google Apps Script (serverless, no maintenance)
- **Database:** Google Sheets (free, accessible, auditable)

This stack is:
- ✅ **Free Tier Sufficient** - No paid tiers required
- ✅ **Suitable for Low-to-Medium Traffic** - Ideal for MVPs, admin panels, internal tools, and small business applications (subject to Google Apps Script and Sheets API quotas)
- ✅ **Secure** - HTTPS, CORS validation, input validation
- ✅ **Maintainable** - No servers to manage
- ✅ **Auditable** - Full Google Sheets history
- ✅ **Flexible** - Easy to modify and extend

**Next Steps:**
1. Follow deployment order: Sheets → GAS → Cloudflare → GitHub Pages
2. Test thoroughly using Section 9 checklist
3. Monitor errors and adjust as needed
4. Consider hardening suggestions in Section 11

---

**Last Validated:** January 2026  
**Version:** 1.0  
**Status:** Ready for Production Deployment
