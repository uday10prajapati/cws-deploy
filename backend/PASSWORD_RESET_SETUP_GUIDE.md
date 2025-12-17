# Password Reset Implementation - Complete Setup

## What Changed

### Frontend (ResetPassword.jsx)
✅ **Removed Supabase magic links** - Now sends 6-digit OTP codes via email
✅ **3-Step Password Reset Flow:**
1. User enters email → receives OTP code
2. User enters OTP code → verifies code
3. User creates new password → password updated

✅ **No Auto-Redirect** - User must manually click "Back to Login" button

### Backend (auth.js Routes)
Added 3 new endpoints:
- `POST /auth/send-otp` - Sends 6-digit code to email
- `POST /auth/verify-otp` - Verifies the code matches
- `POST /auth/reset-password` - Updates password after verification

### Database
Created new table: `password_reset_otp`
- Stores temporary OTP codes with 10-minute expiry
- Tracks verified and used status
- Automatic cleanup of expired codes

## Setup Instructions

### 1. Run the SQL Migration
Execute this SQL in your Supabase Dashboard:
```sql
-- Copy content from: PASSWORD_RESET_OTP_SCHEMA.sql
```

### 2. Update Environment Variables
Make sure your `.env` has:
```
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-specific-password
```

### 3. Restart Backend
```bash
cd backend
npm start
```

## Features

✅ Sends 6-digit OTP code (not link)
✅ 10-minute code expiration
✅ Resend code with 60-second timer
✅ Email verification
✅ Password validation (min 6 characters)
✅ No auto-redirect (user controls flow)
✅ Error handling at each step
✅ Mobile responsive design

## User Experience Flow

1. Click "Forgot Password?" on login page
2. Enter email → Click "Send Verification Code"
3. Receive code in email inbox
4. Enter 6-digit code → Click "Verify Code"
5. Create new password → Click "Reset Password"
6. See success message "✅ Password reset successfully!"
7. Click "Back to Login" to return to login page

## Testing

Test with:
- Valid email address
- Invalid/wrong OTP code
- Expired code (wait 10+ minutes)
- Password mismatch
- Short password (< 6 chars)
