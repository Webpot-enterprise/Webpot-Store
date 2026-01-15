// ============================================================================
// CLOUDFLARE WORKER - API GATEWAY
// ============================================================================
// Purpose: Handle CORS, preflight requests, and forward to Google Apps Script
// Origin: Frontend (GitHub Pages) → Cloudflare Worker → Google Apps Script
//
// DEPLOYMENT INSTRUCTIONS:
// 1. Go to Cloudflare Dashboard → Workers
// 2. Click "Create a Service" and name it "api-gateway"
// 3. Replace ALL code with this file
// 4. Click "Save and Deploy"
// 5. Go to "Triggers" and add route: api.yourdomain.com/api/*
// 6. Update ALLOWED_ORIGINS and GAS_URL below with your values
//
// CRITICAL: Replace GAS_URL with your actual Google Apps Script URL
// ============================================================================

// ============================================================================
// CONFIGURATION - REQUIRED TO UPDATE
// ============================================================================

// Replace this with your actual Google Apps Script Web App URL
// Example: https://script.google.com/macros/s/AKfycbwyb7w0ZFQpGdcCbrm1KfhYyI_0Bsws1CycGT8otylvQlV-tOf1A6vJLVUum37L5vX6/exec
const GAS_URL = "https://script.google.com/macros/s/YOUR_GAS_ID_HERE/exec";

// Allowed origins for CORS (strict exact-match only)
// Do NOT use wildcard patterns or localhost origins in production (Section 11: Security)
const ALLOWED_ORIGINS = [
  "https://yourusername.github.io",        // Replace with your GitHub Pages URL
  "https://yourdomain.com",                 // Replace with your custom domain
  "https://www.yourdomain.com"              // Include www variant if needed
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
    // ENFORCE HTTPS (SECTION 11.5: HTTPS Everywhere)
    // ========================================================================
    if (url.protocol === "http:") {
      return new Response(
        JSON.stringify({ error: "HTTPS required" }),
        {
          status: 301,
          headers: {
            "Location": url.toString().replace("http://", "https://")
          }
        }
      );
    }

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
// FORWARD REQUEST TO GOOGLE APPS SCRIPT (Section 8: GitHub Pages)
// ============================================================================
// Preserves method, query parameters, headers, and request body

async function forwardToGAS(request, url, path) {
  try {
    // Section 11.7: Log request details for monitoring
    const clientIP = request.headers.get("CF-Connecting-IP") || "unknown";
    const method = request.method;
    const timestamp = new Date().toISOString();
    
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

    // Section 11.7: Log successful request
    console.log({
      timestamp,
      clientIP,
      method,
      path,
      statusCode: response.status,
      type: "API_REQUEST"
    });

    return new Response(finalBody, {
      status: response.status,
      headers: {
        "Content-Type": "application/json",
        ...Object.fromEntries(response.headers.entries())
      }
    });

  } catch (error) {
    // Section 11.2: Do NOT expose GAS_URL in error messages
    console.error("Error forwarding to GAS:", error);
    return new Response(
      JSON.stringify({
        error: "Gateway Error",
        message: "Please try again later"
        // Do NOT include: GAS URL, internal details, or stack traces
      }),
      {
        status: 502, // Bad Gateway
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}

// ============================================================================
// CORS HEADERS HELPER (Section 11.2, 11.3, 11.6)
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
  
  // Section 11.6: Security Headers
  headers.set("Content-Security-Policy", "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:;");
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("X-Frame-Options", "DENY");
  headers.set("X-XSS-Protection", "1; mode=block");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: headers
  });
}

// ============================================================================
// ORIGIN VALIDATION (Section 11: Security)
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
// No sensitive information is exposed in error responses

// Production endpoints:
// GET /api/orders?action=getOrders
// POST /api/orders?action=createOrder
// GET /api/users?action=getUsers
// POST /api/users?action=createUser
// GET /api/logs?action=getLogs
// And more...
