# Payment Integration Guide - CarWash+ App

## Overview
This guide explains how to integrate the payment flow from booking/pass purchase to the Transactions page.

---

## 🎯 Key Features Added

### 1. **Complete Navbar & Sidebar Integration**
- Transactions page now includes the full Navbar with user profile
- Responsive sidebar that collapses on desktop
- Mobile-friendly menu navigation

### 2. **GST Number in Payments & Invoices**
- GST Number: `18AABCT1234H1Z0` (Update in PaymentPage component)
- 18% GST automatically calculated
- GST details shown in:
  - Payment page
  - Invoice
  - Transaction details modal
  - Bill breakdown

### 3. **Multi-Payment Method Support**
- ✅ UPI (Instant & Secure)
- ✅ Credit/Debit Card (Visa, Mastercard, Amex)
- ✅ Wallet (Use wallet balance)
- ✅ Net Banking (All major banks)

### 4. **Payment Flow from Booking/Pass**
User journey:
```
Booking/Pass Purchase Form → Submit → Redirect to Payment Page 
→ Complete Payment → Transaction Recorded → Back to Dashboard
```

---

## 📋 Integration Steps

### Step 1: Update Booking Page to Redirect to Payment

In `Bookings.jsx`, after successful booking creation, redirect to Transactions with payment data:

```jsx
// After booking is created successfully
const bookingId = result.data.id; // Get booking ID from response
const paymentAmount = totalPrice; // Calculate total amount

window.location.href = `/transactions?payment=true&amount=${paymentAmount}&type=booking_payment&bookingId=${bookingId}`;

// OR use React Router's navigate
navigate("/transactions", {
  state: {
    showPayment: true,
    paymentData: {
      amount: paymentAmount,
      type: "booking_payment",
      bookingId: bookingId,
      passId: null,
    }
  }
});
```

### Step 2: Update Monthly Pass Purchase

For pass purchases, follow similar pattern:

```jsx
const passId = result.data.id;
const passAmount = totalPrice; // Pass price

navigate("/transactions", {
  state: {
    showPayment: true,
    paymentData: {
      amount: passAmount,
      type: "monthly_pass",
      bookingId: null,
      passId: passId,
    }
  }
});
```

---

## 🔧 Payment Page Props

```jsx
<PaymentPage
  amount={500}                    // Amount in INR (before GST)
  type="booking_payment"          // Type: booking_payment | monthly_pass | wallet_topup
  bookingId="BKG12345"           // Booking ID (if applicable)
  passId="PASS67890"             // Pass ID (if applicable)
  onBack={() => handleBack()}    // Callback when user clicks back
  onSuccess={(transaction) => {  // Callback after successful payment
    // Handle success - save transaction, update UI, etc.
    console.log("Payment successful:", transaction);
  }}
/>
```

---

## 💳 Payment Data Structure

### Transaction Object
```javascript
{
  id: "TRX934820",
  bookingId: "BKG1231",
  passId: null,
  customerId: "CUS1",
  type: "booking_payment",           // booking_payment | monthly_pass | wallet_topup | refund | cashback
  direction: "debit",                 // credit | debit
  status: "success",                  // success | failed | pending | refunded
  amount: 399,                        // Amount before GST
  gst: 72,                           // GST amount (18% of amount)
  totalAmount: 471,                  // Amount + GST
  currency: "INR",
  paymentMethod: "upi",              // upi | card | wallet | netbanking | other
  gstNumber: "18AABCT1234H1Z0",      // GST Number for invoice
  notes: "Payment via UPI",
  createdAt: "2025-01-22T05:04:00.000Z",
  invoiceUrl: "#",                   // URL to download invoice
  gatewayOrderId: "order_123",       // Payment gateway order ID
  gatewayPaymentId: "pay_123",       // Payment gateway payment ID
}
```

---

## 🎨 Available Payment Methods

```javascript
const paymentModes = [
  { 
    id: "upi", 
    label: "UPI", 
    icon: <SiGooglepay />,
    description: "Instant & Secure"
  },
  { 
    id: "card", 
    label: "Credit/Debit Card", 
    icon: <FiCreditCard />,
    description: "Visa, Mastercard, Amex"
  },
  { 
    id: "wallet", 
    label: "Wallet", 
    icon: <FaWallet />,
    description: "Use wallet balance"
  },
  { 
    id: "netbanking", 
    label: "Net Banking", 
    icon: <FiPhone />,
    description: "All major banks"
  },
];
```

---

## 📊 Features & Components

### Main Components

1. **PaymentPage** - Standalone payment interface
   - Navbar & Sidebar integration
   - Payment method selection
   - GST calculation & display
   - Invoice information
   - Processing state

2. **TransactionsPage** - Main transactions dashboard
   - Wallet balance display
   - Transaction history with filters
   - Transaction details modal
   - GST information in bills
   - Payment initiation

### Key Functions

```javascript
// Handle initiating payment
handleInitiatePayment(amount, type, bookingId, passId)

// Handle successful payment
handlePaymentSuccess(transaction)

// Format currency
formatAmount(amount, currency = "INR")

// Format date
formatDate(dateStr)
```

---

## 🔐 Security Features

- ✅ SSL/TLS encryption for payment data
- ✅ GST number validation
- ✅ Payment method validation
- ✅ Terms & conditions acknowledgment
- ✅ Secure checkout badge displayed
- ✅ Transaction ID generation

---

## 📱 UI/UX Features

### Responsive Design
- Mobile-first approach
- Sidebar collapses on mobile
- Touch-friendly buttons
- Full-width forms on mobile

### Visual Feedback
- Loading states with spinner
- Success/failure indicators
- Status badges
- Color-coded transactions

### Wallet Integration
- Display wallet balance
- Quick wallet top-up option
- Track wallet transactions

---

## 🚀 Next Steps

### Backend Integration (To be implemented)

1. **Save Payment to Database**
   ```javascript
   POST /api/transactions/create
   Body: {
     customerId, type, direction, status, 
     amount, gst, totalAmount, paymentMethod,
     bookingId, passId, gstNumber, notes
   }
   ```

2. **Payment Gateway Integration** (Razorpay/PayU recommended)
   - Replace mock payment processing with actual gateway
   - Handle webhooks for payment confirmation
   - Update transaction status in real-time

3. **Invoice Generation**
   - Generate PDF invoice with GST details
   - Store invoice URL in database
   - Enable download from transactions page

---

## 🔑 Important Notes

### GST Configuration
- Current GST Rate: **18%**
- Current GST Number: `18AABCT1234H1Z0`
- Update these values in `PaymentPage` component

### Payment Processing
- Currently uses mock 2-second delay
- Replace with actual payment gateway API
- Handle success/failure responses

### Transaction Recording
- Mock data from `fetchTransactions()` function
- Replace with actual API call to backend
- Implement real transaction filtering & search

---

## 📝 Example Usage

### Complete Booking with Payment

```jsx
// In Bookings.jsx
const handleSubmit = async (e) => {
  e.preventDefault();
  
  try {
    // 1. Create booking
    const response = await fetch("http://localhost:5000/bookings/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ /* booking data */ })
    });
    
    const result = await response.json();
    
    if (result.success) {
      // 2. Redirect to payment
      navigate("/transactions", {
        state: {
          showPayment: true,
          paymentData: {
            amount: totalPrice,
            type: "booking_payment",
            bookingId: result.data.id,
            passId: null,
          }
        }
      });
    }
  } catch (err) {
    console.error("Booking error:", err);
  }
};
```

---

## 🎯 Testing Checklist

- [ ] Payment page loads with correct amount
- [ ] All payment methods are selectable
- [ ] GST calculated correctly (18%)
- [ ] Wallet top-up works
- [ ] Redirect from booking works
- [ ] Transaction details display correctly
- [ ] GST number visible in invoice section
- [ ] Mobile responsive on all screen sizes
- [ ] Back button works properly
- [ ] Payment processing shows loading state

---

## 📞 Support

For issues or questions about payment integration:
1. Check transaction details modal for GST information
2. Verify payment method selection
3. Ensure booking/pass data is passed correctly
4. Check browser console for error messages

---

**Last Updated:** January 2025
**Version:** 1.0
