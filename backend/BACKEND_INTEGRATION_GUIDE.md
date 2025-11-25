# Backend Routes Integration Guide

## Setup Instructions

### 1. Database Table (Supabase)

Make sure you have a `transactions` table in your Supabase database with the following columns:

```sql
CREATE TABLE transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES auth.users(id),
  booking_id UUID REFERENCES bookings(id),
  pass_id UUID REFERENCES monthly_pass(id),
  type TEXT NOT NULL,
  direction TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  amount DECIMAL(10,2) NOT NULL,
  gst DECIMAL(10,2),
  total_amount DECIMAL(10,2),
  currency TEXT DEFAULT 'INR',
  payment_method TEXT,
  gateway_order_id TEXT,
  gateway_payment_id TEXT,
  invoice_url TEXT,
  gst_number TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for better query performance
CREATE INDEX idx_transactions_customer_id ON transactions(customer_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_payment_method ON transactions(payment_method);
```

### 2. Server Registration (Already Done ✅)

The transactions route is already registered in `server.js`:

```javascript
import transactionsRoutes from "./routes/transactionsRoutes.js";
app.use("/transactions", transactionsRoutes);
```

---

## API Endpoints Summary

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/transactions/create` | Create new transaction |
| GET | `/transactions/` | Get all transactions (admin) |
| GET | `/transactions/customer/:customer_id` | Get customer transactions |
| GET | `/transactions/:id` | Get transaction by ID |
| GET | `/transactions/status/:status` | Filter by status |
| GET | `/transactions/type/:type` | Filter by type |
| GET | `/transactions/summary/:customer_id` | Get transaction summary |
| PUT | `/transactions/:id` | Update transaction |
| POST | `/transactions/refund/:id` | Process refund |
| DELETE | `/transactions/:id` | Delete transaction |

---

## Frontend Integration Examples

### 1. Creating a Transaction After Payment

```javascript
// In Transactions.jsx - PaymentPage component
const handlePaymentSuccess = async (transaction) => {
  try {
    const response = await fetch('http://localhost:5000/transactions/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_id: user.id,
        type: type,
        direction: 'debit',
        status: 'success',
        amount: amount,
        gst: gstAmount,
        total_amount: totalAmount,
        currency: 'INR',
        payment_method: selectedPayment,
        booking_id: bookingId || null,
        pass_id: passId || null,
        gst_number: GST_NUMBER,
        notes: `Payment via ${paymentLabel[selectedPayment]}`
      })
    });

    const result = await response.json();
    if (result.success) {
      console.log('✅ Transaction saved:', result.transaction);
      onSuccess(result.transaction);
    }
  } catch (error) {
    console.error('❌ Error saving transaction:', error);
  }
};
```

### 2. Fetching Customer Transactions

```javascript
// In Transactions.jsx - TransactionsPage component
useEffect(() => {
  const loadTransactions = async () => {
    if (!user) return;

    try {
      const response = await fetch(`http://localhost:5000/transactions/customer/${user.id}`);
      const result = await response.json();
      
      if (result.success) {
        setTransactions(result.transactions);
        console.log('✅ Transactions loaded:', result.transactions);
      }
    } catch (error) {
      console.error('❌ Error loading transactions:', error);
      setError('Failed to load transactions');
    }
  };

  loadTransactions();
}, [user]);
```

### 3. Processing a Refund

```javascript
const handleRefund = async (transactionId) => {
  try {
    const response = await fetch(`http://localhost:5000/transactions/refund/${transactionId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reason: 'Customer requested refund',
        refund_amount: 399.00 // optional
      })
    });

    const result = await response.json();
    if (result.success) {
      console.log('✅ Refund processed:', result.refund_transaction);
      // Reload transactions
      // Show success message
    }
  } catch (error) {
    console.error('❌ Error processing refund:', error);
  }
};
```

### 4. Getting Transaction Summary

```javascript
const loadTransactionSummary = async (customerId) => {
  try {
    const response = await fetch(`http://localhost:5000/transactions/summary/${customerId}`);
    const result = await response.json();
    
    if (result.success) {
      console.log('📊 Summary:', result.summary);
      // Use for dashboard analytics
      // Display total spent, refunded, etc.
    }
  } catch (error) {
    console.error('❌ Error loading summary:', error);
  }
};
```

---

## Replace Mock API with Real Backend

### Current Mock API (In Transactions.jsx)

```javascript
async function fetchTransactions() {
  return [
    {
      id: "TRX934820",
      bookingId: "BKG1231",
      type: "booking_payment",
      // ... mock data
    }
  ];
}
```

### Replace With Backend Call

```javascript
async function fetchTransactions(customerId) {
  try {
    const response = await fetch(`http://localhost:5000/transactions/customer/${customerId}`);
    const result = await response.json();
    
    if (result.success) {
      return result.transactions;
    }
    return [];
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return [];
  }
}
```

### Update useEffect in TransactionsPage

```javascript
useEffect(() => {
  (async () => {
    try {
      if (user) {
        const data = await fetchTransactions(user.id);
        data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        setTransactions(data);
      }
    } catch (err) {
      setError("Failed to load transactions");
    } finally {
      setLoading(false);
    }
  })();
}, [user, redirectedPaymentData, showPaymentPageOnLoad]);
```

---

## Workflow: Booking to Payment to Transaction

### 1. User Books a Wash (Bookings.jsx)
```
User clicks "Confirm Booking" 
  → Booking created in database
  → Redirects to /transactions with payment data
```

### 2. Payment Page Loads (Transactions.jsx)
```
PaymentPage component receives:
  - amount: 399
  - type: "booking_payment"
  - bookingId: "BKG1231"
```

### 3. User Completes Payment
```
User selects payment method (UPI, Card, etc.)
  → Click "Pay" button
  → Simulate 2-second payment
  → On success:
    - Create transaction record in backend
    - Display success message
    - Redirect to transactions page
```

### 4. Transaction Saved
```
POST /transactions/create
  ↓
Backend stores in database
  ↓
Returns transaction object
  ↓
Frontend updates UI with new transaction
```

---

## Testing the Routes with Postman/cURL

### Create a Test Transaction

```bash
curl -X POST http://localhost:5000/transactions/create \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": "your-user-uuid",
    "type": "booking_payment",
    "direction": "debit",
    "status": "success",
    "amount": 399,
    "gst": 72,
    "total_amount": 471,
    "currency": "INR",
    "payment_method": "upi",
    "gst_number": "18AABCT1234H1Z0",
    "notes": "Test transaction"
  }'
```

### Get All Transactions for Customer

```bash
curl http://localhost:5000/transactions/customer/your-user-uuid
```

### Get Transaction Summary

```bash
curl http://localhost:5000/transactions/summary/your-user-uuid
```

### Process a Refund

```bash
curl -X POST http://localhost:5000/transactions/refund/transaction-id \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Test refund"
  }'
```

---

## Error Handling Best Practices

```javascript
const handleTransactionCreate = async (data) => {
  try {
    const response = await fetch('http://localhost:5000/transactions/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    // Check if response is ok
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    // Check if request was successful
    if (!result.success) {
      throw new Error(result.error || 'Unknown error');
    }

    // Success
    console.log('✅ Success:', result.transaction);
    return result.transaction;

  } catch (error) {
    // Handle errors
    console.error('❌ Error:', error.message);
    
    // Show user-friendly error message
    alert('Failed to save transaction. Please try again.');
    
    return null;
  }
};
```

---

## Next Steps

1. ✅ **Routes Created** - Backend routes are ready
2. ✅ **Documentation Created** - API documentation available
3. **Database Setup** - Create the `transactions` table in Supabase
4. **Frontend Integration** - Replace mock API with backend calls
5. **Testing** - Test all endpoints with real data
6. **Payment Gateway** - Integrate with Razorpay or similar

---

## Important Notes

- All monetary amounts should be sent as numbers (not strings)
- GST is pre-calculated on frontend (18% of amount)
- Customer ID must be a valid Supabase user UUID
- Timestamps are in ISO 8601 format
- Always include proper error handling in frontend calls
- Test refund functionality thoroughly before deployment

