# Sign Up Page Updates - Implementation Summary

## Overview
Updated the Sign Up page to add Admin signup functionality and replace radio buttons with dropdowns for role selection. All role selections require admin approval before users can login.

---

## Changes Made

### 1. Backend - API Endpoint (`/auth/get-roles`)
**File:** `backend/routes/auth.js`

**New Endpoint:** `GET /auth/get-roles`
- Dynamically provides available role options for frontend dropdowns
- Returns two role categories:
  - **Employee Types:** general, sub-general, hr-general, sales
  - **Admin Types:** admin, sub-admin, hr, washer

**Purpose:** Frontend populates dropdowns from this data (not hardcoded)

```javascript
GET http://localhost:5000/auth/get-roles
Response:
{
  "success": true,
  "roles": {
    "employee_types": [
      { "id": "general", "label": "👤 General Employee", "value": "general" },
      { "id": "sub-general", "label": "📍 Sub-General (Regional)", "value": "sub-general" },
      { "id": "hr-general", "label": "👔 HR-General", "value": "hr-general" },
      { "id": "sales", "label": "💰 Sales Executive", "value": "sales" }
    ],
    "admin_types": [
      { "id": "admin", "label": "🔑 Admin", "value": "admin" },
      { "id": "sub-admin", "label": "⚙️ Sub-Admin", "value": "sub-admin" },
      { "id": "hr", "label": "👔 HR", "value": "hr" },
      { "id": "washer", "label": "🧹 Washer", "value": "washer" }
    ]
  }
}
```

### 2. Frontend - Sign Up Page (`SignUp.jsx`)
**File:** `frontend/src/page/SignUp.jsx`

#### Changes:
1. **Added Admin Signup Option**
   - New button: "🔑 Admin" alongside Customer and Employee
   - Users can now select Admin as their account type
   - Admin signup requires approval (same as Employee)

2. **Replaced Radio Buttons with Dropdowns**
   - **Employee Position:** Radio buttons → `<select>` dropdown
   - **Admin Position:** NEW dropdown (only shown when Admin is selected)
   - Both dropdowns are **mandatory** (cannot submit without selection)
   - Dropdowns are populated from `/auth/get-roles` endpoint

3. **Form State Updates**
   - Added `adminType` state to track Admin role selection
   - Added `availableRoles` state to store fetched role options
   - Added `loadingRoles` state to track API call status

4. **Role Loading**
   - On component mount, fetches available roles from backend
   - Displays loading state while fetching
   - Validates that dropdowns have selections before allowing signup

5. **Validation Logic**
   - Employee signup: Requires `employeeType` selection
   - Admin signup: Requires `adminType` selection (NEW)
   - Shows validation error messages if dropdown is empty

### 3. Backend - OTP & Signup Flow Updates
**File:** `backend/routes/auth.js`

#### `/send-otp` Endpoint
- Updated to accept `role` parameter: "customer", "employee", or "admin" (NEW)
- Stores role in `otp_verification` table
- OTP email message includes approval note for both Employee and Admin roles

#### `/verify-otp` Endpoint
**Key Changes:**
1. **Profile Creation** - Stores correct role type:
   - Customer: `role="customer"`, `approval_status="approved"`
   - Employee: `role="employee"`, `approval_status="pending"`
   - **Admin (NEW):** `role="admin"`, `approval_status="pending"`

2. **Employee Type Handling**
   - For both Employee and Admin: `employee_type` field stores the selected type
   - Admin types: admin, sub-admin, hr, washer
   - Employee types: general, sub-general, hr-general, sales

3. **Approval Request Generation**
   - All Employee signups → `user_approvals` table with status="pending"
   - All Admin signups (NEW) → `user_approvals` table with status="pending"
   - Requested role format: `employee_<type>` or `admin_<type>`
   - Examples:
     - Employee - General: `employee_general`
     - Employee - Sales: `employee_sales`
     - Admin - Admin: `admin_admin`
     - Admin - Sub-Admin: `admin_sub-admin`

### 4. Login Approval Enforcement
**File:** `frontend/src/page/Login.jsx`

**Updated Approval Check:**
```javascript
if ((profile.role === "employee" || profile.role === "admin") && 
    profile.approval_status === "pending") {
  setMessage("Your account is pending admin approval. You will be notified once approved.");
  return; // Prevent login
}

if ((profile.role === "employee" || profile.role === "admin") && 
    profile.approval_status === "rejected") {
  setMessage("Your account request was rejected. Please contact admin for more details.");
  return; // Prevent login
}
```

**Behavior:**
- Both Employee and Admin users must have `approval_status="approved"` to login
- Pending accounts show approval pending message
- Rejected accounts show rejection message

---

## Database Changes

### profiles Table
No schema changes required. Existing columns support both Employee and Admin:
- `role` (TEXT): Can be "customer", "employee", or "admin"
- `employee_type` (TEXT): Stores specific role (general, admin, sub-admin, etc.)
- `approval_status` (TEXT): "pending", "approved", or "rejected"

### user_approvals Table
No schema changes required. Existing structure handles both:
- `requested_role` (TEXT): Stores formatted role string (e.g., "admin_admin", "employee_sales")
- `status` (TEXT): "pending", "approved", "rejected"

---

## Role Names Preserved

**No existing role names were changed or removed.**

All role names match exactly as defined in the requirements:

### Employee Types
- general
- sub-general
- hr-general
- sales

### Admin Types
- admin
- sub-admin
- hr
- washer

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│  FRONTEND - Sign Up Page                                    │
├─────────────────────────────────────────────────────────────┤
│  1. User selects role (Customer/Employee/Admin)             │
│  2. If Employee/Admin: Show dropdown with type options      │
│     - Fetched from: GET /auth/get-roles                     │
│  3. Validate selection before allowing signup               │
│  4. Send: /auth/send-otp with role & employeeType          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  BACKEND - OTP Verification                                 │
├─────────────────────────────────────────────────────────────┤
│  1. Verify OTP (existing logic)                             │
│  2. Create Supabase auth user (existing logic)              │
│  3. Create profile in profiles table with:                  │
│     - role: "customer" | "employee" | "admin"              │
│     - employee_type: selected value                         │
│     - approval_status: "approved" (customer only)           │
│                        "pending" (employee & admin)         │
│  4. Create approval request in user_approvals table         │
│  5. Notify admins                                           │
│  6. Return success message                                  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  FRONTEND - Login Page                                      │
├─────────────────────────────────────────────────────────────┤
│  1. User attempts login                                     │
│  2. Check profile approval_status:                          │
│     - Customer: approval_status always "approved"           │
│     - Employee: Check if "approved" else show pending msg   │
│     - Admin (NEW): Check if "approved" else show pending msg│
│  3. If approved: Allow login & redirect                     │
│  4. If pending/rejected: Show message & block login         │
└─────────────────────────────────────────────────────────────┘
```

---

## Approval Workflow

### For Admin Users (NEW)
1. Admin signs up with selected admin type
2. Account created with `approval_status="pending"`
3. Entry created in `user_approvals` table
4. Admin is notified to approve/reject
5. Once approved: `approval_status="approved"` in profiles table
6. User can now login

### For Employee Users (Updated)
1. Employee signs up with selected employee type
2. Account created with `approval_status="pending"`
3. Entry created in `user_approvals` table (with updated role format)
4. Admin is notified to approve/reject
5. Once approved: `approval_status="approved"` in profiles table
6. User can now login

### For Customer Users (Unchanged)
- Signup → `approval_status="approved"` immediately
- Can login without admin approval

---

## Testing Checklist

- [ ] **Employee Signup**
  - [ ] Select "Employee" option
  - [ ] Dropdown shows 4 employee types (general, sub-general, hr-general, sales)
  - [ ] Cannot submit without selecting position
  - [ ] Signup creates pending account
  - [ ] Login shows approval pending message

- [ ] **Admin Signup (NEW)**
  - [ ] Select "Admin" option
  - [ ] Admin dropdown shows 4 admin types (admin, sub-admin, hr, washer)
  - [ ] Cannot submit without selecting position
  - [ ] Signup creates pending account with role="admin"
  - [ ] Login shows approval pending message

- [ ] **Customer Signup (Unchanged)**
  - [ ] Select "Customer" option
  - [ ] No dropdown shown
  - [ ] Signup creates approved account
  - [ ] Can login immediately

- [ ] **Approval System**
  - [ ] Admin can approve users (existing flow)
  - [ ] Admin can reject users (existing flow)
  - [ ] Approved users can login
  - [ ] Pending users cannot login

- [ ] **Data Validation**
  - [ ] Role names match exactly as specified
  - [ ] No hardcoded role values in frontend
  - [ ] All roles loaded from API endpoint

---

## API Request Examples

### Customer Signup
```bash
POST /auth/send-otp
{
  "name": "John Customer",
  "email": "john@example.com",
  "phone": "9876543210",
  "password": "password123",
  "role": "customer",
  "employeeType": ""
}
```

### Employee Signup
```bash
POST /auth/send-otp
{
  "name": "Jane Employee",
  "email": "jane@example.com",
  "phone": "9876543211",
  "password": "password123",
  "role": "employee",
  "employeeType": "sales"
}
```

### Admin Signup (NEW)
```bash
POST /auth/send-otp
{
  "name": "Admin User",
  "email": "admin@example.com",
  "phone": "9876543212",
  "password": "password123",
  "role": "admin",
  "employeeType": "sub-admin"
}
```

---

## Files Modified

| File | Changes | Status |
|------|---------|--------|
| `backend/routes/auth.js` | Added `/auth/get-roles` endpoint, Updated `/send-otp` and `/verify-otp` | ✅ Complete |
| `frontend/src/page/SignUp.jsx` | Added Admin option, Converted radio buttons to dropdowns, Added role fetching | ✅ Complete |
| `frontend/src/page/Login.jsx` | Updated approval check for Admin role | ✅ Complete |

---

## Backwards Compatibility

✅ **Fully Backwards Compatible**
- Existing customer signup/login unchanged
- Existing employee signup/login maintains same approval flow
- All existing role names preserved
- No database schema changes required
- New admin signup is additive (doesn't break existing flows)

---

## Notes

1. **Dynamic Roles:** Role options are now fetched from API, making it easy to add new roles in future without frontend code changes.

2. **Approval Enforcement:** Both Employee and Admin signups require approval before login. This is consistent and secure.

3. **Employee Type Field:** Both Employee and Admin use the `employee_type` field to store their specific role. This maintains schema consistency.

4. **Role Consistency:** The exact same role names are used throughout:
   - Signup → Database → Login → Authorization
   - No name mapping or conversion needed

5. **Clean Implementation:** Added clear comments in code explaining the admin signup flow and approval requirements.

---

## Summary

The Sign Up page has been successfully updated with:
1. ✅ Admin signup option
2. ✅ Dropdown menus for role selection (loaded from API)
3. ✅ Mandatory role selection validation
4. ✅ Approval requirement for both Employee and Admin
5. ✅ All existing role names preserved
6. ✅ No breaking changes to existing flows
7. ✅ Consistent with existing approval logic
8. ✅ Database-driven dropdown options
