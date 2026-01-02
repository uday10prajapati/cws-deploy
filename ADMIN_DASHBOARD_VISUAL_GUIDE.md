# Admin Dashboard - Role-Based Access Visual Guide

## Dashboard Layout After Login

### FOR SUB-ADMIN 👤
```
┌─────────────────────────────────────────────────────────────┐
│                    Admin Dashboard 🎯                        │
├──────────────────────────────────────────┬──────────────────┤
│                                          │ Role: Sub-Admin  │
│  Description: Manage bookings, users     │ 📍 City & Taluko │
│  and track business metrics              │    Access        │
│                                          │ City: All ✅      │
│                                          │ Taluko: Pune ✅   │
└─────────────────────────────────────────┴──────────────────┘

QUICK ACTIONS (6 items visible):
┌────────────┬────────────┬────────────┐
│ Approvals  │  Users     │ Earnings   │
└────────────┴────────────┴────────────┘
┌────────────┬────────────┬────────────┐
│ Analytics  │ City       │ Taluka     │
│            │ Details ⭐ │ Details    │
└────────────┴────────────┴────────────┘

YOUR ACCESS MATRIX (3 columns):
┌─────────────────────────────────────────────────────────────┐
│                                                              │
│  [Sub-Admin Card]    [Access Matrix]    [Quick Ref Card]   │
│                                                              │
│  City: ✅ Full       City: ✅ Yes       City Details: ✅    │
│  Taluko: ✅ Limited  Taluko: ✅ Yes     Taluko Details: ✅  │
│  Dashboard: ✅       Employee: ✅       Analytics: ✅       │
│                      Analytics: ✅                           │
│                                                              │
└─────────────────────────────────────────────────────────────┘

QUICK LINKS (2 cards):
┌──────────────────────────┬──────────────────────────┐
│  📍 City Details         │  📍 Taluka Details       │
│  (Blue Card)             │  (Green Card)            │
│  • City-Wide Access      │  • Taluko Management     │
│  • Users, Cars, Bookings │  • Detailed Analytics    │
│  • Taluka Breakdown      │  • Employee Tracking     │
└──────────────────────────┴──────────────────────────┘
```

---

### FOR HR 👥
```
┌─────────────────────────────────────────────────────────────┐
│                    Admin Dashboard 🎯                        │
├──────────────────────────────────────────┬──────────────────┤
│                                          │ Role: HR         │
│  Description: Manage bookings, users     │ 📍 Taluko Access │
│  and track business metrics              │    Only          │
│                                          │ Taluko: Pune ✅  │
│                                          │ City: Restricted ❌
└─────────────────────────────────────────┴──────────────────┘

QUICK ACTIONS (5 items visible - NO City Details):
┌────────────┬────────────┬────────────┐
│ Approvals  │  Users     │ Earnings   │
└────────────┴────────────┴────────────┘
┌────────────┬────────────┐
│ Analytics  │ Taluka     │
│            │ Details    │
└────────────┴────────────┘

YOUR ACCESS MATRIX (3 columns):
┌─────────────────────────────────────────────────────────────┐
│                                                              │
│  [HR Card]           [Access Matrix]     [Quick Ref Card]   │
│                                                              │
│  City: ❌ Restricted City: ❌ No         City Details: ❌   │
│  Taluko: ✅ Limited  Taluko: ✅ Yes     Taluko Details: ✅  │
│  Dashboard: ✅       Employee: ✅       Analytics: ✅       │
│                      Analytics: ✅                           │
│                                                              │
└─────────────────────────────────────────────────────────────┘

QUICK LINKS (1 card only):
┌──────────────────────────┐
│  📍 Taluka Details       │
│  (Green Card)            │
│  • Employee Tracking     │
│  • Taluko Data Viewing   │
│  • Booking Analytics     │
└──────────────────────────┘
```

---

## Key Differences Summary

| Feature | Sub-Admin | HR |
|---------|-----------|-----|
| **Role Badge** | Blue "City & Taluko" | Green "Taluko Only" |
| **City Access** | ✅ Full | ❌ Restricted |
| **Taluko Access** | ✅ Limited | ✅ Limited |
| **City Details Link** | ✅ Visible | ❌ Hidden |
| **Taluka Details Link** | ✅ Visible | ✅ Visible |
| **Dashboard Scope** | City + Taluko | Taluko Only |
| **Quick Actions** | 6 buttons | 5 buttons |
| **Access Matrix** | Shows both | Shows both |

---

## Color Scheme

### Sub-Admin Colors 🔵
- **Background**: Blue-50 → Cyan-50 (Gradient)
- **Border**: Blue-300 (2px)
- **Icon Background**: Blue-600 → Cyan-600
- **Badge Text**: Blue-900

### HR Colors 🟢
- **Background**: Green-50 → Emerald-50 (Gradient)
- **Border**: Green-300 (2px)
- **Icon Background**: Green-600 → Emerald-600
- **Badge Text**: Green-900

### Reference/Comparison 🟡
- **Background**: Amber-50 → Orange-50 (Gradient)
- **Border**: Amber-300 (2px)
- **Icon Background**: Amber-600 → Orange-600
- **Badge Text**: Amber-900

---

## Component Hierarchy

```
AdminDashboard
├── Navbar
├── Welcome Section
│   └── Role Display Badge (Blue or Green)
├── Quick Actions Grid (Filtered by role)
├── Stat Cards
├── Charts & Analytics
├── Access Matrix Section (New)
│   ├── Sub-Admin/HR Card
│   ├── Comparison Matrix
│   └── Quick Reference
├── Quick Links Section (New)
│   ├── City Details (Sub-Admin only)
│   └── Taluka Details (Both)
└── Footer Content
```

---

## Database Fields Used

```javascript
From profiles table:
{
  id: string,
  role: "admin" | "sub-admin" | "hr",
  taluko: string,        // Assigned taluko for Sub-Admin & HR
  city: string,          // Associated city (if any)
  assigned_city: string  // For HR role
}

Derived Variables:
isSubAdmin = profile.role === "sub-admin"
isHR = profile.role === "hr"
userTaluko = profile.taluko
userCity = (for HR) profile.assigned_city
```

---

## Interaction Flow

### On Dashboard Load:
1. ✅ Fetch current user auth
2. ✅ Query profiles table for role, taluko, city
3. ✅ Set state: isSubAdmin, isHR, userTaluko, userCity
4. ✅ Render welcome section with appropriate badge
5. ✅ Filter quick actions based on role
6. ✅ Display access matrix based on role
7. ✅ Show role-specific quick links

### On Navigation:
1. ✅ User clicks link based on available buttons
2. ✅ Sub-Admin can access: City Details, Taluka Details
3. ✅ HR can access: Taluka Details only
4. ✅ Backend enforces role-based data filtering

