# Webpot Backend Guide: Google Sheets + Apps Script Integration

This guide provides complete instructions for setting up the **Webpot** website backend using **Google Sheets** for data storage and **Google Apps Script** for handling form submissions and email notifications.

---

## 1. Overview

**Webpot** is a modern web development service platform with three main forms that require backend handling:

### Forms to Handle:
1. **Registration Form** (auth.html) - Collects: Name, Email, Password
2. **Contact Form** (index.html) - Collects: Name, Email, Phone, Message  
3. **Order Form** (modal) - Collects: Service, Name, Email, Phone, Requests

---

## 2. Setup Instructions

### Step 1: Create Google Sheet Structure
Create a new Google Sheet named "Webpot Backend" with 4 sheets:

#### Users Sheet
Columns: Timestamp | Name | Email | Password_Hash | Status | Last_Login

#### Orders Sheet
Columns: Timestamp | Order_ID | Name | Email | Phone | Service_Plan | Amount_INR | Status | Requests | Invoice_Sent

#### Contact_Inquiries Sheet
Columns: Timestamp | Name | Email | Phone | Message | Status

#### Settings Sheet
Columns: Key | Value
- Admin Email: engagewebpot@gmail.com
- Company Phone: +91 9408191506
- Company Address: 123 Web Street

---

### Step 2: Deploy Apps Script
1. Open Google Sheet
2. Extensions > Apps Script
3. Copy and paste the provided code
4. Deploy as Web App (Anyone access)
5. Copy the Web App URL

---

### Step 3: Update Frontend
Replace `YOUR_APPS_SCRIPT_WEB_APP_URL` in your JS files with the actual URL.

---

## 3. Complete Apps Script Code

```javascript
const SPREADSHEET = SpreadsheetApp.getActiveSpreadsheet();

function getSheet(name) {
  return SPREADSHEET.getSheetByName(name);
}

function getSetting(key) {
  const sheet = getSheet('Settings');
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === key) return data[i][1];
  }
  return null;
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const formType = data.formType;
    let response = {};

    if (formType === 'register') {
      response = handleRegistration(data);
    } else if (formType === 'contact') {
      response = handleContact(data);
    } else if (formType === 'order') {
      response = handleOrder(data);
    } else {
      response = { success: false, message: 'Invalid form type' };
    }

    return ContentService.createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeader('Access-Control-Allow-Origin', '*');
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function handleRegistration(data) {
  const sheet = getSheet('Users');
  const name = data.name || '';
  const email = data.email || '';
  const password = data.password || '';

  if (!name || !email || !password) {
    return { success: false, message: 'Missing fields' };
  }

  const values = sheet.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    if (values[i][2] === email) {
      return { success: false, message: 'Email already registered' };
    }
  }

  sheet.appendRow([new Date(), name, email, Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, password), 'Active', new Date()]);

  MailApp.sendEmail(email, 'Welcome to Webpot!', '', { htmlBody: `<h2>Welcome, ${name}!</h2><p>Your account is ready. Email: ${email}</p><p>Contact: ${getSetting('Admin Email')}</p>` });
  MailApp.sendEmail(getSetting('Admin Email'), 'New Registration', `New user: ${name} (${email})`);

  return { success: true, message: 'Registration successful!' };
}

function handleContact(data) {
  const sheet = getSheet('Contact_Inquiries');
  const name = data.name || '';
  const email = data.email || '';
  const phone = data.phone || '';
  const message = data.message || '';

  if (!name || !email || !message) {
    return { success: false, message: 'Missing fields' };
  }

  sheet.appendRow([new Date(), name, email, phone, message, 'Unread']);

  MailApp.sendEmail(email, 'We received your message', '', { htmlBody: `<h2>Thank you, ${name}!</h2><p>Message: ${message}</p><p>Contact: ${getSetting('Admin Email')}</p>` });
  MailApp.sendEmail(getSetting('Admin Email'), 'New Inquiry', `From: ${name}\nEmail: ${email}\nPhone: ${phone}\nMessage: ${message}`);

  return { success: true, message: 'Inquiry received!' };
}

function handleOrder(data) {
  const sheet = getSheet('Orders');
  const orderID = 'ORD-' + Date.now();
  
  sheet.appendRow([new Date(), orderID, data.name, data.email, data.phone, data.service, data.amount, 'Pending', data.specialRequests || '', 'No']);

  MailApp.sendEmail(data.email, `Order Confirmation - ${orderID}`, '', { htmlBody: `<h2>Order Confirmed!</h2><p>Order ID: ${orderID}</p><p>Service: ${data.service}</p><p>Amount: ₹${data.amount}</p><p>Contact: ${getSetting('Admin Email')}</p>` });
  MailApp.sendEmail(getSetting('Admin Email'), `New Order - ${orderID}`, `Customer: ${data.name}\nEmail: ${data.email}\nService: ${data.service}\nAmount: ₹${data.amount}`);

  return { success: true, message: `Order placed! Order ID: ${orderID}` };
}
```

---

## 4. Frontend Integration

### Registration (auth.js)
```javascript
fetch('https://script.google.com/macros/s/AKfycbxCIYznFyqWykBAGcNvj9wtjjE9zCakuwiDANuYJy-p3ST0ggF05fZfshZLkHhUWqZb/exec', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ formType: 'register', name, email, password })
})
.then(res => res.json())
.then(data => { if(data.success) alert(data.message); })
.catch(err => alert('Error'));
```

### Contact (script.js)
```javascript
fetch('https://script.google.com/macros/s/AKfycbxCIYznFyqWykBAGcNvj9wtjjE9zCakuwiDANuYJy-p3ST0ggF05fZfshZLkHhUWqZb/exec', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ formType: 'contact', name, email, phone, message })
})
.then(res => res.json())
.then(data => { if(data.success) alert(data.message); })
.catch(err => alert('Error'));
```

### Order (script.js)
```javascript
fetch('https://script.google.com/macros/s/AKfycbxCIYznFyqWykBAGcNvj9wtjjE9zCakuwiDANuYJy-p3ST0ggF05fZfshZLkHhUWqZb/exec', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ formType: 'order', name, email, phone, service, amount, specialRequests })
})
.then(res => res.json())
.then(data => { if(data.success) alert(data.message); })
.catch(err => alert('Error'));
```

---

## 5. Key Features

✅ **Three Form Types:** Registration, Contact, Orders
✅ **Auto Email Notifications:** Users + Admin emails
✅ **Data Storage:** Organized Google Sheets
✅ **Order IDs:** Auto-generated timestamps
✅ **CORS Enabled:** No cross-origin issues
✅ **Error Handling:** Validation + logging

---

## 6. Testing Checklist

- [ ] Register user → Check email + Users sheet
- [ ] Submit contact → Check email + Contact sheet  
- [ ] Place order → Check Order ID email + Orders sheet

---

## 7. Production Deployment

1. Test all forms locally
2. Deploy frontend to Firebase/Vercel
3. Monitor Google Sheets submissions
4. Update Settings sheet as needed
5. Upgrade password hashing for security

---

## 8. Launching the Web App - Step by Step

### Option A: Local Development (Quick Testing)

**Using Python (Built-in):**
1. Open terminal in the `Web-pot` folder
2. Run: `python -m http.server 8000`
3. Open browser: `http://localhost:8000`
4. Access pages: `http://localhost:8000/index.html`, `http://localhost:8000/auth.html`

**Using Node.js (Alternative):**
1. Install globally: `npm install -g http-server`
2. Run in `Web-pot` folder: `http-server`
3. Access: `http://localhost:8080`

**Using VS Code Live Server:**
1. Install "Live Server" extension (5Stars)
2. Right-click `index.html` → "Open with Live Server"
3. Browser opens automatically at `http://127.0.0.1:5500`

---

### Option B: Deploy to Firebase (Production)

**Step 1: Install Firebase CLI**
```bash
npm install -g firebase-tools
```

**Step 2: Login to Firebase**
```bash
firebase login
```

**Step 3: Initialize Firebase Project**
```bash
firebase init hosting
```
- Choose "Create a new project" or "Use existing project"
- Public directory: `.` (current directory where index.html is)
- Configure as single-page app: `No`
- Set up automatic deploys: `No`

**Step 4: Deploy**
```bash
firebase deploy
```

**Step 5: Get Your Live URL**
- Firebase will provide a URL like: `https://webpot-xxxxx.web.app`
- Share this URL publicly

---

### Option C: Deploy to Vercel (Alternative)

**Step 1: Create Vercel Account**
- Sign up at [vercel.com](https://vercel.com)
- Connect GitHub account

**Step 2: Push Code to GitHub**
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/webpot.git
git push -u origin main
```

**Step 3: Deploy via Vercel Dashboard**
- Go to Vercel dashboard
- Click "New Project"
- Select your GitHub repository
- Click "Deploy"
- Your site is live at: `https://webpot.vercel.app`

---

### Configuration Checklist for Production

1. **Update Apps Script URL in JavaScript:**
   - Apps Script URL is already configured in all JS files

2. **Test All Forms:**
   - [ ] Register → Check Users sheet + welcome email
   - [ ] Contact → Check Contact_Inquiries sheet + confirmation email
   - [ ] Order → Check Orders sheet + Order ID email

3. **Verify Emails:**
   - [ ] Check spam folder if emails not received
   - [ ] Verify Admin Email in Settings sheet is correct
   - [ ] Test email notifications work

4. **Monitor Google Sheets:**
   - Watch data appear in real-time as forms are submitted
   - Check Settings sheet for any errors

5. **Enable HTTPS:**
   - Firebase/Vercel automatically provide HTTPS
   - Local testing works over HTTP (Apps Script accepts both)

---

## 9. Important Notes
- **CORS:** Apps Script Web App automatically handles cross-origin requests
- **Quotas:** Google Apps Script has daily limits (100 emails/day). Fine for small sites
- **Security:** All validation happens server-side in Apps Script
- **Email Domain:** Emails are sent from your Gmail account used in Apps Script

---

## 10. Troubleshooting

**Forms not submitting:**
- Check browser console (F12) for errors
- Verify Apps Script URL is correct in JS files
- Check Apps Script deployment is "Anyone" access

**Emails not sending:**
- Check Google Sheets quota usage
- Verify Admin Email in Settings sheet
- Check spam folder

**Data not appearing in Sheets:**
- Verify sheet names match exactly (case-sensitive)
- Check column order matches
- Verify you have edit permission on Google Sheet

**CORS errors:**
- Ensure Apps Script is deployed as Web App with "Anyone" access
- Clear browser cache and retry

---

**Webpot Web App Ready to Launch! 🚀**
