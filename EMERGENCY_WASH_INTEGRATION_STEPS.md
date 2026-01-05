# Emergency Wash System Integration - Step by Step

## 🎯 What You Need to Do

This guide walks you through implementing all the emergency wash fixes to make the system work properly.

---

## ✅ Step 1: Database Schema Update

### Action: Run SQL Migration
1. Open Supabase Dashboard → SQL Editor
2. Copy and run the SQL from: `backend/migrations/add_taluko_area_to_emergency_wash_requests.sql`

### What It Does:
- Adds `taluko`, `area`, `customer_name`, `customer_phone` to emergency_wash_requests table
- Creates indexes for fast searching
- Adds Row Level Security policies

### Verification:
```sql
-- Run this to verify:
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'emergency_wash_requests';
```

You should see the new columns listed.

---

## ✅ Step 2: Backend Updates

### Action: Update washerLocationRoutes.js
The file at `backend/routes/washerLocationRoutes.js` has been updated with:

1. **Fixed Endpoint Bug:**
   - Changed `/washers/match-customer-city/:customerCity` to use `req.params` instead of `req.query`
   - Added search by taluko, city, AND area (not just area)
   - Returns taluko in washer data

2. **New Endpoints Added:**
   - `GET /washers/emergency-requests/:taluko` - Get requests by taluko
   - `GET /washers/emergency-requests-by-status/:status` - Get requests by status

### Action: Restart Backend
```bash
cd backend
npm restart
# or
node server.js
```

### Verification:
Test the endpoints:
```bash
# Should return washers from that city/taluko
curl http://localhost:5000/washers/match-customer-city/Ahmedabad

# Should return requests from that taluko  
curl http://localhost:5000/washers/emergency-requests/Ahmedabad
```

---

## ✅ Step 3: Frontend Updates

### Update 1: Customer Emergency Wash Request Form
**File:** `frontend/src/Customer/EmergencyWashRequest.jsx`

Changes made:
- Added fields to formData: `taluko`, `area`, `customer_name`, `customer_phone`
- In fetchUserData: Now fetches user profile to get these fields
- In handleSubmit: Now includes these fields when creating request

**Why:** Customer taluko is captured from their profile and sent with the request, allowing the system to route it to the right HR/area.

### Update 2: Admin Emergency Wash Management  
**File:** `frontend/src/Admin/AdminEmergencyWashManagement.jsx`

Changes made:
- Updated `fetchWashersByCity()` → `fetchWashersByTaluko()` with proper API call
- Request cards now show: `<Customer Name> | Taluko: <Taluko>`
- Detail modal shows full customer info section with taluko
- Assignment modal shows washer taluko and area
- Filtering works properly by taluko/city/state

**Why:** Admin can now see customer taluko, find washers by taluko, and assign them properly.

### Update 3: New HR/Sub-Admin Component (NEW)
**File:** `frontend/src/Admin/HREmergencyWashRequests.jsx`

What it does:
- HR/Sub-admin logs in and sees requests only for their assigned taluko
- Can view detailed request information
- Can update status (Pending → In Progress → Completed)
- Can search requests by customer name, plate, address

**Why:** HR and sub-admin staff can now see emergency wash requests in their area without seeing requests from other areas.

### Action: Deploy Frontend
```bash
cd frontend
npm run build
# Deploy to your hosting
```

---

## 🧪 Step 4: Testing - Complete Flow

### Test Scenario
```
Setup: 
- Create HR User with taluko = "Pune"
- Create Washer User with taluko = "Pune"  
- Create Customer with taluko = "Pune"

Test Steps:
```

**Step 4a: Customer Creates Request**
1. Login as Customer (taluko = "Pune")
2. Go to Emergency Wash Request page
3. Fill form and submit
4. ✅ Verify: Request created with taluko = "Pune" auto-filled

**Step 4b: HR Views Request**
1. Login as HR (taluko = "Pune")
2. Go to HR Emergency Wash Dashboard
3. ✅ Verify: Request appears in the list
4. ✅ Verify: Shows customer name and taluko

**Step 4c: Admin Views & Assigns**
1. Login as Admin
2. Go to Admin Emergency Wash Management
3. Search for the request
4. ✅ Verify: Request shows with customer name and taluko
5. Click "Assign to Washer"
6. ✅ Verify: Modal shows available washers from Pune
7. ✅ Verify: Washer info includes taluko and area
8. Click assign
9. ✅ Verify: Request status changes to "Assigned"

**Step 4d: Washer Completes Request**
1. Login as Washer
2. Go to Emergency Wash Requests
3. ✅ Verify: Request appears (assigned to them)
4. Update status and upload photos
5. ✅ Verify: Request shows as "Completed"

---

## 🔍 Step 5: Verify Everything Works

### Database Check
```sql
-- Check if fields exist and have data
SELECT id, customer_name, customer_taluko, taluko, status 
FROM emergency_wash_requests 
LIMIT 5;

-- Should return records with taluko filled in
```

### Admin Dashboard Check
- [ ] Can see emergency wash requests
- [ ] Requests show customer name and taluko
- [ ] Can filter by taluko
- [ ] Can open request details
- [ ] Can click "Assign to Washer"

### Washer Matching Check
- [ ] Modal shows "No washers available" if none exist
- [ ] Modal shows available washers with their taluko
- [ ] Can click assign to select washer
- [ ] Washer receives notification

### HR Dashboard Check  
- [ ] HR sees only requests from their taluko
- [ ] Can update request status
- [ ] Can see customer details
- [ ] Can search requests

---

## 🐛 Troubleshooting

### Problem: "No washers available"
**Solution:** 
1. Check washer profile - must have taluko field filled
2. Check customer taluko matches washer taluko
3. Verify washer account_status is true

### Problem: HR not seeing requests
**Solution:**
1. Check HR profile has taluko field set
2. Verify customer taluko matches HR taluko exactly
3. Check request was saved with taluko field

### Problem: Admin dashboard shows error
**Solution:**
1. Check browser console for error message
2. Verify backend server is running
3. Check database migration was applied
4. Clear browser cache and refresh

### Problem: Request not saving  
**Solution:**
1. Check all form fields have values
2. Open browser console to see error
3. Check backend API is responding
4. Verify database connection

---

## 📋 Implementation Checklist

After completing all steps, verify:

- [ ] Database migration applied successfully
- [ ] Backend server running without errors
- [ ] Frontend components deployed
- [ ] Customer can create request
- [ ] Customer profile has taluko field
- [ ] Washer profile has taluko field
- [ ] HR profile has taluko field
- [ ] Request shows with taluko in database
- [ ] HR can see requests for their taluko
- [ ] Admin can see customer info
- [ ] Admin can fetch available washers
- [ ] Admin can assign washer
- [ ] Washer receives notification
- [ ] Status updates work

---

## 📞 Need Help?

Check these files for details:
- **Implementation guide:** EMERGENCY_WASH_FIX_IMPLEMENTATION.md
- **Quick reference:** EMERGENCY_WASH_QUICK_FIX.md
- **Code changes:** See individual file changes documented below

## Files Changed

### Backend
- `routes/washerLocationRoutes.js` - Fixed washer matching, added new endpoints
- `migrations/add_taluko_area_to_emergency_wash_requests.sql` - Database schema

### Frontend  
- `Customer/EmergencyWashRequest.jsx` - Capture taluko and customer info
- `Admin/AdminEmergencyWashManagement.jsx` - Updated for taluko-based filtering
- `Admin/HREmergencyWashRequests.jsx` - NEW: HR dashboard

---

**Status:** Ready for implementation  
**Difficulty:** Medium (Requires DB migration + Backend restart + Frontend deploy)  
**Time Estimate:** 30-45 minutes including testing
