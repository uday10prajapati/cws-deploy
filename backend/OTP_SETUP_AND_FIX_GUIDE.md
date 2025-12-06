# OTP Verification Setup & Fix Guide

## Problem
The `otp_verification` table is missing the `employee_type` column, causing this error:
```
PGRST204: Could not find the 'employee_type' column of 'otp_verification' in the schema cache
```

## Solution

### Step 1: Run the SQL Schema in Supabase

1. Go to your **Supabase Dashboard** → **SQL Editor**
2. Click **"New Query"**
3. Copy and paste the entire content from `OTP_VERIFICATION_SCHEMA.sql`
4. Click **"Run"** ✅

Or use the Supabase CLI:
```bash
supabase db push
```

### Step 2: Verify the Table

Run this query in Supabase SQL Editor to verify:
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'otp_verification'
ORDER BY ordinal_position;
```

You should see these columns:
- `id` (UUID)
- `email` (VARCHAR)
- `phone` (VARCHAR)
- `otp` (VARCHAR)
- `role` (VARCHAR) ✅
- `employee_type` (VARCHAR) ✅ **NEW**
- `verified` (BOOLEAN)
- `created_at` (TIMESTAMP)
- `expires_at` (TIMESTAMP)
- `verified_at` (TIMESTAMP)

### Step 3: Test OTP Send

1. Go to your frontend signup page: `http://localhost:5173/signup`
2. Fill in the form and select a role (Employee)
3. Fill in the employee position
4. Click "Create Account" or "Request Account"
5. You should receive an OTP via email/WhatsApp ✅

### What the Fix Includes

✅ **OTP Table with Employee Type Support**
- Stores `role` (customer, employee, admin)
- Stores `employee_type` (washer, rider, sales) for employees
- Auto-expires after 10 minutes
- Email and Phone support
- Verification tracking

✅ **Proper Indexes** for performance
- Email lookup
- Phone lookup
- Created date tracking
- Expiration tracking
- Role filtering
- Employee type filtering

✅ **Row Level Security (RLS)**
- Anonymous users can insert/read OTP records
- Authenticated users can insert/read OTP records
- Service role (backend) has full access

### Related Code

The backend is already configured to use these columns:

**Frontend (SignUp.jsx):**
```javascript
const { name, email, phone, password, role, employeeType } = formData;
// Sends employeeType to backend
```

**Backend (auth.js):**
```javascript
const { email, phone, name, password, role, employeeType } = req.body;

// Insert into otp_verification
const { error: dbError } = await supabase
  .from("otp_verification")
  .insert([{ email, phone, otp, role, employee_type: employeeType }]);
```

### Troubleshooting

**Still getting the error?**
1. Clear your Supabase schema cache:
   - Go to SQL Editor
   - Run: `NOTIFY pgrst, 'reload schema'`
2. Or restart Supabase services from dashboard

**OTP not received?**
1. Check email credentials in `.env`:
   - `EMAIL_USER` - Gmail address
   - `EMAIL_PASS` - Gmail App Password (not regular password)
2. Check WhatsApp API:
   - `WHATSAPP_API_KEY` - Get from callmebot.com

**Column still missing after running SQL?**
1. Check if you're in the correct Supabase project
2. Run the migration in the "public" schema specifically
3. Restart your backend server: `npm start`

### Environment Variables Required

```env
# Email
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASS=your-16-char-app-password

# WhatsApp (Optional)
WHATSAPP_API_KEY=your-callmebot-api-key

# Database
DATABASE_URL=your-supabase-connection-string
```

### File Reference

- **Schema Definition**: `backend/OTP_VERIFICATION_SCHEMA.sql`
- **Backend Route**: `backend/routes/auth.js` (lines 21-94)
- **Frontend Signup**: `frontend/src/page/SignUp.jsx` (line 39)
