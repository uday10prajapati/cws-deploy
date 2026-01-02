# Salesperson Area Assignment - Quick Setup & Testing Guide

## Prerequisites

### Backend Requirements
- Node.js server running on `http://localhost:5000`
- Routes available:
  - `/customer/salespeople` - Get all salespeople
  - `/customer/salespeople/:id` - Get specific salesperson
  - `/employee/assigned-areas/:id` - Get assigned areas
  - `/employee/assign-areas` - Create area assignment
  - `/employee/assigned-areas/:id` (DELETE) - Remove area

### Database Requirements
- Supabase account with PostgreSQL database
- `profiles` table with columns:
  - `id` (UUID, primary key)
  - `email` (text)
  - `name` (text)
  - `phone` (text, optional)
  - `role` (text) - Must be 'employee'
  - `employee_type` (text) - Must be 'sales' or 'general'
  - `city` (text, optional)
  - `taluka` (text, optional)

- `employee_assigned_areas` table with columns:
  - `id` (UUID, primary key)
  - `employee_id` (UUID, FK to profiles.id)
  - `assigned_by` (UUID, FK to profiles.id)
  - `city` (text)
  - `talukas` (text) - Comma-separated list
  - `created_at` (timestamp, default: now())

## Database Setup

### Step 1: Create employee_assigned_areas Table

Run this SQL in Supabase Query Editor:

```sql
-- Create employee_assigned_areas table
CREATE TABLE IF NOT EXISTS public.employee_assigned_areas (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    employee_id uuid NOT NULL,
    assigned_by uuid,
    city character varying(100),
    talukas character varying(500),
    created_at timestamp without time zone DEFAULT now(),
    PRIMARY KEY (id),
    CONSTRAINT fk_employee FOREIGN KEY (employee_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
    CONSTRAINT fk_assigned_by FOREIGN KEY (assigned_by) REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Create indexes for performance
CREATE INDEX idx_areas_employee ON public.employee_assigned_areas USING btree (employee_id);
CREATE INDEX idx_areas_city ON public.employee_assigned_areas USING btree (city);
CREATE INDEX idx_areas_assigned_by ON public.employee_assigned_areas USING btree (assigned_by);

-- Enable RLS (Row Level Security)
ALTER TABLE public.employee_assigned_areas ENABLE ROW LEVEL SECURITY;

-- Optional: Create RLS policies
CREATE POLICY "Anyone can view employee areas" 
ON public.employee_assigned_areas FOR SELECT USING (true);

CREATE POLICY "Anyone can insert area assignments" 
ON public.employee_assigned_areas FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can delete area assignments" 
ON public.employee_assigned_areas FOR DELETE USING (true);
```

### Step 2: Verify profiles Table

Ensure `profiles` table has the `employee_type` column:

```sql
-- Check if column exists
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name = 'employee_type';

-- If not exists, add it
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS employee_type character varying(50) DEFAULT 'general';
```

### Step 3: Create Test Data

Add test salespeople to the profiles table:

```sql
-- Create test salespeople (with employee_type = 'sales')
INSERT INTO public.profiles (
    id, 
    email, 
    name, 
    phone, 
    role, 
    employee_type, 
    city, 
    taluka
) VALUES
(
    gen_random_uuid(),
    'salesperson1@example.com',
    'Rajesh Kumar',
    '9876543210',
    'employee',
    'sales',
    'Ahmedabad',
    'Ahmedabad'
),
(
    gen_random_uuid(),
    'salesperson2@example.com',
    'Priya Patel',
    '9876543211',
    'employee',
    'sales',
    'Surat',
    'Surat'
),
(
    gen_random_uuid(),
    'general_emp@example.com',
    'Vikram Singh',
    '9876543212',
    'employee',
    'general',
    'Vadodara',
    'Vadodara'
)
ON CONFLICT DO NOTHING;

-- Verify data was inserted
SELECT id, name, email, employee_type FROM profiles WHERE role = 'employee';
```

## Frontend Setup

### Step 1: Verify Imports

Check that [App.jsx](frontend/src/App.jsx) includes:

```jsx
import AllSalespeople from "./Employee/AllSalespeople.jsx";
import SalespersonDetails from "./Employee/SalespersonDetails.jsx";
```

### Step 2: Verify Routes

Check that [App.jsx](frontend/src/App.jsx) includes:

```jsx
<Route path="/employee/salespeople" element={<AllSalespeople />} />
<Route path="/employee/salesperson/:id" element={<SalespersonDetails />} />
```

### Step 3: Verify EmployeeSidebar

Check that [EmployeeSidebar.jsx](frontend/src/components/EmployeeSidebar.jsx) has:

```jsx
const salesMenu = [
  { label: "Sales Team", icon: <FiUsers />, link: "/employee/salespeople" },
  { label: "Assign Areas", icon: <FiMapPin />, link: "/employee/salespeople" },
];
```

### Step 4: Install Dependencies

If not already installed:

```bash
cd frontend
npm install react-icons
npm install react-router-dom
npm install @supabase/supabase-js
npm install tailwindcss
```

## Backend Setup

### Step 1: Verify Routes

Check [backend/routes/customerRoutes.js](backend/routes/customerRoutes.js):

```javascript
// Should have these routes:
router.get("/salespeople", ...);          // GET all salespeople
router.get("/salespeople/:id", ...);       // GET specific salesperson
router.put("/salespeople/:id", ...);       // UPDATE salesperson
```

### Step 2: Verify myJobs.js

Check [backend/routes/myJobs.js](backend/routes/myJobs.js):

```javascript
// Should have these routes:
router.get("/assigned-areas/:id", ...);    // GET assigned areas
router.post("/assign-areas", ...);         // CREATE area assignment
router.delete("/assigned-areas/:id", ...); // DELETE area assignment
```

### Step 3: Verify Server Registration

Check [backend/server.js](backend/server.js) includes:

```javascript
app.use("/customer", require("./routes/customerRoutes.js"));
app.use("/employee", require("./routes/myJobs.js"));
```

### Step 4: Install Dependencies

If not already installed:

```bash
cd backend
npm install express supabase-js cors dotenv
```

## Testing Procedure

### Test 1: View All Salespeople

1. **Open browser:** Navigate to `http://localhost:3000` (or your frontend URL)
2. **Login:** As an employee user
3. **Navigate:** Click on Employee Sidebar → Sales → "Sales Team"
4. **Expected:** AllSalespeople page loads showing:
   - List of all salespeople (employee_type='sales')
   - Search box for name/phone/email
   - City/Taluka filters
   - Card grid with salesperson information
   - "View & Assign Areas" button

### Test 2: Search Salespeople

1. **From AllSalespeople page**
2. **Type in search box:** Enter salesperson name (e.g., "Rajesh")
3. **Expected:** Grid filters to show matching salespeople

### Test 3: Filter by City/Taluka

1. **From AllSalespeople page**
2. **Select city:** Choose from dropdown (e.g., "Ahmedabad")
3. **Select taluka:** Select from the talukas for that city
4. **Expected:** Grid shows only salespeople matching filters

### Test 4: View Salesperson Details

1. **From AllSalespeople page**
2. **Click "View & Assign Areas"** on any salesperson card
3. **Expected:** SalespersonDetails page loads showing:
   - Salesperson name, phone, email, location
   - "Assigned Areas" section (empty if none)
   - "Add Area" button

### Test 5: Assign Area to Salesperson

1. **From SalespersonDetails page**
2. **Click "Add Area"** button
3. **Expected:** Modal opens with city/taluka selection
4. **Select city:** Choose from dropdown (e.g., "Ahmedabad")
5. **Expected:** Talukas for that city appear as checkboxes
6. **Select talukas:** Check one or more talukas
7. **Click "Assign"** button
8. **Expected:** 
   - Modal closes
   - Success message shown
   - Area appears in "Assigned Areas" section

### Test 6: Remove Area Assignment

1. **From SalespersonDetails page**
2. **In Assigned Areas section, click X** on any area card
3. **Confirm removal** when prompted
4. **Expected:**
   - Area is removed from the list
   - Success message shown
   - Database updated

### Test 7: Verify Data Persistence

1. **After adding area assignment**
2. **Refresh the page** (Ctrl+F5)
3. **Expected:** Area assignment still appears in the list

### Test 8: Error Handling - Non-Salesperson

1. **Try to add area to general employee:**
   - If you have a test user with `employee_type='general'`
   - Try to view their details
2. **Expected:** Either:
   - Page doesn't show them in salespeople list, OR
   - Error message when trying to assign area

## API Testing with cURL

### Get All Salespeople

```bash
curl -X GET http://localhost:5000/customer/salespeople \
  -H "Content-Type: application/json"
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-string",
      "email": "salesperson1@example.com",
      "name": "Rajesh Kumar",
      "phone": "9876543210",
      "employee_type": "sales",
      "city": "Ahmedabad",
      "taluka": "Ahmedabad"
    }
  ]
}
```

### Get Specific Salesperson

```bash
curl -X GET http://localhost:5000/customer/salespeople/[employee-id] \
  -H "Content-Type: application/json"
```

### Get Assigned Areas

```bash
curl -X GET http://localhost:5000/employee/assigned-areas/[employee-id] \
  -H "Content-Type: application/json"
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "area-uuid",
      "employee_id": "employee-uuid",
      "city": "Ahmedabad",
      "talukas": ["Ahmedabad", "Sanand", "Borsad"]
    }
  ]
}
```

### Assign Area to Salesperson

```bash
curl -X POST http://localhost:5000/employee/assign-areas \
  -H "Content-Type: application/json" \
  -d '{
    "employee_id": "[salesperson-uuid]",
    "assigned_by": "[admin-uuid]",
    "city": "Ahmedabad",
    "talukas": ["Ahmedabad", "Sanand", "Borsad"]
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "id": "area-uuid",
    "employee_id": "employee-uuid",
    "assigned_by": "admin-uuid",
    "city": "Ahmedabad",
    "talukas": ["Ahmedabad", "Sanand", "Borsad"],
    "created_at": "2025-02-10T10:00:00Z"
  }
}
```

### Remove Area Assignment

```bash
curl -X DELETE http://localhost:5000/employee/assigned-areas/[area-id] \
  -H "Content-Type: application/json"
```

## Troubleshooting

### Issue: "Salespeople list is empty"

**Possible Causes:**
1. No salespeople in database with `employee_type='sales'`
2. Backend not returning data correctly
3. Frontend fetch error

**Solution:**
1. Check database: `SELECT * FROM profiles WHERE employee_type='sales'`
2. Check browser network tab (DevTools)
3. Check backend logs for errors

### Issue: "Cannot assign area to salesperson"

**Possible Causes:**
1. Salesperson doesn't have `employee_type='sales'`
2. Backend validation failing
3. Database insert error

**Solution:**
1. Verify salesperson has correct `employee_type` in profiles table
2. Check backend console logs
3. Check Supabase query logs for SQL errors

### Issue: "Modal not opening for area assignment"

**Possible Causes:**
1. JavaScript error
2. CSS not loading correctly
3. State management issue

**Solution:**
1. Check browser console (F12) for errors
2. Verify Tailwind CSS is properly configured
3. Check React state in DevTools

### Issue: "Area doesn't appear after adding"

**Possible Causes:**
1. Database insert succeeded but page didn't refresh
2. Fetch call didn't complete
3. Response not being parsed correctly

**Solution:**
1. Check network tab (DevTools) to confirm POST request succeeded
2. Check browser console for JavaScript errors
3. Manually refresh page to verify data persists

## Next Steps

1. **Test in development** environment following the testing procedure above
2. **Fix any issues** using the troubleshooting guide
3. **Deploy to staging** for team testing
4. **Verify in production** with real salespeople data
5. **Monitor and log** any errors that occur in production

## Support

For issues or questions:
1. Check the [SALESPERSON_AREA_ASSIGNMENT_GUIDE.md](../SALESPERSON_AREA_ASSIGNMENT_GUIDE.md) for detailed documentation
2. Review API responses in browser Network tab (DevTools)
3. Check backend server logs
4. Verify database schema in Supabase console

---

**Last Updated:** 2025-02-10
**Version:** 1.0
