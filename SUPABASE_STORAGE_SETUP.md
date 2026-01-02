# Supabase Storage Setup Guide for Car Images

## Problem
Car images are failing to load with HTTP 400 error because the storage buckets don't have public read access configured.

## Current Setup
- **Upload Location**: `sales_customers` bucket
- **Upload Path**: `cars/{user_id}/{timestamp}_image1_...` and `cars/{user_id}/{timestamp}_image2_...`
- **Image Field**: `car_photo_url` in `sales_cars` table
- **Issue**: Bucket missing public read policy

## Solution: Configure Storage Buckets

### Step 1: Go to Supabase Dashboard
1. Open https://app.supabase.com
2. Select your project
3. Go to **Storage** section

### Step 2: Configure `sales_customers` Bucket

#### Option A: Make Bucket Fully Public (Recommended for Development)
1. Click on `sales_customers` bucket
2. Click **Settings** (gear icon)
3. Toggle **"Make bucket public"** to **ON**
4. Click **Save**

#### Option B: Add Public Read Policy (Recommended for Production)
1. Click on `sales_customers` bucket
2. Go to **Policies** tab
3. Click **New Policy** → **For Full customization**
4. Choose **SELECT** as the operation
5. Use this policy:
```sql
CREATE POLICY "Public Read Access" ON storage.objects
FOR SELECT
USING (bucket_id = 'sales_customers');
```
6. Click **Save**

### Step 3: Verify Configuration

**Check if bucket is public:**
```
https://cjaufvqninknntiukxka.supabase.co/storage/v1/object/public/sales_customers/...
```

Should return the image directly (not 400 error).

### Step 4: Test the Application

1. Restart your backend server
2. Refresh the browser
3. Navigate to `/employee/allcars` page
4. Car images should now display ✅

---

## Alternative: Create Dedicated `car-images` Bucket

If you want to create a separate bucket specifically for car images:

### Step 1: Create New Bucket
1. In Supabase Storage, click **Create a new bucket**
2. Name: `car-images`
3. Toggle **"Make it public"** → ON
4. Click **Create**

### Step 2: Update Upload Code

In `frontend/src/Sales/SalesWork.jsx` (lines 296-310), change:
```javascript
// OLD
.from("sales_customers")

// NEW  
.from("car-images")
```

In `frontend/src/Sales/SalesDashboard.jsx` (lines 173-180), change:
```javascript
// OLD
.from("car-images")

// NEW
.from("car-images")  // Already correct!
```

### Step 3: Update Path Structure

In `frontend/src/Sales/SalesWork.jsx`, change upload path:
```javascript
// OLD
`cars/${user.id}/${timestamp}_image1_${carForm.image1.name}`

// NEW
`sales/${Date.now()}_car_${timestamp}_${carForm.image1.name}`
```

---

## Recommended Setup

✅ **Best Practice**: Use a dedicated `car-images` bucket with public read access:

```
Bucket: car-images
Status: Public ✓
Policies: Allow SELECT (public read)
Path Pattern: sales/{timestamp}_{filename}
```

This separates:
- **Customer documents** → `sales_customers` bucket
- **Car images** → `car-images` bucket  
- **Other files** → Additional buckets as needed

---

## Troubleshooting

**If images still don't load after making bucket public:**

1. **Hard refresh browser**: Ctrl+Shift+Del (Windows) or Cmd+Shift+Del (Mac)
2. **Clear browser cache**: DevTools → Network → Disable cache
3. **Check CORS settings**: Supabase → Storage → Settings → CORS
4. **Verify image URL format**: Should end with correct filename

**If you see 401 errors instead of 400:**
- Bucket is private (needs public access)
- Use signed URLs instead

**If you see 404 errors:**
- Image path is wrong
- Filename has special characters that need URL encoding

---

## Current Status

- ✅ Backend code ready (fetching `car_photo_url`)
- ✅ Frontend code ready (displaying `car_photo_url`)
- ❌ **Supabase bucket needs public read access**
- ❌ Images failing to load (400 Bad Request)

**Next Steps:**
1. Configure bucket access (see Step 2 above)
2. Restart backend
3. Refresh browser
4. Images should load! 🎉
