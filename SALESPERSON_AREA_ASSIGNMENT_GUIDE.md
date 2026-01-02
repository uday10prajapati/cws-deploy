# Salesperson Area Assignment System - Implementation Guide

## Overview
This document details the complete implementation of the Salesperson Area Assignment System, which replaces the previous customer management approach with a salesperson-centric territory management system.

## Architecture Changes

### Database Schema
**Old Approach (Removed):**
- `customers` table - Stored customer information with address, city, taluka
- No direct linkage to employees/salespeople

**New Approach (Implemented):**
- `profiles` table (existing) - Single source of truth for all users including salespeople
- `employee_assigned_areas` table (new) - Stores area assignments to salespeople
  - `id` (UUID, primary key)
  - `employee_id` (UUID, FK to profiles.id)
  - `assigned_by` (UUID, tracks who assigned the area)
  - `city` (varchar) - City name
  - `talukas` (varchar) - Comma-separated list of talukas
  - `created_at` (timestamp)
  - Indexes: idx_areas_employee, idx_areas_city, idx_areas_assigned_by
  - RLS enabled for security

**Key Constraint:**
- Only employees with `role = 'employee'` AND `employee_type = 'sales'` can receive area assignments

### Data Model (profiles table)
```json
{
  "id": "uuid",
  "email": "string",
  "name": "string",
  "phone": "string",
  "role": "employee",
  "employee_type": "sales|general",
  "city": "string",
  "taluka": "string"
}
```

### Data Model (employee_assigned_areas table)
```json
{
  "id": "uuid",
  "employee_id": "uuid (FK to profiles.id)",
  "assigned_by": "uuid (FK to profiles.id)",
  "city": "string",
  "talukas": "string (comma-separated: 'taluka1,taluka2')",
  "created_at": "timestamp"
}
```

## Backend Implementation

### Updated Routes

#### 1. **GET /customer/salespeople**
- **Purpose:** Fetch all salespeople
- **Query:** `SELECT * FROM profiles WHERE role='employee' AND employee_type='sales'`
- **Response:**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "uuid",
        "email": "string",
        "name": "string",
        "phone": "string",
        "employee_type": "sales",
        "city": "string",
        "taluka": "string"
      }
    ]
  }
  ```

#### 2. **GET /customer/salespeople/:id**
- **Purpose:** Fetch specific salesperson
- **Validation:** Verifies `employee_type = 'sales'`
- **Response:** Single salesperson object or 404 error

#### 3. **PUT /customer/salespeople/:id**
- **Purpose:** Update salesperson information (name, phone, city, taluka)
- **Validation:** Checks `employee_type = 'sales'` before update
- **Request Body:**
  ```json
  {
    "name": "string",
    "phone": "string",
    "city": "string",
    "taluka": "string"
  }
  ```

#### 4. **GET /employee/assigned-areas/:id**
- **Purpose:** Fetch areas assigned to a specific salesperson
- **Response:** Returns array with talukas parsed from comma-separated string
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "uuid",
        "employee_id": "uuid",
        "city": "Ahmedabad",
        "talukas": ["Ahmedabad", "Sanand", "Borsad"]
      }
    ]
  }
  ```

#### 5. **POST /employee/assign-areas**
- **Purpose:** Create new area assignment to a salesperson
- **Validation:**
  - Verifies target employee has `employee_type = 'sales'`
  - Returns 400 error if target is not a salesperson
- **Request Body:**
  ```json
  {
    "employee_id": "uuid",
    "assigned_by": "uuid",
    "city": "Ahmedabad",
    "talukas": ["Ahmedabad", "Sanand", "Borsad"]
  }
  ```
- **Backend Processing:**
  - Converts talukas array to comma-separated string for storage
  - Returns parsed array in response
  - Tracks who assigned area via `assigned_by`

#### 6. **DELETE /employee/assigned-areas/:id**
- **Purpose:** Remove area assignment
- **Response:** Success/error message

### File Changes
- **backend/routes/customerRoutes.js** - REPLACED
  - Removed: Customer CRUD operations
  - Added: Salesperson endpoints (GET all, GET one, PUT update)
  
- **backend/routes/myJobs.js** - UPDATED
  - Enhanced area assignment endpoints with employee_type validation
  - Added assigned_by tracking
  - Improved error handling

## Frontend Implementation

### New Components

#### 1. **AllSalespeople.jsx**
- **Location:** `frontend/src/Employee/AllSalespeople.jsx`
- **Purpose:** Display all salespeople in a searchable, filterable grid
- **Features:**
  - Search by name, phone, email
  - Filter by city and taluka (dependent dropdowns)
  - Display stats: Total salespeople, filtered count, cities covered
  - Card grid layout (1 column mobile, 2 columns tablet, 3 columns desktop)
  - "View & Assign Areas" button navigates to `/employee/salesperson/:id`
  - Loading states and empty state messaging
  - Integrated with EmployeeSidebar and NavbarNew

**Key Features:**
```jsx
// Fetch salespeople
const response = await fetch("http://localhost:5000/customer/salespeople");

// Filter by employee_type
if (salesperson.employee_type !== "sales") return;

// Navigate to detail page
navigate(`/employee/salesperson/${salesperson.id}`)
```

#### 2. **SalespersonDetails.jsx**
- **Location:** `frontend/src/Employee/SalespersonDetails.jsx`
- **Purpose:** Display salesperson details and manage their assigned areas
- **Features:**
  - Display salesperson info: name, phone, email, location
  - Show all assigned areas in cards
  - Add new area assignment via modal
  - Remove area assignments
  - Modal with city/taluka selection (Gujarat areas pre-defined)
  - Responsive design with Tailwind CSS
  - Integrated with EmployeeSidebar and NavbarNew

**Key Features:**
```jsx
// Fetch salesperson details
const response = await fetch(`http://localhost:5000/customer/salespeople/${id}`);

// Load assigned areas
const areasResponse = await fetch(`http://localhost:5000/employee/assigned-areas/${id}`);

// Add area assignment
await fetch("http://localhost:5000/employee/assign-areas", {
  method: "POST",
  body: JSON.stringify({
    employee_id: id,
    city: selectedCity,
    talukas: selectedTalukas,
    assigned_by: currentUser?.id
  })
});

// Remove area
await fetch(`http://localhost:5000/employee/assigned-areas/${areaId}`, {
  method: "DELETE"
});
```

### Updated Components

#### 1. **EmployeeSidebar.jsx**
- **Changes:**
  - Menu item "Customers" → "Sales Team"
  - Route `/employee/customers` → `/employee/salespeople`
  - "Assign Areas" route also points to `/employee/salespeople`
  - Both lead to AllSalespeople page for area management

#### 2. **App.jsx**
- **Changes:**
  - Added imports for AllSalespeople and SalespersonDetails
  - Added routes:
    - `/employee/salespeople` → AllSalespeople
    - `/employee/salesperson/:id` → SalespersonDetails

### Deprecated Components
The following components are no longer used:
- `AllCustomers.jsx` - Replaced by AllSalespeople
- `CustomerDetails.jsx` - Replaced by SalespersonDetails
- `AssignArea.jsx` - Merged into SalespersonDetails

(These can be archived or deleted based on project preferences)

## User Workflow

### For General Employees (Assigning Areas to Salespeople)

1. **Login** as general employee
2. **Navigate** to Employee Sidebar → Sales → "Sales Team"
3. **View AllSalespeople page** showing all employees with `employee_type = 'sales'`
4. **Search/Filter** salespeople by:
   - Name, phone, email (search box)
   - City and Taluka (dropdown filters)
5. **Click** "View & Assign Areas" button on salesperson card
6. **Go to SalespersonDetails page** showing:
   - Salesperson information (name, phone, email, location)
   - Currently assigned areas (if any)
   - "Add Area" button
7. **Click** "Add Area" to open modal
8. **Select** city from Gujarat cities list
9. **Select** one or more talukas from that city
10. **Click** "Assign" button
11. **Area assignment created** and displayed in the list
12. **View/manage** existing areas:
    - Click X button to remove an area assignment

### For Salespeople (Receiving Area Assignments)

1. **General employees** can view and assign areas to them
2. **Areas appear** in their profile once assigned
3. **Can be assigned multiple areas** (different cities/talukas)
4. **Can have areas removed** by general employees

## Validation Rules

### Server-Side Validation
1. **Employee Type Check:**
   - Before assigning area: Verify `employee_type = 'sales'`
   - Return 400 error if target is not a salesperson
   - Applied in: POST /employee/assign-areas

2. **Role Check:**
   - Verify user role is 'employee' when fetching salespeople
   - Applied in: GET /customer/salespeople(s)

3. **Data Format:**
   - Talukas stored as comma-separated string in database
   - Parsed to array in API responses
   - Converted back to string for storage

### Frontend Validation
1. **Role-based Redirect:** `useRoleBasedRedirect('employee')`
   - Ensures only employees can access pages
   - Redirects non-employees to login

2. **Modal Validation:**
   - Require city selection
   - Require at least one taluka
   - Disable assign button until both are selected

## Data Flow

### Adding Area Assignment
```
User clicks "Add Area"
    ↓
Modal opens with city/taluka selection
    ↓
User selects city (loads talukas for that city)
    ↓
User selects talukas (checkboxes)
    ↓
User clicks "Assign"
    ↓
Frontend converts talukas array to format for API
    ↓
POST /employee/assign-areas with {employee_id, city, talukas, assigned_by}
    ↓
Backend validates employee_type='sales'
    ↓
Backend converts talukas array to comma-separated string
    ↓
INSERT into employee_assigned_areas table
    ↓
Return created record with talukas parsed as array
    ↓
Frontend updates assigned areas list
    ↓
Success message shown to user
```

### Viewing Assigned Areas
```
SalespersonDetails page loads
    ↓
Fetch salesperson data from GET /customer/salespeople/:id
    ↓
Fetch assigned areas from GET /employee/assigned-areas/:id
    ↓
Backend queries employee_assigned_areas table for employee_id
    ↓
Backend parses comma-separated talukas to array
    ↓
Returns array of area assignments
    ↓
Frontend displays in card grid format
```

## Testing Checklist

- [ ] Create test salespeople with `employee_type='sales'` in profiles table
- [ ] Login as general employee
- [ ] Navigate to /employee/salespeople
- [ ] Verify only salespeople (employee_type='sales') are displayed
- [ ] Search for salespeople by name/phone/email
- [ ] Filter by city/taluka
- [ ] Click "View & Assign Areas" button
- [ ] Verify SalespersonDetails page loads
- [ ] Click "Add Area" button
- [ ] Select city from dropdown
- [ ] Select talukas for that city
- [ ] Click "Assign" button
- [ ] Verify area appears in assigned areas list
- [ ] Click X to remove area
- [ ] Verify area is removed from list
- [ ] Refresh page and verify data persists
- [ ] Try assigning area to non-salesperson (should fail)
- [ ] Verify error message when trying to assign to general employee

## API Testing Examples

### Get All Salespeople
```bash
curl -X GET http://localhost:5000/customer/salespeople
```

### Get Specific Salesperson
```bash
curl -X GET http://localhost:5000/customer/salespeople/[user-id]
```

### Get Assigned Areas for Salesperson
```bash
curl -X GET http://localhost:5000/employee/assigned-areas/[employee-id]
```

### Assign Area to Salesperson
```bash
curl -X POST http://localhost:5000/employee/assign-areas \
  -H "Content-Type: application/json" \
  -d '{
    "employee_id": "[salesperson-id]",
    "assigned_by": "[admin-id]",
    "city": "Ahmedabad",
    "talukas": ["Ahmedabad", "Sanand", "Borsad"]
  }'
```

### Remove Area Assignment
```bash
curl -X DELETE http://localhost:5000/employee/assigned-areas/[area-id]
```

## Deployment Notes

1. **Database Migration:**
   - Run migration from `create_customers_table.sql` to create `employee_assigned_areas` table
   - Ensure `profiles` table has `employee_type` column
   - Add indexes for performance

2. **Environment Setup:**
   - Backend running on `http://localhost:5000`
   - Frontend will make API calls to this URL
   - Update in production if backend URL changes

3. **Dependencies:**
   - Frontend: React, React Router, Tailwind CSS, React Icons
   - Backend: Express, Supabase client
   - Database: Supabase (PostgreSQL)

## Future Enhancements

1. **Bulk Area Assignment:**
   - Assign same areas to multiple salespeople at once
   - CSV import for area assignments

2. **Area Analytics:**
   - Dashboard showing area coverage
   - Salesperson workload by area
   - Territory overlap detection

3. **Area Scheduling:**
   - Schedule area assignments with start/end dates
   - Plan territory rotations

4. **Audit Trail:**
   - Full history of area assignments/removals
   - Track who assigned areas and when

5. **Mobile Optimization:**
   - Dedicated mobile views
   - Offline area information access

## Support & Troubleshooting

### Issue: "Area assignment failed"
- **Check:** Backend is running on correct URL
- **Check:** Salesperson has `employee_type='sales'` in profiles table
- **Check:** User making assignment is authenticated

### Issue: "Salespeople list is empty"
- **Check:** Profiles table has employees with `role='employee'` AND `employee_type='sales'`
- **Check:** No database filters preventing access

### Issue: "Modal not opening"
- **Check:** Browser console for JavaScript errors
- **Check:** Modal CSS classes are correct

### Issue: "Areas not persisting after refresh"
- **Check:** Database insert was successful (check browser network tab)
- **Check:** Fetch call is returning success response
- **Check:** Supabase RLS policies allow data access

---

**Last Updated:** 2025-02-10
**Version:** 1.0
**Status:** Production Ready
