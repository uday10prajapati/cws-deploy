# Real Payment Integration Setup Guide

## 🎯 Overview
This guide walks you through setting up **real payment processing** with Razorpay payment gateway so that actual money is received in your account.

---

## 📋 Prerequisites

1. **Razorpay Account** (Free)
   - Sign up at: https://razorpay.com
   - Supports: UPI, Credit/Debit Cards, Net Banking, Wallets
   - GST compliant
   - Automatic invoice generation

2. **Bank Account**
   - Account to receive payments
   - KYC verification (usually done during Razorpay signup)

3. **Your Project Setup**
   - Backend running on Node.js with Express
   - Frontend with React
   - Supabase database

---

## 🚀 Setup Steps

### **Step 1: Create Razorpay Account**

1. Visit https://razorpay.com
2. Click "Sign Up" → Choose "For Business"
3. Fill in your details:
   - Business Name: "CarWash+"
   - Email: Your business email
   - Phone: Your phone number
4. Create account and verify email
5. Complete KYC verification (provides bank details for payment receipt)

### **Step 2: Get API Keys**

1. Log in to Razorpay Dashboard
2. Go to **Settings → API Keys**
3. Under "Live Keys" section, you'll see:
   - **Key ID** (public key)
   - **Key Secret** (private/secret key - keep this secure!)
4. Copy both keys

### **Step 3: Configure Environment Variables**

Create/Update `.env` file in your backend (`backend/.env`):

```env
# Existing variables
PORT=5000
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_key

# Add these NEW variables
RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxxx
RAZORPAY_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxx (optional, for webhooks)
```

**⚠️ IMPORTANT**: 
- Never commit `.env` file to git
- Keep `RAZORPAY_KEY_SECRET` secure (backend only)
- Use `RAZORPAY_KEY_ID` in frontend (it's public)

### **Step 4: Install Razorpay Package**

Run in backend directory:

```bash
cd backend
npm install razorpay
```

This will add razorpay to your `package.json` and install the npm package.

### **Step 5: Backend Configuration**

Files already created for you:

1. **`backend/config/razorpay.js`**
   - Initializes Razorpay with API keys from `.env`

2. **`backend/routes/paymentRoutes.js`**
   - Endpoints for payment processing:
     - `POST /payment/create-order` → Creates Razorpay order
     - `POST /payment/verify` → Verifies payment signature
     - `GET /payment/status/:order_id` → Checks payment status
     - `POST /payment/webhook` → Handles real-time updates
     - `POST /payment/refund` → Processes refunds

3. **`backend/server.js`** (updated)
   - Added payment routes: `app.use("/payment", paymentRoutes);`

### **Step 6: Frontend Configuration**

1. **Razorpay Script** (already added to `index.html`)
   ```html
   <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
   ```

2. **Updated `Transactions.jsx`**
   - New `handleAddMoneyPayment()` function
   - Integrates with Razorpay payment modal
   - Handles payment verification

---

## 💳 How It Works Now

### **User Flow**

```
1. User clicks "Add Money" button
   ↓
2. User enters amount & selects payment method
   ↓
3. User clicks "Pay Now"
   ↓
4. Backend creates order in Razorpay
   ↓
5. Razorpay payment modal opens
   ↓
6. User completes payment (UPI scan, card entry, etc.)
   ↓
7. Razorpay returns payment details
   ↓
8. Frontend sends payment details to backend for verification
   ↓
9. Backend verifies signature (proves payment is real)
   ↓
10. If verified ✅:
    - Transaction saved to database
    - Wallet balance updated
    - Success message shown
    - Modal closes
   ↓
11. If failed ❌:
    - Error message shown
    - User can retry
```

### **Payment Methods Available**

1. **UPI** (most popular in India)
   - Google Pay, PhonePe, BHIM, etc.
   - Instant payment
   - Direct to bank account

2. **Credit/Debit Card**
   - Visa, Mastercard, Amex
   - Optional OTP verification
   - Automat saved cards

3. **Net Banking**
   - All major Indian banks
   - HDFC, ICICI, Axis, SBI, etc.
   - Instant settlement

4. **Wallets**
   - PayZapp, Freecharge, Mobikwik
   - One-click payment

---

## 🔐 Security Implementation

### **Payment Signature Verification**

Every payment is verified using cryptographic signatures to ensure:
- Payment is authentic (not faked)
- Money actually came from Razorpay
- Amount matches what was requested

**Code in `paymentRoutes.js`:**
```javascript
// Create signature string
const signatureData = `${razorpay_order_id}|${razorpay_payment_id}`;
const expectedSignature = crypto
  .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
  .update(signatureData)
  .digest("hex");

// Verify it matches
if (expectedSignature !== razorpay_signature) {
  return res.status(400).json({
    success: false,
    error: "Payment verification failed! Invalid signature.",
  });
}
```

### **Additional Security**

- API keys stored in `.env` (not in code)
- Secret key never exposed to frontend
- HTTPS only (Razorpay enforces this)
- Amount verified on backend
- Customer details verified
- Transaction saved with order ID for tracking

---

## 📊 Database Integration

### **Transaction Structure**

Every payment creates a transaction record in Supabase:

```javascript
{
  customer_id: "user-uuid",
  type: "wallet_topup",
  direction: "credit",
  status: "success",
  amount: 500,
  gst: 90,
  total_amount: 590,
  currency: "INR",
  payment_method: "upi",
  gateway_order_id: "order_P8UZjBNzDzDdaq", // Razorpay order ID
  gateway_payment_id: "pay_P8UZjBNzDzDdaq", // Razorpay payment ID
  gst_number: "18AABCT1234H1Z0",
  notes: "Wallet top-up via UPI",
  created_at: "2025-11-25T10:30:00Z"
}
```

### **Wallet Balance Calculation**

Automatic update via React memo:
```javascript
const walletBalance = useMemo(() => {
  return transactions
    .filter(tx => tx.direction === "credit" && tx.status === "success")
    .reduce((sum, tx) => sum + tx.amount, 0);
}, [transactions]);
```

---

## 🧪 Testing

### **Test Cards (Use in Development)**

Razorpay provides test cards for testing:

| Card Number | Expiry | CVV | Result |
|---|---|---|---|
| 4111111111111111 | Any future | Any 3 digits | SUCCESS |
| 4222222222222220 | Any future | Any 3 digits | FAILED |
| 4444444444444440 | Any future | Any 3 digits | TIMEOUT |

**Steps to Test:**
1. Use test API keys (not live)
2. Use test card numbers above
3. Complete payment in modal
4. Check transaction in database

### **Test UPI (in Development)**

1. Razorpay provides a test UPI app
2. Or use Google Pay/PhonePe in test mode
3. Complete payment to see success

---

## 💰 Payment Settlement

### **How You Receive Money**

1. Customer completes payment via UPI/Card/etc.
2. Razorpay receives the money
3. Razorpay deducts their fee (~2-3% for UPI)
4. Balance settles to your account (T+1 or T+2)
5. You can withdraw anytime to your bank

**Example:**
```
Customer pays: ₹590
Razorpay fee: ₹14 (2.4%)
You receive: ₹576
Settlement: Next business day to your bank
```

### **Withdrawal Process**

In Razorpay Dashboard:
1. Go to **Settlements**
2. Click **Withdraw Now**
3. Select amount and bank account
4. Approve (money reaches in 1-2 hours)

---

## 🔔 Webhooks (Optional but Recommended)

Webhooks allow Razorpay to notify you of payment status changes in real-time.

### **Setup Webhook**

1. In Razorpay Dashboard → **Settings → Webhooks**
2. Click **Add Webhook**
3. URL: `https://yourdomain.com/payment/webhook`
4. Events to enable:
   - `payment.authorized`
   - `payment.captured`
   - `payment.failed`

**Your Backend Already Handles:**
- Signature verification
- Event processing
- Real-time updates

---

## 📱 Testing the Integration

### **Step 1: Start Backend**
```bash
cd backend
npm install  # If you haven't already
npm start
```

### **Step 2: Start Frontend**
```bash
cd frontend
npm start
```

### **Step 3: Test Payment Flow**
1. Navigate to Transactions page
2. Click "Add Money" button
3. Enter amount (e.g., ₹500)
4. Select payment method
5. Click "Next" → "Pay Now"
6. Razorpay modal opens
7. Complete payment with test card/UPI
8. Wait for verification
9. See "Payment Successful!" message
10. Check transaction in list
11. Verify wallet balance updated

---

## 🐛 Troubleshooting

### **Issue: "RAZORPAY_KEY_ID is undefined"**
**Solution:** Check `.env` file in backend directory
- Make sure `RAZORPAY_KEY_ID` is set
- Restart backend server after updating `.env`

### **Issue: "Payment verification failed"**
**Solution:** Verify the following:
- Order ID matches
- Payment ID is correct
- Signature calculation is correct
- API keys are correct in `.env`

### **Issue: "Razorpay modal doesn't open"**
**Solution:** Check:
- Razorpay script loaded: `<script src="https://checkout.razorpay.com/v1/checkout.js"></script>`
- Check browser console for errors
- Order creation succeeded (check network tab)

### **Issue: Transaction not saved in database**
**Solution:** Check:
- Supabase connection working
- `transactions` table exists
- User is authenticated
- Check backend logs for errors

---

## 📈 Going Live

### **Before Going Live**

1. **Test Thoroughly**
   - Test all payment methods
   - Test success and failure scenarios
   - Test refund process

2. **Enable Live Keys**
   - In Razorpay Dashboard → Settings → API Keys
   - Switch to "Live" tab
   - Copy live API keys

3. **Update `.env` with Live Keys**
   ```env
   RAZORPAY_KEY_ID=rzp_live_xxxxx (from live tab)
   RAZORPAY_KEY_SECRET=xxxxx (from live tab)
   ```

4. **Enable HTTPS**
   - Razorpay requires HTTPS on live
   - Deploy to HTTPS server

5. **Setup Webhook**
   - Configure webhook URL in Razorpay dashboard
   - Must be HTTPS

6. **Monitor First Transactions**
   - Watch for errors in logs
   - Verify money reaches your account
   - Confirm settlements working

---

## 📚 Useful Links

- **Razorpay Dashboard**: https://dashboard.razorpay.com
- **Razorpay Documentation**: https://razorpay.com/docs
- **Payment Gateway Docs**: https://razorpay.com/docs/payments/
- **API Reference**: https://razorpay.com/docs/api/
- **Test Cards**: https://razorpay.com/docs/payments/payments/test-mode/

---

## 🎉 Summary

You now have:
✅ Backend payment APIs integrated with Razorpay
✅ Frontend payment modal with real Razorpay
✅ Automatic payment verification
✅ Transaction saved to Supabase
✅ Wallet balance auto-updates
✅ Support for all payment methods
✅ GST calculations included
✅ Security via signature verification

**Next Steps:**
1. Create Razorpay account
2. Get API keys
3. Add to `.env`
4. Run `npm install razorpay` in backend
5. Test with test cards
6. Go live with live keys!

Money will now flow directly to your account! 💰
