# Employee Earnings from Transactions Table - Fix & Setup Guide

## Problem
Employee earnings page was showing 0 because:
1. The earnings endpoint was filtering by `customer_id` in transactions table
2. Employees are NOT customers - transactions table links to `customer_id` (who paid)
3. Employee earnings should be tracked through `booking_id` → bookings (assigned_to) → transactions relationship

## Solution
Updated backend endpoints to:
1. **Detect if user is Employee or Customer**
   - Check if user has any bookings where `assigned_to = user_id`
   - If YES → Employee (fetch transactions via booking links)
   - If NO → Customer (fetch transactions via customer_id)

2. **For Employees**: Fetch transactions linked to their assigned bookings
3. **For Customers**: Fetch transactions where they are the customer

## Updated Endpoints

### GET /earnings/transactions/:user_id
**What it does:**
- Automatically detects if user is employee or customer
- For employees: Gets all successful transactions from bookings assigned to them
- For customers: Gets all successful transactions they paid for
- Calculates total and monthly earnings
- Returns transaction list with earnings breakdown

**Response:**
```json
{
  "success": true,
  "data": {
    "totalEarnings": "1234.50",
    "thisMonthEarnings": "500.00",
    "totalTransactions": 3,
    "thisMonthTransactions": 1,
    "transactions": [...],
    "userType": "employee"
  }
}
```

### GET /earnings/dashboard-summary/:user_id
**What it does:**
- Quick dashboard summary (for top cards)
- Auto-detects employee vs customer
- Returns current month earnings for the dashboard

### POST /earnings/record-transaction
**What it does:**
- Records a new transaction after payment
- Called after successful payment from any payment method

### POST /earnings/create-sample-transaction (NEW - FOR TESTING)
**What it does:**
- Creates sample transactions for development/testing
- Use this to populate test data

**Request:**
```json
{
  "employee_id": "uuid-of-employee",
  "booking_id": "uuid-of-booking-assigned-to-employee",
  "amount": 500
}
```

## How Transactions Are Created

### Current Flow (Manual)
1. Employee completes a booking
2. Customer makes payment
3. Call `POST /earnings/record-transaction` with transaction details
4. Include `booking_id` to link to the booking

### Production Flow (To Implement)
1. When booking status changes to "Completed"
2. And payment is received
3. Automatically create transaction with `booking_id`

## Database Relationships

```
Employee (auth.users)
  ↓ assigned_to
Bookings
  ↓ id (booking_id)
Transactions (status = 'success')
  ↓
Employee Earnings
```

**Key Fields in Transactions Table:**
- `customer_id`: User who made the payment (for customers)
- `booking_id`: Booking this transaction is for (for employees via this)
- `direction`: 'credit' (money in) or 'debit' (money out)
- `status`: Must be 'success' to count
- `amount`: Base amount before GST
- `gst`: 18% tax
- `total_amount`: amount + gst

## Testing Setup

### Option 1: Using API Endpoint (Recommended for quick testing)
```bash
# 1. Get your employee ID and a booking ID
# Employee should be assigned_to that booking

# 2. Create sample transaction via API
POST http://localhost:5000/earnings/create-sample-transaction
{
  "employee_id": "your-employee-uuid",
  "booking_id": "booking-assigned-to-employee",
  "amount": 500
}

# 3. Check earnings in employee dashboard
GET http://localhost:5000/earnings/transactions/your-employee-uuid
```

### Option 2: Using SQL (Direct Database)
See `EMPLOYEE_EARNINGS_SETUP.sql` for sample queries

## Troubleshooting

### Still showing 0 earnings?
1. **Check bookings table**: Are there bookings with `assigned_to = employee_id`?
   ```sql
   SELECT * FROM bookings WHERE assigned_to = 'your-employee-id';
   ```

2. **Check transactions table**: Are there transactions with `booking_id` in those bookings AND `status = 'success'`?
   ```sql
   SELECT * FROM transactions 
   WHERE booking_id IN (
     SELECT id FROM bookings WHERE assigned_to = 'your-employee-id'
   ) AND status = 'success';
   ```

3. **Create sample transaction**:
   ```sql
   INSERT INTO transactions (
     customer_id, booking_id, type, direction, status,
     amount, gst, total_amount, currency, payment_method,
     gateway_order_id, gateway_payment_id, notes
   ) VALUES (
     'employee-id', 'booking-id', 'booking', 'credit', 'success',
     500, 90, 590, 'INR', 'upi',
     'order_test', 'pay_test', 'Test transaction'
   );
   ```

4. **Verify endpoint response**:
   - Check browser console for API response
   - Should show `"userType": "employee"` in response
   - Should list transactions in the array

### Earnings showing but wrong amounts?
1. Check `total_amount` includes GST
2. Verify `status = 'success'` (not 'pending' or 'failed')
3. Confirm `amount` is numeric type, not string

## Frontend Integration (Employee/Earnings.jsx)

The page fetches from:
```javascript
const response = await fetch(`http://localhost:5000/earnings/transactions/${auth.user.id}`);
```

Shows:
- This Month (green card)
- Total Earnings (purple card)  
- Transaction Count (blue card)
- Transaction history table

## Files Modified

1. **backend/routes/earningsRoutes.js**
   - Updated `GET /earnings/transactions/:customer_id`
   - Updated `GET /earnings/dashboard-summary/:customer_id`
   - Added `POST /earnings/create-sample-transaction`
   - Now auto-detects employee vs customer

2. **backend/EMPLOYEE_EARNINGS_SETUP.sql** (NEW)
   - SQL examples for testing

3. **frontend/src/Employee/Earnings.jsx** (Previously fixed)
   - Added third summary card for transaction count
   - Displays earnings from transactions table

## Next Steps

1. **Create transactions when bookings are completed**
   - Modify bookings routes to create transaction on completion
   - Include booking_id in transaction

2. **Integrate with payment flow**
   - When payment succeeds, auto-create transaction
   - Call `POST /earnings/record-transaction`

3. **Add transaction analytics**
   - Daily breakdown
   - Service type breakdown
   - Payment method breakdown

## Summary

✅ **Fixed**: Employees now fetch earnings from transactions table correctly
✅ **Feature**: Auto-detection of employee vs customer
✅ **Testing**: Sample transaction creation endpoint added
✅ **Documentation**: Complete setup guide provided

The system now correctly shows employee earnings from successful booking payments tracked in the transactions table.
