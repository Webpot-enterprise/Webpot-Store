# Guide: Zero-Cost Backend with Google Sheets & Apps Script

This guide explains how to turn a standard Google Sheet into a working database and API for your website. This allows you to receive data (like contact forms) and fetch data without paying for a server.

---

## Part A: Prepare the Google Sheet

1. Go to **Google Sheets** and create a New Spreadsheet named `Webpot Backend`.
2. Create the following sheets (tabs) with their respective columns:

### Sheet 1: Users Sheet
| Column | Header |
|--------|--------|
| A | Date |
| B | Name |
| C | Email |
| D | Password |
| E | Status |
| F | Created |

### Sheet 2: Orders Sheet
| Column | Header |
|--------|--------|
| A | Date |
| B | Order ID |
| C | Name |
| D | Email |
| E | Phone |
| F | Service |
| G | Amount |
| H | Status |
| I | Details |
| J | Paid |

### Sheet 3: Contact_Inquires Sheet
| Column | Header |
|--------|--------|
| A | Date |
| B | Name |
| C | Email |
| D | Phone |
| E | Message |
| F | Status |

### Sheet 4: Settings Sheet
| Column | Header |
|--------|--------|
| A | Setting |
| B | Value |

**Pre-configured Settings:**
- Admin Email: `engagewebpot@gmail.com`

---

## Part B: Create the Backend API

1. In your Google Sheet, click **Extensions** > **Apps Script**.
2. Delete any code currently in the `Code.gs` file.
3. Copy and paste the following code entirely:

```javascript
// WEBPOT BACKEND - GOOGLE APPS SCRIPT
// Handles all form submissions and data retrieval from Google Sheets
// ============================================================================

const SPREADSHEET = SpreadsheetApp.getActiveSpreadsheet();

// Helper function to get sheet by name
function getSheet(sheetName) {
  return SPREADSHEET.getSheetByName(sheetName);
}

// Helper function to get setting value
function getSetting(settingName) {
  const settingsSheet = getSheet('Settings Sheet');
  const data = settingsSheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === settingName) {
      return data[i][1];
    }
  }
  return null;
}

// Handle POST requests - Main form submission handler
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const formType = data.formType;
    
    let response = { status: 'error', message: 'Invalid form type' };
    
    // Route to appropriate handler based on form type
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
    
    return ContentService.createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON);
  } catch(error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// Handle user registration
function handleUserRegistration(data) {
  try {
    const usersSheet = getSheet('Users Sheet');
    const values = usersSheet.getDataRange().getValues();
    
    // Check if user already exists
    for (let i = 1; i < values.length; i++) {
      if (values[i][2] === data.email) { // Column C is Email
        return { status: 'error', message: 'Email already exists' };
      }
    }
    
    // Add new user
    const timestamp = new Date();
    usersSheet.appendRow([
      timestamp, // Column A: Date
      data.name, // Column B: Name
      data.email, // Column C: Email
      data.password, // Column D: Password
      'active', // Column E: Status
      timestamp // Column F: Created
    ]);
    
    return { status: 'success', message: 'User registered successfully' };
  } catch(error) {
    return { status: 'error', message: error.toString() };
  }
}

// Handle user login (validation)
function handleUserLogin(data) {
  try {
    const usersSheet = getSheet('Users Sheet');
    const values = usersSheet.getDataRange().getValues();
    
    // Find user and validate password
    for (let i = 1; i < values.length; i++) {
      if (values[i][2] === data.email) { // Column C is Email
        if (values[i][3] === data.password) { // Column D is Password
          return { 
            status: 'success', 
            message: 'Login successful',
            user: {
              name: values[i][1],
              email: values[i][2],
              status: values[i][4]
            }
          };
        } else {
          return { status: 'error', message: 'Invalid password' };
        }
      }
    }
    
    return { status: 'user_not_found', message: 'User not found' };
  } catch(error) {
    return { status: 'error', message: error.toString() };
  }
}

// Handle order submission
function handleOrderSubmission(data) {
  try {
    const ordersSheet = getSheet('Orders Sheet');
    const timestamp = new Date();
    
    // Generate Order ID
    const orderId = 'ORD-' + Date.now();
    
    ordersSheet.appendRow([
      timestamp, // Column A: Date
      orderId, // Column B: Order ID
      data.name, // Column C: Name
      data.email, // Column D: Email
      data.phone, // Column E: Phone
      data.service, // Column F: Service
      data.amount || 0, // Column G: Amount
      'pending', // Column H: Status
      data.details || '', // Column I: Details
      'No' // Column J: Paid
    ]);
    
    return { 
      status: 'success', 
      message: 'Order submitted successfully',
      orderId: orderId
    };
  } catch(error) {
    return { status: 'error', message: error.toString() };
  }
}

// Handle contact inquiry
function handleContactInquiry(data) {
  try {
    const contactSheet = getSheet('Contact_Inquires Sheet');
    const timestamp = new Date();
    
    contactSheet.appendRow([
      timestamp, // Column A: Date
      data.name, // Column B: Name
      data.email, // Column C: Email
      data.phone, // Column D: Phone
      data.message, // Column E: Message
      'new' // Column F: Status
    ]);
    
    return { 
      status: 'success', 
      message: 'Contact inquiry submitted successfully' 
    };
  } catch(error) {
    return { status: 'error', message: error.toString() };
  }
}

// Handle GET requests - Retrieve data (with optional filtering)
function doGet(e) {
  try {
    const sheetName = e.parameter.sheet || 'Users Sheet';
    const sheet = getSheet(sheetName);
    
    if (!sheet) {
      return ContentService.createTextOutput(JSON.stringify({
        status: 'error',
        message: 'Sheet not found'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    const data = sheet.getDataRange().getValues();
    
    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      sheet: sheetName,
      data: data
    })).setMimeType(ContentService.MimeType.JSON);
  } catch(error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
```

---

## Part C: Deploy as Web App

1. In Apps Script editor, click **Deploy** → **New Deployment**
2. Select **Type**: Web app
3. Set **Execute as**: Your Google Account
4. Set **Who has access**: Anyone
5. Copy the deployment URL (you'll use this in your JavaScript)

---

## Part D: Update Frontend JavaScript

Use the following code in your frontend JavaScript files to interact with the backend:

### Example: Contact Form Submission

```javascript
async function submitContactForm(formData) {
  const APPS_SCRIPT_URL = 'YOUR_DEPLOYMENT_URL_HERE';
  
  try {
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        formType: 'contact',
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        message: formData.message
      })
    });
    
    const result = await response.json();
    return result;
  } catch(error) {
    console.error('Error:', error);
    return { status: 'error', message: error.toString() };
  }
}
```

### Example: Order Submission

```javascript
async function submitOrder(orderData) {
  const APPS_SCRIPT_URL = 'YOUR_DEPLOYMENT_URL_HERE';
  
  try {
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        formType: 'order',
        name: orderData.name,
        email: orderData.email,
        phone: orderData.phone,
        service: orderData.service,
        amount: orderData.amount,
        details: orderData.details
      })
    });
    
    const result = await response.json();
    return result;
  } catch(error) {
    console.error('Error:', error);
    return { status: 'error', message: error.toString() };
  }
}
```

---

## Sheet Structure Summary

**Total Sheets**: 4
- Users Sheet: User accounts & authentication
- Orders Sheet: Service orders & transactions
- Contact_Inquires Sheet: Website inquiries
- Settings Sheet: Configuration & constants

**Admin Email**: engagewebpot@gmail.com
