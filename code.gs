const SPREADSHEET = SpreadsheetApp.getActiveSpreadsheet();

// Helper to safely get sheet
function getSheet(sheetName) {
  var sheet = SPREADSHEET.getSheetByName(sheetName);
  if (!sheet) throw new Error("Sheet not found: " + sheetName);
  return sheet;
}

// ---------------- MAIN ROUTER ----------------

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000); // Wait up to 10s to prevent collisions

  try {
    var data = JSON.parse(e.postData.contents);
    var action = data.action || data.formType; // Support both naming conventions
    var response = { status: 'error', message: 'Invalid action' };

    switch(action) {
      case 'register':
        response = handleUserRegistration(data);
        break;
      case 'login':
        response = handleUserLogin(data);
        break;
      case 'order':
        response = handleOrderSubmission(data);
        break;
      case 'contact':
        response = handleContactInquiry(data);
        break;
      case 'update_payment':
        response = handlePaymentUpdate(data);
        break;
      default:
        response = { status: 'error', message: 'Unknown action type: ' + action };
    }

    return ContentService.createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON);

  } catch(error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);

  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  var action = e.parameter.action;
  
  if (action === 'get_user_data') {
    var email = e.parameter.email;
    var data = getUserDashboardData(email);
    return ContentService.createTextOutput(JSON.stringify(data))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  return ContentService.createTextOutput(JSON.stringify({status: 'ready'}))
    .setMimeType(ContentService.MimeType.JSON);
}

// ---------------- HANDLERS ----------------

function handleUserRegistration(data) {
  var sheet = getSheet('Users Sheet');
  var values = sheet.getDataRange().getValues();
  
  // Check duplicates (Column C = index 2)
  for (var i = 1; i < values.length; i++) {
    if (values[i][2] === data.email) {
      return { status: 'user_already_exists', message: 'User already exists' };
    }
  }
  
  var timestamp = new Date();
  
  // Columns: [Date, Name, Email, Password, Phone, Status, Created]
  // We save 'data.phone' at index 4 (Column E)
  sheet.appendRow([
    timestamp, 
    data.name, 
    data.email, 
    data.password, 
    data.phone ? String(data.phone) : '', // Force String
    'active', 
    timestamp
  ]);
  
  return { status: 'success', message: 'User registered successfully' };
}

function handleUserLogin(data) {
  var sheet = getSheet('Users Sheet');
  var values = sheet.getDataRange().getValues();
  
  // Support both 'email' (new) and 'emailOrPhone' (old) keys
  var loginInput = data.loginInput || data.email || data.emailOrPhone; 
  
  if (!loginInput) {
    return { status: 'error', message: 'Email or Phone is required' };
  }

  // Convert input to string to ensure matching works against numbers
  var inputStr = String(loginInput).trim();

  for (var i = 1; i < values.length; i++) {
    // Column C (Index 2) is Email
    // Column E (Index 4) is Phone
    var sheetEmail = String(values[i][2]);
    var sheetPhone = String(values[i][4]);

    // Check if input matches EITHER Email OR Phone
    if (sheetEmail === inputStr || sheetPhone === inputStr) { 
      // Check Password (Column D -> Index 3)
      if (String(values[i][3]) === String(data.password)) { 
        return { 
          status: 'success', 
          message: 'Login successful',
          user: { 
            name: values[i][1], 
            email: values[i][2], 
            phone: values[i][4], // Return phone too
            status: values[i][5] 
          }
        };
      } else {
        return { status: 'invalid_password', message: 'Invalid password' };
      }
    }
  }
  return { status: 'user_not_found', message: 'User not found' };
}

function handleOrderSubmission(data) {
  var sheet = getSheet('Orders Sheet');
  var timestamp = new Date();
  var orderId = 'ORD-' + Date.now();
  
  // 1. FIXED TOTAL PRICES (Web Service Cost)
  // This ensures the Total Amount is correct regardless of what frontend sends
  var servicePrices = {
    'Starter': 2999,
    'Basic': 5999,
    'Premium': 9999
  };
  
  // Use fixed price if available, otherwise fallback (for custom amounts)
  var totalAmount = servicePrices[data.service] || parseFloat(data.amount) || 0;

  // 2. PAID AMOUNT (What user actually paid now)
  // If transactionId exists, we assume the user paid the amount they entered/scanned.
  var paidAmount = data.transactionId ? (parseFloat(data.amount) || 0) : 0;
  
  // 3. DUE AMOUNT
  var dueAmount = totalAmount - paidAmount;
  
  // 4. TRANSACTION ID (if provided)
  var transactionIds = data.transactionId || '';
  
  // 5. PAYMENT STATUS
  // If Due <= 0, Completed. If Paid > 0 but Due > 0, Partial. Else Pending.
  var payStatus = (dueAmount <= 0) ? 'Completed' : (paidAmount > 0 ? 'Partial' : 'Pending');

  // Columns Mapping (0-based index for array, matches Sheet Columns A-M):
  // [Date, Order ID, Name, Email, Phone, Service, Total, Paid, Due, TxnIDs, Status, Details, Updated]
  sheet.appendRow([
    timestamp, 
    orderId, 
    data.name, 
    data.email, 
    data.phone, 
    data.service, 
    totalAmount,
    paidAmount,
    dueAmount,
    transactionIds, // Column J
    payStatus,      // Column K
    data.details || '', // Column L
    timestamp       // Column M
  ]);

  sendOrderEmails(data, orderId);
  
  return { status: 'success', message: 'Order submitted', orderId: orderId };
}

function handleContactInquiry(data) {
  var sheet = getSheet('Contact_Inquires Sheet');
  var timestamp = new Date();
  sheet.appendRow([timestamp, data.name, data.email, data.phone, data.message, 'new']);
  return { status: 'success', message: 'Contact inquiry submitted' };
}

// ---------------- DASHBOARD LOGIC ----------------

function getUserDashboardData(email) {
  var sheet = getSheet('Orders Sheet');
  var data = sheet.getDataRange().getValues();
  var userOrders = [];
  
  // Skip header row (start at i=1)
  for (var i = 1; i < data.length; i++) {
    // Check if Email column (Index 3) matches
    if (data[i][3] === email) {
      userOrders.push({
        date: data[i][0],
        orderId: data[i][1],
        service: data[i][5],
        amount: data[i][6],     // Total
        paidAmount: data[i][7], // Paid
        dueAmount: data[i][8],  // Due
        status: data[i][10],
        details: data[i][11]
      });
    }
  }
  
  return { status: 'success', orders: userOrders };
}

function handlePaymentUpdate(data) {
  var sheet = getSheet('Orders Sheet');
  var range = sheet.getDataRange();
  var values = range.getValues();
  var rowIndex = -1;
  
  // Find the Order by Order ID (Index 1)
  for (var i = 1; i < values.length; i++) {
    if (values[i][1] === data.orderId) {
      rowIndex = i + 1; // 1-based index for Sheet API
      break;
    }
  }
  
  if (rowIndex === -1) {
    return { status: 'error', message: 'Order ID not found' };
  }
  
  // Get Current Data
  var currentRow = values[rowIndex - 1];
  var currentTotal = parseFloat(currentRow[6]) || 0;
  var currentPaid = parseFloat(currentRow[7]) || 0;
  var currentTxns = currentRow[9] ? currentRow[9].toString() : '';
  
  // Calculate New Values
  var newPayment = parseFloat(data.amount);
  var newPaidTotal = currentPaid + newPayment;
  var newDue = currentTotal - newPaidTotal;
  
  // Append Transaction ID
  var newTxns = currentTxns === '' ? data.transactionId : currentTxns + ', ' + data.transactionId;
  
  // Determine Status
  var newStatus = (newDue <= 0) ? 'Completed' : 'Partial';
  if (newDue <= 0 && newPaidTotal > currentTotal) newStatus = 'Overpaid'; // Safety check
  
  // Update the Row in Sheet (using 1-based column indexes)
  sheet.getRange(rowIndex, 8).setValue(newPaidTotal);  // Col H: Paid
  sheet.getRange(rowIndex, 9).setValue(newDue);        // Col I: Due
  sheet.getRange(rowIndex, 10).setValue(newTxns);      // Col J: Txn IDs
  sheet.getRange(rowIndex, 11).setValue(newStatus);    // Col K: Status
  sheet.getRange(rowIndex, 13).setValue(new Date());   // Col M: Last Updated
  
  return { 
    status: 'success', 
    message: 'Payment updated', 
    newDue: newDue, 
    newStatus: newStatus 
  };
}

// ---------------- EMAIL HELPER ----------------
function sendOrderEmails(data, orderId) {
  try {
    var adminEmail = "engagewebpot@gmail.com"; 
    
    // Admin Alert
    MailApp.sendEmail({
      to: adminEmail,
      subject: "💰 New Order: " + orderId,
      htmlBody: "<h3>New Order Received</h3><p>Service: " + data.service + "</p><p>Total: ₹" + (data.amount || 0) + "</p>"
    });
    
    // Client Confirmation
    var firstName = data.name.split(" ")[0];
    MailApp.sendEmail({
      to: data.email,
      subject: "Order Confirmation - Webpot (" + orderId + ")",
      htmlBody: "<h2>Thanks " + firstName + "!</h2><p>We received your order for <strong>" + data.service + "</strong>.</p><p>You can track your order status and make payments in your Dashboard.</p>"
    });
  } catch (e) {
    console.error("Email error: " + e.toString());
  }
}