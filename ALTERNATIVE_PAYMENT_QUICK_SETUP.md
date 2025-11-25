# Alternative Payment - Quick Setup (5 Minutes)

## ⚡ TL;DR Setup

### Step 1: Backend Configuration
Edit `backend/.env`:
```env
UPI_ID=your-upi-id@bankname
BANK_NAME=Your Bank Name
BANK_ACCOUNT_HOLDER=Car Wash Service
BANK_ACCOUNT_NUMBER=1234567890123456
BANK_IFSC_CODE=BANK0001234
```

### Step 2: Add Route
Already done! Routes added to `server.js`:
```javascript
app.use("/alt-payment", alternativePaymentRoutes);
```

### Step 3: Add Frontend Route
In `frontend/src/App.jsx`:
```jsx
import AlternativePayment from "./components/AlternativePayment";

<Route path="/payment" element={<AlternativePayment />} />
```

### Step 4: Test
```bash
# Terminal 1: Start backend
cd backend
npm start

# Terminal 2: Start frontend
cd frontend
npm start

# Open http://localhost:5173/payment
```

---

## 🎯 Payment Methods

### 1️⃣ UPI (Fastest & Best) ⭐⭐⭐⭐⭐
- **Fee**: 0% ✅
- **Settlement**: Instant 🔥
- **How**: Scan QR → Pay → Enter UTR
- **Apps**: Google Pay, PhonePe, BHIM, PayTM

### 2️⃣ Bank Transfer (Cheapest) ⭐⭐⭐⭐
- **Fee**: 0% ✅
- **Settlement**: 1-2 business days
- **How**: Transfer amount → Enter reference
- **Best for**: Large payments

### 3️⃣ Net Banking (Secure) ⭐⭐⭐⭐
- **Fee**: 1-2%
- **Settlement**: T+1 day
- **How**: Choose bank → Login → Pay → Verify
- **Banks**: HDFC, ICICI, Axis, SBI, Yes Bank

### 4️⃣ Card (Convenience) ⭐⭐⭐
- **Fee**: 2% + ₹5
- **Settlement**: T+2 days
- **How**: Enter card → OTP → Authorization code
- **Cards**: Visa, Mastercard, Amex

---

## 📊 Cost Comparison (₹500 Payment)

| Method | You Pay | You Get | Time |
|--------|---------|---------|------|
| UPI | ₹500 | ₹500 | Instant ⚡ |
| Bank | ₹500 | ₹500 | 1-2 days 📅 |
| Net Banking | ₹507.50 | ₹500 | T+1 day 📅 |
| Card | ₹515 | ₹500 | T+2 days 📅 |
| Razorpay | ₹514 | ₹500 | T+1 day (Expensive) ❌ |

**You save ₹14-15 per ₹500 transaction! 💰**

---

## 🔧 API Endpoints

### Initiate Payment
```
POST /alt-payment/initiate
{
  "amount": 500,
  "customer_id": "user-123",
  "customer_email": "user@example.com",
  "customer_name": "John Doe",
  "customer_phone": "9876543210",
  "type": "booking_payment",
  "payment_method": "upi"
}
```

### Verify Payment
```
POST /alt-payment/verify-upi
{
  "transaction_id": "TXN_user-123_1234567890",
  "upi_ref_id": "123456789012",
  "payment_timestamp": "2024-11-25T10:30:00Z"
}
```

### Check Status
```
GET /alt-payment/status/:transaction_id
```

### List All Methods
```
GET /alt-payment/methods
```

---

## ✅ Features

- ✅ **4 Payment Methods** - UPI, Bank, Net Banking, Card
- ✅ **No Gateway Fees** - UPI and Bank Transfer have 0% fees
- ✅ **Manual Verification** - You verify payments manually
- ✅ **Instant Settlement** - UPI payments settle instantly
- ✅ **Transaction Logging** - All payments logged in database
- ✅ **Status Tracking** - Real-time payment status
- ✅ **Error Handling** - Comprehensive error messages
- ✅ **Admin Dashboard** - View all transactions

---

## 🚀 Deployment

### Heroku / Railway
```bash
# Add environment variables
UPI_ID=your-upi@bankname
BANK_ACCOUNT_NUMBER=xxxx
# etc...

# Deploy
git push heroku main
```

### Vercel (Frontend)
```bash
# Add backend URL
VITE_API_URL=https://your-backend.com

# Deploy
vercel deploy
```

---

## 📱 Real-World Example

### Customer Books Car Wash (₹500)

```
1. Customer opens app → Go to Payment
2. Payment page shows 4 options
3. Customer selects "UPI" ✅
4. Customer enters amount: ₹500
5. System shows:
   - UPI ID: 9876543210@okhdfcbank
   - QR Code
   - UPI Link
6. Customer scans QR with Google Pay
7. Completes payment in Google Pay
8. Copies UTR: 123456789012
9. Pastes UTR in app → Click Verify
10. ✅ Payment confirmed in 2 seconds!
11. You receive ₹500 instantly in your account
```

**Total time: 30 seconds** ⚡

---

## ⚠️ Important Notes

1. **UPI_ID Format**: `mobile@bankname`
   - Example: `9876543210@okhdfcbank`
   - Not just the mobile number!

2. **Bank Details**: Must be YOUR bank account
   - Money will be received here
   - Make sure details are 100% correct

3. **Verification**: YOU verify payments manually
   - Check UTR/reference in bank statement
   - Then mark as verified in app

4. **Zero Fees**: UPI and Bank Transfer are FREE
   - Net Banking: 1-2%
   - Card: 2% + ₹5
   - Much cheaper than Razorpay (2.8%)

---

## 🐛 Troubleshooting

### UPI Link Not Working?
- Update `UPI_ID` in `.env`
- Restart backend: `npm start`
- Format should be: `9876543210@bankname`

### Transaction Not Found?
- Check `transaction_id` is correct
- Verify database has the transaction
- Check browser console for errors

### Payment Verification Fails?
- Ensure UTR/reference is exact match
- Check payment method matches
- Verify transaction exists

### Still Having Issues?
- Check backend logs: `npm start` output
- Check frontend console: F12 → Console
- Verify `.env` has all required fields

---

## 📞 Support

- **Backend Issues**: Check terminal output
- **Frontend Issues**: Check browser console (F12)
- **Payment Issues**: Verify `.env` configuration
- **Database Issues**: Check Supabase dashboard

---

## 🎓 Next Steps

1. ✅ Configure `.env` with YOUR bank details
2. ✅ Start backend & frontend
3. ✅ Test all 4 payment methods
4. ✅ Verify payments work end-to-end
5. ✅ Deploy to production
6. ✅ Start receiving payments!

---

**You're all set! Start accepting payments instantly. 🎉**
