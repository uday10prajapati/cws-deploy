# Example: Booking to Payment Integration

This file shows how to update your Bookings.jsx to redirect to the payment page after booking creation.

## Current Setup Issue

Your Bookings.jsx currently redirects to `/bookings` after successful booking:
```jsx
setTimeout(() => {
  window.location.href = "/bookings";
}, 1800);
```

## Solution: Redirect to Payment Instead

### Option 1: Simple URL Redirect (Easiest)

```jsx
// In Bookings.jsx - handleSubmit function
// After successful booking creation:

const handleSubmit = async (e) => {
  e.preventDefault();
  
  if (!user) return;
  
  if (!usePass) {
    if (!customCarName || !selectedServices.length || !selectedDate || !timeSlot) return;
  } else {
    if (!customCarName || !selectedDate || !timeSlot) return;
  }

  setLoading(true);

  try {
    const response = await fetch("http://localhost:5000/bookings/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customer_id: user.id,
        car_id: selectedCarId,
        car_name: customCarName,
        services: selectedServices,
        addons: selectedAddons,
        amount: usePass ? 0 : totalPrice,
        date: selectedDate,
        time: timeSlot,
        pickup,
        notes,
        status: "Pending",
        location: location || "Main Outlet",
        pass_id: usePass ? activePass.id : null,
      }),
    });

    const result = await response.json();

    if (!result.success) {
      alert("Failed to create booking!");
      setLoading(false);
      return;
    }

    // ✅ NEW: Deduct wash from pass if using pass
    if (usePass && activePass) {
      try {
        const updateRes = await fetch(
          `http://localhost:5000/pass/${activePass.id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              remaining_washes: activePass.remaining_washes - 1,
            }),
          }
        );
      } catch (err) {
        console.error("Error deducting wash:", err);
      }
    }

    // ✅ REDIRECT TO PAYMENT PAGE
    // If using pass, no payment needed, go to bookings
    if (usePass) {
      setLoading(false);
      setShowSuccess(true);
      setTimeout(() => {
        window.location.href = "/bookings";
      }, 1800);
    } else {
      // If not using pass, redirect to payment
      setTimeout(() => {
        window.location.href = 
          `/transactions?payment=true&amount=${totalPrice}&type=booking_payment&bookingId=${result.data.id}`;
      }, 1000);
    }

  } catch (err) {
    console.error("BOOKING ERROR:", err);
    alert("Server Error");
    setLoading(false);
  }
};
```

---

### Option 2: React Router with State (Recommended)

First, add `useNavigate` import:
```jsx
import { useNavigate } from "react-router-dom";

// In your component
const navigate = useNavigate();
```

Then update the submit handler:

```jsx
const handleSubmit = async (e) => {
  e.preventDefault();
  
  if (!user) return;
  
  if (!usePass) {
    if (!customCarName || !selectedServices.length || !selectedDate || !timeSlot) return;
  } else {
    if (!customCarName || !selectedDate || !timeSlot) return;
  }

  setLoading(true);

  try {
    const response = await fetch("http://localhost:5000/bookings/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customer_id: user.id,
        car_id: selectedCarId,
        car_name: customCarName,
        services: selectedServices,
        addons: selectedAddons,
        amount: usePass ? 0 : totalPrice,
        date: selectedDate,
        time: timeSlot,
        pickup,
        notes,
        status: "Pending",
        location: location || "Main Outlet",
        pass_id: usePass ? activePass.id : null,
      }),
    });

    const result = await response.json();

    if (!result.success) {
      alert("Failed to create booking!");
      setLoading(false);
      return;
    }

    // Deduct wash from pass if using pass
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

    // Show success message
    setShowSuccess(true);
    setLoading(false);

    // Redirect based on payment requirement
    setTimeout(() => {
      if (usePass) {
        // Pass covers booking, no payment needed
        navigate("/bookings");
      } else {
        // Need payment
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

  } catch (err) {
    console.error("BOOKING ERROR:", err);
    alert("Server Error");
    setLoading(false);
  }
};
```

---

## For Monthly Pass Purchase

Create a similar integration in your Monthly Pass purchase flow:

```jsx
const handleBuyPass = async (passType) => {
  // Get pass price based on type
  const passPrice = getPassPrice(passType); // Your function
  
  try {
    // Create pass in backend
    const response = await fetch("http://localhost:5000/pass/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customer_id: user.id,
        pass_type: passType,
        total_washes: getTotalWashes(passType),
        remaining_washes: getTotalWashes(passType),
        valid_till: calculateExpiryDate(),
      }),
    });

    const result = await response.json();

    if (result.success) {
      // Redirect to payment
      navigate("/transactions", {
        state: {
          showPayment: true,
          paymentData: {
            amount: passPrice,
            type: "monthly_pass",
            bookingId: null,
            passId: result.data.id,
          }
        }
      });
    }
  } catch (err) {
    console.error("Pass creation error:", err);
    alert("Failed to create pass");
  }
};
```

---

## Payment Success Handling

In Transactions.jsx, the `handlePaymentSuccess` function receives the transaction:

```jsx
const handlePaymentSuccess = (transaction) => {
  // 1. Add transaction to list
  setTransactions([transaction, ...transactions]);
  
  // 2. Close payment page
  setShowPayment(false);
  setPaymentData(null);
  
  // 3. Show success message or redirect
  // Option A: Show success and stay on transactions page
  alert("✅ Payment successful! Your booking is confirmed.");
  
  // Option B: Redirect to bookings page
  // window.location.href = "/bookings";
};
```

---

## Backend Changes Needed

Your backend needs to handle payment data. Example:

```javascript
// POST /api/transactions/create
app.post("/transactions/create", async (req, res) => {
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
    createdAt
  } = req.body;

  try {
    // Save transaction to database
    const transaction = await db.transactions.create({
      customer_id: customerId,
      type,
      direction,
      status,
      amount,
      gst,
      total_amount: totalAmount,
      payment_method: paymentMethod,
      booking_id: bookingId,
      pass_id: passId,
      gst_number: gstNumber,
      notes,
      created_at: new Date(),
    });

    // If booking payment, update booking status
    if (type === "booking_payment" && bookingId) {
      await db.bookings.update(
        { id: bookingId },
        { payment_status: "completed", booking_status: "confirmed" }
      );
    }

    // If pass payment, activate pass
    if (type === "monthly_pass" && passId) {
      await db.passes.update(
        { id: passId },
        { status: "active" }
      );
    }

    res.json({
      success: true,
      data: transaction
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
```

---

## Flow Diagram

```
┌─────────────────────┐
│   User Books Wash   │
└──────────┬──────────┘
           │
           ├─────────────────────────┐
           │                         │
      ┌────▼──────┐            ┌─────▼──────┐
      │ Using Pass?│            │ Using Pass?│
      └────┬──────┘            └─────┬──────┘
           │ YES                     │ NO
           │                         │
      ┌────▼──────────┐        ┌────▼────────────┐
      │ Deduct Wash   │        │ Create Payment  │
      │ From Pass     │        │ Transaction     │
      └────┬──────────┘        └────┬────────────┘
           │                         │
           │                    ┌────▼───────────┐
           │                    │ Show Payment   │
           │                    │ Page (with GST)│
           │                    └────┬───────────┘
           │                         │
           │                    ┌────▼───────────┐
           │                    │ Process Payment│
           │                    │ (via Gateway)  │
           │                    └────┬───────────┘
           │                         │
      ┌────▼──────────┐        ┌────▼────────────┐
      │ Show Booking  │        │ Save Transaction│
      │ Confirmed     │        │ Update Booking  │
      └────┬──────────┘        └────┬────────────┘
           │                         │
      ┌────▼──────────────────────────▼──────┐
      │   Redirect to My Bookings Page       │
      └─────────────────────────────────────┘
```

---

## Testing the Flow

1. **Test without pass:**
   - Create booking
   - Should redirect to payment page
   - Payment page shows correct amount + GST
   - After payment, transaction appears in list

2. **Test with pass:**
   - Create booking using pass
   - Should redirect to bookings page (no payment)
   - Wash count should decrease in pass

3. **Test payment methods:**
   - All 4 payment methods should be selectable
   - Each should show correct description

4. **Test GST:**
   - Amount: ₹500
   - GST: ₹90
   - Total: ₹590
   - GST number visible

---

## Common Issues & Solutions

### Issue: Payment data not showing
**Solution:** Ensure `useNavigate` is imported and state object is passed correctly

### Issue: GST not calculating
**Solution:** Check GST_RATE constant is set to 0.18 (18%)

### Issue: Redirect loop
**Solution:** Ensure transaction is created before redirecting to avoid duplicate bookings

### Issue: Mobile payment not working
**Solution:** Check mobile responsive design, ensure buttons are not overlapped

---

**Version:** 1.0
**Last Updated:** January 2025
