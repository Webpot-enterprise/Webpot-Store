// ========== CONFIGURATION ==========
// Backend for Webpot - Order management and inquiries
// AUTHENTICATION SYSTEM HAS BEEN REMOVED - To be rebuilt from scratch
const DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1458140788058751150/w99BnMQl5buxDKyKi_BZly-dmGIVG1eIz3KUtJ1VPkrU4da6iG9-eE_Fbcbjd_KpEvKt";
const SPREADSHEET = SpreadsheetApp.getActiveSpreadsheet();

// ========== CORS CONFIGURATION ==========
// This API handles order management, inquiries, and testimonials
// Note: Auth handlers have been removed - rebuild authentication from scratch

// ========== MAIN ENTRY POINT - DOGET ==========
function doGet(e) {
  try {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'ready',
      message: 'Webpot API is running - Auth system removed for rebuild',
      documentation: {
        description: 'This API handles order management, contact inquiries, and testimonials',
        method: 'POST',
        available_actions: [
          'placeOrder/order - Submit an order',
          'contact - Contact form inquiry',
          'submit_review - Submit testimonial',
          'get_public_reviews - Fetch approved testimonials',
          'update_payment - Update order payment'
        ],
        headers: 'Content-Type: application/json',
        cors: 'All origins allowed',
        note: 'Authentication system removed - rebuild required'
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
// Handles order submission and inquiries (Auth removed)
function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    var data = {};
    var action = '';
    
    if (e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
        action = data.action || data.formType;
      } catch (jsonError) {
        data = e.parameter;
        action = e.parameter.action || e.parameter.formType;
      }
    } else {
      data = e.parameter;
      action = e.parameter.action || e.parameter.formType;
    }
    
    var response = { status: 'error', message: 'Invalid action' };

    // Only keep non-auth actions
    switch(action) {
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
      case 'update_payment':
        response = handlePaymentUpdate(data);
        break;
      case 'get_all_orders':
        response = handleGetAllOrders(data);
        break;
      case 'update_status':
        response = handleUpdateStatus(data);
        break;
      default:
        response = { status: 'error', message: 'Unknown action: ' + action };
    }

    return ContentService.createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON)
      .addHeader('Access-Control-Allow-Origin', '*')
      .addHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
      .addHeader('Access-Control-Allow-Headers', 'Content-Type');

  } catch(error) {
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
function doOptions(e) {
  return ContentService.createTextOutput()
    .setMimeType(ContentService.MimeType.JSON)
    .addHeader('Access-Control-Allow-Origin', '*')
    .addHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    .addHeader('Access-Control-Allow-Headers', 'Content-Type')
    .addHeader('Access-Control-Max-Age', '86400');
}

// ========== HELPER FUNCTIONS ==========

function getSheet(sheetName) {
  var sheet = SPREADSHEET.getSheetByName(sheetName);
  
  if (!sheet) {
    var allSheets = SPREADSHEET.getSheets();
    var sheetNames = allSheets.map(function(s) { return s.getName(); });
    
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

// ========== NOTIFICATION & LOGGING ==========

function sendAdminNotification(type, data) {
  try {
    var message = '';
    
    if (type === 'ORDER' || type === 'new_order') {
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

// ========== HANDLER FUNCTIONS ==========

function handleOrderSubmission(data) {
  try {
    var ordersSheet = getSheet('Orders Sheet');
    var timestamp = new Date();
    var orderId = 'ORD-' + Date.now();
    
    var servicePrices = {
      'Starter': 2999,
      'Basic': 5999,
      'Premium': 9999
    };
    
    var totalAmount = servicePrices[data.service] || parseFloat(data.amount) || 0;
    var paidAmount = data.transactionId ? (parseFloat(data.amount) || 0) : 0;
    var dueAmount = totalAmount - paidAmount;
    var paymentStatus = (dueAmount <= 0) ? 'completed' : (paidAmount > 0 ? 'partial' : 'pending');
    
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
// All authentication functions have been removed
// Ready for new authentication system implementation

// ========== MAIN ENTRY POINT - DOPOST ==========
// Handles order submission and inquiries (Auth removed)
function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    var data = {};
    var action = '';
    
    if (e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
        action = data.action || data.formType;
      } catch (jsonError) {
        data = e.parameter;
        action = e.parameter.action || e.parameter.formType;
      }
    } else {
      data = e.parameter;
      action = e.parameter.action || e.parameter.formType;
    }
    
    var response = { status: 'error', message: 'Invalid action' };

    // Only keep non-auth actions
    switch(action) {
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
      case 'update_payment':
        response = handlePaymentUpdate(data);
        break;
      case 'get_all_orders':
        response = handleGetAllOrders(data);
        break;
      case 'update_status':
        response = handleUpdateStatus(data);
        break;
      default:
        response = { status: 'error', message: 'Unknown action: ' + action };
    }

    return ContentService.createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON)
      .addHeader('Access-Control-Allow-Origin', '*')
      .addHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
      .addHeader('Access-Control-Allow-Headers', 'Content-Type');

  } catch(error) {
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
    
    if (type === 'ORDER' || type === 'new_order') {
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

// ========== HANDLER FUNCTIONS ==========

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
// All authentication functions have been removed
// Ready for new authentication system implementation
