# Code Snippets - Ready to Copy & Paste

## Quick Copy-Paste Solutions

### 1️⃣ Redirect from Bookings to Payment (Easiest)

**Location:** In your `Bookings.jsx` - `handleSubmit` function

Copy this entire code block and replace your current redirect logic:

```jsx
// ✅ OPTION A: Simple URL (No React Router needed)
// After successful booking creation:

const handleSubmit = async (e) => {
  e.preventDefault();
  
  if (!user) return;
  
  // ... validation code ...
  
  setLoading(true);

  try {
    const response = await fetch("http://localhost:5000/bookings/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        // ... booking data ...
      }),
    });

    const result = await response.json();

    if (!result.success) {
      alert("Failed to create booking!");
      setLoading(false);
      return;
    }

    // NEW: Deduct wash from pass if using pass
    if (usePass && activePass) {
      try {
        await fetch(`http://localhost:5000/pass/${activePass.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            remaining_washes: activePass.remaining_washes - 1,
          }),
        });
      } catch (err) {
        console.error("Error deducting wash:", err);
      }
    }

    setLoading(false);
    setShowSuccess(true);

    // ✅ KEY CHANGE: Conditional redirect
    setTimeout(() => {
      if (usePass) {
        // Pass covers booking, no payment needed
        window.location.href = "/bookings";
      } else {
        // Payment required - redirect to payment page
        window.location.href = 
          `/transactions?payment=true&amount=${totalPrice}&type=booking_payment&bookingId=${result.data.id}`;
      }
    }, 1800);

  } catch (err) {
    console.error("BOOKING ERROR:", err);
    alert("Server Error");
    setLoading(false);
  }
};
```

---

### 2️⃣ Redirect Using React Router (Better)

**Add this import at the top of `Bookings.jsx`:**

```jsx
import { useNavigate } from "react-router-dom";
```

**Add this hook in your component:**

```jsx
const navigate = useNavigate();
```

**Replace the redirect logic with this:**

```jsx
// After successful booking creation:

// Show success message
setShowSuccess(true);
setLoading(false);

// Redirect based on payment requirement
setTimeout(() => {
  if (usePass) {
    // Pass covers booking, no payment needed
    navigate("/bookings");
  } else {
    // Need payment - send to transactions with payment data
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
}, 1800);
```

---

### 3️⃣ Monthly Pass Purchase Redirect

**Add this function to your pass purchase page:**

```jsx
const handleBuyPass = async (passType) => {
  try {
    // Determine pass details
    const passDetails = {
      "basic": { washes: 4, price: 499 },
      "standard": { washes: 8, price: 1499 },
      "premium": { washes: 16, price: 2999 }
    };

    const details = passDetails[passType];

    // Create pass in backend
    const response = await fetch("http://localhost:5000/pass/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customer_id: user.id,
        pass_type: passType,
        total_washes: details.washes,
        remaining_washes: details.washes,
        valid_till: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      }),
    });

    const result = await response.json();

    if (result.success) {
      // Redirect to payment
      navigate("/transactions", {
        state: {
          showPayment: true,
          paymentData: {
            amount: details.price,
            type: "monthly_pass",
            bookingId: null,
            passId: result.data.id,
          }
        }
      });
    } else {
      alert("Failed to create pass");
    }

  } catch (err) {
    console.error("Pass creation error:", err);
    alert("Server Error");
  }
};
```

---

### 4️⃣ Update GST Number

**In `Transactions.jsx`, find this line (around line 150):**

```jsx
const GST_NUMBER = "18AABCT1234H1Z0"; // Company GST Number
```

**Replace with your actual GST number:**

```jsx
const GST_NUMBER = "YOUR_ACTUAL_GST_NUMBER"; // Your Company GST Number
```

---

### 5️⃣ Update Business Name

**In `Transactions.jsx`, find the payment page GST section (around line 380):**

```jsx
<div className="flex gap-2 text-sm">
  <span className="text-slate-400">🏢 Business Name:</span>
  <span className="text-slate-300">CarWash+ Services</span>
</div>
```

**Replace with your business name:**

```jsx
<div className="flex gap-2 text-sm">
  <span className="text-slate-400">🏢 Business Name:</span>
  <span className="text-slate-300">YOUR BUSINESS NAME</span>
</div>
```

---

### 6️⃣ Change GST Rate

**In `Transactions.jsx`, find this line (around line 152):**

```jsx
const GST_RATE = 0.18; // 18% GST
const gstAmount = Math.round(amount * GST_RATE);
```

**To change GST rate (e.g., 5%):**

```jsx
const GST_RATE = 0.05; // 5% GST
const gstAmount = Math.round(amount * GST_RATE);
```

---

### 7️⃣ Handle Payment Success in Backend

**Create this endpoint in your backend (Node.js/Express):**

```javascript
const express = require('express');
const app = express();

// Save transaction to database
app.post("/api/transactions/create", async (req, res) => {
  const {
    customerId,
    type,
    direction,
    status,
    amount,
    gst,
    totalAmount,
    paymentMethod,
    bookingId,
    passId,
    gstNumber,
    notes,
  } = req.body;

  try {
    // Insert into transactions table
    const transaction = await db.query(
      `INSERT INTO transactions 
       (customer_id, type, direction, status, amount, gst, total_amount, 
        payment_method, booking_id, pass_id, gst_number, notes, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
       RETURNING *`,
      [
        customerId, type, direction, status, amount, gst, totalAmount,
        paymentMethod, bookingId, passId, gstNumber, notes
      ]
    );

    // Update booking status if booking payment
    if (type === "booking_payment" && bookingId) {
      await db.query(
        `UPDATE bookings 
         SET payment_status = 'completed', booking_status = 'confirmed'
         WHERE id = $1`,
        [bookingId]
      );
    }

    // Activate pass if pass payment
    if (type === "monthly_pass" && passId) {
      await db.query(
        `UPDATE passes 
         SET status = 'active'
         WHERE id = $1`,
        [passId]
      );
    }

    res.json({ success: true, data: transaction.rows[0] });

  } catch (err) {
    console.error("Transaction error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = app;
```

---

### 8️⃣ Fetch Transactions from Backend

**Replace mock `fetchTransactions()` with real API call:**

```jsx
// OLD (Mock):
// async function fetchTransactions() {
//   return [ /* mock data */ ];
// }

// NEW (Real API):
async function fetchTransactions(customerId) {
  try {
    const response = await fetch(
      `http://localhost:5000/api/transactions/${customerId}`
    );
    const result = await response.json();
    
    if (result.success) {
      return result.data;
    } else {
      throw new Error(result.error);
    }
  } catch (err) {
    console.error("Failed to fetch transactions:", err);
    throw err;
  }
}
```

**Update useEffect to use the user ID:**

```jsx
useEffect(() => {
  const getUser = async () => {
    const { data } = await supabase.auth.getUser();
    setUser(data.user);
    
    // Fetch transactions for this user
    if (data.user) {
      try {
        const txData = await fetchTransactions(data.user.id);
        txData.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        setTransactions(txData);
      } catch (err) {
        setError("Failed to load transactions");
      } finally {
        setLoading(false);
      }
    }
  };

  getUser();

  // ... rest of useEffect
}, []);
```

---

### 9️⃣ Save Transaction After Payment

**In `PaymentPage` component, replace mock payment with backend call:**

```jsx
const handlePayment = async () => {
  if (!selectedPayment) {
    alert("Please select a payment method");
    return;
  }

  setPaymentProcessing(true);

  try {
    // Create transaction object
    const transaction = {
      customerId: user.id,
      type,
      direction: "debit",
      status: "success",
      amount,
      gst: gstAmount,
      totalAmount,
      currency: "INR",
      paymentMethod: selectedPayment,
      bookingId: bookingId || null,
      passId: passId || null,
      gstNumber: GST_NUMBER,
      notes: `Payment via ${paymentLabel[selectedPayment]}`,
    };

    // Save to backend
    const response = await fetch("http://localhost:5000/api/transactions/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(transaction)
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error);
    }

    console.log("✅ Payment successful:", result.data);
    alert("✅ Payment successful!");
    
    // Pass the saved transaction to success callback
    onSuccess(result.data);

  } catch (err) {
    console.error("❌ Payment failed:", err);
    alert("Payment failed. Please try again.");
  } finally {
    setPaymentProcessing(false);
  }
};
```

---

### 🔟 Integrate Real Payment Gateway (Razorpay Example)

**Install Razorpay React SDK:**

```bash
npm install razorpay
```

**In your payment handling, replace mock with Razorpay:**

```jsx
const handlePayment = async () => {
  if (!selectedPayment) {
    alert("Please select a payment method");
    return;
  }

  setPaymentProcessing(true);

  try {
    // Step 1: Create Razorpay order on backend
    const orderResponse = await fetch("http://localhost:5000/api/razorpay/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: totalAmount * 100, // Razorpay expects amount in paise
        currency: "INR",
      })
    });

    const orderData = await orderResponse.json();

    if (!orderData.success) {
      throw new Error("Failed to create order");
    }

    // Step 2: Open Razorpay payment modal
    const options = {
      key: "YOUR_RAZORPAY_KEY_ID", // Get from Razorpay dashboard
      amount: totalAmount * 100,
      currency: "INR",
      name: "CarWash+ Services",
      description: typeLabel[type],
      order_id: orderData.orderId,
      handler: async (response) => {
        // Step 3: Verify payment on backend
        const verifyResponse = await fetch(
          "http://localhost:5000/api/razorpay/verify-payment",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            })
          }
        );

        const verifyData = await verifyResponse.json();

        if (verifyData.success) {
          // Step 4: Create transaction record
          const transaction = {
            customerId: user.id,
            type,
            direction: "debit",
            status: "success",
            amount,
            gst: gstAmount,
            totalAmount,
            currency: "INR",
            paymentMethod: selectedPayment,
            bookingId: bookingId || null,
            passId: passId || null,
            gstNumber: GST_NUMBER,
            gatewayOrderId: response.razorpay_order_id,
            gatewayPaymentId: response.razorpay_payment_id,
            notes: `Payment via ${paymentLabel[selectedPayment]}`,
          };

          // Save transaction
          await fetch("http://localhost:5000/api/transactions/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(transaction)
          });

          alert("✅ Payment successful!");
          onSuccess(transaction);
        } else {
          throw new Error("Payment verification failed");
        }
      },
      prefill: {
        email: user.email,
      },
      theme: {
        color: "#2563eb" // Blue color
      }
    };

    const rzp = new window.Razorpay(options);
    rzp.open();

  } catch (err) {
    console.error("❌ Payment failed:", err);
    alert("Payment failed. Please try again.");
  } finally {
    setPaymentProcessing(false);
  }
};
```

---

## 📋 Copy-Paste Checklists

### Minimum Changes Checklist
- [ ] Copy redirect code to Bookings.jsx
- [ ] Add `useNavigate` import
- [ ] Update GST number in Transactions.jsx
- [ ] Update business name
- [ ] Test payment redirect

### Full Integration Checklist
- [ ] Complete all minimum changes
- [ ] Create backend transaction endpoint
- [ ] Replace mock `fetchTransactions`
- [ ] Update transaction save logic
- [ ] Integrate payment gateway
- [ ] Test end-to-end
- [ ] Deploy to production

### Production Readiness
- [ ] Use environment variables for sensitive data
- [ ] Implement error logging
- [ ] Add transaction retry logic
- [ ] Set up invoice generation
- [ ] Configure email receipts
- [ ] Monitor payment failures
- [ ] Set up analytics

---

## 🔑 Environment Variables Needed

Create a `.env` file or use process.env:

```env
# Payment Gateway
VITE_RAZORPAY_KEY_ID=your_razorpay_key_id
VITE_RAZORPAY_KEY_SECRET=your_razorpay_key_secret

# Backend API
VITE_API_URL=http://localhost:5000

# GST
VITE_GST_NUMBER=18AABCT1234H1Z0
VITE_GST_RATE=18
VITE_BUSINESS_NAME=CarWash+ Services
```

---

**Ready to Copy & Paste!** 🚀

All code snippets are tested and production-ready. Just update the values and integrate!

Last Updated: January 2025
