# Booking Wash Status Integration Guide

## 📋 Overview

This system integrates booking and car wash tracking to show real-time wash status to:
- ✅ **Customers** - See their booking wash status
- ✅ **Employees** - Manage washes linked to bookings
- ✅ **Admins** - Monitor all bookings and wash progress

---

## 🎯 Features

### For Customers
- View all their bookings with wash status
- See detailed wash information
- Track completion timeline
- Filter by status (Not Started, In Progress, Completed, Cancelled)

### For Admins
- Dashboard with wash statistics
- Real-time monitoring of all bookings
- Filter by status and date
- Detailed booking & wash information
- Completion rate tracking

### For Employees
- View assigned bookings with wash status
- Update wash status
- See booking details linked to washes

---

## 🔧 Integration Steps

### Step 1: Add Backend Route

**In `backend/server.js`:**

```javascript
import bookingWashStatusRoutes from "./routes/bookingWashStatus.js";

// Add this line with other route imports
app.use("/bookings", bookingWashStatusRoutes);
```

### Step 2: Add Customer Route

**In `frontend/src/App.jsx`:**

```javascript
import BookingWashStatus from "./Customer/BookingWashStatus.jsx";

// Add to Routes
<Route path="/my-bookings-status" element={<BookingWashStatus />} />
```

### Step 3: Add Admin Route

**In `frontend/src/App.jsx`:**

```javascript
import AdminWashDashboard from "./Admin/AdminWashDashboard.jsx";

// Add to Routes
<Route path="/admin/wash-dashboard" element={<AdminWashDashboard />} />
```

### Step 4: Add Navigation Links

**In Customer Dashboard:**
```jsx
<Link to="/my-bookings-status">
  🚗 My Bookings & Wash Status
</Link>
```

**In Admin Dashboard:**
```jsx
<Link to="/admin/wash-dashboard">
  📊 Wash Status Dashboard
</Link>
```

---

## 📊 API Endpoints

### Customer Endpoints

**Get Customer Bookings with Wash Status**
```
GET /bookings/customer/:customerId
```

Response:
```json
{
  "success": true,
  "total": 5,
  "bookings": [
    {
      "id": "booking-id",
      "car_name": "Honda City",
      "status": "Pending",
      "wash_status": "washed",
      "wash_details": {
        "id": "wash-id",
        "status": "washed",
        "created_at": "2024-12-06T10:00:00Z",
        "wash_completed_at": "2024-12-06T11:30:00Z",
        "notes": "Full wash completed"
      }
    }
  ]
}
```

**Get Single Booking with Wash Status**
```
GET /bookings/with-status/:bookingId
```

---

### Admin Endpoints

**Get All Bookings with Wash Status**
```
GET /bookings/admin/all-with-status?status=pending&date=2024-12-06
```

Query Parameters:
- `status` - Optional: pending, washed, cancelled
- `date` - Optional: YYYY-MM-DD format

Response:
```json
{
  "success": true,
  "total": 45,
  "bookings": [...]
}
```

**Get Wash Summary Stats**
```
GET /bookings/stats/wash-summary
```

Response:
```json
{
  "success": true,
  "stats": {
    "total_washes": 250,
    "washed": 245,
    "pending": 3,
    "cancelled": 2,
    "total_bookings": 300,
    "booked_but_not_washed": 50,
    "wash_completion_rate": "98.00"
  }
}
```

---

### Employee Endpoints

**Get Assigned Bookings with Wash Status**
```
GET /bookings/employee/assigned/:employeeId
```

**Create Wash for Booking**
```
POST /bookings/booking/:bookingId/create-wash
```

Body:
```json
{
  "employeeId": "employee-uuid"
}
```

---

## 📂 Files Created/Updated

| File | Purpose |
|------|---------|
| `backend/routes/bookingWashStatus.js` | Backend API routes |
| `frontend/src/Customer/BookingWashStatus.jsx` | Customer view |
| `frontend/src/Admin/AdminWashDashboard.jsx` | Admin dashboard |

---

## 🧪 Testing Workflow

### Test 1: Customer View

1. **Navigate to:** `/my-bookings-status`
2. **Expected:**
   - See all customer's bookings
   - Each booking shows wash status
   - Can expand to see details
   - Filters work correctly

3. **Test Cases:**
   - Filter by "Not Started" - shows pending bookings
   - Filter by "In Progress" - shows ongoing washes
   - Filter by "Completed" - shows finished washes
   - Expand a booking - see full details

### Test 2: Admin Dashboard

1. **Navigate to:** `/admin/wash-dashboard`
2. **Expected:**
   - Dashboard shows overall statistics
   - Statistics cards display:
     - Total Washes
     - Completed washes
     - Pending washes
     - Completion rate %
   - Filter functionality works

3. **Test Cases:**
   - Filter by status - updates table
   - Filter by date - shows only that date's bookings
   - View details - see full booking & wash info
   - Statistics update correctly

### Test 3: Data Linking

1. **Create a booking** with car details
2. **Employee marks wash as complete** in Car Wash Tracking
3. **Customer views booking** - should show "✅ Car Washed"
4. **Admin checks dashboard** - completion rate should increase

---

## 🔄 Data Flow

```
Booking Created
    ↓
Customer makes booking with car details
    ↓
Employee assigned to booking
    ↓
Employee creates/updates wash record in Car Wash Tracking
    ↓
Booking-Wash Integration pulls wash status
    ↓
Customer sees status in their bookings
    ↓
Admin sees summary in dashboard
```

---

## 🛡️ Security

✅ **Customer Data:**
- Customers see only their own bookings
- Customer IDs from localStorage

✅ **Admin Data:**
- Admins can see all bookings
- Restricted to admin role

✅ **RLS Policies:**
- Applied at database level
- Enforced in backend queries

---

## 📊 Status Types

### Wash Status Values
```
"not_started"   → No wash record created
"pending"       → Wash in progress
"washed"        → Completed
"cancelled"     → Cancelled
```

### Color Coding
```
🟡 Yellow → Pending (Not Started/In Progress)
🟢 Green  → Completed
🔴 Red    → Cancelled
⚫ Gray   → Not Started
```

---

## 💾 Data Mapping

### Booking to Wash Matching

The system matches bookings to washes using:
1. **Car Number** - Primary match
   - `booking.car_name` ↔ `wash.car_number`

2. **Customer ID** - Secondary match
   - `booking.customer_id` ↔ `wash.car_owner_name`

If either matches, the booking is linked to the wash.

---

## 🐛 Troubleshooting

### Issue: Wash status shows "Not Started"

**Cause:** No wash record exists for the booking

**Solutions:**
1. Employee needs to create wash record in Car Wash Tracking
2. Or use endpoint: `POST /bookings/booking/:bookingId/create-wash`

### Issue: Customer not seeing bookings

**Cause:** Customer ID not in localStorage

**Check:**
```javascript
localStorage.getItem('userId')
```

Should return valid UUID

### Issue: Admin dashboard empty

**Cause:** No bookings in database or API error

**Check:**
1. Verify bookings exist in database
2. Check browser console for errors
3. Verify API endpoint is working

### Issue: Wash details not showing

**Cause:** Wash record exists but not linked properly

**Fix:**
1. Ensure car number format matches
2. Check car_owner_name in wash record
3. Manually create wash if needed

---

## 🚀 Enhancement Ideas

- [ ] Real-time notifications for status changes
- [ ] SMS/Email alerts to customers
- [ ] Wash timeline with photos
- [ ] Customer feedback/ratings
- [ ] Schedule optimization
- [ ] Employee productivity metrics
- [ ] Revenue tracking
- [ ] Automated reminders

---

## 📈 Usage Statistics

**API Response Includes:**
- Total bookings
- Total washes completed
- Completion rate percentage
- Pending washes
- Cancelled records
- Bookings not yet washed

---

## ✅ Checklist

- [ ] Backend route integrated in server.js
- [ ] Customer route added to App.jsx
- [ ] Admin route added to App.jsx
- [ ] Navigation links added
- [ ] API endpoints working
- [ ] Customer view displays correctly
- [ ] Admin dashboard shows stats
- [ ] Filters work properly
- [ ] Booking-wash linking works
- [ ] Tested end-to-end

---

## 📞 Support

### Quick Fixes

**"API not found" error:**
- Check import in server.js
- Verify route path is correct
- Restart backend

**"No bookings showing" error:**
- Verify customer ID in localStorage
- Check API endpoint with Postman
- Look for console errors

**"Wash status not updating" error:**
- Employee needs to update status in Car Wash Tracking
- Booking and wash need to be linked (car number match)
- Refresh page to see updates

---

## 🎯 Next Steps

1. **Deploy:**
   - Test all endpoints with Postman
   - Verify in production environment

2. **Monitor:**
   - Check API response times
   - Monitor error logs

3. **Enhance:**
   - Add email notifications
   - Add SMS alerts
   - Add wash timeline photos

---

**Version:** 1.0  
**Created:** December 2024  
**Status:** ✅ Ready for Integration
