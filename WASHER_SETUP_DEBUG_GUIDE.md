# Emergency Wash - No Washers Found - Debugging Guide

## Problem
```
🔍 Searching for washers matching: "Ankleshwar"
✅ Found 0 washers for "Ankleshwar"
⚠️ No washers found. Available washers in system: []
```

**Root Cause:** There are **NO WASHERS** in the profiles table with:
- `employee_type = 'washer'`
- `account_status = true`
- `taluko = 'Ankleshwar'` (or matching the search)

## Solution

### Step 1: Check What's in the Database

Open Supabase SQL Editor and run:

```sql
-- Check if ANY washers exist
SELECT COUNT(*) as total_washers FROM profiles 
WHERE employee_type = 'washer';

-- Check active washers
SELECT COUNT(*) as active_washers FROM profiles 
WHERE employee_type = 'washer' AND account_status = true;

-- List all washers with their details
SELECT id, name, phone, taluko, area, city, employee_type, account_status 
FROM profiles 
WHERE employee_type = 'washer';

-- Check what talukas have customers
SELECT DISTINCT taluko FROM emergency_wash_requests WHERE taluko IS NOT NULL;
```

### Step 2: Create Test Washers

If there are no washers, you need to create them.

**Option A: Using SQL Script**
1. Open file: `backend/create_test_washers.sql`
2. Copy the SQL and run in Supabase SQL Editor
3. This will create 3 test washers for "Ankleshwar" taluko

**Option B: Manually Add Washers**

Run this SQL:
```sql
INSERT INTO profiles (
  id,
  email,
  name,
  phone,
  address,
  area,
  city,
  taluko,
  state,
  employee_type,
  account_status
) VALUES (
  gen_random_uuid(),
  'washer1@test.com',
  'Test Washer 1',
  '9999999999',
  'Test Address',
  'Ankleshwar',
  'Ankleshwar',
  'Ankleshwar',
  'Gujarat',
  'washer',
  true
);
```

**Important Fields:**
- `employee_type` = **'washer'** (exact match)
- `account_status` = **true** (not false or null)
- `taluko` = **'Ankleshwar'** (or match customer's taluko)

### Step 3: Verify Washers Were Created

```sql
SELECT * FROM profiles 
WHERE employee_type = 'washer' AND account_status = true;
```

You should see the washers you created.

### Step 4: Test the Assignment

1. Refresh the admin dashboard
2. Click "Assign to Washer" on a request with taluko "Ankleshwar"
3. Backend logs should now show:
   ```
   🔍 Searching for washers matching: "Ankleshwar"
   ✅ Found 3 washers for "Ankleshwar"
   ```
4. Modal should show available washers

## Troubleshooting

### Still No Washers Found?

**Check 1: Is employee_type exactly "washer"?**
```sql
SELECT DISTINCT employee_type FROM profiles LIMIT 10;
-- Should see 'washer' in results
```

**Check 2: Is account_status true?**
```sql
SELECT * FROM profiles 
WHERE name LIKE '%washer%' 
AND employee_type = 'washer';
-- Check account_status column - should be true
```

**Check 3: Does taluko match?**
```sql
-- Customer taluko
SELECT DISTINCT taluko FROM emergency_wash_requests;

-- Washer talukas
SELECT DISTINCT taluko FROM profiles WHERE employee_type = 'washer';

-- These should have values that match or overlap
```

**Check 4: Are the fields NULL?**
```sql
SELECT * FROM profiles 
WHERE employee_type = 'washer' 
AND (taluko IS NULL OR area IS NULL OR city IS NULL);
-- If results show, update them with values
```

### Update Existing Washers

If washers exist but don't have taluko set:

```sql
UPDATE profiles 
SET taluko = 'Ankleshwar', area = 'Ankleshwar'
WHERE employee_type = 'washer' 
AND (taluko IS NULL OR taluko = '');
```

## Complete Workflow to Test

1. **Create customer with taluko**
   ```sql
   INSERT INTO profiles (id, name, taluko, employee_type) 
   VALUES (gen_random_uuid(), 'Test Customer', 'Ankleshwar', 'customer');
   ```

2. **Create washer with matching taluko**
   ```sql
   INSERT INTO profiles (id, name, taluko, employee_type, account_status) 
   VALUES (gen_random_uuid(), 'Test Washer', 'Ankleshwar', 'washer', true);
   ```

3. **Create emergency wash request**
   - Customer creates request through app
   - System auto-fills taluko from customer profile

4. **Admin assigns washer**
   - Admin opens dashboard → sees request with taluko "Ankleshwar"
   - Admin clicks "Assign to Washer"
   - System finds washers with taluko "Ankleshwar"
   - Modal shows available washers
   - Admin selects washer

## Expected Results

After fixing:
```
🔍 Searching for washers matching: "Ankleshwar"
✅ Found 3 washers for "Ankleshwar"
```

Modal will show:
- Raj Washer
- Vikram Washer  
- Priya Washer

## Key Points

✅ **Washers must have:**
- `employee_type = 'washer'`
- `account_status = true`
- `taluko` field filled in
- `phone` field filled in

✅ **Requests must have:**
- `taluko` captured from customer profile
- `customer_name` and `customer_phone` saved

✅ **System will match:**
- Customer taluko → Washer taluko/area/city
- Case-insensitive search
- Partial matching supported

## Example Complete Data

```sql
-- Customer
INSERT INTO profiles VALUES (
  gen_random_uuid(),
  'customer@test.com',
  'Test Customer',
  '8888888888',
  'Customer Address',
  'Ankleshwar',
  'Ankleshwar',
  'Ankleshwar',
  'Gujarat',
  'customer',
  true,
  NOW()
);

-- Washer
INSERT INTO profiles VALUES (
  gen_random_uuid(),
  'washer@test.com',
  'Test Washer',
  '9999999999',
  'Washer Address',
  'Ankleshwar',
  'Ankleshwar',
  'Ankleshwar',
  'Gujarat',
  'washer',
  true,
  NOW()
);
```

---

**Status:** When washers are created, the system will automatically find and assign them to requests!
