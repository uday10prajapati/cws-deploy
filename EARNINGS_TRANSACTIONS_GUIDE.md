# Earnings & Transactions Implementation Guide

## Overview

Successfully implemented earnings tracking from the **transactions table** for employees. The system now fetches successful transactions and displays them on the dashboard and earnings page.

---

## Database Schema

### Transactions Table
The `transactions` table stores all payment transactions with the following key fields:
- `id` - UUID primary key
- `customer_id` - Links to the employee/user
- `booking_id` - Links to completed booking (nullable)
- `pass_id` - Links to monthly pass (nullable)
- `type` - Transaction type (payment, booking, pass, wallet, pickup, delivery, monthly_pass_purchase)
- `direction` - debit or credit
- `status` - success, failed, pending, refunded
- `amount` - Transaction amount
- `gst` - GST amount
- `total_amount` - Total including GST
- `payment_method` - upi, card, wallet, netbanking, other
- `gateway_order_id` & `gateway_payment_id` - Payment gateway references
- `created_at` - Timestamp
- Multiple indexes for fast queries

---

## Backend Endpoints

### 1. **Fetch Employee Transactions**
**Endpoint:** `GET /earnings/transactions/:customer_id`

**Returns:**
```json
{
  "success": true,
  "data": {
    "totalEarnings": "5000.00",
    "thisMonthEarnings": "2500.00",
    "totalTransactions": 15,
    "thisMonthTransactions": 8,
    "transactions": [ /* array of transactions */ ]
  }
}
```

---

### 2. **Dashboard Earnings Summary**
**Endpoint:** `GET /earnings/dashboard-summary/:customer_id`

**Returns:**
```json
{
  "success": true,
  "data": {
    "thisMonthEarnings": "2500.00",
    "thisMonthTransactionCount": 8
  }
}
```

---

### 3. **Record New Transaction**
**Endpoint:** `POST /earnings/record-transaction`

**Request:**
```json
{
  "customer_id": "uuid",
  "booking_id": "uuid (optional)",
  "pass_id": "uuid (optional)",
  "type": "booking",
  "direction": "credit",
  "amount": 500,
  "gst": 90,
  "payment_method": "upi",
  "gateway_order_id": "order_12345",
  "gateway_payment_id": "pay_67890",
  "notes": "Booking completed"
}
```

**Response:**
```json
{
  "success": true,
  "transaction": { /* transaction details */ },
  "message": "Transaction recorded successfully"
}
```

---

## Frontend Components

### 1. **EmployeeDashboard.jsx**

**Changes:**
- Added `earnings` state to store monthly earnings
- Added `fetchEarnings()` function that calls `/earnings/dashboard-summary/:userId`
- Updated "Earnings This Month" card to display from transactions table
- Now shows: `₹${earnings.thisMonthEarnings}`

**Key Code:**
```jsx
const [earnings, setEarnings] = useState({ thisMonthEarnings: 0, totalEarnings: 0 });

const fetchEarnings = async (userId) => {
  const response = await fetch(`http://localhost:5000/earnings/dashboard-summary/${userId}`);
  const data = await response.json();
  if (data.success) {
    setEarnings({
      thisMonthEarnings: data.data.thisMonthEarnings || 0,
      totalEarnings: data.data.thisMonthEarnings || 0
    });
  }
};
```

---

### 2. **Earnings.jsx**

**Changes:**
- Updated to fetch from transactions table instead of bookings
- Shows transaction history with columns: Date, Type, Method, Amount, Status
- Displays "This Month" and "Total Earnings" cards
- Loading state for better UX

**Key Data Displayed:**
- This Month's Earnings (from successful transactions)
- Total Earnings (all-time)
- Transaction History Table with:
  - Date (formatted as en-IN)
  - Type (booking, payment, pass, etc.)
  - Payment Method (UPI, Card, Wallet, etc.)
  - Total Amount (including GST)
  - Status (success, pending, failed, refunded)

**Key Code:**
```jsx
const [transactions, setTransactions] = useState([]);
const [monthlyTotal, setMonthlyTotal] = useState(0);
const [totalEarnings, setTotalEarnings] = useState(0);

const loadData = async () => {
  const response = await fetch(`http://localhost:5000/earnings/transactions/${auth.user.id}`);
  const result = await response.json();
  if (result.success) {
    setTransactions(result.data.transactions || []);
    setMonthlyTotal(parseFloat(result.data.thisMonthEarnings) || 0);
    setTotalEarnings(parseFloat(result.data.totalEarnings) || 0);
  }
};
```

---

## How It Works

### 1. **Dashboard Flow**
```
EmployeeDashboard loads
  ↓
Fetches bookings via /employee/bookings/:userId
  ↓
Fetches earnings via /earnings/dashboard-summary/:userId
  ↓
Displays:
  - Pending bookings count
  - Completed bookings count
  - THIS MONTH'S EARNINGS (from transactions)
  - Average rating
```

### 2. **Earnings Page Flow**
```
Earnings.jsx mounts
  ↓
Fetches all transactions via /earnings/transactions/:userId
  ↓
Calculates:
  - Total earnings
  - This month earnings
  - Transaction count
  ↓
Displays transaction history table with:
  - Payment dates
  - Transaction types
  - Payment methods
  - Amounts (including GST)
  - Status badges
```

### 3. **Transaction Recording Flow**
```
After successful payment:
  ↓
Call: POST /earnings/record-transaction
  ↓
Backend creates entry in transactions table
  ↓
Frontend refreshes earnings data
```

---

## Filtering Logic

### This Month's Earnings
```javascript
// Backend calculates transactions within current month
const now = new Date();
const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

const thisMonthTransactions = transactions.filter(t => {
  const tDate = new Date(t.created_at);
  return tDate >= monthStart && tDate <= monthEnd;
});
```

### Only Success Transactions
```javascript
// Backend filters for successful transactions
const { data: transactions } = await supabase
  .from("transactions")
  .select("*")
  .eq("customer_id", customer_id)
  .eq("status", "success")  // Only successful payments
  .order("created_at", { ascending: false });
```

---

## Testing the Feature

### 1. **Create a Test Transaction**
```bash
curl -X POST http://localhost:5000/earnings/record-transaction \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": "USER_UUID",
    "type": "booking",
    "direction": "credit",
    "amount": 500,
    "gst": 90,
    "payment_method": "upi",
    "notes": "Test transaction"
  }'
```

### 2. **View Earnings on Dashboard**
- Navigate to `/employee-dashboard`
- Should show "Earnings This Month" card with amount
- If no transactions, shows ₹0

### 3. **View Transactions on Earnings Page**
- Navigate to `/employee/earnings`
- Should show transaction history table
- Displays all successful transactions
- Calculates monthly vs total earnings

---

## API Response Examples

### Get Transactions Response
```json
{
  "success": true,
  "data": {
    "totalEarnings": "12500.00",
    "thisMonthEarnings": "3500.00",
    "totalTransactions": 25,
    "thisMonthTransactions": 8,
    "transactions": [
      {
        "id": "uuid-1",
        "customer_id": "uuid-2",
        "booking_id": "uuid-3",
        "type": "booking",
        "direction": "credit",
        "status": "success",
        "amount": 500,
        "gst": 90,
        "total_amount": 590,
        "currency": "INR",
        "payment_method": "upi",
        "gateway_order_id": "order_12345",
        "gateway_payment_id": "pay_67890",
        "created_at": "2025-12-01T10:30:00+00:00"
      }
    ]
  }
}
```

---

## Key Features

✅ **Fetches from Transactions Table** - Uses the dedicated transactions table for accurate financial data  
✅ **This Month Calculation** - Automatically calculates current month earnings  
✅ **Success Filter** - Only counts successful payments  
✅ **Dashboard Integration** - Shows earnings on main dashboard  
✅ **Earnings Page** - Detailed transaction history  
✅ **GST Included** - Total amount includes GST  
✅ **Payment Methods** - Shows payment method for each transaction  
✅ **Status Tracking** - Displays transaction status (success, pending, failed)  
✅ **Date Formatting** - Uses Indian date format (en-IN)  
✅ **Responsive UI** - Mobile and desktop friendly  

---

## Next Steps

### Optional Enhancements:
1. **Refund Tracking** - Handle refunded transactions separately
2. **Monthly Reports** - Generate PDF earnings reports
3. **Payment Analytics** - Chart showing daily/weekly earnings trends
4. **Tax Summary** - Calculate total GST collected
5. **Export to Excel** - Download transaction history
6. **Reconciliation** - Match transactions with payment gateway records

---

## Files Modified

✅ `backend/routes/earningsRoutes.js` - Added transaction endpoints  
✅ `frontend/src/Employee/EmployeeDashboard.jsx` - Added earnings fetch  
✅ `frontend/src/Employee/Earnings.jsx` - Updated to use transactions table

---

## Summary

The earnings tracking system is now fully functional:
- ✅ Fetches success transactions from transactions table
- ✅ Shows this month earnings on dashboard
- ✅ Displays full transaction history on earnings page
- ✅ Includes GST and payment methods
- ✅ Calculates monthly and total earnings
- ✅ No compile errors
- ✅ Ready for testing!
