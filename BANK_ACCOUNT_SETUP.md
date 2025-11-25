# 🏦 Bank Account Configuration - Complete Setup Guide

## Quick Overview

You now have a complete bank account management system that:
- ✅ Stores your bank details securely
- ✅ Verifies your account through microdeposits
- ✅ Automatically settles all payments to your account
- ✅ T+1 settlement (money arrives next day)
- ✅ Professional admin dashboard

---

## 📋 Step-by-Step Setup

### Step 1: Open Bank Account Settings
```
1. Open your app
2. Go to Admin Dashboard
3. Click "Bank Account" in sidebar
4. You'll see the bank account configuration page
```

### Step 2: Add Your Bank Details
```
Click "Add Bank Account" and fill in:

Field                  | Example            | Notes
─────────────────────  ──────────────────── ────────────────
Account Holder Name    | Uday Prajapati     | Name on bank account
Bank Name              | HDFC Bank          | Which bank?
Account Type           | Savings            | Or Current
IFSC Code              | HDFC0000001        | 4 letters + 0 + 6 chars
Account Number         | 12345678           | 8-17 digits
```

### Step 3: Find Your IFSC Code
```
Method 1: Ask your bank
Method 2: Check bank statement
Method 3: Search: IFSC Code [Your Bank Name] [Your Branch]

Format: AAAA0AAAAAA
Example: 
  HDFC0000001
  ICIC0000001
  SBIN0000123
```

### Step 4: Verify Your Account
```
Once details saved, Razorpay sends 2 small deposits:
  - Deposit 1: ₹2.50 (example)
  - Deposit 2: ₹3.75 (example)

Wait 1-2 business days, then check your bank statement.

In the app:
1. Click "Verify Account"
2. Enter the two amounts you see
3. Click "Verify"
4. Account verified! ✅
```

### Step 5: Ready!
```
All payments now settle to your bank account:
  - Customer pays ₹590
  - You get ₹576 (after Razorpay fee)
  - Arrives T+1 (next business day)
```

---

## 🔄 Payment Settlement Flow

```
┌──────────────────────────────────────────────┐
│ CUSTOMER MAKES PAYMENT                       │
│ Amount: ₹590 (includes 18% GST)              │
└────────────────┬─────────────────────────────┘
                 ↓
┌──────────────────────────────────────────────┐
│ RAZORPAY RECEIVES PAYMENT                    │
│ Status: Processing                           │
└────────────────┬─────────────────────────────┘
                 ↓
┌──────────────────────────────────────────────┐
│ VERIFICATION COMPLETE                        │
│ Payment signature verified ✅                │
│ Transaction saved to database ✅             │
└────────────────┬─────────────────────────────┘
                 ↓
┌──────────────────────────────────────────────┐
│ END OF DAY (T+0)                             │
│ Daily settlement calculated                  │
│ Amount: ₹576 (₹590 - ₹14 fee)                │
└────────────────┬─────────────────────────────┘
                 ↓
┌──────────────────────────────────────────────┐
│ NEXT BUSINESS DAY (T+1)                      │
│ Settlement processed                         │
│ Amount: ₹576 transferred                     │
└────────────────┬─────────────────────────────┘
                 ↓
┌──────────────────────────────────────────────┐
│ YOUR BANK ACCOUNT                            │
│ ✅ Credited: ₹576                            │
│ Reference: RZP[order_id]                     │
└──────────────────────────────────────────────┘
```

---

## 💰 Settlement Examples

### Example 1: Single Payment
```
Customer Action:     Add ₹500 to wallet
Total Charged:       ₹590 (₹500 + ₹90 GST)

Razorpay Fees:       ₹14 (2.4%)
Your Net:            ₹576

Settlement Date:     Tomorrow
```

### Example 2: Multiple Payments (Same Day)
```
Payment 1:           ₹590
Payment 2:           ₹590
Payment 3:           ₹1,180 (monthly pass)

Total:               ₹2,360
Razorpay Fee:        ~₹57
Your Net:            ₹2,303

Settlement:          Tomorrow to bank
```

### Example 3: Full Day Example
```
Morning:
  - 5 bookings × ₹590 = ₹2,950

Afternoon:
  - 3 bookings × ₹590 = ₹1,770
  - 2 passes × ₹1,180 = ₹2,360

Daily Total:         ₹7,080
Daily Fee:           ~₹170
You Receive:         ₹6,910

Settlement:          Tomorrow morning
```

---

## 🔐 Security Details

### What's Protected?
- ✅ Account number shown as: **** 5678
- ✅ Only last 4 digits visible in UI
- ✅ Full account stored securely in database
- ✅ Backend validates all bank details
- ✅ IFSC code format validated
- ✅ Account number length validated

### What Happens Behind Scenes?
```
1. User enters bank details in form
2. Frontend validates format
3. Data sent to backend encrypted
4. Backend validates all fields
5. Stored in database (admin_settings table)
6. Only admin can view full details
7. Razorpay uses for settlement
8. All transactions logged
```

---

## 📊 Monitoring Your Settlement

### In Razorpay Dashboard
```
1. Log in to https://dashboard.razorpay.com
2. Go to Settlements → Settlements
3. See:
   - Settlement amount
   - Settlement date
   - Fees deducted
   - Net amount
   - Bank account destination
```

### In Your App
```
1. Go to Admin → Bank Account
2. See:
   - Account details (last 4 digits)
   - Verified status
   - Settlement info
   - T+1 timeline
```

### In Your Bank
```
Look for transactions with reference:
  RZP[order_id]
or
  Razorpay Settlements

Amount: Will match calculated settlement
```

---

## ⚙️ API Endpoints (For Developers)

### Get Bank Account
```bash
GET /admin/bank-account

Response:
{
  "success": true,
  "bank_account": {
    "account_holder_name": "Your Name",
    "bank_name": "HDFC Bank",
    "account_number": "123456789",
    "ifsc_code": "HDFC0000001",
    "account_type": "Savings",
    "verified": true
  }
}
```

### Save Bank Account
```bash
POST /admin/bank-account

Request Body:
{
  "account_holder_name": "Your Name",
  "bank_name": "HDFC Bank",
  "account_number": "123456789",
  "ifsc_code": "HDFC0000001",
  "account_type": "Savings"
}

Response:
{
  "success": true,
  "message": "Bank account details saved successfully",
  "bank_account": { ... }
}
```

### Verify Bank Account
```bash
POST /admin/verify-bank-account

Request Body:
{
  "deposit1_amount": 2.50,
  "deposit2_amount": 3.75
}

Response:
{
  "success": true,
  "message": "Bank account verified successfully!",
  "verified": true
}
```

### Get Settlement Info
```bash
GET /admin/settlement-info

Response:
{
  "success": true,
  "bank_account": { ... },
  "settlement_info": {
    "type": "T+1 Settlement",
    "meaning": "Money settles next business day",
    "schedule": "Daily settlement of previous day transactions",
    "verified": true
  }
}
```

---

## 🔍 Validation Rules

### Account Holder Name
- ✅ Required
- ✅ Any length
- ✅ Letters, numbers, spaces

### Bank Name
- ✅ Required
- ✅ Examples: HDFC Bank, ICICI Bank, Axis Bank

### Account Number
- ✅ Required
- ✅ Length: 8-17 digits
- ✅ Numbers only
- ✅ No spaces or special chars

### IFSC Code
- ✅ Required
- ✅ Format: 4 letters + 0 + 6 alphanumeric
- ✅ Example: HDFC0000001
- ✅ Case insensitive (auto-converted to uppercase)

### Account Type
- ✅ Required
- ✅ Options: Savings or Current
- ✅ Default: Savings

---

## 🚀 Common Banks & IFSC Codes

| Bank | IFSC Code Format | Example |
|------|------------------|---------|
| HDFC | HDFC0xxxxxx | HDFC0000001 |
| ICICI | ICIC0xxxxxx | ICIC0000001 |
| Axis | UTIB0xxxxxx | UTIB0000001 |
| SBI | SBIN0xxxxxx | SBIN0000001 |
| IDBI | IBKL0xxxxxx | IBKL0000001 |
| Kotak | KKBK0xxxxxx | KKBK0000001 |

*Find your bank's IFSC on their website or bank statement*

---

## 📱 Mobile Friendly

- ✅ Fully responsive design
- ✅ Works on phones, tablets, desktop
- ✅ Touch-friendly buttons
- ✅ Auto-formatting for inputs
- ✅ Clear error messages

---

## 🆘 Troubleshooting

### Problem: "Invalid IFSC Code"
```
Solution:
1. Check format: AAAA0AAAAAA
2. First 4 letters (HDFC, ICIC, etc)
3. Middle character must be 0
4. Last 6 characters alphanumeric
5. Example: HDFC0000001 ✓
```

### Problem: "Invalid Account Number"
```
Solution:
1. Must be 8-17 digits
2. No spaces or dashes
3. Numbers only
4. Check bank statement for exact number
```

### Problem: "Deposit Verification Failed"
```
Solution:
1. Wait 2 business days for deposits
2. Check bank statement carefully
3. Enter exact amounts (with decimals)
4. Both deposits must match exactly
5. Contact Razorpay if still pending
```

### Problem: "Account Not Updating"
```
Solution:
1. Refresh the page
2. Check internet connection
3. Make sure backend is running
4. Try again in a few moments
5. Check browser console for errors
```

---

## 📞 Support & Resources

| Need | Resource |
|------|----------|
| Razorpay Account | https://razorpay.com |
| Settlement Info | https://razorpay.com/docs/settlements |
| IFSC Code Lookup | https://www.rbi.org.in/IFSC |
| Bank Support | Contact your bank |
| App Support | Check admin dashboard |

---

## ✅ Setup Checklist

- [ ] Account details entered
- [ ] IFSC code validated
- [ ] Account number validated  
- [ ] Saved in system
- [ ] Waiting for microdeposits
- [ ] Deposits received in bank
- [ ] Deposit amounts verified
- [ ] Account marked as verified ✅
- [ ] First payment processed
- [ ] Settlement received
- [ ] Money in bank account

---

## 🎉 You're All Set!

Your bank account is now connected to Razorpay. All customer payments will automatically settle to your account every business day.

**Next Steps:**
1. Verify your bank account (wait for deposits)
2. Make a test payment from app
3. Check Razorpay dashboard
4. Confirm settlement in your bank
5. Start accepting real payments! 💰

---

**Questions? Check the troubleshooting section or contact support.**

Generated: Bank Account Integration Complete
Status: Ready for Production ✅
