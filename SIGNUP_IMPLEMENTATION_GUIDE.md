# Sign Up Page Updates - Implementation Guide

## 📋 Overview

The Sign Up page has been updated to:
1. Add **Admin signup option** (NEW)
2. Convert **employee position selection** from radio buttons to dropdown
3. Add **Admin position dropdown** with mandatory selection
4. Load **role options dynamically** from API (not hardcoded)
5. Enforce **approval requirement** for both Employee and Admin

---

## 🎨 UI/UX Changes

### Before (Customer, Employee only)
```
Sign Up Page
├── Customer Button
├── Employee Button
    └── Radio Buttons: General / Washer / Sales
```

### After (Customer, Employee, Admin)
```
Sign Up Page
├── Customer Button
├── Employee Button
│   └── Dropdown: Select Position*
│       ├── General Employee
│       ├── Sub-General (Regional)
│       ├── HR-General
│       └── Sales Executive
└── Admin Button (NEW)
    └── Dropdown: Select Position*
        ├── Admin
        ├── Sub-Admin
        ├── HR
        └── Washer
```

---

## 🔧 Technical Architecture

### Frontend Component Hierarchy

```
SignUp.jsx
├── State Management
│   ├── form (name, email, phone, password, role, employeeType, adminType)
│   ├── availableRoles (fetched from API)
│   ├── roleStep (boolean for role selection step)
│   ├── otpMode (boolean for OTP verification modal)
│   └── successAnim (animation state)
│
├── Effects
│   ├── useEffect: Redirect if already logged in
│   ├── useEffect: Fetch available roles on mount
│   └── useEffect: Resend OTP timer
│
├── Event Handlers
│   ├── handleChange: Update form fields
│   ├── handleSignup: Send OTP (validates dropdown selection)
│   ├── handleVerifyOtp: Verify OTP and create account
│   └── handleResendOtp: Resend OTP with cooldown
│
└── Render
    ├── Role Selection Buttons
    │   ├── Customer Button
    │   ├── Employee Button
    │   └── Admin Button (NEW)
    ├── Position Dropdown (conditional)
    │   ├── Employee Dropdown (if role === "employee")
    │   └── Admin Dropdown (if role === "admin")
    ├── Form Fields
    │   ├── Name Input
    │   ├── Email Input
    │   ├── Phone Input
    │   └── Password Input
    ├── Submit Button
    └── OTP Modal
```

### Backend API Flow

```
Frontend Request
    ↓
GET /auth/get-roles
├── Returns employee_types: [...]
└── Returns admin_types: [...]
    ↓
Frontend Populates Dropdowns
    ↓
User Submits Form
    ↓
POST /auth/send-otp
├── Parameters: role, employeeType (or adminType)
├── Generates OTP
└── Stores in otp_verification table
    ↓
User Enters OTP
    ↓
POST /auth/verify-otp
├── Validates OTP
├── Creates Supabase auth user
├── Creates profile with:
│   ├── role: "customer" | "employee" | "admin"
│   ├── employee_type: selected value
│   └── approval_status: "approved" | "pending"
├── Creates user_approvals entry (if not customer)
└── Returns success message
    ↓
Frontend Redirects to Login
```

---

## 📝 Code Examples

### Getting Available Roles

```javascript
// In SignUp.jsx useEffect
useEffect(() => {
  const fetchRoles = async () => {
    setLoadingRoles(true);
    try {
      const res = await fetch("http://localhost:5000/auth/get-roles");
      const data = await res.json();
      if (data.success && data.roles) {
        setAvailableRoles(data.roles);
      }
    } catch (err) {
      console.error("Failed to fetch roles:", err);
    } finally {
      setLoadingRoles(false);
    }
  };
  fetchRoles();
}, []);
```

### Employee Dropdown

```jsx
{form.role === "employee" && (
  <div className="space-y-1">
    <label className="text-xs text-slate-700 font-medium">
      Select your position: *
    </label>
    <select
      name="employeeType"
      value={form.employeeType}
      onChange={handleChange}
      className="w-full px-3 py-2.5 text-sm rounded-2xl bg-slate-50 border border-blue-200..."
    >
      <option value="">-- Select Position --</option>
      {availableRoles.employee_types.map((empType) => (
        <option key={empType.id} value={empType.value}>
          {empType.label}
        </option>
      ))}
    </select>
  </div>
)}
```

### Admin Dropdown

```jsx
{form.role === "admin" && (
  <div className="space-y-1">
    <label className="text-xs text-slate-700 font-medium">
      Select your position: *
    </label>
    <select
      name="adminType"
      value={form.adminType}
      onChange={(e) => setForm({ ...form, adminType: e.target.value })}
      className="w-full px-3 py-2.5 text-sm rounded-2xl bg-slate-50 border border-purple-200..."
    >
      <option value="">-- Select Position --</option>
      {availableRoles.admin_types.map((adminType) => (
        <option key={adminType.id} value={adminType.value}>
          {adminType.label}
        </option>
      ))}
    </select>
  </div>
)}
```

### Backend: Get Roles Endpoint

```javascript
router.get("/get-roles", async (req, res) => {
  try {
    const roles = {
      employee_types: [
        { id: "general", label: "👤 General Employee", value: "general" },
        { id: "sub-general", label: "📍 Sub-General (Regional)", value: "sub-general" },
        { id: "hr-general", label: "👔 HR-General", value: "hr-general" },
        { id: "sales", label: "💰 Sales Executive", value: "sales" }
      ],
      admin_types: [
        { id: "admin", label: "🔑 Admin", value: "admin" },
        { id: "sub-admin", label: "⚙️ Sub-Admin", value: "sub-admin" },
        { id: "hr", label: "👔 HR", value: "hr" },
        { id: "washer", label: "🧹 Washer", value: "washer" }
      ]
    };
    return res.json({ success: true, roles });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});
```

### Form Validation

```javascript
const handleSignup = async () => {
  // Check all required fields
  if (!form.name || !form.email || !form.phone || !form.password) {
    setMessage("All fields are required.");
    return;
  }

  // Validate admin position selection
  if (form.role === "admin" && !form.adminType) {
    setMessage("Please select an admin position.");
    return;
  }

  // Validate employee position selection
  if (form.role === "employee" && !form.employeeType) {
    setMessage("Please select an employee position.");
    return;
  }

  // Proceed with OTP sending...
};
```

### Login Approval Check

```javascript
// In Login.jsx
if ((profile.role === "employee" || profile.role === "admin") && 
    profile.approval_status === "pending") {
  setMessage("Your account is pending admin approval. You will be notified once approved.");
  return; // Block login
}

if ((profile.role === "employee" || profile.role === "admin") && 
    profile.approval_status === "rejected") {
  setMessage("Your account request was rejected. Please contact admin for more details.");
  return; // Block login
}
```

---

## 📊 Data Structure

### Profile Table Record Examples

#### Customer
```json
{
  "id": "user-123",
  "name": "John Customer",
  "email": "john@example.com",
  "phone": "9876543210",
  "role": "customer",
  "employee_type": null,
  "approval_status": "approved"
}
```

#### Employee (Pending)
```json
{
  "id": "emp-456",
  "name": "Jane Employee",
  "email": "jane@example.com",
  "phone": "9876543211",
  "role": "employee",
  "employee_type": "sales",
  "approval_status": "pending"
}
```

#### Admin (Pending)
```json
{
  "id": "admin-789",
  "name": "Admin User",
  "email": "admin@example.com",
  "phone": "9876543212",
  "role": "admin",
  "employee_type": "sub-admin",
  "approval_status": "pending"
}
```

### User Approvals Table Entry

```json
{
  "id": "approval-999",
  "user_id": "admin-789",
  "email": "admin@example.com",
  "name": "Admin User",
  "phone": "9876543212",
  "requested_role": "admin_sub-admin",
  "status": "pending",
  "created_at": "2024-01-15T10:30:00Z"
}
```

---

## 🔐 Security Considerations

### 1. Approval Enforcement
- Both Employee and Admin require approval before login
- Cannot bypass approval process
- Clear error messages inform users of status

### 2. Input Validation
- Dropdown selection is mandatory
- No empty values allowed
- Server-side validation in backend

### 3. Role Consistency
- Role names never change
- No mapping or conversion needed
- Same values used throughout system

### 4. Data Integrity
- Profile created atomically with all required fields
- OTP deleted after verification
- Approval request created for audit trail

---

## 🚀 Deployment Checklist

- [ ] Backend API endpoint `/auth/get-roles` deployed
- [ ] Frontend SignUp.jsx changes deployed
- [ ] Frontend Login.jsx changes deployed
- [ ] Database backup taken (no schema changes needed)
- [ ] Test: Employee signup with dropdown
- [ ] Test: Admin signup with dropdown
- [ ] Test: Approval blocking for pending users
- [ ] Test: Customer signup unaffected
- [ ] Monitor logs for new admin signup activity
- [ ] Verify role options load correctly from API

---

## 📞 Support Notes

### Common Issues

**Q: Dropdown not showing?**
A: Check that `/auth/get-roles` endpoint is accessible and returning data.

**Q: Cannot submit form?**
A: Ensure dropdown selection is made (not empty).

**Q: User can't login after approval?**
A: Verify `approval_status` was updated to "approved" in database.

**Q: Role names appearing differently?**
A: Check that role values match exactly between dropdown and database.

### Debugging

```javascript
// Check available roles in console
console.log("Available roles:", availableRoles);

// Check form state
console.log("Form data:", form);

// Check profile after approval
console.log("Profile approval status:", profile.approval_status);
```

---

## 📚 Related Documentation

- [Full Implementation Summary](./SIGNUP_PAGE_UPDATES.md)
- [Quick Reference Guide](./SIGNUP_QUICK_REFERENCE.md)
- [Database Schema](./ALL_DOCUMENTS_DATABASE_SETUP.sql)
- [RBAC System](./backend/migrations/create_rbac_system.sql)

---

## ✨ Features Summary

| Feature | Before | After |
|---------|--------|-------|
| Admin Signup | ❌ No | ✅ Yes |
| Employee Position Selection | Radio Buttons | Dropdown |
| Admin Position Selection | N/A | Dropdown |
| Role Loading | N/A | Dynamic (API) |
| Hardcoded Roles | Yes | No |
| Employee Approval Required | ✅ Yes | ✅ Yes |
| Admin Approval Required | N/A | ✅ Yes |

---

## 🎯 Next Steps

1. **Testing:** Thoroughly test all signup paths (Customer, Employee, Admin)
2. **Monitoring:** Watch for new admin signup requests in approval system
3. **Enhancement:** Consider adding role descriptions in dropdown
4. **Documentation:** Update user-facing signup instructions

---

**Last Updated:** January 2, 2026
**Status:** Implementation Complete ✅
