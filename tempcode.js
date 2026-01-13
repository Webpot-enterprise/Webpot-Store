/**
 * Webpot API - Cloudflare Worker
 * Proxy layer for Google Apps Script backend
 * 
 * Maps frontend requests to https://api.webpot.shop
 * Forwards to Google Apps Script (code.gs)
 * Handles CORS, request routing, and response formatting
 * 
 * CORS Configuration: Set RESTRICT_CORS to true to limit to specific origins
 * GAS Backend URL: Retrieved from environment variable GAS_API_URL
 */

// ============================================
// CONFIGURATION
// ============================================

// Get GAS backend URL from environment variable or fallback to default
const getGasUrl = (env) => {
  return env?.GAS_API_URL || 'https://script.google.com/macros/s/AKfycbxRdCTFMS36AYDA9znHx9gKrEEJKVHEyxL9ub85QtafCzzQvr6-llHaMwCuegB0Rkxr/exec';
};

// Set to true to restrict CORS to specific origins
const RESTRICT_CORS = false;

// Allowed origins when RESTRICT_CORS is true
const ALLOWED_ORIGINS = [
  'https://webpot.shop',
  'https://www.webpot.shop',
  'https://dashboard.webpot.shop',
  'http://localhost:3000',    // Development
  'http://localhost:8000',    // Development
  'http://localhost:8787'     // Wrangler dev
];

// Set to false in production to hide debug info
const ENABLE_DEBUG = true;

export default {
  async fetch(request, env, ctx) {
    const GOOGLE_APPS_SCRIPT_URL = getGasUrl(env);

    try {
      // Handle CORS preflight
      if (request.method === 'OPTIONS') {
        return new Response(null, {
          headers: getCorsHeaders(request),
        });
      }

      // Parse request
      let action = null;
      let params = {};

      // Handle GET requests (action in query params)
      if (request.method === 'GET') {
        const url = new URL(request.url);
        action = url.searchParams.get('action');
        
        // Extract all query parameters except 'action'
        for (const [key, value] of url.searchParams.entries()) {
          if (key !== 'action') {
            params[key] = value;
          }
        }
      }

      // Handle POST requests (action in body)
      if (request.method === 'POST') {
        const contentType = request.headers.get('Content-Type') || '';
        
        if (contentType.includes('application/json')) {
          const body = await request.json();
          action = body.action;
          params = body.data || body;
        } else if (contentType.includes('application/x-www-form-urlencoded')) {
          const formData = await request.formData();
          action = formData.get('action');
          
          for (const [key, value] of formData.entries()) {
            if (key !== 'action') {
              params[key] = value;
            }
          }
        }
      }

      if (!action) {
        return jsonResponse({ 
          success: false, 
          status: 'error',
          message: 'Action parameter is required' 
        }, 400, request);
      }

      // Handle built-in test endpoint
      if (action === 'test') {
        console.log('[WEBPOT-API] Test endpoint called');
        return jsonResponse({
          success: true,
          status: 'success',
          message: 'Cloudflare Worker is operational',
          data: {
            timestamp: new Date().toISOString(),
            worker: 'webpot-api',
            backend: GOOGLE_APPS_SCRIPT_URL,
            received_action: action,
            received_params: params,
            environment: 'production'
          }
        }, 200, request);
      }

      // Log the request
      console.log(`[WEBPOT-API] ${request.method} action=${action}`, params);

      // Build request to Google Apps Script
      const gasUrl = new URL(GOOGLE_APPS_SCRIPT_URL);
      
      // Add action and all parameters
      gasUrl.searchParams.append('action', action);
      for (const [key, value] of Object.entries(params)) {
        gasUrl.searchParams.append(key, value);
      }

      console.log(`[WEBPOT-API] Forwarding to backend: ${gasUrl.toString()}`);

      // Forward to Google Apps Script with redirect following
      const gasResponse = await fetch(gasUrl.toString(), {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        redirect: 'follow'  // Follow redirects
      });

      console.log(`[WEBPOT-API] Backend responded with status: ${gasResponse.status}`);

      // Get response as TEXT FIRST (not JSON) to handle HTML errors
      let responseText;
      try {
        responseText = await gasResponse.text();
      } catch (e) {
        console.error('[WEBPOT-API] Failed to read response body:', e);
        return jsonResponse({ 
          success: false, 
          status: 'error',
          message: 'Failed to read backend response',
          ...(ENABLE_DEBUG && { debug: {
            error: e.message,
            gasStatus: gasResponse.status
          }})
        }, 502, request);
      }

      // Try to parse as JSON
      let responseData;
      try {
        responseData = JSON.parse(responseText);
        console.log(`[WEBPOT-API] Successfully parsed JSON response`);
      } catch (parseError) {
        console.error('[WEBPOT-API] JSON parse error:', parseError.message);
        console.error('[WEBPOT-API] Raw response (first 1000 chars):', responseText.substring(0, 1000));

        // Backend returned non-JSON (likely HTML error page)
        return jsonResponse({ 
          success: false, 
          status: 'error',
          message: 'Backend returned invalid JSON response',
          ...(ENABLE_DEBUG && { debug: {
            parseError: parseError.message,
            gasStatus: gasResponse.status,
            gasStatusText: gasResponse.statusText,
            rawResponsePreview: responseText.substring(0, 500),
            contentType: gasResponse.headers.get('Content-Type'),
            note: 'Check the rawResponsePreview to see what the backend actually returned'
          }})
        }, 502, request);
      }

      // Ensure response has required fields
      if (!responseData.success && !responseData.status) {
        responseData.success = responseData.status === 'success';
      }

      console.log(`[WEBPOT-API] Returning response: ${responseData.success ? 'success' : 'error'}`);

      // Return response with CORS headers
      return jsonResponse(responseData, 200, request);

    } catch (error) {
      console.error('[WEBPOT-API] Error:', error.message, error.stack);
      
      return jsonResponse({ 
        success: false, 
        status: 'error',
        message: 'Internal server error',
        ...(ENABLE_DEBUG && { debug: {
          error: error.message,
          type: error.name,
          stack: error.stack
        }})
      }, 500, request);
    }
  }
};

/**
 * Helper function to determine CORS headers based on origin
 */
function getCorsHeaders(request) {
  const origin = request.headers.get('Origin') || '';
  
  // If CORS restriction is disabled, allow all origins
  if (!RESTRICT_CORS) {
    return {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    };
  }
  
  // If CORS restriction is enabled, check against whitelist
  const isAllowed = ALLOWED_ORIGINS.includes(origin);
  const allowOrigin = isAllowed ? origin : ALLOWED_ORIGINS[0]; // Default to first allowed origin
  
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };
}

/**
 * Helper function to return JSON response with CORS headers
 */
function jsonResponse(data, status = 200, request = null) {
  const corsHeaders = request ? getCorsHeaders(request) : {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };

  return new Response(JSON.stringify(data), {
    status: status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
    },
  });
}