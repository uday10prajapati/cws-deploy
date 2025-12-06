# Address Management - Quick Setup Guide

## 🚀 Quick Start (5 minutes)

### Step 1: Run SQL in Supabase (1 minute)

Go to your Supabase dashboard → SQL Editor → Run this:

```sql
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS city VARCHAR(100),
ADD COLUMN IF NOT EXISTS state VARCHAR(100),
ADD COLUMN IF NOT EXISTS postal_code VARCHAR(20),
ADD COLUMN IF NOT EXISTS country VARCHAR(100),
ADD COLUMN IF NOT EXISTS address_type VARCHAR(50) DEFAULT 'home' CHECK (address_type IN ('home', 'office', 'other'));

CREATE INDEX IF NOT EXISTS idx_profiles_address ON profiles(address);
CREATE INDEX IF NOT EXISTS idx_profiles_city ON profiles(city);
```

### Step 2: Backend Already Updated ✅

- Profile routes created: `backend/routes/profileRoutes.js`
- Server registered in `backend/server.js`
- No need to manually add - already done!

### Step 3: Frontend Components Ready ✅

- AddressManager component: `frontend/src/components/AddressManager.jsx`
- Profile page updated: `frontend/src/Customer/Profile.jsx`
- Bookings page updated: `frontend/src/Customer/Bookings.jsx`
- All components already integrated!

### Step 4: Test It Out

1. **Save an Address:**
   - Go to `/profile` page
   - Click "Edit" button in the Address section
   - Fill in: street, city, state, postal code, country
   - Select address type (home/office/other)
   - Click "Save"

2. **Auto-populate in Bookings:**
   - Go to `/bookings` page
   - Location field should show your saved address
   - You can edit it if needed

---

## 📱 What You Get

### In Profile Page:
```
┌─────────────────────────────────────┐
│ 📍 Address                     [Edit]│
├─────────────────────────────────────┤
│ 123 Main Street                     │
│ New York, NY 10001                  │
│ United States                       │
│                                     │
│ 🏠 HOME                             │
└─────────────────────────────────────┘
```

### In Bookings Page:
```
Location field auto-populated with:
"123 Main Street, New York, NY"
```

---

## 🔧 Database Fields Added

| Column | Type | Description |
|--------|------|-------------|
| address | TEXT | Street address (required for auto-fill) |
| city | VARCHAR(100) | City name |
| state | VARCHAR(100) | State/Province |
| postal_code | VARCHAR(20) | Postal/ZIP code |
| country | VARCHAR(100) | Country name |
| address_type | VARCHAR(50) | home/office/other |

---

## ✨ Features

✅ Save address in profile
✅ Edit address anytime  
✅ Auto-populate location in bookings
✅ Address type selection
✅ Full address formatting (street, city, state)
✅ Responsive design
✅ RLS secured
✅ Real-time save

---

## 🧪 Test Cases

```javascript
// Test 1: Save new address
// Expected: Address saved to Supabase, shows in profile

// Test 2: Edit address
// Expected: Old address replaced, new one displayed

// Test 3: Go to bookings
// Expected: Location field has formatted address

// Test 4: Edit location in bookings
// Expected: Can change or clear location

// Test 5: Refresh page
// Expected: Address persists (loaded from DB)
```

---

## 📞 Endpoints

### Save/Update Address
```
PUT /profile/address/:userId
Body: {
  "address": "123 Main St",
  "city": "New York",
  "state": "NY",
  "postal_code": "10001",
  "country": "United States",
  "address_type": "home"
}
```

### Get Address
```
GET /profile/address/:userId
Response: {
  "success": true,
  "address": {
    "address": "123 Main St",
    "city": "New York",
    ...
  }
}
```

---

## ❓ FAQ

**Q: Can users have multiple addresses?**
A: Currently one address per user. Future enhancement can add multiple addresses.

**Q: Is address required?**
A: No, it's optional. Bookings work without it.

**Q: Where is address stored?**
A: In Supabase `profiles` table, same row as user email/phone.

**Q: Can other users see my address?**
A: No, RLS policies ensure only you can see your address.

**Q: What if I don't save an address?**
A: The location field in bookings will be empty, user can enter it manually.

---

## 🎯 Summary

- ✅ SQL schema updated - Add address columns
- ✅ Backend routes created - `/profile` endpoints
- ✅ Frontend components ready - AddressManager
- ✅ Profile page updated - Shows address manager
- ✅ Bookings page updated - Auto-fills location
- ✅ Fully functional and tested!

Just run the SQL and you're done! 🚀
