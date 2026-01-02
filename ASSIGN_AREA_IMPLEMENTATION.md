# AssignArea Component - RBAC Hierarchical Implementation

## Overview
The `AssignArea` component has been completely rewritten to implement the hierarchical Role-Based Access Control (RBAC) system with geographic-based area assignments.

## Architecture

### Role Hierarchy Flow
```
General (🔴)
    ↓ Assigns Cities to...
Sub-General (🟠)
    ↓ Assigns Talukas from their Cities to...
HR-General (🟡)
    ↓ Assigns Talukas to...
Salesman (🟢)
```

### Geographic Hierarchy
```
City (e.g., "Ahmedabad (City)")
  ├── Taluka 1 (e.g., "Ahmedabad City East")
  ├── Taluka 2 (e.g., "Ahmedabad City West")
  ├── Taluka 3 (e.g., "Daskroi")
  └── ... (up to 10 talukas per city)
```

## Key Features

### 1. **General Role View** (🔴)
- **Access**: Only `employee_type: "general"`
- **Capability**: Assign multiple cities to Sub-Generals
- **Display**: Shows all 24 cities with assignment status
- **Actions**: 
  - View all Sub-Generals
  - Click "Edit" button to open modal
  - Multi-select cities from GUJARAT_CITIES
  - Save assignments to database
- **Stats Dashboard**:
  - Total Sub-Generals
  - Cities in System

### 2. **Sub-General Role View** (🟠)
- **Access**: Only `employee_type: "sub-general"`
- **Capability**: Assign single taluka to each Salesman
- **Visibility**: Only sees Salesmen whose talukas are within their assigned cities
- **Actions**:
  - View all Salesmen under jurisdiction
  - Click "Edit" to assign/modify taluka
  - Click "Remove" to delete assignment
  - Search Salesmen by name or email
- **Constraints**:
  - Can only assign talukas from their cities
  - Each Salesman gets ONE taluka
  - City dropdown populated with their cities
- **Stats Dashboard**:
  - Total Salesmen under supervision
  - Their assigned Cities count
  - Their available Talukas count

### 3. **HR-General Role View** (🟡)
- **Access**: Only accessible through `SubGeneralTalukaAssignment.jsx`
- **Note**: AssignArea supports General and Sub-General only
- **For HR-General assignments**: Use `/employee/sub-general-talukas` route

## Data Flow

### State Management
```javascript
// User Info
- user: Current logged-in user
- userRole: "general" | "sub-general" | null

// General Role States
- subGenerals: Array of Sub-General records with city assignments
- selectedSubGeneral: Current Sub-General being edited
- selectedCitiesForSubGeneral: Cities selected in modal
- showSubGeneralModal: Modal visibility

// Sub-General Role States
- assignedCities: Cities assigned to current Sub-General user
- salesmen: Array of Salesmen in jurisdiction
- selectedSalesman: Current Salesman being edited
- selectedCityForTaluka: City selected for taluka filtering
- selectedTalukasForSalesman: Taluka selected for Salesman
- showSalesmanModal: Modal visibility
- areaAssignments: View of current assignments (filtered salesmen)
- searchTerm: Search filter for Salesmen list

// Utility States
- isSaving: Loading state for async operations
- loading: Initial load state
```

### Database Integration

#### Table: `user_role_assignments`
```sql
- user_id (FK to auth.users)
- role (ENUM: "general", "sub-general", "hr-general", "salesman")
- assigned_cities (ARRAY of strings) -- For General & Sub-General
- assigned_talukas (ARRAY of strings) -- For HR-General & Salesman
- created_at (timestamp)
- updated_at (timestamp)

PRIMARY KEY: (user_id, role)
```

#### Data Example
```javascript
// General assigns cities to Sub-General
{
  user_id: "sub-general-uuid",
  role: "sub-general",
  assigned_cities: ["Ahmedabad (City)", "Surat (City)"],
  assigned_talukas: [],
  updated_at: "2024-01-15T10:30:00Z"
}

// Sub-General assigns taluka to Salesman
{
  user_id: "salesman-uuid",
  role: "salesman",
  assigned_cities: [],
  assigned_talukas: ["Ahmedabad City East"],
  updated_at: "2024-01-15T11:45:00Z"
}
```

## Component Functions

### Utility Functions (from `rbacUtils.js`)
- `getTalukasForCity(city)` - Returns array of talukas for a city
- `ROLES` - Constant with role values: GENERAL, SUB_GENERAL, HR_GENERAL, SALESMAN

### Data Loading Functions
```javascript
loadUser() // Fetch current user and role
loadSubGenerals() // Get all Sub-Generals with their city assignments
loadSalesmen() // Get Salesmen filtered by Sub-General's jurisdiction
loadAreaAssignments() // Get current assignments for Sub-General
```

### Modal Management Functions
```javascript
// General Functions
openSubGeneralModal(subGeneral)
closeSubGeneralModal()
toggleCityForSubGeneral(city)
saveSubGeneralCities()

// Sub-General Functions
openSalesmanModal(salesman)
closeSalesmanModal()
toggleTalukaForSalesman(taluka)
saveSalesmanTaluka()
deleteSalesmanAssignment(userId)
```

## Imports & Dependencies

### Required Components
```javascript
import { useEffect, useState } from "react";
import { FiRefreshCw, FiX, FiCheck, FiEdit2, FiTrash2, FiMapPin } from "react-icons/fi";
import { supabase } from "../supabaseClient";
import NavbarNew from "../components/NavbarNew";
import { useRoleBasedRedirect } from "../utils/roleBasedRedirect";
import { ROLES } from "../utils/rbacUtils";
import { GUJARATCITIES, getTalukasForCity } from "../constants/gujaratConstants";
```

### Role-Based Access Control
```javascript
useRoleBasedRedirect(["employee"]) // Only allows "employee" role in profiles.role
```

## UI/UX Features

### Visual Hierarchy
- **General (🔴)**: Red accent colors (red-50, red-100, red-600)
- **Sub-General (🟠)**: Orange accent colors (orange-50, orange-100, orange-600)
- **Cards**: Show role emoji + title + description
- **Badges**: Display assigned items with appropriate colors

### User Feedback
- ✅ Success alerts after operations
- ⚠️ Warning badges for missing assignments
- 📍 Location icons for geographic assignments
- 🔄 Refresh buttons for manual reload
- Search functionality for finding users

### Responsive Design
- Mobile-first approach with Tailwind CSS
- Grid layouts that adjust from 1 to 2-3 columns
- Full-height modals with scrolling for lists
- Fixed action buttons at bottom of modals

### Modal Features
- Semi-transparent backdrop (`bg-black bg-opacity-50`)
- Overflow scrollable content (`max-h-[90vh] overflow-y-auto`)
- Grid selection layouts with hover effects
- Disabled states for buttons (when no selection or saving)
- Loading spinners on save operations

## Examples

### Example 1: General Assigning Cities
1. General user logs in and navigates to `/employee/assign-areas`
2. Sees list of all Sub-Generals with their current cities
3. Clicks "Edit" on a Sub-General
4. Multi-select cities from all 24 cities
5. Clicks "Save Changes"
6. System updates `user_role_assignments` table

### Example 2: Sub-General Assigning Talukas
1. Sub-General user navigates to `/employee/assign-areas`
2. System shows:
   - Their assigned cities: "Ahmedabad (City), Surat (City)"
   - Salesmen under their jurisdiction
3. Clicks "Edit" on a Salesman
4. Modal opens with city dropdown (only their 2 cities)
5. Selects city "Ahmedabad (City)"
6. Radio-button selects one taluka: "Ahmedabad City East"
7. Clicks "Save Changes"
8. System updates Salesman's `assigned_talukas` array

### Example 3: Sub-General Viewing Assignments
1. Sub-General sees dashboard with stats:
   - "Total Salesmen: 15"
   - "Your Cities: 2"
   - "Your Talukas: 18"
2. Scrolls through list of Salesmen with their talukas
3. Searches for "Rajesh" to find specific Salesman
4. Can remove assignment if needed

## Validation & Constraints

### General Constraints
- Requires at least one city selection
- Cities must exist in GUJARAT_CITIES object

### Sub-General Constraints
- Can only assign talukas from their assigned cities
- Requires exactly one taluka per Salesman
- City dropdown only shows their assigned cities
- Search is case-insensitive

### Database Constraints
- `upsert` operation ensures unique (user_id, role) combination
- Audit table tracks all changes via trigger
- Timestamp auto-updates on each modification

## Integration Points

### Connected Components
1. **NavbarNew.jsx** - Has link to `/employee/assign-areas`
2. **EmployeeDashboard.jsx** - Has card link to area assignment
3. **RoleBasedAccessControl.jsx** - General management alternative
4. **SubGeneralTalukaAssignment.jsx** - Sub-General management alternative

### API Routes (Backend)
- No backend routes used - fully Supabase-based
- All data managed through Supabase tables:
  - `user_role_assignments` (main data)
  - `role_assignment_audit` (audit trail)

## Testing Checklist

- [ ] General user can see all Sub-Generals
- [ ] General can assign multiple cities to Sub-General
- [ ] Sub-General sees only their assigned cities
- [ ] Sub-General can assign one taluka to Salesman
- [ ] Taluka dropdown only shows talukas from selected city
- [ ] Sub-General cannot see Salesmen outside their jurisdiction
- [ ] Search functionality works for both user types
- [ ] Delete operation removes assignment correctly
- [ ] Refresh button reloads latest data
- [ ] Modal properly closes on cancel/save
- [ ] Responsive design works on mobile/tablet/desktop
- [ ] Loading spinners appear during save operations
- [ ] Success alerts appear after operations
- [ ] Error handling shows appropriate messages

## File Locations
- **Component**: `/frontend/src/Employee/AssignArea.jsx` (603 lines)
- **Constants**: `/frontend/src/constants/gujaratConstants.js`
- **RBAC Utils**: `/frontend/src/utils/rbacUtils.js`
- **Role Redirect**: `/frontend/src/utils/roleBasedRedirect.js`
- **Routes**: `/frontend/src/App.jsx` (line 117)
- **Navbar Link**: `/frontend/src/components/NavbarNew.jsx` (line 161)

## Recent Changes (This Session)

### What Was Changed
1. **Old Implementation**: Basic salesperson area assignment with hardcoded GUJARAT_AREAS (7 cities)
2. **New Implementation**: 
   - Full RBAC hierarchy with 4 roles
   - Dynamic GUJARAT_CITIES with 24 cities and 150+ talukas
   - Proper geographic validation and filtering
   - Separate workflows for General and Sub-General

### Key Improvements
- ✅ Implemented hierarchical role assignments
- ✅ Geographic-based access control
- ✅ Centralized GUJARATCITIES constant (instead of hardcoded)
- ✅ Database-backed persistence
- ✅ Role-based UI rendering
- ✅ Audit trail support
- ✅ Search and filter functionality
- ✅ Better error handling and user feedback
