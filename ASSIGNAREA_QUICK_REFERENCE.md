# AssignArea - Quick Reference Guide

## 🚀 Quick Start

### Access the Page
- **URL**: `http://localhost:5173/employee/assign-areas`
- **Requirements**: Must be logged in as `employee` role with `employee_type` of "general" or "sub-general"

## 👥 Role-Specific Workflows

### For General Users (🔴 Red Theme)

**What you can do:**
- View all Sub-Generals in the system
- Assign multiple cities to each Sub-General
- Edit or update city assignments anytime

**Step-by-step:**
1. Click "Edit" button next to any Sub-General
2. A modal opens showing all 24 cities
3. Check/uncheck cities you want to assign
4. Click "Save Changes"
5. See success message

**Stats you see:**
- Total Sub-Generals
- Total Cities in System

**Example:**
```
Sub-General: "Rajesh Patel"
Available Cities: [All 24]
My Assignment: ✓ Ahmedabad, ✓ Surat, ✗ Vadodara
Action: Edit → Select + Save
```

---

### For Sub-General Users (🟠 Orange Theme)

**What you can do:**
- View your assigned cities at the top
- Manage Salesmen under your jurisdiction
- Assign one taluka to each Salesman
- Edit or remove assignments
- Search for Salesmen

**Step-by-step:**
1. See "Your Cities: Ahmedabad (City), Surat (City)" at top
2. Scroll through Salesmen list
3. Click "Edit" next to any Salesman
4. Modal opens with:
   - City dropdown (only your cities)
   - Taluka list (only from selected city)
5. Select one city
6. Click one taluka (radio button)
7. Click "Save Changes"

**Stats you see:**
- Total Salesmen under your supervision
- Your Cities count
- Your available Talukas count

**Example:**
```
Your Cities: 2 (Ahmedabad, Surat)
Your Talukas: 18 (across those cities)
Salesmen: 15

Salesman: "Vikram Singh"
Current Taluka: "Ahmedabad City East"
Action: Edit → Select Taluka → Save
```

---

## 📍 Geographic Structure

### How It Works
```
Cities (24 total)
  └─ Example: "Ahmedabad (City)"
       ├─ Ahmedabad City East
       ├─ Ahmedabad City West
       ├─ Daskroi
       ├─ Sanand
       ├─ Bavla
       ├─ Dholka
       ├─ Viramgam
       ├─ Dhandhuka
       ├─ Mandal
       └─ Detroj-Rampura
```

### City List (24 Total)
1. Ahmedabad (City)
2. Surat (City)
3. Vadodara (City)
4. Rajkot (City)
5. Bhavnagar (City)
6. Jamnagar (City)
7. Junagadh (City)
8. Gandhinagar (City)
9. Anand (City)
10. Nadiad (City)
11. Mehsana (City)
12. Palanpur (City)
13. Bhuj (City)
14. Surendranagar (City)
15. Valsad (City)
16. Navsari (City)
17. Porbandar (City)
18. Amreli (City)
19. Dahod (City)
20. Godhra (City)
21. Vyara (City)
22. Chhota Udaipur (City)
23. Bharuch (City)
24. Ankleshwar (City)

---

## 🎯 Common Tasks

### Task 1: Assign Cities to a Sub-General
```
1. You: General user
2. Click: "Edit" button
3. Select: Multiple cities (checkbox)
4. Click: "Save Changes"
5. Result: Displayed in badge list
```

### Task 2: Assign Taluka to a Salesman
```
1. You: Sub-General user
2. Click: "Edit" button next to Salesman
3. Step A: Select city from dropdown
4. Step B: Click one taluka (radio button)
5. Step C: Click "Save Changes"
6. Result: Taluka badge appears under Salesman
```

### Task 3: Remove Salesman Assignment
```
1. You: Sub-General user
2. Click: "Remove" button (red) next to Salesman
3. Confirm: "Remove this salesman's taluka assignment?"
4. Result: Assignment deleted, Salesman shows no taluka
```

### Task 4: Search for a Salesman
```
1. You: Sub-General user
2. Type: Name or email in search box
3. Result: Filtered Salesmen list appears
4. Click: "Edit" on the one you want
```

---

## ⚙️ Technical Details

### Data Saved to Database
```
Table: user_role_assignments

For Sub-General:
{
  user_id: "sub-gen-id-123",
  role: "sub-general",
  assigned_cities: ["Ahmedabad (City)", "Surat (City)"]
}

For Salesman:
{
  user_id: "salesman-id-456",
  role: "salesman",
  assigned_talukas: ["Ahmedabad City East"]
}
```

### Restrictions
- **General**: Can assign any city, no taluka selection
- **Sub-General**: 
  - Can only see cities assigned to them
  - Can only assign talukas from those cities
  - Each Salesman gets exactly ONE taluka
  - Cannot assign to Salesmen outside their jurisdiction

---

## 🔍 Troubleshooting

### Problem: I can't see any Sub-Generals
**Solution**: You might not be logged in as a General user. Check your employee_type is "general"

### Problem: City dropdown is empty
**Solution**: Your account needs cities assigned first. Ask your General user to assign you cities.

### Problem: Taluka list is empty
**Solution**: 
1. Make sure you selected a city from the dropdown
2. Check if that city has talukas available
3. Only talukas from your assigned cities appear

### Problem: Changes didn't save
**Solution**: 
1. Check for error messages on screen
2. Make sure you clicked "Save Changes" button
3. Try refreshing the page and editing again
4. Check your internet connection

### Problem: Can't find Salesman in list
**Solution**: 
1. Use the search box with their name or email
2. They might not be in your jurisdiction yet
3. Ask your System Administrator to assign them to you

---

## 📱 Mobile Usage

The component works on mobile! Tips:

### On Mobile
- ✅ Works in portrait and landscape
- ✅ Scroll lists with ease
- ✅ Tap to select (checkboxes and radio buttons)
- ✅ Tap "Edit" to open modals
- ✅ Modals scroll if too tall

### Best Practice
- Use search to find Salesmen (faster than scrolling)
- Scroll horizontally if needed for tables
- Tap refresh button to reload latest data

---

## 🔄 Refresh & Updates

### Why Refresh?
- See latest data if another user made changes
- Clear any display issues
- Reload after edits

### How to Refresh
- Click blue "🔄 Refresh" button at top
- Or reload page (F5 or Cmd+R)

---

## 💾 Data Persistence

### When Data is Saved
- After clicking "Save Changes" in modal
- Success message shows: "✅ Updated successfully!"
- Data stored in Supabase database
- Changes persist across sessions

### When Data is Lost
- If you close modal without clicking "Save"
- If network disconnects before save completes
- Browser cache cleared

---

## 🎨 Color Scheme

| Role | Color | Emoji | What it means |
|------|-------|-------|---------------|
| General | 🔴 Red | 🔴 | Full system access |
| Sub-General | 🟠 Orange | 🟠 | City-level access |
| HR-General | 🟡 Yellow | 🟡 | Taluka-level access |
| Salesman | 🟢 Green | 🟢 | Taluka assignment |

---

## ❓ FAQ

**Q: Can I assign a Salesman to multiple talukas?**
A: No, each Salesman gets exactly one taluka. One taluka = one Salesman's territory.

**Q: Can I remove a city from a Sub-General?**
A: Yes, uncheck the city and click "Save Changes".

**Q: What happens if I assign a city to 2 Sub-Generals?**
A: Each can assign talukas independently. Overlap is allowed.

**Q: Can a Salesman have no taluka assigned?**
A: Technically yes, but they see "⚠️ No taluka assigned" - best to assign one.

**Q: Who can access this page?**
A: Only users with role="employee" and employee_type in ["general", "sub-general"]

**Q: Can HR-General users access this page?**
A: No, they use `/employee/sub-general-talukas` instead.

---

## 📞 Getting Help

### Contact Your Administrator If:
- Page shows errors
- Cannot access `/employee/assign-areas`
- Data won't save
- Performance is slow
- Need to add new cities/talukas

### Check System Status:
- Look at browser console (F12) for error messages
- Check internet connection
- Try incognito/private browsing mode
- Check if Supabase is accessible

---

## 🎓 Learning Resources

- RBAC_SYSTEM_DOCUMENTATION.md - Full technical docs
- ASSIGN_AREA_IMPLEMENTATION.md - Implementation details
- AssignArea.jsx source code - See how it works
- gujaratConstants.js - Geographic data structure

---

**Last Updated**: January 2024
**Version**: 2.0 (RBAC Hierarchical)
**Status**: Production Ready
