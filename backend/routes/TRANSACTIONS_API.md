# Transactions Backend Routes API Documentation

## Overview
The transactions routes handle all payment and transaction operations for the CarWash+ application. These routes manage creating transactions, tracking payments, processing refunds, and generating transaction summaries.

---

## Base URL
```
http://localhost:5000/transactions
```

---

## Endpoints

### 1. **CREATE TRANSACTION**
**POST** `/transactions/create`

Create a new transaction record for a customer payment, refund, or wallet top-up.

#### Request Body
```json
{
  "customer_id": "user-uuid",
  "booking_id": "booking-id (optional)",
  "pass_id": "pass-id (optional)",
  "type": "booking_payment|monthly_pass|wallet_topup|refund|cashback",
  "direction": "debit|credit",
  "status": "success|failed|pending|refunded",
  "amount": 399.00,
  "gst": 72.00,
  "total_amount": 471.00,
  "currency": "INR",
  "payment_method": "upi|card|wallet|netbanking",
  "gateway_order_id": "order_123 (optional)",
  "gateway_payment_id": "pay_123 (optional)",
  "invoice_url": "url (optional)",
  "gst_number": "18AABCT1234H1Z0",
  "notes": "Exterior + Interior wash"
}
```

#### Response (Success)
```json
{
  "success": true,
  "message": "Transaction created successfully",
  "transaction": {
    "id": "trx_123",
    "customer_id": "user-uuid",
    "booking_id": "booking-id",
    "type": "booking_payment",
    "direction": "debit",
    "status": "success",
    "amount": 399.00,
    "gst": 72.00,
    "total_amount": 471.00,
    "currency": "INR",
    "payment_method": "upi",
    "gst_number": "18AABCT1234H1Z0",
    "notes": "Exterior + Interior wash",
    "created_at": "2025-01-22T05:04:00.000Z"
  }
}
```

#### Example cURL
```bash
curl -X POST http://localhost:5000/transactions/create \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": "user-uuid",
    "type": "booking_payment",
    "direction": "debit",
    "status": "success",
    "amount": 399.00,
    "gst": 72.00,
    "total_amount": 471.00,
    "currency": "INR",
    "payment_method": "upi",
    "gst_number": "18AABCT1234H1Z0"
  }'
```

---

### 2. **GET ALL TRANSACTIONS** (Admin)
**GET** `/transactions/`

Retrieve all transactions in the system (admin only).

#### Response
```json
{
  "success": true,
  "transactions": [
    {
      "id": "trx_123",
      "customer_id": "user-uuid",
      "type": "booking_payment",
      "status": "success",
      "amount": 399.00,
      "total_amount": 471.00,
      "created_at": "2025-01-22T05:04:00.000Z"
    }
  ]
}
```

---

### 3. **GET TRANSACTIONS BY CUSTOMER**
**GET** `/transactions/customer/:customer_id`

Retrieve all transactions for a specific customer.

#### Parameters
- `customer_id` (path): User ID

#### Response
```json
{
  "success": true,
  "transactions": [
    { /* transaction objects */ }
  ]
}
```

#### Example
```bash
curl http://localhost:5000/transactions/customer/user-uuid
```

---

### 4. **GET TRANSACTION BY ID**
**GET** `/transactions/:id`

Retrieve a specific transaction by ID.

#### Parameters
- `id` (path): Transaction ID

#### Response
```json
{
  "success": true,
  "transaction": {
    "id": "trx_123",
    "customer_id": "user-uuid",
    "type": "booking_payment",
    "direction": "debit",
    "status": "success",
    "amount": 399.00,
    "gst": 72.00,
    "total_amount": 471.00,
    "currency": "INR",
    "payment_method": "upi",
    "gst_number": "18AABCT1234H1Z0",
    "notes": "Exterior + Interior wash",
    "created_at": "2025-01-22T05:04:00.000Z"
  }
}
```

#### Example
```bash
curl http://localhost:5000/transactions/trx_123
```

---

### 5. **GET TRANSACTIONS BY STATUS**
**GET** `/transactions/status/:status`

Filter transactions by status (success, failed, pending, refunded).

#### Parameters
- `status` (path): Transaction status

#### Response
```json
{
  "success": true,
  "transactions": [
    { /* transaction objects */ }
  ]
}
```

#### Example
```bash
curl http://localhost:5000/transactions/status/success
```

---

### 6. **GET TRANSACTIONS BY TYPE**
**GET** `/transactions/type/:type`

Filter transactions by type (booking_payment, monthly_pass, wallet_topup, refund, cashback).

#### Parameters
- `type` (path): Transaction type

#### Response
```json
{
  "success": true,
  "transactions": [
    { /* transaction objects */ }
  ]
}
```

#### Example
```bash
curl http://localhost:5000/transactions/type/booking_payment
```

---

### 7. **GET TRANSACTION SUMMARY** (Dashboard)
**GET** `/transactions/summary/:customer_id`

Get a summary of transactions for dashboard analytics (total spent, refunded, by type, by payment method).

#### Parameters
- `customer_id` (path): User ID

#### Response
```json
{
  "success": true,
  "summary": {
    "total_transactions": 15,
    "total_spent": 5450.00,
    "total_refunded": 0,
    "successful_transactions": 14,
    "failed_transactions": 1,
    "by_type": {
      "booking_payment": 10,
      "monthly_pass": 3,
      "wallet_topup": 2
    },
    "by_payment_method": {
      "upi": 8,
      "card": 5,
      "wallet": 2
    }
  }
}
```

#### Example
```bash
curl http://localhost:5000/transactions/summary/user-uuid
```

---

### 8. **UPDATE TRANSACTION STATUS**
**PUT** `/transactions/:id`

Update the status and notes of a transaction.

#### Parameters
- `id` (path): Transaction ID

#### Request Body
```json
{
  "status": "success|failed|pending|refunded",
  "notes": "Updated notes",
  "gateway_payment_id": "new_payment_id (optional)"
}
```

#### Response
```json
{
  "success": true,
  "message": "Transaction updated successfully",
  "transaction": {
    "id": "trx_123",
    "status": "success",
    "notes": "Updated notes",
    "updated_at": "2025-01-22T06:04:00.000Z"
  }
}
```

#### Example cURL
```bash
curl -X PUT http://localhost:5000/transactions/trx_123 \
  -H "Content-Type: application/json" \
  -d '{
    "status": "success",
    "notes": "Payment confirmed"
  }'
```

---

### 9. **PROCESS REFUND**
**POST** `/transactions/refund/:id`

Process a refund for a transaction. Creates a new refund transaction and marks original as refunded.

#### Parameters
- `id` (path): Original transaction ID

#### Request Body
```json
{
  "reason": "Customer requested refund",
  "refund_amount": 399.00 (optional - defaults to original amount)
}
```

#### Response
```json
{
  "success": true,
  "message": "Refund processed successfully",
  "refund_transaction": {
    "id": "trx_456",
    "customer_id": "user-uuid",
    "type": "refund",
    "direction": "credit",
    "status": "success",
    "amount": 399.00,
    "total_amount": 471.00,
    "notes": "Refund for transaction trx_123. Reason: Customer requested refund",
    "created_at": "2025-01-22T06:04:00.000Z"
  }
}
```

#### Example cURL
```bash
curl -X POST http://localhost:5000/transactions/refund/trx_123 \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Customer requested refund"
  }'
```

---

### 10. **DELETE TRANSACTION**
**DELETE** `/transactions/:id`

Delete a transaction record (admin only).

#### Parameters
- `id` (path): Transaction ID

#### Response
```json
{
  "success": true,
  "message": "Transaction deleted successfully"
}
```

#### Example cURL
```bash
curl -X DELETE http://localhost:5000/transactions/trx_123
```

---

## Transaction Types

| Type | Description | Direction |
|------|-------------|-----------|
| `booking_payment` | Payment for car wash booking | debit |
| `monthly_pass` | Monthly pass purchase | debit |
| `wallet_topup` | Adding money to wallet | debit |
| `refund` | Money refunded to customer | credit |
| `cashback` | Cashback earned by customer | credit |

---

## Payment Methods

| Method | Description |
|--------|-------------|
| `upi` | UPI/Google Pay |
| `card` | Credit/Debit Card |
| `wallet` | App Wallet |
| `netbanking` | Net Banking |
| `other` | Other payment method |

---

## Transaction Status

| Status | Description |
|--------|-------------|
| `success` | Transaction completed successfully |
| `failed` | Transaction failed |
| `pending` | Transaction pending processing |
| `refunded` | Transaction has been refunded |

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "error": "Missing required fields. Please provide: customer_id, type, direction, amount"
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": "Transaction not found"
}
```

### 500 Server Error
```json
{
  "success": false,
  "error": "Server error: [error message]"
}
```

---

## Frontend Integration Example (React)

### Create Transaction
```javascript
const createTransaction = async (transactionData) => {
  try {
    const response = await fetch('http://localhost:5000/transactions/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(transactionData)
    });
    const result = await response.json();
    if (result.success) {
      console.log('Transaction created:', result.transaction);
    }
  } catch (error) {
    console.error('Error creating transaction:', error);
  }
};
```

### Get Customer Transactions
```javascript
const getCustomerTransactions = async (customerId) => {
  try {
    const response = await fetch(`http://localhost:5000/transactions/customer/${customerId}`);
    const result = await response.json();
    if (result.success) {
      console.log('Transactions:', result.transactions);
    }
  } catch (error) {
    console.error('Error fetching transactions:', error);
  }
};
```

### Process Refund
```javascript
const processRefund = async (transactionId, reason) => {
  try {
    const response = await fetch(`http://localhost:5000/transactions/refund/${transactionId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason })
    });
    const result = await response.json();
    if (result.success) {
      console.log('Refund processed:', result.refund_transaction);
    }
  } catch (error) {
    console.error('Error processing refund:', error);
  }
};
```

---

## Notes

- All timestamps are in ISO 8601 format (UTC)
- GST is automatically calculated as 18% in the frontend before sending to backend
- Currency is defaulted to INR
- Customer ID must be a valid Supabase user UUID
- Refund transactions are automatically created when processing a refund
- All monetary amounts should be in decimal format (e.g., 399.00)

