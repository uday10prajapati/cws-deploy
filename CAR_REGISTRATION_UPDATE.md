# Car Registration with Customer Details - Feature Update

## Summary
Updated the SalesWork component to allow sales personnel to register a car with customer details (name and phone) along with 2 car images. The light bill and identity proof documents are NOT included in the car registration modal - they remain separate for customer registration.

## Changes Made

### 1. Frontend Changes (SalesWork.jsx)

#### State Management
- **Updated `carForm` state** to include:
  - `customerName` - Customer's full name
  - `customerPhone` - Customer's phone number
  - `model` - Car model
  - `numberPlate` - Car number plate
  - `color` - Car color
  - `image1` - First car image (Front/Side view)
  - `image2` - Second car image (Back/Other view)

#### Form Structure
The "Add New Car" modal now has 3 sections:

1. **Customer Information Section**
   - Customer Name (text input)
   - Customer Phone Number (tel input)
   - Uses FiUsers icon

2. **Car Information Section**
   - Car Model
   - Number Plate
   - Car Color
   - Uses FiCamera icon

3. **Car Images Section** 
   - Front/Side View Image (file upload)
   - Back/Other View Image (file upload)
   - Shows confirmation with file name when selected
   - Uses FiCamera icon

#### Validation
- Requires customer name and phone
- Requires all car details (model, number plate, color)
- Requires both car images

#### Upload Logic
- Uploads both car images to Supabase storage
- Stores customer name and phone in database
- Uses `image_url_1` and `image_url_2` fields

#### Table Display
The cars table now shows:
- Customer Name
- Customer Phone
- Car Model
- Number Plate
- Car Color
- Images (links to Img1 and Img2)
- Date Added
- Delete Action

### 2. Database Migration
- Created migration file: `update_sales_cars_single_photo.sql`
- Adds `customer_name` column (VARCHAR 100)
- Adds `customer_phone` column (VARCHAR 20)
- Maintains backward compatibility with existing data

## Key Features
✅ Customer details captured during car registration  
✅ Two image uploads for comprehensive car documentation  
✅ Clean, organized form with 3 distinct sections  
✅ Image confirmation before submission  
✅ Customer info displayed in car table  
✅ Light bill and identity proof documents NOT in car modal  
✅ Separate workflow for customer documents and car registration  

## Files Modified
- `d:\Job\CWS\car-wash\frontend\src\Sales\SalesWork.jsx` - Main component
- `d:\Job\CWS\car-wash\backend\migrations\update_sales_cars_single_photo.sql` - Database schema

## Implementation Steps

1. **Run the database migration**:
   ```sql
   -- Execute: backend/migrations/update_sales_cars_single_photo.sql
   -- This adds customer_name and customer_phone columns to sales_cars table
   ```

2. **Test the feature**:
   - Navigate to SalesWork page
   - Click "+ Add Car" button
   - Fill in customer details (Name, Phone)
   - Fill in car details (Model, Number Plate, Color)
   - Upload two car images
   - Submit the form
   - Verify car appears in table with customer details

## Database Schema Changes
```sql
ALTER TABLE public.sales_cars 
ADD COLUMN IF NOT EXISTS customer_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(20);
```

## Notes
- Customer documents (light bill, identity proof) remain separate in customer registration modal
- The car registration process is independent of customer document uploads
- Sales personnel can register a car without customer approval details
