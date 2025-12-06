# 📊 /verify-otp Endpoint - Visual Flow Diagram

## Request Format

```
POST /auth/verify-otp
Content-Type: application/json

{
  "email": "user@example.com",
  "phone": "+1234567890",
  "otp": "123456",
  "name": "John Doe",
  "password": "SecurePass123",     ← CRITICAL (6+ chars required)
  "role": "customer|employee",
  "employeeType": "washer|rider|sales"
}
```

---

## Processing Flow (NEW)

```
┌─────────────────────────────────────────────────────────────────┐
│                    /verify-otp ENDPOINT                         │
└─────────────────────────────────────────────────────────────────┘

STEP 1: VALIDATE REQUIRED FIELDS
┌─────────────────────────────────────────────────────────────────┐
│ ✓ OTP present?                                                  │
│ ✓ Password present? ← NEW REQUIREMENT                           │
│ ✓ Password length >= 6?                                         │
│ ✓ Email OR Phone provided?                                      │
│ ✓ Name provided?                                                │
└─────────────────────────────────────────────────────────────────┘
           ↓ (All checks pass)
           
STEP 2: VERIFY OTP FROM DATABASE
┌─────────────────────────────────────────────────────────────────┐
│ Query otp_verification table                                    │
│ Check: OTP exists?                                              │
│ Check: OTP matches?                                             │
└─────────────────────────────────────────────────────────────────┘
           ↓ (OTP valid)
           
STEP 3: CREATE SUPABASE AUTH USER
┌─────────────────────────────────────────────────────────────────┐
│ supabase.auth.admin.createUser({                                │
│   email: authEmail,                                             │
│   password: password,  ← PASSWORD ALWAYS INCLUDED               │
│   email_confirm: true                                           │
│ })                                                              │
└─────────────────────────────────────────────────────────────────┘
           ↓ (Auth user created)
           
STEP 4: CREATE PROFILE RECORD
┌─────────────────────────────────────────────────────────────────┐
│ Insert into profiles table:                                     │
│ - id: userId (from auth)                                        │
│ - name, email, phone                                            │
│ - role: "customer" or "employee"                                │
│ - employee_type: "washer|rider|sales"                           │
│ - approval_status: "approved" (customer) or "pending" (employee)│
└─────────────────────────────────────────────────────────────────┘
           ↓ (Profile created)
           
STEP 5: CREATE APPROVAL REQUEST (if employee)
┌─────────────────────────────────────────────────────────────────┐
│ If role === "employee":                                         │
│   Insert into user_approvals table                              │
│   - user_id, name, email, phone                                 │
│   - requested_role: "employee_washer|employee_rider|..."        │
│   - status: "pending"                                           │
└─────────────────────────────────────────────────────────────────┘
           ↓ (Approval request created)
           
STEP 6: DELETE OTP FROM DATABASE
┌─────────────────────────────────────────────────────────────────┐
│ Delete from otp_verification where email/phone matches          │
│ (Prevents OTP reuse)                                            │
└─────────────────────────────────────────────────────────────────┘
           ↓ (OTP deleted)
           
STEP 7: RETURN SUCCESS RESPONSE
┌─────────────────────────────────────────────────────────────────┐
│ Return 200 OK with success message                              │
│ Include: userId, email, role, passwordSet: true                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Error Handling Flow

```
VALIDATION ERRORS (Early Exit)
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  ❌ Password missing/empty?                                      │
│  └─ Return 400: "Password is required..."                       │
│     code: "MISSING_PASSWORD"                                    │
│                                                                 │
│  ❌ Password < 6 chars?                                          │
│  └─ Return 400: "Password must be at least 6 characters..."     │
│     code: "WEAK_PASSWORD"                                       │
│                                                                 │
│  ❌ Email AND Phone both missing?                                │
│  └─ Return 400: "Either email or phone is required"             │
│                                                                 │
│  ❌ Name missing?                                                │
│  └─ Return 400: "Name is required"                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

OTP VERIFICATION ERRORS
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  ❌ OTP not found in database?                                   │
│  └─ Return 400: "OTP not found. Please request a new OTP."      │
│                                                                 │
│  ❌ OTP doesn't match?                                           │
│  └─ Return 400: "Invalid OTP"                                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

AUTH USER CREATION ERRORS
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  ❌ Auth user creation fails?                                    │
│  └─ Return 400: "Account creation failed: [error message]"      │
│     Logs: password provided status, length, error details       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

PROFILE/APPROVAL ERRORS
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  ❌ Profile insert fails?                                        │
│  └─ Return 500: "Profile creation failed"                       │
│                                                                 │
│  ⚠️  Approval request fails (non-blocking)?                     │
│  └─ Log error but continue (customer/profile already created)   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Success Response Examples

### Customer Account (Immediate Access)
```json
{
  "success": true,
  "message": "✅ Account created! You can now login.",
  "requiresApproval": false,
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "email": "customer@example.com",
  "role": "customer",
  "passwordSet": true
}
```

### Employee Account (Pending Approval)
```json
{
  "success": true,
  "message": "✅ Account created! Awaiting admin approval. You'll be notified once approved.",
  "requiresApproval": true,
  "userId": "550e8400-e29b-41d4-a716-446655440001",
  "email": "washer@example.com",
  "role": "employee",
  "passwordSet": true
}
```

---

## Error Response Examples

### Missing Password
```json
{
  "error": "Password is required. Please enter a password before verifying OTP.",
  "code": "MISSING_PASSWORD"
}
```

### Weak Password
```json
{
  "error": "Password must be at least 6 characters long",
  "code": "WEAK_PASSWORD"
}
```

### Invalid OTP
```json
{
  "error": "Invalid OTP"
}
```

### Auth User Creation Failed
```json
{
  "error": "Account creation failed: User with this email already exists",
  "details": "User with this email already exists"
}
```

---

## Console Logging Output

When a user signs up, the backend logs all 7 steps:

```
🔍 Verify OTP Request: { email, phone, otp, name, password, role, employeeType }
📦 Full Request Body: {...}
✅ All required fields validated
📝 Password length: 15 characters

✅ OTP verified successfully
✅ OTP verified, preparing to create auth user...
📧 Auth email: user@example.com
🔐 Password will be set: 15 characters
👤 Name: John Doe
📱 Phone: +1234567890
📋 Role: employee
🏷️  Employee Type: washer

🔐 Creating auth user with password...
✅✅✅ Auth user created successfully!
✅ User ID: 550e8400-e29b-41d4-a716-446655440001
✅ Email: user@example.com
✅ Password was set during creation

📋 Creating profile in database...
  - ID: 550e8400-e29b-41d4-a716-446655440001
  - Name: John Doe
  - Email: user@example.com
  - Phone: +1234567890
  - Role: employee
  - Employee Type: washer
  - Approval Status: pending
✅ Profile inserted successfully

📋 Creating approval request for employee...
  - User ID: 550e8400-e29b-41d4-a716-446655440001
  - Name: John Doe
  - Email: user@example.com
  - Phone: +1234567890
  - Mapped Role: employee_washer
✅ Approval request created successfully

🗑️  Deleting OTP from database...
✅ OTP deleted from database

==================================================
✅✅✅ REGISTRATION COMPLETE ✅✅✅
==================================================
🎉 User created successfully!
  - User ID: 550e8400-e29b-41d4-a716-446655440001
  - Email: user@example.com
  - Name: John Doe
  - Role: employee
  - Approval Status: PENDING (awaiting admin approval)
==================================================
```

---

## Key Improvements Summary

| Aspect | Before | After |
|--------|--------|-------|
| **Password Check** | ❌ None | ✅ Mandatory before auth creation |
| **OTP Verification** | ⚠️ After auth creation | ✅ Before auth creation |
| **Password Handling** | ⚠️ May be undefined | ✅ Always validated (6+ chars) |
| **Error Messages** | ⚠️ Generic | ✅ Specific error codes |
| **Logging** | ⚠️ Minimal | ✅ 7-step detailed output |
| **Employee Login** | ❌ Fails (no password) | ✅ Works after approval |
| **Customer Login** | ❌ Fails (no password) | ✅ Works immediately |

---

## Data Flow in Database

```
Frontend Signup Form
    ↓
POST /auth/verify-otp
    ↓
Supabase Auth
├─ Create user with password ← PASSWORD REQUIRED
└─ Returns user ID
    ↓
Supabase Database
├─ profiles table
│  ├─ id (user_id)
│  ├─ name, email, phone
│  ├─ role (customer/employee)
│  ├─ employee_type (washer/rider/sales)
│  └─ approval_status (approved/pending)
│
└─ user_approvals table (if employee)
   ├─ user_id
   ├─ name, email, phone
   ├─ requested_role (employee_washer, etc)
   └─ status (pending)
    ↓
Return Success Response
    ↓
Frontend Redirects to Login
    ↓
User Logs In with email + password
    ↓
✅ Authentication Success (because password was set!)
```

---

## Testing Commands

### Test 1: Valid Customer Signup
```bash
curl -X POST http://localhost:5000/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "customer@test.com",
    "otp": "123456",
    "name": "Test Customer",
    "password": "SecurePass123",
    "role": "customer"
  }'
```

### Test 2: Missing Password (Should Fail)
```bash
curl -X POST http://localhost:5000/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "customer@test.com",
    "otp": "123456",
    "name": "Test Customer",
    "password": "",
    "role": "customer"
  }'
```

### Test 3: Weak Password (Should Fail)
```bash
curl -X POST http://localhost:5000/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "customer@test.com",
    "otp": "123456",
    "name": "Test Customer",
    "password": "123",
    "role": "customer"
  }'
```

---

## Next Steps

1. **Restart Backend Server** - Reload the updated code
2. **Test New Signup** - Create a new account with password
3. **Test Login** - Login should work without "Invalid credentials" error
4. **Fix Old Accounts** - Use `/auth/fix-password` for accounts created before this fix
