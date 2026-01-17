// ============================================================================
// GOOGLE APPS SCRIPT - PRODUCTION WEB API
// ============================================================================
// Purpose: Backend API for Webpot application
// Reads/writes to Google Sheets database
// Handles all business logic and authentication
//
// DEPLOYMENT INSTRUCTIONS:
// 1. Go to https://script.google.com
// 2. Create new project and name it "Production-Web-API"
// 3. Replace ALL code in the editor with this file
// 4. Click Deploy → New Deployment → Web app
// 5. Execute as: Your Google Account
// 6. Who has access: Anyone (CRITICAL!)
// 7. Click Deploy and save the URL
//
// CRITICAL: Replace SHEET_ID with your actual Google Sheet ID
// ============================================================================

// ============================================================================
// CONFIGURATION - REQUIRED
// ============================================================================

// Production Sheet ID: Replace with your actual Sheet ID from Google Sheets URL
// Sheet URL: https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/edit
// Extract the long string between /d/ and /edit
const SHEET_ID = "1CbFocUID9WLRrX34Xx093qxGC7V5CpZWRIU4H5NRTnM7pDBpLcZboPX2";

// Open the Google Sheet
const SHEET = SpreadsheetApp.openById(SHEET_ID);

// ============================================================================
// MAIN HTTP HANDLERS (DO NOT MODIFY)
// ============================================================================
// These functions are called by Google Apps Script when HTTP requests arrive

function doGet(e) {
  return handleRequest(e, 'GET');
}

function doPost(e) {
  return handleRequest(e, 'POST');
}

// ============================================================================
// MAIN REQUEST ROUTER (Section 8: GitHub Pages)
// ============================================================================

function handleRequest(e, method) {
  try {
    // Get the action parameter from query string
    const action = e.parameter.action || e.parameter['action'];
    
    // Log the request (Section 11.7: Logging)
    try {
      logAction(null, action, "API Request", e.source.getActiveUser().getEmail(), e.source);
    } catch (logError) {
      // Silently ignore logging errors
    }
    
    // Route requests based on action parameter
    switch(action) {
      // =====================================================================
      // AUTHENTICATION
      // =====================================================================
      case 'login':
        return loginUserApi(safeParseJSON(e.postData));
      case 'register':
        return registerUserApi(safeParseJSON(e.postData));
      case 'googleLogin':
        return googleLoginApi(safeParseJSON(e.postData));
      case 'verifyToken':
        return verifyTokenApi(safeParseJSON(e.postData));
      
      case 'getAuthTokens':
        return getAuthTokens();
      
      // =====================================================================
      // USER MANAGEMENT
      // =====================================================================
      case 'getUsers':
        return getUsers();
      
      case 'getUserById':
        return getUserById(e.parameter.id);
      
      case 'createUser':
        return createUser(safeParseJSON(e.postData));
      
      case 'updateUser':
        return updateUser(e.parameter.id, safeParseJSON(e.postData));
      
      // =====================================================================
      // ORDERS (Protected - requires authentication)
      // =====================================================================
      case 'getOrders':
        const authUserOrders = validateTokenFromRequest(e);
        if (!authUserOrders) return returnJSON({ error: 'Unauthorized' }, 401);
        return getOrders();
      
      case 'getOrderById':
        const authUserOrderById = validateTokenFromRequest(e);
        if (!authUserOrderById) return returnJSON({ error: 'Unauthorized' }, 401);
        return getOrderById(e.parameter.id);
      
      case 'createOrder':
        const authUserCreateOrder = validateTokenFromRequest(e);
        if (!authUserCreateOrder) return returnJSON({ error: 'Unauthorized' }, 401);
        return createOrder(safeParseJSON(e.postData), authUserCreateOrder);
      
      case 'updateOrder':
        const authUserUpdateOrder = validateTokenFromRequest(e);
        if (!authUserUpdateOrder) return returnJSON({ error: 'Unauthorized' }, 401);
        return updateOrder(e.parameter.id, safeParseJSON(e.postData), authUserUpdateOrder);
      
      // =====================================================================
      // SESSIONS
      // =====================================================================
      case 'getSessions':
        return getSessions();
      
      case 'createSession':
        return createSession(safeParseJSON(e.postData));
      
      // =====================================================================
      // LOGS
      // =====================================================================
      case 'getLogs':
        return getLogs();
      
      // =====================================================================
      // TESTIMONIALS
      // =====================================================================
      case 'getTestimonials':
        return getTestimonials();
      
      case 'submitTestimonial':
        return submitTestimonial(safeParseJSON(e.postData));
      
      // =====================================================================
      // CONTACTS (Protected - requires authentication)
      // =====================================================================
      case 'submitContact':
        const authUserContact = validateTokenFromRequest(e);
        if (!authUserContact) return returnJSON({ error: 'Unauthorized' }, 401);
        return submitContactApi(safeParseJSON(e.postData), authUserContact);
      
      case 'getContacts':
        const authUserGetContacts = validateTokenFromRequest(e);
        if (!authUserGetContacts) return returnJSON({ error: 'Unauthorized' }, 401);
        return getContacts();
      
      // =====================================================================
      // DEFAULT
      // =====================================================================
      case 'test':
        return returnJSON({ message: 'Google Apps Script is working!', timestamp: new Date() });
      
      default:
        if (!action) {
          return returnJSON({ error: 'Missing action parameter' }, 400);
        }
        return returnJSON({ error: `Unknown action: ${action}` }, 400);
    }
    
  } catch (error) {
    // Return error response (Section 11.2: Don't expose internals)
    console.error('Request handling error:', error);
    return returnJSON({ 
      error: 'Server Error',
      message: 'An error occurred processing your request'
    }, 500);
  }
}

// ============================================================================
// USER FUNCTIONS
// ============================================================================

function getUsers() {
  const sheet = SHEET.getSheetByName('Users');
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const rows = data.slice(1);
  
  const users = rows.map(row => {
    const obj = {};
    headers.forEach((header, index) => {
      obj[header] = row[index];
    });
    return obj;
  });
  
  return returnJSON({ users: users, count: users.length });
}

function getUserById(userId) {
  const sheet = SHEET.getSheetByName('Users');
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const userId_index = headers.indexOf('user_id');
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][userId_index] == userId) {
      const obj = {};
      headers.forEach((header, index) => {
        obj[header] = data[i][index];
      });
      return returnJSON({ user: obj });
    }
  }
  
  return returnJSON({ error: 'User not found' }, 404);
}

// ============================================================================
// AUTHENTICATION FUNCTIONS
// ============================================================================

// Helper: Get sheet and headers
function getSheetAndHeaders(sheetName) {
  const sheet = SHEET.getSheetByName(sheetName);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  return { sheet, headers };
}

// Helper: Extract and validate token from Authorization header
function validateTokenFromRequest(e) {
  try {
    // Get Authorization header from e.headers
    const authHeader = e.headers['Authorization'] || '';
    if (!authHeader.startsWith('Bearer ')) {
      return null;
    }
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const userId = validateToken(token);
    return userId ? userId : null;
  } catch (err) {
    return null;
  }
}

// Helper: Hash password (SHA-256)
function hashPassword(password) {
  const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, password);
  return bytes.map(function(b) {
    let s = (b < 0 ? b + 256 : b).toString(16);
    return s.length === 1 ? '0' + s : s;
  }).join('');
}

// Helper: Generate token
function generateToken() {
  return Utilities.getUuid() + '-' + Math.floor(Math.random() * 1e8);
}

// Helper: Token expiry (1 day)
function getTokenExpiry() {
  return new Date(Date.now() + 24 * 60 * 60 * 1000);
}

// Helper: Find user by email
function findUserByEmail(email) {
  const { sheet, headers } = getSheetAndHeaders('Users');
    const data = sheet.getDataRange().getValues();
    const emailIdx = headers.indexOf('email');
    for (let i = 1; i < data.length; i++) {
      if ((data[i][emailIdx] || '').toLowerCase() === email.toLowerCase()) {
        const obj = {};
        headers.forEach((header, idx) => { obj[header] = data[i][idx]; });
        obj._row = i + 1;
        return obj;
      }
    }
    return null;
  }

  // Helper: Find user by Google ID
  function findUserByGoogleId(googleId) {
    const { sheet, headers } = getSheetAndHeaders('Users');
    const data = sheet.getDataRange().getValues();
    const googleIdx = headers.indexOf('google_id');
    for (let i = 1; i < data.length; i++) {
      if (data[i][googleIdx] && data[i][googleIdx] === googleId) {
        const obj = {};
        headers.forEach((header, idx) => { obj[header] = data[i][idx]; });
        obj._row = i + 1;
        return obj;
      }
    }
    return null;
  }

  // Helper: Save auth token
  function saveAuthToken(token, userId, expiresAt) {
    const { sheet, headers } = getSheetAndHeaders('AuthTokens');
    const newRow = headers.map(h => {
      if (h === 'token') return token;
      if (h === 'user_id') return userId;
      if (h === 'expires_at') return expiresAt;
      if (h === 'created_at') return new Date();
      return '';
    });
    sheet.appendRow(newRow);
  }

  // Helper: Validate token
  function validateToken(token) {
    const { sheet, headers } = getSheetAndHeaders('AuthTokens');
    const data = sheet.getDataRange().getValues();
    const tokenIdx = headers.indexOf('token');
    const expiresIdx = headers.indexOf('expires_at');
    const userIdIdx = headers.indexOf('user_id');
    for (let i = 1; i < data.length; i++) {
      if (data[i][tokenIdx] === token) {
        const expires = new Date(data[i][expiresIdx]);
        if (expires < new Date()) return null;
        return data[i][userIdIdx];
      }
    }
    return null;
  }

  // API: Register user (email/password)
  function registerUserApi(body) {
    if (!body.name || !body.email || !body.password) {
      return returnJSON({ error: 'Missing required fields' }, 400);
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
      return returnJSON({ error: 'Invalid email format' }, 400);
    }
    if (findUserByEmail(body.email)) {
      return returnJSON({ error: 'Email already registered' }, 400);
    }
    const userId = 'USER-' + Date.now();
    const passwordHash = hashPassword(body.password);
    const { sheet, headers } = getSheetAndHeaders('Users');
    const newUser = {
      user_id: userId,
      name: body.name,
      email: body.email,
      password_hash: passwordHash,
      auth_provider: 'local',
      google_id: ''
    };
    const newRow = headers.map(h => newUser[h] || '');
    sheet.appendRow(newRow);
    // Generate token
    const token = generateToken();
    const expires = getTokenExpiry();
    saveAuthToken(token, userId, expires);
    delete newUser.password_hash;
    return returnJSON({ token: token, user: newUser });
  }

  // API: Login user (email/password)
  function loginUserApi(body) {
    if (!body.email || !body.password) {
      return returnJSON({ error: 'Missing email or password' }, 400);
    }
    const user = findUserByEmail(body.email);
    if (!user || user.auth_provider !== 'local') {
      return returnJSON({ error: 'Invalid credentials' }, 401);
    }
    if (user.password_hash !== hashPassword(body.password)) {
      return returnJSON({ error: 'Invalid credentials' }, 401);
    }
    // Generate token
    const token = generateToken();
    const expires = getTokenExpiry();
    saveAuthToken(token, user.user_id, expires);
    delete user.password_hash;
    return returnJSON({ token: token, user: user });
  }

  // API: Google OAuth login
  function googleLoginApi(body) {
    if (!body.idToken) {
      return returnJSON({ error: 'Missing Google ID token' }, 400);
    }
    // Verify Google ID token
    const tokenInfo = verifyGoogleIdToken(body.idToken);
    if (!tokenInfo) {
      return returnJSON({ error: 'Invalid Google ID token' }, 401);
    }
    let user = findUserByGoogleId(tokenInfo.sub);
    if (!user) {
      // Auto-create user
      const userId = 'USER-' + Date.now();
      const { sheet, headers } = getSheetAndHeaders('Users');
      user = {
        user_id: userId,
        name: tokenInfo.name || tokenInfo.email,
        email: tokenInfo.email,
        password_hash: '',
        auth_provider: 'google',
        google_id: tokenInfo.sub
      };
      const newRow = headers.map(h => user[h] || '');
      sheet.appendRow(newRow);
    }
    // Generate token
    const token = generateToken();
    const expires = getTokenExpiry();
    saveAuthToken(token, user.user_id, expires);
    delete user.password_hash;
    return returnJSON({ token: token, user: user });
  }

  // API: Verify token
  function verifyTokenApi(body) {
    if (!body.token) {
      return returnJSON({ error: 'Missing token' }, 400);
    }
    const userId = validateToken(body.token);
    if (!userId) {
      return returnJSON({ error: 'Invalid or expired token' }, 401);
    }
    return returnJSON({ valid: true, user_id: userId });
  }
  
    // Helper: Verify Google ID token using tokeninfo endpoint
    function verifyGoogleIdToken(idToken) {
      try {
        const url = 'https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(idToken);
        const response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
        if (response.getResponseCode() !== 200) return null;
        const info = JSON.parse(response.getContentText());
        // Must have email and sub (Google user ID)
        if (!info.email || !info.sub) return null;
        // Optionally: check aud matches your Google client ID
        return info;
      } catch (e) {
        return null;
      }
    }

// API: Get all auth tokens
function getAuthTokens() {
  const { sheet, headers } = getSheetAndHeaders('AuthTokens');
  const data = sheet.getDataRange().getValues();
  const tokens = [];
  for (let i = 1; i < data.length; i++) {
    const obj = {};
    headers.forEach((header, idx) => { obj[header] = data[i][idx]; });
    if (obj.token_id) tokens.push(obj);
  }
  return returnJSON({ tokens: tokens, count: tokens.length });
}

function updateUser(userId, userData) {
  const sheet = SHEET.getSheetByName('Users');
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const userId_index = headers.indexOf('user_id');
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][userId_index] == userId) {
      const updateRow = headers.map(header => userData[header] !== undefined ? userData[header] : data[i][headers.indexOf(header)]);
      sheet.getRange(i + 1, 1, 1, headers.length).setValues([updateRow]);
      
      return returnJSON({ 
        message: 'User updated successfully',
        user: userData 
      });
    }
  }
  
  return returnJSON({ error: 'User not found' }, 404);
}

// ============================================================================
// ORDER FUNCTIONS
// ============================================================================

function getOrders() {
  const sheet = SHEET.getSheetByName('Orders');
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const rows = data.slice(1);
  
  const orders = rows.map(row => {
    const obj = {};
    headers.forEach((header, index) => {
      obj[header] = row[index];
    });
    return obj;
  }).filter(order => order.order_id !== ''); // Filter out empty rows
  
  return returnJSON({ orders: orders, count: orders.length });
}

function getOrderById(orderId) {
  const sheet = SHEET.getSheetByName('Orders');
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const orderId_index = headers.indexOf('order_id');
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][orderId_index] == orderId) {
      const obj = {};
      headers.forEach((header, index) => {
        obj[header] = data[i][index];
      });
      return returnJSON({ order: obj });
    }
  }
  
  return returnJSON({ error: 'Order not found' }, 404);
}

function createOrder(orderData, userId) {
  // Section 11.3: Input Validation
  if (!orderData.customer_name || !orderData.customer_email) {
    return returnJSON({
      error: 'Missing required fields',
      required: ['customer_name', 'customer_email']
    }, 400);
  }
  
  // Validate email format
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(orderData.customer_email)) {
    return returnJSON({
      error: 'Invalid email format',
      message: 'Please provide a valid customer email address'
    }, 400);
  }
  
  // Validate amount is a number
  if (orderData.total_amount && isNaN(parseFloat(orderData.total_amount))) {
    return returnJSON({
      error: 'Invalid amount',
      message: 'Total amount must be a valid number'
    }, 400);
  }
  
  const sheet = SHEET.getSheetByName('Orders');
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  
  // Generate order ID if not provided
  if (!orderData.order_id) {
    orderData.order_id = 'ORD-' + Date.now();
  }
  
  // Set user_id from authenticated session
  orderData.user_id = userId || '';
  
  // Set default values
  if (!orderData.order_date) {
    orderData.order_date = new Date();
  }
  
  const newRow = headers.map(header => orderData[header] || '');
  sheet.appendRow(newRow);
  
  return returnJSON({ 
    message: 'Order created successfully',
    order: orderData,
    order_id: orderData.order_id
  }, 201);
}

function updateOrder(orderId, orderData) {
  const sheet = SHEET.getSheetByName('Orders');
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const orderId_index = headers.indexOf('order_id');
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][orderId_index] == orderId) {
      const updateRow = headers.map(header => orderData[header] !== undefined ? orderData[header] : data[i][headers.indexOf(header)]);
      sheet.getRange(i + 1, 1, 1, headers.length).setValues([updateRow]);
      
      return returnJSON({ 
        message: 'Order updated successfully',
        order: orderData 
      });
    }
  }
  
  return returnJSON({ error: 'Order not found' }, 404);
}

// ============================================================================
// SESSION FUNCTIONS
// ============================================================================

function getSessions() {
  const sheet = SHEET.getSheetByName('Sessions');
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const rows = data.slice(1);
  
  const sessions = rows.map(row => {
    const obj = {};
    headers.forEach((header, index) => {
      obj[header] = row[index];
    });
    return obj;
  }).filter(session => session.session_id !== '');
  
  return returnJSON({ sessions: sessions, count: sessions.length });
}

function createSession(sessionData) {
  const sheet = SHEET.getSheetByName('Sessions');
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  
  // Generate session ID if not provided
  if (!sessionData.session_id) {
    sessionData.session_id = 'SESSION-' + Date.now();
  }
  
  if (!sessionData.created_at) {
    sessionData.created_at = new Date();
  }
  
  const newRow = headers.map(header => sessionData[header] || '');
  sheet.appendRow(newRow);
  
  return returnJSON({ 
    message: 'Session created successfully',
    session: sessionData 
  }, 201);
}

// ============================================================================
// LOG FUNCTIONS
// ============================================================================

function getLogs(limit = 100) {
  const sheet = SHEET.getSheetByName('Logs');
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const rows = data.slice(Math.max(1, data.length - limit));
  
  const logs = rows.map(row => {
    const obj = {};
    headers.forEach((header, index) => {
      obj[header] = row[index];
    });
    return obj;
  });
  
  return returnJSON({ logs: logs, count: logs.length });
}

// ============================================================================
// TESTIMONIAL FUNCTIONS
// ============================================================================

function getTestimonials() {
  // For now, return sample testimonials
  const testimonials = [
    {
      name: 'Raj Kumar',
      company: 'Tech Startup',
      message: 'Webpot delivered our website on time and exceeded our expectations. The team was professional and responsive.',
      rating: 5
    },
    {
      name: 'Priya Singh',
      company: 'E-commerce Business',
      message: 'Great service! Our website is now converting visitors to customers. Highly recommend Webpot!',
      rating: 5
    },
    {
      name: 'Amit Patel',
      company: 'Small Business Owner',
      message: 'The support team is excellent. They helped us with everything we needed and made the process smooth.',
      rating: 5
    }
  ];
  
  return returnJSON({ testimonials: testimonials, count: testimonials.length });
}

function submitTestimonial(testimonialData) {
  // Store testimonial (could be saved to a sheet or email)
  return returnJSON({
    message: 'Thank you for your testimonial!',
    testimonial: testimonialData
  }, 201);
}

// ============================================================================
// CONTACT FORM FUNCTIONS
// ============================================================================

// API: Submit contact form
function submitContactApi(body, userId) {
  // Validate required fields
  if (!body.name || !body.email || !body.message) {
    return returnJSON({ error: 'Missing required fields: name, email, message' }, 400);
  }
  
  // Validate email format
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
    return returnJSON({ error: 'Invalid email format' }, 400);
  }
  
  // Sanitize inputs (remove HTML tags, trim whitespace)
  const contact = {
    contact_id: 'CONTACT-' + Date.now() + '-' + Math.floor(Math.random() * 10000),
    user_id: userId || '',
    name: sanitizeInput(body.name),
    email: sanitizeInput(body.email),
    subject: sanitizeInput(body.subject || ''),
    message: sanitizeInput(body.message),
    submitted_at: new Date().toISOString(),
    source: body.source || 'website'
  };
  
  try {
    const { sheet, headers } = getSheetAndHeaders('Contacts');
    const newRow = headers.map(h => contact[h] || '');
    sheet.appendRow(newRow);
    
    // Log the submission
    try {
      logAction(null, 'submitContact', `Contact from ${contact.email}`, contact.email, {
        getActiveUser: function() { return { getEmail: function() { return contact.email; } }; }
      });
    } catch (logError) {
      // Silently ignore logging errors
    }
    
    return returnJSON({ 
      success: true, 
      contact_id: contact.contact_id,
      message: 'Contact form submitted successfully'
    });
  } catch (error) {
    console.error('Error submitting contact:', error);
    return returnJSON({ 
      error: 'Failed to submit contact form',
      message: 'An error occurred while processing your submission'
    }, 500);
  }
}

// Get all contacts (admin endpoint)
function getContacts() {
  try {
    const { sheet, headers } = getSheetAndHeaders('Contacts');
    const data = sheet.getDataRange().getValues();
    const contacts = [];
    
    for (let i = 1; i < data.length; i++) {
      const contact = {};
      headers.forEach((header, idx) => {
        contact[header] = data[i][idx];
      });
      if (contact.contact_id) {
        contacts.push(contact);
      }
    }
    
    return returnJSON({ 
      contacts: contacts, 
      count: contacts.length
    });
  } catch (error) {
    console.error('Error retrieving contacts:', error);
    return returnJSON({ 
      error: 'Failed to retrieve contacts',
      message: 'An error occurred while fetching contact submissions'
    }, 500);
  }
}

// Helper: Sanitize input to prevent XSS
function sanitizeInput(input) {
  if (typeof input !== 'string') {
    return '';
  }
  
  return input
    .trim()
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .substring(0, 5000); // Limit to 5000 characters
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

// Log an action to the Logs sheet
function logAction(userId, action, details, email, source) {
  try {
    const sheet = SHEET.getSheetByName('Logs');
    const timestamp = new Date();
    
    sheet.appendRow([
      'LOG-' + timestamp.getTime(),
      userId || '',
      action,
      timestamp,
      source.getActiveUser().getEmail() || email || 'unknown',
      details || ''
    ]);
  } catch (e) {
    Logger.log('Logging error: ' + e);
  }
}

// Return JSON response with proper content type (Section 11.2: Security)
// ============================================================================
// SAFE JSON PARSING
// ============================================================================
// Safely parse JSON from postData without throwing on invalid/empty data

function safeParseJSON(postData) {
  // Check if postData and contents exist
  if (!postData || !postData.contents) {
    return {};
  }
  
  try {
    return JSON.parse(postData.contents);
  } catch (e) {
    // Return empty object if parsing fails
    return {};
  }
}

// ============================================================================
// RESPONSE HELPER
// ============================================================================
// Always return valid JSON with appropriate status semantics

function returnJSON(data, statusCode = 200) {
  // Security: Never expose sensitive information in error responses
  if (data.error && data.message && data.message.includes("Line")) {
    // Error is from GAS, sanitize it
    data.message = "An error occurred. Please try again later.";
    data.error = "Server Error";
  }
  
  // Always return JSON with appropriate status code
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON)
    .setHttpHeaders({'HTTP_STATUS': statusCode});
}

// ============================================================================
// TESTING
// ============================================================================

// Test function to verify GAS is working
function test() {
  return returnJSON({
    message: 'Google Apps Script is working!',
    timestamp: new Date(),
    sheetId: SHEET_ID,
    sheets: SHEET.getSheets().map(s => s.getName())
  });
}
