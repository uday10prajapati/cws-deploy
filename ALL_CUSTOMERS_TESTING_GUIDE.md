# ALL CUSTOMERS PAGE - QUICK REFERENCE & TESTING GUIDE

## 🚀 QUICK START

### Backend API Endpoint
```
GET /customer/all-customers
Authorization: Bearer <JWT_TOKEN>
```

### Frontend Component
```
/frontend/src/Employee/AllCustomers.jsx
```

---

## 🧪 TESTING GUIDE

### Test Case 1: General User Access
**User Role**: `general`
**Expected Behavior**:
- ✅ See ALL customers
- ✅ No "Filtered by" badge shown
- ✅ Can filter by ANY sales person
- ✅ `metadata.filtering_applied = false`

**Test Steps**:
1. Login as General user
2. Navigate to "All Customers"
3. Verify all customers are visible
4. Check metadata in browser DevTools Network tab

---

### Test Case 2: Sub-General User Access
**User Role**: `sub-general`
**Assigned Cities**: ["Ahmedabad", "Surat"]
**Expected Behavior**:
- ✅ See only customers from Ahmedabad & Surat
- ✅ Shows "🔒 Filtered by sub-general" badge
- ✅ Can filter by sales persons in assigned cities
- ✅ `metadata.filtering_applied = true`
- ✅ Customers from other cities hidden

**Test Steps**:
1. Login as Sub-General user
2. Verify assigned cities in AssignArea page (should show ["Ahmedabad", "Surat"])
3. Navigate to "All Customers"
4. Count customers: should only be from assigned cities
5. Try to access customer data in DevTools - should be filtered

**Verify in Database**:
```sql
SELECT * FROM user_role_assignments 
WHERE user_id = '<sub-general-user-id>' 
AND role = 'sub-general';
-- Should show: assigned_cities = ["Ahmedabad", "Surat"]
```

---

### Test Case 3: HR-General User Access
**User Role**: `hr-general`
**Assigned Talukas**: ["Ahmedabad Taluka", "Bavla Taluka"]
**Expected Behavior**:
- ✅ See only customers from assigned talukas
- ✅ Shows "🔒 Filtered by hr-general" badge
- ✅ Can filter by sales persons in assigned talukas
- ✅ `metadata.filtering_applied = true`
- ✅ Customers from other talukas hidden

**Test Steps**:
1. Login as HR-General user
2. Verify assigned talukas in AssignArea page (should show ["Ahmedabad Taluka", "Bavla Taluka"])
3. Navigate to "All Customers"
4. Count customers: should only be from assigned talukas
5. Cross-check with AssignArea to ensure correct talukas

**Verify in Database**:
```sql
SELECT * FROM user_role_assignments 
WHERE user_id = '<hr-general-user-id>' 
AND role = 'hr-general';
-- Should show: assigned_talukas = ["Ahmedabad Taluka", "Bavla Taluka"]
```

---

### Test Case 4: Unauthorized Role (Salesman)
**User Role**: `salesman`
**Expected Behavior**:
- ✅ Get error: "Only General, Sub-General, and HR-General roles can access all customers"
- ✅ Page shows error message
- ✅ No data displayed

**Test Steps**:
1. Login as Salesman user
2. Try to access All Customers page
3. Should see error message in red box
4. Check DevTools Network tab for 403 Forbidden response

---

### Test Case 5: Sales Person Filter Dropdown
**Expected Behavior**:
- ✅ Dropdown shows only sales persons whose customers are visible
- ✅ Filtering by sales person updates table
- ✅ "Clear Filters" button resets filter

**Test Steps**:
1. Login as General user
2. Navigate to "All Customers"
3. Click "All Sales Persons" dropdown
4. Verify all sales persons are listed
5. Select one sales person
6. Table should show only customers added by that person
7. Click "Clear Filters"
8. All customers should be visible again

---

## 🔍 DEBUGGING

### Check Backend Logs
```bash
# In backend terminal, look for these log messages:
✅ [General] Access to ALL customers (5 records)
✅ [Sub-General] Access to customers in cities: Ahmedabad, Surat
✅ [HR-General] Access to customers in talukas: Ahmedabad Taluka, Bavla Taluka
⚠️ [Sub-General] No cities assigned
❌ Error messages with stack trace
```

### Check Frontend Logs
```javascript
// In browser DevTools Console, you'll see:
✅ Loaded 5 customers with role-based filtering

// Or errors:
❌ Error loading customers: [error message]
```

### Verify API Response
```javascript
// In browser DevTools → Network tab → all-customers request

// Look for response:
{
  "success": true,
  "data": [...],
  "metadata": {
    "user_role": "general",
    "total_count": 5,
    "filtering_applied": false
  }
}
```

---

## 📊 DATA STRUCTURE

### Sales Car Object
```javascript
{
  id: "car_123",
  customer_name: "John Doe",
  customer_phone: "9876543210",
  car_model: "Toyota Fortuner",
  car_number_plate: "GJ-01-AB-1234",
  car_color: "Silver",
  image_url_1: "https://storage.example.com/image1.jpg",
  image_url_2: "https://storage.example.com/image2.jpg",
  created_at: "2026-01-01T10:30:00Z",
  added_by_sales_person: {
    id: "user_123",
    name: "Aryan",
    email: "aryan@example.com",
    type: "sales"
  }
}
```

---

## 🔐 SECURITY VERIFICATION CHECKLIST

- [ ] **Token Validation**: Verify JWT token is extracted correctly from Authorization header
- [ ] **User Profile Check**: Confirm user_role is fetched from profiles table
- [ ] **Role-Based Filtering**: Verify correct role filtering logic applied
- [ ] **No Data Leakage**: Sub-General doesn't see cities they're not assigned
- [ ] **No Data Leakage**: HR-General doesn't see talukas they're not assigned
- [ ] **Sales Person Privacy**: Sales person info hidden for unauthorized users (if needed)
- [ ] **Error Handling**: Proper error messages for auth failures
- [ ] **Backend Logs**: All access attempts logged with role info

---

## 🐛 COMMON ISSUES & SOLUTIONS

### Issue 1: "Showing 0 out of 0 customers" for Sub-General
**Cause**: User has no assigned_cities
**Solution**:
1. Login as General or HR-General
2. Go to AssignArea page
3. Assign at least one city to the Sub-General user
4. Refresh All Customers page

```sql
-- Or directly in database:
INSERT INTO user_role_assignments (user_id, role, assigned_cities)
VALUES ('<sub-general-id>', 'sub-general', ARRAY['Ahmedabad', 'Surat']);
```

---

### Issue 2: "Showing 0 out of 0 customers" for HR-General
**Cause**: User has no assigned_talukas
**Solution**:
1. Login as Sub-General or above
2. Go to AssignArea page
3. Assign at least one taluka to the HR-General user
4. Refresh All Customers page

```sql
-- Or directly in database:
INSERT INTO user_role_assignments (user_id, role, assigned_talukas)
VALUES ('<hr-general-id>', 'hr-general', ARRAY['Ahmedabad Taluka', 'Bavla Taluka']);
```

---

### Issue 3: "Sales Person filter dropdown is empty"
**Cause**: No sales_cars records exist OR sales_person_id references are invalid
**Solution**:
1. Check if sales_cars table has records:
   ```sql
   SELECT COUNT(*) FROM sales_cars;
   ```
2. Verify sales_person_id references valid users:
   ```sql
   SELECT DISTINCT sales_person_id FROM sales_cars;
   SELECT id FROM profiles WHERE employee_type = 'sales';
   ```
3. Add test data if needed

---

### Issue 4: "401 Unauthorized: No authentication token"
**Cause**: JWT token not passed in Authorization header
**Solution**:
1. Verify frontend code passes token:
   ```javascript
   const { data: sessionData } = await supabase.auth.getSession();
   const token = sessionData?.session?.access_token;
   ```
2. Check token format in DevTools Network tab
3. Ensure "Bearer " prefix is included

---

### Issue 5: "403 Forbidden: User profile not found"
**Cause**: User ID in token doesn't exist in profiles table
**Solution**:
1. Verify user exists in profiles table:
   ```sql
   SELECT * FROM profiles WHERE id = '<user-id>';
   ```
2. Check if profile has employee_type set:
   ```sql
   SELECT employee_type FROM profiles WHERE id = '<user-id>';
   ```
3. Ensure RLS policies on profiles table allow reading own profile

---

## 📈 PERFORMANCE CONSIDERATIONS

### Optimizations Applied
- ✅ Single query for sales_cars (not per customer)
- ✅ Efficient filtering with array operations
- ✅ Ordered by created_at DESC (latest first)
- ✅ Database indexes on user_id, role

### For Large Datasets (>1000 customers)
1. Add pagination:
   ```javascript
   .range(0, 49) // First 50 records
   ```

2. Add filtering by date range:
   ```javascript
   .gte("created_at", "2025-01-01")
   .lte("created_at", "2026-12-31")
   ```

3. Consider caching with Redis

---

## 🚀 DEPLOYMENT CHECKLIST

- [ ] Backend: Verify `/customer/all-customers` route is registered
- [ ] Frontend: Verify AllCustomers.jsx component is imported in routes
- [ ] Database: Verify all required tables exist (sales_cars, user_role_assignments, profiles)
- [ ] Environment: Set SUPABASE_URL and SUPABASE_KEY correctly
- [ ] CORS: Ensure frontend origin is allowed
- [ ] Tokens: Verify JWT token structure and expiration
- [ ] Logs: Enable console.logs for debugging (optional, remove in production)
- [ ] Testing: Run all 5 test cases above

---

## 📞 SUPPORT

### When getting "data is null/undefined"
1. Check browser Console for errors
2. Check backend logs for API errors
3. Verify database records exist:
   ```sql
   SELECT * FROM sales_cars LIMIT 5;
   SELECT * FROM user_role_assignments LIMIT 5;
   ```

### When filter isn't working
1. Verify user_role_assignments records exist
2. Check assigned_cities/assigned_talukas array values
3. Verify sales persons are in the correct cities/talukas
4. Check backend logs for filtering details

### When seeing wrong data
1. Clear browser cache
2. Logout and login again
3. Verify token hasn't expired
4. Check role in profiles table

