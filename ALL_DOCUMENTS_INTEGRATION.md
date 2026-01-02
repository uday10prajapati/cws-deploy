# All Documents Module - Integration Guide

## Quick Integration Steps

### Step 1: Add Route to Your Router
In your main routing file (e.g., `App.jsx` or `Routes.jsx`):

```jsx
import AllDocuments from "./Employee/AllDocuments";

// Add to your Routes:
<Route path="/documents/all" element={<AllDocuments />} />
```

### Step 2: Add Navigation Link
In your navigation component (e.g., `NavbarNew.jsx` or sidebar):

```jsx
// For HR-General, Sub-General, and General employees
<Link to="/documents/all" className="nav-link">
  <FiFileText /> All Documents
</Link>
```

Only show this link for non-salespeople roles:
```jsx
{userRole !== ROLES.SALESMAN && (
  <Link to="/documents/all" className="nav-link">
    <FiFileText /> All Documents
  </Link>
)}
```

### Step 3: Verify Database Tables
Ensure your `sales_cars` table has these columns:
```sql
- id (primary key)
- customer_name
- customer_phone
- number_plate
- customer_city
- customer_taluko
- car_photo_url (TEXT)
- image_url_1 (TEXT) - Address Proof
- image_url_2 (TEXT) - Light Bill
- created_at (TIMESTAMP)
```

### Step 4: Verify User Assignments
Ensure these columns exist in `profiles` table:
```sql
- id (primary key)
- employee_type (VARCHAR) - Role: general, sub-general, hr-general, salesman
- assigned_cities (JSON/ARRAY) - For Sub-General
- assigned_talukas (JSON/ARRAY) - For HR-General
```

Or use `user_role_assignments` table:
```sql
- user_id
- role
- assigned_cities (JSON/ARRAY)
- assigned_talukas (JSON/ARRAY)
```

## Access Rules Summary

| Role | Access | Filter By |
|------|--------|-----------|
| Sales Person | ❌ Denied | N/A |
| HR-General | ✅ Allowed | Assigned Taluka(s) |
| Sub-General | ✅ Allowed | Assigned City(s) |
| General | ✅ Allowed | None (All) |

## Testing Checklist

- [ ] Sales person visits page → sees "Access Denied"
- [ ] HR-General visits page → sees only their taluka documents
- [ ] Sub-General visits page → sees only their city documents
- [ ] General visits page → sees all documents
- [ ] Search functionality works for all roles
- [ ] Document type filter works
- [ ] Download button downloads file
- [ ] View link opens document in new tab
- [ ] Empty state shows when no documents exist

## Troubleshooting

### Documents Not Showing
1. Check if documents have valid URLs in `car_photo_url`, `image_url_1`, or `image_url_2`
2. Verify user's geographic assignments are set correctly
3. Check browser console for errors

### Access Denied for Wrong Users
1. Verify `employee_type` is set correctly in `profiles` table
2. Check if sales person role is "salesman" not "sales_person"
3. Ensure role values match ROLES constants

### Filter Not Working
1. Clear browser cache
2. Check if taluka/city names match exactly
3. Verify customer_city and customer_taluko are populated

### Download Not Working
1. Verify document URLs are publicly accessible
2. Check Supabase storage bucket permissions
3. Test URLs directly in browser

## Performance Notes

- Module loads documents once on mount
- Client-side filtering for instant search results
- No pagination needed for typical datasets
- Consider adding pagination if >1000 documents

## Security Notes

✅ Access control enforced at:
1. Component level (access denied UI)
2. Query level (database filtering)
3. Role verification before data load

✅ No sensitive data in logs
✅ All Supabase queries use RLS policies
✅ Download function doesn't expose backend URLs

## Code Structure

```
AllDocuments.jsx
├── useRoleBasedRedirect() - Check user is employee
├── loadUserAndDocuments() - Get user role and documents
├── loadDocuments() - Query with role-based filtering
├── filterDocuments() - Client-side search/filter
├── Access Denied UI - For salespeople
├── Role Info Banner - Show permissions
├── Filter Section - Search and document type
├── Documents Grid - Card layout for each document
└── Access Control Info - Explain rules
```

## API Endpoints Used

```javascript
supabase.auth.getUser() - Get authenticated user
supabase.from("profiles").select(...) - Get user role and assignments
supabase.from("sales_cars").select(...) - Get documents with filtering
```

## CSS Classes Used

- Tailwind CSS for styling
- Responsive grid: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
- Color scheme: Blue (primary), Green (address proof), Yellow (light bill)
- Icons: react-icons/fi

## Browser Compatibility

✅ Chrome/Edge
✅ Firefox
✅ Safari
✅ Mobile browsers
