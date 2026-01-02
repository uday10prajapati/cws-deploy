# Sign Up Page Updates - Quick Reference

## What Changed?

### 1. **Admin Signup Option** (NEW)
- Users can now select "🔑 Admin" on the Sign Up page
- Requires admin position selection from dropdown
- Admin signup requires approval before login

### 2. **Dropdown Selection for Roles**
- **Employee Position:** Changed from radio buttons → dropdown
  - Options: general, sub-general, hr-general, sales
- **Admin Position:** (NEW) Dropdown selection
  - Options: admin, sub-admin, hr, washer
- Both dropdowns are **mandatory** (required before signup)

### 3. **Dynamic Role Loading**
- Dropdown options are fetched from backend: `GET /auth/get-roles`
- Not hardcoded in frontend
- Easy to add new roles without code changes

### 4. **Approval Required for Both Employee & Admin**
- Customer signup: Approved immediately ✓
- Employee signup: Requires admin approval ⏳
- Admin signup: Requires admin approval ⏳

---

## Role Names (Unchanged)

### Employee Types
```
general          - 👤 General Employee
sub-general      - 📍 Sub-General (Regional)
hr-general       - 👔 HR-General
sales            - 💰 Sales Executive
```

### Admin Types (NEW)
```
admin            - 🔑 Admin
sub-admin        - ⚙️ Sub-Admin
hr               - 👔 HR
washer           - 🧹 Washer
```

---

## Login Flow

### For Pending Users
```
Sign Up → OTP → Verification → Account Created (pending)
                                ↓
                        Cannot Login Yet ❌
                        Approval Pending ⏳
                                ↓
                        Admin Approves
                                ↓
                        Can Login Now ✓
```

### For Customers
```
Sign Up → OTP → Verification → Account Created (approved)
                                ↓
                        Can Login Immediately ✓
```

---

## API Endpoints

### Get Available Roles
```
GET /auth/get-roles

Response:
{
  "success": true,
  "roles": {
    "employee_types": [
      { "id": "general", "label": "👤 General Employee", "value": "general" },
      ...
    ],
    "admin_types": [
      { "id": "admin", "label": "🔑 Admin", "value": "admin" },
      ...
    ]
  }
}
```

### Send OTP (Admin Signup Example)
```
POST /auth/send-otp
{
  "name": "John Admin",
  "email": "john@example.com",
  "phone": "9876543210",
  "password": "password123",
  "role": "admin",           ← Changed: Now accepts "admin"
  "employeeType": "sub-admin" ← New: Admin type goes here
}
```

---

## Database Changes

### No Schema Changes Required
Existing tables support the new functionality:

| Field | Value for Customer | Value for Employee | Value for Admin |
|-------|-------------------|-------------------|-----------------|
| `role` | "customer" | "employee" | "admin" |
| `employee_type` | NULL | "general", "sales", etc. | "admin", "sub-admin", etc. |
| `approval_status` | "approved" | "pending" | "pending" |

---

## Files Modified

1. **`backend/routes/auth.js`**
   - Added: `GET /auth/get-roles` endpoint
   - Updated: `/send-otp` to handle admin role
   - Updated: `/verify-otp` to create admin accounts

2. **`frontend/src/page/SignUp.jsx`**
   - Added: Admin signup button
   - Added: Role fetching from API
   - Changed: Radio buttons → Dropdown menus
   - Added: Validation for dropdown selection

3. **`frontend/src/page/Login.jsx`**
   - Updated: Approval check includes admin role

---

## Testing Steps

### Test 1: Employee Signup
1. Go to `/signup`
2. Click "💼 Employee"
3. Select position from dropdown (e.g., "sales")
4. Fill form & submit
5. Verify error at login: "pending approval"

### Test 2: Admin Signup (NEW)
1. Go to `/signup`
2. Click "🔑 Admin"
3. Select admin position from dropdown (e.g., "sub-admin")
4. Fill form & submit
5. Verify error at login: "pending approval"

### Test 3: Customer Signup
1. Go to `/signup`
2. Click "👤 Customer"
3. No position selection needed
4. Fill form & submit
5. Can login immediately ✓

---

## Important Notes

✅ **No Breaking Changes**
- Existing customer signup still works
- Existing employee signup maintains same flow
- No database migrations needed

✅ **All Role Names Preserved**
- No renaming or modification of roles
- Consistency across signup → database → login → authorization

✅ **Approval Enforcement**
- Both Employee and Admin must be approved
- Pending accounts cannot login
- Clear messages inform users of approval status

---

## Key Implementation Details

1. **Role Consistency:** Same role names used everywhere
   - Frontend dropdown → Database → Login logic
   - No mapping or conversion needed

2. **Dynamic Dropdowns:** Options fetched from API
   - Not hardcoded in frontend
   - Easy to add new roles in future

3. **Approval System:** Uses existing mechanism
   - `approval_status` field in profiles table
   - Checked during login for Employee & Admin
   - Customers approved immediately

4. **Error Messages:**
   - Employee pending: "Your account is pending admin approval..."
   - Admin pending: "Your account is pending admin approval..."
   - Rejected: "Your account request was rejected..."

---

## FAQs

**Q: Can admins approve their own accounts?**
A: No. The approval system uses existing logic where other admins must approve new accounts.

**Q: Are employee and admin roles separate?**
A: Yes. Role field stores "employee" or "admin" separately. The specific type (e.g., "sales", "sub-admin") is in `employee_type` field.

**Q: Can I add new roles later?**
A: Yes. Update the `/auth/get-roles` endpoint to return new roles. Dropdowns will update automatically.

**Q: Do existing users need to re-signup?**
A: No. These changes only affect new signups. Existing users are unaffected.

**Q: Is there a database migration needed?**
A: No. All changes use existing table structure.
