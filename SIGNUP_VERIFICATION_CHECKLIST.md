# Sign Up Updates - Verification Checklist

## Code Changes Verification

### Backend (`backend/routes/auth.js`)

- [ ] **New Endpoint: `/auth/get-roles`**
  - [ ] GET request handler exists
  - [ ] Returns employee_types array with 4 items (general, sub-general, hr-general, sales)
  - [ ] Returns admin_types array with 4 items (admin, sub-admin, hr, washer)
  - [ ] Each role has id, label, and value properties
  - [ ] Endpoint is exported in router

- [ ] **Updated: `/send-otp`**
  - [ ] Accepts `role` parameter
  - [ ] Validates role is one of: customer, employee, admin
  - [ ] Stores role in otp_verification table
  - [ ] Email includes approval note for employee AND admin
  - [ ] Handles both employeeType and adminType (passed as employeeType)

- [ ] **Updated: `/verify-otp`**
  - [ ] Creates profile with role="admin" for admin signups
  - [ ] Creates profile with role="employee" for employee signups
  - [ ] Sets employee_type correctly for both employee and admin
  - [ ] Sets approval_status="pending" for both employee and admin
  - [ ] Creates user_approvals entry for both roles
  - [ ] Generates correct requested_role format (admin_*, employee_*)
  - [ ] Returns appropriate success message based on role

### Frontend - Sign Up Page (`frontend/src/page/SignUp.jsx`)

- [ ] **State Management**
  - [ ] `availableRoles` state initialized with empty arrays
  - [ ] `loadingRoles` state initialized
  - [ ] `adminType` state added to form
  - [ ] `employeeType` still exists in form

- [ ] **API Fetching**
  - [ ] Fetches from `/auth/get-roles` on component mount
  - [ ] Sets `availableRoles` with fetched data
  - [ ] Shows loading state while fetching
  - [ ] Has error handling for failed requests

- [ ] **Role Selection Buttons**
  - [ ] Customer button exists and works
  - [ ] Employee button exists and works
  - [ ] **Admin button exists (NEW)** with purple styling
  - [ ] Buttons properly reset adminType and employeeType when changing roles

- [ ] **Dropdowns**
  - [ ] Employee dropdown shows for role="employee"
  - [ ] Employee dropdown populates from availableRoles.employee_types
  - [ ] Employee dropdown requires selection (has validation)
  - [ ] **Admin dropdown shows for role="admin" (NEW)**
  - [ ] **Admin dropdown populates from availableRoles.admin_types (NEW)**
  - [ ] **Admin dropdown requires selection (NEW)**

- [ ] **Form Validation**
  - [ ] Validates that all basic fields are filled
  - [ ] Validates employeeType selection for employee role
  - [ ] **Validates adminType selection for admin role (NEW)**
  - [ ] Shows appropriate error messages
  - [ ] Prevents submission without required selections

- [ ] **OTP Flow**
  - [ ] Sends correct role value to backend
  - [ ] Sends employeeType for employees
  - [ ] Sends adminType as employeeType for admins
  - [ ] Handles OTP verification for all roles
  - [ ] Shows appropriate success messages

### Frontend - Login Page (`frontend/src/page/Login.jsx`)

- [ ] **Approval Status Check**
  - [ ] Checks both employee AND admin roles
  - [ ] Prevents login if approval_status === "pending"
  - [ ] Prevents login if approval_status === "rejected"
  - [ ] Shows appropriate pending message
  - [ ] Shows appropriate rejected message
  - [ ] Allows customers to login without approval check (unchanged)

- [ ] **Redirect Logic**
  - [ ] Admin role redirects to /admin-dashboard
  - [ ] Employee role redirects to appropriate dashboard
  - [ ] Customer role redirects to /customer-dashboard

---

## Functional Testing

### Employee Signup
- [ ] Can select "Employee" role
- [ ] Dropdown appears with 4 options
- [ ] Cannot submit without selecting position
- [ ] Shows error message if position not selected
- [ ] Can select each position type
- [ ] OTP is sent after form submission
- [ ] Account created with role="employee" in database
- [ ] Account created with approval_status="pending"
- [ ] Entry created in user_approvals table
- [ ] At login, shows "pending approval" message
- [ ] Cannot login until approved

### Admin Signup (NEW)
- [ ] Can select "Admin" role
- [ ] Dropdown appears with 4 admin options (admin, sub-admin, hr, washer)
- [ ] Cannot submit without selecting position
- [ ] Shows error message if position not selected
- [ ] Can select each admin position type
- [ ] OTP is sent after form submission
- [ ] Account created with role="admin" in database
- [ ] Account created with approval_status="pending"
- [ ] Entry created in user_approvals table
- [ ] At login, shows "pending approval" message
- [ ] Cannot login until approved

### Customer Signup (Unchanged)
- [ ] Can select "Customer" role
- [ ] No position dropdown shown
- [ ] Can submit form without position selection
- [ ] OTP is sent after form submission
- [ ] Account created with role="customer"
- [ ] Account created with approval_status="approved"
- [ ] No entry in user_approvals table
- [ ] Can login immediately without approval

### API Endpoint
- [ ] GET /auth/get-roles returns 200
- [ ] Response includes success=true
- [ ] Response includes roles.employee_types array
- [ ] Response includes roles.admin_types array
- [ ] All 4 employee types present
- [ ] All 4 admin types present
- [ ] Each role object has id, label, value properties

### Validation
- [ ] Cannot submit with empty fields
- [ ] Cannot submit employee form without position
- [ ] Cannot submit admin form without position (NEW)
- [ ] Shows appropriate error messages
- [ ] Error messages are clear and helpful

### Database
- [ ] Employee profile has role="employee"
- [ ] Admin profile has role="admin" (NEW)
- [ ] Customer profile has role="customer"
- [ ] Employee_type field populated correctly
- [ ] Approval_status correct for each role type
- [ ] User_approvals entries created correctly

---

## Data Validation

### Role Names
- [ ] Employee types: general ✓
- [ ] Employee types: sub-general ✓
- [ ] Employee types: hr-general ✓
- [ ] Employee types: sales ✓
- [ ] Admin types: admin ✓
- [ ] Admin types: sub-admin ✓
- [ ] Admin types: hr ✓
- [ ] Admin types: washer ✓

### Database Values
- [ ] Profiles.role field: "customer" ✓
- [ ] Profiles.role field: "employee" ✓
- [ ] Profiles.role field: "admin" (NEW) ✓
- [ ] Profiles.employee_type field: matches selected value ✓
- [ ] Profiles.approval_status field: "pending" for employee ✓
- [ ] Profiles.approval_status field: "pending" for admin (NEW) ✓
- [ ] Profiles.approval_status field: "approved" for customer ✓

---

## Error Handling

- [ ] Invalid role handling
- [ ] Missing required fields handling
- [ ] Empty dropdown selection handling
- [ ] OTP verification failure handling
- [ ] Database insertion failure handling
- [ ] API fetch failure handling (graceful fallback)
- [ ] Network error handling

---

## UI/UX Verification

### Sign Up Page
- [ ] Layout looks correct
- [ ] Buttons are clearly labeled
- [ ] Dropdowns are properly styled
- [ ] Error messages are visible
- [ ] Success messages are clear
- [ ] Form is responsive on mobile
- [ ] Dropdowns work on mobile
- [ ] No layout issues or overlaps

### Login Page
- [ ] Error messages for pending approval are clear
- [ ] Error messages for rejection are clear
- [ ] Customer login unaffected
- [ ] Employee login with approval check works
- [ ] Admin login with approval check works (NEW)

---

## Browser Compatibility

- [ ] Works in Chrome
- [ ] Works in Firefox
- [ ] Works in Safari
- [ ] Works in Edge
- [ ] Dropdowns work in all browsers
- [ ] Form validation works in all browsers

---

## Performance

- [ ] `/auth/get-roles` endpoint responds quickly
- [ ] Dropdown population doesn't cause lag
- [ ] Form submission is responsive
- [ ] OTP verification is timely
- [ ] No unnecessary API calls

---

## Security

- [ ] Passwords not logged or exposed
- [ ] OTP is properly hashed/secured
- [ ] Approval status properly enforced at login
- [ ] No role/adminType manipulation possible
- [ ] SQL injection prevention (using parameterized queries)
- [ ] XSS prevention (proper escaping)

---

## Documentation

- [ ] Code comments explain admin signup flow
- [ ] Code comments explain dropdown population
- [ ] Code comments explain approval requirement
- [ ] Inline comments in key sections
- [ ] No misleading or outdated comments

---

## Backwards Compatibility

- [ ] Existing customer signups work unchanged
- [ ] Existing employee signups work (with dropdowns now)
- [ ] Existing approvals still functional
- [ ] No data loss for existing users
- [ ] Old signup code doesn't conflict with new code

---

## Documentation Files

- [ ] SIGNUP_PAGE_UPDATES.md created
- [ ] SIGNUP_QUICK_REFERENCE.md created
- [ ] SIGNUP_IMPLEMENTATION_GUIDE.md created
- [ ] SIGNUP_STATUS.md created
- [ ] This checklist created
- [ ] All documents are clear and comprehensive

---

## Deployment Readiness

- [ ] All code changes complete
- [ ] All tests passing
- [ ] Documentation complete
- [ ] No console errors
- [ ] No console warnings (related to changes)
- [ ] Database backup available
- [ ] Rollback plan ready
- [ ] Team aware of changes
- [ ] Change log updated

---

## Sign-Off

- [ ] Development Complete
- [ ] Code Review Passed
- [ ] Testing Complete
- [ ] Documentation Complete
- [ ] Ready for Deployment

---

**Checklist Created:** January 2, 2026
**Last Updated:** January 2, 2026
**Status:** Ready for Verification

Use this checklist to verify all changes are properly implemented and working as expected before deployment.
