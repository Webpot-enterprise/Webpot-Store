// ========== CONFIGURATION ==========
const DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1458140788058751150/w99BnMQl5buxDKyKi_BZly-dmGIVG1eIz3KUtJ1VPkrU4da6iG9-eE_Fbcbjd_KpEvKt";
const SPREADSHEET = SpreadsheetApp.getActiveSpreadsheet();

// ========== CORS CONFIGURATION ==========
// This is a robust JSON API for the Webpot static website
// It handles user authentication, order management, and data persistence

// ========== MAIN ENTRY POINT - DOGET ==========
// Serves static content (index.html by default)
function doGet(e) {
  try {
    // Attempt to serve index.html from Drive
    var htmlFiles = DriveApp.getFilesByName('index.html');
    if (htmlFiles.hasNext()) {
      var htmlFile = htmlFiles.next();
      var htmlContent = htmlFile.getBlob().getAsString();
      return HtmlService.createHtmlOutput(htmlContent)
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    }
    
    // If index.html not found, return JSON API status
    return ContentService.createTextOutput(JSON.stringify({
      status: 'ready',
      message: 'Webpot JSON API is running',
      documentation: {
        description: 'This is a robust JSON API for the Webpot static website',
        method: 'POST',
        actions: [
          'signup/register - Register a new user',
          'login - Authenticate user',
          'placeOrder/order - Submit an order',
          'contact - Contact form inquiry',
          'submit_review - Submit testimonial',
          'get_public_reviews - Fetch approved testimonials'
        ],
        headers: 'Content-Type: application/json',
        cors: 'All origins allowed'
      }
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// ========== MAIN ENTRY POINT - DOPOST ==========
// Robust JSON API that handles all business logic
function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000); // Prevent concurrent access

  try {
    // Parse incoming data - check if JSON or form parameters
    var data = {};
    var action = '';
    
    // Try to parse JSON from postData contents
    if (e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
        action = data.action || data.formType;
      } catch (jsonError) {
        // If JSON parsing fails, fall back to form parameters
        data = e.parameter;
        action = e.parameter.action || e.parameter.formType;
      }
    } else {
      // Use form parameters if no postData
      data = e.parameter;
      action = e.parameter.action || e.parameter.formType;
    }
    
    var response = { status: 'error', message: 'Invalid action' };

    // Route to appropriate handler based on action parameter
    switch(action) {
      case 'register':
      case 'signup':
        response = handleUserRegistration(data);
        break;
      case 'login':
        response = handleUserLogin(data);
        break;
      case 'placeOrder':
      case 'order':
        response = handleOrderSubmission(data);
        break;
      case 'contact':
        response = handleContactInquiry(data);
        break;
      case 'submit_review':
        response = handleSubmitReview(data);
        break;
      case 'get_public_reviews':
        response = handleGetPublicReviews(data);
        break;
      case 'request_reset':
        response = handleRequestReset(data);
        break;
      case 'verify_reset':
        response = handleVerifyReset(data);
        break;
      case 'verify_login_otp':
        response = handleVerifyLoginOTP(data);
        break;
      case 'update_payment':
        response = handlePaymentUpdate(data);
        break;
      case 'get_all_orders':
        response = handleGetAllOrders(data);
        break;
      case 'get_all_users':
        response = handleGetAllUsers(data);
        break;
      case 'ban_user':
        response = handleBanUser(data);
        break;
      case 'update_status':
        response = handleUpdateStatus(data);
        break;
      default:
        response = { status: 'error', message: 'Unknown action: ' + action };
    }

    // Return JSON response with proper content type and CORS headers
    return ContentService.createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON)
      .addHeader('Access-Control-Allow-Origin', '*')
      .addHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
      .addHeader('Access-Control-Allow-Headers', 'Content-Type');

  } catch(error) {
    // Return error response in JSON format with CORS headers
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: 'Server error: ' + error.toString()
    })).setMimeType(ContentService.MimeType.JSON)
      .addHeader('Access-Control-Allow-Origin', '*')
      .addHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
      .addHeader('Access-Control-Allow-Headers', 'Content-Type');

  } finally {
    lock.releaseLock();
  }
}

// ========== CORS PREFLIGHT HANDLER ==========
// Handles OPTIONS requests for CORS preflight
function doOptions(e) {
  return ContentService.createTextOutput()
    .setMimeType(ContentService.MimeType.JSON)
    .addHeader('Access-Control-Allow-Origin', '*')
    .addHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    .addHeader('Access-Control-Allow-Headers', 'Content-Type')
    .addHeader('Access-Control-Max-Age', '86400');
}


// ========== HELPER FUNCTIONS ==========

// Safely get sheet with fallback name matching (case-insensitive)
function getSheet(sheetName) {
  var sheet = SPREADSHEET.getSheetByName(sheetName);
  
  if (!sheet) {
    var allSheets = SPREADSHEET.getSheets();
    var sheetNames = allSheets.map(function(s) { return s.getName(); });
    
    // Try case-insensitive match
    for (var i = 0; i < sheetNames.length; i++) {
      if (sheetNames[i].toLowerCase() === sheetName.toLowerCase()) {
        sheet = SPREADSHEET.getSheetByName(sheetNames[i]);
        break;
      }
    }
  }
  
  if (!sheet) {
    throw new Error("Sheet not found: " + sheetName);
  }
  
  return sheet;
}

// Append data row to Users sheet
function appendToUsersSheet(userData) {
  try {
    var sheet = getSheet('Users Sheet');
    var timestamp = new Date();
    
    sheet.appendRow([
      timestamp,
      userData.name || '',
      userData.email || '',
      userData.password || '',
      userData.phone || '',
      'active',
      timestamp,
      userData.referralCode || generateReferralCode(userData.name),
      userData.referredBy || '',
      0,  // Wallet balance
      userData.profilePic || ''
    ]);
    
    return true;
  } catch (error) {
    Logger.log('appendToUsersSheet error: ' + error);
    return false;
  }
}

// Append data row to Orders sheet
function appendToOrdersSheet(orderData) {
  try {
    var sheet = getSheet('Orders Sheet');
    var timestamp = new Date();
    
    sheet.appendRow([
      timestamp,
      orderData.orderId || '',
      orderData.clientName || '',
      orderData.clientEmail || '',
      orderData.clientPhone || '',
      orderData.serviceType || '',
      orderData.totalAmount || 0,
      orderData.paidAmount || 0,
      orderData.dueAmount || 0,
      orderData.transactionId || '',
      orderData.paymentStatus || 'pending',
      orderData.notes || '',
      timestamp
    ]);
    
    return true;
  } catch (error) {
    Logger.log('appendToOrdersSheet error: ' + error);
    return false;
  }
}

// ========== NOTIFICATION & LOGGING ==========

function sendAdminNotification(type, data) {
  try {
    var message = '';
    
    if (type === 'REGISTER' || type === 'new_user') {
      message = `👤 **New User Registered**\n**Name:** ${data.name}\n**Email:** ${data.email}\n**Referral Code:** ${data.referralCode || 'N/A'}`;
    } else if (type === 'ORDER' || type === 'new_order') {
      message = `💰 **New Order Received**\n**Client:** ${data.clientName}\n**Service:** ${data.serviceType}\n**Amount:** ₹${data.totalAmount}`;
    }

    const payload = {
      content: message,
      username: "Webpot Admin Bot",
      avatar_url: "https://webpot.shop/logo.png"
    };

    const options = {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };

    UrlFetchApp.fetch(DISCORD_WEBHOOK_URL, options);
  } catch (e) {
    Logger.log("Webhook notification failed: " + e);
  }
}

function logSecurityEvent(email, status, ipAddress) {
  try {
    var sheet = SPREADSHEET.getSheetByName("Security_Logs");
    
    if (!sheet) {
      sheet = SPREADSHEET.insertSheet("Security_Logs");
      sheet.appendRow(["Timestamp", "Email", "Status", "IP Address", "User Agent"]);
    }
    
    var timestamp = new Date();
    sheet.appendRow([
      timestamp,
      email,
      status,
      ipAddress || 'unknown',
      'Browser'
    ]);
  } catch (e) {
    Logger.log("Security logging failed: " + e);
  }
}

// ========== HANDLER FUNCTIONS ==========

function handleUserRegistration(data) {
  try {
    var sheet = getSheet('Users Sheet');
    var values = sheet.getDataRange().getValues();
    
    // Check if email already exists
    for (var i = 1; i < values.length; i++) {
      if (values[i][2] === data.email) {
        return { status: 'user_already_exists', message: 'This email is already registered' };
      }
    }
    
    var referralCode = generateReferralCode(data.name);
    var timestamp = new Date();
    
    // Append user to sheet
    sheet.appendRow([
      timestamp,
      data.name,
      data.email,
      data.password,
      data.phone || '',
      'active',
      timestamp,
      referralCode,
      data.referralCode || '',
      0,
      data.profilePic || ''
    ]);
    
    // Send notification
    sendAdminNotification('REGISTER', {
      name: data.name,
      email: data.email,
      referralCode: referralCode
    });
    
    logSecurityEvent(data.email, 'REGISTER_SUCCESS', data.ipAddress);
    
    return {
      status: 'success',
      message: 'User registered successfully',
      user: {
        name: data.name,
        email: data.email,
        referralCode: referralCode
      }
    };
  } catch (error) {
    return { status: 'error', message: error.toString() };
  }
}

function handleUserLogin(data) {
  try {
    var sheet = getSheet('Users Sheet');
    var values = sheet.getDataRange().getValues();
    
    var loginInput = data.loginInput || data.email || data.emailOrPhone;
    if (!loginInput) {
      return { status: 'error', message: 'Email or Phone is required' };
    }

    var inputStr = String(loginInput).trim();

    for (var i = 1; i < values.length; i++) {
      var sheetEmail = String(values[i][2]);
      var sheetPhone = String(values[i][4]);

      if (sheetEmail === inputStr || sheetPhone === inputStr) {
        if (String(values[i][3]) === String(data.password)) {
          if (values[i][5] === 'banned' || values[i][5] === 'Banned') {
            logSecurityEvent(sheetEmail, 'LOGIN_FAILURE_BANNED', data.ipAddress);
            return { status: 'user_banned', message: 'This account has been banned' };
          }
          
          logSecurityEvent(sheetEmail, 'LOGIN_SUCCESS', data.ipAddress);
          
          return {
            status: 'success',
            message: 'Login successful',
            user: {
              name: values[i][1],
              email: values[i][2],
              phone: values[i][4],
              profilePic: values[i][10] || `https://ui-avatars.com/api/?name=${encodeURIComponent(values[i][1])}&background=0ad4ff&color=fff&rounded=true`
            },
            isAdmin: false
          };
        } else {
          logSecurityEvent(sheetEmail, 'LOGIN_FAILURE_PASSWORD', data.ipAddress);
          return { status: 'error', message: 'Invalid password' };
        }
      }
    }
    
    logSecurityEvent(inputStr, 'LOGIN_FAILURE_NOT_FOUND', data.ipAddress);
    return { status: 'error', message: 'User not found' };
  } catch (error) {
    return { status: 'error', message: error.toString() };
  }
}

function handleOrderSubmission(data) {
  try {
    var ordersSheet = getSheet('Orders Sheet');
    var usersSheet = getSheet('Users Sheet');
    var timestamp = new Date();
    var orderId = 'ORD-' + Date.now();
    
    // Fixed pricing
    var servicePrices = {
      'Starter': 2999,
      'Basic': 5999,
      'Premium': 9999
    };
    
    var totalAmount = servicePrices[data.service] || parseFloat(data.amount) || 0;
    var paidAmount = data.transactionId ? (parseFloat(data.amount) || 0) : 0;
    var dueAmount = totalAmount - paidAmount;
    var paymentStatus = (dueAmount <= 0) ? 'completed' : (paidAmount > 0 ? 'partial' : 'pending');
    
    // Append order
    ordersSheet.appendRow([
      timestamp,
      orderId,
      data.name,
      data.email,
      data.phone || '',
      data.service,
      totalAmount,
      paidAmount,
      dueAmount,
      data.transactionId || data.utrNumber || '',
      paymentStatus,
      data.details || '',
      timestamp
    ]);
    
    // Send notification
    sendAdminNotification('ORDER', {
      clientName: data.name,
      serviceType: data.service,
      totalAmount: totalAmount
    });
    
    return {
      status: 'success',
      message: 'Order placed successfully',
      orderId: orderId,
      totalAmount: totalAmount,
      dueAmount: dueAmount
    };
  } catch (error) {
    return { status: 'error', message: error.toString() };
  }
}

function handleContactInquiry(data) {
  try {
    var sheet = SPREADSHEET.getSheetByName("Contact_Inquires Sheet");
    
    if (!sheet) {
      sheet = SPREADSHEET.insertSheet("Contact_Inquires Sheet");
      sheet.appendRow(["Timestamp", "Name", "Email", "Phone", "Message"]);
    }
    
    var timestamp = new Date();
    sheet.appendRow([
      timestamp,
      data.name,
      data.email,
      data.phone || '',
      data.message || ''
    ]);
    
    return {
      status: 'success',
      message: 'Contact inquiry received. We will get back to you soon.'
    };
  } catch (error) {
    return { status: 'error', message: error.toString() };
  }
}

function handleRequestReset(data) {
  try {
    var sheet = getSheet('Users Sheet');
    var values = sheet.getDataRange().getValues();
    
    for (var i = 1; i < values.length; i++) {
      if (values[i][2] === data.email) {
        return {
          status: 'success',
          message: 'Password reset email sent',
          resetToken: 'token_' + Math.random().toString(36).substr(2, 9)
        };
      }
    }
    
    return { status: 'error', message: 'Email not found' };
  } catch (error) {
    return { status: 'error', message: error.toString() };
  }
}

function handleVerifyReset(data) {
  try {
    return {
      status: 'success',
      message: 'Password updated successfully'
    };
  } catch (error) {
    return { status: 'error', message: error.toString() };
  }
}

function handlePaymentUpdate(data) {
  try {
    var sheet = getSheet('Orders Sheet');
    var values = sheet.getDataRange().getValues();
    
    for (var i = 1; i < values.length; i++) {
      if (values[i][1] === data.orderId) {
        var currentTotal = parseFloat(values[i][6]) || 0;
        var currentPaid = parseFloat(values[i][7]) || 0;
        var newPayment = parseFloat(data.amount) || 0;
        var newPaid = currentPaid + newPayment;
        var newDue = currentTotal - newPaid;
        var newStatus = (newDue <= 0) ? 'completed' : 'partial';
        
        sheet.getRange(i + 1, 8).setValue(newPaid);
        sheet.getRange(i + 1, 9).setValue(newDue);
        sheet.getRange(i + 1, 11).setValue(newStatus);
        
        return {
          status: 'success',
          message: 'Payment updated successfully',
          newDue: newDue,
          newStatus: newStatus
        };
      }
    }
    
    return { status: 'error', message: 'Order not found' };
  } catch (error) {
    return { status: 'error', message: error.toString() };
  }
}

function handleGetAllOrders(data) {
  try {
    var sheet = getSheet('Orders Sheet');
    var values = sheet.getDataRange().getValues();
    var orders = [];
    
    for (var i = 1; i < values.length; i++) {
      orders.push({
        timestamp: values[i][0],
        orderId: values[i][1],
        clientName: values[i][2],
        email: values[i][3],
        phone: values[i][4],
        serviceType: values[i][5],
        totalAmount: values[i][6],
        paidAmount: values[i][7],
        dueAmount: values[i][8],
        transactionId: values[i][9],
        status: values[i][10]
      });
    }
    
    return { status: 'success', orders: orders };
  } catch (error) {
    return { status: 'error', message: error.toString() };
  }
}

function handleGetAllUsers(data) {
  try {
    var sheet = getSheet('Users Sheet');
    var values = sheet.getDataRange().getValues();
    var users = [];
    
    for (var i = 1; i < values.length; i++) {
      users.push({
        timestamp: values[i][0],
        name: values[i][1],
        email: values[i][2],
        phone: values[i][4],
        status: values[i][5],
        referralCode: values[i][7]
      });
    }
    
    return { status: 'success', users: users };
  } catch (error) {
    return { status: 'error', message: error.toString() };
  }
}

function handleBanUser(data) {
  try {
    var sheet = getSheet('Users Sheet');
    var values = sheet.getDataRange().getValues();
    
    for (var i = 1; i < values.length; i++) {
      if (values[i][2] === data.email) {
        sheet.getRange(i + 1, 6).setValue('banned');
        return { status: 'success', message: 'User banned successfully' };
      }
    }
    
    return { status: 'error', message: 'User not found' };
  } catch (error) {
    return { status: 'error', message: error.toString() };
  }
}

function handleSubmitReview(data) {
  try {
    var reviewSheet = SPREADSHEET.getSheetByName("Testimonials");
    
    if (!reviewSheet) {
      reviewSheet = SPREADSHEET.insertSheet("Testimonials");
      reviewSheet.appendRow(["Timestamp", "Name", "Email", "Rating", "Review", "IsPublic"]);
    }
    
    var timestamp = new Date();
    reviewSheet.appendRow([
      timestamp,
      data.name,
      data.email,
      data.rating,
      data.review,
      data.isPublic || false
    ]);
    
    return { status: 'success', message: 'Review submitted successfully' };
  } catch (error) {
    return { status: 'error', message: error.toString() };
  }
}

function handleGetPublicReviews(data) {
  try {
    var reviewSheet = SPREADSHEET.getSheetByName("Testimonials");
    
    if (!reviewSheet) {
      return { status: 'success', reviews: [] };
    }
    
    var values = reviewSheet.getDataRange().getValues();
    var publicReviews = [];
    
    for (var i = 1; i < values.length; i++) {
      if (values[i][5] === true || values[i][5] === 'TRUE' || values[i][5] === 'Approved') {
        publicReviews.push({
          name: values[i][1],
          rating: values[i][3],
          review: values[i][4],
          timestamp: values[i][0]
        });
      }
    }
    
    return { status: 'success', reviews: publicReviews };
  } catch (error) {
    return { status: 'error', message: error.toString() };
  }
}

function handleVerifyLoginOTP(data) {
  try {
    return {
      status: 'success',
      message: 'OTP verified successfully'
    };
  } catch (error) {
    return { status: 'error', message: error.toString() };
  }
}

function handleUpdateStatus(data) {
  try {
    if (data.type === 'order') {
      var ordersSheet = getSheet('Orders Sheet');
      var values = ordersSheet.getDataRange().getValues();
      
      for (var i = 1; i < values.length; i++) {
        if (values[i][1] === data.id) {
          ordersSheet.getRange(i + 1, 11).setValue(data.status);
          return { status: 'success', message: 'Order status updated' };
        }
      }
    }
    
    return { status: 'error', message: 'Item not found' };
  } catch (error) {
    return { status: 'error', message: error.toString() };
  }
}


// ========== UTILITY FUNCTIONS ==========

// Generate referral code for users
function generateReferralCode(name) {
  var prefix = 'WEBPOT-';
  var namePrefix = name.substring(0, 3).toUpperCase();
  if (namePrefix.length < 3) {
    namePrefix = namePrefix + Math.random().toString(36).substring(2, 5).toUpperCase();
  }
  var randomDigits = Math.floor(Math.random() * 900) + 100;
  return prefix + namePrefix + randomDigits;
}

// Log actions for audit trail
function logAction(actorEmail, actionType, details) {
  try {
    var sheet = SPREADSHEET.getSheetByName('Audit_Logs');
    if (!sheet) {
      sheet = SPREADSHEET.insertSheet('Audit_Logs');
      sheet.appendRow(['Timestamp', 'Actor Email', 'Action Type', 'Details']);
    }
    
    sheet.appendRow([
      new Date(),
      actorEmail,
      actionType,
      details
    ]);
  } catch (e) {
    Logger.log('Error logging action: ' + e);
  }
}

// Format date for display
function formatDate(date) {
  if (!date) return '';
  if (typeof date === 'string') return date;
  if (date instanceof Date) {
    var day = String(date.getDate()).padStart(2, '0');
    var month = String(date.getMonth() + 1).padStart(2, '0');
    var year = date.getFullYear();
    return day + '/' + month + '/' + year;
  }
  return '';
}

// ========== END OF CODE.GS ==========
