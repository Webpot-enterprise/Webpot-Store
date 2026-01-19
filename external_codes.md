Cloudfare worker code:
// ============================================================================
// CLOUDFLARE WORKER - API GATEWAY
// ============================================================================

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
    const path = url.pathname;

    let origin = request.headers.get("Origin");
    if (origin) origin = origin.replace(/\/$/, "");

    // Enforce HTTPS
    if (url.protocol === "http:") {
      return new Response(null, {
        status: 301,
        headers: { Location: url.toString().replace("http://", "https://") }
      });
    }

    // OPTIONS preflight
    if (request.method === "OPTIONS") {
      return handleCORSPreflight(origin);
    }

    if (path.startsWith("/api/")) {
      const response = await forwardToGAS(request, url);
      return addCORSHeaders(response, origin);
    }

    const notFound = new Response(
      JSON.stringify({
        error: "Route not found",
        message: "Only /api/* routes are supported"
      }),
      { status: 404, headers: { "Content-Type": "application/json" } }
    );

    return addCORSHeaders(notFound, origin);
  }
};

// ============================================================================
// CORS PREFLIGHT
// ============================================================================

function handleCORSPreflight(origin) {
  const headers = {
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS, PUT, DELETE",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
    "Access-Control-Max-Age": "86400"
  };

  headers["Access-Control-Allow-Origin"] = isOriginAllowed(origin)
    ? origin
    : "null";

  return new Response(null, { status: 204, headers });
}

// ============================================================================
// FORWARD TO GOOGLE APPS SCRIPT
// ============================================================================

async function forwardToGAS(request, url) {
  const gasURL = new URL(GAS_URL);

  for (const [key, value] of url.searchParams.entries()) {
    gasURL.searchParams.append(key, value);
  }

  const options = {
    method: request.method,
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "Cloudflare-Worker"
    }
  };

  const authHeader = request.headers.get("Authorization");
  if (authHeader) options.headers.Authorization = authHeader;

  if (request.method !== "GET" && request.method !== "HEAD") {
    const body = await request.text();
    if (body) options.body = body;
  }

  const response = await fetch(gasURL.toString(), options);
  const text = await response.text();

  let finalBody = text;
  try {
    finalBody = JSON.stringify(JSON.parse(text));
  } catch {}

  const headers = new Headers(response.headers);
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  return new Response(finalBody, {
    status: response.status,
    headers
  });
}

// ============================================================================
// CORS + SECURITY HEADERS (UPDATED CSP)
// ============================================================================

function addCORSHeaders(response, origin) {
  const headers = new Headers(response.headers);

  headers.set(
    "Access-Control-Allow-Origin",
    isOriginAllowed(origin) ? origin : "null"
  );
  headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE");
  headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With"
  );
  headers.set("Access-Control-Max-Age", "86400");

  // 🔥 UPDATED CSP — GOOGLE OAUTH SAFE
  headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://accounts.google.com https://apis.google.com https://www.gstatic.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "frame-src https://accounts.google.com",
      "connect-src 'self' https://accounts.google.com https://oauth2.googleapis.com"
    ].join("; ")
  );

  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("X-Frame-Options", "DENY");
  headers.set("X-XSS-Protection", "1; mode=block");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

// ============================================================================
// ORIGIN CHECK
// ============================================================================

function isOriginAllowed(origin) {
  if (!origin) return false;
  return ALLOWED_ORIGINS.includes(origin);
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

    switch (action) {
      case 'register':
        return registerUserApi(body);

      case 'login':
        return loginUserApi(body);

      case 'googleLogin':
        return googleLoginApi(body);

      case 'verifyToken':
        return verifyTokenApi(body);

      default:
        return json({ error: 'Invalid action' }, 400);
    }
  } catch (err) {
    console.error(err);
    return json({ error: 'Server error' }, 500);
  }
}

/* ================================
   AUTH CORE
================================ */

function registerUserApi(body) {
  const full_name = clean(body.name);
  const email = clean(body.email);
  const password = body.password;

  if (!full_name || !email || !password) {
    return json({ error: 'Missing fields' }, 400);
  }

  if (!isValidEmail(email)) {
    return json({ error: 'Invalid email' }, 400);
  }

  if (findUserByEmail(email)) {
    return json({ error: 'Email already registered' }, 400);
  }

  const user_id = uid('USER');
  const now = new Date();

  appendRow('Users', {
    user_id,
    email,
    password_hash: hash(password),
    auth_provider: 'local',
    full_name,
    created_at: now,
    updated_at: now,
    status: 'active',
    google_auth_id: '',
    last_login: now
  });

  logAction(user_id, 'register');

  const token = issueToken(user_id);
  const user = getUserByIdInternal(user_id);
  delete user.password_hash;

  return json({ token, user });
}

function loginUserApi(body) {
  const email = clean(body.email);
  const password = body.password || '';

  const user = findUserByEmail(email);
  if (!user || user.auth_provider !== 'local') {
    return json({ error: 'Invalid credentials' }, 401);
  }

  if (user.password_hash !== hash(password)) {
    return json({ error: 'Invalid credentials' }, 401);
  }

  updateUser(user.user_id, { last_login: new Date() });
  logAction(user.user_id, 'login');

  const token = issueToken(user.user_id);
  delete user.password_hash;

  return json({ token, user });
}

function googleLoginApi(body) {
  const idToken = body.idToken;
  if (!idToken) {
    return json({ error: 'Missing Google token' }, 400);
  }

  const info = verifyGoogleIdToken(idToken);
  if (!info) {
    return json({ error: 'Invalid Google token' }, 401);
  }

  let user = findUserByGoogleId(info.sub) || findUserByEmail(info.email);
  const now = new Date();

  if (!user) {
    const user_id = uid('USER');

    appendRow('Users', {
      user_id,
      email: info.email,
      password_hash: '',
      auth_provider: 'google',
      full_name: info.name || info.email,
      created_at: now,
      updated_at: now,
      status: 'active',
      google_auth_id: info.sub,
      last_login: now
    });

    logAction(user_id, 'google_register');
    user = getUserByIdInternal(user_id);
  } else {
    if (!user.google_auth_id) {
      updateUser(user.user_id, { google_auth_id: info.sub });
    }

    updateUser(user.user_id, { last_login: now });
    logAction(user.user_id, 'google_login');
  }

  const token = issueToken(user.user_id);
  delete user.password_hash;

  return json({ token, user });
}

function verifyTokenApi(body) {
  if (!body.token) {
    return json({ error: 'Missing token' }, 400);
  }

  const user_id = validateToken(body.token);
  if (!user_id) {
    return json({ error: 'Invalid token' }, 401);
  }

  return json({ valid: true, user_id });
}

/* ================================
   TOKEN SYSTEM
================================ */

function issueToken(user_id) {
  const token = Utilities.getUuid();
  const token_hash = hash(token);
  const now = new Date();

  appendRow('AuthTokens', {
    token_id: uid('TOKEN'),
    user_id,
    token_hash,
    created_at: now,
    expires_at: new Date(now.getTime() + 86400000),
    token_type: 'session'
  });

  return token;
}

function validateToken(token) {
  const token_hash = hash(token);
  const tokens = readSheet('AuthTokens');

  const row = tokens.find(t => t.token_hash === token_hash);
  if (!row) return null;
  if (new Date(row.expires_at) < new Date()) return null;

  return row.user_id;
}

/* ================================
   USER HELPERS
================================ */

function findUserByEmail(email) {
  return readSheet('Users').find(
    u => u.email && u.email.toLowerCase() === email.toLowerCase()
  ) || null;
}

function findUserByGoogleId(id) {
  return readSheet('Users').find(u => u.google_auth_id === id) || null;
}

function getUserByIdInternal(user_id) {
  return readSheet('Users').find(u => u.user_id === user_id) || null;
}

function updateUser(user_id, updates) {
  const sh = SPREADSHEET.getSheetByName('Users');
  const data = sh.getDataRange().getValues();
  const headers = data[0];

  const rowIndex = data.findIndex(
    r => r[headers.indexOf('user_id')] === user_id
  );

  if (rowIndex === -1) return;

  Object.keys(updates).forEach(key => {
    const col = headers.indexOf(key);
    if (col !== -1) {
      sh.getRange(rowIndex + 1, col + 1).setValue(updates[key]);
    }
  });

  sh.getRange(rowIndex + 1, headers.indexOf('updated_at') + 1)
    .setValue(new Date());
}

function logAction(user_id, action) {
  appendRow('Logs', {
    log_id: uid('LOG'),
    user_id,
    action,
    timestamp: new Date(),
    ip_address: '',
    details: ''
  });
}

/* ================================
   UTILITIES
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
  sh.appendRow(headers.map(h => obj[h] ?? ''));
}

function verifyGoogleIdToken(token) {
  const GOOGLE_CLIENT_ID =
    "709120008855-p9m39a4h5i728l0kltuhk9r2dme7t192.apps.googleusercontent.com"; // <-- REQUIRED

  try {
    const res = UrlFetchApp.fetch(
      "https://oauth2.googleapis.com/tokeninfo?id_token=" + encodeURIComponent(token),
      { muteHttpExceptions: true }
    );

    if (res.getResponseCode() !== 200) return null;

    const data = JSON.parse(res.getContentText());

    // ✅ REQUIRED VALIDATIONS
    if (!data.email || !data.sub) return null;
    if (data.aud !== GOOGLE_CLIENT_ID) return null;

    return data;
  } catch (e) {
    console.error("Google token verification failed:", e);
    return null;
  }
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
    str || ''
  )
    .map(b => ('0' + (b < 0 ? b + 256 : b).toString(16)).slice(-2))
    .join('');
}

function uid(prefix) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

function isValidEmail(e) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

function clean(s) {
  return typeof s === 'string' ? s.trim() : '';
}
