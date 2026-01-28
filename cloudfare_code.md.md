/* ================================
   CLOUDFLARE WORKER - API PROXY
   
   ✅ OTP-BASED LOGIN SUPPORT
   
   UPDATES (Jan 28, 2026):
   - Added verifyOtp & resendOtp to rate-limited auth actions
   - Rate limiting: 10 auth requests per 60 seconds per IP
   - Applies to: login, register, googleLogin, verifyOtp, resendOtp
   - See: OTP_IMPLEMENTATION.md for full auth flow
================================ */

const GAS_URL =
  "https://script.google.com/macros/s/AKfycbxb5XesTNnxNySyUVuDBU6Vjyk2PBDia5pbyULneRBVYnGExxisZY7zXFBJ48nDekwe/exec";

const ALLOWED_ORIGINS = [
  "https://webpot.shop",
  "https://www.webpot.shop",
  "https://yourusername.github.io"
];

/* ===============================
   AUTH RATE LIMITING (IP-BASED)
================================ */

const AUTH_RATE_LIMIT = {
  windowMs: 60 * 1000, // 60 seconds
  maxRequests: 10
};

// In-memory store (Cloudflare Worker scope)
const authRequestMap = new Map();

function isAuthAction(action) {
  return ["login", "register", "googleLogin", "verifyOtp", "resendOtp"].includes(action);
}

function checkRateLimit(ip, action) {
  const key = `${ip}:${action}`;
  const now = Date.now();

  const entry = authRequestMap.get(key);

  if (!entry) {
    authRequestMap.set(key, { count: 1, firstSeen: now });
    return { allowed: true };
  }

  // Reset time window
  if (now - entry.firstSeen > AUTH_RATE_LIMIT.windowMs) {
    authRequestMap.set(key, { count: 1, firstSeen: now });
    return { allowed: true };
  }

  entry.count++;

  if (entry.count > AUTH_RATE_LIMIT.maxRequests) {
    return {
      allowed: false,
      retryAfter: Math.ceil(
        (AUTH_RATE_LIMIT.windowMs - (now - entry.firstSeen)) / 1000
      )
    };
  }

  return { allowed: true };
}

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin");
    const ip = request.headers.get("CF-Connecting-IP") || "unknown";
    const action = url.searchParams.get("action");

    // 🔹 Preflight
    if (request.method === "OPTIONS") {
      return corsPreflight(origin);
    }

    // 🔹 Only allow API routes
    if (!url.pathname.startsWith("/api/")) {
      return cors(
        new Response(JSON.stringify({ error: "Not Found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" }
        }),
        origin
      );
    }

    // 🔐 Rate limit auth-related actions ONLY
    if (isAuthAction(action)) {
      const rateCheck = checkRateLimit(ip, action);

      if (!rateCheck.allowed) {
        return cors(
          new Response(
            JSON.stringify({
              error: "Too many attempts. Please try again shortly."
            }),
            {
              status: 429,
              headers: {
                "Content-Type": "application/json",
                "Retry-After": rateCheck.retryAfter
              }
            }
          ),
          origin
        );
      }
    }

    // 🔹 Forward request to GAS
    const gasURL = new URL(GAS_URL);
    url.searchParams.forEach((v, k) => gasURL.searchParams.append(k, v));

    // 🔐 Metadata forwarding
    const ua = request.headers.get("User-Agent") || "";

    gasURL.searchParams.append("ip", ip);
    gasURL.searchParams.append("ua", ua);

    const options = {
      method: request.method,
      headers: {
        "Content-Type": "application/json",
        ...(request.headers.get("Authorization")
          ? { Authorization: request.headers.get("Authorization") }
          : {})
      }
    };

    if (request.method !== "GET" && request.method !== "HEAD") {
      options.body = await request.text();
    }

    const res = await fetch(gasURL.toString(), options);
    return cors(res, origin);
  }
};

/* ===============================
   CORS HELPERS
================================ */

function corsPreflight(origin) {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(origin)
  });
}

function cors(response, origin) {
  const headers = new Headers(response.headers);
  Object.entries(corsHeaders(origin)).forEach(([k, v]) =>
    headers.set(k, v)
  );

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

function corsHeaders(origin) {
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGINS.includes(origin)
      ? origin
      : "null",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",

    // 🔒 CSP
    "Content-Security-Policy":
      "default-src 'self'; " +
      "script-src 'self' https://accounts.google.com https://apis.google.com https://www.gstatic.com; " +
      "frame-src https://accounts.google.com;"
  };
}