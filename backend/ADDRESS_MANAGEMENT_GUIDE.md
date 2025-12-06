# Address Management Feature Documentation

## 📋 Overview

This feature allows customers to:
- ✅ Save their address in their profile
- ✅ Edit and update their address anytime
- ✅ Auto-populate address in booking forms
- ✅ Display address with city, state, postal code, and country

---

## 🗄️ Database Schema

### Add Address Columns to Profiles Table

Run this SQL in your Supabase SQL Editor:

```sql
-- Add Address Fields to Profiles Table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS city VARCHAR(100),
ADD COLUMN IF NOT EXISTS state VARCHAR(100),
ADD COLUMN IF NOT EXISTS postal_code VARCHAR(20),
ADD COLUMN IF NOT EXISTS country VARCHAR(100),
ADD COLUMN IF NOT EXISTS address_type VARCHAR(50) DEFAULT 'home' CHECK (address_type IN ('home', 'office', 'other'));

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_address ON profiles(address);
CREATE INDEX IF NOT EXISTS idx_profiles_city ON profiles(city);
```

---

## 🛠️ Backend Implementation

### Profile Routes (`backend/routes/profileRoutes.js`)

Three main endpoints have been created:

#### 1. Get Profile with Address
```
GET /profile/profile/:userId
```
Returns complete user profile including address details.

#### 2. Update Address
```
PUT /profile/address/:userId
```
Updates user's address information.

**Request Body:**
```json
{
  "address": "123 Main Street, Apartment 4B",
  "city": "New York",
  "state": "NY",
  "postal_code": "10001",
  "country": "United States",
  "address_type": "home"
}
```

#### 3. Get Address Only
```
GET /profile/address/:userId
```
Returns only the address fields without full profile data.

### Server Registration

The profile routes are registered in `backend/server.js`:

```javascript
import profileRoutes from "./routes/profileRoutes.js";

// Add this line with other route registrations
app.use("/profile", profileRoutes);
```

---

## 🎨 Frontend Components

### AddressManager Component

**Location:** `frontend/src/components/AddressManager.jsx`

A reusable component that handles:
- Displaying saved address
- Edit mode with form fields
- Auto-save to Supabase
- Supports address types: home, office, other

**Props:**
- `userId` (UUID) - The user's ID from Supabase

**Usage Example:**
```jsx
import AddressManager from "../components/AddressManager";

export default function MyProfile() {
  return <AddressManager userId={user.id} />;
}
```

### Features:
- 📍 Visual MapPin icon in the header
- ✏️ Edit button to switch to edit mode
- 💾 Save button with loading state
- ❌ Cancel button to discard changes
- 🏠 Address type selector (home/office/other)
- 📱 Responsive design
- ⚡ Real-time save to Supabase

---

## 📱 Updated Pages

### 1. Profile Page (`frontend/src/Customer/Profile.jsx`)

**Changes:**
- Added `AddressManager` import
- Added `<AddressManager userId={user.id} />` component
- Positioned after the profile header section
- Full integration with existing profile layout

**How it works:**
```jsx
import AddressManager from "../components/AddressManager";

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  
  return (
    <div className="profile-container">
      {/* Profile Header */}
      <div className="profile-header">
        {/* ... */}
      </div>

      {/* Address Manager */}
      <AddressManager userId={user.id} />
      
      {/* Other profile sections */}
    </div>
  );
}
```

### 2. Bookings Page (`frontend/src/Customer/Bookings.jsx`)

**Changes:**
- Added address loading in the main useEffect hook
- Auto-populates the location field with saved address
- Formats address as: "street, city, state"

**How it works:**
```jsx
// In useEffect when component loads:
const { data: profileData } = await supabase
  .from("profiles")
  .select("address, city, state, postal_code")
  .eq("id", auth.user.id)
  .single();

if (profileData?.address) {
  const formattedAddress = `${profileData.address}${profileData.city ? ', ' + profileData.city : ''}${profileData.state ? ', ' + profileData.state : ''}`;
  setLocation(formattedAddress);
}
```

---

## 🔄 User Flow

### Step 1: Save Address in Profile
1. User navigates to `/profile` page
2. Clicks "Edit" button in Address Manager
3. Fills in all address fields:
   - Street Address
   - City
   - State
   - Postal Code
   - Country
   - Address Type (dropdown)
4. Clicks "Save"
5. Address is saved to Supabase `profiles` table

### Step 2: Auto-populate in Bookings
1. User navigates to `/bookings` page
2. Saved address automatically appears in the "Location" field
3. User can edit or keep as-is
4. When creating a booking, the location is included

---

## 🔐 Security & Row Level Security (RLS)

The AddressManager component respects existing RLS policies:

**Current RLS on profiles table:**
```sql
-- Users can view their own profile
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (id = auth.uid());

-- Users can update their own profile
CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (id = auth.uid());
```

Users can only access and modify their own address data.

---

## 📊 Data Structure

### Profiles Table Extended Schema

```
profiles
├── id (UUID) - Primary Key
├── address (TEXT) - Street address
├── city (VARCHAR) - City name
├── state (VARCHAR) - State/Province
├── postal_code (VARCHAR) - Postal code
├── country (VARCHAR) - Country name
├── address_type (VARCHAR) - home/office/other
├── ... (other existing fields)
└── updated_at (TIMESTAMP) - Last update time
```

---

## 🧪 Testing Checklist

- [ ] Address Manager loads on Profile page
- [ ] Can add new address with all fields
- [ ] Can edit existing address
- [ ] Can cancel edit without saving
- [ ] Address saves to Supabase
- [ ] Address auto-populates in Bookings page
- [ ] Location field can still be edited in Bookings
- [ ] Works on mobile and desktop
- [ ] RLS policies enforced (can't access other users' addresses)
- [ ] Empty state shows "No address saved" message

---

## 🚀 Future Enhancements

1. **Multiple Addresses**
   - Allow users to save multiple addresses (home, office, parents house, etc.)
   - Add address selection dropdown in bookings

2. **Google Maps Integration**
   - Auto-complete address using Google Places API
   - Show address on map
   - Calculate delivery distance

3. **Address History**
   - Show recently used addresses
   - Quick-select from history

4. **Location Sharing**
   - Real-time location tracking for pickups
   - Driver navigation

---

## 🐛 Troubleshooting

### Address not appearing in Bookings
- Ensure address fields are populated in Profile page
- Check browser console for errors
- Verify Supabase connection is working

### Can't save address
- Check RLS policies on profiles table
- Verify user is authenticated
- Check browser console for error messages

### Address field showing empty
- User may not have saved an address yet
- Check Profile page and add address first

---

## 📞 API Reference

### Endpoints Summary

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/profile/profile/:userId` | Get full profile with address |
| PUT | `/profile/address/:userId` | Update user's address |
| GET | `/profile/address/:userId` | Get address only |

---

## 📝 Environment Variables

No additional environment variables needed. Uses existing:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- Backend running on configured `PORT`

---

## 🎯 Summary

This address management feature provides a seamless way for customers to:
1. Store their delivery address in their profile
2. Edit it anytime from the Profile page
3. Have it automatically available when creating bookings
4. Enhance their booking experience with pre-filled location data

All data is secure, respects RLS policies, and persists in Supabase.
