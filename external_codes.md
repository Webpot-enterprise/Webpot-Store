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
      case "login":
        return loginUserApi(body, meta);
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
  if (findUserByEmail(email)) {
    return json({ error: "Email already registered" }, 400);
  }

  const user_id = uid("USER");
  const now = new Date();

  appendRow("Users", {
    user_id,
    email,
    password_hash: hash(password),
    auth_provider: "local",
    full_name,
    created_at: now,
    updated_at: now,
    status: "active",
    google_auth_id: "",
    last_login: now
  });

  generateReferralCode(user_id);
  logAction(user_id, "register", meta);

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

  updateUser(user.user_id, { last_login: new Date() });
  logAction(user.user_id, "login", meta);

  const token = issueToken(user.user_id);
  delete user.password_hash;

  return json({ token, user });
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