# Webpot Registration Flow: Clean Update (Jan 28, 2026)

## Overview
This update introduces a secure, two-step email verification process for user registration. Only verified users are added to the Users sheet. All backend changes must be reflected in:
- `apps_script_code.md` (Google Apps Script backend)
- `cloudfare_code.md` (Cloudflare Worker)

## Registration Flow
1. **User submits registration form**
2. **User is redirected to `/check-email.html`**
   - Displays: “We’ve sent a verification link to your email.”
3. **User receives email with a verification link**
   - Link format: `https://webpot.shop/verify.html?token=VERIFICATION_TOKEN`
4. **User clicks the link**
   - Opens `/verify.html` page
   - Shows: “Your email is verified. Click below to continue.”
   - Button: “Verify & Continue”
5. **User clicks button**
   - Calls backend to complete registration
   - On success: “Account verified. Redirecting…”
   - Redirects to `/index.html`

## Backend Architecture (Apps Script)

### 1. New Sheet: `PendingRegistrations`
| Column              | Description                |
|---------------------|----------------------------|
| pending_id          | Unique row ID              |
| email               | User email                 |
| password_hash       | Hashed password            |
| full_name           | User’s full name           |
| verification_token  | Unique token (UUID)        |
| expires_at          | Expiry timestamp (+30 min) |
| created_at          | Creation timestamp         |
| status              | `pending`, `verified`, `expired` |

### 2. Registration API Changes
- On `action=register`:
  - Do **not** insert into Users
  - Insert into `PendingRegistrations` with generated token and expiry
  - Send verification email with link

### 3. New API Actions
- `action=verifyRegistrationToken`
  - Input: `{ token }`
  - Validates token exists, is not expired, status is `pending`
  - Returns: `email`, `full_name`, `pending_id`
- `action=completeRegistration`
  - Input: `{ token }`
  - Re-validates token
  - Inserts user into Users sheet
  - Generates: `user_id`, timestamps, status = `active`, referral code, auth token
  - Marks pending row as `verified`
  - Returns: `{ token, user }`

## Frontend Changes

### 1. `/verify.html`
- Extracts token from URL
- Shows verification message and button
- On button click: calls `completeRegistration`
- Shows success message and redirects

### 2. `/check-email.html`
- Shown after registration form submit
- Displays: “We’ve sent a verification link to your email.”
- No backend calls

## Security Rules
- Tokens expire after 30 minutes
- Expired or reused tokens are invalid
- Duplicate emails are rejected
- Only verified users are added to Users
- Pending entries cannot authenticate

## Markdown Update Rule
- **All backend changes must be made in:**
  - `apps_script_code.md`
  - `cloudfare_code.md`
- **Do NOT edit live code files directly**

## Acceptance Criteria
- Only verified users in Users sheet
- Unverified users cannot log in
- Token reuse and expired tokens fail
- Dashboard and OTP login remain unchanged