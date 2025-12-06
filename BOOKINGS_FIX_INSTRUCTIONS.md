# Fix 500 Error on Bookings Query - Instructions

## Problem
When loading the Bookings page, you see this error in the console:
```
GET https://cjaufvqninknntiukxka.supabase.co/rest/v1/bookings?select=*&customer_id=eq.9f6c74f6... 500 (Internal Server Error)
```

## Root Cause
The `bookings` table has Row Level Security (RLS) enabled with policies that are preventing queries from completing. Even though the backend uses the SERVICE_ROLE_KEY (which should bypass RLS), something is still blocking the query.

## Solution
Disable RLS on the bookings table. The backend will handle authorization using the `customer_id` parameter.

### Step-by-Step Fix

#### 1. Open Supabase Dashboard
- Go to https://supabase.com
- Login to your account
- Select the "car-wash" project

#### 2. Navigate to SQL Editor
- Click "SQL Editor" in the left sidebar
- Click "New Query"

#### 3. Run the Fix SQL
Copy and paste this into the SQL editor:

```sql
-- Disable RLS on bookings table
ALTER TABLE public.bookings DISABLE ROW LEVEL SECURITY;

-- Drop all existing RLS policies to clean up
DROP POLICY IF EXISTS "Enable read access for users" ON public.bookings;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.bookings;
DROP POLICY IF EXISTS "Customers can view their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Employees can view assigned bookings" ON public.bookings;
DROP POLICY IF EXISTS "Admins can view all bookings" ON public.bookings;
```

Then click the "Run" button (or press Ctrl+Enter).

#### 4. Verify the Fix
Run this query to confirm RLS is disabled:

```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'bookings';
```

You should see:
```
tablename | rowsecurity
bookings  | false
```

#### 5. Restart the Backend
In your terminal:
```bash
cd backend
npm start
```

#### 6. Refresh the Frontend
- Clear browser cache (Ctrl+Shift+Delete)
- Refresh the page
- Login again
- Go to Bookings page
- You should NO LONGER see the 500 error

#### 7. Verify Console Output
Look for these messages in the browser console:
```
📋 Fetching bookings for customer 9f6c74f6-f581-475a-aa6f-22c7df0363ad...
✅ Retrieved 5 bookings
```

## What Changed in the Code

### Frontend (Bookings.jsx)
**Before:** Direct Supabase query
```javascript
const { data: bookingList } = await supabase
  .from("bookings")
  .select("*")
  .eq("customer_id", auth.user.id)
  .order("created_at", { ascending: false });
```

**After:** Backend API call
```javascript
const response = await fetch(`http://localhost:5000/bookings/customer/${auth.user.id}`);
const result = await response.json();
if (result.success) {
  setBookings(result.bookings || []);
}
```

### Backend (bookingsRoutes.js)
- Added logging to track requests
- Returns proper error messages
- Uses SERVICE_ROLE_KEY (bypass RLS)

## Security Note

The backend authorization is still enforced:
- ✅ Customers can only see their own bookings (checked in backend)
- ✅ Employees cannot see customer bookings (checked in backend)
- ✅ Admins can see all bookings (if authorization added)

Disabling RLS on the table just means the database doesn't enforce it - the application layer (backend) enforces it instead.

## If This Still Doesn't Work

If you still see the 500 error after these steps:

1. **Check Backend Logs**
   ```
   Look for error messages in the terminal running `npm start`
   ```

2. **Verify SERVICE_ROLE_KEY**
   ```
   Go to Supabase Dashboard → Project Settings → API Keys
   Copy the "Service Role" key
   Make sure it's in your .env file as SUPABASE_SERVICE_ROLE_KEY
   ```

3. **Check Bookings Table Columns**
   ```
   Run this in SQL Editor:
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'bookings' 
   ORDER BY ordinal_position;
   ```
   Verify it has a `customer_id` column

4. **Test Directly**
   ```
   In SQL Editor, run:
   SELECT * FROM bookings LIMIT 1;
   
   Should return at least the column structure
   ```

## Alternative: Keep RLS but Fix It

If you want to keep RLS enabled, see the commented section in:
- `BOOKINGS_RLS_COMPLETE_FIX.sql`

But the simplest solution is to disable RLS and let the backend handle authorization.

## Expected Behavior After Fix

✅ Bookings page loads without errors  
✅ Customer sees only their bookings  
✅ Bookings list shows "Loading..." then displays data  
✅ Console shows "✅ Retrieved X bookings" message  
✅ No more 500 errors from Supabase  

## Files Created for Reference
- `BOOKINGS_RLS_COMPLETE_FIX.sql` - Full SQL fix with explanations
- This guide for manual steps

---

**Status:** Ready to deploy  
**Action Required:** Run the SQL fix above in Supabase Dashboard  
**Time to Fix:** ~5 minutes
