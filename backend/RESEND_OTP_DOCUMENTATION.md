# Resend OTP Feature - Complete Documentation

## 🎯 Overview

The resend OTP feature allows users to request a new OTP if:
- They didn't receive the original OTP
- The OTP expired (10 minutes)
- They want to try again

## ✨ Features

✅ **Resend OTP via Email/WhatsApp**
✅ **30-second cooldown between requests** (prevents spam)
✅ **Timer countdown in UI** (shows remaining wait time)
✅ **User-friendly modal** with clear instructions
✅ **Error handling** for failed resends
✅ **New OTP generated** each time (old OTP invalidated)

## 🔧 Backend Implementation

### New Endpoint: `POST /auth/resend-otp`

**Request:**
```json
{
  "email": "user@example.com",
  "phone": "+919876543210"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "OTP resent successfully",
  "otpSentTo": {
    "email": "sent",
    "whatsapp": "sent"
  }
}
```

**Response (Error - Spam Prevention):**
```json
{
  "error": "Please wait 15 seconds before requesting a new OTP"
}
```

### How It Works

1. **Check if OTP request exists** - Must have made initial signup attempt
2. **Rate limiting** - Enforce 30-second cooldown between resends
3. **Generate new OTP** - 6-digit random code
4. **Update database** - Replace old OTP with new one
5. **Send via Email** - Using Nodemailer + Gmail
6. **Send via WhatsApp** - Using CallMeBot API (optional)

### Code Location
- File: `backend/routes/auth.js` (lines 104-184)
- Function: `router.post("/resend-otp", ...)`

## 🎨 Frontend Implementation

### New States Added

```javascript
const [resendTimer, setResendTimer] = useState(0);        // Cooldown timer (0-30 seconds)
const [isResending, setIsResending] = useState(false);    // Loading state while resending
```

### New Function: `handleResendOtp()`

```javascript
const handleResendOtp = async () => {
  // 1. Check if cooldown is active
  if (resendTimer > 0) return;
  
  // 2. Call backend
  const res = await fetch("http://localhost:5000/auth/resend-otp", {
    method: "POST",
    body: JSON.stringify({ email: form.email, phone: form.phone })
  });
  
  // 3. Handle response
  if (result.success) {
    setResendTimer(30);  // Start 30-second countdown
    setOtp("");          // Clear input
  }
};
```

### UI Components

**OTP Modal with Resend Button:**
```jsx
<div className="bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-3xl">
  <h2>Verify OTP</h2>
  
  {/* OTP Input */}
  <input
    type="text"
    maxLength={6}
    value={otp}
    onChange={(e) => setOtp(e.target.value)}
    placeholder="______"
  />
  
  {/* Verify Button */}
  <button onClick={handleVerifyOtp}>
    Verify OTP
  </button>
  
  {/* Resend Button with Timer */}
  <button
    onClick={handleResendOtp}
    disabled={resendTimer > 0}
  >
    {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend OTP"}
  </button>
  
  {/* Message Display */}
  <p>{message}</p>
</div>
```

### Code Location
- File: `frontend/src/page/SignUp.jsx`
- States: Lines 47-48
- Timer Effect: Lines 51-61
- Resend Function: Lines 94-128
- OTP Modal: Lines 379-416

## 📊 User Flow

```
1. User fills signup form → Click "Create Account"
   ↓
2. OTP sent → Modal opens with input field
   ↓
3. User has 10 minutes to verify
   ↓
4. If didn't receive OTP:
   - Click "Resend OTP" button
   - Wait for cooldown (30 seconds)
   - New OTP sent
   ↓
5. Enter OTP → Click "Verify OTP"
   ↓
6. Account created / Awaiting approval
```

## 🛡️ Security Features

| Feature | Implementation |
|---------|-----------------|
| **Rate Limiting** | 30-second cooldown between resends |
| **OTP Expiration** | Auto-expires in 10 minutes |
| **OTP Invalidation** | Old OTP replaced with new one |
| **Spam Prevention** | Only allow resend after cooldown |
| **Email Verification** | OTP sent to user's email |
| **Phone Verification** | OTP sent via WhatsApp (optional) |

## 🧪 Testing the Feature

### Step 1: Start Services
```bash
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### Step 2: Test Resend OTP
1. Go to: `http://localhost:5173/signup`
2. Fill form: Name, Email, Phone, Password
3. Select role (Customer or Employee)
4. Click "Create Account"
5. OTP modal appears
6. Click "Resend OTP" button
7. Should see: "Resend in 30s" (countdown)
8. After 30 seconds, can click again
9. Check email for new OTP
10. Enter OTP and verify ✅

### Step 3: Test Rate Limiting
1. Request resend
2. Try to click again immediately
3. Button should be disabled: "Resend in 28s"
4. Wait for countdown to reach 0
5. Button becomes active again

## ⚙️ Environment Variables Required

```env
# Email Configuration
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASS=your-16-char-app-password

# WhatsApp Configuration (Optional)
WHATSAPP_API_KEY=your-callmebot-api-key

# Backend URL (in frontend .env if needed)
VITE_API_URL=http://localhost:5000
```

## 📱 Supported Channels

### Email (Required)
- Uses: Nodemailer + Gmail SMTP
- Format: HTML email with OTP
- Speed: ~1-2 seconds

### WhatsApp (Optional)
- Uses: CallMeBot API (free)
- Format: Plain text message
- Speed: ~2-5 seconds
- Requires: Phone number in E.164 format (+919876543210)

## 🐛 Troubleshooting

### "No OTP request found"
- **Cause**: User clicked resend without initiating signup first
- **Fix**: Go back and fill signup form

### "Please wait X seconds"
- **Cause**: User trying to resend too quickly
- **Fix**: Wait for cooldown timer to complete

### Resend button not working
- **Cause**: Timer still active or network issue
- **Fix**: Check timer value, wait 30 seconds, or check internet

### OTP not received
- **Cause**: Email not configured or blocked
- **Fix**: Check Gmail App Password, check spam folder

### WhatsApp OTP not received
- **Cause**: API key invalid or phone format wrong
- **Fix**: Verify API key, use E.164 format (+country-code-number)

## 📈 Database Changes

The resend feature uses the existing `otp_verification` table:

```sql
-- Updates otp column with new OTP
UPDATE otp_verification 
SET otp = 'NEW_OTP_CODE', 
    created_at = NOW() 
WHERE email = 'user@example.com' 
   OR phone = '+919876543210';
```

No new tables or columns needed! ✅

## 📝 Files Modified

| File | Changes |
|------|---------|
| `backend/routes/auth.js` | ✅ Added `/resend-otp` endpoint |
| `frontend/src/page/SignUp.jsx` | ✅ Added resend logic + UI |

## 🚀 Next Steps

1. **Deploy Backend**: Test resend endpoint
2. **Test Signup**: Go through full flow
3. **Monitor**: Check email/WhatsApp delivery
4. **Optimize**: Adjust cooldown time if needed (currently 30s)

## 📞 Support

### Common Issues
- **OTP not sending**: Check email configuration
- **Rate limit too strict**: Change `30` seconds in code
- **Users complaint**: Provide resend link in marketing

### Rate Limit Tuning
To change cooldown time:
```javascript
// Backend: auth.js line 127
if (secondsElapsed < 30) {  // Change 30 to your preferred value
  const waitTime = Math.ceil(30 - secondsElapsed);
  // ...
}

// Frontend: SignUp.jsx line 119
setResendTimer(30);  // Change 30 to your preferred value
```

---

**Version**: 1.0  
**Last Updated**: December 2024  
**Status**: ✅ Production Ready
