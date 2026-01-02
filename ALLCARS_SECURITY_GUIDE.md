# ALL CARS PAGE – SECURITY & IMPLEMENTATION GUIDE

## Overview
The **All Cars** page implements strict role-based and geographic filtering to control which customer vehicles each user can view. All filtering is **enforced at the backend level** to prevent data leakage.

---

## 🔐 ROLE-BASED VISIBILITY RULES

### 1. **General** (Full Access)
- **Can View:** ALL cars across ALL cities, talukas, and areas
- **Filtering:** None
- **Use Case:** Super admin, system administrator
- **Example:** See 500+ cars from all regions

### 2. **Sub-General** (City-Level Access)
- **Can View:** ALL cars where `customer_city` is in their assigned cities
- **Geographic Scope:** All talukas within assigned cities
- **Assignment:** `user_role_assignments.assigned_cities[]`
- **Use Case:** Regional manager for multiple cities
- **Example:** Assigned to ["Mumbai", "Pune"] → See all cars from Mumbai and Pune (all talukas within these cities)

### 3. **HR-General** (Taluka-Level Access)
- **Can View:** ONLY cars where `customer_taluko` is in their assigned talukas
- **Geographic Scope:** Specific talukas only
- **Assignment:** `user_role_assignments.assigned_talukas[]`
- **Use Case:** Area manager for specific talukas
- **Example:** Assigned to ["Ankleshwar", "Dahod"] → See only cars from those talukas

### 4. **Salesman** (NO ACCESS)
- **Can View:** Nothing
- **Error Response:** 403 Forbidden
- **Use Case:** Individual sales persons cannot access All Cars page

---

## 📊 DATABASE SCHEMA REQUIREMENTS

### Required Fields in `sales_cars` Table
```sql
CREATE TABLE sales_cars (
  id BIGINT PRIMARY KEY,
  sales_person_id UUID REFERENCES profiles(id),
  customer_name TEXT,
  customer_phone TEXT,
  customer_city TEXT,          -- City where customer's car is registered
  customer_taluko TEXT,        -- Taluka where customer's car is registered
  brand TEXT,
  model TEXT,
  number_plate TEXT,
  color TEXT,
  image_url_1 TEXT,
  image_url_2 TEXT,
  created_at TIMESTAMP
);
```

### Required Fields in `user_role_assignments` Table
```sql
CREATE TABLE user_role_assignments (
  id BIGINT PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  role TEXT,                 -- "general", "sub-general", "hr-general"
  assigned_cities TEXT[],    -- For sub-general users
  assigned_talukas TEXT[],   -- For hr-general users
  created_at TIMESTAMP
);
```

---

## 🔄 API ENDPOINT: `/cars/all-cars/secure`

### Endpoint Details
- **Method:** GET
- **Authentication:** Bearer Token (JWT from Supabase)
- **Authorization Header:** `Authorization: Bearer {access_token}`

### Request Example
```javascript
const response = await fetch("http://localhost:5000/cars/all-cars/secure", {
  method: "GET",
  headers: {
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json",
  },
});
```

### Response Structure (Success)
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-1",
      "customer_name": "John Doe",
      "customer_phone": "9876543210",
      "customer_city": "Mumbai",
      "customer_taluko": "Andheri",
      "car_brand": "Toyota",
      "car_model": "Fortuner",
      "car_number_plate": "MH-02-XYZ-1234",
      "car_color": "White",
      "image_url_1": "https://example.com/car1.jpg",
      "image_url_2": "https://example.com/car2.jpg",
      "created_at": "2024-01-15T10:30:00Z",
      "added_by_sales_person": {
        "id": "uuid-sp",
        "name": "Rajesh Kumar",
        "email": "rajesh@example.com",
        "type": "sales",
        "city": "Mumbai",
        "taluko": "Andheri"
      },
      "booking_stats": {
        "total_bookings": 12,
        "completed": 10,
        "in_progress": 1,
        "pending": 1,
        "locations": ["Mumbai", "Pune"],
        "last_service": "2024-01-20T14:00:00Z"
      }
    }
  ],
  "metadata": {
    "user_role": "sub-general",
    "total_count": 45,
    "filtering_applied": true
  }
}
```

### Response Structure (Error)
```json
{
  "success": false,
  "error": "Only General, Sub-General, and HR-General roles can access all cars"
}
```

### Response Codes
- **200 OK** - Cars fetched successfully with role-based filtering applied
- **401 Unauthorized** - No token provided or invalid token
- **403 Forbidden** - User role not allowed to access this endpoint
- **400 Bad Request** - Invalid token format or database error
- **500 Server Error** - Unexpected server error

---

## 🛡️ BACKEND IMPLEMENTATION DETAILS

### Backend Route File: `backend/routes/carsRoutes.js`

#### Endpoint: `router.get("/all-cars/secure", async (req, res) => { ... })`

### Step-by-Step Filtering Process

#### Step 1: Extract User ID from JWT
```javascript
const parts = token.split(".");
const decoded = JSON.parse(Buffer.from(parts[1], "base64").toString());
const userId = decoded.sub;  // Supabase user ID
```

#### Step 2: Fetch User Profile & Determine Role
```javascript
const { data: userProfile } = await supabase
  .from("profiles")
  .select("id, email, name, employee_type")
  .eq("id", userId)
  .single();

const userRole = userProfile.employee_type;  // "general", "sub-general", "hr-general"
```

#### Step 3: Fetch All Cars (No Filtering Yet)
```javascript
const { data: cars } = await supabase
  .from("sales_cars")
  .select("id, sales_person_id, model, brand, number_plate, ..., customer_city, customer_taluko, ...")
  .order("created_at", { ascending: false });
```

#### Step 4: Get User's Geographic Assignments
```javascript
// For Sub-General
if (userRole === "sub-general") {
  const { data: assignments } = await supabase
    .from("user_role_assignments")
    .select("assigned_cities")
    .eq("user_id", userId)
    .maybeSingle();
  userCities = assignments?.assigned_cities || [];  // ["Mumbai", "Pune"]
}

// For HR-General
else if (userRole === "hr-general") {
  const { data: assignments } = await supabase
    .from("user_role_assignments")
    .select("assigned_talukas")
    .eq("user_id", userId)
    .maybeSingle();
  userTalukas = assignments?.assigned_talukas || [];  // ["Ankleshwar", "Dahod"]
}
```

#### Step 5: Get Sales Person Details
```javascript
const { data: allSalesPersons } = await supabase
  .from("profiles")
  .select("id, name, email, employee_type, city, taluko")
  .eq("employee_type", "sales");

// Create a map for quick lookups
const salesPersonMap = {};
allSalesPersons?.forEach(sp => {
  salesPersonMap[sp.id] = sp;  // Map salesPersonId → salesPerson details
});
```

#### Step 6: Fetch Booking Statistics
```javascript
const carIds = cars?.map(c => c.id) || [];
const { data: bookingsData } = await supabase
  .from("bookings")
  .select("id, car_id, status, amount, date, location")
  .in("car_id", carIds);

// Create booking stats for each car
const bookingStats = {};
bookingsData?.forEach(booking => {
  if (!bookingStats[booking.car_id]) {
    bookingStats[booking.car_id] = {
      total: 0, completed: 0, in_progress: 0, pending: 0,
      locations: new Set(), last_service: null
    };
  }
  bookingStats[booking.car_id].total++;
  // ... count by status ...
});
```

#### Step 7: Enrich Car Data
```javascript
let enrichedCars = cars?.map(car => ({
  id: car.id,
  customer_name: car.customer_name,
  customer_city: car.customer_city,       // Customer's city
  customer_taluko: car.customer_taluko,   // Customer's taluka
  car_brand: car.brand,
  car_model: car.model,
  car_number_plate: car.number_plate,
  image_url_1: car.image_url_1,
  image_url_2: car.image_url_2,
  created_at: car.created_at,
  added_by_sales_person: salesPersonMap[car.sales_person_id] || { name: "Unknown" },
  booking_stats: bookingStats[car.id] || { total_bookings: 0, ... }
})) || [];
```

#### Step 8: Apply Role-Based Geographic Filtering
```javascript
enrichedCars = enrichedCars.filter(car => {
  if (userRole === "general") {
    return true;  // Show all cars
  }
  else if (userRole === "sub-general") {
    // Filter by customer's city (case-insensitive)
    const customerCity = car.customer_city?.toLowerCase();
    const citiesLower = userCities.map(c => c.toLowerCase());
    return citiesLower.includes(customerCity);
  }
  else if (userRole === "hr-general") {
    // Filter by customer's taluka (case-insensitive)
    const customerTaluko = car.customer_taluko?.toLowerCase();
    const talukasLower = userTalukas.map(t => t.toLowerCase());
    return talukasLower.includes(customerTaluko);
  }
  return false;
});
```

#### Step 9: Return Filtered Data
```javascript
return res.json({ 
  success: true, 
  data: filteredCars,
  metadata: {
    user_role: userRole,
    total_count: filteredCars.length,
    filtering_applied: userRole !== "general"
  }
});
```

---

## 💻 FRONTEND IMPLEMENTATION DETAILS

### Frontend Component: `frontend/src/Employee/AllCars.jsx`

#### Function: `fetchAllCars()`
```javascript
const fetchAllCars = async () => {
  try {
    setLoading(true);
    setError("");

    // Get JWT token from Supabase session
    const { data: { session } } = await supabase.auth.getSession();
    const token = session.access_token;

    // Fetch with role-based filtering
    const response = await fetch("http://localhost:5000/cars/all-cars/secure", {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const result = await response.json();

    if (result.success) {
      const carsData = result.data || [];
      
      // Transform for display
      const enrichedCars = carsData.map(car => ({
        ...car,
        car_name: `${car.car_brand} ${car.car_model}`.trim(),
        car_display: {
          image: car.image_url_1 || car.image_url_2,
          brand: car.car_brand,
          model: car.car_model,
          plate: car.car_number_plate,
          color: car.car_color,
        },
        location: {
          city: car.customer_city,
          taluka: car.customer_taluko,
        },
        added_by: car.added_by_sales_person?.name || "Unknown",
      }));

      setCars(enrichedCars);
      setFilteredCars(enrichedCars);
      setUserRole(result.metadata?.user_role || "");
      
      // Calculate statistics
      setStatistics({
        total_cars: enrichedCars.length,
        total_bookings: carsData.reduce((sum, c) => sum + (c.booking_stats?.total_bookings || 0), 0),
        completed_bookings: carsData.reduce((sum, c) => sum + (c.booking_stats?.completed || 0), 0),
        user_role: result.metadata?.user_role || "",
      });
    } else {
      setError(result.error || "Failed to fetch cars");
    }
  } catch (err) {
    console.error("Error fetching cars:", err);
    setError("Error fetching cars: " + err.message);
  } finally {
    setLoading(false);
  }
};
```

#### Function: `handleSearch()`
```javascript
const handleSearch = (e) => {
  const term = e.target.value.toLowerCase();
  setSearchTerm(term);

  const filtered = cars.filter(
    (car) =>
      car.car_name.toLowerCase().includes(term) ||
      car.car_brand?.toLowerCase().includes(term) ||
      car.car_model?.toLowerCase().includes(term) ||
      car.car_number_plate?.toLowerCase().includes(term) ||
      car.customer_name?.toLowerCase().includes(term) ||
      car.customer_phone?.toLowerCase().includes(term) ||
      car.location?.city?.toLowerCase().includes(term) ||
      car.location?.taluka?.toLowerCase().includes(term) ||
      car.added_by?.toLowerCase().includes(term)
  );

  setFilteredCars(filtered);
};
```

#### UI Components

1. **Statistics Dashboard**
   - Total Cars (filtered)
   - Total Bookings
   - Completed Bookings
   - User's Role Badge

2. **Search Bar**
   - Searchable by: Car name, brand, model, plate, customer name, phone, city, taluka, sales person

3. **Car Grid Layout**
   - Responsive: 1 column (mobile), 2 columns (tablet), 3 columns (desktop)
   - Each card displays:
     - Car image
     - Brand & model
     - Number plate
     - Car owner name
     - Booking stats (total, completed, in progress, pending)
     - Location (city & taluka)
     - Added by (sales person name & email)
     - Date added

---

## 🔍 CASE-INSENSITIVE FILTERING

Both backend and frontend use **case-insensitive** geographic filtering to handle variations:

### Backend Example
```javascript
const customerCity = car.customer_city?.toLowerCase();  // "mumbai"
const citiesLower = userCities.map(c => c.toLowerCase());  // ["mumbai", "pune"]
return citiesLower.includes(customerCity);  // Matches "Mumbai", "MUMBAI", "mumbai"
```

---

## ⚙️ CONFIGURATION & SETUP

### 1. Backend Environment Variables
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
PORT=5000
```

### 2. Frontend Environment Variables (if needed)
```env
VITE_BACKEND_URL=http://localhost:5000
```

### 3. Database Migrations
Ensure these tables exist:
- `profiles` (with `employee_type` field)
- `sales_cars` (with `customer_city`, `customer_taluko`, `image_url_1`, `image_url_2`)
- `user_role_assignments` (with `assigned_cities[]`, `assigned_talukas[]`)
- `bookings` (for statistics)

---

## 🚀 TESTING SCENARIOS

### Test Case 1: General User
**Setup:** Create a user with `employee_type = "general"`
**Expected:** See ALL cars from all cities and talukas
**Verify:** 
- Statistics show total across all regions
- No geographic filtering applied
- Metadata shows `user_role: "general"` and `filtering_applied: false`

### Test Case 2: Sub-General User
**Setup:** Create a user with `employee_type = "sub-general"` assigned to ["Mumbai", "Pune"]
**Expected:** See ONLY cars where customer_city is "Mumbai" or "Pune"
**Verify:**
- Statistics show only Mumbai & Pune cars
- Can see all talukas within Mumbai and Pune
- Cannot see cars from other cities
- Metadata shows `filtering_applied: true`

### Test Case 3: HR-General User
**Setup:** Create a user with `employee_type = "hr-general"` assigned to ["Ankleshwar", "Dahod"]
**Expected:** See ONLY cars where customer_taluko is "Ankleshwar" or "Dahod"
**Verify:**
- Statistics show only Ankleshwar & Dahod cars
- Cannot see cars from other talukas
- Metadata shows `filtering_applied: true`

### Test Case 4: Salesman Access Denied
**Setup:** Try to access All Cars page as `employee_type = "sales"`
**Expected:** 403 Forbidden error
**Verify:** Backend returns proper error message

### Test Case 5: Case-Insensitive Matching
**Setup:** Create car with `customer_city = "Mumbai"`, user assigned to "mumbai"
**Expected:** Car appears in filtered list
**Verify:** Case variations don't prevent filtering

### Test Case 6: Search Functionality
**Setup:** Search for specific terms in filtered car list
**Expected:** Results filtered by search term
**Verify:**
- Search by car brand works
- Search by plate number works
- Search by customer name works
- Search by city/taluka works
- Search by sales person name works

---

## 🐛 DEBUGGING & LOGGING

### Backend Logs to Check
```
📋 Fetched X sales persons from profiles table
🗺️ Sales Person Map created with Y entries
✓ Car 1 (Customer Name): sales_person_id=xyz → Sales Person Name
✓ Car (Customer Name) in taluka "Ankleshwar" matches assigned talukas
⛔ Car (Customer Name) in city "Delhi" not in assigned cities
✅ [General] Access to ALL cars (Z records)
✅ [Sub-General] Access to cars in cities: Mumbai, Pune (A records)
✅ [HR-General] Access to cars in talukas: Ankleshwar, Dahod (B records)
```

### Frontend Debugging
- Check browser console for fetch errors
- Verify JWT token is being sent in Authorization header
- Check network tab to see response structure
- Verify state updates in React DevTools

---

## 📋 SUMMARY

| Aspect | Details |
|--------|---------|
| **Endpoint** | GET `/cars/all-cars/secure` |
| **Authentication** | JWT Bearer Token |
| **General** | All cars, no filtering |
| **Sub-General** | Cars where customer_city in assigned_cities[] |
| **HR-General** | Cars where customer_taluko in assigned_talukas[] |
| **Filtering** | Backend enforced (case-insensitive) |
| **Data Enrichment** | Sales person info, booking stats |
| **Frontend Search** | Car name, brand, model, plate, customer, location, sales person |
| **Response** | JSON with metadata about filtering applied |

---

## 🔗 RELATED FILES

- Backend: [backend/routes/carsRoutes.js](./backend/routes/carsRoutes.js)
- Frontend: [frontend/src/Employee/AllCars.jsx](./frontend/src/Employee/AllCars.jsx)
- Related Guide: [ALL_CUSTOMERS_SECURITY_GUIDE.md](./ALL_CUSTOMERS_SECURITY_GUIDE.md)
- Documentation: [ALL_CUSTOMERS_IMPLEMENTATION.md](./ALL_CUSTOMERS_IMPLEMENTATION.md)
