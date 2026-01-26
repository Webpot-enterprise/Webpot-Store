// ============================================================================
// API HELPER FUNCTIONS
// ============================================================================
// This file defines the apiCall() function which uses API_CONFIG from config.js
// Ensures consistency across the entire frontend

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

  // ========================================================================
  // STRICT VALIDATION: action must be a string (if provided)
  // ========================================================================
  if (action !== null && typeof action !== 'string') {
    const errorMsg = `[API] Invalid action parameter. Expected string, got ${typeof action}: ${String(action)}`;
    console.error(errorMsg);
    return {
      success: false,
      error: "Invalid Request",
      message: "Action must be a string value"
    };
  }

  // Reject empty string actions
  if (action && typeof action === 'string' && action.trim() === '') {
    const errorMsg = '[API] Invalid action parameter: empty string is not allowed';
    console.error(errorMsg);
    return {
      success: false,
      error: "Invalid Request",
      message: "Action cannot be an empty string"
    };
  }

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

  // Add Authorization header if user is authenticated
  const token = getAuthToken();
  if (token) {
    defaultHeaders["Authorization"] = `Bearer ${token}`;
  }

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

    // Handle unauthorized responses
    if (response.status === 401) {
      // Clear auth token and redirect to login
      clearAuthToken();
      clearUserData();
      window.location.href = '/auth.html';
      return {
        success: false,
        error: "Unauthorized",
        message: "Your session has expired. Please log in again."
      };
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
// AUTHENTICATION ENDPOINTS
// ============================================================================

// User login with email and password
async function loginUser(email, password) {
  const result = await apiCall("/auth/login", {
    method: "POST",
    action: "login",
    body: {
      email: email.trim(),
      password: password
    }
  });

  if (result.success && result.data?.token) {
    // Store auth token
    localStorage.setItem(API_CONFIG.AUTH_TOKEN_KEY, result.data.token);
    
    // Store token expiry (24 hours from now)
    const expiryTime = Date.now() + (24 * 60 * 60 * 1000);
    if (typeof setTokenExpiry === 'function') {
      setTokenExpiry(expiryTime);
    }
    
    // Store user data if available
    if (result.data.user) {
      localStorage.setItem(API_CONFIG.USER_DATA_KEY, JSON.stringify(result.data.user));
    }
  }

  return result;
}

// User registration with name, email, and password
async function registerUser(name, email, password) {
  const result = await apiCall("/auth/register", {
    method: "POST",
    action: "register",
    body: {
      name: name.trim(),
      email: email.trim(),
      password: password
    }
  });

  if (result.success && result.data?.token) {
    // Store auth token
    localStorage.setItem(API_CONFIG.AUTH_TOKEN_KEY, result.data.token);
    
    // Store token expiry (24 hours from now)
    const expiryTime = Date.now() + (24 * 60 * 60 * 1000);
    if (typeof setTokenExpiry === 'function') {
      setTokenExpiry(expiryTime);
    }
    
    // Store user data if available
    if (result.data.user) {
      localStorage.setItem(API_CONFIG.USER_DATA_KEY, JSON.stringify(result.data.user));
    }
  }

  return result;
}

// Google OAuth login
async function googleLogin(credential) {
  const result = await apiCall("/auth/google", {
    method: "POST",
    action: "googleLogin",
    body: {
      credential: credential
    }
  });

  if (result.success && result.data?.token) {
    // Store auth token
    localStorage.setItem(API_CONFIG.AUTH_TOKEN_KEY, result.data.token);
    
    // Store token expiry (24 hours from now)
    const expiryTime = Date.now() + (24 * 60 * 60 * 1000);
    if (typeof setTokenExpiry === 'function') {
      setTokenExpiry(expiryTime);
    }
    
    // Store user data if available
    if (result.data.user) {
      localStorage.setItem(API_CONFIG.USER_DATA_KEY, JSON.stringify(result.data.user));
    }
  }

  return result;
}

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

// Submit contact form
async function submitContact(contactData) {
  return apiCall("/contacts", {
    method: "POST",
    action: "submitContact",
    body: contactData
  });
}

// Get all contacts (admin only)
async function getContacts() {
  return apiCall("/contacts", {
    method: "GET",
    action: "getContacts"
  });
}