-- EMPLOYEE EARNINGS SETUP GUIDE
-- This script populates sample transactions to test employee earnings

-- Step 1: Get an employee ID from bookings table
-- SELECT DISTINCT assigned_to FROM bookings WHERE assigned_to IS NOT NULL LIMIT 1;

-- Step 2: Get a booking ID assigned to that employee
-- SELECT id, assigned_to, amount FROM bookings WHERE assigned_to = 'employee_uuid_here' LIMIT 1;

-- Step 3: Insert sample transactions for that employee
-- Replace 'employee_uuid' and 'booking_id' with actual IDs

-- Sample successful transaction from today (for current month)
INSERT INTO transactions (
  customer_id,
  booking_id,
  type,
  direction,
  status,
  amount,
  gst,
  total_amount,
  currency,
  payment_method,
  gateway_order_id,
  gateway_payment_id,
  notes,
  created_at
) VALUES (
  'employee_uuid',
  'booking_id',
  'booking',
  'credit',
  'success',
  500.00,
  90.00,
  590.00,
  'INR',
  'upi',
  'order_' || gen_random_uuid()::text,
  'pay_' || gen_random_uuid()::text,
  'Employee booking payment',
  CURRENT_TIMESTAMP
);

-- Sample transaction from last month
INSERT INTO transactions (
  customer_id,
  booking_id,
  type,
  direction,
  status,
  amount,
  gst,
  total_amount,
  currency,
  payment_method,
  gateway_order_id,
  gateway_payment_id,
  notes,
  created_at
) VALUES (
  'employee_uuid',
  'booking_id',
  'booking',
  'credit',
  'success',
  300.00,
  54.00,
  354.00,
  'INR',
  'upi',
  'order_' || gen_random_uuid()::text,
  'pay_' || gen_random_uuid()::text,
  'Employee booking payment from previous month',
  CURRENT_TIMESTAMP - INTERVAL '35 days'
);

-- HOW EARNINGS ARE CALCULATED:
-- 1. For Employees:
--    - Fetch all bookings where assigned_to = employee_id
--    - Get transactions linked to those booking IDs
--    - Filter for status = 'success'
--    - Sum all amounts for total earnings
--    - Filter by month for monthly earnings

-- 2. For Customers:
--    - Fetch all transactions where customer_id = customer_id
--    - Filter for status = 'success'
--    - Calculate totals

-- TO TEST WITH API:
-- 1. Get an employee ID and booking ID from your database
-- 2. POST to http://localhost:5000/earnings/create-sample-transaction
--    Body: {
--      "employee_id": "employee_uuid",
--      "booking_id": "booking_id",
--      "amount": 500
--    }
-- 3. GET http://localhost:5000/earnings/transactions/employee_uuid
--    Should now show the transaction data

-- KEY FIELDS TO UNDERSTAND:
-- - customer_id: Links to the user (for employees, this is their ID to track earnings)
-- - booking_id: Links to the booking this transaction is for
-- - direction: 'credit' (money in) or 'debit' (money out)
-- - status: Only 'success' transactions count towards earnings
-- - amount: Base amount before GST
-- - gst: 18% tax
-- - total_amount: amount + gst

-- IMPORTANT NOTES:
-- - Transactions must have status = 'success' to count
-- - For employees, transactions must be linked via booking_id to a booking assigned to them
-- - The endpoint automatically detects if user is employee or customer based on assigned_to in bookings
