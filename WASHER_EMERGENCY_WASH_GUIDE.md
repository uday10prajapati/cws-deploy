# Washer Emergency Wash Assignment - How to Access

## What's New
Washers can now see all emergency wash requests assigned to them by the admin and manage them.

## How Washers Access Their Assigned Requests

### URL
`http://localhost:3000/washer/emergency-wash`

Or navigate through the navbar if you add a menu link.

## Features Available

### 1. **View Assigned Requests**
- See all emergency wash requests assigned to you
- Filter by status: Assigned, In Progress, Completed
- View customer name, phone, area/taluko, and address
- See car details (model, plate, color)

### 2. **Manage Request Status**
- **Assigned** → Click "Start Wash" to change to "In Progress"
- **In Progress** → Click "Complete & Upload Photos" to finish the wash

### 3. **Upload Completion Photos**
- Upload up to 4 photos showing the completed wash
- Photos are automatically uploaded to Supabase Storage
- Submit to mark the wash as complete

### 4. **View Request Details**
- Customer information (name, phone, area)
- Full address for the wash location
- Car details and specifications
- Special requests if any
- Request submission time

## Request Status Flow

```
Admin Assigns → Washer sees "Assigned" 
    ↓
Washer clicks "Start Wash" → Status changes to "In Progress"
    ↓
Washer uploads photos → Status changes to "Completed"
```

## Data Stored in Database

When washer completes a request:
- `status` is updated to "Completed"
- After photos are uploaded to Supabase Storage (emergency-wash-photos bucket)
- Photo URLs are stored in:
  - `after_img_1`
  - `after_img_2`
  - `after_img_3`
  - `after_img_4`
- `completed_at` timestamp is recorded
- `updated_at` is updated

## Integration Points

### Backend Updates Needed
The following fields in `emergency_wash_requests` table are used:
- `assigned_to` - Stores the washer's user_id
- `status` - Tracks the current status
- `after_img_1`, `after_img_2`, `after_img_3`, `after_img_4` - Completion photos
- `completed_at` - When the wash was finished

### Frontend Routes
- `/washer/emergency-wash` - Main dashboard for washers
- Uses `/washers/match-customer-city/{taluko}` - To match washers (in admin)

### API Requirements
None new - uses existing Supabase tables:
- `emergency_wash_requests` table
- `profiles` table
- `notifications` table (for assignment alerts)
- `emergency-wash-photos` storage bucket (for photo uploads)

## Testing the Feature

1. **As Admin:**
   - Go to Admin Dashboard → Emergency Wash Management
   - Create a customer emergency wash request (or use an existing one)
   - In the "Assign Washer" modal, select a washer
   - Click "Assign"

2. **As Washer:**
   - Navigate to `/washer/emergency-wash`
   - You should see the assigned request in the "Assigned" status
   - Click on the request card to see full details
   - Click "Start Wash" to begin
   - Click "Complete & Upload Photos" to finish
   - Upload at least one photo and submit

3. **Verify in Admin:**
   - Go back to admin dashboard
   - Refresh the page
   - The request should now show "Completed" status
   - Photos should be visible

## Troubleshooting

### Washer doesn't see assigned requests
- Check that `assigned_to` field contains the washer's correct user_id
- Verify washer's `employee_type` is "washer"
- Clear browser cache and refresh

### Photos not uploading
- Ensure `emergency-wash-photos` bucket exists in Supabase Storage
- Check bucket permissions allow public uploads
- Verify file sizes (should be < 5MB)

### Status not updating
- Check browser console for errors
- Verify Supabase connection is active
- Ensure `emergency_wash_requests` table has all required columns

## Column Requirements

Make sure your `emergency_wash_requests` table has these columns:
- `id` (UUID, primary key)
- `user_id` (UUID, references profiles)
- `assigned_to` (UUID, references profiles.id - the washer)
- `status` (text: "Pending", "Assigned", "In Progress", "Completed")
- `car_model` (text)
- `car_plate` (text)
- `car_color` (text)
- `car_type` (text, optional)
- `address` (text)
- `taluko` (text)
- `after_img_1`, `after_img_2`, `after_img_3`, `after_img_4` (text, image URLs)
- `completed_at` (timestamp, optional)
- `created_at` (timestamp)
- `updated_at` (timestamp)

## Next Steps

1. Test the complete flow from admin assignment to washer completion
2. Add a navbar menu item linking to `/washer/emergency-wash`
3. Set up notifications to alert washer when assigned
4. Consider adding rating/feedback feature after completion
