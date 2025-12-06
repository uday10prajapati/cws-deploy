# OTP Verification Fix - Quick Setup

## 🔴 Error You're Getting
```
PGRST204: Could not find the 'employee_type' column of 'otp_verification'
```

## ✅ Quick Fix (2 Steps)

### Step 1: Run SQL in Supabase
Open **Supabase Dashboard** → **SQL Editor** → **New Query** → Paste this:

```sql
-- OTP Verification Table with Employee Type Support
CREATE TABLE IF NOT EXISTS public.otp_verification (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255),
  phone VARCHAR(20),
  otp VARCHAR(6) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('customer', 'employee', 'admin')),
  employee_type VARCHAR(50) CHECK (employee_type IN ('washer', 'rider', 'sales', NULL)),
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP + INTERVAL '10 minutes',
  verified_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT valid_email_or_phone CHECK (email IS NOT NULL OR phone IS NOT NULL)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_otp_verification_email ON public.otp_verification(email);
CREATE INDEX IF NOT EXISTS idx_otp_verification_phone ON public.otp_verification(phone);
CREATE INDEX IF NOT EXISTS idx_otp_verification_created_at ON public.otp_verification(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_otp_verification_expires_at ON public.otp_verification(expires_at);

-- Enable RLS
ALTER TABLE public.otp_verification ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Allow anyone to insert OTP" ON public.otp_verification FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Allow anyone to read OTP" ON public.otp_verification FOR SELECT USING (TRUE);
CREATE POLICY "Allow anyone to update OTP" ON public.otp_verification FOR UPDATE USING (TRUE) WITH CHECK (TRUE);

-- Permissions
GRANT SELECT, INSERT, UPDATE ON public.otp_verification TO anon, authenticated, service_role;
```

**Click "Run"** ✅

### Step 2: Test It
1. Go to: `http://localhost:5173/signup`
2. Fill signup form → Click "Create Account"
3. Check email for OTP ✅

---

## 📋 What Gets Created

| Column | Type | Purpose |
|--------|------|---------|
| `id` | UUID | Primary key |
| `email` | VARCHAR | User email |
| `phone` | VARCHAR | User phone |
| `otp` | VARCHAR | 6-digit code |
| `role` | VARCHAR | customer/employee/admin |
| **`employee_type`** | VARCHAR | **NEW** - washer/rider/sales |
| `verified` | BOOLEAN | Verification status |
| `created_at` | TIMESTAMP | When OTP was sent |
| `expires_at` | TIMESTAMP | Expires in 10 min |
| `verified_at` | TIMESTAMP | When user verified |

---

## 🔧 If It Still Doesn't Work

**Option 1: Clear Cache**
```sql
NOTIFY pgrst, 'reload schema'
```

**Option 2: Drop & Recreate** (⚠️ Warning: Deletes all OTP records)
```sql
DROP TABLE IF EXISTS public.otp_verification;
-- Then run the CREATE TABLE script above
```

**Option 3: Restart Services**
- Restart backend: `npm start`
- Restart frontend: `npm run dev`
- Reload browser

---

## 📧 Email Configuration Required

Add to `.env`:
```
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASS=your-16-char-app-password
```

**How to get Gmail App Password:**
1. Go: https://myaccount.google.com/security
2. Enable 2FA
3. Create "App password" for Mail
4. Use that 16-character password

---

## 📱 WhatsApp Configuration (Optional)

Add to `.env`:
```
WHATSAPP_API_KEY=your-api-key
```

Get from: https://www.callmebot.com/blog/free-api/

---

## 📝 Files Created/Modified

- ✅ Created: `backend/OTP_VERIFICATION_SCHEMA.sql`
- ✅ Created: `backend/OTP_SETUP_AND_FIX_GUIDE.md`
- ℹ️ Uses: `backend/routes/auth.js` (already configured)
- ℹ️ Uses: `frontend/src/page/SignUp.jsx` (already sending employee_type)

---

## ✨ All Done!

Your OTP system now supports:
- ✅ Customer & Employee signups
- ✅ Employee type selection (Washer, Rider, Sales)
- ✅ Email OTP delivery
- ✅ WhatsApp OTP delivery (optional)
- ✅ Auto-expiring OTPs (10 minutes)
- ✅ Role-based approval workflow

**Test it now:** `http://localhost:5173/signup` 🚀
