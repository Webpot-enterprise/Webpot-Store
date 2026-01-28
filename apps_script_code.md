/* ================================
   GOOGLE APPS SCRIPT - WEBPOT BACKEND
   
   ✅ OTP-BASED LOGIN IMPLEMENTATION
   
   NEW FEATURES (Jan 28, 2026):
   - User login now requires email + password + OTP verification
   - Registration & Google OAuth unchanged
   - OTP sent via email, valid for 5 minutes
   - Max 5 verification attempts per OTP
   - OTP hashed before storage (not in plain text)
   - New sheet: LoginOTPs (otp_id, user_id, otp_token, otp_hash, etc)
   
   NEW ENDPOINTS:
   - action=login    → loginUserApi() - Step 1: Request OTP
   - action=verifyOtp → verifyOtpApi() - Step 2: Verify OTP & issue token
   - action=resendOtp → resendOtpApi() - Resend OTP to email
   
   See: OTP_IMPLEMENTATION.md for complete documentation
================================ */

const SHEET_ID = "1wreXWGm1j4CCO7Id00ypwU3dd4fGFxlLs03_0RsPh78";
const SPREADSHEET = SpreadsheetApp.openById(SHEET_ID);

/* ================================
   ENTRY POINTS
================================ */

function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

/* ================================
   ROUTER
================================ */

function handleRequest(e) {
  try {
    const action = e.parameter?.action || null;
    
    // DEFENSIVE: Strict validation guard for action parameter
    // Ensures action exists, is a string, and is not empty
    if (!action) {
      return json({
        error: "Invalid action",
        received_action: action,
        typeof_received_action: typeof action
      }, 400);
    }
    
    if (typeof action !== "string") {
      return json({
        error: "Invalid action",
        received_action: action,
        typeof_received_action: typeof action
      }, 400);
    }
    
    if (action.trim() === "") {
      return json({
        error: "Invalid action",
        received_action: action,
        typeof_received_action: typeof action
      }, 400);
    }
    
    const body = safeParseJSON(e.postData);
    const meta = extractMeta(e);

    switch (action) {
      case "register":
        return registerUserApi(body, meta);
      case "verifyRegistrationToken":
        return verifyRegistrationTokenApi(body, meta);
      case "completeRegistration":
        return completeRegistrationApi(body, meta);
      case "login":
        return loginUserApi(body, meta);
      case "verifyOtp":
        return verifyOtpApi(body, meta);
      case "resendOtp":
        return resendOtpApi(body, meta);
      case "googleLogin":
        return googleLoginApi(body, meta);
      case "verifyToken":
        return verifyTokenApi(body);
      case "contact":
        return contactApi(body, meta);

      /* NEW */
      case "createOrder":
        return createOrderApi(body, meta);
      case "getUserOrders":
        return getUserOrdersApi(body);

      default:
        // DEFENSIVE: Unknown action - return diagnostic info for debugging
        return json({
          error: "Unknown action",
          action: action
        }, 400);
    }
  } catch (err) {
    console.error(err);
    return json({ error: "Server error" }, 500);
  }
}

/* ================================
   AUTH
================================ */

function registerUserApi(body, meta) {
  const full_name = clean(body.name);
  const email = clean(body.email);
  const password = body.password;

  if (!full_name || !email || !password) {
    return json({ error: "Missing fields" }, 400);
  }
  if (!isValidEmail(email)) {
    return json({ error: "Invalid email" }, 400);
  }
  
  // Check if email exists in Users or PendingRegistrations
  if (findUserByEmail(email)) {
    return json({ error: "Email already registered" }, 400);
  }
  if (findPendingByEmail(email)) {
    return json({ error: "Email already has a pending registration" }, 400);
  }

  // Generate verification token
  const verification_token = Utilities.getUuid();
  const now = new Date();
  const expires_at = new Date(now.getTime() + 30 * 60 * 1000); // 30 minutes
  const pending_id = uid("PENDING");

  // Insert into PendingRegistrations (NOT Users)
  appendRow("PendingRegistrations", {
    pending_id,
    email,
    password_hash: hash(password),
    full_name,
    verification_token,
    expires_at,
    created_at: now,
    status: "pending"
  });

  // Send verification email
  sendVerificationEmail(email, full_name, verification_token);

  // Log registration request (do NOT log password)
  logAction("", "registration_pending", meta);

  return json({
    success: true,
    message: "Verification email sent. Please check your inbox.",
    email: email
  });
}

function verifyRegistrationTokenApi(body, meta) {
  const verification_token = body.token || "";

  if (!verification_token) {
    return json({ error: "Missing verification token" }, 400);
  }

  // Find pending registration
  const pending = findPendingByToken(verification_token);

  if (!pending) {
    return json({ error: "Invalid or expired verification token" }, 401);
  }

  const now = new Date();
  const expires_at = new Date(pending.expires_at);

  // Check if expired
  if (expires_at < now) {
    // Delete expired registration
    deletePendingRecord(verification_token);
    return json({ error: "Verification link expired. Please register again." }, 401);
  }

  // Return pending user info for confirmation page
  return json({
    success: true,
    email: pending.email,
    full_name: pending.full_name,
    pending_id: pending.pending_id
  });
}

function completeRegistrationApi(body, meta) {
  const verification_token = body.token || "";

  if (!verification_token) {
    return json({ error: "Missing verification token" }, 400);
  }

  // Re-validate token
  const pending = findPendingByToken(verification_token);

  if (!pending) {
    return json({ error: "Invalid or expired verification token" }, 401);
  }

  const now = new Date();
  const expires_at = new Date(pending.expires_at);

  // Check if expired
  if (expires_at < now) {
    deletePendingRecord(verification_token);
    return json({ error: "Verification link expired. Please register again." }, 401);
  }

  // Check if already verified
  if (pending.status === "verified") {
    return json({ error: "This registration has already been completed." }, 400);
  }

  // Check if email is now taken (race condition)
  if (findUserByEmail(pending.email)) {
    return json({ error: "Email was registered by another account. Please try again." }, 400);
  }

  // Create user account
  const user_id = uid("USER");

  appendRow("Users", {
    user_id,
    email: pending.email,
    password_hash: pending.password_hash,
    auth_provider: "local",
    full_name: pending.full_name,
    created_at: now,
    updated_at: now,
    status: "active",
    google_auth_id: "",
    last_login: now
  });

  // Generate referral code
  generateReferralCode(user_id);

  // Mark pending as verified
  updatePendingStatus(verification_token, "verified");

  // Log successful registration
  logAction(user_id, "registration_verified", meta);

  // Issue auth token
  const token = issueToken(user_id);
  const user = getUserByIdInternal(user_id);
  delete user.password_hash;

  return json({ token, user });
}

function loginUserApi(body, meta) {
  const email = clean(body.email);
  const password = body.password || "";

  const user = findUserByEmail(email);
  if (!user || user.auth_provider !== "local") {
    return json({ error: "Invalid credentials" }, 401);
  }
  if (user.password_hash !== hash(password)) {
    return json({ error: "Invalid credentials" }, 401);
  }

  // Credentials are valid - generate OTP
  const otp_code = generateOtpCode();
  const otp_token = uid("OTP");
  const now = new Date();
  const expires_at = new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes
  const otp_hash = hash(otp_code);

  // Store OTP in LoginOTPs sheet
  appendRow("LoginOTPs", {
    otp_id: uid("OTPID"),
    user_id: user.user_id,
    otp_token,
    otp_hash,
    expires_at,
    attempts: 0,
    created_at: now
  });

  // Send OTP email
  sendOtpEmail(user.email, user.full_name, otp_code);

  // Log OTP request (do NOT log the OTP code itself)
  logAction(user.user_id, "login_otp_requested", meta);

  // Return OTP required response
  return json({
    otp_required: true,
    otp_token: otp_token
  });
}

function verifyOtpApi(body, meta) {
  const otp_token = body.otp_token || "";
  const otp_code = body.otp_code || "";

  if (!otp_token || !otp_code) {
    return json({ error: "Missing OTP or token" }, 400);
  }

  // Find OTP record
  const otps = readSheet("LoginOTPs");
  const otp_record = otps.find(o => o.otp_token === otp_token);

  if (!otp_record) {
    return json({ error: "Invalid or expired OTP" }, 401);
  }

  const now = new Date();
  const expires_at = new Date(otp_record.expires_at);

  // Check if OTP is expired
  if (expires_at < now) {
    // Delete expired OTP
    deleteOtpRecord(otp_token);
    return json({ error: "OTP expired. Please request a new one." }, 401);
  }

  // Check attempts
  const attempts = Number(otp_record.attempts) || 0;
  if (attempts >= 5) {
    deleteOtpRecord(otp_token);
    return json({ error: "Too many incorrect attempts. Please request a new OTP." }, 401);
  }

  // Verify OTP code
  const otp_hash = hash(otp_code);
  if (otp_record.otp_hash !== otp_hash) {
    // Increment attempts
    updateOtpAttempts(otp_token, attempts + 1);
    const remaining = 5 - (attempts + 1);
    return json({
      error: remaining > 0 ? `Invalid OTP. ${remaining} attempts remaining.` : "Too many attempts.",
      attempts_remaining: remaining
    }, 401);
  }

  // OTP is valid!
  const user_id = otp_record.user_id;
  const user = getUserByIdInternal(user_id);

  if (!user) {
    return json({ error: "User not found" }, 404);
  }

  // Delete OTP record (one-time use)
  deleteOtpRecord(otp_token);

  // Update last login
  updateUser(user_id, { last_login: now });

  // Log successful OTP verification
  logAction(user_id, "login_otp_verified", meta);

  // Issue auth token
  const token = issueToken(user_id);
  delete user.password_hash;

  return json({ token, user });
}

function resendOtpApi(body, meta) {
  const otp_token = body.otp_token || "";

  if (!otp_token) {
    return json({ error: "Missing OTP token" }, 400);
  }

  // Find the original OTP record
  const otps = readSheet("LoginOTPs");
  const otp_record = otps.find(o => o.otp_token === otp_token);

  if (!otp_record) {
    return json({ error: "Invalid OTP session" }, 401);
  }

  const user = getUserByIdInternal(otp_record.user_id);
  if (!user) {
    return json({ error: "User not found" }, 404);
  }

  // Delete old OTP record
  deleteOtpRecord(otp_token);

  // Generate new OTP
  const new_otp_code = generateOtpCode();
  const new_otp_token = uid("OTP");
  const now = new Date();
  const expires_at = new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes
  const new_otp_hash = hash(new_otp_code);

  // Store new OTP
  appendRow("LoginOTPs", {
    otp_id: uid("OTPID"),
    user_id: user.user_id,
    otp_token: new_otp_token,
    otp_hash: new_otp_hash,
    expires_at,
    attempts: 0,
    created_at: now
  });

  // Send new OTP email
  sendOtpEmail(user.email, user.full_name, new_otp_code);

  // Log resend
  logAction(user.user_id, "login_otp_resent", meta);

  return json({
    otp_required: true,
    otp_token: new_otp_token
  });
}

// ============================================
// OTP HELPERS
// ============================================

function generateOtpCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ============================================
// EMAIL FUNCTIONS
// ============================================

function sendVerificationEmail(email, name, token) {
  const verifyLink = `https://webpot.shop/verify.html?token=${encodeURIComponent(token)}`;
  const subject = "Verify Your Webpot Account";
  const message = `
    <h2>Hello ${name},</h2>
    <p>Thank you for registering with Webpot! Click the button below to verify your email address:</p>
    <p>
      <a href="${verifyLink}" style="display: inline-block; background-color: #00d4ff; color: #000; padding: 12px 24px; border-radius: 4px; text-decoration: none; font-weight: bold;">
        Verify Email
      </a>
    </p>
    <p style="color: #999; font-size: 12px;">Or copy and paste this link: ${verifyLink}</p>
    <p style="color: #999; font-size: 12px;">This link expires in 30 minutes.</p>
    <p>If you didn't register for this account, please ignore this email.</p>
    <hr>
    <p style="color: #999; font-size: 12px;">Webpot Store</p>
  `;

  try {
    MailApp.sendEmail(email, subject, "", {
      htmlBody: message,
      noReply: true
    });
  } catch (err) {
    console.error("Error sending verification email:", err);
    logAction("", "email_send_failed", { error: err.message });
  }
}

function sendOtpEmail(email, name, otp_code) {
  const subject = "Your Webpot Login OTP";
  const message = `
    <h2>Hello ${name},</h2>
    <p>Your one-time password (OTP) for Webpot login is:</p>
    <h1 style="color: #00d4ff; font-family: monospace; letter-spacing: 4px;">${otp_code}</h1>
    <p>This OTP is valid for 5 minutes only.</p>
    <p>If you didn't request this, please ignore this email.</p>
    <hr>
    <p style="color: #999; font-size: 12px;">Webpot Store</p>
  `;

  try {
    MailApp.sendEmail(email, subject, "", {
      htmlBody: message,
      noReply: true
    });
  } catch (err) {
    console.error("Error sending OTP email:", err);
    // Log but don't fail - OTP is still usable
    logAction("", "email_send_failed", { error: err.message });
  }
}

function deleteOtpRecord(otp_token) {
  const sh = SPREADSHEET.getSheetByName("LoginOTPs");
  const data = sh.getDataRange().getValues();
  const headers = data[0];
  const tokenCol = headers.indexOf("otp_token");

  for (let i = data.length - 1; i >= 1; i--) {
    if (data[i][tokenCol] === otp_token) {
      sh.deleteRow(i + 1);
      break;
    }
  }
}

function updateOtpAttempts(otp_token, attempts) {
  const sh = SPREADSHEET.getSheetByName("LoginOTPs");
  const data = sh.getDataRange().getValues();
  const headers = data[0];
  const tokenCol = headers.indexOf("otp_token");
  const attemptsCol = headers.indexOf("attempts");

  for (let i = 1; i < data.length; i++) {
    if (data[i][tokenCol] === otp_token) {
      sh.getRange(i + 1, attemptsCol + 1).setValue(attempts);
      break;
    }
  }
}

function googleLoginApi(body, meta) {
  const idToken = body.idToken;
  if (!idToken) return json({ error: "Missing Google token" }, 400);

  const info = verifyGoogleIdToken(idToken);
  if (!info) return json({ error: "Invalid Google token" }, 401);

  let user = findUserByGoogleId(info.sub) || findUserByEmail(info.email);
  const now = new Date();

  if (!user) {
    const user_id = uid("USER");

    appendRow("Users", {
      user_id,
      email: info.email,
      password_hash: "",
      auth_provider: "google",
      full_name: info.name || info.email,
      created_at: now,
      updated_at: now,
      status: "active",
      google_auth_id: info.sub,
      last_login: now
    });

    generateReferralCode(user_id);
    logAction(user_id, "google_register", meta);
    user = getUserByIdInternal(user_id);
  } else {
    updateUser(user.user_id, { last_login: now });
    logAction(user.user_id, "google_login", meta);
  }

  const token = issueToken(user.user_id);
  delete user.password_hash;

  return json({ token, user });
}

/* ================================
   ORDERS
================================ */

function createOrderApi(body, meta) {
  if (!body.token) {
    return json({ error: "Missing token" }, 400);
  }

  const user_id = validateToken(body.token);
  if (!user_id) {
    return json({ error: "Invalid token" }, 401);
  }

  const order_id = uid("ORDER");
  const now = new Date();

  appendRow("Orders", {
    order_id,
    user_id,
    customer_email: clean(body.customer_email || ""),
    customer_name: clean(body.customer_name || ""),
    order_date: now,
    total_amount: Number(body.total_amount || 0),
    currency: body.currency || "INR",
    order_status: "pending",
    service_type: clean(body.service_type || ""),
    service_details: clean(body.service_details || ""),
    delivery_date: "",
    payment_method: body.payment_method || "pay_later",
    referral_code_used: clean(body.referral_code || ""),
    confirmation_sent: false
  });

  logAction(user_id, "create_order", meta);

  return json({ success: true, order_id });
}

function getUserOrdersApi(body) {
  if (!body.token) {
    return json({ error: "Missing token" }, 400);
  }

  const user_id = validateToken(body.token);
  if (!user_id) {
    return json({ error: "Invalid token" }, 401);
  }

  const orders = readSheet("Orders")
    .filter(o => o.user_id === user_id)
    .sort((a, b) => new Date(b.order_date) - new Date(a.order_date));

  return json({ orders });
}

/* ================================
   CONTACT
================================ */

function contactApi(body, meta) {
  if (!body.name || !body.email || !body.message) {
    return json({ error: "Missing fields" }, 400);
  }

  appendRow("Contacts", {
    contact_id: uid("CONTACT"),
    name: clean(body.name),
    email: clean(body.email),
    subject: clean(body.subject || ""),
    message: clean(body.message),
    submitted_at: new Date(),
    source: "website",
    ip_address: meta.ip,
    user_agent: meta.ua
  });

  return json({ success: true });
}

/* ================================
   REFERRALS
================================ */

function generateReferralCode(user_id) {
  const code = "REF-" + Utilities.getUuid().slice(0, 8).toUpperCase();

  appendRow("ReferralCodes", {
    code_id: uid("REF"),
    referral_code: code,
    user_id,
    created_by: user_id,
    created_at: new Date(),
    expires_at: "",
    discount_percentage: 10,
    max_users: 1,
    current_users: 0,
    status: "active"
  });
}

/* ================================
   TOKENS
================================ */

function issueToken(user_id) {
  const token = Utilities.getUuid();
  appendRow("AuthTokens", {
    token_id: uid("TOKEN"),
    user_id,
    token_hash: hash(token),
    created_at: new Date(),
    expires_at: new Date(Date.now() + 86400000),
    token_type: "session"
  });
  return token;
}

function verifyTokenApi(body) {
  if (!body.token) return json({ error: "Missing token" }, 400);
  const user_id = validateToken(body.token);
  if (!user_id) return json({ error: "Invalid token" }, 401);
  return json({ valid: true, user_id });
}

function validateToken(token) {
  const token_hash = hash(token);
  const rows = readSheet("AuthTokens");
  const row = rows.find(r => r.token_hash === token_hash);
  if (!row || new Date(row.expires_at) < new Date()) return null;
  return row.user_id;
}

/* ================================
   LOGGING + META
================================ */

function extractMeta(e) {
  return {
    ip: e.parameter?.ip || "",
    ua: e.parameter?.ua || ""
  };
}

function logAction(user_id, action, meta) {
  appendRow("Logs", {
    log_id: uid("LOG"),
    user_id,
    action,
    timestamp: new Date(),
    ip_address: meta.ip,
    details: meta.ua
  });
}

/* ================================
   HELPERS
================================ */

function findUserByEmail(email) {
  return readSheet("Users").find(u => u.email === email) || null;
}

function findUserByGoogleId(id) {
  return readSheet("Users").find(u => u.google_auth_id === id) || null;
}

function getUserByIdInternal(user_id) {
  return readSheet("Users").find(u => u.user_id === user_id) || null;
}

function findPendingByEmail(email) {
  const pending = readSheet("PendingRegistrations");
  return pending.find(p => p.email === email && p.status === "pending") || null;
}

function findPendingByToken(token) {
  const pending = readSheet("PendingRegistrations");
  return pending.find(p => p.verification_token === token) || null;
}

function deletePendingRecord(token) {
  const sh = SPREADSHEET.getSheetByName("PendingRegistrations");
  const data = sh.getDataRange().getValues();
  const headers = data[0];
  const tokenCol = headers.indexOf("verification_token");

  for (let i = data.length - 1; i >= 1; i--) {
    if (data[i][tokenCol] === token) {
      sh.deleteRow(i + 1);
      break;
    }
  }
}

function updatePendingStatus(token, status) {
  const sh = SPREADSHEET.getSheetByName("PendingRegistrations");
  const data = sh.getDataRange().getValues();
  const headers = data[0];
  const tokenCol = headers.indexOf("verification_token");
  const statusCol = headers.indexOf("status");

  for (let i = 1; i < data.length; i++) {
    if (data[i][tokenCol] === token) {
      sh.getRange(i + 1, statusCol + 1).setValue(status);
      break;
    }
  }
}

function updateUser(user_id, updates) {
  const sh = SPREADSHEET.getSheetByName("Users");
  const data = sh.getDataRange().getValues();
  const headers = data[0];
  const rowIndex = data.findIndex(
    r => r[headers.indexOf("user_id")] === user_id
  );
  if (rowIndex === -1) return;

  Object.keys(updates).forEach(key => {
    const col = headers.indexOf(key);
    if (col !== -1) {
      sh.getRange(rowIndex + 1, col + 1).setValue(updates[key]);
    }
  });

  sh.getRange(rowIndex + 1, headers.indexOf("updated_at") + 1)
    .setValue(new Date());
}

function readSheet(name) {
  const sh = SPREADSHEET.getSheetByName(name);
  const values = sh.getDataRange().getValues();
  const headers = values[0];
  return values.slice(1).map(row =>
    Object.fromEntries(headers.map((h, i) => [h, row[i]]))
  );
}

function appendRow(name, obj) {
  const sh = SPREADSHEET.getSheetByName(name);
  const headers = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
  sh.appendRow(headers.map(h => obj[h] ?? ""));
}

function safeParseJSON(postData) {
  try {
    return postData?.contents ? JSON.parse(postData.contents) : {};
  } catch {
    return {};
  }
}

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function hash(str) {
  return Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    str || ""
  ).map(b => ("0" + (b < 0 ? b + 256 : b).toString(16)).slice(-2)).join("");
}

function uid(prefix) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

function isValidEmail(e) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

function clean(s) {
  return typeof s === "string" ? s.trim() : "";
}