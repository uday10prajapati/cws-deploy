# Employee Booking Assignment Guide

## Problem & Solution

### Issue
Employees were seeing 0 bookings because the `assigned_to` column in the bookings table had no data linking bookings to employees.

### Solution Implemented
Three new endpoints have been added to handle booking assignment:

---

## New API Endpoints

### 1. **Assign Booking to Employee**
**Endpoint:** `POST /bookings/assign/:id`

**Description:** Assign a specific booking to an employee

**Request:**
```bash
curl -X POST http://localhost:5000/bookings/assign/BOOKING_ID \
  -H "Content-Type: application/json" \
  -d { "employee_id": "EMPLOYEE_UUID" }
```

**Response:**
```json
{
  "success": true,
  "booking": { /* booking data with assigned_to updated */ },
  "message": "Booking assigned to employee successfully"
}
```

---

### 2. **Get Unassigned Bookings**
**Endpoint:** `GET /bookings/unassigned/list`

**Description:** Fetch all bookings that haven't been assigned to any employee (Admin view)

**Request:**
```bash
curl http://localhost:5000/bookings/unassigned/list
```

**Response:**
```json
{
  "success": true,
  "bookings": [ /* array of unassigned bookings */ ]
}
```

---

### 3. **Updated Employee Bookings Fetch** ⭐
**Endpoint:** `GET /employee/bookings/:userId`

**What's New:**
- ✅ First tries to fetch bookings assigned to the employee (`assigned_to = userId`)
- ✅ If no assigned bookings found, falls back to showing unassigned pending bookings
- ✅ This allows employees to see available work while waiting for official assignment

**Request:**
```bash
curl http://localhost:5000/employee/bookings/EMPLOYEE_UUID
```

**Response:**
```json
{
  "success": true,
  "bookings": [ /* assigned or unassigned pending bookings */ ]
}
```

---

## Testing Workflow

### Step 1: Verify Bookings Exist
```bash
curl http://localhost:5000/bookings
```
You should see your bookings from the database.

### Step 2: Get Unassigned Bookings
```bash
curl http://localhost:5000/bookings/unassigned/list
```
This shows all bookings not yet assigned to an employee.

### Step 3: Assign a Booking to Employee
```bash
curl -X POST http://localhost:5000/bookings/assign/BOOKING_ID \
  -H "Content-Type: application/json" \
  -d '{"employee_id": "EMPLOYEE_UUID"}'
```

### Step 4: Employee Sees Assigned Booking
```bash
curl http://localhost:5000/employee/bookings/EMPLOYEE_UUID
```
Now the employee should see the assigned booking.

---

## How It Works in the Frontend

### EmployeeDashboard.jsx
- Fetches bookings via `GET /employee/bookings/${auth.user.id}`
- Filters into `pendingBookings` (status !== "Completed")
- Shows pending bookings in "Today's Pending Jobs" table
- Shows completed bookings count in "Completed" card

### MyJobs.jsx
- Fetches same bookings endpoint
- Two tabs:
  - **Pending Bookings**: Shows all non-completed bookings
  - **Completed Bookings**: Shows only completed bookings

---

## Database Schema Confirmation

Your bookings table has:
- `id` (UUID, Primary Key)
- `assigned_to` (UUID, Foreign Key to employee/profiles) ✅ **EXISTS**
- `status` (Text: "Pending", "Confirmed", "In Progress", "Completed")
- All other booking details

The `assigned_to` column is indexed for fast queries:
```sql
create index IF not exists idx_bookings_assigned_to on public.bookings 
using btree (assigned_to) TABLESPACE pg_default;
```

---

## What Shows in Employee Dashboard Now

With the new fallback logic:

**Scenario 1: Bookings Assigned**
- If `assigned_to = employee_id`, shows those specific bookings
- Employee Dashboard: Shows assigned pending jobs
- MyJobs: Shows assigned pending and completed jobs

**Scenario 2: No Assigned Bookings Yet**
- Falls back to showing unassigned pending bookings
- Employee can see available work
- Admin can then assign specific bookings via the assign endpoint

---

## Next Steps

### For Manual Assignment (Immediate Testing):
1. Get unassigned bookings: `GET /bookings/unassigned/list`
2. Assign to employee: `POST /bookings/assign/{id}` with employee_id
3. Refresh employee dashboard to see the booking

### For Admin UI (Future Enhancement):
Consider creating an admin page that:
- Shows unassigned bookings in a list
- Has an "Assign to Employee" button
- Lets admin select employee from dropdown
- Calls the assign endpoint on button click

### For Smart Assignment (Future):
- Auto-assign based on employee availability
- Assign based on location/service type
- Round-robin assignment logic

---

## Database Queries for Reference

### See all bookings:
```sql
SELECT * FROM bookings ORDER BY created_at DESC;
```

### See unassigned bookings:
```sql
SELECT * FROM bookings WHERE assigned_to IS NULL ORDER BY created_at DESC;
```

### See bookings assigned to a specific employee:
```sql
SELECT * FROM bookings 
WHERE assigned_to = 'EMPLOYEE_UUID' 
ORDER BY created_at DESC;
```

### Manually assign a booking (if needed):
```sql
UPDATE bookings 
SET assigned_to = 'EMPLOYEE_UUID' 
WHERE id = 'BOOKING_ID';
```

---

## Summary

✅ **Problem Solved**: Employees now see bookings via fallback to unassigned pending bookings  
✅ **New Endpoints**: Assign bookings and view unassigned bookings  
✅ **Smart Fallback**: Shows available work while waiting for official assignment  
✅ **Ready to Use**: All backend changes deployed and tested
