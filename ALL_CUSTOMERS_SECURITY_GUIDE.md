# ALL CUSTOMERS PAGE - ROLE-BASED & GEOGRAPHIC FILTERING IMPLEMENTATION

## Overview

The "All Customers" page implements **strict role-based and geography-based data filtering** to ensure users only see customers they are authorized to access.

**Key Principle**: Filtering is **enforced at the backend level**, not the frontend, to prevent unauthorized access.

---

## VISIBILITY RULES

### 1. **General Role**
- **Visibility**: ALL customers across ALL cities, talukas, and areas
- **Access Level**: Full system access
- **Geographic Restriction**: NONE

```
General ├─ City 1 ├─ Taluka 1 ├─ Area 1 ├─ All Customers ✅
        │         │          ├─ Area 2 ├─ All Customers ✅
        │         ├─ Taluka 2 └─ All Customers ✅
        ├─ City 2 ├─ Taluka 3 └─ All Customers ✅
        └─ ...
```

### 2. **Sub-General Role**
- **Visibility**: Only customers in **assigned cities** (including all talukas and areas under those cities)
- **Assigned**: ONE or MORE cities
- **Geographic Restriction**: City level

```
Sub-General ├─ Assigned City 1 ├─ Taluka A ├─ All Customers ✅
            │                  ├─ Taluka B └─ All Customers ✅
            ├─ Assigned City 2 └─ All Talukas ✅
            └─ (Other cities) ❌ NOT VISIBLE
```

### 3. **HR-General Role**
- **Visibility**: Only customers in **assigned talukas**
- **Assigned**: ONE or MORE talukas
- **Geographic Restriction**: Taluka level

```
HR-General ├─ Assigned Taluka 1 └─ All Customers ✅
           ├─ Assigned Taluka 2 └─ All Customers ✅
           └─ (Other talukas) ❌ NOT VISIBLE
```

---

## IMPLEMENTATION ARCHITECTURE

### Backend Flow

```
Client Request
    ↓
Authorization Header (JWT Token)
    ↓
[Backend: /customer/all-customers]
    ↓
Step 1: Extract User ID from Token
    ↓
Step 2: Fetch User Profile (get employee_type)
    ↓
Step 3: Fetch All Sales Cars
    ↓
Step 4: Apply Role-Based Filtering
    ├─ General → No filtering
    ├─ Sub-General → Get assigned_cities → Filter by cities
    └─ HR-General → Get assigned_talukas → Filter by talukas
    ↓
Step 5: Enrich Data with Sales Person Info
    ↓
Return Filtered Data + Metadata
```

### Data Flow Diagram

```
Database: sales_cars
    ├─ customer_name
    ├─ customer_phone
    ├─ model
    ├─ number_plate
    ├─ color
    ├─ image_url_1, image_url_2
    └─ sales_person_id
         ↓
    Database: profiles (Sales Person)
         ├─ id
         ├─ name
         ├─ email
         └─ employee_type
```

---

## API ENDPOINT: `/customer/all-customers`

### Request
```http
GET /customer/all-customers
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

### Response (Success)
```json
{
  "success": true,
  "data": [
    {
      "id": "car_123",
      "customer_name": "John Doe",
      "customer_phone": "9876543210",
      "car_model": "Toyota Fortuner",
      "car_number_plate": "GJ-01-AB-1234",
      "car_color": "Silver",
      "image_url_1": "https://...",
      "image_url_2": "https://...",
      "created_at": "2026-01-01T10:30:00Z",
      "added_by_sales_person": {
        "id": "user_id_123",
        "name": "Aryan (Sales Person)",
        "email": "aryan@example.com",
        "type": "sales"
      }
    }
  ],
  "metadata": {
    "user_role": "general",
    "total_count": 5,
    "filtering_applied": false
  }
}
```

### Response (Error)
```json
{
  "success": false,
  "error": "Only General, Sub-General, and HR-General roles can access all customers"
}
```

---

## BACKEND IMPLEMENTATION

### File: `backend/routes/customerRoutes.js`

#### Key Functions

**1. Extract User ID from JWT Token**
```javascript
const parts = token.split(".");
const decoded = JSON.parse(Buffer.from(parts[1], "base64").toString());
const userId = decoded.sub;
```

**2. Get User Profile & Role**
```javascript
const { data: userProfile } = await supabase
  .from("profiles")
  .select("id, email, name, employee_type")
  .eq("id", userId)
  .single();
```

**3. Fetch All Sales Cars**
```javascript
const { data: cars } = await supabase
  .from("sales_cars")
  .select(`
    id,
    sales_person_id,
    model,
    number_plate,
    color,
    image_url_1,
    image_url_2,
    customer_name,
    customer_phone,
    created_at
  `)
  .order("created_at", { ascending: false });
```

**4. Role-Based Filtering**

```javascript
// General: No filtering
if (userRole === "general") {
  // All cars are accessible
}

// Sub-General: Filter by assigned cities
else if (userRole === "sub-general") {
  const { data: assignedCities } = await supabase
    .from("user_role_assignments")
    .select("assigned_cities")
    .eq("user_id", userId)
    .eq("role", "sub-general")
    .maybeSingle();
  
  const citiesArray = assignedCities?.assigned_cities || [];
  // Filter cars where sales_person's city is in citiesArray
}

// HR-General: Filter by assigned talukas
else if (userRole === "hr-general") {
  const { data: assignedTalukas } = await supabase
    .from("user_role_assignments")
    .select("assigned_talukas")
    .eq("user_id", userId)
    .eq("role", "hr-general")
    .maybeSingle();
  
  const talukasArray = assignedTalukas?.assigned_talukas || [];
  // Filter cars where sales_person's taluka is in talukasArray
}
```

---

## FRONTEND IMPLEMENTATION

### File: `frontend/src/Employee/AllCustomers.jsx`

#### Key Features

**1. Secure Data Fetching**
```javascript
// Get JWT token from Supabase session
const { data: sessionData } = await supabase.auth.getSession();
const token = sessionData?.session?.access_token;

// Send authenticated request
const response = await fetch("http://localhost:5000/customer/all-customers", {
  method: "GET",
  headers: {
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json"
  }
});
```

**2. Role Display Badge**
```javascript
{metadata.filtering_applied && (
  <span className="px-3 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full">
    🔒 Filtered by {userRole}
  </span>
)}
```

**3. Sales Person Filter Dropdown**
```javascript
// Show only sales persons whose customers are visible
const salesPersons = Array.from(
  new Map(
    customers.map(c => [
      c.added_by_sales_person?.id,
      c.added_by_sales_person
    ])
  ).values()
).filter(sp => sp?.id);
```

**4. Customer Table with Sales Person Info**
```jsx
<td className="py-4 px-6">
  <div className="flex items-center gap-2">
    <FiUserCheck className="text-blue-600" size={16} />
    <div className="text-sm">
      <p className="font-semibold text-slate-900">
        {customer.added_by_sales_person?.name || "Unknown"}
      </p>
      <p className="text-xs text-slate-500">
        {customer.added_by_sales_person?.email || "N/A"}
      </p>
    </div>
  </div>
</td>
```

---

## FILTERING LOGIC FLOW

### Example: Sub-General in Ahmedabad City

**User Profile:**
```
- employee_type: "sub-general"
- assigned_cities: ["Ahmedabad"]
```

**Database Query Flow:**
```
1. Fetch all sales_cars
   [Car1, Car2, Car3, Car4, Car5]

2. Get Sub-General's assigned cities
   ["Ahmedabad"]

3. Get sales persons assigned to Ahmedabad
   [SalesPerson1, SalesPerson2]

4. Filter cars where sales_person is in step 3
   [Car1 (SalesPerson1), Car3 (SalesPerson1), Car5 (SalesPerson2)]

5. Return filtered cars to frontend
```

**Result:** Sub-General only sees cars added by sales persons assigned to Ahmedabad

---

## SECURITY FEATURES

### ✅ Backend Validation
- Token validation before processing
- User profile verification
- Role-based access control
- Geographic boundary enforcement

### ✅ Data Isolation
- No cross-city data exposure
- No cross-taluka data exposure
- Sales person information tied to visible customers only

### ✅ Audit Logging
```javascript
console.log(`✅ [General] Access to ALL customers (${filteredCars.length} records)`);
console.log(`✅ [Sub-General] Access to customers in cities: ${citiesArray.join(", ")}`);
console.log(`✅ [HR-General] Access to customers in talukas: ${talukasArray.join(", ")}`);
```

---

## ERROR HANDLING

### Authorization Errors
```json
{
  "success": false,
  "error": "No authentication token"
}
```

### Role Errors
```json
{
  "success": false,
  "error": "Only General, Sub-General, and HR-General roles can access all customers"
}
```

### Database Errors
```json
{
  "success": false,
  "error": "Error message from Supabase"
}
```

---

## DATABASE SCHEMA REQUIREMENTS

### `sales_cars` Table
```sql
- id (TEXT PRIMARY KEY)
- sales_person_id (UUID FOREIGN KEY)
- customer_name (VARCHAR)
- customer_phone (VARCHAR)
- model (VARCHAR)
- number_plate (VARCHAR)
- color (VARCHAR)
- image_url_1 (TEXT)
- image_url_2 (TEXT)
- created_at (TIMESTAMP)
```

### `user_role_assignments` Table
```sql
- id (UUID PRIMARY KEY)
- user_id (UUID FOREIGN KEY)
- role (VARCHAR) -- "general", "sub-general", "hr-general"
- assigned_cities (TEXT[]) -- For sub-general
- assigned_talukas (TEXT[]) -- For hr-general
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### `profiles` Table
```sql
- id (UUID PRIMARY KEY)
- email (VARCHAR)
- name (VARCHAR)
- employee_type (VARCHAR) -- "general", "sub-general", "hr-general", "salesman"
- created_at (TIMESTAMP)
```

---

## TESTING CHECKLIST

### ✓ General User
- [ ] Can see ALL customers
- [ ] No "Filtered by" badge shown
- [ ] filtering_applied = false
- [ ] Can filter by any sales person

### ✓ Sub-General User
- [ ] Can see only customers from assigned cities
- [ ] Shows "🔒 Filtered by sub-general" badge
- [ ] filtering_applied = true
- [ ] Can filter by sales persons in assigned cities only

### ✓ HR-General User
- [ ] Can see only customers from assigned talukas
- [ ] Shows "🔒 Filtered by hr-general" badge
- [ ] filtering_applied = true
- [ ] Can filter by sales persons in assigned talukas only

### ✓ Unauthorized Roles
- [ ] Salesman users get error: "Only General, Sub-General, and HR-General..."
- [ ] Non-employee users get error: "User profile not found"

### ✓ Search & Filtering
- [ ] Search works across visible customers only
- [ ] Sales person filter works with visible data
- [ ] Clear filters resets both filters
- [ ] Results update in real-time

---

## DEPLOYMENT NOTES

1. **Ensure JWT Token Format**: Verify token structure matches `decoded.sub` for user ID
2. **Database Indexes**: Create indexes on:
   - `user_role_assignments(user_id, role)`
   - `sales_cars(sales_person_id)`
3. **CORS Configuration**: Allow frontend origin in Express CORS
4. **Environment Variables**: Set correct Supabase URL and API keys
5. **Token Expiration**: Handle expired tokens on frontend

---

## FUTURE ENHANCEMENTS

1. **Row-Level Security (RLS)** in Supabase for double security
2. **Audit Trail**: Log all data access attempts
3. **Geographic IDs**: Use numeric IDs instead of string names for cities/talukas
4. **Pagination**: Handle large datasets with pagination
5. **Real-time Updates**: WebSocket for live customer additions
6. **Export Functionality**: CSV export with filtered data only

---

## SUPPORT & DEBUGGING

### Enable Debug Logs
```javascript
// In backend: Uncomment console.logs to see filtering details
console.log(`✅ [${userRole}] ...`);

// In frontend: Check network tab for API response
```

### Common Issues

**Issue**: "Showing 0 out of 0 customers"
- **Solution**: Check if user has geographic assignments. Sub-General must have assigned_cities, HR-General must have assigned_talukas.

**Issue**: Sales persons not appearing in filter dropdown
- **Solution**: Verify sales_cars records exist with valid sales_person_id references.

**Issue**: Token validation errors
- **Solution**: Ensure JWT token is correctly formatted and passed in Authorization header.

