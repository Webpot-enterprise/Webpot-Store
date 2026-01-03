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
        response = handleUserLoginModified(data);
        break;
      case 'request_reset':
        response = handleRequestReset(data);
        break;
      case 'verify_reset':
        response = handleVerifyReset(data);
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
      case 'get_all_orders':
        response = handleGetAllOrders(data);
        break;
      case 'get_all_users':
        response = handleGetAllUsers(data);
        break;
      case 'ban_user':
        response = handleBanUser(data);
        break;
      case 'submit_review':
        response = handleSubmitReview(data);
        break;
      case 'get_public_reviews':
        response = handleGetPublicReviews(data);
        break;
      case 'verify_login_otp':
        response = handleVerifyLoginOTP(data);
        break;
      case 'update_status':
        response = handleUpdateStatus(data);
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
  
  // Generate unique referral code for new user
  var myReferralCode = generateReferralCode(data.name);
  
  // Check if provided referral code is valid
  var referredBy = '';
  if (data.referralCode) {
    for (var i = 1; i < values.length; i++) {
      if (values[i][7] === data.referralCode) { // Column H (index 7) = My_Referral_Code
        referredBy = data.referralCode;
        // Log the referral connection
        logReferral(values[i][2], data.email); // values[i][2] is referrer's email
        break;
      }
    }
  }
  
  // Columns: [Date, Name, Email, Password, Phone, Status, Created, My_Referral_Code, Referred_By, Wallet_Balance, Profile_Pic]
  sheet.appendRow([
    timestamp, 
    data.name, 
    data.email, 
    data.password, 
    data.phone ? String(data.phone) : '', // Force String
    'active', 
    timestamp,
    myReferralCode,      // Column H (index 7)
    referredBy,          // Column I (index 8)
    0,                   // Column J (index 9) = Wallet_Balance
    data.profilePic ? String(data.profilePic) : ''  // Column K (index 10) = Profile_Pic
  ]);
  
  // Log the registration action
  logAction(data.email, 'NEW_USER', 'New registration - Referral Code: ' + myReferralCode);
  
  return { 
    status: 'success', 
    message: 'User registered successfully',
    referralCode: myReferralCode,
    user: {
      email: data.email,
      name: data.name,
      profilePic: data.profilePic ? String(data.profilePic) : ''
    }
  };
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
        // Log successful login
        logAction(values[i][2], 'USER_LOGIN', 'Login successful');
        
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
        logAction(inputStr, 'USER_LOGIN', 'Failed login attempt - invalid password');
        return { status: 'invalid_password', message: 'Invalid password' };
      }
    }
  }
  
  logAction(inputStr, 'USER_LOGIN', 'Failed login attempt - user not found');
  return { status: 'user_not_found', message: 'User not found' };
}

function handleOrderSubmission(data) {
  // Log received payload for verification
  console.log('Received Order Data:', JSON.stringify(data));
  
  var sheet = getSheet('Orders Sheet');
  var usersSheet = getSheet('Users Sheet');
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
  
  // Check if user joined via referral - apply 10% discount
  var userValues = usersSheet.getDataRange().getValues();
  var hasReferralDiscount = false;
  for (var i = 1; i < userValues.length; i++) {
    if (userValues[i][2] === data.email && userValues[i][8] !== '') { // Column C is email, Column I (index 8) is Referred_By
      hasReferralDiscount = true;
      totalAmount = totalAmount * 0.9; // Apply 10% discount
      break;
    }
  }

  // 2. PAID AMOUNT (What user actually paid now)
  // If transactionId exists, we assume the user paid the amount they entered/scanned.
  var paidAmount = data.transactionId ? (parseFloat(data.amount) || 0) : 0;
  
  // 3. DUE AMOUNT
  var dueAmount = totalAmount - paidAmount;
  
  // 4. TRANSACTION ID (if provided) - Robust assignment
  var transactionIds = (data.transactionId || data.utrNumber || 'N/A').toString().trim();
  
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
    (hasReferralDiscount ? 'Referral Discount Applied (10%)' : '') + (data.details ? ' ' + data.details : ''), // Column L
    timestamp       // Column M
  ]);

  sendOrderEmails(data, orderId, hasReferralDiscount, dueAmount);
  
  return { status: 'success', message: 'Order submitted', orderId: orderId, discountApplied: hasReferralDiscount };
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
function sendOrderEmails(data, orderId, hasReferralDiscount, dueAmount) {
  try {
    var adminEmail = "engagewebpot@gmail.com";
    var dashboardLink = "https://d:\My_Repos\Webpot-Store\dashboard.html";
    
    // Client Confirmation Email - Casual and Friendly
    var firstName = data.name.split(" ")[0];
    var clientHtmlBody = `
      <!DOCTYPE html>
      <html>
      <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
              .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); overflow: hidden; }
              .header { background: linear-gradient(135deg, #020511 0%, #0f1425 100%); color: #00d4ff; padding: 30px 20px; text-align: center; }
              .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
              .content { padding: 30px 20px; color: #333; }
              .content h2 { color: #020511; margin-top: 0; font-size: 20px; }
              .highlight-box { background-color: #f0f9ff; border-left: 4px solid #00d4ff; padding: 15px; margin: 20px 0; border-radius: 4px; }
              .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
              .detail-label { font-weight: 600; color: #555; }
              .detail-value { color: #00d4ff; font-weight: 600; }
              .cta-button { display: inline-block; background: linear-gradient(135deg, #00d4ff 0%, #0099cc 100%); color: #000; padding: 12px 30px; text-decoration: none; border-radius: 4px; font-weight: 600; margin: 20px 0; text-align: center; }
              .footer { background-color: #f9f9f9; padding: 20px; text-align: center; font-size: 12px; color: #999; border-top: 1px solid #eee; }
              .discount-badge { background-color: #4caf50; color: white; padding: 5px 10px; border-radius: 4px; font-size: 12px; font-weight: 600; }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <h1>🎉 Order Received!</h1>
              </div>
              <div class="content">
                  <h2>Hey ${firstName}! 👋</h2>
                  <p style="font-size: 16px; line-height: 1.6;">Thanks for choosing <strong>Webpot</strong>! We've received your request for the <strong>${data.service} plan</strong> and we're pumped to get started.</p>
                  
                  <div class="highlight-box">
                      <h3 style="margin-top: 0; color: #020511;">Order Details</h3>
                      <div class="detail-row">
                          <span class="detail-label">Order ID:</span>
                          <span class="detail-value">${orderId}</span>
                      </div>
                      <div class="detail-row">
                          <span class="detail-label">Service:</span>
                          <span class="detail-value">${data.service}</span>
                      </div>
                      <div class="detail-row">
                          <span class="detail-label">Total Amount:</span>
                          <span class="detail-value">₹${(parseFloat(data.amount) * (hasReferralDiscount ? 0.9 : 1)).toLocaleString('en-IN', {minimumFractionDigits: 0})}</span>
                      </div>
                      <div class="detail-row">
                          <span class="detail-label">Due Amount:</span>
                          <span class="detail-value">₹${dueAmount.toLocaleString('en-IN', {minimumFractionDigits: 0})}</span>
                      </div>
                      ${hasReferralDiscount ? '<div class="detail-row"><span class="detail-label">Discount:</span><span><span class="discount-badge">10% Referral Discount Applied</span></span></div>' : ''}
                  </div>
                  
                  <p style="font-size: 15px; line-height: 1.6;">You can track everything and pay your balance here:</p>
                  <div style="text-align: center;">
                      <a href="${dashboardLink}" class="cta-button">Go to Your Dashboard</a>
                  </div>
                  
                  <p style="font-size: 14px; color: #666; margin-top: 20px;">Our team will reach out soon with more details about your project. If you have any questions, just hit reply to this email!</p>
              </div>
              <div class="footer">
                  <p style="margin: 0;">Made with ❤️ by Webpot | engagewebpot@gmail.com</p>
              </div>
          </div>
      </body>
      </html>
    `;
    
    // Send Client Email
    MailApp.sendEmail({
      to: data.email,
      subject: "🎉 Your Order is Confirmed - Webpot (" + orderId + ")",
      htmlBody: clientHtmlBody
    });
    
    // Admin Alert Email
    var adminHtmlBody = `
      <div style="font-family: 'Segoe UI', sans-serif; background-color: #f5f5f5; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <div style="background: linear-gradient(135deg, #020511 0%, #0f1425 100%); color: #00d4ff; padding: 20px; text-align: center;">
                  <h2 style="margin: 0;">💰 New Order: ${orderId}</h2>
              </div>
              <div style="padding: 20px;">
                  <table style="width: 100%; border-collapse: collapse;">
                      <tr style="border-bottom: 1px solid #eee;">
                          <td style="padding: 10px; font-weight: 600;">Client Name:</td>
                          <td style="padding: 10px;">${data.name}</td>
                      </tr>
                      <tr style="border-bottom: 1px solid #eee; background-color: #f9f9f9;">
                          <td style="padding: 10px; font-weight: 600;">Email:</td>
                          <td style="padding: 10px;">${data.email}</td>
                      </tr>
                      <tr style="border-bottom: 1px solid #eee;">
                          <td style="padding: 10px; font-weight: 600;">Phone:</td>
                          <td style="padding: 10px;">${data.phone || 'N/A'}</td>
                      </tr>
                      <tr style="border-bottom: 1px solid #eee; background-color: #f9f9f9;">
                          <td style="padding: 10px; font-weight: 600;">Service:</td>
                          <td style="padding: 10px; color: #00d4ff; font-weight: 600;">${data.service}</td>
                      </tr>
                      <tr style="border-bottom: 1px solid #eee;">
                          <td style="padding: 10px; font-weight: 600;">Total Amount:</td>
                          <td style="padding: 10px; color: #00d4ff; font-weight: 600;">₹${(parseFloat(data.amount) * (hasReferralDiscount ? 0.9 : 1)).toLocaleString('en-IN', {minimumFractionDigits: 0})}</td>
                      </tr>
                      <tr style="background-color: #f9f9f9;">
                          <td style="padding: 10px; font-weight: 600;">Due Amount:</td>
                          <td style="padding: 10px; color: #f44336; font-weight: 600;">₹${dueAmount.toLocaleString('en-IN', {minimumFractionDigits: 0})}</td>
                      </tr>
                  </table>
                  ${hasReferralDiscount ? '<p style="background-color: #e8f5e9; padding: 10px; border-radius: 4px; color: #2e7d32; margin-top: 15px;"><strong>ℹ️ Referral Discount Applied: 10%</strong></p>' : ''}
              </div>
          </div>
      </div>
    `;
    
    // Send Admin Alert
    MailApp.sendEmail({
      to: adminEmail,
      subject: "💰 New Order: " + orderId + " - " + data.service,
      htmlBody: adminHtmlBody
    });
    
  } catch (e) {
    console.error("Email error: " + e.toString());
  }
}

// ---------------- ADMIN HANDLERS ----------------

function handleGetAllOrders(data) {
  // Verify admin key
  var ADMIN_KEY = 'WebpotAdmin2026';
  if (data.adminKey !== ADMIN_KEY) {
    return { status: 'error', message: 'Invalid admin key' };
  }
  
  var sheet = getSheet('Orders Sheet');
  var values = sheet.getDataRange().getValues();
  var allOrders = [];
  
  // Skip header row (start at i=1)
  for (var i = 1; i < values.length; i++) {
    allOrders.push({
      date: values[i][0],
      orderId: values[i][1],
      name: values[i][2],
      email: values[i][3],
      phone: values[i][4],
      service: values[i][5],
      totalAmount: values[i][6],
      paidAmount: values[i][7],
      dueAmount: values[i][8],
      transactionId: values[i][9],
      status: values[i][10],
      details: values[i][11],
      updated: values[i][12]
    });
  }
  
  return { status: 'success', orders: allOrders };
}

function handleUpdateStatus(data) {
  // Verify admin key
  var ADMIN_KEY = 'WebpotAdmin2026';
  if (data.adminKey !== ADMIN_KEY) {
    return { status: 'error', message: 'Invalid admin key' };
  }
  
  var sheet = getSheet('Orders Sheet');
  var values = sheet.getDataRange().getValues();
  var rowIndex = -1;
  var userEmail = '';
  var userName = '';
  
  // Find the order by Order ID (Column B, Index 1)
  for (var i = 1; i < values.length; i++) {
    if (values[i][1] === data.orderId) {
      rowIndex = i + 1; // 1-based index for Sheet API
      userEmail = values[i][3]; // Column D: Email
      userName = values[i][2];  // Column C: Name
      break;
    }
  }
  
  if (rowIndex === -1) {
    return { status: 'error', message: 'Order ID not found' };
  }
  
  // Update Status column (Column K = Column 11, 1-based = column 11)
  sheet.getRange(rowIndex, 11).setValue(data.status);
  sheet.getRange(rowIndex, 13).setValue(new Date()); // Update timestamp
  
  // Send email notification if status is set to Active
  if (data.status === 'Active') {
    try {
      var firstName = userName.split(" ")[0];
      MailApp.sendEmail({
        to: userEmail,
        subject: "Your Order is Now Active - Webpot",
        htmlBody: "<h2>Great News, " + firstName + "!</h2><p>Your order <strong>" + data.orderId + "</strong> is now <strong>Active</strong>.</p><p>We will begin working on your project right away. You can track the progress in your Dashboard.</p><p>Thank you for choosing Webpot!</p>"
      });
    } catch (e) {
      console.error("Email notification error: " + e.toString());
    }
  }
  
  return { status: 'success', message: 'Order status updated to ' + data.status };
}

// ============== FEATURE 1: FORGOT PASSWORD ==============

function handleRequestReset(data) {
  var email = data.email;
  if (!email) {
    return { status: 'error', message: 'Email is required' };
  }

  var sheet = getSheet('Users Sheet');
  var values = sheet.getDataRange().getValues();
  var userExists = false;
  var userName = '';

  for (var i = 1; i < values.length; i++) {
    if (values[i][2] === email) {
      userExists = true;
      userName = values[i][1];
      break;
    }
  }

  if (!userExists) {
    return { status: 'error', message: 'Email not found' };
  }

  var resetCode = String(Math.floor(Math.random() * 900000) + 100000);
  var expiryTime = new Date(Date.now() + 15 * 60 * 1000);

  var scriptProperties = PropertiesService.getScriptProperties();
  var resetKey = 'reset_' + email;
  scriptProperties.setProperty(resetKey, JSON.stringify({
    code: resetCode,
    expiry: expiryTime.getTime()
  }));

  try {
    var firstName = userName.split(" ")[0];
    MailApp.sendEmail({
      to: email,
      subject: "Password Reset Code - Webpot",
      htmlBody: "<h2>Password Reset Request</h2>" +
                "<p>Hi " + firstName + ",</p>" +
                "<p>You requested a password reset. Use this code to reset your password:</p>" +
                "<h3 style='background:#00d4ff; padding:10px; text-align:center; border-radius:5px; color:#000;'>" + resetCode + "</h3>" +
                "<p>This code expires in 15 minutes.</p>" +
                "<p>If you didn't request this, ignore this email.</p>" +
                "<p>Regards, Webpot Team</p>"
    });
  } catch (e) {
    console.error("Email error: " + e.toString());
  }

  return { status: 'success', message: 'Reset code sent to your email' };
}

function handleVerifyReset(data) {
  var email = data.email;
  var code = String(data.code);
  var newPassword = data.newPassword;

  if (!email || !code || !newPassword) {
    return { status: 'error', message: 'All fields are required' };
  }

  var scriptProperties = PropertiesService.getScriptProperties();
  var resetKey = 'reset_' + email;
  var storedData = scriptProperties.getProperty(resetKey);

  if (!storedData) {
    return { status: 'error', message: 'No reset request found. Request a new code.' };
  }

  var resetInfo = JSON.parse(storedData);
  var now = Date.now();

  if (now > resetInfo.expiry) {
    scriptProperties.deleteProperty(resetKey);
    return { status: 'error', message: 'Reset code expired. Request a new one.' };
  }

  if (resetInfo.code !== code) {
    return { status: 'error', message: 'Invalid reset code' };
  }

  var sheet = getSheet('Users Sheet');
  var values = sheet.getDataRange().getValues();

  for (var i = 1; i < values.length; i++) {
    if (values[i][2] === email) {
      sheet.getRange(i + 1, 4).setValue(newPassword);
      break;
    }
  }

  scriptProperties.deleteProperty(resetKey);

  try {
    MailApp.sendEmail({
      to: email,
      subject: "Password Reset Successful - Webpot",
      htmlBody: "<h2>Password Updated</h2>" +
                "<p>Your password has been reset successfully.</p>" +
                "<p>You can now log in with your new password.</p>" +
                "<p>If you didn't do this, please contact support.</p>"
    });
  } catch (e) {
    console.error("Email error: " + e.toString());
  }

  return { status: 'success', message: 'Password reset successful. You can now log in.' };
}

// ============== FEATURE 3: ADMIN USER MANAGEMENT ==============

function handleGetAllUsers(data) {
  var ADMIN_KEY = 'WebpotAdmin2026';
  if (data.adminKey !== ADMIN_KEY) {
    return { status: 'error', message: 'Invalid admin key' };
  }

  var sheet = getSheet('Users Sheet');
  var values = sheet.getDataRange().getValues();
  var allUsers = [];

  for (var i = 1; i < values.length; i++) {
    allUsers.push({
      name: values[i][1],
      email: values[i][2],
      phone: values[i][4],
      status: values[i][5],
      created: values[i][6]
    });
  }

  return { status: 'success', users: allUsers };
}

function handleBanUser(data) {
  var ADMIN_KEY = 'WebpotAdmin2026';
  if (data.adminKey !== ADMIN_KEY) {
    return { status: 'error', message: 'Invalid admin key' };
  }

  var email = data.email;
  var sheet = getSheet('Users Sheet');
  var values = sheet.getDataRange().getValues();

  for (var i = 1; i < values.length; i++) {
    if (values[i][2] === email) {
      sheet.getRange(i + 1, 6).setValue('Banned');
      return { status: 'success', message: 'User banned successfully' };
    }
  }

  return { status: 'error', message: 'User not found' };
}

// ============== FEATURE 4: TESTIMONIALS ==============

function handleSubmitReview(data) {
  var sheet = getSheet('Testimonials');
  var timestamp = new Date();

  sheet.appendRow([
    timestamp,
    data.name || 'Anonymous',
    data.email,
    data.service,
    data.rating,
    data.comment,
    'Pending'
  ]);

  return { status: 'success', message: 'Review submitted. Thank you!' };
}

function handleGetPublicReviews(data) {
  var sheet = getSheet('Testimonials');
  var values = sheet.getDataRange().getValues();
  var publicReviews = [];

  for (var i = 1; i < values.length; i++) {
    if (values[i][6] === 'Approved') {
      publicReviews.push({
        name: values[i][1],
        service: values[i][3],
        rating: values[i][4],
        comment: values[i][5]
      });
    }
  }

  return { status: 'success', reviews: publicReviews };
}

// ============== FEATURE 5: 2FA (EMAIL OTP) ==============

function handleUserLoginModified(data) {
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
        if (values[i][5] === 'Banned') {
          return { status: 'user_banned', message: 'This account has been banned' };
        }

        var otp = String(Math.floor(Math.random() * 900000) + 100000);
        var expiryTime = new Date(Date.now() + 10 * 60 * 1000);

        var scriptProperties = PropertiesService.getScriptProperties();
        var otpKey = 'login_otp_' + sheetEmail;
        scriptProperties.setProperty(otpKey, JSON.stringify({
          otp: otp,
          expiry: expiryTime.getTime(),
          password: data.password
        }));

        try {
          var firstName = values[i][1].split(" ")[0];
          MailApp.sendEmail({
            to: sheetEmail,
            subject: "Login Verification Code - Webpot",
            htmlBody: "<h2>Two-Factor Authentication</h2>" +
                      "<p>Hi " + firstName + ",</p>" +
                      "<p>Your login verification code is:</p>" +
                      "<h3 style='background:#00d4ff; padding:10px; text-align:center; border-radius:5px; color:#000;'>" + otp + "</h3>" +
                      "<p>This code expires in 10 minutes.</p>" +
                      "<p>If you didn't try to log in, ignore this email.</p>"
          });
        } catch (e) {
          console.error("Email error: " + e.toString());
        }

        return {
          status: 'otp_required',
          message: 'OTP sent to your email',
          email: sheetEmail
        };
      } else {
        return { status: 'invalid_password', message: 'Invalid password' };
      }
    }
  }

  return { status: 'user_not_found', message: 'User not found' };
}

function handleVerifyLoginOTP(data) {
  var email = data.email;
  var otp = String(data.otp);

  if (!email || !otp) {
    return { status: 'error', message: 'Email and OTP are required' };
  }

  var scriptProperties = PropertiesService.getScriptProperties();
  var otpKey = 'login_otp_' + email;
  var storedData = scriptProperties.getProperty(otpKey);

  if (!storedData) {
    return { status: 'error', message: 'No OTP found. Request a new login.' };
  }

  var otpInfo = JSON.parse(storedData);
  var now = Date.now();

  if (now > otpInfo.expiry) {
    scriptProperties.deleteProperty(otpKey);
    return { status: 'error', message: 'OTP expired. Please log in again.' };
  }

  if (otpInfo.otp !== otp) {
    return { status: 'error', message: 'Invalid OTP' };
  }

  var sheet = getSheet('Users Sheet');
  var values = sheet.getDataRange().getValues();

  for (var i = 1; i < values.length; i++) {
    if (values[i][2] === email) {
      scriptProperties.deleteProperty(otpKey);
      return {
        status: 'success',
        message: 'Login successful',
        user: {
          name: values[i][1],
          email: values[i][2],
          phone: values[i][4],
          status: values[i][5],
          profilePic: String(values[i][10] || '')  // Column K (index 10) = Profile_Pic
        }
      };
    }
  }

  return { status: 'error', message: 'User not found' };
}

// ============== REFERRAL SYSTEM ==============

function generateReferralCode(name) {
  var prefix = 'WEBPOT-';
  var namePrefix = name.substring(0, 3).toUpperCase();
  if (namePrefix.length < 3) {
    namePrefix = namePrefix + Math.random().toString(36).substring(2, 5).toUpperCase();
  }
  var randomDigits = Math.floor(Math.random() * 900) + 100;
  return prefix + namePrefix + randomDigits;
}

function logReferral(referrerEmail, referredEmail) {
  var sheet = getSheet('Referrals');
  if (!sheet) {
    try {
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      sheet = ss.insertSheet('Referrals');
      sheet.appendRow(['Referrer Email', 'Referred User Email', 'Date', 'Status']);
    } catch (e) {
      Logger.log('Error creating Referrals sheet: ' + e);
      return;
    }
  }
  
  sheet.appendRow([
    referrerEmail,
    referredEmail,
    new Date(),
    'Completed'
  ]);
}

// ============== AUDIT LOGGING ==============

function logAction(actorEmail, actionType, details) {
  var sheet = getSheet('Audit_Logs');
  if (!sheet) {
    try {
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      sheet = ss.insertSheet('Audit_Logs');
      sheet.appendRow(['Timestamp', 'Actor Email', 'Action Type', 'Target ID/Details']);
    } catch (e) {
      Logger.log('Error creating Audit_Logs sheet: ' + e);
      return;
    }
  }
  
  sheet.appendRow([
    new Date(),
    actorEmail,
    actionType,
    details
  ]);
}

// ============== BACKUP SYSTEM ==============

function createDailyBackup() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var ssId = ss.getId();
    var ssName = ss.getName();
    
    // Format current date as YYYY-MM-DD
    var today = new Date();
    var dateStr = Utilities.formatDate(today, Session.getScriptTimeZone(), 'yyyy-MM-dd');
    
    // Create backup file name
    var backupName = 'Webpot_DB_Backup_' + dateStr;
    
    // Get the file to copy
    var originalFile = DriveApp.getFileById(ssId);
    
    // Make a copy
    var backupFile = originalFile.makeCopy(backupName);
    
    // Get or create 'Webpot Backups' folder
    var backupFolder = null;
    var folders = DriveApp.getFoldersByName('Webpot Backups');
    
    if (folders.hasNext()) {
      backupFolder = folders.next();
    } else {
      backupFolder = DriveApp.createFolder('Webpot Backups');
    }
    
    // Move backup file to folder
    var parentFolders = backupFile.getParents();
    while (parentFolders.hasNext()) {
      parentFolders.next().removeFile(backupFile);
    }
    backupFolder.addFile(backupFile);
    
    // Log the backup action
    logAction('System', 'DAILY_BACKUP', 'Backup created: ' + backupName);
    
    Logger.log('Backup created successfully: ' + backupName);
  } catch (e) {
    Logger.log('Error creating backup: ' + e);
  }
}