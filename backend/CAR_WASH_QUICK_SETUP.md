# Car Wash Tracking - Quick Setup Guide

## ⚡ 3-Step Setup

### Step 1️⃣: Create Database Table

**Go to Supabase Dashboard:**
1. Open SQL Editor
2. Click "New Query"
3. Copy & paste from `CAR_WASH_TRACKING_SCHEMA.sql`
4. Click "Run" ✅

**Table created with:**
- ✅ car_wash_tracking table
- ✅ 3 auto-generated views
- ✅ Indexes for performance
- ✅ RLS policies for security

---

### Step 2️⃣: Integrate Backend

**In `backend/server.js` or your main server file:**

```javascript
import carWashRoutes from "./routes/carWash.js";

// Add this line with other route imports
app.use("/car-wash", carWashRoutes);
```

**No additional dependencies needed!** Uses existing:
- ✅ Express
- ✅ Supabase
- ✅ Node.js

---

### Step 3️⃣: Integrate Frontend

**In `frontend/src/App.jsx`:**

```javascript
import CarWash from "./page/CarWash.jsx";

// Add to Routes
<Route path="/car-wash" element={<CarWash />} />
```

**Or add to Employee Dashboard nav:**
```jsx
<Link to="/car-wash">Car Wash Tracking</Link>
```

---

## ✨ Features Overview

### 📊 Statistics Dashboard
```
┌─────────────────────────────────────┐
│ Today Total    │ Today Completed    │
│     5 cars     │     3 completed    │
├─────────────────────────────────────┤
│ This Month     │ Month Completed    │
│    45 cars     │    42 completed    │
└─────────────────────────────────────┘
```

### 🚗 Car Wash Records

**Add New Wash:**
- Car Owner Name
- Car Number (e.g., GJ01AB1234)
- Car Model
- Car Color
- Notes

**Track Status:**
- 🟡 Pending - Not started
- 🟢 Completed - Finished
- 🔴 Cancelled - Not done

### 📅 View Options

**Today's Washes:**
- All washes added today
- Quick status updates
- Real-time stats

**Monthly Summary:**
- Select any month/year
- Day-wise breakdown
- Full month statistics

### 🔍 Filters

Filter by status:
- All records
- Pending only
- Completed only
- Cancelled only

---

## 🧪 Quick Test

### Test Scenario:

1. **Navigate to Car Wash** → `/car-wash`
2. **Add a wash:**
   - Owner: "Raj Patel"
   - Number: "GJ01AB1234"
   - Model: "Maruti Swift"
   - Color: "White"
   - Click "Add Wash"

3. **Check Stats:**
   - "Today Total" shows 1 ✅
   - "Today Completed" shows 0 ✅

4. **Change Status:**
   - Click dropdown on the new record
   - Select "Completed"
   - Stats update automatically ✅

5. **View Monthly:**
   - Switch to "Monthly Summary"
   - See all this month's washes
   - Statistics updated ✅

---

## 📱 API Quick Reference

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/car-wash/add-wash` | Add new wash |
| PUT | `/car-wash/update-status/:id` | Update status |
| GET | `/car-wash/today/:employeeId` | Today's washes |
| GET | `/car-wash/monthly/:employeeId` | Monthly washes |
| GET | `/car-wash/stats/:employeeId` | Dashboard stats |
| GET | `/car-wash/all/:employeeId` | All washes |
| DELETE | `/car-wash/delete/:id` | Delete record |

---

## 🔒 Security

✅ **Row Level Security (RLS)**
- Employees see only their own washes
- Admins can see all washes

✅ **Data Validation**
- Car number format checked
- Status must be valid
- Required fields enforced

✅ **Timestamps**
- Auto-tracked creation time
- Auto-tracked completion time
- No manual time editing

---

## 🐛 Common Issues

### Issue: "localStorage.getItem('userId') is null"
**Fix:** Make sure user is logged in and `userId` is stored in localStorage

### Issue: Can't see the route
**Fix:** Check if route is added to `App.jsx`

### Issue: Table not found in database
**Fix:** Run the SQL schema in Supabase SQL Editor

### Issue: Stats showing 0
**Fix:** 
1. Add a new wash record
2. Refresh the page
3. Check browser console for errors

---

## 📊 Data Examples

### Adding a Wash
```json
{
  "employeeId": "uuid",
  "carOwnerName": "John Doe",
  "carModel": "Honda City",
  "carNumber": "GJ01AB1234",
  "carColor": "Silver",
  "notes": "Full wash requested"
}
```

### Response
```json
{
  "success": true,
  "message": "Car wash record added",
  "data": {
    "id": "uuid",
    "employee_id": "uuid",
    "car_number": "GJ01AB1234",
    "status": "pending",
    "created_at": "2024-12-06T10:30:00Z"
  }
}
```

---

## 📈 Monthly Breakdown Example

```
December 2024:
├─ Total Washes: 45
├─ Completed: 42
├─ Pending: 2
├─ Cancelled: 1
│
├─ December 1: 5 total (4 completed, 1 cancelled)
├─ December 2: 6 total (6 completed, 0 pending)
├─ December 3: 4 total (3 completed, 1 pending)
└─ ... (continues through month)
```

---

## ✅ Checklist

- [ ] Database schema created in Supabase
- [ ] Backend route imported in server.js
- [ ] Frontend route added to App.jsx
- [ ] userId stored in localStorage
- [ ] Tested adding a new wash
- [ ] Tested changing status
- [ ] Tested daily view
- [ ] Tested monthly view
- [ ] Tested filters

---

## 🎯 Next Steps

1. **Deploy:**
   - Push to production
   - Test end-to-end

2. **Monitor:**
   - Check error logs
   - Track usage

3. **Enhance:**
   - Add export features
   - Add performance insights
   - Add team analytics

---

## 📞 Support Resources

| Issue | Resource |
|-------|----------|
| API not working | Check `backend/routes/carWash.js` |
| UI not displaying | Check `frontend/src/page/CarWash.jsx` |
| Database error | Check `CAR_WASH_TRACKING_SCHEMA.sql` |
| Stats wrong | Check browser console |
| Employee ID missing | Check localStorage |

---

**Ready to go!** 🚀

Navigate to `/car-wash` and start tracking washes!
