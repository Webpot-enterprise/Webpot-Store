# Quick Reference: Orders & Referral System

## 🚀 Quick Start

### Database Setup (5 minutes)
1. Open your Google Sheet: `1wreXWGm1j4CCO7Id00ypwU3dd4fGFxlLs03_0RsPh78`
2. Add tab **Orders** with columns: order_id, user_id, customer_email, customer_name, order_date, total_amount, currency, order_status, service_type, service_details, delivery_date, payment_method, referral_code_used, confirmation_sent
3. Add tab **ReferralCodes** with columns: code_id, referral_code, user_id, created_by, created_at, expires_at, discount_percentage, max_uses, current_uses, status
4. Freeze header rows on both tabs

### Google Apps Script (15 minutes)
1. Add email functions to GAS (copy from Section 3.6)
2. Add order functions (copy from Section 3.6)
3. Update `doPost()` router to include new actions
4. Update `doGet()` router to include new actions
5. Deploy as new version

### Test (10 minutes)
- Create test referral code: `SUMMER2025` with 20% discount
- Run Test 5-12 curl commands from guide
- Verify orders appear in Orders sheet
- Check confirmation emails are sent

---

## 📦 Orders Workflow

```json
// 1. CUSTOMER CREATES ORDER
POST /api/create_order
{
  "customer_email": "john@example.com",
  "customer_name": "John Doe",
  "total_amount": 500,
  "service_type": "web_design",
  "referral_code_used": "SUMMER2025"  // optional
}

// 2. BACKEND VALIDATES & CREATES
→ Validates referral code (if provided)
→ Creates order with status = "pending"
→ Increments referral code usage
→ Returns: { order_id: "abc123", ... }

// 3. SEND CONFIRMATION EMAIL
POST /api/send_order_confirmation_email
{
  "order_id": "abc123",
  "customer_email": "john@example.com",
  "customer_name": "John Doe"
}

// 4. ADMIN REVIEWS & UPDATES
GET /api/fetch_all_orders
→ Returns all orders for admin dashboard

POST /api/update_order_status
{
  "order_id": "abc123",
  "new_status": "confirmed"
}

// 5. CUSTOMER TRACKS
GET /api/fetch_user_orders?user_id=xyz
→ Returns customer's orders for their dashboard
```

---

## 🎟️ Referral Code Workflow

```json
// ADMIN CREATES CODE
Go to ReferralCodes sheet, manually add:
{
  "code_id": "ref_001",
  "referral_code": "SUMMER2025",
  "created_by": "admin@example.com",
  "discount_percentage": 20,
  "max_uses": 100,
  "status": "active",
  "expires_at": "2025-12-31"
}

// CUSTOMER USES CODE
POST /api/create_order
{
  "referral_code_used": "SUMMER2025",
  ...
}

// BACKEND VALIDATES
GET /api/validate_referral_code?referral_code=SUMMER2025
→ Check: Is active? (yes)
→ Check: Has uses left? (0/100, yes)
→ Check: Not expired? (yes)
→ Return: { discount_percentage: 20 }
→ Increment: current_uses = 1

// CODE EXHAUSTED
→ current_uses = 100, max_uses = 100
→ Next use: Reject with "CODE_EXHAUSTED"

// DEACTIVATE CODE
Update ReferralCodes sheet:
  status = "inactive"
→ All future uses: Reject with "CODE_INACTIVE"
```

---

## 📊 Admin Dashboard Data

### Get All Orders
```bash
curl "https://yourdomain.com/api/fetch_all_orders?action=fetch_all_orders"
```
Returns: Array of all orders

### Get Orders by Status
```bash
# Get all pending orders
curl "https://yourdomain.com/api/fetch_orders_by_status?action=fetch_orders_by_status&status=pending"

# Get all in-progress orders
curl "https://yourdomain.com/api/fetch_orders_by_status?action=fetch_orders_by_status&status=in_progress"

# Get all completed orders
curl "https://yourdomain.com/api/fetch_orders_by_status?action=fetch_orders_by_status&status=completed"
```

### Update Order Status
```bash
curl -X POST "https://yourdomain.com/api/update_order_status?action=update_order_status" \
  -H "Content-Type: application/json" \
  -d '{"order_id": "abc123", "new_status": "confirmed"}'
```

Valid statuses: `pending`, `confirmed`, `in_progress`, `completed`, `cancelled`, `refunded`

---

## 👥 Customer Dashboard Data

### Get Customer's Orders
```bash
curl "https://yourdomain.com/api/fetch_user_orders?action=fetch_user_orders&user_id=USER_ID"
```
Returns: Array of customer's orders only

### Get Individual Order Details
```bash
curl "https://yourdomain.com/api/fetch_order_by_id?action=fetch_order_by_id&order_id=abc123"
```
Returns: Full order object with all details

---

## 📧 Email Management

### Send Confirmation Email
```bash
curl -X POST "https://yourdomain.com/api/send_order_confirmation_email?action=send_order_confirmation_email" \
  -H "Content-Type: application/json" \
  -d '{
    "order_id": "abc123",
    "customer_email": "john@example.com",
    "customer_name": "John Doe"
  }'
```

### Track Email Status
Check `confirmation_sent` column in Orders sheet:
- `"yes"` = Email sent
- `"no"` = Email not sent
- `"pending"` = Email pending

---

## 🛠️ Common Tasks

### Create Test Data
```bash
# 1. Create referral code in sheet (manual)
ReferralCodes sheet:
- referral_code = "TEST2025"
- discount_percentage = 10
- max_uses = 5
- status = "active"

# 2. Test order with referral code
curl -X POST "https://yourdomain.com/api/create_order?action=create_order" \
  -H "Content-Type: application/json" \
  -d '{
    "customer_email": "test@example.com",
    "customer_name": "Test User",
    "total_amount": 100,
    "service_type": "web_design",
    "referral_code_used": "TEST2025"
  }'

# 3. Check if order was created
GET /api/fetch_order_by_id?action=fetch_order_by_id&order_id=<returned_order_id>
```

### Monitor System Health
1. Check **Logs** sheet for any `error` entries
2. Check **GAS executions** in Google Apps Script editor
3. Check **Cloudflare analytics** for request status
4. Check Orders sheet for incomplete orders (status = "pending" for >24 hours)

### Deactivate a Referral Code
1. Open ReferralCodes sheet
2. Find the row with the code
3. Change `status` column to `"inactive"`
4. All future uses of that code will be rejected

### Export Order Data
1. Open Google Sheet → Orders tab
2. Select all data → Copy
3. Paste into Google Docs, Excel, or spreadsheet tool
4. Or download as CSV using **File → Download** option

---

## 🔍 Debugging

### Order Not Appearing
✓ Check Logs sheet for errors
✓ Verify referral code (if used) exists in ReferralCodes sheet
✓ Check GAS execution logs for JavaScript errors
✓ Verify order_status is one of: pending, confirmed, in_progress, completed, cancelled, refunded

### Email Not Sending
✓ Verify Gmail API is enabled in GAS (Services → Gmail API)
✓ Check Logs sheet for `confirmation_email_failed` entries
✓ Check email address is valid (no typos)
✓ Verify GAS has permission to send emails (should prompt first time)

### Referral Code Not Validating
✓ Check code exists in ReferralCodes sheet
✓ Check `status = "active"` (not inactive/expired)
✓ Check `expires_at` is in future (today or later)
✓ Check `current_uses < max_uses`
✓ Test with GET /api/validate_referral_code endpoint

### CORS Errors in Browser
✓ Check Cloudflare Worker handles OPTIONS requests
✓ Verify domain is correct in request URL
✓ Check browser console for specific error message
✓ Test with curl first (curl doesn't have CORS)

---

## 📱 Frontend Integration Examples

### JavaScript: Place Order with Referral Code
```javascript
const placeOrder = async (orderData) => {
  try {
    const response = await fetch('https://yourdomain.com/api/create_order?action=create_order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_email: orderData.email,
        customer_name: orderData.name,
        total_amount: orderData.amount,
        currency: 'USD',
        service_type: orderData.service,
        service_details: orderData.details,
        delivery_date: orderData.deliveryDate,
        payment_method: 'credit_card',
        referral_code_used: orderData.couponCode || ''
      })
    });

    const data = await response.json();
    if (data.success) {
      console.log('Order placed:', data.order.order_id);
      // Send confirmation email
      await sendConfirmationEmail(data.order.order_id, orderData.email, orderData.name);
      // Redirect to thank you page
      window.location.href = `/thank-you?order=${data.order.order_id}`;
    } else {
      console.error('Order failed:', data.message);
    }
  } catch (error) {
    console.error('Network error:', error);
  }
};

const sendConfirmationEmail = async (orderId, email, name) => {
  return fetch('https://yourdomain.com/api/send_order_confirmation_email?action=send_order_confirmation_email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      order_id: orderId,
      customer_email: email,
      customer_name: name
    })
  });
};
```

### JavaScript: Fetch Customer Orders
```javascript
const fetchCustomerOrders = async (userId) => {
  try {
    const response = await fetch(`https://yourdomain.com/api/fetch_user_orders?action=fetch_user_orders&user_id=${userId}`);
    const data = await response.json();

    if (data.success) {
      console.log('Found', data.orders.length, 'orders');
      data.orders.forEach(order => {
        console.log(`Order #${order.order_id}: ${order.order_status} - $${order.total_amount}`);
      });
      return data.orders;
    }
  } catch (error) {
    console.error('Error fetching orders:', error);
  }
};
```

### JavaScript: Validate Coupon Code
```javascript
const validateCouponCode = async (couponCode) => {
  try {
    const response = await fetch(`https://yourdomain.com/api/validate_referral_code?action=validate_referral_code&referral_code=${couponCode}`);
    const data = await response.json();

    if (data.success) {
      console.log(`Coupon valid! ${data.discount_percentage}% discount applied`);
      return data.discount_percentage;
    } else {
      console.log('Invalid coupon:', data.message);
      return null;
    }
  } catch (error) {
    console.error('Error validating coupon:', error);
  }
};
```

---

## 📊 Database Relationships

```
Users (1) ──────→ (Many) Orders
  └─ user_id (PK) ──────→ user_id (FK)
  
Orders (Many) ──────→ (1) ReferralCodes
  └─ referral_code_used ──→ referral_code
  
ReferralCodes ──→ Users (created by)
  └─ user_id ──→ user_id

All ──→ Logs
  └─ action recorded for audit trail
```

---

## 🎯 Success Checklist

- [ ] Orders sheet created with 14 columns
- [ ] ReferralCodes sheet created with 10 columns
- [ ] Headers frozen on both tabs
- [ ] Data validation applied to status, currency, service type fields
- [ ] Email functions added to GAS
- [ ] Order functions added to GAS
- [ ] Routers updated (doGet & doPost)
- [ ] GAS deployed as new version
- [ ] Test referral code created (SUMMER2025)
- [ ] All 14 tests passed (Test 1-14)
- [ ] Orders appear in Orders sheet
- [ ] Confirmation emails are sent
- [ ] Admin can fetch all orders
- [ ] Admin can update order status
- [ ] Customer can see their orders
- [ ] Referral codes validate correctly

---

**Generated:** January 14, 2026  
**Version:** 1.0  
**Status:** Production Ready
