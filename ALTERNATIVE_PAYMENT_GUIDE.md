# Alternative Payment Gateway Guide

## Overview

**Multi-Method Payment System** supporting UPI, Bank Transfer, Net Banking, and Card payments - all without Razorpay fees!

### 🎯 Why Alternative Payments?

| Method | Processing Fee | Settlement | Pros |
|--------|----------------|-----------|------|
| **UPI** | 0% | Instant | Direct to account, no fees, instant |
| **Bank Transfer** | 0% | 1-2 days | Full control, no middleman |
| **Net Banking** | 1-2% | T+1 | Secure, bank-verified |
| **Card** | 2% + ₹5 | T+2 | Convenient, popular |
| Razorpay | 2.8% | T+1 | Professional, but expensive |

---

## Backend Setup

### 1. **Environment Configuration**

Edit `.env` file:

```env
# UPI Configuration
UPI_ID=your-upi-id@bankname
# Example: 9876543210@okhdfcbank

# Bank Account Details
BANK_NAME=Your Bank Name
BANK_ACCOUNT_HOLDER=Car Wash Service
BANK_ACCOUNT_NUMBER=1234567890123456
BANK_IFSC_CODE=BANK0001234
```

### 2. **API Endpoints**

#### **Initiate Payment**
```
POST /alt-payment/initiate

Body:
{
  "amount": 500,
  "customer_id": "user-123",
  "customer_email": "user@example.com",
  "customer_name": "John Doe",
  "customer_phone": "9876543210",
  "type": "booking_payment",
  "payment_method": "upi",  // upi, bank_transfer, net_banking, card
  "booking_id": "booking-456"
}

Response:
{
  "success": true,
  "transaction_id": "TXN_user-123_1234567890",
  "payment_method": "upi",
  "amount": 500,
  "paymentDetails": {
    "upi_id": "9876543210@okhdfcbank",
    "upi_link": "upi://pay?pa=...",
    "qr_instruction": "Scan QR code with any UPI app",
    "apps": ["Google Pay", "PhonePe", "BHIM"]
  }
}
```

#### **Verify UPI Payment**
```
POST /alt-payment/verify-upi

Body:
{
  "transaction_id": "TXN_user-123_1234567890",
  "upi_ref_id": "123456789012",  // UTR from bank
  "payment_timestamp": "2024-11-25T10:30:00Z"
}
```

#### **Verify Bank Transfer**
```
POST /alt-payment/verify-bank-transfer

Body:
{
  "transaction_id": "TXN_user-123_1234567890",
  "reference_number": "CHQ123456",
  "transfer_date": "2024-11-25"
}
```

#### **Verify Net Banking**
```
POST /alt-payment/verify-net-banking

Body:
{
  "transaction_id": "TXN_user-123_1234567890",
  "bank_name": "HDFC Bank",
  "confirmation_number": "HDFC123456789",
  "payment_timestamp": "2024-11-25T10:30:00Z"
}
```

#### **Verify Card Payment**
```
POST /alt-payment/verify-card

Body:
{
  "transaction_id": "TXN_user-123_1234567890",
  "card_last4": "1234",
  "card_network": "Visa",
  "authorization_code": "AUTH123456"
}
```

#### **Check Payment Status**
```
GET /alt-payment/status/:transaction_id

Response:
{
  "success": true,
  "transaction": {...},
  "status": "pending|success|failed",
  "payment_method": "upi",
  "amount": 500
}
```

#### **Get Available Payment Methods**
```
GET /alt-payment/methods

Response:
{
  "success": true,
  "payment_methods": {
    "upi": {
      "name": "UPI (Instant)",
      "fees": "0%",
      "settlement": "Instant",
      ...
    },
    ...
  }
}
```

---

## Frontend Implementation

### 1. **Add Payment Component to Routes**

In `src/App.jsx`:

```jsx
import AlternativePayment from "./components/AlternativePayment";

<Route path="/payment" element={<AlternativePayment />} />
```

### 2. **Use Payment Component**

```jsx
import AlternativePayment from "./components/AlternativePayment";

// In your booking page
<AlternativePayment />
```

### 3. **Component Features**

- ✅ Display all payment methods with pros/cons
- ✅ Show payment details based on selected method
- ✅ Generate UPI QR codes and links
- ✅ Show bank transfer details
- ✅ Verify payment with transaction ID
- ✅ Real-time payment status tracking

---

## UPI Payment - Step by Step

### For Customer:

1. **Select UPI** from payment methods
2. **Enter Amount** and details
3. **Click "Initiate Payment"**
4. **Scan QR Code** or use UPI Link
5. **Complete Payment** in UPI app (Google Pay, PhonePe, etc.)
6. **Copy UTR** from payment confirmation
7. **Paste UTR** in verification field
8. **Click "Verify Payment"**
9. ✅ **Payment Confirmed!**

### For Admin:

1. Customer initiates payment
2. Transaction created in database with `pending` status
3. Customer completes UPI payment
4. Customer enters UTR from bank
5. Admin verifies UTR
6. Transaction status changes to `success`
7. Money in your bank account (instant)

---

## Bank Transfer Payment - Step by Step

### For Customer:

1. **Select Bank Transfer** from payment methods
2. **View Bank Details** (Account, IFSC, etc.)
3. **Transfer Amount** from their bank app
4. **Wait for Confirmation** (1-2 business days)
5. **Enter Reference Number** and transfer date
6. **Click "Verify Payment"**

### For Admin:

1. Customer receives bank details
2. Customer transfers money from their bank
3. You receive notification from your bank
4. Verify transaction in car-wash app
5. Transaction status changes to `success`

---

## Net Banking Payment - Step by Step

### For Customer:

1. **Select Net Banking** from payment methods
2. **Choose Their Bank** (HDFC, ICICI, SBI, etc.)
3. **Click Bank Link** - opens bank website
4. **Complete Net Banking Payment** on bank portal
5. **Copy Confirmation Number**
6. **Paste Confirmation** in app
7. **Click "Verify Payment"**

### For Admin:

Similar to bank transfer, but customer initiates from their bank portal.

---

## Card Payment - Step by Step

### For Customer:

1. **Select Card** from payment methods
2. **Enter Card Details** (last 4 digits, network, CVV)
3. **Complete OTP Verification** from bank
4. **Copy Authorization Code** from SMS
5. **Paste Authorization Code** in app
6. **Click "Verify Payment"**

---

## Database Schema

### Transactions Table

```sql
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id VARCHAR(255),
  type VARCHAR(50),           -- booking_payment, wallet_topup, etc.
  direction VARCHAR(20),       -- debit, credit
  status VARCHAR(50),          -- pending, success, failed
  amount DECIMAL(10, 2),
  gst DECIMAL(10, 2),
  total_amount DECIMAL(10, 2),
  currency VARCHAR(3),         -- INR
  payment_method VARCHAR(50),  -- upi, bank_transfer, net_banking, card
  gateway_order_id VARCHAR(255), -- transaction_id
  gateway_payment_id VARCHAR(255), -- UTR, ref number, etc.
  notes TEXT,
  booking_id UUID,
  pass_id UUID,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

---

## Admin Dashboard Features

### View Transactions

```jsx
// Fetch all transactions
const response = await fetch('/transactions');

// Filter by payment method
const response = await fetch('/transactions?payment_method=upi');

// Filter by status
const response = await fetch('/transactions/status/pending');
```

### Manual Verification

1. Go to **Transactions** page
2. Find pending transaction
3. Click **Verify** button
4. Enter payment confirmation details
5. Click **Confirm**
6. Transaction status updates to `success`

---

## Fees Comparison

### Customer Pays ₹500

| Method | Processing Fee | Customer Pays | You Receive | Settlement |
|--------|----------------|---------------|-------------|-----------|
| UPI | 0% | ₹500 | ₹500 | Instant |
| Bank Transfer | 0% | ₹500 | ₹500 | 1-2 days |
| Net Banking | 1.5% | ₹507.50 | ₹500 | T+1 |
| Card | 2% + ₹5 | ₹515 | ₹500 | T+2 |
| Razorpay | 2.8% | ₹514 | ₹500 | T+1 |

---

## Security Features

✅ **Transaction ID**: Unique identifier for each payment  
✅ **Payment Verification**: Manual and automated verification  
✅ **Status Tracking**: Real-time payment status  
✅ **Database Logging**: All transactions logged  
✅ **Error Handling**: Comprehensive error messages  
✅ **Timestamp Recording**: Payment timestamp verification  

---

## Troubleshooting

### ❌ "Transaction Not Found"
- Check transaction_id is correct
- Verify transaction was created successfully
- Check database for transaction record

### ❌ "Verification Failed"
- Ensure payment details are correct
- UTR/reference number must be exact
- Check payment method matches initiated method

### ❌ "Amount Mismatch"
- Verify customer paid exact amount
- No extra or lesser amount accepted
- Check for processing fees

### ❌ "UPI Link Not Working"
- Update UPI_ID in .env
- Ensure UPI_ID format is correct: `9876543210@bankname`
- Test with UPI app on device

---

## Best Practices

### For Admin:

1. **Verify Carefully**: Check bank confirmations before marking success
2. **Keep Records**: Maintain transaction logs for compliance
3. **Response Time**: Verify payments within 24 hours
4. **Communication**: Send SMS/email confirmations to customers
5. **Reconciliation**: Monthly bank reconciliation

### For Customers:

1. **Keep UTR**: Save UPI UTR/reference number
2. **Exact Amount**: Pay exact amount, no extra coins
3. **Description**: Use transaction reference in notes
4. **Screenshot**: Keep payment screenshot as proof
5. **Confirmation**: Wait for email/SMS confirmation

---

## Integration Example

### Complete Payment Flow

```javascript
// 1. Customer initiates payment
const response = await fetch('http://localhost:5000/alt-payment/initiate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    amount: 500,
    customer_id: 'user-123',
    customer_email: 'user@example.com',
    customer_name: 'John Doe',
    customer_phone: '9876543210',
    type: 'booking_payment',
    payment_method: 'upi'
  })
});

const data = await response.json();
const transaction_id = data.transaction_id;
const upi_link = data.paymentDetails.upi_link;

// 2. Customer pays using UPI link/QR code
// 3. Customer enters UTR

const verifyResponse = await fetch('http://localhost:5000/alt-payment/verify-upi', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    transaction_id: transaction_id,
    upi_ref_id: '123456789012'
  })
});

// 4. Payment verified and confirmed!
```

---

## Live vs Test Mode

### Test Mode (Development)

```env
# Use test UPI ID
UPI_ID=test-upi@bankname

# Mock transactions
BANK_ACCOUNT_NUMBER=0000000000000000
```

### Live Mode (Production)

```env
# Use real UPI ID
UPI_ID=your-real-upi@bankname

# Real bank details
BANK_ACCOUNT_NUMBER=1234567890123456
```

---

## Support & Help

- **UPI Issues**: Contact your bank or UPI app provider
- **Bank Transfer**: Check bank statement and confirmation
- **Net Banking**: Verify bank website login
- **Card Payment**: Contact card issuer for OTP issues

---

## Next Steps

1. ✅ Configure `.env` with bank details
2. ✅ Deploy backend with alt-payment routes
3. ✅ Add AlternativePayment component to frontend
4. ✅ Test with all payment methods
5. ✅ Deploy to production
6. ✅ Monitor transactions in admin dashboard

**Happy Payment Processing! 🎉**
