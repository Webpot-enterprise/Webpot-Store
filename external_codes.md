Cloudfare Worker code:

const GAS_URL =
  "https://script.google.com/macros/s/AKfycbxb5XesTNnxNySyUVuDBU6Vjyk2PBDia5pbyULneRBVYnGExxisZY7zXFBJ48nDekwe/exec";

const ALLOWED_ORIGINS = [
  "https://webpot.shop",
  "https://www.webpot.shop",
  "https://yourusername.github.io"
];

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin");

    if (request.method === "OPTIONS") {
      return corsPreflight(origin);
    }

    if (!url.pathname.startsWith("/api/")) {
      return cors(new Response(JSON.stringify({ error: "Not Found" }), { status: 404 }), origin);
    }

    const gasURL = new URL(GAS_URL);
    url.searchParams.forEach((v, k) => gasURL.searchParams.append(k, v));

    const ip = request.headers.get("CF-Connecting-IP") || "";
    const ua = request.headers.get("User-Agent") || "";

    gasURL.searchParams.append("ip", ip);
    gasURL.searchParams.append("ua", ua);

    const options = {
      method: request.method,
      headers: { "Content-Type": "application/json" }
    };

    if (request.method !== "GET") {
      options.body = await request.text();
    }

    const res = await fetch(gasURL.toString(), options);
    return cors(res, origin);
  }
};

function corsPreflight(origin) {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(origin)
  });
}

function cors(response, origin) {
  const headers = new Headers(response.headers);
  Object.entries(corsHeaders(origin)).forEach(([k, v]) => headers.set(k, v));
  return new Response(response.body, { status: response.status, headers });
}

function corsHeaders(origin) {
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGINS.includes(origin) ? origin : "null",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Security-Policy":
      "default-src 'self'; script-src 'self' https://accounts.google.com https://apis.google.com https://www.gstatic.com; frame-src https://accounts.google.com;"
  };
}


Google sheets apps script code:

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

      default:
        return json({ error: "Invalid action" }, 400);
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
   CONTACT FORM
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

function json(obj, code = 200) {
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
