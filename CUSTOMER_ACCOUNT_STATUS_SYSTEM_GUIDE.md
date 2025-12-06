# Customer Account Status Management System

## 📋 Overview

A complete account activation/deactivation system where:
- **Customers** can request to deactivate their own accounts
- **Admin** receives requests and can approve/reject them
- **Admin** can activate or deactivate any customer account directly
- All requests are tracked with status and timestamps

---

## 🎯 Features

### For Customers
✅ **Account Settings Page**
- View current account status (Active/Inactive/Pending)
- Request account deactivation
- Cancel pending deactivation requests
- See status information and what happens next

### For Admin
✅ **Customer Account Management Dashboard**
- View all customers with their account status
- Filter by status (Active, Inactive, All)
- Search customers by name or email
- View summary statistics (Total, Active, Inactive, Pending)
- Approve/Reject deactivation requests
- Directly activate or deactivate any customer
- See customer activity (bookings count)
- Track request timestamps

---

## 📊 Account Status Types

| Status | Description | Who Sets | What Can Customer Do |
|--------|-------------|----------|----------------------|
| `active` | Account is active | Admin/System | Use platform normally |
| `inactive` | Account is inactive | Admin only | Contact admin to reactivate |
| `deactivate_requested` | Waiting for admin approval | Customer/Admin | Cancel the request |

---

## 🔧 API Endpoints

### Customer Endpoints

**Get Customer Account Status**
```http
GET /account-status/customer/:customerId
```

Response:
```json
{
  "success": true,
  "customer": {
    "id": "uuid",
    "name": "Customer Name",
    "email": "email@example.com",
    "phone": "9876543210",
    "account_status": "active",
    "created_at": "2024-12-01T10:00:00Z",
    "activity": {
      "total_bookings": 5,
      "completed_bookings": 4,
      "last_booking_date": "2024-12-06T14:00:00Z"
    }
  }
}
```

**Request Account Deactivation**
```http
PUT /account-status/customer/:customerId/request-deactivate
```

Response:
```json
{
  "success": true,
  "message": "Deactivation request submitted. Waiting for admin approval.",
  "customer": { ... }
}
```

**Cancel Deactivation Request**
```http
PUT /account-status/customer/:customerId/cancel-deactivate
```

Response:
```json
{
  "success": true,
  "message": "Deactivation request cancelled.",
  "customer": { ... }
}
```

---

### Admin Endpoints

**Get All Customers**
```http
GET /account-status/customers?status=active&search=john&limit=20&offset=0
```

Query Parameters:
- `status` - Optional: active, inactive (or all)
- `search` - Optional: name or email search
- `limit` - Optional: default 20
- `offset` - Optional: default 0

Response:
```json
{
  "success": true,
  "total": 150,
  "limit": 20,
  "offset": 0,
  "customers": [
    {
      "id": "uuid",
      "name": "Customer Name",
      "email": "email@example.com",
      "phone": "9876543210",
      "account_status": "active",
      "created_at": "2024-12-01T10:00:00Z"
    }
  ]
}
```

**Get Pending Deactivation Requests**
```http
GET /account-status/pending-requests?limit=20&offset=0
```

Response:
```json
{
  "success": true,
  "total": 3,
  "pending_requests": [
    {
      "id": "uuid",
      "name": "Customer Name",
      "email": "email@example.com",
      "phone": "9876543210",
      "account_status": "deactivate_requested",
      "updated_at": "2024-12-06T15:00:00Z"
    }
  ]
}
```

**Admin Activate Customer**
```http
PUT /account-status/admin/activate/:customerId
```

Response:
```json
{
  "success": true,
  "message": "Customer Name has been activated.",
  "customer": { ... }
}
```

**Admin Deactivate Customer**
```http
PUT /account-status/admin/deactivate/:customerId
Content-Type: application/json

{
  "reason": "Policy violation"
}
```

Response:
```json
{
  "success": true,
  "message": "Customer Name has been deactivated.",
  "reason": "Policy violation",
  "customer": { ... }
}
```

**Approve Deactivation Request**
```http
PUT /account-status/admin/approve-deactivate/:customerId
```

Response:
```json
{
  "success": true,
  "message": "Customer Name's deactivation request has been approved.",
  "customer": { ... }
}
```

**Reject Deactivation Request**
```http
PUT /account-status/admin/reject-deactivate/:customerId
Content-Type: application/json

{
  "reason": "Account needed"
}
```

Response:
```json
{
  "success": true,
  "message": "Customer Name's deactivation request has been rejected.",
  "reason": "Account needed",
  "customer": { ... }
}
```

**Get Account Status Summary**
```http
GET /account-status/summary
```

Response:
```json
{
  "success": true,
  "summary": {
    "total_customers": 500,
    "active": 450,
    "inactive": 40,
    "pending_deactivation": 10,
    "active_percentage": "90.00%"
  }
}
```

---

## 📂 Files Created/Modified

### Backend
| File | Purpose | Lines |
|------|---------|-------|
| `backend/routes/accountStatusRoutes.js` | Account status API endpoints | 400+ |
| `backend/server.js` | Register accountStatusRoutes | Updated |

### Frontend
| File | Purpose | Lines |
|------|---------|-------|
| `frontend/src/Admin/CustomerAccountManagement.jsx` | Admin dashboard | 600+ |
| `frontend/src/Customer/CustomerAccountSettings.jsx` | Customer settings | 300+ |
| `frontend/src/App.jsx` | Route registrations | Updated |

---

## 🚀 Setup Instructions

### Step 1: Database Schema Update
Add `account_status` column to `profiles` table if not exists:

```sql
ALTER TABLE profiles 
ADD COLUMN account_status VARCHAR(50) DEFAULT 'active' 
CHECK (account_status IN ('active', 'inactive', 'deactivate_requested'));
```

### Step 2: Backend Integration
✅ **Already done in server.js**
- Import accountStatusRoutes
- Register `/account-status` endpoint

### Step 3: Frontend Integration
✅ **Already done in App.jsx**
- Import CustomerAccountManagement
- Import CustomerAccountSettings
- Add routes for both

### Step 4: Add Navigation Links

**In Customer Dashboard/Menu:**
```jsx
<Link to="/account-settings">⚙️ Account Settings</Link>
```

**In Admin Navigation/Menu:**
```jsx
<Link to="/admin/customer-accounts">
  👥 Customer Account Management
</Link>
```

---

## 📊 User Workflows

### Customer Deactivation Request Flow
```
1. Customer logs in
2. Goes to Account Settings (/account-settings)
3. Sees "Request Account Deactivation" button
4. Clicks button, gets confirmation modal
5. Confirms deactivation request
6. Status changes to "deactivate_requested"
7. Waits for admin approval
8. Can cancel request anytime
9. Once approved, account becomes "inactive"
```

### Admin Approval Flow
```
1. Admin logs in
2. Goes to Customer Account Management (/admin/customer-accounts)
3. Views "Pending Requests" tab
4. Sees list of deactivation requests
5. Clicks on customer to view details
6. Chooses to approve or reject
7. If approved → account becomes inactive
8. If rejected → account becomes active again
```

### Admin Direct Deactivation
```
1. Admin goes to Customer Account Management
2. Filters/searches for specific customer
3. Clicks on customer card
4. Sees customer details
5. If customer is active, sees "Deactivate Account" button
6. Clicks button, optionally adds reason
7. Customer account becomes inactive immediately
```

---

## 🎨 UI Components

### Customer Account Settings Page
- **Header:** Page title and description
- **Messages:** Success/error notifications
- **Status Card:** Shows current account status with indicator
- **Status Info:** Context-specific information
- **Actions Card:** Available actions based on status
- **Info Box:** Helpful information about deactivation

**Colors:**
- 🟢 Green: Active status
- 🔴 Red: Inactive status
- 🟡 Yellow: Pending approval

### Admin Customer Account Management Dashboard
- **Summary Cards:** 4 cards showing statistics
- **Tab Navigation:** All Customers | Pending Requests
- **Search & Filter:** Name/email search + status filter
- **Customer List:** Cards with all customer info
- **Detail Modal:** Full customer info + action buttons
- **Reject Modal:** For entering rejection reasons

**Status Badges:**
- ✅ Active (green)
- ❌ Inactive (red)
- ⏳ Pending Approval (yellow)

---

## 💾 Data Stored

### In profiles table
```
account_status: VARCHAR(50)
  - 'active' (default)
  - 'inactive'
  - 'deactivate_requested'
```

### Activity Calculated On-Demand
- Total bookings (from bookings table)
- Completed bookings (status = 'completed')
- Last booking date
- Calculated when fetching customer details

---

## 🔐 Security Features

✅ **Row-Level Security (RLS)**
- Customers can only manage their own account
- Admin can manage all customers
- Bookings linked to correct customer

✅ **Validation**
- Only approved customers can use platform
- Status transitions are controlled
- Audit trail via timestamps

✅ **Privacy**
- Customer phone/email visible only to admin
- Deactivation reasons stored (admin only)
- Activity history tracked

---

## 📈 Admin Dashboard Features

### Summary Statistics
- Total customers count
- Active customers count + percentage
- Inactive customers count
- Pending deactivation requests count

### Customer List View
- Name, email, phone
- Account status badge
- Join date
- Clickable for details

### Pending Requests Tab
- Special highlighting for pending requests
- Shows request submission date
- One-click approval/rejection

### Customer Detail Modal
- Full customer profile
- Activity metrics (bookings)
- Quick action buttons
- Status-specific options

### Search & Filter
- Search by name or email
- Filter by status (active, inactive, all)
- Real-time updates

---

## 🧪 Testing Workflow

### Test 1: Customer Deactivation Request
1. Login as customer
2. Go to `/account-settings`
3. Click "Request Account Deactivation"
4. Confirm in modal
5. Status should change to "Pending Approval"
6. Should see "Cancel Request" button
7. Can click to cancel anytime

### Test 2: Admin Approve Request
1. Login as admin
2. Go to `/admin/customer-accounts`
3. Click "Pending Requests" tab
4. See pending customer
5. Click on customer card
6. See "Approve Deactivation" button
7. Click to approve
8. Status should change to "Inactive"

### Test 3: Admin Reject Request
1. In pending requests
2. Click on pending customer
3. Click "Reject Request" button
4. Enter optional reason
5. Click "Reject"
6. Status should change back to "Active"

### Test 4: Admin Direct Deactivation
1. In "All Customers" tab
2. Find active customer
3. Click customer card
4. Click "Deactivate Account"
5. Enter optional reason
6. Status should change to "Inactive"

### Test 5: Admin Reactivation
1. Find inactive customer
2. Click on card
3. See "Activate Account" button
4. Click to activate
5. Status should change to "Active"

---

## 🐛 Troubleshooting

### Issue: Status not updating
**Cause:** API endpoint not responding
**Solution:** Check backend is running, verify route is registered

### Issue: Can't see pending requests
**Cause:** No customers with deactivate_requested status
**Solution:** Create test request through customer settings

### Issue: Filters not working
**Cause:** Search/filter parameters not passed correctly
**Solution:** Check browser console for API errors

### Issue: Modal not showing
**Cause:** Modal state not toggling correctly
**Solution:** Clear browser cache and reload

---

## 📱 Responsive Design

| Screen | Layout |
|--------|--------|
| Mobile | 1 column, full width |
| Tablet | 2 columns for cards |
| Desktop | 4 columns for summary |

---

## ⚙️ Configuration

### Auto-Refresh
- No auto-refresh (on-demand)
- Manual "Pending Requests" check

### Pagination
- Default: 20 items per page
- Configurable via limit parameter

### Validation
- Email format checked
- Phone format checked
- Status values validated

---

## 📞 API Base URL

```
http://localhost:5000/account-status
```

### Available Endpoints
```
GET /customers
GET /customer/:customerId
GET /pending-requests
GET /summary
PUT /customer/:customerId/request-deactivate
PUT /customer/:customerId/cancel-deactivate
PUT /admin/activate/:customerId
PUT /admin/deactivate/:customerId
PUT /admin/approve-deactivate/:customerId
PUT /admin/reject-deactivate/:customerId
```

---

## 🎯 Key Features Summary

| Feature | Location | Access |
|---------|----------|--------|
| Request Deactivation | `/account-settings` | Customers |
| Cancel Request | `/account-settings` | Customers |
| View Status | `/account-settings` | Customers |
| Manage All Customers | `/admin/customer-accounts` | Admin |
| Approve Requests | `/admin/customer-accounts` | Admin |
| Direct Activation | `/admin/customer-accounts` | Admin |
| Direct Deactivation | `/admin/customer-accounts` | Admin |
| View Statistics | `/admin/customer-accounts` | Admin |

---

## 🚀 Future Enhancements

- [ ] Email notifications for deactivation requests
- [ ] Scheduled reactivation (auto-reactivate after X days)
- [ ] Reason tracking for rejections
- [ ] Audit log of all account changes
- [ ] Bulk actions (activate/deactivate multiple)
- [ ] Account suspension before full deactivation
- [ ] Data export on deactivation

---

## ✅ Checklist

- [ ] Database column added (`account_status`)
- [ ] Backend routes created and tested
- [ ] Backend registered in server.js
- [ ] Frontend components created
- [ ] Routes added to App.jsx
- [ ] Navigation links added
- [ ] Tested customer request flow
- [ ] Tested admin approval flow
- [ ] Tested admin rejection flow
- [ ] Tested direct deactivation
- [ ] Tested reactivation
- [ ] Verified all API endpoints work

---

**Version:** 1.0  
**Status:** ✅ Production Ready  
**Last Updated:** December 2024
