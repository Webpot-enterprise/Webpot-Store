const SPREADSHEET = SpreadsheetApp.getActiveSpreadsheet();

// Helper to safely get sheet
function getSheet(sheetName) {
  var sheet = SPREADSHEET.getSheetByName(sheetName);
  // This check prevents "Silent Crashes" if a sheet is missing
  if (!sheet) throw new Error("Sheet not found: " + sheetName);
  return sheet;
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  // Wait up to 10s for other users to finish (prevents collision)
  lock.tryLock(10000);

  try {
    // 1. Parse Data
    var data = JSON.parse(e.postData.contents);
    var formType = data.formType;
    var response = { status: 'error', message: 'Invalid form type' };
    
    // 2. Route to Handler
    switch(formType) {
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
      default:
        response = { status: 'error', message: 'Unknown form type' };
    }
    
    // 3. Return JSON (Let Google handle the Headers automatically)
    return ContentService.createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch(error) {
    // Return error as JSON so the frontend sees it instead of a CORS failure
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
    
  } finally {
    lock.releaseLock();
  }
}

// ---------------- HANDLERS ----------------

function handleUserRegistration(data) {
  var sheet = getSheet('Users Sheet');
  var values = sheet.getDataRange().getValues();
  
  // Check duplicates (Column C = index 2)
  for (var i = 1; i < values.length; i++) {
    if (values[i][2] === data.email) {
      return { status: 'error', message: 'User already exists' };
    }
  }
  
  var timestamp = new Date();
  // Columns: Date, Name, Email, Password, Status, Created
  sheet.appendRow([timestamp, data.name, data.email, data.password, 'active', timestamp]);
  return { status: 'success', message: 'User registered successfully' };
}

function handleUserLogin(data) {
  var sheet = getSheet('Users Sheet');
  var values = sheet.getDataRange().getValues();
  
  for (var i = 1; i < values.length; i++) {
    if (values[i][2] === data.email) {
      if (values[i][3] === data.password) {
        return { 
          status: 'success', 
          message: 'Login successful',
          user: { name: values[i][1], email: values[i][2], status: values[i][4] }
        };
      } else {
        return { status: 'error', message: 'Invalid password' };
      }
    }
  }
  return { status: 'user_not_found', message: 'User not found' };
}

function handleOrderSubmission(data) {
  var sheet = getSheet('Orders Sheet');
  var timestamp = new Date();
  var orderId = 'ORD-' + Date.now();
  
  sheet.appendRow([
    timestamp, 
    orderId, 
    data.name, 
    data.email, 
    data.phone, 
    data.service, 
    data.amount || 0, 
    'pending', 
    data.details || '', 
    'No'
  ]);
  
  return { status: 'success', message: 'Order submitted', orderId: orderId };
}

function handleContactInquiry(data) {
  var sheet = getSheet('Contact_Inquires Sheet');
  var timestamp = new Date();
  sheet.appendRow([timestamp, data.name, data.email, data.phone, data.message, 'new']);
  return { status: 'success', message: 'Contact inquiry submitted' };
}