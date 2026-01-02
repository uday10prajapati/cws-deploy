# Role-Based Access Control (RBAC) System - Complete Documentation

## 🏗️ System Architecture

The RBAC system implements a hierarchical structure with strict geographic-based access control:

```
General (Level 4)
    ├── Sub-General (Level 3)
    │       ├── HR-General (Level 2)
    │       │       └── Salesman (Level 1)
```

## 📊 Roles & Permissions

### 1. **General (Super Admin)** - Level 4
- **Geographic Access**: ALL cities and talukas
- **Permissions**:
  - Assign ONE or MORE cities to Sub-Generals
  - View all data across the system
  - Cannot be assigned any geographic restrictions
- **Data Visibility**: All data from all cities and talukas
- **Route**: `/employee/rbac`

### 2. **Sub-General** - Level 3
- **Geographic Access**: Only assigned cities and their talukas
- **Permissions**:
  - Assign talukas (that belong to their cities) to HR-Generals
  - View all data within their assigned cities
  - Cannot access cities outside their assignment
- **Data Visibility**: All data from their assigned cities only
- **Route**: `/employee/sub-general-talukas`

### 3. **HR-General** - Level 2
- **Geographic Access**: Only assigned talukas
- **Permissions**:
  - Manage salesmen under their talukas
  - Assign talukas (single) to salesmen
  - View all data within their assigned talukas
  - Monitor salesman performance in their jurisdiction
- **Data Visibility**: All data from their assigned talukas only
- **Route**: `/employee/hr-general-salesmen`

### 4. **Salesman** - Level 1
- **Geographic Access**: Single assigned taluka only
- **Permissions**:
  - Add data (customers, cars, sales info) only for assigned taluka
  - View only their taluka's data
  - Cannot access other talukas
- **Data Visibility**: Only their assigned taluka's data

---

## 📍 Geographic Hierarchy

### City → Taluka Relationship
```
Bharuch City
    ├── Bharuch Taluka
    ├── Ankleshwar Taluka
    ├── Jambusar Taluka
    ├── Jhagadia Taluka
    ├── Amod Taluka
    ├── Vagra Taluka
    ├── Hansot Taluka
    └── Valia Taluka
```

### Rules:
1. **Sub-Generals** can only assign talukas that belong to their assigned cities
2. **HR-Generals** are assigned talukas from their Sub-General's cities
3. **Salesmen** receive a single taluka assignment from their HR-General
4. No cross-city taluka assignment is possible

---

## 🔄 Assignment Flow

### Step 1: General assigns cities to Sub-General
```
General → Assigns "Bharuch City" to Sub-General A
```

### Step 2: Sub-General assigns talukas to HR-General
```
Sub-General A → Assigns "Ankleshwar Taluka" to HR-General B
(Must belong to "Bharuch City")
```

### Step 3: HR-General assigns taluka to Salesman
```
HR-General B → Assigns "Ankleshwar Taluka" to Salesman C
(Single taluka assignment)
```

### Step 4: Salesman adds data
```
Salesman C → Can only add/view data for "Ankleshwar Taluka"
```

---

## 📋 Data Visibility Hierarchy

### Complete Data Flow Example:

```
Scenario:
- General can see: ALL cities and talukas
  └─ Bharuch City (assigned to Sub-General A)
      └─ Ankleshwar Taluka (assigned to HR-General B)
          └─ Salesman C data

Data Visibility:
1. Salesman C:
   - Can ONLY see: Ankleshwar Taluka data
   - Cannot see: Bharuch City or other talukas

2. HR-General B:
   - Can see: All Ankleshwar Taluka data
   - Can see: All salesmen under Ankleshwar
   - Cannot see: Other talukas or cities

3. Sub-General A:
   - Can see: ALL talukas in Bharuch City
   - Can see: All HR-Generals and Salesmen in Bharuch
   - Cannot see: Data from other cities

4. General:
   - Can see: ALL data everywhere
   - Can see: All roles and assignments
   - Full system visibility
```

---

## 🔐 Access Control Implementation

### Database Table: `user_role_assignments`
```sql
CREATE TABLE user_role_assignments (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  role VARCHAR(50) NOT NULL, -- 'general', 'sub-general', 'hr-general', 'salesman'
  assigned_cities TEXT[],     -- Cities (Sub-General, HR-General)
  assigned_talukas TEXT[],    -- Talukas (HR-General, Salesman)
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### RBAC Utility Functions

Located in `src/utils/rbacUtils.js`:

#### Key Functions:

1. **`hasAccessToCity(userRole, assignedCities, cityToCheck)`**
   - Returns: `true` if user can access the city

2. **`hasAccessToTaluka(userRole, assignedTalukas, talukaToCheck)`**
   - Returns: `true` if user can access the taluka

3. **`filterDataByUserPermissions(data, userRole, assignedCities, assignedTalukas)`**
   - Filters data based on user's geographic permissions
   - Prevents data leakage

4. **`assignCitiesToSubGeneral(subGeneralId, cities)`**
   - General only: Assign cities to Sub-General

5. **`assignTalukasToHRGeneral(hrGeneralId, talukas, cityContext)`**
   - Sub-General only: Assign talukas to HR-General

6. **`assignTalukaToSalesman(salesmanId, taluka)`**
   - HR-General only: Assign taluka to Salesman

---

## 📱 Pages & Routes

### General Management
- **Route**: `/employee/rbac`
- **Component**: `RoleBasedAccessControl.jsx`
- **Features**:
  - View all Sub-Generals
  - Assign/Edit city assignments
  - View hierarchy visualization
  - Delete assignments

### Sub-General Taluka Management
- **Route**: `/employee/sub-general-talukas`
- **Component**: `SubGeneralTalukaAssignment.jsx`
- **Features**:
  - View assigned cities
  - Manage HR-Generals
  - Assign talukas from their cities
  - Validate taluka-city relationship
  - Delete assignments

### HR-General Salesman Management
- **Route**: `/employee/hr-general-salesmen`
- **Component**: `HRGeneralSalesmanAssignment.jsx`
- **Features**:
  - View assigned talukas
  - Manage salesmen
  - Assign taluka (single) to salesman
  - Track salesman assignments
  - Delete assignments

---

## 🛡️ Security Features

### 1. Role-Based Access Control
- Enforced in UI (disable/hide options for unauthorized roles)
- Enforced in API (backend validation required)

### 2. Geographic Isolation
- Sub-Generals cannot access cities they're not assigned to
- HR-Generals cannot access talukas outside their jurisdiction
- Salesmen see only their assigned taluka

### 3. Hierarchical Validation
- Sub-General can only assign talukas from their cities
- HR-General can only assign talukas they own
- Salesmen cannot assign anything

### 4. Audit Trail
- `role_assignment_audit` table tracks all role changes
- Records who made the change and when
- Useful for compliance and debugging

### 5. Data Validation Trigger
- Database trigger validates geographic assignments
- Prevents invalid role-geographic combinations
- Ensures data integrity

---

## 🔧 Implementation Checklist

### Backend Setup:
- [ ] Run migration: `create_rbac_system.sql`
- [ ] Ensure `user_role_assignments` table exists
- [ ] Create indexes for performance
- [ ] Set up triggers for validation

### Frontend Setup:
- [ ] Import `rbacUtils.js` in relevant components
- [ ] Use `hasAccessToCity()` and `hasAccessToTaluka()` for access checks
- [ ] Filter data using `filterDataByUserPermissions()`
- [ ] Use `useRoleBasedRedirect()` hook for route protection

### Usage in Components:
```jsx
import { hasAccessToCity, filterDataByUserPermissions } from "../utils/rbacUtils";

// Check access
if (hasAccessToCity(userRole, assignedCities, "Bharuch")) {
  // User can access this city
}

// Filter data
const visibleData = filterDataByUserPermissions(
  allData,
  userRole,
  assignedCities,
  assignedTalukas
);
```

---

## ⚠️ Important Notes

1. **Salesmen assignment is ONE-TO-ONE**: Each salesman gets exactly ONE taluka
2. **Sub-General can have MULTIPLE cities**: Support for scalability
3. **HR-General can have MULTIPLE talukas**: Within their city context
4. **Data validation happens at database level**: Prevents bad data entry
5. **No horizontal privilege escalation**: Users cannot bypass their level

---

## 📞 Migration Instructions

Run this SQL in Supabase SQL Editor:

```sql
-- From file: backend/migrations/create_rbac_system.sql
-- Execute the entire file content
```

---

## 🎯 Example Scenario

**Company Structure**: CarWash with operations in Gujarat

```
1. General (Head Office)
   ├─ Assigns: ["Bharuch", "Surat"] to Sub-General-1

2. Sub-General-1 (Bharuch Operations)
   ├─ Can see: All talukas in Bharuch and Surat
   ├─ Assigns: ["Ankleshwar", "Bharuch"] to HR-General-1

3. HR-General-1 (Ankleshwar Manager)
   ├─ Can see: Only Ankleshwar taluka
   ├─ Manages: Salesman-1, Salesman-2
   ├─ Assigns: "Ankleshwar" to Salesman-1
   └─ Assigns: "Ankleshwar" to Salesman-2

4. Salesman-1 & Salesman-2
   ├─ Both work in: Ankleshwar taluka
   ├─ Can only see: Ankleshwar data
   └─ Can only add: Ankleshwar customer/car data
```

---

## 📊 Database Schema Summary

### Tables:
1. `user_role_assignments` - Main RBAC table
2. `role_assignment_audit` - Audit trail
3. `profiles` - Enhanced with geographic columns

### Views:
1. `user_roles_with_profiles` - Simplified access to role data

### Functions:
1. `validate_geographic_assignment()` - Trigger function

### Indexes:
- `idx_user_role_assignments_role`
- `idx_user_role_assignments_user_id`
- `idx_role_assignment_audit_user_id`
- `idx_role_assignment_audit_changed_at`

---

**Version**: 1.0  
**Last Updated**: December 2025  
**Status**: Production Ready
