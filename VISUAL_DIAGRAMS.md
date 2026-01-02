# Role-Based Access Control - Visual Diagrams

## 1. System Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                     FRONTEND (React)                         │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────┐      ┌──────────────────────────────┐ │
│  │ CityDetails.jsx │      │ TalukaDetails.jsx           │ │
│  │                 │      │                              │ │
│  │ Sub-Admin View: │      │ Sub-Admin View:            │ │
│  │ • Multiple      │      │ • Multiple talukas from   │ │
│  │   cities        │      │   assigned cities         │ │
│  │ • City selector │      │ • Taluka selector         │ │
│  │ • All taluka    │      │                            │ │
│  │   data          │      │ HR View:                  │ │
│  │                 │      │ • Only assigned talukas   │ │
│  │                 │      │ • Taluka selector         │ │
│  └────────┬────────┘      └──────────────┬─────────────┘ │
│           │                              │                 │
│  ┌────────▼──────────────────────────────▼────────────────┐│
│  │     roleBasedAccessControl.js (Utilities)              ││
│  │                                                        ││
│  │  • getTalukasForCity()                                ││
│  │  • filterUsersByGeographicAccess()                    ││
│  │  • validateSubAdminToHRAssignment()                   ││
│  │  • getUserPermissions()                               ││
│  └───────────────────────────┬──────────────────────────┘│
│                              │                           │
└──────────────────────────────┼───────────────────────────┘
                               │
                        NETWORK CALLS
                               │
                               ▼
┌──────────────────────────────────────────────────────────────┐
│                    BACKEND (Node.js)                        │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  roleBasedAccessMiddleware.js                        │   │
│  │                                                      │   │
│  │  • checkCityAccess()                                │   │
│  │  • checkTalukaAccess()                              │   │
│  │  • checkWashAreaAccess()                            │   │
│  │  • validateSubAdminToHRAssignment()                 │   │
│  │  • validateHRToWasherAssignment()                   │   │
│  │  • getUserRoleAndAssignments()                      │   │
│  └────────┬─────────────────────────────────────────┬──┘   │
│           │                                         │       │
│  ┌────────▼─────────────┐          ┌───────────────▼────┐  │
│  │  adminRoutes.js      │          │ Validation Logic   │  │
│  │                      │          │                    │  │
│  │ GET /users          │◄─────────┤ Check Permission   │  │
│  │ GET /cars           │          │ Filter Data        │  │
│  │ POST /assign-*      │          │ Validate Input     │  │
│  │ GET /analytics      │          │                    │  │
│  └────────┬─────────────┘          └────────────────────┘  │
│           │                                                 │
│  ┌────────▼──────────────────────────────────────────────┐ │
│  │           Supabase (Database)                         │ │
│  │                                                      │ │
│  │  profiles table:                                    │ │
│  │    - id, name, role                                │ │
│  │    - assigned_cities (Sub-Admin)                   │ │
│  │    - assigned_talukas (Sub-Admin & HR)             │ │
│  │    - city, taluko                                  │ │
│  │    - assigned_wash_areas (Washer)                  │ │
│  │                                                      │ │
│  │  Constants:                                         │ │
│  │    - GUJARATCITIES (Geography Truth)               │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## 2. Data Flow - Sub-Admin Views City

```
┌─────────────────────────────────────────────────────────────┐
│ User: Sub-Admin (assigned_cities: ['Bharuch', 'Anand'])    │
└─────────────────────────────────────────────────────────────┘
              │
              ▼
     CityDetails.jsx loads
     ┌─────────────────────┐
     │ useEffect on mount  │
     │ Detects role        │
     │ Loads assigned      │
     │ cities array        │
     └────────┬────────────┘
              │
              ▼
     [Bharuch] [Anand] ← City Selector
              │
       Select 'Bharuch'
              │
              ▼
     roleBasedAccessControl.js
     getTalukasForCity('Bharuch')
              │
              ▼
     GUJARATCITIES['Bharuch'] = 
     [Ankleshwar, Jambusar, Jhagadia, ...]
              │
              ▼
     Display all talukas under Bharuch
     ┌─────────────────────┐
     │ Ankleshwar - 45 cust│
     │ Jambusar - 38 cust  │
     │ Jhagadia - 22 cust  │
     │ ... (all talukas)   │
     └─────────────────────┘
              │
              ▼
     Load users from Bharuch city
     GET /admin/users
     (with checkTalukaAccess middleware)
              │
              ▼
     Backend receives request
     Middleware runs:
       • Get user permissions
       • Check if user = Sub-Admin
       • Check 'Bharuch' in assigned_cities
       • ✅ Allow OR ❌ Deny
              │
              ▼
     Filter users: WHERE city = 'Bharuch'
              │
              ▼
     Return [User1, User2, ...] 
     (only from Bharuch)
              │
              ▼
     Display in CityDetails
```

---

## 3. Data Flow - HR Views Taluka

```
┌──────────────────────────────────────────────────────────┐
│ User: HR (assigned_talukas: ['Ankleshwar', 'Borsad'])   │
└──────────────────────────────────────────────────────────┘
              │
              ▼
     TalukaDetails.jsx loads
     ┌──────────────────────┐
     │ useEffect on mount   │
     │ Detects HR role      │
     │ Loads assigned       │
     │ talukas array        │
     └────────┬─────────────┘
              │
              ▼
     [Ankleshwar] [Borsad] ← Taluka Selector
              │
       Select 'Ankleshwar'
              │
              ▼
     Load taluka data
     GET /admin/taluka/Ankleshwar
     (with checkTalukaAccess middleware)
              │
              ▼
     Backend receives request
     Middleware runs:
       • Get user permissions
       • Check if HR and 
         'Ankleshwar' in assigned_talukas
       • ✅ Allow OR ❌ Deny
              │
              ▼
     Filter users WHERE taluko = 'Ankleshwar'
     Filter cars WHERE taluko = 'Ankleshwar'
     Filter washers WHERE taluko = 'Ankleshwar'
              │
              ▼
     Return data for Ankleshwar only
              │
              ▼
     Display in TalukaDetails
     ┌────────────────────┐
     │ Ankleshwar Stats   │
     │ • 45 customers     │
     │ • 12 cars          │
     │ • 8 washers        │
     │ • 142 bookings     │
     └────────────────────┘
```

---

## 4. Permission Matrix

```
┌─────────────┬──────────────┬──────────────┬──────────────┬─────────────┐
│ Action      │ Admin        │ Sub-Admin    │ HR           │ Washer      │
├─────────────┼──────────────┼──────────────┼──────────────┼─────────────┤
│ View Cities │ ✅ All       │ ✅ Assigned  │ ❌ No        │ ❌ No       │
│ View Taluka │ ✅ All       │ ✅ In Cities │ ✅ Assigned  │ ❌ No       │
│ View Wash A │ ✅ All       │ ✅ In Cities │ ✅ In Taluka │ ✅ Assigned │
│ Assign City │ ✅ Yes       │ ❌ No        │ ❌ No        │ ❌ No       │
│ Assign Tal  │ ✅ Yes       │ ✅ Own only  │ ❌ No        │ ❌ No       │
│ Assign Wash │ ✅ Yes       │ ❌ No        │ ✅ Own only  │ ❌ No       │
│ Assign User │ ✅ Yes       │ ✅ City only │ ✅ Tal only  │ ❌ No       │
└─────────────┴──────────────┴──────────────┴──────────────┴─────────────┘
```

---

## 5. Geographic Validation Flow

```
Sub-Admin wants to assign talukas to HR
    │
    ▼
Sub-Admin clicks "Assign to HR"
Input: Talukas = [Ankleshwar, Borsad]
    │
    ▼
Frontend validateSubAdminToHRAssignment()
    │
    ├─ Check: Is 'Ankleshwar' in GUJARATCITIES['Bharuch']?
    │          ✅ YES
    │
    ├─ Check: Is 'Borsad' in GUJARATCITIES['Anand']?
    │          ✅ YES
    │
    └─ Is Sub-Admin assigned to both cities?
       ✅ YES (assigned_cities: ['Bharuch', 'Anand'])
    │
    ▼
✅ VALIDATION PASSED
    │
    ▼
POST /admin/assign-talukas
{
  hrUserId: 'hr-1',
  talukas: ['Ankleshwar', 'Borsad']
}
    │
    ▼
Backend validateSubAdminToHRAssignment()
    │
    ├─ Re-check: Is 'Ankleshwar' in Bharuch? ✅
    ├─ Re-check: Is 'Borsad' in Anand? ✅
    ├─ Check: Is requester Sub-Admin? ✅
    │
    ▼
✅ BACKEND VALIDATION PASSED
    │
    ▼
Update profiles table:
UPDATE profiles SET assigned_talukas = ['Ankleshwar', 'Borsad']
WHERE id = 'hr-1'
    │
    ▼
✅ ASSIGNMENT COMPLETE
```

---

## 6. Request Flow with Middleware

```
HTTP Request from Frontend
    │
    ▼
GET /admin/taluka/Ankleshwar
    │
    ▼
Route Handler Receives Request
    │
    ▼
checkTalukaAccess(GUJARATCITIES) Middleware
    │
    ├─ Extract JWT token from header
    │ 
    ├─ Get user ID from token
    │
    ├─ Call getUserRoleAndAssignments(userId)
    │   └─ Query profiles table
    │   └─ Return: {role, assignedCities, assignedTalukas, ...}
    │
    ├─ Check user role:
    │   ├─ If Admin: ✅ ALLOW (all access)
    │   ├─ If Sub-Admin: Check 'Ankleshwar' in assigned_cities
    │   │                via GUJARATCITIES mapping
    │   │                ✅ ALLOW or ❌ DENY
    │   ├─ If HR: Check 'Ankleshwar' in assigned_talukas
    │   │         ✅ ALLOW or ❌ DENY
    │   └─ If Washer: ❌ DENY (no taluka access)
    │
    └─ req.userPermissions = {role, assignedCities, assignedTalukas, ...}
    
    If ✅ ALLOW:
    │
    ▼
    Route Handler Executes
    
    Get data with permissions:
    SELECT * FROM profiles 
    WHERE taluko = 'Ankleshwar'
    AND city = (Sub-Admin's city, if applicable)
    │
    ▼
    res.json(filteredData)
    
    If ❌ DENY:
    │
    ▼
    res.status(403).json({error: "Unauthorized"})
```

---

## 7. Component State Management

```
CityDetails.jsx State:
┌──────────────────────────────────┐
│ userRole: 'sub-admin'            │
│ isSubAdmin: true                 │
│ userCities: [                    │  ← Array of cities
│   'Bharuch (City)',              │    (not single value)
│   'Anand (City)'                 │
│ ]                                │
│ selectedCity: 'Bharuch (City)'   │  ← Currently selected
│ talukaData: [...]                │
│ usersData: [...]                 │
│ carsData: [...]                  │
└──────────────────────────────────┘

On selectedCity change:
    ▼
loadCityData(selectedCity)
    ├─ GET /admin/users?city=selectedCity
    ├─ GET /admin/cars?city=selectedCity
    └─ GET /admin/talukas?city=selectedCity


TalukaDetails.jsx State:
┌──────────────────────────────────┐
│ userRole: 'hr' or 'sub-admin'    │
│ isHR: true/false                 │
│ isSubAdmin: true/false           │
│ userTalukas: [                   │  ← Array of talukas
│   'Ankleshwar',                  │    (not single value)
│   'Borsad'                       │
│ ]                                │
│ selectedTaluko: 'Ankleshwar'     │  ← Currently selected
│ talukasData: {...}               │
│ usersData: [...]                 │
│ washersData: [...]               │
└──────────────────────────────────┘

On selectedTaluko change:
    ▼
loadTalukaData(selectedTaluko)
    ├─ GET /admin/users?taluka=selectedTaluko
    ├─ GET /admin/washers?taluka=selectedTaluko
    └─ GET /admin/bookings?taluka=selectedTaluko
```

---

## 8. Assignment Validation Logic

```
validateSubAdminToHRAssignment Flow:

Input:
  assignedCities: ['Bharuch (City)', 'Anand (City)']
  talukasToAssign: ['Ankleshwar', 'Petlad', 'InvalidTaluka']

Processing:
  ├─ For 'Ankleshwar':
  │   ├─ Is it in GUJARATCITIES['Bharuch']? ✅ YES
  │   ├─ Add to validTalukas
  │
  ├─ For 'Petlad':
  │   ├─ Is it in GUJARATCITIES['Anand']? ✅ YES
  │   ├─ Add to validTalukas
  │
  └─ For 'InvalidTaluka':
      ├─ Is it in ANY of assigned cities? ❌ NO
      ├─ Add to invalidTalukas

Output:
  {
    valid: false,
    validTalukas: ['Ankleshwar', 'Petlad'],
    invalidTalukas: ['InvalidTaluka'],
    error: "Cannot assign talukas outside your cities: InvalidTaluka"
  }

Frontend checks:
  if (!validation.valid) {
    showError(validation.error);
    return; // Don't submit
  }
```

---

## 9. Complete Assignment Journey

```
┌─────────────────────────────────────────────────────────────┐
│                    ADMIN (Dashboard)                        │
└─────────────────────────────────────────────────────────────┘
              │
              ├─ Creates Sub-Admin account
              │ Assigns: ['Bharuch', 'Anand'] cities
              │
              ▼
┌─────────────────────────────────────────────────────────────┐
│              SUB-ADMIN (CityDetails.jsx)                   │
│                                                              │
│  ✅ Sees: [Bharuch] [Anand] city selector                  │
│  ✅ Sees: All talukas under each city                      │
│  ✅ Can: Assign talukas to HR                              │
│  ❌ Cannot: See other cities                               │
│                                                              │
│  Action: Assign ['Ankleshwar', 'Borsad'] to HR            │
│          (all from their assigned cities)                  │
└─────────────────────────────────────────────────────────────┘
              │
              ├─ Validates in frontend
              ├─ Validates again in backend
              │ (double-check security)
              ▼
┌─────────────────────────────────────────────────────────────┐
│              HR (TalukaDetails.jsx)                         │
│                                                              │
│  ✅ Sees: [Ankleshwar] [Borsad] taluka selector           │
│  ✅ Sees: Only data from assigned talukas                 │
│  ✅ Can: Assign washers to wash areas                     │
│  ❌ Cannot: See other talukas                              │
│  ❌ Cannot: See city-level data                            │
│                                                              │
│  Action: Assign Washer1 to Ankleshwar-WA-01               │
│          Assign Washer2 to Borsad-WA-03                   │
└─────────────────────────────────────────────────────────────┘
              │
              ├─ Validates that wash areas are
              │  in assigned talukas
              │
              ▼
┌─────────────────────────────────────────────────────────────┐
│              WASHER (App Dashboard)                         │
│                                                              │
│  ✅ Sees: Only assigned wash areas                         │
│  ✅ Can: Accept bookings from those areas                  │
│  ❌ Cannot: See other areas or taluka data                │
└─────────────────────────────────────────────────────────────┘
```

---

## 10. Error Handling Flow

```
User tries invalid action:
    │
    ├─ Attempt: HR tries to see Taluka outside assignment
    │           ✅ Frontend validation: Can't select it (greyed out)
    │           ✅ If somehow sent: Backend 403 Unauthorized
    │
    ├─ Attempt: Sub-Admin tries to assign outside cities
    │           ✅ Frontend validation: Shows error
    │           ✅ Backend validation: Rejects with error
    │
    ├─ Attempt: HR tries to assign washer outside taluka
    │           ✅ Frontend validation: Can't select washer
    │           ✅ Backend validation: 400 Bad Request
    │
    └─ Attempt: Missing/invalid JWT token
                ❌ 401 Unauthorized

All errors include:
  ├─ Clear error message (what went wrong)
  ├─ User-friendly explanation
  └─ Suggested action to fix
```

---

**Visual Guide Version**: 1.0  
**Last Updated**: January 2, 2026  
**Use With**: ROLE_BASED_IMPLEMENTATION.md
