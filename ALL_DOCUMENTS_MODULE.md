# All Documents Module - Role-Based & Geography-Based Access Control

## Overview
The "All Documents" module provides strict role-based and geography-based access control for viewing customer documents across the car wash system.

## File Location
`frontend/src/Employee/AllDocuments.jsx`

## Features

### 1. Role-Based Access Control

#### Sales Person (salesman)
- ❌ **NO ACCESS** to the All Documents page
- Shown an "Access Denied" message with lock icon
- Redirected with option to go back to dashboard

#### HR-General
- ✅ Can view "All Documents" page
- **Filtered by:** Assigned Taluka(s)
- Shows ONLY documents where `customer_taluko` is in their assigned talukas
- Cannot see documents from other talukas or cities
- Displays assigned taluka(s) in the access info banner

#### Sub-General
- ✅ Can view "All Documents" page
- **Filtered by:** Assigned City(s)
- Shows ALL documents where `customer_city` is in their assigned cities
- This includes all talukas under those cities
- Cannot see documents from other cities
- Displays assigned city(s) in the access info banner

#### General
- ✅ Can view "All Documents" page
- **NO geographic restrictions**
- Shows ALL documents across ALL cities and talukas
- Displays "Access Level: All documents across all regions"

### 2. Document Types

The module displays three types of documents:

| Column | Document Type | Icon |
|--------|---------------|------|
| `car_photo_url` | Car Photo | 🚗 |
| `image_url_1` | Address Proof (ID/Aadhaar/Voter ID) | 🆔 |
| `image_url_2` | Light Bill / Electricity Bill | 💡 |

### 3. Features

#### Search & Filter
- **Customer Search:** Search by name, phone number, or number plate
- **Document Type Filter:** Filter by Car Photo, Address Proof, or Light Bill
- **Results Count:** Displays total documents matching filters

#### Document Management
- **View:** Click "View" to open document in new tab
- **Download:** Click download icon to download document
- **Card Display:** Clean card layout showing customer info and documents

#### User Information Banner
- Shows current user's role
- Displays assigned cities/talukas based on role
- Explains access level

### 4. Database Schema Used

```javascript
{
  id: "car_xxx",
  customer_name: "John Doe",
  customer_phone: "9876543210",
  number_plate: "MH-01-AB-1234",
  customer_city: "Ahmedabad (City)",
  customer_taluko: "Sanand",
  car_photo_url: "https://...",
  image_url_1: "https://...",  // Address Proof
  image_url_2: "https://...",  // Light Bill
  created_at: "2026-01-02T10:00:00"
}
```

## Access Control Flow

```
User logs in
    ↓
Check user's employee_type (role)
    ↓
┌─────────────────────────────────────────┐
│ Is user a Sales Person (salesman)?      │
├─────────────────────────────────────────┤
│ YES → Show "Access Denied" → Exit       │
│ NO → Continue to step below             │
└─────────────────────────────────────────┘
    ↓
Fetch user's geographic assignments:
- assigned_cities (for Sub-General)
- assigned_talukas (for HR-General)
    ↓
Load documents with role-based filtering:
    ├─ GENERAL: Show all documents
    ├─ SUB_GENERAL: Filter by assigned_cities
    └─ HR_GENERAL: Filter by assigned_talukas
    ↓
Display filtered documents with search/filter options
```

## Component Logic

### 1. Load User and Documents
```javascript
loadUserAndDocuments()
├─ Get authenticated user
├─ Fetch user's role and geographic assignments
├─ Check if user is Sales Person (deny access)
└─ Load documents with appropriate filtering
```

### 2. Role-Based Filtering
```javascript
loadDocuments(role, userId, cities, talukas)
├─ Start base query to sales_cars table
├─ Filter documents with document URLs
├─ Apply role-based geographic filtering:
│  ├─ HR_GENERAL: WHERE customer_taluko IN assigned_talukas
│  ├─ SUB_GENERAL: WHERE customer_city IN assigned_cities
│  └─ GENERAL: No WHERE clause
└─ Return filtered documents
```

### 3. Client-Side Filtering
```javascript
filterDocuments()
├─ Filter by search term (name, phone, plate)
├─ Filter by document type (car_photo, address_proof, light_bill)
└─ Update displayed documents
```

## Usage Instructions

### For Developers
1. Import the component in your routing file
2. Add route: `<Route path="/documents" element={<AllDocuments />} />`
3. Ensure user has proper role assignment in `profiles` table

### For HR/Admin
1. Navigate to "All Documents" from the employee menu
2. View documents based on your role's permissions
3. Search for specific customers using name, phone, or vehicle number
4. Filter by document type to find specific documents
5. Download documents as needed

## Security Features

✅ **Role-Based Access Control (RBAC)**
- Sales persons cannot access this page
- Only authorized roles can view documents

✅ **Geography-Based Filtering**
- HR-General limited to assigned talukas
- Sub-General limited to assigned cities
- Geographic boundaries are enforced at data load level

✅ **Database Row Level Security (RLS)**
- All queries use Supabase RLS policies
- Users can only see documents their role permits

✅ **Audit Trail**
- Document creation dates are displayed
- Customer information is clearly shown

## User Interface

### Header Section
- Page title: "All Documents"
- Description: "Manage and view customer documents with role-based access control"

### Access Info Banner
- Shows current user role
- Displays geographic assignments
- Explains access level

### Filter Section
- Search bar for finding customers
- Document type dropdown filter
- Live results counter

### Documents Grid
- Responsive 3-column layout
- Each card shows:
  - Customer name, phone, vehicle number
  - City and taluka (if available)
  - Available documents with view/download options
  - Registration date

### No Results State
- Friendly message when no documents found
- Suggestions to adjust search criteria

## Error Handling

- Loading spinner during data fetch
- Error logging for debugging
- Graceful fallbacks for missing data
- Access denied message for unauthorized roles

## Performance Optimization

- Efficient Supabase queries with `.not()` and `.or()` filters
- Client-side filtering for fast search results
- No unnecessary re-renders
- Lazy document loading

## Future Enhancements

- Document preview modal with thumbnails
- Batch download functionality
- Document organization by customer
- Document verification/approval workflow
- Audit log for document access
- Export documents as PDF
- Document expiration alerts
