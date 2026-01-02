# Role-Based Area Assignment - User Guides

## Quick Reference Guide

### GENERAL USER
**What they see**: `/employee/assign-areas`
```
┌─────────────────────────────────────────┐
│ 🔴 General - Area Management            │
│ Assign cities to Sub-Generals           │
│                                         │
│ Total Sub-Generals: 5                   │
│ Cities in System: 10                    │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ Sub-Generals & Their Assignments    │ │
│ ├─────────────────────────────────────┤ │
│ │ Name: Rajesh Kumar                  │ │
│ │ Email: rajesh@company.com           │ │
│ │ Cities: [Ahmedabad] [Vadodara]  │ │
│ │ [Edit] [Remove]                     │ │
│ └─────────────────────────────────────┘ │
│ (... more sub-generals)                 │
└─────────────────────────────────────────┘
```

**Actions Available**:
- ✅ View all Sub-Generals
- ✅ Click "Edit" to assign/change cities
- ✅ Click "Remove" to unassign
- ✅ Search by name or email

---

### SUB-GENERAL USER
**What they see**: `/employee/assign-areas`
```
┌─────────────────────────────────────────────┐
│ 🟠 Sub-General - Area Management            │
│ Assign talukas to HR-Generals               │
│ Your Cities: Bharuch, Narmada               │
│                                             │
│ Total HR-Generals: 8                        │
│ Your Cities: 2                              │
│ Your Talukas: 6                             │
│                                             │
│ ┌──────────────────────────────────────┐   │
│ │ HR-Generals & Their Assignments      │   │
│ ├──────────────────────────────────────┤   │
│ │ Name: Priya Singh                    │   │
│ │ Email: priya@company.com             │   │
│ │ Talukas: [Ankleshwar] [Jhagadia]     │   │
│ │ [Edit] [Remove]                      │   │
│ └──────────────────────────────────────┘   │
│ (... more HR-Generals)                      │
└─────────────────────────────────────────────┘
```

**Actions Available**:
- ✅ View only HR-Generals for their jurisdiction
- ✅ Click "Edit" to assign/change talukas
- ✅ Can assign multiple talukas to one HR-General
- ✅ Can assign same taluka to multiple HR-Generals
- ✅ Click "Remove" to unassign
- ✅ Search by name or email

---

### HR-GENERAL USER
**What they see**: `/employee/assign-areas`
```
┌─────────────────────────────────────────────────┐
│ 🟢 HR-General - Sales Management                │
│ Assign areas to Sales Persons                   │
│ Your Talukas: Ankleshwar, Jhagadia              │
│                                                 │
│ Total Sales Persons: 12                         │
│ Your Talukas: 2                                 │
│                                                 │
│ ┌──────────────────────────────────────────┐   │
│ │ Sales Persons & Their Area Assignments   │   │
│ ├──────────────────────────────────────────┤   │
│ │ Name: Amit Patel                         │   │
│ │ Email: amit@company.com                  │   │
│ │ Areas: [Ankleshwar] [Khambhat]           │   │
│ │ [Edit] [Remove]                          │   │
│ └──────────────────────────────────────────┘   │
│ (... more Sales Persons)                        │
└─────────────────────────────────────────────────┘
```

**Actions Available**:
- ✅ View all Sales Persons
- ✅ Click "Edit" to assign/change talukas/areas
- ✅ Can assign multiple areas to one Sales Person
- ✅ Can assign same area to multiple Sales Persons
- ✅ Click "Remove" to unassign
- ✅ Search by name or email

---

### SALES PERSON USER
**What they see**: `/employee/assign-areas`
```
┌─────────────────────────────────────────┐
│                                         │
│ Access Denied                           │
│                                         │
│ Only General, Sub-General, and          │
│ HR-General roles can access this page.  │
│                                         │
│ Contact your HR-General to manage       │
│ your assigned areas.                    │
│                                         │
└─────────────────────────────────────────┘
```

**Actions Available**:
- ❌ Cannot access this page (by design)
- ✅ Access areas in other parts of the app
- ✅ Manage customers in assigned areas
- ✅ Submit sales through assigned areas

---

## Modal Forms

### General User - Edit Sub-General Modal
```
┌────────────────────────────────────────┐
│ Assign Cities to Rajesh Kumar          │
├────────────────────────────────────────┤
│                                        │
│ Select Cities (Multiple allowed):      │
│                                        │
│ ☑ Ahmedabad                           │
│ ☐ Anand                               │
│ ☐ Bardoli                             │
│ ☐ Bharuch                             │
│ ☑ Vadodara                            │
│ ☐ Valsad                              │
│ (... more cities)                      │
│                                        │
│ [Cancel]  [Save Changes]              │
└────────────────────────────────────────┘
```

**Features**:
- Multiple cities can be selected
- Can select/deselect as needed
- Cancel doesn't save changes
- Save validates at least one is selected

---

### Sub-General User - Edit HR-General Modal
```
┌──────────────────────────────────────────┐
│ Assign Taluka to Priya Singh            │
├──────────────────────────────────────────┤
│                                          │
│ Select City:                             │
│ [Bharuch ▼]                             │
│                                          │
│ Select Taluka (Multiple allowed):        │
│                                          │
│ ☑ Ankleshwar                            │
│ ☑ Jhagadia                              │
│ ☐ Amod                                  │
│ ☐ Valod                                 │
│                                          │
│ [Cancel]  [Save Changes]               │
└──────────────────────────────────────────┘
```

**Features**:
- Choose city first (limits available talukas)
- Multiple talukas can be selected
- City dropdown shows only assigned cities
- At least one taluka must be selected

---

### HR-General User - Edit Sales Person Modal
```
┌──────────────────────────────────────────┐
│ Assign Area to Amit Patel               │
├──────────────────────────────────────────┤
│                                          │
│ Select Taluka/Area (One or more):        │
│                                          │
│ ☑ Ankleshwar                            │
│ ☑ Khambhat                              │
│ ☐ Matar                                 │
│ ☐ Taluka 4                              │
│                                          │
│ [Cancel]  [Save Changes]               │
└──────────────────────────────────────────┘
```

**Features**:
- Shows only HR-General's assigned talukas
- Multiple areas can be selected
- Checkboxes allow flexibility
- At least one area must be selected

---

## Search Functionality

All user list pages include search:

```
┌──────────────────────────────────────────────┐
│ Search Sub-Generals...                       │
│ ████████████████████████                     │
│                                              │
│ Results: 2                                   │
│ (Filtered based on name or email)            │
└──────────────────────────────────────────────┘
```

Search filters by:
- User Name (case-insensitive)
- Email (case-insensitive)
- Real-time results as you type

---

## Edit/Remove Actions

### Edit Button
- Opens modal to modify assignments
- Current assignments are pre-loaded
- Can add/remove items
- Must save to apply changes

### Remove Button
- Shows confirmation dialog: "Remove this [role]'s [assignment]?"
- Upon confirmation, immediately unassigns
- No modal shown, direct operation
- Cannot be undone (consider it carefully)

---

## Navigation

### From Main Menu
Each role sees relevant navigation items:

**General**: 
- Admin Dashboard → Assign Areas

**Sub-General**:
- Employee Dashboard → Assign Areas
- Navbar → Area Management

**HR-General**:
- Employee Dashboard → Assign Areas
- Navbar → Area Management

**Sales Person**:
- (No link available - page blocked)

---

## Color Coding by Role

| Role | Color | Emoji | Theme |
|------|-------|-------|-------|
| **General** | Blue/Red | 🔴 | Professional |
| **Sub-General** | Orange | 🟠 | Warm |
| **HR-General** | Green | 🟢 | Growth |
| **Sales Person** | Gray | (N/A) | Limited Access |

---

## Data Visibility Example

If you have this hierarchy:

```
General: Admin
  ├─ Sub-General: Bharuch Manager
  │   ├─ HR-General: Ankleshwar Lead
  │   │   ├─ Sales Person: Amit (Area: Ankleshwar)
  │   │   └─ Sales Person: Priya (Area: Ankleshwar)
  │   └─ HR-General: Jhagadia Lead
  │       └─ Sales Person: Raj (Area: Jhagadia)
  └─ Sub-General: Surat Manager
      └─ HR-General: Surat Lead
          └─ Sales Person: Vikas (Area: Surat)
```

**What Admin sees in Assign Area**:
- Bharuch Manager ← can edit
- Surat Manager ← can edit

**What Bharuch Manager sees in Assign Area**:
- Ankleshwar Lead ← can edit
- Jhagadia Lead ← can edit

**What Ankleshwar Lead sees in Assign Area**:
- Amit Patel ← can edit
- Priya Sharma ← can edit

**What Amit (Sales Person) sees in Assign Area**:
- ❌ Access Denied

---

## Tips & Best Practices

### For General Users
✅ DO:
- Assign cities to Sub-Generals based on geography
- Review assignments periodically
- Remove assignments no longer needed

❌ DON'T:
- Assign same city to multiple Sub-Generals (confusing)
- Assign without proper authorization

### For Sub-General Users
✅ DO:
- Assign talukas to specialized HR-Generals
- Match taluka expertise with HR-General skills
- Keep assignments balanced

❌ DON'T:
- Assign talukas outside your jurisdiction
- Remove HR-General before backup is in place

### For HR-General Users
✅ DO:
- Match Sales Person skills to area complexity
- Review performance by area
- Balance workload fairly

❌ DON'T:
- Assign same area to too many Sales Persons
- Remove area assignments without warning

---

## Troubleshooting

### "No [Role] assigned yet"
**Problem**: You don't see any users to manage
**Solution**:
- Check that your manager has assigned you users
- Verify you have a valid role assignment
- Contact your manager/admin

### "Cannot see [User]"
**Problem**: A user exists but isn't showing in list
**Solution**:
- Check the user's assigned role
- Verify they're in your jurisdiction
- Refresh the page
- Check browser console for errors

### Modal won't save
**Problem**: "Save Changes" button is disabled
**Solution**:
- Ensure you've selected at least one option
- All required fields must be filled
- Try closing and reopening the modal

### Search isn't working
**Problem**: Results don't match what you're searching for
**Solution**:
- Search is case-insensitive
- Check spelling of name/email
- Try searching by email instead
- Refresh the page

---

## Support & Help

For issues or questions:
1. Check the troubleshooting section above
2. Ask your HR-General (if Sales Person)
3. Ask your Sub-General (if HR-General)
4. Contact Admin (if General/Sub-General)
5. Check browser console for error messages (Ctrl+Shift+I)
