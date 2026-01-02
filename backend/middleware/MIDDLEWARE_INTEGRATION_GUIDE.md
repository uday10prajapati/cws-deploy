# Backend Middleware Integration Guide

## Quick Start - How to Use the New Middleware

### 1. Import the Middleware in Your Routes
```javascript
const { 
  checkCityAccess, 
  checkTalukaAccess, 
  checkWashAreaAccess,
  validateSubAdminToHRAssignment,
  validateHRToWasherAssignment 
} = require('../middleware/roleBasedAccessMiddleware');
const { GUJARATCITIES } = require('../constants/gujaratConstants');
```

### 2. Protect Routes That Need Geographic Access
```javascript
// Protect routes that need city-level access
router.get('/admin/city/:cityName', 
  checkCityAccess(GUJARATCITIES), 
  async (req, res) => {
    // Only Sub-Admin/Admin with access to this city reaches here
    // User info available in: req.userId, req.userRole, req.userPermissions
  }
);

// Protect routes that need taluka-level access
router.get('/admin/taluka/:talukaName', 
  checkTalukaAccess(GUJARATCITIES), 
  async (req, res) => {
    // Only Sub-Admin/HR with access to this taluka reaches here
  }
);

// Protect routes that need wash area access
router.post('/admin/assign-washers', 
  checkWashAreaAccess(), 
  async (req, res) => {
    // Only HR with access to wash area reaches here
  }
);
```

### 3. Validate Assignments Before Saving
```javascript
// When Sub-Admin assigns talukas to HR
router.post('/admin/assign-hr', async (req, res) => {
  const { hrId, talukasToAssign } = req.body;
  
  // Get Sub-Admin's permissions
  const subAdminData = await getUserRoleAndAssignments(req.userId);
  
  // Validate that talukas belong to Sub-Admin's cities
  const validation = validateSubAdminToHRAssignment(
    subAdminData,
    talukasToAssign,
    GUJARATCITIES
  );
  
  if (!validation.valid) {
    return res.status(400).json({ error: validation.error });
  }
  
  // Safe to proceed - update HR's assigned_talukas
  // ... update database ...
});

// When HR assigns washers to wash areas
router.post('/admin/assign-washer', async (req, res) => {
  const { washerId, washAreaTaluka } = req.body;
  
  // Get HR's permissions
  const hrData = await getUserRoleAndAssignments(req.userId);
  
  // Validate that wash area belongs to HR's talukas
  const validation = validateHRToWasherAssignment(
    hrData,
    washAreaTaluka,
    GUJARATCITIES
  );
  
  if (!validation.valid) {
    return res.status(400).json({ error: validation.error });
  }
  
  // Safe to proceed - assign washer
  // ... update database ...
});
```

### 4. Filter Data by User Permissions
```javascript
// Get data with role-based filtering
router.get('/admin/users', checkTalukaAccess(GUJARATCITIES), async (req, res) => {
  const { userRole, userPermissions } = req;
  
  let query = supabase.from('profiles').select('*');
  
  // Filter based on role
  if (userRole === 'sub-admin') {
    // Sub-Admin: show users from assigned cities
    query = query.in('city', userPermissions.assignedCities);
  } else if (userRole === 'hr') {
    // HR: show users from assigned talukas
    query = query.in('taluko', userPermissions.assignedTalukas);
  } else if (userRole === 'admin') {
    // Admin: show all users
  }
  
  const { data } = await query;
  res.json(data);
});
```

---

## Function Reference

### getUserRoleAndAssignments(userId)
Returns complete permission data for a user.

**Usage:**
```javascript
const permissions = await getUserRoleAndAssignments('user-id');
// Returns:
// {
//   userId: 'user-id',
//   role: 'sub-admin',
//   assignedCities: ['Bharuch (City)', 'Anand (City)'],
//   assignedTalukas: ['Ankleshwar', 'Borsad', ...],
//   assignedWashAreas: ['WA-001', 'WA-002']
// }
```

### validateSubAdminToHRAssignment(subAdminData, talukasToAssign, gujaratCities)
Validates that all talukas belong to Sub-Admin's assigned cities.

**Usage:**
```javascript
const validation = validateSubAdminToHRAssignment(
  { assignedCities: ['Bharuch (City)'] },
  ['Ankleshwar', 'Borsad'],
  GUJARATCITIES
);

if (!validation.valid) {
  console.log(validation.error);
  // Error: "Taluka 'Borsad' does not belong to your assigned cities"
}
```

### validateHRToWasherAssignment(hrData, washAreaTaluka, gujaratCities)
Validates that wash area's taluka belongs to HR's assigned talukas.

**Usage:**
```javascript
const validation = validateHRToWasherAssignment(
  { assignedTalukas: ['Ankleshwar', 'Borsad'] },
  'Ankleshwar',
  GUJARATCITIES
);

if (!validation.valid) {
  console.log(validation.error);
  // Error: "Wash area taluka is not in your assigned talukas"
}
```

### checkCityAccess(gujaratCities)
Middleware that checks if user can access specified city.

**What it does:**
1. Gets user's role and permissions
2. Checks if user has access to the city in request
3. Attaches permission data to `req.userPermissions`
4. Returns 403 if unauthorized

**Usage:**
```javascript
router.get('/admin/city/:cityName', checkCityAccess(GUJARATCITIES), handler);
```

### checkTalukaAccess(gujaratCities)
Middleware that checks if user can access specified taluka.

**What it does:**
1. Gets user's role and permissions
2. Validates taluka against user's role:
   - Admin: All access
   - Sub-Admin: Only talukas in assigned cities
   - HR: Only assigned talukas
3. Returns 403 if unauthorized

### checkWashAreaAccess()
Middleware that checks if user can access wash area.

**What it does:**
1. Only allows HR and Admin
2. Returns 403 if washer tries to access

---

## Example: Complete Assignment Flow

### Backend Endpoint
```javascript
router.post('/admin/assign-talukas-to-hr', async (req, res) => {
  try {
    const { hrUserId, talukasToAssign } = req.body;
    
    // Step 1: Get request maker's permissions
    const subAdminData = await getUserRoleAndAssignments(req.userId);
    
    // Step 2: Validate Sub-Admin's role
    if (subAdminData.role !== 'sub-admin') {
      return res.status(403).json({ 
        error: 'Only Sub-Admin can assign talukas' 
      });
    }
    
    // Step 3: Validate assignment is legal
    const validation = validateSubAdminToHRAssignment(
      subAdminData,
      talukasToAssign,
      GUJARATCITIES
    );
    
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }
    
    // Step 4: Update HR's assigned talukas
    const { error } = await supabase
      .from('profiles')
      .update({ assigned_talukas: talukasToAssign })
      .eq('id', hrUserId);
    
    if (error) throw error;
    
    // Step 5: Return success
    res.json({ 
      success: true, 
      message: `Assigned ${talukasToAssign.length} talukas to HR` 
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

---

## Route Protection Summary

| Route | Middleware | Purpose |
|-------|-----------|---------|
| `/admin/city/:city` | `checkCityAccess()` | Only Sub-Admin with city access |
| `/admin/taluka/:taluka` | `checkTalukaAccess()` | Sub-Admin/HR with taluka access |
| `/admin/wash-area/:area` | `checkWashAreaAccess()` | HR/Admin with area access |
| `/admin/assign-hr` | Manual validation + middleware | Sub-Admin assigns talukas |
| `/admin/assign-washer` | Manual validation + middleware | HR assigns washers |

---

## Testing the Middleware

### Test 1: Sub-Admin Can Access Own City
```javascript
// User: Sub-Admin assigned to ['Bharuch (City)']
GET /admin/city/Bharuch (City) → ✅ 200 OK
GET /admin/city/Anand (City) → ❌ 403 Forbidden
```

### Test 2: HR Can Access Own Taluka
```javascript
// User: HR assigned to ['Ankleshwar', 'Borsad']
GET /admin/taluka/Ankleshwar → ✅ 200 OK
GET /admin/taluka/Khimaj → ❌ 403 Forbidden
```

### Test 3: Assignment Validation
```javascript
// User: Sub-Admin assigned to ['Bharuch (City)']
POST /admin/assign-talukas-to-hr {
  talukasToAssign: ['Ankleshwar', 'Borsad']  // Both in Bharuch
} → ✅ 200 OK

POST /admin/assign-talukas-to-hr {
  talukasToAssign: ['Petlad', 'Borsad']  // Petlad NOT in Bharuch
} → ❌ 400 Bad Request
```

---

**Version**: 1.0  
**Status**: Ready for Integration  
**Last Updated**: January 2, 2026
