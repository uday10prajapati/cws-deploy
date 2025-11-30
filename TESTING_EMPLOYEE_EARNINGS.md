# Quick Testing Guide - Employee Earnings

## Problem Recap
Employee earnings were showing ₹0.00 because:
- Transactions table filters by `customer_id`
- Employees aren't customers - they don't have a `customer_id` in transactions
- Employee earnings should come from transactions linked to their assigned bookings

## Solution Recap
- Updated backend to auto-detect employee vs customer
- Employees: Get transactions from `booking_id` → bookings (where `assigned_to = employee_id`)
- Customers: Get transactions from `customer_id`

## Quick Test Steps

### Step 1: Get Employee & Booking IDs
```sql
-- Get an employee with assigned bookings
SELECT DISTINCT assigned_to, id as employee_id FROM bookings 
WHERE assigned_to IS NOT NULL LIMIT 1;

-- Get a booking for that employee
SELECT id as booking_id FROM bookings 
WHERE assigned_to = 'EMPLOYEE_ID_FROM_ABOVE' LIMIT 1;
```

### Step 2: Create Sample Transaction
```bash
curl -X POST http://localhost:5000/earnings/create-sample-transaction \
  -H "Content-Type: application/json" \
  -d '{
    "employee_id": "EMPLOYEE_ID",
    "booking_id": "BOOKING_ID",
    "amount": 500
  }'
```

### Step 3: Verify Earnings Show Up
- Go to Employee Dashboard → Earnings page
- Should show:
  - ✅ This Month: ₹500 (or higher)
  - ✅ Total Earnings: ₹500 (or higher)
  - ✅ Transactions: 1
  - ✅ Transaction listed in table

## Expected Response from Create Sample Transaction
```json
{
  "success": true,
  "transaction": {
    "id": "uuid",
    "customer_id": "employee_id",
    "booking_id": "booking_id",
    "type": "booking",
    "direction": "credit",
    "status": "success",
    "amount": 500,
    "gst": 90,
    "total_amount": 590,
    "currency": "INR",
    "payment_method": "upi",
    "created_at": "2025-12-01T..."
  },
  "message": "Sample transaction created successfully"
}
```

## Expected Earnings Endpoint Response
```bash
GET http://localhost:5000/earnings/transactions/EMPLOYEE_ID
```

```json
{
  "success": true,
  "data": {
    "totalEarnings": "500.00",
    "thisMonthEarnings": "500.00",
    "totalTransactions": 1,
    "thisMonthTransactions": 1,
    "transactions": [
      {
        "id": "...",
        "amount": 500,
        "gst": 90,
        "total_amount": 590,
        "status": "success",
        "created_at": "2025-12-01T...",
        ...
      }
    ],
    "userType": "employee"
  }
}
```

## Debugging Checklist

❓ Still showing ₹0?
- [ ] Employee ID in URL is correct
- [ ] Booking is assigned to that employee (`assigned_to = employee_id`)
- [ ] Transaction has `status = 'success'`
- [ ] Transaction has `booking_id` (linked to booking)
- [ ] Refresh page (may be cached)
- [ ] Check browser console for errors
- [ ] Check backend server logs

❓ Wrong amount?
- [ ] Verify `total_amount` includes GST
- [ ] Check if summing `amount` not `total_amount`

❓ Employee is customer?
- [ ] Need to check if that user also has entries in transactions as `customer_id`
- [ ] Endpoint returns `"userType": "employee"` if bookings found

## Real World Integration

Currently: Manual transaction creation via API

What needs to happen:
1. When booking is completed → Auto create transaction
2. When payment succeeds → Link to booking
3. Include `booking_id` in transaction
4. Set `status = 'success'`
5. Set `amount` (without GST) and `gst` separately

Then earnings will automatically calculate!

## Frontend Changes Made
- Added "Transactions" card showing count
- Changed grid from 2 to 3 columns
- Updated card colors (green, purple, blue)
- Added loading and empty states
- Transaction table displays full history

## Backend Changes Made
- Updated `GET /earnings/transactions/:id`
- Updated `GET /earnings/dashboard-summary/:id`
- Added `POST /earnings/create-sample-transaction`
- Auto-detection logic: Check if user has assigned bookings
- If yes → Employee path
- If no → Customer path

## Files to Check
1. `backend/routes/earningsRoutes.js` - Main logic
2. `frontend/src/Employee/Earnings.jsx` - UI display
3. `backend/EMPLOYEE_EARNINGS_SETUP.sql` - SQL examples
4. `EMPLOYEE_EARNINGS_FIX.md` - Full documentation

## Next Steps to Integrate
1. Hook booking completion → transaction creation
2. Hook payment success → transaction creation
3. Include booking_id when recording transaction
4. Test end-to-end payment flow

## Questions?
Check the detailed documentation: `EMPLOYEE_EARNINGS_FIX.md`
