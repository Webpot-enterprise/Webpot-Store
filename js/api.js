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
  
  // Whether to log all requests (set to false in production) - SECTION 11.4
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