# Ratings Page - Testing Guide

## Problem Identified
The ratings page shows "N/A" and "0" because there are no ratings in the database yet. Ratings are created when customers rate their completed bookings.

## Solution

### Option 1: Create Sample Ratings (Quickest for Testing)

1. **Go to Employee Ratings Page**
   - Navigate to: `http://localhost:5173/employee/ratings`
   - Login as employee

2. **Click "Create Sample Ratings" Button**
   - In the "Detailed Reviews" section, you'll see an empty state
   - Click the blue **"📝 Create Sample Ratings (Dev)"** button
   - This will:
     - Find existing bookings assigned to you
     - Add 5 sample ratings to those bookings
     - Refresh the page with new data

3. **View Your Ratings**
   - Average Rating will show (e.g., 4.2)
   - Total Ratings count will update
   - Rating Distribution chart will populate
   - Detailed reviews will appear

### Option 2: Create Real Ratings (Production Flow)

1. **Complete a Booking**
   - Customer requests and completes a service
   - Booking status becomes "Completed"

2. **Customer Rates the Booking**
   - Customer navigates to their booking details
   - Submits a rating (1-5 stars) and optional comment
   - Rating is saved to the `bookings` table

3. **Employee Sees Rating**
   - Employee navigates to Ratings page
   - New ratings appear in the Detailed Reviews section
   - Statistics are automatically calculated

### Backend Endpoints

#### Get Employee Ratings
```
GET /ratings/employee/:employee_id
```
**Response:**
```json
{
  "success": true,
  "data": {
    "ratings": [
      {
        "id": "booking-uuid",
        "rating": 5,
        "rating_comment": "Great service!",
        "customer_name": "John Doe",
        "rated_at": "2025-12-01T10:30:00Z",
        ...
      }
    ],
    "statistics": {
      "totalRatings": 5,
      "averageRating": 4.2,
      "ratingCounts": { "5": 3, "4": 1, "3": 1, "2": 0, "1": 0 }
    }
  }
}
```

#### Create Sample Ratings (Dev Only)
```
POST /ratings/create-sample-ratings
Body: { "employee_id": "uuid" }
```
**Response:**
```json
{
  "success": true,
  "message": "Updated 5 bookings with sample ratings",
  "data": {
    "updatedCount": 5,
    "bookingIds": ["id1", "id2", "id3", "id4", "id5"]
  }
}
```

## Database Schema

The ratings are stored in the `bookings` table with these columns:
- `rating` - INTEGER (1-5 stars)
- `rating_comment` - TEXT (optional feedback)
- `rated_at` - TIMESTAMP (when rated)
- `customer_name` - TEXT (who rated)

## What You Should See

### When Ratings Exist:
✅ Average Rating shows the mean (e.g., 4.2 out of 5)
✅ Total Ratings shows count (e.g., 5)
✅ 5-Star Ratings shows count of 5-star ratings
✅ Rating Distribution shows bars for each star level
✅ Detailed Reviews shows list of all ratings with:
   - Customer name
   - Star rating display
   - Rating date
   - Customer comment
   - Car and service info

### When No Ratings Exist:
⚠️ "No ratings yet" message appears
⚠️ Sample Ratings button is visible for testing

## Troubleshooting

**Issue: Still seeing "N/A" after clicking sample ratings button**
- Make sure you have bookings assigned to you first
- Check browser console for error messages
- Ensure backend is running on port 5000

**Issue: Backend connection error**
- Verify backend is running: `npm start` in backend directory
- Check that Supabase credentials are correct in `.env`
- Ensure bookings table exists and has rating columns

**Issue: Button doesn't create ratings**
- Ensure you have at least one completed booking assigned to you
- Check browser Network tab for API response
- Look at backend console for detailed error

## Next Steps

Once testing is complete:
1. Remove the sample ratings function (or keep for dev environment)
2. Ensure real bookings are being completed and rated
3. Monitor rating trends over time
4. Consider adding rating filters (by date, service type, etc.)

