# Pass Expiration Notification System - Quick Setup Guide

## Overview
This system automatically notifies admins when customer monthly passes expire. It includes:
- Automated expiration detection
- Admin notifications in the notification system
- Admin dashboard view for expired and expiring passes
- Ability to trigger notifications manually

## Database Setup

First, run the SQL schema to add the necessary column to the `monthly_pass` table:

```sql
-- File: backend/PASS_EXPIRATION_SCHEMA.sql
ALTER TABLE monthly_pass
ADD COLUMN IF NOT EXISTS notified BOOLEAN DEFAULT FALSE;

UPDATE monthly_pass
SET notified = TRUE
WHERE valid_till < NOW();

CREATE INDEX IF NOT EXISTS idx_monthly_pass_valid_till ON monthly_pass(valid_till);
CREATE INDEX IF NOT EXISTS idx_monthly_pass_notified ON monthly_pass(notified);
```

## Backend Setup

### 1. Routes Added
- **File**: `backend/routes/passExpirationRoutes.js`
- **Endpoints**:
  - `POST /pass-expiration/check-expired-passes` - Manually trigger notifications
  - `GET /pass-expiration/expired-passes` - Get all expired passes
  - `GET /pass-expiration/expiring-soon` - Get passes expiring within 7 days

### 2. Server Configuration
The `passExpirationRoutes.js` has been added to `backend/server.js`:
```javascript
import passExpirationRoutes from "./routes/passExpirationRoutes.js";
app.use("/pass-expiration", passExpirationRoutes);
```

## Frontend Setup

### 1. Admin Component
- **File**: `frontend/src/Admin/ExpiredPassesNotification.jsx`
- Displays expired and expiring passes
- Shows customer details, car info, and pass status
- Has tab interface to switch between "Expired" and "Expiring Soon"

### 2. Admin Dashboard Integration
- **File**: `frontend/src/Admin/AdminDashboard.jsx`
- Menu item added: "Pass Expirations"
- Component integrated to display when selected
- "Send Notifications" button to manually trigger notifications

## How It Works

### 1. Automatic Detection
The system checks for expired passes based on the `valid_till` date in the `monthly_pass` table.

### 2. Notification Creation
When a pass expires:
- Creates a notification entry for each admin
- Sets `notified = TRUE` on the pass (prevents duplicate notifications)
- Notification includes customer name, car details, and pass info

### 3. Admin Dashboard View
Admins can:
- View all expired passes
- View passes expiring within 7 days
- See customer and car details
- Manually trigger notifications if needed

## Data Structure

### Notification Record
```javascript
{
  user_id: "admin_id",
  type: "pass_expired",
  title: "Monthly Pass Expired",
  message: "Monthly Pass Expired: Toyota Fortuner (ABC-1234) - Customer: john@example.com",
  related_id: "pass_id",
  is_read: false,
  created_at: "2025-12-09T10:30:00Z"
}
```

### Pass Data Structure
```javascript
{
  id: "pass_id",
  customer_id: "customer_id",
  car_id: "car_id",
  total_washes: 10,
  remaining_washes: 2,
  valid_till: "2025-12-15T23:59:59Z",
  notified: true,
  cars: {
    brand: "Toyota",
    model: "Fortuner",
    number_plate: "ABC-1234"
  },
  profiles: {
    full_name: "John Doe",
    email: "john@example.com"
  }
}
```

## API Examples

### Manually Trigger Notifications
```bash
curl -X POST http://localhost:5000/pass-expiration/check-expired-passes
```

Response:
```json
{
  "success": true,
  "message": "Notifications sent for 5 expired passes",
  "notificationsSent": 15,
  "expiredPasses": 5
}
```

### Get Expired Passes
```bash
curl http://localhost:5000/pass-expiration/expired-passes
```

### Get Expiring Soon Passes (7 days)
```bash
curl http://localhost:5000/pass-expiration/expiring-soon
```

## Automation (Optional - Recommended)

For production, you should set up automatic checks. Add a cron job or scheduled task:

### Option 1: Node Cron (Recommended)
```bash
npm install node-cron --save
```

Add to `backend/server.js`:
```javascript
import cron from 'node-cron';

// Run every day at 8:00 AM
cron.schedule('0 8 * * *', async () => {
  try {
    const response = await fetch('http://localhost:5000/pass-expiration/check-expired-passes', {
      method: 'POST'
    });
    const data = await response.json();
    console.log('✅ Pass expiration check completed:', data);
  } catch (error) {
    console.error('❌ Error checking expired passes:', error);
  }
});
```

### Option 2: External Cron Service
Use a service like cron-job.org to call the endpoint periodically.

## Testing

### Manual Test Steps
1. **Create Test Data**: Create a pass with an expiration date in the past
2. **Admin Access**: Go to Admin Dashboard → Pass Expirations
3. **View Expired**: Should see the test pass in "Expired" tab
4. **Send Notification**: Click "Send Notifications" button
5. **Check Notifications**: Go to Notifications to see admin notification
6. **Verify DB**: Check that `notified = TRUE` for the pass

## Features

✅ **Expired Pass Detection** - Automatically identifies passes past their expiration date
✅ **Admin Notifications** - Creates notifications in the notification system
✅ **Expiring Soon Alerts** - Shows passes expiring within 7 days
✅ **Dashboard View** - Beautiful UI to manage expirations
✅ **Manual Trigger** - Ability to send notifications on-demand
✅ **Duplicate Prevention** - Uses `notified` flag to prevent duplicate notifications
✅ **Comprehensive Data** - Shows customer, car, and pass details

## Troubleshooting

### Notifications Not Showing
- Check that admin profile exists with role="admin"
- Verify notifications table has required columns
- Check browser notifications section for is_read filter

### Passes Not Showing as Expired
- Verify `valid_till` is a valid timestamp
- Ensure timezone is correct (uses UTC)
- Check that `notified` column exists

### API Errors
- Ensure backend is running on port 5000
- Check database connection
- Verify user authentication if needed

## Future Enhancements

- [ ] Email notifications to customers about expiring passes
- [ ] SMS reminders for customers
- [ ] Auto-renewal options for passes
- [ ] Pass renewal discount incentives
- [ ] Usage analytics for expired passes
- [ ] Customer dashboard widget for pass status
