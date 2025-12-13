# Sales System - Quick Setup Guide ⚡

## What You Need to Do (5 minutes)

### Step 1: Execute SQL Schemas

Go to **Supabase Dashboard** → **SQL Editor** → **New Query**

#### Query 1: Copy from `backend/SALES_DOCUMENTS_SCHEMA.sql`
- Paste entire contents
- Click "Execute"
- Should show: "0 rows affected"

#### Query 2: Copy from `backend/SALES_CUSTOMERS_SCHEMA.sql`
- Paste entire contents
- Click "Execute"  
- Should show: "0 rows affected"

✅ **Done!** Tables and RLS policies are created

---

## What's Already Done ✅

| Component | Status | Location |
|-----------|--------|----------|
| **SalesDashboard** | ✅ Complete | `frontend/src/Sales/SalesDashboard.jsx` |
| **SalesDocumentUpload** | ✅ Complete | `frontend/src/Sales/SalesDocumentUpload.jsx` |
| **SalesProfile** | ✅ Complete | `frontend/src/Sales/SalesProfile.jsx` |
| **Backend Routes** | ✅ Complete | `backend/routes/salesDocumentsRoutes.js` |
| **Backend Registration** | ✅ Complete | `backend/server.js` (line 58) |
| **Frontend Routes** | ✅ Complete | `frontend/src/App.jsx` |
| **Database Schemas** | 📝 Waiting | Execute in Supabase SQL Editor |
| **Storage Buckets** | ✅ Auto-create | Created on first upload |

---

## Test Your Installation

### Test 1: Dashboard Route
1. Start your app: `npm run dev` (in frontend folder)
2. Login as sales person
3. Visit: `http://localhost:5173/sales-dashboard`
4. Should see sales dashboard with customer list

### Test 2: Add Customer
1. Click "Add Customer" button
2. Fill in: Name, Email, Phone, Area, Address
3. Choose area (e.g., "Downtown")
4. Upload a car image
5. Click "Add Customer"
6. Should see customer appear in grid + stats update

### Test 3: Upload Documents
1. Visit: `http://localhost:5173/sales/documents`
2. Upload documents (Aadhar, PAN, Bank, Selfie, Certificate)
3. Should see documents with "Pending" status
4. Note the profile code (e.g., "SD123456")

### Test 4: Profile Management
1. Visit: `http://localhost:5173/sales/profile`
2. See personal info
3. Click "Add Address"
4. Fill address details
5. Should appear in list

---

## Common Issues & Fixes

### Issue: "Cannot read property 'map' of undefined"
**Fix**: Execute both SQL schemas in Supabase SQL Editor

### Issue: Car image not uploading
**Fix**: Bucket auto-creates on first upload. Wait 2-3 seconds and try again.

### Issue: 404 error on /sales-dashboard
**Fix**: Make sure `SalesDashboard` is imported in `frontend/src/App.jsx`

### Issue: Documents show but admin can't verify
**Fix**: Use admin account. Admin verification endpoints require admin role.

---

## Database Files

### SALES_DOCUMENTS_SCHEMA.sql
```
Creates:
- sales_documents table (id, sales_id, document_type, file_url, verification_status, verified_by, verification_notes, timestamps)
- sales_profile_codes table (id, sales_id, profile_code, created_at)
- RLS policies (sales person view own, admin view all)
- Indexes (sales_id, document_type, verification_status)
```

### SALES_CUSTOMERS_SCHEMA.sql
```
Creates:
- sales_customers table (id, sales_id, customer info, car details, status, timestamps)
- RLS policies (sales person CRUD own, admin view all)
- Indexes (sales_id, area, created_at, phone)
```

---

## Backend Endpoints

**Document Upload** (Sales Person)
```
POST /documents/sales/upload-file
- Required: file (multipart), document_type
- Returns: { fileUrl, profileCode, status }
```

**Get Documents** (Sales Person)
```
GET /documents/sales/{sales_id}
- Returns: [{ id, document_type, file_url, verification_status, ... }]
```

**Admin: Verify Document**
```
POST /documents/admin/sales/verify-document
- Required: document_id, verification_status, notes
- Returns: { success: true }
```

**Admin: Get All Sales Documents**
```
GET /documents/admin/sales-all-documents
- Returns: [{ sales_id, sales_name, documents: [...] }]
```

---

## Frontend Components

### SalesDashboard Features
- ✅ Customer list with search/filter
- ✅ Add customer modal with form
- ✅ Car image upload
- ✅ Monthly/weekly statistics
- ✅ Area-based filtering
- ✅ Sidebar navigation
- ✅ Mobile responsive

### SalesDocumentUpload Features
- ✅ 5 document types
- ✅ File upload with progress
- ✅ Verification status tracking
- ✅ Profile code generation
- ✅ Document verification history
- ✅ Sidebar navigation

### SalesProfile Features
- ✅ Personal information display
- ✅ Address management (add/edit/delete)
- ✅ Address type selection
- ✅ Sidebar navigation

---

## Menu Navigation

**Sales Person sees:**
- Dashboard → /sales-dashboard
- Documents → /sales/documents
- Profile → /sales/profile

**Active link highlighted** in sidebar

---

## Storage Buckets (Auto-Created)

| Bucket | Purpose | Auto-Create |
|--------|---------|------------|
| `sales_documents` | Document uploads | First upload |
| `sales_customers` | Car images | First upload |

---

## Mobile Responsive

✅ **Desktop** (≥1024px): Sidebar visible, content full-width
✅ **Tablet** (768px-1023px): Toggle sidebar, optimized layout
✅ **Mobile** (<768px): Top menu bar, full-screen sidebar on toggle

---

## Done! 🎉

Once you execute the SQL schemas, everything is ready to use.

**Expected time to finish**: 5 minutes
**Complexity**: Very simple (copy + paste + click Execute)

Questions? Check the `SALES_DASHBOARD_IMPLEMENTATION_COMPLETE.md` file for full documentation.
