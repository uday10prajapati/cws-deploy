# Car Photo Upload Feature Update

## Summary
Updated the SalesWork component to allow sales persons to upload **one car photo** when adding a new car instead of requiring two separate images.

## Changes Made

### 1. Frontend Changes (SalesWork.jsx)

#### State Management
- **Updated `carForm` state** from `{ model, numberPlate, color, image1, image2 }` to `{ model, numberPlate, color, carPhoto }`
- Only one photo field instead of two

#### Form Validation
- Changed validation from requiring both `image1` and `image2` to requiring only `carPhoto`
- Updated error message: "Please upload car photo"

#### Upload Logic
- Simplified upload process to handle single `car_photo_url` instead of `image_url_1` and `image_url_2`
- Uses new database column `car_photo_url`

#### UI/UX Updates
- **Car Photo Section**: Replaced two image upload fields with a single upload field
  - Cleaner form with less clutter
  - Single file input with label "Upload Car Photo"
  - Shows file name confirmation when selected

#### Table Display
- Changed table header from "Images" to "Photo"
- Updated photo display to show single "📷 View" link instead of "📷 Img1" and "📷 Img2"

### 2. Database Migration
- Created new migration file: `update_sales_cars_single_photo.sql`
- Adds new `car_photo_url` column to `sales_cars` table
- Maintains backward compatibility with existing `image_url_1` and `image_url_2` columns

## Implementation Steps

1. **Run the database migration** (optional but recommended):
   ```sql
   -- Execute the migration file: backend/migrations/update_sales_cars_single_photo.sql
   -- This adds the new car_photo_url column
   ```

2. **Test the feature**:
   - Navigate to SalesWork page
   - Click "Add New Car" button
   - Fill in car details (Model, Number Plate, Color)
   - Upload one car photo
   - Submit the form
   - Verify car appears in the table with the photo link

## Files Modified
- `d:\Job\CWS\car-wash\frontend\src\Sales\SalesWork.jsx` - Main component changes
- `d:\Job\CWS\car-wash\backend\migrations\update_sales_cars_single_photo.sql` - Database schema update

## Notes
- The old `image_url_1` and `image_url_2` columns are kept for backward compatibility
- If you want to drop the old columns after migration, uncomment the DROP statements in the migration file
- All existing cars with two images will continue to work; new cars will use the single photo approach
