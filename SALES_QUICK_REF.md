# 🎯 Sales Dashboard - Quick Reference

## What Changed?

### Before
- Sales person creates new customers in dashboard
- Separate `sales_customers` table with duplicate data
- Car image upload in dashboard

### After ✅
- Customers sign up normally (no special flow)
- Sales person searches for customers by area
- Sales person records/links existing customers
- Customer uploads car image in their profile
- Uses existing `profiles` table (no duplication)

---

## 📋 Step-by-Step Workflow

### 1️⃣ Customer Signs Up
```
Customer → Sign Up Page → Fills Name, Email, Phone, Area → Account Created
```

### 2️⃣ Sales Person Finds Customers
```
Sales → Dashboard → "Find & Record Customers" Tab → Select Area → Search
```
Shows all customers who signed up in that area (not yet linked to any sales person)

### 3️⃣ Sales Records Customer
```
Sales → Click "Record ✓" Button on Customer → Customer Linked
```
Customer moved to "My Customers" tab and can't be recorded by another sales person

### 4️⃣ Customer Uploads Car Image
```
Customer → Profile → Upload Car Image → Stored as Proof
```
Sales person can see in dashboard which customers uploaded car images

---

## 🗄️ Database Structure

### Profiles Table (ALTERED)
```sql
-- New columns added:
- car_image_url TEXT          -- Car image URL
- added_by_sales_id UUID      -- Sales person who recorded them
- car_model VARCHAR(100)      -- Car model name
- car_number VARCHAR(20)      -- License plate
- car_color VARCHAR(50)       -- Car color
- area VARCHAR(100)           -- Service area
```

### Sales Customer Link Table (NEW)
```sql
- sales_id (FK)
- customer_id (FK)
- added_at TIMESTAMP
```
Lightweight table to track relationships

---

## 🔌 Backend Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/documents/sales/find-customers?area=X` | GET | Find customers by area |
| `/documents/sales/record-customer` | POST | Link customer to sales person |
| `/documents/sales/my-customers` | GET | Get all recorded customers |

---

## 💻 Frontend Dashboard

### Tab 1: Find & Record Customers
- **Actions**: Select area → Search → Record customers
- **Shows**: Available customers in area
- **Features**: Area buttons, search button, customer list, record buttons

### Tab 2: My Customers
- **Shows**: All recorded customers
- **Stats**: Total, this month, this week, with car image
- **Features**: Customer table, car image status, contact info

---

## ✅ Database Execution

```sql
-- Copy entire contents of backend/SALES_CUSTOMERS_SCHEMA.sql
-- Paste into Supabase SQL Editor
-- Click Execute
-- Done!
```

Creates:
- ✅ New columns on profiles table
- ✅ New sales_customer_link table
- ✅ RLS policies
- ✅ Indexes for performance

---

## 🚀 Get Started

### 1. Run Migration
```bash
# Execute SALES_CUSTOMERS_SCHEMA.sql in Supabase
```

### 2. Start Services
```bash
cd backend && npm run server  # Terminal 1
cd frontend && npm run dev    # Terminal 2
```

### 3. Test Workflow
```
1. Sign up as customer
2. Set area: "Downtown"
3. Logout
4. Login as sales person
5. Go to /sales-dashboard
6. Click "Find & Record Customers"
7. Select "Downtown"
8. Click "Search Customers"
9. See your customer
10. Click "Record ✓"
11. Go to "My Customers" tab
12. See customer with car image status = "Pending"
```

---

## 📊 Data Flow Diagram

```
Customer Signs Up
    ↓
    ├─ Creates profile in 'profiles' table
    ├─ Sets: name, email, phone, area
    ├─ added_by_sales_id = NULL (not recorded yet)
    
Sales Searches Area
    ↓
    ├─ Queries profiles where added_by_sales_id = NULL
    ├─ Filters by area
    ├─ Shows results
    
Sales Records Customer
    ↓
    ├─ Updates profiles.added_by_sales_id = sales_person_id
    ├─ Inserts into sales_customer_link
    ├─ Customer now "recorded"
    
Customer Uploads Car Image
    ↓
    ├─ Updates profiles.car_image_url
    ├─ Sales person sees status = "Uploaded"
```

---

## 🔐 Who Sees What?

**Sales Person:**
- ✅ Sees all customers in selected area
- ✅ Records customers
- ✅ Sees own recorded customers
- ❌ Cannot see other sales person's customers

**Customer:**
- ✅ Can sign up
- ✅ Can upload car image
- ✅ Can manage profile
- ❌ Cannot see sales dashboard

**Admin:**
- ✅ Can see everything
- ✅ Can verify documents
- ✅ Can manage system

---

## 📱 Statistics Displayed

In "My Customers" Tab:
- **Total Recorded**: How many customers this sales person recorded
- **This Month**: Customers recorded this month
- **This Week**: Customers recorded this week
- **With Car Image**: How many uploaded car images

---

## 🎯 Success Indicators

✅ Customer can sign up independently
✅ Sales person can find customers by area
✅ Sales person can record/link customers
✅ Each customer linked to only one sales person
✅ Customer uploads car image as proof
✅ Sales person can see car image status
✅ No data duplication
✅ RLS enforces data isolation

---

## 📂 Files Modified

- ✅ `SALES_CUSTOMERS_SCHEMA.sql` - Updated to alter profiles + new link table
- ✅ `salesDocumentsRoutes.js` - Added 3 new endpoints
- ✅ `SalesDashboard.jsx` - Completely redesigned
- ✅ `App.jsx` - Already has routes
- ✅ `server.js` - Already has routes

---

## ❓ FAQ

**Q: How does customer sign up?**
A: Through normal signup page. They don't need to do anything special.

**Q: Can one sales person record the same customer?**
A: No. Once recorded, customer.added_by_sales_id is set and won't appear for other sales people.

**Q: What if customer doesn't upload car image?**
A: Status shows "Pending". Sales person can still see customer in "My Customers" tab.

**Q: Can customer change who recorded them?**
A: No. Only admins or the system can update added_by_sales_id.

**Q: What data is in profiles table for customers?**
A: name, email, phone, area, car_model, car_number, car_color, car_image_url, added_by_sales_id

---

**Status**: ✅ Ready to Deploy
**Lines of Code**: 350+ (frontend) + 200+ (backend)
**Database Tables**: 1 altered, 1 new
**Endpoints**: 3 new
**Time to Setup**: 5 minutes
