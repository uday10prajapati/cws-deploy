# Quick Reference Card - Role-Based Access Control

## 🎯 At a Glance

### Role Hierarchy
```
Admin → Sub-Admin → HR → Washer
(Full) → (Cities) → (Talukas) → (Wash Areas)
```

### Sub-Admin Access
- Can see: All cities assigned by Admin
- Can see: ALL talukas under those cities  
- Can assign: Talukas to HR
- Cannot assign: Talukas outside their cities

### HR Access
- Can see: ONLY assigned talukas
- Cannot see: City-level data
- Can assign: Washers to wash areas
- Cannot assign: Washers outside their talukas

---

## 🔧 Backend - Protect Routes

### Import Middleware
```javascript
const { checkTalukaAccess, validateSubAdminToHRAssignment } = 
  require('../middleware/roleBasedAccessMiddleware');
const { GUJARATCITIES } = require('../constants/gujaratConstants');
```

### Protect Route
```javascript
router.get('/admin/taluka/:taluka', 
  checkTalukaAccess(GUJARATCITIES), 
  async (req, res) => {
    // User permissions in: req.userPermissions
    // User role in: req.userRole
  }
);
```

### Validate Assignment
```javascript
const validation = validateSubAdminToHRAssignment(
  { assignedCities: ['Bharuch (City)'] },
  ['Ankleshwar', 'Borsad'],
  GUJARATCITIES
);

if (!validation.valid) {
  return res.status(400).json({ error: validation.error });
}
```

---

## 🎨 Frontend - Check Permissions

### Import Utilities
```javascript
import { 
  getTalukasForCity,
  filterUsersByGeographicAccess,
  validateSubAdminToHRAssignment 
} from './Admin/roleBasedAccessControl';
```

### Check Geography
```javascript
const talukas = getTalukasForCity('Bharuch (City)');
// ['Ankleshwar', 'Jambusar', 'Jhagadia', ...]

const exists = talukaExistsInCity('Bharuch (City)', 'Ankleshwar');
// true
```

### Filter Data
```javascript
const filtered = filterUsersByGeographicAccess(
  allUsers,
  'sub-admin',
  ['Bharuch (City)'],
  []
);
// Only users from Bharuch city
```

### Validate Before Submit
```javascript
const validation = validateSubAdminToHRAssignment(
  ['Bharuch (City)'],
  selectedTalukas
);

if (!validation.valid) {
  showError(`Cannot assign: ${validation.invalidTalukas.join(', ')}`);
  return;
}
// Safe to submit to API
```

---

## 📊 Database Fields

### Profiles Table
```sql
role VARCHAR(50)              -- 'admin', 'sub-admin', 'hr', 'washer'
city VARCHAR(100)             -- Current city/taluka context
taluko VARCHAR(100)           -- Current taluka (if applicable)
assigned_cities TEXT[]        -- For Sub-Admin only
assigned_talukas TEXT[]       -- For Sub-Admin and HR
assigned_wash_areas TEXT[]    -- For Washer only
```

### Example Sub-Admin
```javascript
{
  id: 'subadmin-1',
  role: 'sub-admin',
  assigned_cities: ['Bharuch (City)', 'Anand (City)'],
  city: 'Bharuch (City)'
}
```

### Example HR
```javascript
{
  id: 'hr-1',
  role: 'hr',
  assigned_talukas: ['Ankleshwar', 'Borsad'],
  city: 'Bharuch (City)',
  taluko: 'Ankleshwar'
}
```

---

## 🚨 Common Errors & Fixes

### Error: "Taluka does not belong to assigned cities"
**Cause**: Trying to assign taluka outside Sub-Admin's cities  
**Fix**: Check GUJARATCITIES mapping, ensure taluka is under a city Sub-Admin controls

### Error: "403 Unauthorized"
**Cause**: User doesn't have permission for this geographic area  
**Fix**: Verify user's assigned_cities/assigned_talukas in database

### Error: "User not found in request"
**Cause**: Middleware not being used on route  
**Fix**: Add `checkTalukaAccess(GUJARATCITIES)` middleware to route

### Data not filtering by role
**Cause**: Not using req.userPermissions from middleware  
**Fix**: Add filter to query: `.in('city', req.userPermissions.assignedCities)`

---

## ✅ Testing Checklist

### Quick Test (5 minutes)
- [ ] Sub-Admin can see assigned cities
- [ ] Sub-Admin cannot see unassigned cities
- [ ] HR can see assigned talukas
- [ ] HR cannot see unassigned talukas

### Full Test (15 minutes)
- [ ] Sub-Admin can switch cities
- [ ] Sub-Admin can assign talukas to HR
- [ ] HR can switch talukas
- [ ] HR can assign washers
- [ ] Invalid assignments blocked
- [ ] 403 returned for unauthorized access

---

## 🔍 Debug Commands

### Check Talukas for City
```javascript
import { getTalukasForCity } from './Admin/roleBasedAccessControl';
console.log(getTalukasForCity('Bharuch (City)'));
// ['Ankleshwar', 'Jambusar', 'Jhagadia', 'Amod', 'Vagra', 'Hansot', 'Valia']
```

### Verify Taluka in City
```javascript
import { talukaExistsInCity } from './Admin/roleBasedAccessControl';
console.log(talukaExistsInCity('Bharuch (City)', 'Ankleshwar'));
// true
console.log(talukaExistsInCity('Bharuch (City)', 'Petlad'));
// false
```

### Print Permission Summary
```javascript
import { logPermissionHierarchy } from './Admin/roleBasedAccessControl';
logPermissionHierarchy('sub-admin', 
  ['Bharuch (City)', 'Anand (City)'], 
  []);
// Prints detailed permission matrix
```

---

## 🌐 API Endpoints Pattern

### Protected Endpoints (Use Middleware)
```
GET  /admin/taluka/:taluka       → checkTalukaAccess()
GET  /admin/users                → checkTalukaAccess()
GET  /admin/cars                 → checkTalukaAccess()
POST /admin/assign-washers       → checkWashAreaAccess()
```

### Assignment Endpoints (Use Validation)
```
POST /admin/assign-cities     → validateSubAdminToHRAssignment()
POST /admin/assign-talukas    → validateSubAdminToHRAssignment()
POST /admin/assign-washers    → validateHRToWasherAssignment()
```

---

## 🎯 Key Rules to Remember

1. **Sub-Admin sees ENTIRE cities, not single talukas**
   - Assigned City = Can see ALL talukas under that city
   - NOT assigned to specific talukas like HR

2. **HR sees ONLY assigned talukas**
   - Cannot see city-level data
   - Can only assign washers to their talukas

3. **Geographic Hierarchy is Law**
   - GUJARATCITIES defines truth
   - All validation checks against this
   - Never trust user input for geography

4. **Validate on Both Frontend AND Backend**
   - Frontend: Better UX
   - Backend: Security (user could bypass frontend)

5. **Use req.userPermissions from Middleware**
   - Set by checkTalukaAccess/checkCityAccess
   - Contains: role, assignedCities, assignedTalukas, assignedWashAreas

---

## 📞 File Locations Quick Reference

| Need | File |
|------|------|
| Backend middleware | `backend/middleware/roleBasedAccessMiddleware.js` |
| Frontend utilities | `frontend/src/Admin/roleBasedAccessControl.js` |
| Implementation guide | `frontend/src/Admin/ROLE_BASED_IMPLEMENTATION.md` |
| Integration guide | `backend/middleware/MIDDLEWARE_INTEGRATION_GUIDE.md` |
| Checklist | `IMPLEMENTATION_CHECKLIST.md` |
| This quick ref | `QUICK_REFERENCE.md` |

---

## 🚀 Common Tasks

### Task: Add Role-Based Filter to GET /users
```javascript
router.get('/admin/users', checkTalukaAccess(GUJARATCITIES), async (req, res) => {
  let query = supabase.from('profiles').select('*');
  
  if (req.userRole === 'sub-admin') {
    query = query.in('city', req.userPermissions.assignedCities);
  } else if (req.userRole === 'hr') {
    query = query.in('taluko', req.userPermissions.assignedTalukas);
  }
  
  const { data } = await query;
  res.json(data);
});
```

### Task: Create Assignment Form
```javascript
const handleAssignTaluka = async (taluka) => {
  // Step 1: Validate client-side
  const validation = validateSubAdminToHRAssignment(
    userCities,
    [taluka]
  );
  
  if (!validation.valid) {
    showError('Cannot assign this taluka');
    return;
  }
  
  // Step 2: Send to API
  const response = await fetch('/admin/assign-talukas', {
    method: 'POST',
    body: JSON.stringify({ hrId, taluka })
  });
  
  if (!response.ok) {
    showError('Assignment failed');
    return;
  }
  
  showSuccess('Taluka assigned!');
};
```

### Task: Protect Route with Middleware
```javascript
const { checkCityAccess } = require('../middleware/roleBasedAccessMiddleware');
const { GUJARATCITIES } = require('../constants/gujaratConstants');

// Add to route
router.post('/admin/city-analytics/:city',
  checkCityAccess(GUJARATCITIES),
  async (req, res) => {
    // Only authorized users reach here
  }
);
```

---

## 💾 State Management Pattern

### Frontend Component
```javascript
// State
const [userRole, setUserRole] = useState('');
const [userCities, setUserCities] = useState([]);  // Array!
const [selectedCity, setSelectedCity] = useState('');
const [userTalukas, setUserTalukas] = useState([]);  // Array!
const [selectedTaluko, setSelectedTaluko] = useState('');

// On mount
useEffect(() => {
  if (profile.role === 'sub-admin') {
    setUserCities(profile.assigned_cities || []);
    if (profile.assigned_cities?.length > 0) {
      setSelectedCity(profile.assigned_cities[0]);
    }
  }
}, [profile]);

// On city change
useEffect(() => {
  loadCityData(selectedCity);
}, [selectedCity]);
```

---

**Version**: 1.0  
**Last Updated**: January 2, 2026  
**Quick Lookup**: Keep this handy while integrating!
