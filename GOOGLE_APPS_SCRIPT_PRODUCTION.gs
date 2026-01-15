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
    logAction(null, action, "API Request", e.source.getActiveUser().getEmail(), e.source);
    
    // Route requests based on action parameter
    switch(action) {
      // =====================================================================
      // USER MANAGEMENT
      // =====================================================================
      case 'getUsers':
        return getUsers();
      
      case 'getUserById':
        return getUserById(e.parameter.id);
      
      case 'createUser':
        return createUser(JSON.parse(e.postData.contents));
      
      case 'updateUser':
        return updateUser(e.parameter.id, JSON.parse(e.postData.contents));
      
      // =====================================================================
      // ORDERS
      // =====================================================================
      case 'getOrders':
        return getOrders();
      
      case 'getOrderById':
        return getOrderById(e.parameter.id);
      
      case 'createOrder':
        return createOrder(JSON.parse(e.postData.contents));
      
      case 'updateOrder':
        return updateOrder(e.parameter.id, JSON.parse(e.postData.contents));
      
      // =====================================================================
      // SESSIONS
      // =====================================================================
      case 'getSessions':
        return getSessions();
      
      case 'createSession':
        return createSession(JSON.parse(e.postData.contents));
      
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
        return submitTestimonial(JSON.parse(e.postData.contents));
      
      // =====================================================================
      // DEFAULT
      // =====================================================================
      case 'test':
        return returnJSON({ message: 'Google Apps Script is working!', timestamp: new Date() });
      
      default:
        return returnJSON({ error: `Unknown action: ${action}` }, 400);
    }
    
  } catch (error) {
    // Return error response (Section 11.2: Don't expose internals)
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

function createUser(userData) {
  // Section 11.3: Input Validation
  if (!userData.user_id || !userData.email) {
    return returnJSON({ 
      error: 'Missing required fields',
      required: ['user_id', 'email']
    }, 400);
  }
  
  // Validate email format
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userData.email)) {
    return returnJSON({ 
      error: 'Invalid email format',
      message: 'Please provide a valid email address'
    }, 400);
  }
  
  const sheet = SHEET.getSheetByName('Users');
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  
  const newRow = headers.map(header => userData[header] || '');
  sheet.appendRow(newRow);
  
  return returnJSON({ 
    message: 'User created successfully',
    user: userData 
  }, 201);
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

function createOrder(orderData) {
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
function returnJSON(data, statusCode = 200) {
  // Security: Never expose sensitive information in error responses
  if (data.error && data.message && data.message.includes("Line")) {
    // Error is from GAS, sanitize it
    data.message = "An error occurred. Please try again later.";
    data.error = "Server Error";
  }
  
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
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
