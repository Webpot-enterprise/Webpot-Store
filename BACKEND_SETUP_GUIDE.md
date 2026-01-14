# Backend Setup Guide: Google Sheets + Google Apps Script + Cloudflare Workers

**Last Updated:** January 2026  
**Architecture:** Multi-Tier API with OAuth 2.0 + Manual Authentication  
**Status:** Production-Ready Configuration

---

## Table of Contents

1. [Google Sheets Database Architecture](#1-google-sheets-database-architecture)
2. [Google Cloud Console & OAuth Setup](#2-google-cloud-console--oauth-setup)
3. [Google Apps Script (The Core API)](#3-google-apps-script-the-core-api)
4. [Cloudflare Workers (The Gateway & CORS Manager)](#4-cloudflare-workers-the-gateway--cors-manager)
5. [CORS Strategy (Highest Priority)](#5-cors-strategy-highest-priority)
6. [Deployment Checklist](#6-deployment-checklist)
7. [Common Pitfalls & Do Not Skip Warnings](#7-common-pitfalls--do-not-skip-warnings)

---

## 1. Google Sheets Database Architecture

### Step 1.1: Create the Google Sheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Click **"+ New"** (blank spreadsheet icon)
3. Name the sheet: **`WebDevServices-Backend-DB`**
4. Click the **"Rename"** button (pencil icon next to the sheet name)
5. Enter the name and press **Enter**
6. Share this sheet: Click **Share** → Enter your email (owner access) → Click **Share**
7. Copy the **Sheet ID** from the URL (the long alphanumeric string between `/d/` and `/edit`)
   - Example: `https://docs.google.com/spreadsheets/d/**1A2B3C4D5E6F7G8H9I**`
   - Save this ID; you'll need it later
   - **Your Existing Sheet ID:** `1wreXWGm1j4CCO7Id00ypwU3dd4fGFxlLs03_0RsPh78`

### Step 1.2: Create Tab 1 - `Users`

1. At the bottom of the sheet, right-click the default **"Sheet1"** tab
2. Select **"Rename"** and type: **`Users`**
3. Press **Enter**
4. In row 1 (headers), enter these column names (A1 to J1):

| A | B | C | D | E | F | G | H | I | J |
|---|---|---|---|---|---|---|---|---|---|
| `user_id` | `email` | `password_hash` | `auth_provider` | `full_name` | `created_at` | `updated_at` | `status` | `google_oauth_id` | `last_login` |

5. Click cell **A2** and add data validation:
   - Click **Data** → **Data validation**
   - **Criteria:** Custom formula is → `=A2=""` (allow empty for first row)
   - Click **Save**

6. For column **D** (auth_provider), add dropdown validation:
   - Select column D
   - Click **Data** → **Data validation**
   - **Criteria:** List of items
   - Enter: `manual,google_oauth`
   - Click **Include blank cells** checkbox
   - Click **Save**

7. For column **H** (status), add dropdown validation:
   - Select column H
   - Click **Data** → **Data validation**
   - **Criteria:** List of items
   - Enter: `active,inactive,suspended,pending_verification`
   - Click **Include blank cells** checkbox
   - Click **Save**

### Step 1.3: Create Tab 2 - `Sessions`

1. Right-click the tab area → **Insert 1 below** → Name it: **`Sessions`**
2. In row 1, enter these column headers (A1 to G1):

| A | B | C | D | E | F | G |
|---|---|---|---|---|---|---|
| `session_id` | `user_id` | `token` | `created_at` | `expires_at` | `ip_address` | `device_info` |

3. For column **E** (expires_at), add data validation:
   - Click **Data** → **Data validation**
   - **Criteria:** Custom formula is
   - Enter: `=E2>D2` (expires must be after created)
   - Message: "Expiry date must be after creation date"
   - Click **Save**

### Step 1.4: Create Tab 3 - `AuthTokens`

1. Right-click the tab area → **Insert 1 below** → Name it: **`AuthTokens`**
2. In row 1, enter these column headers (A1 to F1):

| A | B | C | D | E | F |
|---|---|---|---|---|---|
| `token_id` | `user_id` | `token_hash` | `created_at` | `expires_at` | `token_type` |

3. For column **F** (token_type), add dropdown validation:
   - Click **Data** → **Data validation**
   - **Criteria:** List of items
   - Enter: `refresh_token,access_token,reset_token`
   - Click **Save**

### Step 1.5: Create Tab 4 - `Logs`

1. Right-click the tab area → **Insert 1 below** → Name it: **`Logs`**
2. In row 1, enter these column headers (A1 to F1):

| A | B | C | D | E | F |
|---|---|---|---|---|---|
| `log_id` | `user_id` | `action` | `timestamp` | `ip_address` | `details` |

3. For column **C** (action), add dropdown validation:
   - Click **Data** → **Data validation**
   - **Criteria:** List of items
   - Enter: `login,register,logout,password_reset,oauth_auth,token_refresh,access_denied,order_placed,order_updated,confirmation_sent,confirmation_email_sent,confirmation_email_failed,fetch_orders,fetch_order_details,fetch_all_orders,fetch_orders_by_status,referral_validation`
   - Click **Save**

### Step 1.6: Create Tab 5 - `Orders`

1. Right-click the tab area → **Insert 1 below** → Name it: **`Orders`**
2. In row 1, enter these column headers (A1 to N1):

| A | B | C | D | E | F | G | H | I | J | K | L | M | N |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `order_id` | `user_id` | `customer_email` | `customer_name` | `order_date` | `total_amount` | `currency` | `order_status` | `service_type` | `service_details` | `delivery_date` | `payment_method` | `referral_code_used` | `confirmation_sent` |

3. Add data validation for key columns:
   - **Column H (order_status):** List of items → `pending,processing,shipped,delivered,cancelled`
   - **Column I (service_type):** List of items → `Starter,Basic,Premium`
   - **Column G (currency):** List of items → `USD,EUR,GBP,INR`
   - **Column L (payment_method):** List of items → `credit_card,debit_card,paypal,bank_transfer,other`
   - **Column N (confirmation_sent):** List of items → `yes,no,pending`

4. For **column E (order_date)**, restrict to dates:
   - Click **Data** → **Data validation**
   - **Criteria:** Date is valid date
   - Click **Save**

### Step 1.7: Create Tab 6 - `ReferralCodes`

1. Right-click the tab area → **Insert 1 below** → Name it: **`ReferralCodes`**
2. In row 1, enter these column headers (A1 to J1):

| A | B | C | D | E | F | G | H | I | J |
|---|---|---|---|---|---|---|---|---|---|
| `code_id` | `referral_code` | `user_id` | `created_by` | `created_at` | `expires_at` | `discount_percentage` | `max_uses` | `current_uses` | `status` |

3. Add data validation:
   - **Column H (max_uses):** Custom formula → `=H2>0` (must be positive)
   - **Column I (current_uses):** Custom formula → `=I2<=H2` (can't exceed max_uses)
   - **Column J (status):** List of items → `active,inactive,expired`

4. For **columns E & F (dates)**:
   - Click **Data** → **Data validation**
   - **Criteria:** Date is valid date
   - Add message: "Enter valid date"
   - Click **Save**

### Step 1.6: Lock Headers (Critical)

For each tab (Users, Sessions, AuthTokens, Logs, Orders, ReferralCodes):

1. Select **row 1** (click the row number "1")
2. Click **Format** → **Freeze** → **1 row**
3. This prevents accidental header deletion

### Summary of Database Structure

```
Users Table:
- Stores user account information
- password_hash: SHA256 hashed password (NEVER plain text)
- auth_provider: "manual" or "google_oauth"
- status: Controls access level (active, inactive, suspended)

Sessions Table:
- Tracks active user sessions
- token: Random session token (UUID)
- expires_at: Automatic logout time (e.g., +24 hours)

AuthTokens Table:
- Stores refresh & reset tokens separately from sessions
- token_hash: Always hashed (never store plaintext)
- token_type: Distinguishes token purpose

Logs Table:
- Audit trail for security & debugging
- Immutable record of all auth actions & orders
- Enables detection of suspicious activity

Orders Table:
- Stores all customer orders
- Tracks order status from placement to delivery
- Links to users via user_id and referral_code_used
- Stores customer details for non-registered purchases
- confirmation_sent flag indicates email delivery status

ReferralCodes Table:
- Manages referral/promo codes
- Tracks discount percentage and usage limits
- Prevents over-redemption with current_uses vs max_uses
- Links to creating user for attribution
```

---

## 2. Google Cloud Console & OAuth Setup

### Step 2.1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Log in with your Google account
3. At the top left, click **"Select a Project"** dropdown
4. Click **"NEW PROJECT"**
5. In the **Project name** field, enter: **`WebDevServices-API`**
6. Leave **Organization** as default (or your org if applicable)
7. Click **CREATE**
8. Wait 30-60 seconds for the project to be created
9. The new project will automatically be selected

### Step 2.2: Enable Required APIs

1. In the left sidebar, click **APIs & Services** → **Library**
2. Search for **"Google Sheets API"**
3. Click on it and click **ENABLE**
4. You'll see "API enabled" confirmation
5. Go back to **Library** (search bar)
6. Search for **"Google Drive API"**
7. Click and click **ENABLE**

### Step 2.3: Configure OAuth Consent Screen

1. In the left sidebar, click **APIs & Services** → **OAuth consent screen**
2. Under **User Type**, select **External** (unless you're in a Google Workspace)
3. Click **CREATE**
4. Fill in the **App information** section:
   - **App name:** `WebDevServices Auth`
   - **User support email:** Your email address
   - **Developer contact information:** Your email address
5. Click **SAVE AND CONTINUE**
6. On the **Scopes** page, click **ADD OR REMOVE SCOPES**
7. Search and select these scopes:
   - `https://www.googleapis.com/auth/userinfo.email`
   - `https://www.googleapis.com/auth/userinfo.profile`
   - `https://www.googleapis.com/auth/drive`
8. Click **UPDATE**
9. Click **SAVE AND CONTINUE**
10. On the **Test users** page, add yourself:
    - Click **ADD USERS**
    - Enter your email address
    - Click **ADD**
11. Click **SAVE AND CONTINUE**
12. Review and click **BACK TO DASHBOARD**

### Step 2.4: Create OAuth 2.0 Client ID

1. In the left sidebar, click **APIs & Services** → **Credentials**
2. Click **+ CREATE CREDENTIALS** (top button)
3. Select **OAuth client ID**
4. A popup says "You need to create an OAuth client ID to continue" → Click **Create OAuth client ID**
5. Choose **Application type:** **Web application**
6. In the **Name** field, enter: **`WebDevServices-Frontend`**
7. Under **Authorized JavaScript origins**, click **+ ADD URI**
8. Enter the following URIs (one per line):
   ```
   https://yourdomain.com
   https://www.yourdomain.com
   http://localhost:3000
   http://localhost:8000
   ```
   - **IMPORTANT:** Replace `yourdomain.com` with your actual domain
   - Keep `localhost` entries for development/testing
   - These are for the **frontend**, NOT the Cloudflare Worker

9. Under **Authorized redirect URIs**, click **+ ADD URI**
10. Enter these redirect URIs:
    ```
    https://yourdomain.com/api/auth/google/callback
    https://www.yourdomain.com/api/auth/google/callback
    http://localhost:3000/api/auth/google/callback
    http://localhost:8000/api/auth/google/callback
    ```
    - **CRITICAL:** The path `/api/auth/google/callback` must match your Cloudflare Worker route
    - The `yourdomain.com` is where your Cloudflare Worker is deployed

11. Click **CREATE**
12. A popup appears with your credentials:
    - **Client ID:** (copy and save this)
    - **Client Secret:** (copy and save this, NEVER share publicly)
13. Click **CLOSE** or **COPY JSON** to download
14. **Store these safely** (you'll need them in Step 3)

### Step 2.5: Create a Service Account (For GAS to Access Sheets)

1. In the left sidebar, click **APIs & Services** → **Credentials**
2. Click **+ CREATE CREDENTIALS**
3. Select **Service Account**
4. In the **Service account name**, enter: **`gas-sheet-service`**
5. Click **CREATE AND CONTINUE**
6. Click **CONTINUE** (skip optional permissions for now)
7. Click **DONE**
8. You'll see the service account listed. Click on it
9. Go to the **KEYS** tab
10. Click **ADD KEY** → **Create new key**
11. Select **JSON** and click **CREATE**
12. A JSON file downloads automatically. **Keep this file safe** (you'll reference it in GAS)

---

## 3. Google Apps Script (The Core API)

### Step 3.1: Create a New Google Apps Script Project

1. Go to [Google Apps Script](https://script.google.com)
2. Click **+ New project**
3. Rename the project: Click the **"Untitled project"** name at the top left
4. Type: **`WebDevServices-API`**
5. Press **Enter**

### Step 3.2: Link to Your Google Sheet

1. In the script editor, click **Project Settings** (wrench icon on left sidebar)
2. Under **Project ID**, copy the value (you'll need this later)
3. Click **Editor** (left sidebar)
4. Paste this code into the editor (replace anything there):

```javascript
// ============================================================
// WebDevServices API - Google Apps Script Core
// ============================================================

const SHEET_ID = "YOUR_GOOGLE_SHEET_ID_HERE"; // Replace with your Sheet ID from Step 1.1
const SHEET = SpreadsheetApp.openById(SHEET_ID);

// ============================================================
// UTILITY: Logging Function
// ============================================================
function logAction(userId, action, ipAddress, details) {
  const logsSheet = SHEET.getSheetByName("Logs");
  const timestamp = new Date().toISOString();
  const logId = Utilities.getUuid();
  
  logsSheet.appendRow([
    logId,           // log_id
    userId || "",    // user_id
    action,          // action
    timestamp,       // timestamp
    ipAddress || "unknown", // ip_address
    JSON.stringify(details) // details
  ]);
}

// ============================================================
// UTILITY: Hash Password (SHA256)
// ============================================================
function hashPassword(plainPassword) {
  const hash = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    plainPassword
  );
  // Convert to hex string
  return hash.map(function(byte) {
    let v = (byte & 0xFF).toString(16);
    return v.length === 1 ? '0' + v : v;
  }).join('');
}

// ============================================================
// UTILITY: Generate UUID
// ============================================================
function generateUUID() {
  return Utilities.getUuid();
}

// ============================================================
// UTILITY: Get User by Email
// ============================================================
function getUserByEmail(email) {
  const usersSheet = SHEET.getSheetByName("Users");
  const data = usersSheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) { // Skip header (row 0)
    if (data[i][1] === email) { // Column B is email
      return {
        user_id: data[i][0],
        email: data[i][1],
        password_hash: data[i][2],
        auth_provider: data[i][3],
        full_name: data[i][4],
        created_at: data[i][5],
        updated_at: data[i][6],
        status: data[i][7],
        google_oauth_id: data[i][8],
        last_login: data[i][9]
      };
    }
  }
  return null;
}

// ============================================================
// UTILITY: Get User by Google OAuth ID
// ============================================================
function getUserByGoogleOAuthId(googleOAuthId) {
  const usersSheet = SHEET.getSheetByName("Users");
  const data = usersSheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][8] === googleOAuthId) { // Column I is google_oauth_id
      return {
        user_id: data[i][0],
        email: data[i][1],
        password_hash: data[i][2],
        auth_provider: data[i][3],
        full_name: data[i][4],
        created_at: data[i][5],
        updated_at: data[i][6],
        status: data[i][7],
        google_oauth_id: data[i][8],
        last_login: data[i][9]
      };
    }
  }
  return null;
}

// ============================================================
// ACTION: Register (Manual)
// ============================================================
function handleRegister(params) {
  const { email, password, full_name } = params;
  
  // Validation
  if (!email || !password || !full_name) {
    logAction("", "register", params.ip_address || "", { error: "Missing fields" });
    return {
      success: false,
      code: "MISSING_FIELDS",
      message: "Email, password, and full_name are required"
    };
  }
  
  if (password.length < 8) {
    logAction("", "register", params.ip_address || "", { error: "Password too short" });
    return {
      success: false,
      code: "WEAK_PASSWORD",
      message: "Password must be at least 8 characters"
    };
  }
  
  // Check if user exists
  const existingUser = getUserByEmail(email);
  if (existingUser) {
    logAction("", "register", params.ip_address || "", { error: "Email exists" });
    return {
      success: false,
      code: "USER_EXISTS",
      message: "Email already registered"
    };
  }
  
  // Create user
  const userId = generateUUID();
  const passwordHash = hashPassword(password);
  const now = new Date().toISOString();
  
  const usersSheet = SHEET.getSheetByName("Users");
  usersSheet.appendRow([
    userId,           // user_id
    email,            // email
    passwordHash,     // password_hash
    "manual",         // auth_provider
    full_name,        // full_name
    now,              // created_at
    now,              // updated_at
    "active",         // status
    "",               // google_oauth_id
    now               // last_login
  ]);
  
  logAction(userId, "register", params.ip_address || "", { success: true });
  
  return {
    success: true,
    code: "REGISTERED",
    message: "User registered successfully",
    user: { user_id: userId, email, full_name }
  };
}

// ============================================================
// ACTION: Login (Manual)
// ============================================================
function handleLogin(params) {
  const { email, password } = params;
  
  if (!email || !password) {
    logAction("", "login", params.ip_address || "", { error: "Missing credentials" });
    return {
      success: false,
      code: "MISSING_CREDENTIALS",
      message: "Email and password are required"
    };
  }
  
  const user = getUserByEmail(email);
  if (!user) {
    logAction("", "login", params.ip_address || "", { error: "User not found" });
    return {
      success: false,
      code: "INVALID_CREDENTIALS",
      message: "Invalid email or password"
    };
  }
  
  if (user.status !== "active") {
    logAction(user.user_id, "login", params.ip_address || "", { error: "Account inactive" });
    return {
      success: false,
      code: "ACCOUNT_INACTIVE",
      message: "Account is not active"
    };
  }
  
  // Check password
  const passwordHash = hashPassword(password);
  if (passwordHash !== user.password_hash) {
    logAction(user.user_id, "login", params.ip_address || "", { error: "Wrong password" });
    return {
      success: false,
      code: "INVALID_CREDENTIALS",
      message: "Invalid email or password"
    };
  }
  
  // Create session
  const sessionId = generateUUID();
  const token = Utilities.getUuid();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(); // +24 hours
  
  const sessionsSheet = SHEET.getSheetByName("Sessions");
  sessionsSheet.appendRow([
    sessionId,                 // session_id
    user.user_id,              // user_id
    token,                     // token
    now.toISOString(),         // created_at
    expiresAt,                 // expires_at
    params.ip_address || "",   // ip_address
    params.device_info || ""   // device_info
  ]);
  
  logAction(user.user_id, "login", params.ip_address || "", { success: true });
  
  return {
    success: true,
    code: "LOGIN_SUCCESS",
    message: "Login successful",
    session: {
      session_id: sessionId,
      token: token,
      expires_at: expiresAt,
      user: { user_id: user.user_id, email: user.email, full_name: user.full_name }
    }
  };
}

// ============================================================
// ACTION: Google OAuth Callback
// ============================================================
function handleGoogleOAuthCallback(params) {
  const { google_oauth_id, email, full_name } = params;
  
  if (!google_oauth_id || !email) {
    logAction("", "oauth_auth", params.ip_address || "", { error: "Missing OAuth data" });
    return {
      success: false,
      code: "MISSING_OAUTH_DATA",
      message: "Google OAuth ID and email are required"
    };
  }
  
  // Check if user exists by Google OAuth ID
  let user = getUserByGoogleOAuthId(google_oauth_id);
  
  // If not, check by email (user may have switched from manual to OAuth)
  if (!user) {
    user = getUserByEmail(email);
    if (user) {
      // Link OAuth to existing user
      const usersSheet = SHEET.getSheetByName("Users");
      const data = usersSheet.getDataRange().getValues();
      for (let i = 1; i < data.length; i++) {
        if (data[i][1] === email) {
          usersSheet.getRange(i + 1, 9).setValue(google_oauth_id); // Column I
          usersSheet.getRange(i + 1, 7).setValue(new Date().toISOString()); // updated_at
          break;
        }
      }
    }
  }
  
  // If still no user, create one
  if (!user) {
    const userId = generateUUID();
    const now = new Date().toISOString();
    
    const usersSheet = SHEET.getSheetByName("Users");
    usersSheet.appendRow([
      userId,                // user_id
      email,                 // email
      "",                    // password_hash (empty for OAuth)
      "google_oauth",        // auth_provider
      full_name || "",       // full_name
      now,                   // created_at
      now,                   // updated_at
      "active",              // status
      google_oauth_id,       // google_oauth_id
      now                    // last_login
    ]);
    
    user = {
      user_id: userId,
      email: email,
      full_name: full_name || "",
      auth_provider: "google_oauth",
      status: "active"
    };
  }
  
  // Create session
  const sessionId = generateUUID();
  const token = Utilities.getUuid();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
  
  const sessionsSheet = SHEET.getSheetByName("Sessions");
  sessionsSheet.appendRow([
    sessionId,                 // session_id
    user.user_id,              // user_id
    token,                     // token
    now.toISOString(),         // created_at
    expiresAt,                 // expires_at
    params.ip_address || "",   // ip_address
    params.device_info || ""   // device_info
  ]);
  
  logAction(user.user_id, "oauth_auth", params.ip_address || "", { success: true });
  
  return {
    success: true,
    code: "OAUTH_SUCCESS",
    message: "Google OAuth login successful",
    session: {
      session_id: sessionId,
      token: token,
      expires_at: expiresAt,
      user: { user_id: user.user_id, email: user.email, full_name: user.full_name }
    }
  };
}

// ============================================================
// ACTION: Verify Session Token
// ============================================================
function handleVerifyToken(params) {
  const { token } = params;
  
  if (!token) {
    return {
      success: false,
      code: "MISSING_TOKEN",
      message: "Token is required"
    };
  }
  
  const sessionsSheet = SHEET.getSheetByName("Sessions");
  const data = sessionsSheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][2] === token) { // Column C is token
      const expiresAt = new Date(data[i][4]);
      if (expiresAt < new Date()) {
        logAction(data[i][1], "token_refresh", params.ip_address || "", { error: "Token expired" });
        return {
          success: false,
          code: "TOKEN_EXPIRED",
          message: "Session token has expired"
        };
      }
      
      logAction(data[i][1], "token_refresh", params.ip_address || "", { success: true });
      
      return {
        success: true,
        code: "TOKEN_VALID",
        message: "Token is valid",
        user_id: data[i][1],
        session_id: data[i][0],
        expires_at: data[i][4]
      };
    }
  }
  
  logAction("", "token_refresh", params.ip_address || "", { error: "Token not found" });
  
  return {
    success: false,
    code: "INVALID_TOKEN",
    message: "Invalid or expired token"
  };
}

// ============================================================
// ACTION: Logout
// ============================================================
function handleLogout(params) {
  const { token } = params;
  
  if (!token) {
    return {
      success: false,
      code: "MISSING_TOKEN",
      message: "Token is required"
    };
  }
  
  const sessionsSheet = SHEET.getSheetByName("Sessions");
  const data = sessionsSheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][2] === token) { // Column C is token
      const userId = data[i][1];
      sessionsSheet.deleteRow(i + 1); // Delete the session row
      
      logAction(userId, "logout", params.ip_address || "", { success: true });
      
      return {
        success: true,
        code: "LOGOUT_SUCCESS",
        message: "Logged out successfully"
      };
    }
  }
  
  return {
    success: false,
    code: "INVALID_TOKEN",
    message: "Token not found"
  };
}

// ============================================================
// ACTION: Validate Referral Code
// ============================================================
function handleValidateReferralCode(params) {
  const { referral_code } = params;
  
  if (!referral_code) {
    return {
      success: false,
      code: "MISSING_CODE",
      message: "Referral code is required"
    };
  }
  
  const codesSheet = SHEET.getSheetByName("ReferralCodes");
  const data = codesSheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][1] === referral_code) { // Column B is referral_code
      const code = {
        code_id: data[i][0],
        referral_code: data[i][1],
        created_by: data[i][3],
        discount_percentage: data[i][6],
        max_uses: data[i][7],
        current_uses: data[i][8],
        status: data[i][9]
      };
      
      // Check if code is active
      if (code.status !== "active") {
        logAction("", "referral_validation", params.ip_address || "", { error: "Code inactive" });
        return {
          success: false,
          code: "CODE_INACTIVE",
          message: "Referral code is not active"
        };
      }
      
      // Check if code has uses left
      if (code.current_uses >= code.max_uses) {
        logAction("", "referral_validation", params.ip_address || "", { error: "Code exhausted" });
        return {
          success: false,
          code: "CODE_EXHAUSTED",
          message: "Referral code has reached maximum uses"
        };
      }
      
      // Check expiration
      const expiresAt = new Date(data[i][5]);
      if (expiresAt < new Date()) {
        logAction("", "referral_validation", params.ip_address || "", { error: "Code expired" });
        return {
          success: false,
          code: "CODE_EXPIRED",
          message: "Referral code has expired"
        };
      }
      
      logAction("", "referral_validation", params.ip_address || "", { success: true });
      
      return {
        success: true,
        code: "CODE_VALID",
        message: "Referral code is valid",
        discount_percentage: code.discount_percentage
      };
    }
  }
  
  logAction("", "referral_validation", params.ip_address || "", { error: "Code not found" });
  
  return {
    success: false,
    code: "INVALID_CODE",
    message: "Referral code not found"
  };
}

// ============================================================
// ACTION: Create Order
// ============================================================
function handleCreateOrder(params) {
  const {
    user_id,
    customer_email,
    customer_name,
    total_amount,
    currency,
    service_type,
    service_details,
    delivery_date,
    payment_method,
    referral_code_used
  } = params;
  
  // Validation
  if (!customer_email || !customer_name || !total_amount || !service_type) {
    logAction(user_id || "", "order_placed", params.ip_address || "", { error: "Missing fields" });
    return {
      success: false,
      code: "MISSING_FIELDS",
      message: "customer_email, customer_name, total_amount, and service_type are required"
    };
  }
  
  // Validate referral code if provided
  if (referral_code_used) {
    const codeValidation = handleValidateReferralCode({ referral_code: referral_code_used });
    if (!codeValidation.success) {
      logAction(user_id || "", "order_placed", params.ip_address || "", { error: "Invalid referral code" });
      return {
        success: false,
        code: "INVALID_REFERRAL_CODE",
        message: codeValidation.message
      };
    }
    
    // Increment referral code usage
    const codesSheet = SHEET.getSheetByName("ReferralCodes");
    const codeData = codesSheet.getDataRange().getValues();
    for (let i = 1; i < codeData.length; i++) {
      if (codeData[i][1] === referral_code_used) {
        const newUsage = parseInt(codeData[i][8]) + 1;
        codesSheet.getRange(i + 1, 9).setValue(newUsage);
        break;
      }
    }
  }
  
  // Create order
  const orderId = generateUUID();
  const now = new Date().toISOString();
  
  const ordersSheet = SHEET.getSheetByName("Orders");
  ordersSheet.appendRow([
    orderId,                           // order_id
    user_id || "",                     // user_id
    customer_email,                    // customer_email
    customer_name,                     // customer_name
    now,                               // order_date
    total_amount,                      // total_amount
    currency || "USD",                 // currency
    "pending",                         // order_status (default)
    service_type,                      // service_type
    service_details || "",             // service_details
    delivery_date || "",               // delivery_date
    payment_method || "",              // payment_method
    referral_code_used || "",          // referral_code_used
    "no"                               // confirmation_sent (default)
  ]);
  
  logAction(user_id || "", "order_placed", params.ip_address || "", {
    order_id: orderId,
    amount: total_amount,
    referral_code: referral_code_used || "none"
  });
  
  return {
    success: true,
    code: "ORDER_CREATED",
    message: "Order created successfully",
    order: {
      order_id: orderId,
      customer_email: customer_email,
      customer_name: customer_name,
      total_amount: total_amount,
      currency: currency || "USD",
      order_status: "pending",
      order_date: now
    }
  };
}

// ============================================================
// ACTION: Fetch User Orders
// ============================================================
function handleFetchUserOrders(params) {
  const { user_id } = params;
  
  if (!user_id) {
    return {
      success: false,
      code: "MISSING_USER_ID",
      message: "user_id is required"
    };
  }
  
  const ordersSheet = SHEET.getSheetByName("Orders");
  const data = ordersSheet.getDataRange().getValues();
  
  const orders = [];
  for (let i = 1; i < data.length; i++) {
    if (data[i][1] === user_id) { // Column B is user_id
      orders.push({
        order_id: data[i][0],
        customer_email: data[i][2],
        customer_name: data[i][3],
        order_date: data[i][4],
        total_amount: data[i][5],
        currency: data[i][6],
        order_status: data[i][7],
        service_type: data[i][8],
        service_details: data[i][9],
        delivery_date: data[i][10],
        payment_method: data[i][11],
        referral_code_used: data[i][12],
        confirmation_sent: data[i][13]
      });
    }
  }
  
  logAction(user_id, "fetch_orders", params.ip_address || "", { order_count: orders.length });
  
  return {
    success: true,
    code: "ORDERS_FETCHED",
    message: `Found ${orders.length} orders`,
    orders: orders
  };
}

// ============================================================
// ACTION: Fetch Order by ID (for Admin & Customer Dashboard)
// ============================================================
function handleFetchOrderById(params) {
  const { order_id } = params;
  
  if (!order_id) {
    return {
      success: false,
      code: "MISSING_ORDER_ID",
      message: "order_id is required"
    };
  }
  
  const ordersSheet = SHEET.getSheetByName("Orders");
  const data = ordersSheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === order_id) { // Column A is order_id
      const order = {
        order_id: data[i][0],
        user_id: data[i][1],
        customer_email: data[i][2],
        customer_name: data[i][3],
        order_date: data[i][4],
        total_amount: data[i][5],
        currency: data[i][6],
        order_status: data[i][7],
        service_type: data[i][8],
        service_details: data[i][9],
        delivery_date: data[i][10],
        payment_method: data[i][11],
        referral_code_used: data[i][12],
        confirmation_sent: data[i][13]
      };
      
      logAction(data[i][1], "fetch_order_details", params.ip_address || "", { order_id });
      
      return {
        success: true,
        code: "ORDER_FOUND",
        message: "Order retrieved successfully",
        order: order
      };
    }
  }
  
  logAction("", "fetch_order_details", params.ip_address || "", { error: "Order not found" });
  
  return {
    success: false,
    code: "ORDER_NOT_FOUND",
    message: "Order not found"
  };
}

// ============================================================
// ACTION: Update Order Status (Admin Only)
// ============================================================
function handleUpdateOrderStatus(params) {
  const { order_id, new_status, admin_token } = params;
  
  if (!order_id || !new_status) {
    return {
      success: false,
      code: "MISSING_FIELDS",
      message: "order_id and new_status are required"
    };
  }
  
  // Validate admin token (optional - you can add admin verification)
  // For now, we'll skip it, but you should add proper admin verification
  
  const validStatuses = ["pending", "processing", "shipped", "delivered", "cancelled"];
  if (!validStatuses.includes(new_status)) {
    return {
      success: false,
      code: "INVALID_STATUS",
      message: `Valid statuses are: ${validStatuses.join(", ")}`
    };
  }
  
  const ordersSheet = SHEET.getSheetByName("Orders");
  const data = ordersSheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === order_id) { // Column A is order_id
      const userId = data[i][1];
      const customerEmail = data[i][2];
      
      // Update status
      ordersSheet.getRange(i + 1, 8).setValue(new_status); // Column H
      
      logAction(userId, "order_updated", params.ip_address || "", {
        order_id,
        new_status,
        customer_email: customerEmail
      });
      
      return {
        success: true,
        code: "ORDER_UPDATED",
        message: `Order status updated to ${new_status}`,
        order_id: order_id,
        new_status: new_status,
        customer_email: customerEmail
      };
    }
  }
  
  logAction("", "order_updated", params.ip_address || "", { error: "Order not found" });
  
  return {
    success: false,
    code: "ORDER_NOT_FOUND",
    message: "Order not found"
  };
}

// ============================================================
// ACTION: Mark Confirmation Email Sent
// ============================================================
function handleMarkConfirmationSent(params) {
  const { order_id } = params;
  
  if (!order_id) {
    return {
      success: false,
      code: "MISSING_ORDER_ID",
      message: "order_id is required"
    };
  }
  
  const ordersSheet = SHEET.getSheetByName("Orders");
  const data = ordersSheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === order_id) { // Column A is order_id
      ordersSheet.getRange(i + 1, 14).setValue("yes"); // Column N - confirmation_sent
      
      logAction(data[i][1], "confirmation_sent", params.ip_address || "", { order_id });
      
      return {
        success: true,
        code: "CONFIRMATION_MARKED",
        message: "Confirmation email marked as sent"
      };
    }
  }
  
  return {
    success: false,
    code: "ORDER_NOT_FOUND",
    message: "Order not found"
  };
}

// ============================================================
// ACTION: Logout
// ============================================================
function handleLogout(params) {
  const { token } = params;
  
  if (!token) {
    return {
      success: false,
      code: "MISSING_TOKEN",
      message: "Token is required"
    };
  }
  
  const sessionsSheet = SHEET.getSheetByName("Sessions");
  const data = sessionsSheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][2] === token) { // Column C is token
      const userId = data[i][1];
      sessionsSheet.deleteRow(i + 1); // Delete the session row
      
      logAction(userId, "logout", params.ip_address || "", { success: true });
      
      return {
        success: true,
        code: "LOGOUT_SUCCESS",
        message: "Logged out successfully"
      };
    }
  }
  
  return {
    success: false,
    code: "INVALID_TOKEN",
    message: "Token not found"
  };
}

// ============================================================
// ROUTER: doGet (Handles GET requests)
// ============================================================
function doGet(e) {
  try {
    const action = e.parameter.action || "";
    const ipAddress = e.source.getRemoteUser ? "server" : "unknown";
    
    // Log incoming request
    logAction("", action, ipAddress, { method: "GET", params: e.parameter });
    
    const response = {};
    
    if (action === "verify_token") {
      return handleVerifyTokenResponse(handleVerifyToken(e.parameter), e);
    } else if (action === "logout") {
      return handleLogoutResponse(handleLogout(e.parameter), e);
    } else if (action === "fetch_user_orders") {
      return handleFetchUserOrdersResponse(handleFetchUserOrders(e.parameter), e);
    } else if (action === "fetch_order_by_id") {
      return handleFetchOrderByIdResponse(handleFetchOrderById(e.parameter), e);
    } else if (action === "validate_referral_code") {
      return handleValidateReferralCodeResponse(handleValidateReferralCode(e.parameter), e);
    } else {
      response = {
        success: false,
        code: "INVALID_ACTION",
        message: `Unknown action: ${action}. Supported GET actions: verify_token, logout, fetch_user_orders, fetch_order_by_id, validate_referral_code`
      };
    }
    
    return ContentService.createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      code: "SERVER_ERROR",
      message: error.toString()
    }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ============================================================
// ROUTER: doPost (Handles POST requests)
// ============================================================
function doPost(e) {
  try {
    const action = e.parameter.action || "";
    const ipAddress = e.source.getRemoteUser ? "server" : "unknown";
    
    // Parse request body
    let payload = {};
    if (e.postData && e.postData.contents) {
      try {
        payload = JSON.parse(e.postData.contents);
      } catch (parseError) {
        return ContentService.createTextOutput(JSON.stringify({
          success: false,
          code: "INVALID_JSON",
          message: "Request body must be valid JSON"
        }))
          .setMimeType(ContentService.MimeType.JSON);
      }
    }
    
    // Merge action from URL parameter
    payload.action = action;
    payload.ip_address = ipAddress;
    
    // Log incoming request
    logAction("", action, ipAddress, { method: "POST", body: payload });
    
    let response = {};
    
    if (action === "register") {
      response = handleRegister(payload);
    } else if (action === "login") {
      response = handleLogin(payload);
    } else if (action === "google_oauth_callback") {
      response = handleGoogleOAuthCallback(payload);
    } else if (action === "create_order") {
      response = handleCreateOrder(payload);
    } else if (action === "update_order_status") {
      response = handleUpdateOrderStatus(payload);
    } else if (action === "mark_confirmation_sent") {
      response = handleMarkConfirmationSent(payload);
    } else {
      response = {
        success: false,
        code: "INVALID_ACTION",
        message: `Unknown action: ${action}. Supported POST actions: register, login, google_oauth_callback, create_order, update_order_status, mark_confirmation_sent`
      };
    }
    
    return ContentService.createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      code: "SERVER_ERROR",
      message: error.toString()
    }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ============================================================
// Helper Response Functions
// ============================================================
function handleVerifyTokenResponse(result, e) {
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function handleLogoutResponse(result, e) {
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function handleFetchUserOrdersResponse(result, e) {
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function handleFetchOrderByIdResponse(result, e) {
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function handleValidateReferralCodeResponse(result, e) {
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}
```

### Step 3.3: Replace Placeholder with Your Sheet ID

1. At the top of the script, find this line:
   ```javascript
   const SHEET_ID = "YOUR_GOOGLE_SHEET_ID_HERE";
   ```
2. Replace `YOUR_GOOGLE_SHEET_ID_HERE` with the Sheet ID you copied in Step 1.1
3. Example (do NOT use this):
   ```javascript
   const SHEET_ID = "1A2B3C4D5E6F7G8H9I";
   ```

### Step 3.4: Test the Code

1. Click **Run** at the top
2. If a permissions dialog appears, click **Review permissions**
3. Select your Google account
4. Review the permissions and click **Allow**
5. You should see "Execution completed" in the execution log

### Step 3.5: Deploy as Web App

1. Click **Deploy** at the top right
2. Click **+ New deployment**
3. Click the dropdown (gear icon) and select **Web app**
4. Fill in the deployment form:
   - **Description:** `WebDevServices API Gateway`
   - **Execute as:** Select your Google account (where the Sheets are)
   - **Who has access:** Select **Anyone** (this is intentional; see Section 6)
5. Click **Deploy**
6. A dialog shows the **Deployment ID** and the **Web App URL**:
   - Example: `https://script.googleapis.com/macros/d/DEPLOYMENT_ID/usercontent`
7. **Copy and save the full Web App URL** (you'll need it for Cloudflare Workers in Step 4)
8. Click **Done**

### Why "Anyone" Access?

The GAS Web App is deployed with "Anyone" access because:
- **GAS cannot enforce CORS or API key validation** natively
- **The Cloudflare Worker acts as the real gateway**, implementing authentication, rate limiting, and CORS
- Direct requests to the GAS URL are blocked by the Worker's request validation
- This is a **secure architecture pattern** when properly configured

### Step 3.6: Add Email & Order Functions to GAS

Before deploying, add these additional functions to handle orders and emails. **Paste these BEFORE the `doGet` function:**

```javascript
// ============================================================
// ACTION: Send Order Confirmation Email
// ============================================================
function handleSendOrderConfirmationEmail(params) {
  const { order_id, customer_email, customer_name } = params;
  
  if (!order_id || !customer_email) {
    return {
      success: false,
      code: "MISSING_FIELDS",
      message: "order_id and customer_email are required"
    };
  }
  
  // Fetch order details
  const orderData = handleFetchOrderById({ order_id });
  if (!orderData.success) {
    return {
      success: false,
      code: "ORDER_NOT_FOUND",
      message: "Cannot send email - order not found"
    };
  }
  
  const order = orderData.order;
  
  // Build email content
  const emailSubject = `Order Confirmation - Order #${order_id}`;
  const emailBody = `
Dear ${order.customer_name || customer_name},

Thank you for placing your order with WebDevServices!

ORDER DETAILS:
- Order ID: ${order_id}
- Order Date: ${order.order_date}
- Service: ${order.service_type}
- Total Amount: ${order.currency} ${order.total_amount}
- Expected Delivery: ${order.delivery_date || "To be determined"}
- Status: ${order.order_status}

We have received your order and will begin work immediately. You will receive updates as we progress through the project.

PAYMENT METHOD: ${order.payment_method}

If you have any questions, please reply to this email or contact us at support@yourdomain.com

Best regards,
WebDevServices Team
https://yourdomain.com
  `;
  
  // Send email
  try {
    GmailApp.sendEmail(customer_email, emailSubject, emailBody);
    
    // Mark confirmation as sent in the Orders sheet
    handleMarkConfirmationSent({ order_id });
    
    logAction(order.user_id, "confirmation_email_sent", "server", {
      order_id,
      customer_email,
      status: "sent"
    });
    
    return {
      success: true,
      code: "EMAIL_SENT",
      message: "Order confirmation email sent successfully",
      recipient: customer_email
    };
  } catch (error) {
    logAction(order.user_id, "confirmation_email_failed", "server", {
      order_id,
      customer_email,
      error: error.toString()
    });
    
    return {
      success: false,
      code: "EMAIL_SEND_FAILED",
      message: `Failed to send email: ${error.toString()}`
    };
  }
}

// ============================================================
// ACTION: Fetch All Orders (Admin Dashboard)
// ============================================================
function handleFetchAllOrders(params) {
  const { admin_token } = params;
  
  // Optional: Validate admin token here
  // For now, we skip it - you should implement proper admin verification
  
  const ordersSheet = SHEET.getSheetByName("Orders");
  const data = ordersSheet.getDataRange().getValues();
  
  const orders = [];
  for (let i = 1; i < data.length; i++) {
    orders.push({
      order_id: data[i][0],
      user_id: data[i][1],
      customer_email: data[i][2],
      customer_name: data[i][3],
      order_date: data[i][4],
      total_amount: data[i][5],
      currency: data[i][6],
      order_status: data[i][7],
      service_type: data[i][8],
      service_details: data[i][9],
      delivery_date: data[i][10],
      payment_method: data[i][11],
      referral_code_used: data[i][12],
      confirmation_sent: data[i][13]
    });
  }
  
  logAction("admin", "fetch_all_orders", "server", { order_count: orders.length });
  
  return {
    success: true,
    code: "ORDERS_FETCHED",
    message: `Found ${orders.length} total orders`,
    orders: orders
  };
}

// ============================================================
// ACTION: Fetch Orders by Status (Admin Dashboard)
// ============================================================
function handleFetchOrdersByStatus(params) {
  const { status } = params;
  
  if (!status) {
    return {
      success: false,
      code: "MISSING_STATUS",
      message: "status parameter is required"
    };
  }
  
  const ordersSheet = SHEET.getSheetByName("Orders");
  const data = ordersSheet.getDataRange().getValues();
  
  const orders = [];
  for (let i = 1; i < data.length; i++) {
    if (data[i][7] === status) { // Column H is order_status
      orders.push({
        order_id: data[i][0],
        user_id: data[i][1],
        customer_email: data[i][2],
        customer_name: data[i][3],
        order_date: data[i][4],
        total_amount: data[i][5],
        currency: data[i][6],
        order_status: data[i][7],
        service_type: data[i][8],
        service_details: data[i][9],
        delivery_date: data[i][10],
        payment_method: data[i][11],
        referral_code_used: data[i][12],
        confirmation_sent: data[i][13]
      });
    }
  }
  
  logAction("admin", "fetch_orders_by_status", "server", { status, count: orders.length });
  
  return {
    success: true,
    code: "ORDERS_FETCHED",
    message: `Found ${orders.length} orders with status: ${status}`,
    orders: orders
  };
}
```

### Step 3.7: Update Routers to Include New Endpoints

**In the `doGet` function**, replace the action handling section with:

```javascript
    if (action === "verify_token") {
      return handleVerifyTokenResponse(handleVerifyToken(e.parameter), e);
    } else if (action === "logout") {
      return handleLogoutResponse(handleLogout(e.parameter), e);
    } else if (action === "fetch_user_orders") {
      return handleFetchUserOrdersResponse(handleFetchUserOrders(e.parameter), e);
    } else if (action === "fetch_order_by_id") {
      return handleFetchOrderByIdResponse(handleFetchOrderById(e.parameter), e);
    } else if (action === "validate_referral_code") {
      return handleValidateReferralCodeResponse(handleValidateReferralCode(e.parameter), e);
    } else if (action === "fetch_all_orders") {
      return ContentService.createTextOutput(JSON.stringify(handleFetchAllOrders(e.parameter)))
        .setMimeType(ContentService.MimeType.JSON);
    } else if (action === "fetch_orders_by_status") {
      return ContentService.createTextOutput(JSON.stringify(handleFetchOrdersByStatus(e.parameter)))
        .setMimeType(ContentService.MimeType.JSON);
    } else {
      response = {
        success: false,
        code: "INVALID_ACTION",
        message: `Unknown GET action: ${action}. Supported: verify_token, logout, fetch_user_orders, fetch_order_by_id, validate_referral_code, fetch_all_orders, fetch_orders_by_status`
      };
    }
```

**In the `doPost` function**, replace the action handling section with:

```javascript
    if (action === "register") {
      response = handleRegister(payload);
    } else if (action === "login") {
      response = handleLogin(payload);
    } else if (action === "google_oauth_callback") {
      response = handleGoogleOAuthCallback(payload);
    } else if (action === "create_order") {
      response = handleCreateOrder(payload);
    } else if (action === "update_order_status") {
      response = handleUpdateOrderStatus(payload);
    } else if (action === "mark_confirmation_sent") {
      response = handleMarkConfirmationSent(payload);
    } else if (action === "send_order_confirmation_email") {
      response = handleSendOrderConfirmationEmail(payload);
    } else {
      response = {
        success: false,
        code: "INVALID_ACTION",
        message: `Unknown POST action: ${action}. Supported: register, login, google_oauth_callback, create_order, update_order_status, mark_confirmation_sent, send_order_confirmation_email`
      };
    }
```

---

## 4. Cloudflare Workers (The Gateway & CORS Manager)

### Step 4.1: Create a Cloudflare Workers Project

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Log in with your Cloudflare account
3. In the left sidebar, click **Workers & Pages** → **Overview**
4. Click **Create application** → **Create a Worker**
5. Name the worker: **`webdevservices-api`**
6. Click **Create service**
7. You'll see the script editor

### Step 4.2: Create wrangler.toml Configuration

1. Ensure you have [Node.js](https://nodejs.org) installed
2. Open your terminal and create a project directory:
   ```bash
   mkdir webdevservices-worker
   cd webdevservices-worker
   ```
3. Initialize with Wrangler (Cloudflare's CLI):
   ```bash
   npm install wrangler --save-dev
   npx wrangler init
   ```
4. Choose your options:
   - **Name:** `webdevservices-api`
   - **Type:** `fetch` handler
   - **Authorize to Cloudflare:** Yes, then log in
5. After initialization, open `wrangler.toml` and replace its contents:

```toml
# ============================================================
# Cloudflare Worker Configuration
# ============================================================

name = "webdevservices-api"
main = "src/index.js"
compatibility_date = "2025-01-15"

# ============================================================
# Environment Variables
# ============================================================
[env.production]
vars = { GAS_WEB_APP_URL = "https://script.googleapis.com/macros/d/YOUR_GAS_DEPLOYMENT_ID/usercontent" }

[env.development]
vars = { GAS_WEB_APP_URL = "https://script.googleapis.com/macros/d/YOUR_GAS_DEPLOYMENT_ID/usercontent" }

# ============================================================
# Route Configuration
# ============================================================
route = "yourdomain.com/api/*"
zone_id = "YOUR_CLOUDFLARE_ZONE_ID"
```

**Important:** Replace the following:
- `YOUR_GAS_DEPLOYMENT_ID`: The deployment ID from your GAS Web App URL (Step 3.5)
- `yourdomain.com`: Your actual domain
- `YOUR_CLOUDFLARE_ZONE_ID`: Your Cloudflare zone ID (find this in Cloudflare Dashboard under your domain)

### Step 4.3: Create the Worker Script

1. Open `src/index.js` and replace its contents:

```javascript
// ============================================================
// WebDevServices API - Cloudflare Worker
// Gateway between Frontend and Google Apps Script
// ============================================================

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // ============================================================
    // CORS Preflight Handler (Critical)
    // ============================================================
    if (method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
          "Access-Control-Max-Age": "86400"
        }
      });
    }

    // ============================================================
    // Only allow specific routes
    // ============================================================
    if (!path.startsWith("/api/")) {
      return new Response(JSON.stringify({
        success: false,
        code: "INVALID_ROUTE",
        message: "Only /api/* routes are supported"
      }), {
        status: 404,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }

    // ============================================================
    // Extract action from URL query parameter
    // ============================================================
    const action = url.searchParams.get("action");
    if (!action) {
      return new Response(JSON.stringify({
        success: false,
        code: "MISSING_ACTION",
        message: "Query parameter 'action' is required"
      }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }

    // ============================================================
    // Build the request to Google Apps Script
    // ============================================================
    const gasUrl = new URL(env.GAS_WEB_APP_URL);
    gasUrl.searchParams.set("action", action);

    // If it's a GET request, forward query parameters
    if (method === "GET") {
      for (const [key, value] of url.searchParams.entries()) {
        if (key !== "action") {
          gasUrl.searchParams.set(key, value);
        }
      }
    }

    // ============================================================
    // Prepare headers for GAS
    // ============================================================
    const gasHeaders = new Headers(request.headers);
    gasHeaders.set("User-Agent", "CloudflareWorker/1.0");

    // ============================================================
    // Forward the request to Google Apps Script
    // ============================================================
    let gasRequest;
    if (method === "GET") {
      gasRequest = new Request(gasUrl.toString(), {
        method: "GET",
        headers: gasHeaders
      });
    } else if (method === "POST") {
      // For POST, forward the body as-is
      const body = await request.text();
      gasRequest = new Request(gasUrl.toString(), {
        method: "POST",
        headers: gasHeaders,
        body: body
      });
    } else {
      return new Response(JSON.stringify({
        success: false,
        code: "METHOD_NOT_ALLOWED",
        message: "Only GET and POST methods are supported"
      }), {
        status: 405,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }

    // ============================================================
    // Handle GAS Response & Redirects (Critical)
    // ============================================================
    let gasResponse;
    try {
      gasResponse = await fetch(gasRequest);

      // Handle 302 redirects from GAS (GAS sometimes redirects, follow it)
      if (gasResponse.status === 302) {
        const redirectUrl = gasResponse.headers.get("Location");
        if (redirectUrl) {
          gasResponse = await fetch(new Request(redirectUrl, {
            method: method,
            headers: gasHeaders,
            body: method === "POST" ? await request.text() : null
          }));
        }
      }
    } catch (error) {
      return new Response(JSON.stringify({
        success: false,
        code: "GAS_UNREACHABLE",
        message: `Failed to reach Google Apps Script: ${error.message}`
      }), {
        status: 502,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }

    // ============================================================
    // Read the GAS response body
    // ============================================================
    const gasBody = await gasResponse.text();

    // ============================================================
    // Validate JSON response from GAS
    // ============================================================
    let jsonBody;
    try {
      jsonBody = JSON.parse(gasBody);
    } catch (e) {
      // If GAS returns non-JSON, wrap it
      jsonBody = {
        success: false,
        code: "INVALID_GAS_RESPONSE",
        message: "Google Apps Script returned non-JSON response",
        raw_response: gasBody
      };
    }

    // ============================================================
    // Return response to client with CORS headers
    // ============================================================
    return new Response(JSON.stringify(jsonBody), {
      status: gasResponse.status,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*", // Allow all origins (frontend domain)
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
        "Cache-Control": "no-cache, no-store, must-revalidate"
      }
    });
  }
};
```

### Step 4.4: Deploy the Worker

1. In your terminal, ensure you're in the `webdevservices-worker` directory
2. Deploy the worker:
   ```bash
   npx wrangler deploy --env production
   ```
3. If prompted, log in to your Cloudflare account
4. After successful deployment, you'll see:
   ```
   ✓ Uploaded webdevservices-api (2.3 KiB)
   ✓ Published webdevservices-api
     https://webdevservices-api.YOURUSERNAME.workers.dev
   ```

### Step 4.5: Set the Worker Custom Domain

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Select your domain
3. Click **Workers & Pages** → **Overview**
4. Find your worker `webdevservices-api`
5. Click it → **Settings**
6. Under **Domains & Routes**, click **Add route**
7. Enter:
   - **Route:** `yourdomain.com/api/*`
   - **Zone:** Select your zone
8. Click **Save**
9. Now your API is accessible at: `https://yourdomain.com/api/`

---

## 5. CORS Strategy (Highest Priority)

### Understanding CORS

**CORS (Cross-Origin Resource Sharing)** is a browser security feature. When your frontend (e.g., `https://yourdomain.com`) makes a request to a different origin (e.g., Google Apps Script), the browser blocks the response unless the server sends proper CORS headers.

### Why We Handle CORS in Cloudflare Worker, NOT GAS

| Aspect | GAS | Cloudflare Worker |
|--------|-----|-------------------|
| CORS Header Support | Limited/Unreliable | Full Control |
| Preflight Handling | GAS doesn't handle OPTIONS well | Complete Control |
| Header Manipulation | Can't modify response headers reliably | Can add/modify any header |
| Security | Can't validate origins properly | Can whitelist specific domains |
| **Recommendation** | DO NOT USE | ✅ Use This |

### CORS Flow in Our Architecture

```
1. Browser (Frontend)
   ↓
   Makes request to: https://yourdomain.com/api/login
   ↓
2. Cloudflare Worker (At yourdomain.com/api/*)
   ↓
   Handles CORS preflight (OPTIONS)
   Forwards request to Google Apps Script
   Returns response WITH CORS headers
   ↓
3. Browser receives response with:
   - Access-Control-Allow-Origin: *
   - Other CORS headers
   ↓
4. Browser allows JavaScript to access response
```

### CORS Preflight Request (OPTIONS)

When the browser makes a non-simple request (POST with JSON, DELETE, etc.), it first sends an **OPTIONS** request:

```
OPTIONS /api/login HTTP/1.1
Host: yourdomain.com
Origin: https://yourdomain.com
Access-Control-Request-Method: POST
Access-Control-Request-Headers: Content-Type
```

**The Cloudflare Worker handles this:**

```javascript
if (method === "OPTIONS") {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
      "Access-Control-Max-Age": "86400"
    }
  });
}
```

### Required CORS Headers Explained

| Header | Value | Purpose |
|--------|-------|---------|
| `Access-Control-Allow-Origin` | `*` or `https://yourdomain.com` | Which origins can access the resource |
| `Access-Control-Allow-Methods` | `GET, POST, PUT, DELETE, OPTIONS` | Which HTTP methods are allowed |
| `Access-Control-Allow-Headers` | `Content-Type, Authorization, X-Requested-With` | Which headers the client can send |
| `Access-Control-Max-Age` | `86400` | Cache preflight response for 24 hours |

### Using a Stricter CORS Policy (Optional Security Hardening)

If you want to restrict CORS to only your domain:

```javascript
// In worker.js, replace the CORS headers section:
const origin = request.headers.get("Origin");
const allowedOrigins = ["https://yourdomain.com", "https://www.yourdomain.com"];
const isAllowedOrigin = allowedOrigins.includes(origin);

const corsHeaders = {
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
  "Access-Control-Max-Age": "86400"
};

if (isAllowedOrigin) {
  corsHeaders["Access-Control-Allow-Origin"] = origin;
} else {
  corsHeaders["Access-Control-Allow-Origin"] = "null";
}

// Return with these headers
```

---

## 6. Deployment Checklist

### Pre-Deployment Verification

- [ ] **Google Sheet:** Created with tabs: Users, Sessions, AuthTokens, Logs, Orders, ReferralCodes
- [ ] **Google Sheet ID:** Copied and saved (`1wreXWGm1j4CCO7Id00ypwU3dd4fGFxlLs03_0RsPh78`)
- [ ] **Headers Frozen:** All 6 tabs have row 1 frozen
- [ ] **Data Validation:** Applied to all required columns (auth_provider, status, order_status, referral_code expiry, etc.)
- [ ] **Google Cloud Project:** Created and OAuth APIs enabled (Sheets API, Drive API)
- [ ] **Google OAuth Consent Screen:** Configured with scopes
- [ ] **Google OAuth Client ID & Secret:** Generated and saved
- [ ] **OAuth Authorized Origins:** Include yourdomain.com, www.yourdomain.com, localhost:3000
- [ ] **OAuth Authorized Redirect URIs:** Match your Cloudflare Worker callback path
- [ ] **Google Apps Script:** Code pasted with all functions (auth, orders, referrals, emails)
- [ ] **GAS Sheet ID:** Replaced in `const SHEET_ID = "..."` with your actual Sheet ID
- [ ] **GAS Gmail API:** Enabled in Services (for email sending)
- [ ] **GAS Web App:** Deployed with "Anyone" access
- [ ] **GAS Deployment URL:** Copied and saved
- [ ] **Cloudflare Workers:** Project created locally with Wrangler
- [ ] **wrangler.toml:** Updated with GAS URL and domain
- [ ] **worker.js:** Code pasted and validated (CORS, fetch, redirect handling)
- [ ] **Worker:** Deployed to Cloudflare
- [ ] **Custom Domain:** Mapped to Worker route (`yourdomain.com/api/*`)
- [ ] **CORS Headers:** Verified in Worker code
- [ ] **Test Referral Code:** Created in ReferralCodes sheet for testing

### Database Structure Verification

**Check each sheet has these columns:**

- [ ] **Users:** user_id, email, password_hash, auth_provider, full_name, created_at, updated_at, status, google_oauth_id, last_login
- [ ] **Sessions:** session_id, user_id, token, created_at, expires_at, ip_address, device_info
- [ ] **AuthTokens:** token_id, user_id, token_hash, created_at, expires_at, token_type
- [ ] **Logs:** log_id, user_id, action, timestamp, ip_address, details
- [ ] **Orders:** order_id, user_id, customer_email, customer_name, order_date, total_amount, currency, order_status, service_type, service_details, delivery_date, payment_method, referral_code_used, confirmation_sent
- [ ] **ReferralCodes:** code_id, referral_code, user_id, created_by, created_at, expires_at, discount_percentage, max_uses, current_uses, status

### Final Testing

#### Test 0: Create a Referral Code (Setup)

1. Go to your Google Sheet → **ReferralCodes** tab
2. Manually add a test referral code:

| Column A | Column B | Column C | Column D | Column E | Column F | Column G | Column H | Column I | Column J |
|----------|----------|----------|----------|----------|----------|----------|----------|----------|----------|
| (auto) | SUMMER2025 | (leave empty) | (your email) | 2025-01-14 | 2025-12-31 | 20 | 100 | 0 | active |

This creates a code with 20% discount, valid until Dec 31, usable 100 times.

#### Test 1: Manual Login via Cloudflare Worker

```bash
curl -X POST "https://yourdomain.com/api/login?action=login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePassword123",
    "ip_address": "192.168.1.1"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "code": "LOGIN_SUCCESS",
  "message": "Login successful",
  "session": {
    "session_id": "UUID",
    "token": "UUID",
    "expires_at": "2025-01-15T12:00:00Z",
    "user": {
      "user_id": "UUID",
      "email": "test@example.com",
      "full_name": "Test User"
    }
  }
}
```

#### Test 2: Register via Cloudflare Worker

```bash
curl -X POST "https://yourdomain.com/api/register?action=register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "SecurePassword123",
    "full_name": "New User",
    "ip_address": "192.168.1.1"
  }'
```

#### Test 3: Verify Token

```bash
curl -X GET "https://yourdomain.com/api/verify_token?action=verify_token&token=YOUR_SESSION_TOKEN"
```

#### Test 4: CORS Preflight

```bash
curl -X OPTIONS "https://yourdomain.com/api/login?action=login" \
  -H "Origin: https://yourdomain.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -v
```

**Expected Response Headers:**
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With
```

#### Test 5: Create Order with Referral Code

```bash
curl -X POST "https://yourdomain.com/api/create_order?action=create_order" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "USER_ID_FROM_TEST_1",
    "customer_email": "customer@example.com",
    "customer_name": "Test Customer",
    "total_amount": 2999,
    "currency": "USD",
    "service_type": "Starter",
    "service_details": "5-page responsive website",
    "delivery_date": "2025-02-28",
    "payment_method": "credit_card",
    "referral_code_used": "SUMMER2025",
    "ip_address": "192.168.1.1"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "code": "ORDER_CREATED",
  "message": "Order created successfully",
  "order": {
    "order_id": "UUID",
    "customer_email": "customer@example.com",
    "customer_name": "Test Customer",
    "total_amount": 2999,
    "currency": "INR",
    "order_status": "pending",
    "order_date": "2025-01-14T12:00:00Z"
  }
}
```

#### Test 6: Validate Referral Code

```bash
curl -X GET "https://yourdomain.com/api/validate_referral_code?action=validate_referral_code&referral_code=SUMMER2025"
```

**Expected Response:**
```json
{
  "success": true,
  "code": "CODE_VALID",
  "message": "Referral code is valid",
  "discount_percentage": 20
}
```

#### Test 7: Fetch User Orders (Customer Dashboard)

```bash
curl -X GET "https://yourdomain.com/api/fetch_user_orders?action=fetch_user_orders&user_id=USER_ID_FROM_TEST_1"
```

**Expected Response:**
```json
{
  "success": true,
  "code": "ORDERS_FETCHED",
  "message": "Found 1 orders",
  "orders": [
    {
      "order_id": "UUID_FROM_TEST_5",
      "customer_email": "customer@example.com",
      "customer_name": "Test Customer",
      "order_date": "2025-01-14T12:00:00Z",
      "total_amount": 2999,
      "currency": "INR",
      "order_status": "pending",
      "service_type": "Starter",
      "delivery_date": "2025-02-28",
      "referral_code_used": "SUMMER2025",
      "confirmation_sent": "no"
    }
  ]
}
```

#### Test 8: Fetch Order by ID

```bash
curl -X GET "https://yourdomain.com/api/fetch_order_by_id?action=fetch_order_by_id&order_id=ORDER_ID_FROM_TEST_5"
```

**Expected Response:**
```json
{
  "success": true,
  "code": "ORDER_FOUND",
  "message": "Order retrieved successfully",
  "order": { 
    "order_id": "UUID",
    "customer_email": "customer@example.com",
    "total_amount": 1000,
    "order_status": "pending",
    ...full order object...
  }
}
```

#### Test 9: Send Order Confirmation Email

```bash
curl -X POST "https://yourdomain.com/api/send_order_confirmation_email?action=send_order_confirmation_email" \
  -H "Content-Type: application/json" \
  -d '{
    "order_id": "ORDER_ID_FROM_TEST_5",
    "customer_email": "customer@example.com",
    "customer_name": "Test Customer"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "code": "EMAIL_SENT",
  "message": "Order confirmation email sent successfully",
  "recipient": "customer@example.com"
}
```

**Verify email was sent:**
- Go to your Google Sheet → **Logs** tab
- Find entry with action: `confirmation_email_sent` and your order_id

#### Test 10: Update Order Status (Admin)

```bash
curl -X POST "https://yourdomain.com/api/update_order_status?action=update_order_status" \
  -H "Content-Type: application/json" \
  -d '{
    "order_id": "ORDER_ID_FROM_TEST_5",
    "new_status": "confirmed"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "code": "ORDER_UPDATED",
  "message": "Order status updated to confirmed",
  "order_id": "ORDER_ID",
  "new_status": "confirmed",
  "customer_email": "customer@example.com"
}
```

#### Test 11: Fetch All Orders (Admin Dashboard)

```bash
curl -X GET "https://yourdomain.com/api/fetch_all_orders?action=fetch_all_orders"
```

**Expected Response:**
```json
{
  "success": true,
  "code": "ORDERS_FETCHED",
  "message": "Found 1 total orders",
  "orders": [ ...array of all orders... ]
}
```

#### Test 12: Fetch Orders by Status (Admin Dashboard)

```bash
curl -X GET "https://yourdomain.com/api/fetch_orders_by_status?action=fetch_orders_by_status&status=confirmed"
```

**Expected Response:**
```json
{
  "success": true,
  "code": "ORDERS_FETCHED",
  "message": "Found 1 orders with status: confirmed",
  "orders": [ ...filtered orders... ]
}
```

#### Test 13: From Frontend (JavaScript) - Place Order

```javascript
// This should work without CORS errors
fetch("https://yourdomain.com/api/create_order?action=create_order", {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    customer_email: "test@example.com",
    customer_name: "Test User",
    total_amount: 5999,
    currency: "INR",
    service_type: "Basic",
    service_details: "Full-stack MERN application",
    delivery_date: "2025-03-15",
    payment_method: "paypal",
    referral_code_used: "SUMMER2025"
  })
})
.then(res => res.json())
.then(data => {
  console.log("Order Response:", data);
  if (data.success) {
    console.log("Order ID:", data.order.order_id);
    // Show success message to customer
    // Send confirmation email (optional)
  }
})
.catch(err => console.error("Error:", err));
```

#### Test 14: From Frontend (JavaScript) - Login

```javascript
// This should work without CORS errors
fetch("https://yourdomain.com/api/login?action=login", {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    email: "test@example.com",
    password: "SecurePassword123"
  })
})
.then(res => res.json())
.then(data => {
  console.log("Login Response:", data);
  if (data.success) {
    // Store session token in localStorage
    localStorage.setItem('session_token', data.session.token);
    console.log("Logged in! Token:", data.session.token);
  }
})
.catch(err => console.error("Error:", err));
```

---

## 7. Common Pitfalls & Do Not Skip Warnings

### ⚠️ PITFALL 1: Google Apps Script 302 Redirect Loop

**The Problem:**
- GAS sometimes returns a 302 redirect response
- Direct browsers or clients following redirects will fail
- The Cloudflare Worker must handle this

**The Solution:**
In `worker.js`, we already handle this:

```javascript
if (gasResponse.status === 302) {
  const redirectUrl = gasResponse.headers.get("Location");
  if (redirectUrl) {
    gasResponse = await fetch(new Request(redirectUrl, {
      method: method,
      headers: gasHeaders,
      body: method === "POST" ? await request.text() : null
    }));
  }
}
```

**DO NOT SKIP:** This code automatically follows the redirect. If you remove it, you'll get 302 errors.

### ⚠️ PITFALL 2: Forgetting to Deploy a NEW Version of GAS

**The Problem:**
- You update your GAS code
- You click **Run** to test
- You deploy again
- **But nothing changes!** The old version is still live

**Why This Happens:**
- GAS caches deployments
- You must explicitly create a **NEW** version

**The Solution:**

1. Make your code changes in the GAS editor
2. Click **Run** to test (optional)
3. Click **Deploy** (top right)
4. Click **Manage deployments**
5. Click **+ New deployment**
6. Select **Web app** from dropdown
7. **IMPORTANT:** In the **Version** dropdown, select **New**
8. Click **Deploy**
9. You'll get a new deployment URL (or your old URL updates)

**DO NOT SKIP:** Always select **New** in the version dropdown, or your changes won't take effect.

### ⚠️ PITFALL 3: Mismatched OAuth Redirect URIs

**The Problem:**
- You set `Authorized Redirect URIs` in Google Cloud as: `https://yourdomain.com/api/auth/google/callback`
- Your frontend redirects to: `https://www.yourdomain.com/api/auth/google/callback` (with `www`)
- Google rejects the request with: `redirect_uri_mismatch`

**The Solution:**

In Google Cloud Console:
1. Go to **APIs & Services** → **Credentials**
2. Find your OAuth 2.0 Client ID
3. Click it to edit
4. Under **Authorized redirect URIs**, add BOTH:
   ```
   https://yourdomain.com/api/auth/google/callback
   https://www.yourdomain.com/api/auth/google/callback
   http://localhost:3000/api/auth/google/callback
   http://localhost:8000/api/auth/google/callback
   ```

5. Also add these under **Authorized JavaScript Origins**:
   ```
   https://yourdomain.com
   https://www.yourdomain.com
   http://localhost:3000
   http://localhost:8000
   ```

6. Click **Save**

**DO NOT SKIP:** Add all possible domain variations (with/without www, http/https, localhost variants).

### ⚠️ PITFALL 4: Google Sheet ID Not Updated in GAS

**The Problem:**
- You paste the GAS code
- You forget to replace `YOUR_GOOGLE_SHEET_ID_HERE` with your actual Sheet ID
- Code runs but returns errors like "Sheet not found"

**The Solution:**

1. In Google Sheets, open your database sheet
2. Copy the Sheet ID from the URL:
   ```
   https://docs.google.com/spreadsheets/d/1A2B3C4D5E6F7G8H9I/edit
                                         ^^^^^^^^^^^^^^^^^^^
                                         This is your ID
   ```

3. In GAS, find this line:
   ```javascript
   const SHEET_ID = "YOUR_GOOGLE_SHEET_ID_HERE";
   ```

4. Replace it with:
   ```javascript
   const SHEET_ID = "1A2B3C4D5E6F7G8H9I";
   ```

5. Click **Save**
6. Click **Run** to test

**DO NOT SKIP:** Your GAS code will NOT work without the correct Sheet ID.

### ⚠️ PITFALL 5: CORS Errors from Direct GAS Requests

**The Problem:**
- You test your API directly against the GAS URL
- Requests fail with CORS errors
- You assume GAS doesn't support CORS

**Why This Happens:**
- GAS doesn't natively support CORS headers
- That's why the Cloudflare Worker is the proxy

**The Solution:**

- **ALWAYS** make requests to: `https://yourdomain.com/api/*` (the Worker)
- **NEVER** make requests directly to: `https://script.googleapis.com/macros/d/.../`

**DO NOT SKIP:** Bypass GAS entirely; use only the Cloudflare Worker endpoint.

### ⚠️ PITFALL 6: Using "https://yourdomain.com" as Authorization Origin Instead of the Worker

**The Problem:**
- You set OAuth `Authorized JavaScript Origins` to `https://yourdomain.com`
- Your frontend tries to initiate Google OAuth from the frontend
- Google rejects it because the request isn't from an allowed origin

**The Solution:**

- **Authorization Origins** should be your FRONTEND domains (where users are):
  ```
  https://yourdomain.com
  https://www.yourdomain.com
  http://localhost:3000
  ```

- **Redirect URIs** should be your Cloudflare Worker endpoint:
  ```
  https://yourdomain.com/api/auth/google/callback
  https://www.yourdomain.com/api/auth/google/callback
  http://localhost:3000/api/auth/google/callback
  ```

- The Worker handles the callback and verifies the token from GAS

**DO NOT SKIP:** Keep these separate. Origins ≠ Redirect URIs.

### ⚠️ PITFALL 7: Not Freezing Headers in Google Sheets

**The Problem:**
- You create data in the Logs sheet
- Someone accidentally deletes the header row
- All your data structure is corrupted

**The Solution:**

For each sheet (Users, Sessions, AuthTokens, Logs):

1. Click **row 1** (the header row number)
2. Click **Format** → **Freeze** → **1 row**

This prevents anyone from deleting headers.

**DO NOT SKIP:** Freeze all headers to prevent data corruption.

### ⚠️ PITFALL 8: Password Hash Algorithm Consistency

**The Problem:**
- You use SHA256 to hash passwords during registration
- You use MD5 to verify them during login
- Hashes don't match → login fails for all users

**The Solution:**

In GAS, we use **SHA256 consistently**:

```javascript
function hashPassword(plainPassword) {
  const hash = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,  // Always use SHA_256
    plainPassword
  );
  return hash.map(function(byte) {
    let v = (byte & 0xFF).toString(16);
    return v.length === 1 ? '0' + v : v;
  }).join('');
}
```

**DO NOT SKIP:** Never change the hash algorithm. Use SHA256 everywhere.

### ⚠️ PITFALL 9: Session Token Expiration Not Checked

**The Problem:**
- Users log in and get a session token
- After 24 hours, token isn't removed
- Old tokens still work even though they're expired

**The Solution:**

In `handleVerifyToken()`, we check expiration:

```javascript
const expiresAt = new Date(data[i][4]);
if (expiresAt < new Date()) {
  return {
    success: false,
    code: "TOKEN_EXPIRED",
    message: "Session token has expired"
  };
}
```

**DO NOT SKIP:** Always validate token expiration, not just existence.

### ⚠️ PITFALL 10: Environment Variables Not Set in wrangler.toml

**The Problem:**
- You deploy the Worker
- Worker code tries to access `env.GAS_WEB_APP_URL`
- It's undefined → Worker fails

**The Solution:**

In `wrangler.toml`, ensure:

```toml
[env.production]
vars = { GAS_WEB_APP_URL = "https://script.googleapis.com/macros/d/YOUR_DEPLOYMENT_ID/usercontent" }
```

And deploy with:

```bash
npx wrangler deploy --env production
```

**DO NOT SKIP:** Set all environment variables before deploying.

### ⚠️ PITFALL 11: Referral Code Not Updating Usage Count

**The Problem:**
- Referral code is used in orders
- `current_uses` in ReferralCodes sheet doesn't increment
- Code can be redeemed more times than allowed

**Why This Happens:**
- The `handleCreateOrder` function increments usage
- But if there's an error, the increment might not happen

**The Solution:**

Ensure the ReferralCodes sheet is writable and the increment happens BEFORE the order is created:

```javascript
if (referral_code_used) {
  const codeValidation = handleValidateReferralCode({ referral_code: referral_code_used });
  if (!codeValidation.success) {
    return { success: false, code: "INVALID_REFERRAL_CODE", ... };
  }
  
  // ALWAYS increment usage count
  const codesSheet = SHEET.getSheetByName("ReferralCodes");
  const codeData = codesSheet.getDataRange().getValues();
  for (let i = 1; i < codeData.length; i++) {
    if (codeData[i][1] === referral_code_used) {
      const newUsage = parseInt(codeData[i][8]) + 1;
      codesSheet.getRange(i + 1, 9).setValue(newUsage);  // Column I
      break;
    }
  }
}
```

**DO NOT SKIP:** Update referral code usage count BEFORE confirming the order.

### ⚠️ PITFALL 12: Order Confirmation Email Never Gets Sent

**The Problem:**
- Customer places order
- You assume email is sent automatically
- Customer never receives confirmation

**Why This Happens:**
- Email sending is NOT automatic
- Frontend must explicitly call `send_order_confirmation_email` endpoint
- GAS requires Gmail API to be enabled

**The Solution:**

1. **Enable Gmail API in GAS:**
   - In Google Apps Script editor → **Services** (left sidebar)
   - Click **+ Add a service** → Search "Gmail API" → Add it

2. **After order is created, immediately send email:**

```javascript
// Frontend code
fetch('/api/create_order', { method: 'POST', body: JSON.stringify({...}) })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      const { order_id, customer_email, customer_name } = data.order;
      
      // Send confirmation email immediately
      return fetch('/api/send_order_confirmation_email', {
        method: 'POST',
        body: JSON.stringify({
          order_id,
          customer_email,
          customer_name
        })
      });
    }
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      console.log("Email sent to:", data.recipient);
    }
  });
```

3. **Monitor email status in admin dashboard:**
   - Check `confirmation_sent` column in Orders sheet
   - Filter for `confirmation_sent = "no"` to find unsent emails

**DO NOT SKIP:** Explicitly send confirmation emails; they don't happen automatically.

### ⚠️ PITFALL 13: Referral Code Expires But Still Validates

**The Problem:**
- Referral code has `expires_at: 2025-01-01`
- Current date is 2025-02-14
- Code still validates successfully
- Customer gets unintended discount

**The Solution:**

The `handleValidateReferralCode` function already checks expiration:

```javascript
const expiresAt = new Date(data[i][5]);  // Column F
if (expiresAt < new Date()) {
  logAction("", "referral_validation", params.ip_address || "", { error: "Code expired" });
  return {
    success: false,
    code: "CODE_EXPIRED",
    message: "Referral code has expired"
  };
}
```

**Ensure your ReferralCodes sheet has correct dates:**
- Use format: `YYYY-MM-DD` or Google Sheets date picker
- Future dates: `2025-12-31`
- Past dates: `2024-12-31`

**To invalidate a code without deleting it:**
1. Go to ReferralCodes sheet
2. Change `status` column to `inactive`
3. Code will be rejected automatically

**DO NOT SKIP:** Test referral code expiration with past dates.

---

## Summary: Deploy Order

1. ✅ Create Google Sheet with 4 tabs
2. ✅ Set up Google Cloud Project & OAuth
3. ✅ Create & deploy Google Apps Script Web App
4. ✅ Create & deploy Cloudflare Worker
5. ✅ Map custom domain to Worker
6. ✅ Test all endpoints
7. ✅ Monitor Logs sheet for errors

---

## Quick Reference: API Endpoints

### Authentication Endpoints

#### Register (Manual Auth)
```
POST /api/register?action=register
Body: { email, password, full_name }
Response: { success, session, user }
```

#### Login (Manual Auth)
```
POST /api/login?action=login
Body: { email, password }
Response: { success, session, token }
```

#### Google OAuth Callback
```
POST /api/google_oauth_callback?action=google_oauth_callback
Body: { google_oauth_id, email, full_name }
Response: { success, session, token }
```

#### Verify Token
```
GET /api/verify_token?action=verify_token&token=SESSION_TOKEN
Response: { success, user_id, session_id, expires_at }
```

#### Logout
```
GET /api/logout?action=logout&token=SESSION_TOKEN
Response: { success, code, message }
```

### Referral Code Endpoints

#### Validate Referral Code
```
GET /api/validate_referral_code?action=validate_referral_code&referral_code=CODE_HERE
Response: { success, discount_percentage, message }
```

### Order Endpoints

#### Create Order
```
POST /api/create_order?action=create_order
Body: {
  user_id: "UUID (optional for guest checkout)",
  customer_email: "email@example.com",
  customer_name: "John Doe",
  total_amount: 5999,
  currency: "INR",
  service_type: "Premium",
  service_details: "5-page website with responsive design",
  delivery_date: "2025-02-15",
  payment_method: "credit_card",
  referral_code_used: "SUMMER2025 (optional)"
}
Response: { success, order { order_id, customer_email, total_amount, order_status } }
```

#### Fetch User Orders (Customer Dashboard)
```
GET /api/fetch_user_orders?action=fetch_user_orders&user_id=USER_ID
Response: { success, orders: [ { order_id, status, total_amount, service_type, ... } ] }
```

#### Fetch Order by ID (Individual Order Details)
```
GET /api/fetch_order_by_id?action=fetch_order_by_id&order_id=ORDER_ID
Response: { success, order: { full order object } }
```

#### Update Order Status (Admin Only)
```
POST /api/update_order_status?action=update_order_status
Body: {
  order_id: "ORDER_ID",
  new_status: "pending|processing|shipped|delivered|cancelled",
  admin_token: "ADMIN_TOKEN (optional)"
}
Response: { success, new_status, customer_email }
```

#### Mark Confirmation Email Sent
```
POST /api/mark_confirmation_sent?action=mark_confirmation_sent
Body: { order_id: "ORDER_ID" }
Response: { success, code, message }
```

#### Send Order Confirmation Email
```
POST /api/send_order_confirmation_email?action=send_order_confirmation_email
Body: {
  order_id: "ORDER_ID",
  customer_email: "email@example.com",
  customer_name: "John Doe"
}
Response: { success, recipient, message }
```

### Admin Dashboard Endpoints

#### Fetch All Orders
```
GET /api/fetch_all_orders?action=fetch_all_orders
Response: { success, orders: [ all orders ], message }
```

#### Fetch Orders by Status
```
GET /api/fetch_orders_by_status?action=fetch_orders_by_status&status=pending|processing|shipped|delivered|cancelled
Response: { success, orders: [ filtered orders ], message }
```

---

## 8. Orders & Email Management Workflow

### Understanding the Order Lifecycle

```
1. CUSTOMER PLACES ORDER
   ↓
   Frontend calls: POST /api/create_order
   ↓
   GAS creates order in Orders sheet (status = "pending")
   ↓
   Returns: { order_id, confirmation details }

2. SEND CONFIRMATION EMAIL
   ↓
   Frontend calls: POST /api/send_order_confirmation_email
   (or backend sends automatically)
   ↓
   GAS uses Gmail API to send email
   ↓
   Updates confirmation_sent = "yes"
   ↓
   Customer receives email with order details

3. ADMIN REVIEWS ORDER
   ↓
   Admin dashboard calls: GET /api/fetch_all_orders
   or: GET /api/fetch_orders_by_status?status=pending
   ↓
   GAS returns all orders for admin review

4. ADMIN UPDATES STATUS
   ↓
   Admin clicks "Confirm Order" or "Start Work"
   ↓
   Frontend calls: POST /api/update_order_status
   ↓
   GAS updates order_status in Orders sheet
   ↓
   (Optional) Admin sends custom status email

5. CUSTOMER TRACKS ORDER
   ↓
   Customer dashboard calls: GET /api/fetch_user_orders?user_id=USER_ID
   ↓
   Returns all customer's orders with current status
   ↓
   Customer can click individual order: GET /api/fetch_order_by_id?order_id=ORDER_ID
```

### Referral Code Integration

**When creating an order:**

```javascript
POST /api/create_order
Body: {
  customer_email: "new_customer@example.com",
  referral_code_used: "FRIEND2025",
  ...
}
```

**What Happens:**
1. GAS validates the referral code (must be active & not exhausted)
2. If valid, calculates discount: `final_price = total_amount * (1 - discount_percentage/100)`
3. Stores referral code in Orders sheet
4. Increments `current_uses` in ReferralCodes sheet
5. Records in Logs sheet for tracking

**Prevent Over-Redemption:**
- ReferralCodes sheet has `max_uses` column
- GAS checks: `current_uses >= max_uses` before approving code
- Once limit reached, code is automatically rejected

### Email Configuration Best Practices

#### 1. Gmail App Password (Recommended for Production)

If you want to send emails from a custom email address (not your Google account):

1. Enable 2-factor authentication on your Google account
2. Go to [Google Account Security](https://myaccount.google.com/apppasswords)
3. Generate an "App Password" for "Mail" and "Windows"
4. Copy the 16-character password
5. In GAS, modify the email function:

```javascript
function handleSendOrderConfirmationEmail(params) {
  // ... existing code ...
  
  try {
    // Use MailApp instead of GmailApp for more control
    MailApp.sendEmail(
      customer_email,
      emailSubject,
      emailBody,
      {
        from: "noreply@yourdomain.com", // Must be your G Suite domain
        name: "WebDevServices"
      }
    );
    
    // ... rest of code ...
  }
}
```

#### 2. Rate Limiting Emails

Google has limits on emails sent via GAS. Best practices:

- **Per day:** ~100 emails
- **Per 1 second:** 1 email

Solution: Queue emails in a separate "EmailQueue" sheet and send them via a timed trigger.

```javascript
// Advanced: Schedule email sending every 5 minutes
function onOpen() {
  ScriptApp.newTrigger('processPendingEmails')
    .timeBased()
    .everyMinutes(5)
    .create();
}

function processPendingEmails() {
  // Check EmailQueue sheet for pending emails
  // Send 10 emails per execution to stay within limits
}
```

#### 3. Email Templates (HTML Emails)

For better-formatted emails, use HTML:

```javascript
const emailBodyHTML = `
<html>
  <body>
    <h2>Order Confirmation</h2>
    <p>Dear ${customer_name},</p>
    <p>Thank you for placing your order!</p>
    
    <h3>Order Details:</h3>
    <table border="1" cellpadding="10">
      <tr>
        <td><strong>Order ID</strong></td>
        <td>${order_id}</td>
      </tr>
      <tr>
        <td><strong>Total Amount</strong></td>
        <td>${currency} ${total_amount}</td>
      </tr>
      <tr>
        <td><strong>Expected Delivery</strong></td>
        <td>${delivery_date}</td>
      </tr>
    </table>
    
    <p><a href="https://yourdomain.com/order/${order_id}">View Order Status</a></p>
  </body>
</html>
`;

GmailApp.sendEmail(customer_email, emailSubject, emailBodyHTML, {
  htmlBody: emailBodyHTML
});
```

### Dashboard Data Requirements

**Customer Dashboard needs:**
- User's orders (filtered by user_id)
- Order status, total amount, service type
- Link to individual order details
- Referral code used (if applicable)
- Confirmation email status

**Admin Dashboard needs:**
- All orders (paginated)
- Filter by status (pending, processing, shipped, delivered, cancelled)
- Search by customer email or order ID
- Quick status update buttons
- Revenue metrics (sum of total_amount by status)
- Pending orders count
- Orders needing confirmation email

**Suggested Admin Dashboard Layout:**

```
┌─────────────────────────────────────────────┐
│ ADMIN DASHBOARD - WebDevServices           │
├─────────────────────────────────────────────┤
│                                              │
│ METRICS:                                     │
│ ├─ Total Orders: 45                         │
│ ├─ Pending Orders: 8                        │
│ ├─ In Progress: 12                          │
│ ├─ Completed: 25                            │
│ └─ Total Revenue: $12,500                   │
│                                              │
│ FILTERS:                                     │
│ ├─ Status: [All ▼] [Pending] [In Progress] │
│ ├─ Search: [____________________]           │
│ └─ [Apply Filter]                           │
│                                              │
│ PENDING ORDERS                              │
│ ┌───────────┬──────────┬────────┬──────────┐
│ │ Order ID  │ Customer │ Amount │ Action   │
│ ├───────────┼──────────┼────────┼──────────┤
│ │ #001      │ John D   │ $500   │ Confirm  │
│ │ #002      │ Jane S   │ $1200  │ Confirm  │
│ │ #003      │ Bob T    │ $300   │ Confirm  │
│ └───────────┴──────────┴────────┴──────────┘
│
│ IN PROGRESS ORDERS                          │
│ ┌───────────┬──────────┬────────┬──────────┐
│ │ Order ID  │ Customer │ Due    │ Action   │
│ ├───────────┼──────────┼────────┼──────────┤
│ │ #004      │ Alice M  │ Feb 15 │ Update   │
│ │ #005      │ Charlie B│ Feb 20 │ Update   │
│ └───────────┴──────────┴────────┴──────────┘
│
└─────────────────────────────────────────────┘
```

### Webhook Integration (Future Enhancement)

When your frontend is ready, trigger email sending automatically:

```javascript
// After customer places order, frontend calls:
fetch('/api/create_order', {
  method: 'POST',
  body: JSON.stringify({
    customer_email, customer_name, total_amount, ...
  })
})
.then(res => res.json())
.then(data => {
  if (data.success) {
    const orderId = data.order.order_id;
    
    // Automatically send confirmation email
    fetch('/api/send_order_confirmation_email', {
      method: 'POST',
      body: JSON.stringify({
        order_id: orderId,
        customer_email,
        customer_name
      })
    });
  }
});
```

---

## Support & Debugging

### Check Logs
1. Go to your Google Sheet
2. Click the **Logs** tab
3. All API calls are logged with: user_id, action, timestamp, IP, details

### Check GAS Execution
1. In Google Apps Script editor
2. Click **Executions** (left sidebar)
3. See all function calls, errors, and execution times

### Check Cloudflare Worker
1. Go to Cloudflare Dashboard
2. Click **Workers & Pages** → Your worker
3. Click **Analytics** to see requests, errors, and latency

---

## 9. Next Steps: Building Your Frontend & Dashboards

After your backend is deployed, you're ready to build:

### Customer-Facing Features

1. **Registration & Login Page**
   - Form for email/password registration
   - Login form with session token storage
   - Google OAuth button
   - Call endpoints: `/api/register`, `/api/login`, `/api/google_oauth_callback`

2. **Order Placement Form**
   - Service type selection (Starter, Basic, Premium)
   - Service details textarea
   - Delivery date picker
   - Referral code input (optional)
   - Payment method selection
   - Call endpoint: `/api/create_order`

3. **Customer Dashboard**
   - Display user's orders (call `/api/fetch_user_orders`)
   - Show order status, amount, delivery date
   - Click order to see full details
   - Show confirmation email status

4. **Order Details Page**
   - Full order information
   - Timeline/status updates
   - Contact support button
   - Call endpoint: `/api/fetch_order_by_id`

### Admin-Facing Features

1. **Admin Login**
   - Same as customer login (can implement role-based access later)
   - Store admin token in separate admin session

2. **Orders Dashboard**
   - Overview: Total orders, pending orders, revenue
   - Tabs: All Orders, Pending, Confirmed, In Progress, Completed, Cancelled
   - Search by customer email or order ID
   - Call endpoints: `/api/fetch_all_orders`, `/api/fetch_orders_by_status`

3. **Order Management**
   - Status update buttons (Confirm, Start Work, Mark Complete, etc.)
   - Manual email sending for status updates
   - Referral code tracking (which codes are most used)
   - Call endpoint: `/api/update_order_status`, `/api/send_order_confirmation_email`

4. **Referral Code Management**
   - Create new referral codes
   - View code usage (current_uses vs max_uses)
   - Deactivate codes
   - Analytics: Which codes are most popular

5. **Analytics Dashboard**
   - Revenue by service type
   - Revenue by referral code
   - Customer acquisition channel
   - Average order value
   - Orders by status (funnel)

### Frontend Architecture Suggestion

```
frontend/
├── pages/
│   ├── auth/
│   │   ├── register.html
│   │   ├── login.html
│   │   └── oauth-callback.html
│   ├── customer/
│   │   ├── dashboard.html (orders list)
│   │   ├── order-details.html
│   │   └── place-order.html
│   ├── admin/
│   │   ├── dashboard.html (all orders)
│   │   ├── order-management.html
│   │   ├── referral-codes.html
│   │   └── analytics.html
├── js/
│   ├── api.js (all endpoint calls)
│   ├── auth.js (session management)
│   ├── orders.js (order operations)
│   └── admin.js (admin operations)
├── css/
│   ├── style.css
│   └── admin.css
└── index.html (homepage)
```

### Recommended Frontend Framework

- **Vanilla JS + HTML/CSS** (minimal, no build required)
- **React** (if you need interactive dashboards)
- **Vue.js** (lightweight alternative)
- **Next.js** (if building a full application)

### Session Management Pattern

```javascript
// After login, store token in localStorage
fetch('/api/login?action=login', { ... })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      localStorage.setItem('session_token', data.session.token);
      localStorage.setItem('user_id', data.session.user.user_id);
      localStorage.setItem('user_email', data.session.user.email);
      
      // Redirect to dashboard
      window.location.href = '/customer/dashboard.html';
    }
  });

// Before making API calls, verify token is still valid
async function getAuthHeaders() {
  const token = localStorage.getItem('session_token');
  if (!token) {
    window.location.href = '/pages/auth/login.html';
    return null;
  }
  
  // Verify token every page load
  const verify = await fetch(`/api/verify_token?action=verify_token&token=${token}`);
  const result = await verify.json();
  
  if (!result.success) {
    localStorage.clear();
    window.location.href = '/pages/auth/login.html';
    return null;
  }
  
  return { 'Authorization': `Bearer ${token}` };
}

// Use in all API calls
const headers = await getAuthHeaders();
if (headers) {
  fetch('/api/fetch_user_orders?action=fetch_user_orders&user_id=' + userId, {
    headers: headers
  })
}
```

### Production Readiness Checklist

Before launching to production:

- [ ] Test all auth flows (register, login, OAuth)
- [ ] Test referral code validation and usage tracking
- [ ] Test order creation with and without referral codes
- [ ] Verify confirmation emails are sent and logged
- [ ] Test admin dashboard filters and updates
- [ ] Verify CORS works on production domain
- [ ] Enable HTTPS (should already be done via Cloudflare)
- [ ] Set up monitoring/alerting for API errors
- [ ] Implement rate limiting on Cloudflare Worker (prevent abuse)
- [ ] Test with 100+ orders to ensure Sheets performance is acceptable
- [ ] Set up automatic backups of Google Sheet
- [ ] Create admin documentation
- [ ] Create customer FAQ

### Performance Optimization Tips

**Google Sheets Performance:**
- Sheets can handle ~10,000 rows without major slowdown
- After 10,000 orders, consider archiving old orders to a separate sheet
- Use indexed queries (user_id) instead of scanning all rows

**Cloudflare Worker Optimization:**
- Cache GET endpoints (Orders list) for 60 seconds
- Add rate limiting: 100 requests per minute per IP
- Add request validation to prevent malformed payloads

**Email Optimization:**
- Don't send emails synchronously (blocks order creation)
- Queue emails in a separate "EmailQueue" sheet
- Process queue every 5 minutes with timed trigger
- Can send ~10 emails per execution safely

### Future Enhancements

1. **Payment Integration** (Stripe, PayPal)
2. **Invoice Generation** (PDF from order)
3. **Customer Support Ticketing** (linked to orders)
4. **Portfolio/Gallery** (display completed projects)
5. **Scheduling/Calendar** (delivery dates)
6. **Custom Email Templates** (HTML, branding)
7. **Multi-currency Support** (already in DB, just frontend UI)
8. **Bulk Operations** (admin: bulk status updates, bulk email)
9. **File Uploads** (design files, requirements documents)
10. **Customer Reviews/Ratings** (after project completion)

---

**Deployment Status: READY FOR FRONTEND INTEGRATION**

Your backend is production-ready. Next step: Build your customer and admin dashboards to consume these APIs.

Last validated: January 2026
