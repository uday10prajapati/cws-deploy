# 🏦 Bank Account - Quick Start (5 Minutes)

## ⚡ Super Quick Setup

### Step 1: Create Database Table (2 min)
```
1. Open Supabase Dashboard
2. Go to SQL Editor
3. Create new query
4. Copy & paste from: backend/ADMIN_SETTINGS_SCHEMA.sql
5. Click "RUN" ✅
```

### Step 2: Start Backend (1 min)
```bash
cd backend
npm start
# Should say: ✅ Server started on port 5000
```

### Step 3: Start Frontend (1 min)
```bash
cd frontend
npm start
# Should open browser with your app
```

### Step 4: Add Bank Account (1 min)
```
1. Admin Dashboard → Click "Bank Account" (sidebar)
2. Click "Add Bank Account"
3. Fill in form:
   Name: Your Name
   Bank: HDFC Bank (or yours)
   IFSC: HDFC0000001 (find yours)
   Account: 12345678 (your 8-17 digit account)
   Type: Savings
4. Click "Save Account" ✅
```

### Step 5: Verify (Next 1-2 Days)
```
1. Razorpay sends 2 small deposits to your bank
2. Wait 1-2 business days
3. Check bank statement for amounts
4. Return to app → Bank Account page
5. Click "Verify Account"
6. Enter the two amounts you saw
7. Click "Verify" ✅
```

**DONE!** All payments now settle to your account! 💰

---

## 📍 Where Things Are

| What | Where | Action |
|------|-------|--------|
| **Settings Page** | Admin → Bank Account | Click to manage |
| **API Routes** | backend/routes/adminRoutes.js | Handles requests |
| **Database** | Supabase admin_settings | Stores data |
| **Form UI** | frontend/src/Admin/BankAccountSettings.jsx | What you see |
| **Setup Guide** | BANK_ACCOUNT_SETUP.md | Full details |

---

## 🔍 Finding Your Bank Info

### Account Holder Name
```
✓ Your name (as per bank records)
✓ Usually on your bank statement
✓ Or ask bank
```

### Bank Name
```
✓ HDFC Bank
✓ ICICI Bank
✓ Axis Bank
✓ SBI
(whatever your bank is)
```

### IFSC Code
```
✓ Format: AAAA0AAAAAA
✓ Example: HDFC0000001

Where to find:
1. Bank statement (check)
2. Passbook
3. Bank's website
4. Google: "IFSC Code HDFC Ahmedabad"
5. https://www.rbi.org.in/IFSC
```

### Account Number
```
✓ 8-17 digits
✓ On your bank statement
✓ On your checkbook
✓ Ask bank
✓ No spaces or dashes
```

---

## ✅ What Happens After Verification

```
Payment Flow (Simplified):

Customer pays ₹500
       ↓
App adds 18% GST = ₹590
       ↓
Razorpay receives payment
       ↓
Backend verifies (signature check)
       ↓
Transaction saved ✅
Wallet updated ✅
       ↓
End of day: Settlement calculated
       ↓
Next business day: ₹576 in your bank ✅
```

---

## 🚨 Common Mistakes to Avoid

| Don't | Do |
|------|-----|
| ❌ Add spaces in IFSC | ✅ HDFC0000001 |
| ❌ Add dashes in account | ✅ 12345678 |
| ❌ Enter deposit as .50 | ✅ 0.50 or 0.5 |
| ❌ Use wrong IFSC | ✅ Check bank statement |
| ❌ Verify too early | ✅ Wait 1-2 business days |

---

## 📱 Mobile Ready

- ✅ Works on phones
- ✅ Works on tablets
- ✅ Works on desktop
- ✅ Touch-friendly buttons
- ✅ Clear forms

---

## 🆘 Need Help?

### Problem: Can't find IFSC Code
```
Solution:
1. Check bank statement
2. Google: "[Your Bank Name] IFSC Code"
3. Go to bank website
4. Call your bank
```

### Problem: Form says "Invalid IFSC"
```
Solution:
1. Check format: AAAA0AAAAAA (11 chars total)
2. First 4 must be letters (HDFC, ICIC, etc)
3. Character 5 must be 0 (zero)
4. Last 6 can be letters or numbers
Example correct: HDFC0000001 ✓
Example wrong: HDFC-000001 ✗
```

### Problem: Form says "Invalid Account"
```
Solution:
1. Must be 8-17 digits only
2. No spaces or dashes
3. Numbers only (0-9)
4. Check bank statement
```

### Problem: Deposits not received
```
Solution:
1. Wait 2 business days
2. Check all transactions (not just credit)
3. Search for "2.5" or "3.7" in statement
4. Check if marked as "Transfer" or "Credit"
```

### Problem: Verification fails
```
Solution:
1. Amounts must be exact (with decimals)
2. Both must match what you see
3. No rounding (if you see 2.50, enter 2.50)
4. Try again - sometimes takes time
```

---

## 🎯 Success Criteria

✅ You're done when:
- Bank account saved in app
- Account status shows "Verified"
- First payment processes successfully
- Money arrives in your bank next day
- Dashboard shows settlement info

---

## 📞 Quick Reference

```
Endpoints (for developers):
GET    /admin/bank-account
POST   /admin/bank-account
POST   /admin/verify-bank-account
GET    /admin/settlement-info

Table:
admin_settings (setting_key = "bank_account")

Files:
- frontend/src/Admin/BankAccountSettings.jsx
- backend/routes/adminRoutes.js
- backend/ADMIN_SETTINGS_SCHEMA.sql
```

---

## 🎉 Ready!

That's literally it! Your app now:
- ✅ Accepts payments
- ✅ Verifies them
- ✅ Stores bank account
- ✅ Settles daily
- ✅ Makes you money! 💰

**Questions? Check BANK_ACCOUNT_SETUP.md for detailed guide.**

---

**Status**: Ready to Use ✅
**Difficulty**: Very Easy ⭐
**Time**: 5 minutes setup + 2 days verification
