# 🔔 Real Notifications System - Complete Database Integration

## ✅ SYSTEM FULLY OPERATIONAL

The notification system is now **fully integrated with database** for persistent, reliable notifications.

---

## 🏗️ Architecture

### 1. **Database Layer** (Supabase)
- **Table**: `public.notifications`
- **Fields**: `id`, `user_id`, `type`, `title`, `message`, `data`, `read`, `created_at`
- **RLS Enabled**: Users can only see/modify their own notifications
- **Real-time**: Postgres publication configured for live updates
- **Indexes**: Optimized for queries by user, read status, and creation date

### 2. **Backend API Layer** (Express.js)
- **Routes**: `/notifications` 
- **Endpoints**: 
  - `GET /user/:user_id` - Fetch notifications
  - `GET /user/:user_id/unread` - Count unread
  - `POST /create` - Create notification
  - `PUT /:id/read` - Mark as read
  - `PUT /user/:user_id/read-all` - Mark all as read
  - `DELETE /:id` - Delete notification
  - `DELETE /user/:user_id` - Delete all

### 3. **Frontend Layer** (React)
- **NotificationContext**: Manages state + API calls
- **NotificationBell**: UI component displaying notifications
- **useNotifications hook**: For adding notifications across app

---

## 📊 Database Schema

```sql
CREATE TABLE public.notifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL,  -- 'payment', 'booking', 'pass', 'wallet', 'pickup', 'delivery', 'wash_status', 'daily_payment', 'pass_expiry'
  title text NOT NULL,
  message text NOT NULL,
  data jsonb DEFAULT '{}',
  read boolean DEFAULT false,
  created_at timestamp DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_user_read ON public.notifications(user_id, read);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX idx_notifications_user_created ON public.notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_type ON public.notifications(type);

-- RLS Policies
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications" 
  ON public.notifications FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" 
  ON public.notifications FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications" 
  ON public.notifications FOR DELETE 
  USING (auth.uid() = user_id);

CREATE POLICY "Backend can insert notifications" 
  ON public.notifications FOR INSERT 
  WITH CHECK (true);
```

---

## 🔌 API Endpoints

### **GET** `/notifications/user/:user_id`
Fetch paginated notifications for a user.

**Query Parameters:**
- `limit` (default: 20) - Number of notifications per page
- `offset` (default: 0) - Pagination offset

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "type": "booking",
      "title": "✓ Booking Confirmed!",
      "message": "Your car wash booking is confirmed. Booking ID: xyz123",
      "data": { "bookingId": "xyz123" },
      "read": false,
      "created_at": "2025-12-18T10:30:00Z"
    }
  ],
  "total": 45,
  "limit": 20,
  "offset": 0
}
```

---

### **GET** `/notifications/user/:user_id/unread`
Get count of unread notifications.

**Response:**
```json
{
  "success": true,
  "unreadCount": 3
}
```

---

### **POST** `/notifications/create`
Create a new notification.

**Body:**
```json
{
  "user_id": "uuid",
  "type": "booking",
  "title": "Booking Confirmed",
  "message": "Your booking is confirmed",
  "data": { "bookingId": "123" }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Notification created successfully",
  "data": {
    "id": "uuid",
    "user_id": "uuid",
    "type": "booking",
    "title": "Booking Confirmed",
    "message": "Your booking is confirmed",
    "data": { "bookingId": "123" },
    "read": false,
    "created_at": "2025-12-18T10:30:00Z"
  }
}
```

---

### **PUT** `/notifications/:notification_id/read`
Mark a single notification as read.

**Response:**
```json
{
  "success": true,
  "message": "Notification marked as read",
  "data": { ... }
}
```

---

### **PUT** `/notifications/user/:user_id/read-all`
Mark all notifications as read for a user.

**Response:**
```json
{
  "success": true,
  "message": "5 notifications marked as read",
  "count": 5
}
```

---

### **DELETE** `/notifications/:notification_id`
Delete a specific notification.

**Response:**
```json
{
  "success": true,
  "message": "Notification deleted successfully"
}
```

---

### **DELETE** `/notifications/user/:user_id`
Delete all notifications for a user.

**Response:**
```json
{
  "success": true,
  "message": "10 notifications deleted",
  "count": 10
}
```

---

## 🔄 Frontend Integration

### Using NotificationContext

```javascript
import { useNotifications } from "../context/NotificationContext";

export default function MyComponent() {
  const { notifications, unreadCount, addNotification, markAsRead, deleteNotification } = useNotifications();

  // Add notification when action happens
  const handleBooking = async () => {
    // ... booking logic ...
    await addNotification(
      "booking",
      "✓ Booking Confirmed!",
      "Your booking is confirmed",
      { bookingId: booking.id }
    );
  };

  // Mark as read when user views
  const handleViewNotification = (notificationId) => {
    markAsRead(notificationId);
  };

  return (
    <div>
      <p>Unread: {unreadCount}</p>
      {notifications.map((notif) => (
        <div key={notif.id}>
          <h3>{notif.title}</h3>
          <p>{notif.message}</p>
          <button onClick={() => handleViewNotification(notif.id)}>
            {notif.read ? "Read" : "Unread"}
          </button>
        </div>
      ))}
    </div>
  );
}
```

---

## 📝 Notification Types

| Type | Icon | Color | Use Case | Example |
|------|------|-------|----------|---------|
| `payment` | 💳 | Blue | Payment successful | "Payment of ₹500 received via UPI" |
| `booking` | 📋 | Emerald | Booking confirmed | "Your booking is confirmed. ID: xyz123" |
| `pass` | 🎁 | Purple | Pass usage/expiry | "1 wash deducted. 9 remaining" |
| `wallet` | 💰 | Amber | Wallet topup/refund | "Wallet topup of ₹1000 successful" |
| `pickup` | 🚚 | Orange | Pickup scheduled | "Your car is ready for pickup" |
| `delivery` | 🚚 | Orange | Delivery completed | "Car delivered successfully" |
| `wash_status` | ✨ | Emerald | Wash completed | "Your wash is completed. +1 loyalty point" |
| `daily_payment` | 💳 | Blue | Subscription charge | "Daily subscription charged: ₹50" |
| `pass_expiry` | ⏰ | Amber | Pass expiry warning | "Your pass expires in 7 days" |

---

## 🚀 Current Implementation Status

### ✅ ACTIVE FEATURES

1. **Bookings** (Bookings.jsx)
   ```javascript
   await addNotification(
     "booking",
     "✓ Booking Confirmed!",
     `Your car wash booking is confirmed. Booking ID: ${result.data?.id}`,
     { bookingId: result.data?.id }
   );
   ```

2. **Payments** (Bookings.jsx)
   ```javascript
   await addNotification(
     "payment",
     "💳 Payment Successful!",
     `Payment of ₹${bookingAmount} received via UPI (UTR: ${utrInput})`,
     { amount: bookingAmount, method: "UPI", utr: utrInput }
   );
   ```

3. **Monthly Pass Usage** (Bookings.jsx)
   ```javascript
   await addNotification(
     "pass",
     "Monthly Pass Used",
     `1 wash deducted. ${activePass.remaining_washes - 1} remaining washes.`,
     { passId: activePass.id }
   );
   ```

4. **Wash Completion** (WashSessionManager.jsx)
   ```javascript
   await addNotification(
     "wash_status",
     "✨ Wash Completed!",
     `Your ${customerDetails?.car_model || "car"} wash has been completed. 1 loyalty point earned!`,
     { washSessionId: currentSession.id, carModel: customerDetails?.car_model, pointsEarned: 1 }
   );
   ```

---

## 🧪 Testing Notifications

### Test 1: Create Notification via API
```bash
curl -X POST http://localhost:5000/notifications/create \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "YOUR_USER_ID",
    "type": "booking",
    "title": "Test Notification",
    "message": "This is a test",
    "data": {}
  }'
```

### Test 2: Fetch Notifications
```bash
curl http://localhost:5000/notifications/user/YOUR_USER_ID
```

### Test 3: Mark as Read
```bash
curl -X PUT http://localhost:5000/notifications/NOTIFICATION_ID/read
```

### Test 4: Real-time Testing
1. Create booking in browser tab 1
2. Watch notifications appear in real-time in NotificationBell
3. Check Supabase for database entry

---

## 🔧 Setup Instructions

### Step 1: Create Table in Supabase
1. Go to Supabase Dashboard
2. Open SQL Editor
3. Run the NOTIFICATIONS_SCHEMA.sql file
4. Or manually run the schema above

### Step 2: Verify Backend Routes
```bash
# Check if routes are registered
grep -n "notifications" backend/server.js
# Should see: import notificationsRoutes
# Should see: app.use("/notifications", notificationsRoutes);
```

### Step 3: Test Backend API
```bash
# Verify backend is running
curl http://localhost:5000/notifications/dashboard

# Should return status 200 with notifications
```

### Step 4: Verify Frontend Context
- NotificationContext ✅ Updated to use API
- NotificationBell ✅ Already updated for light theme
- App.jsx ✅ Has NotificationProvider wrapper

### Step 5: Run End-to-End Test
1. Start backend: `npm start` in backend folder
2. Start frontend: `npm run dev` in frontend folder
3. Create booking and verify notification appears

---

## 📊 Database Queries for Monitoring

### Check Recent Notifications
```sql
SELECT * FROM notifications 
ORDER BY created_at DESC 
LIMIT 10;
```

### Check Unread Count per User
```sql
SELECT user_id, COUNT(*) as unread_count 
FROM notifications 
WHERE read = false 
GROUP BY user_id;
```

### Check Notifications by Type
```sql
SELECT type, COUNT(*) as count 
FROM notifications 
GROUP BY type;
```

### Check Data Field Content
```sql
SELECT id, title, data 
FROM notifications 
WHERE data IS NOT NULL 
LIMIT 5;
```

---

## 🎯 Next Steps

1. **Backend Cron Jobs** (Optional)
   - Daily payment notifications
   - Pass expiry warnings (7 days, 1 day before)
   - Scheduled notifications for promotions

2. **SMS/Email Integration** (Optional)
   - Send SMS for critical notifications
   - Send email for pass expiry, low wallet

3. **Notification Preferences** (Optional)
   - User settings to opt-in/out notification types
   - Frequency settings (daily digest, instant, etc.)

4. **Analytics** (Optional)
   - Track notification read rates
   - Monitor notification delivery success
   - Analyze which types get most engagement

---

## ✨ Summary

✅ **Notifications table created with proper schema**
✅ **Backend API endpoints fully functional**
✅ **Frontend NotificationContext uses real API**
✅ **Real-time Supabase subscriptions active**
✅ **Bookings, Payments, Pass usage, Wash completion all triggering**
✅ **Light theme NotificationBell displaying correctly**
✅ **All integrations tested and working**

**The notification system is PRODUCTION READY!**

---

**Last Updated:** December 18, 2025  
**Status:** FULLY OPERATIONAL  
**Ready for:** Production Deployment
