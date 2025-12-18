# 🚀 Quick Fix Reference

## Problems & Solutions

### Problem 1: Cars REST API 400 Error
**Files Fixed**: 7 frontend components
```
❌ BEFORE: .from("cars").select("*").eq("customer_id", userId)
✅ AFTER: fetch(`http://localhost:5000/cars/${userId}`)
```

**Files Changed**:
- frontend/src/Customer/CustomerDashboard.jsx
- frontend/src/Customer/Bookings.jsx
- frontend/src/Customer/MonthlyPass.jsx
- frontend/src/Customer/Profile.jsx
- frontend/src/Customer/WashHistory.jsx
- frontend/src/Customer/EmergencyWashRequest.jsx
- frontend/src/components/QRCodeManager.jsx

### Problem 2: Loyalty History 400 Error
**File Fixed**: backend/routes/customerLoyaltyRoutes.js
```
❌ BEFORE: No parameter validation
✅ AFTER: Validate customer_id and days before query
```

---

## Test Commands

```bash
# Test cars API
curl http://localhost:5000/cars/9f6c74f6-f581-475a-aa6f-22c7df0363ad

# Test loyalty history
curl "http://localhost:5000/customer-loyalty/history/9f6c74f6-f581-475a-aa6f-22c7df0363ad?days=90"
```

---

## What Changed

### Frontend - Direct DB → Backend API
```javascript
// ❌ Old (Direct Supabase - FAILS)
const { data } = await supabase.from("cars")...

// ✅ New (Backend API - WORKS)
const response = await fetch("http://localhost:5000/cars/...")
const { data } = await response.json()
```

### Backend - No Validation → With Validation
```javascript
// ❌ Old (No validation - causes Supabase errors)
const { days = 90 } = req.query

// ✅ New (With validation - catches bad data)
const daysNum = parseInt(days)
if (isNaN(daysNum) || daysNum < 0) {
  return res.status(400).json({ error: "Invalid days" })
}
```

---

## Status: ✅ COMPLETE

All 400 errors fixed and tested!
