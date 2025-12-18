# 🔔 Real Notifications System - Complete Setup

## ✅ System Status: FULLY INTEGRATED

The notification system is now fully operational with real-time Supabase integration.

---

## 📋 Architecture Overview

### 1. **NotificationContext** (`frontend/src/context/NotificationContext.jsx`)
- Real-time Supabase integration via `supabase.channel()`
- Auto-subscribes to notifications for logged-in user
- Provides methods: `addNotification()`, `markAsRead()`, `markAllAsRead()`, `deleteNotification()`
- Notification types: `payment`, `booking`, `pass`, `wallet`, `pickup`, `delivery`, `wash_status`, `daily_payment`, `pass_expiry`

### 2. **NotificationBell Component** (`frontend/src/components/NotificationBell.jsx`)
- Dropdown menu showing real notifications (not mock data)
- Displays unread count badge on bell icon
- Shows notification icons based on type (blue for payment, emerald for booking, etc.)
- Light theme styling with white cards and slate borders

### 3. **Database Schema** (`backend/NOTIFICATIONS_SCHEMA.sql`)
- Table: `notifications` with RLS policies
- Fields: `id`, `user_id`, `type`, `title`, `message`, `data`, `read`, `created_at`
- Real-time subscription enabled via Postgres events

### 4. **App Wrapper** (`frontend/src/App.jsx`)
- `NotificationProvider` wraps all routes
- All components can access notifications via `useNotifications()` hook

---

## 🔗 Feature Integration Points

### ✅ **Booking Creation** (Bookings.jsx)
**Trigger:** When booking is confirmed
```javascript
await addNotification(
  "booking",
  "✓ Booking Confirmed!",
  `Your car wash booking is confirmed. Booking ID: ${result.data?.id}`,
  { bookingId: result.data?.id }
);
```
📍 **Line:** ~476 in Bookings.jsx

---

### ✅ **Payment Successful** (Bookings.jsx)
**Trigger:** When UPI payment is verified
```javascript
await addNotification(
  "payment",
  "💳 Payment Successful!",
  `Payment of ₹${bookingAmount} received via UPI (UTR: ${utrInput})`,
  { amount: bookingAmount, method: "UPI", utr: utrInput }
);
```
📍 **Line:** ~828 in Bookings.jsx

---

### ✅ **Monthly Pass Usage** (Bookings.jsx)
**Trigger:** When wash is deducted from monthly pass
```javascript
await addNotification(
  "pass",
  "Monthly Pass Used",
  `1 wash deducted. ${activePass.remaining_washes - 1} remaining washes.`,
  { passId: activePass.id }
);
```
📍 **Line:** ~438 in Bookings.jsx

---

### ✅ **Wash Session Completion** (WashSessionManager.jsx) - NEW
**Trigger:** When employee marks wash as completed with before/after images
```javascript
await addNotification(
  "wash_status",
  "✨ Wash Completed!",
  `Your ${customerDetails?.car_model || "car"} wash has been completed. 1 loyalty point earned!`,
  {
    washSessionId: currentSession.id,
    carModel: customerDetails?.car_model,
    pointsEarned: 1,
  }
);
```
📍 **Line:** ~169-183 in WashSessionManager.jsx

---

## 🎯 Notification Types & Colors

| Type | Icon | Color | Use Case |
|------|------|-------|----------|
| `payment` | 💳 Credit Card | Blue (blue-50, blue-200) | Payment successful, wallet topup |
| `booking` | 📋 Clipboard | Emerald (emerald-50, emerald-200) | Booking confirmed, booking updates |
| `pass` | 🎁 Gift | Purple (purple-50, purple-200) | Pass purchased, pass used, pass expiry warning |
| `wallet` | 💰 Dollar Sign | Amber (amber-50, amber-200) | Wallet topup, cashback, refund |
| `pickup` | 🚚 Truck | Orange (orange-50, orange-200) | Pickup scheduled, in progress |
| `delivery` | 🚚 Truck | Orange (orange-50, orange-200) | Delivery started, completed |
| `wash_status` | ✨ Check | Emerald (emerald-50, emerald-200) | Wash completed, wash in progress |
| `daily_payment` | 💳 Payment | Blue | Daily subscription charge, bill |
| `pass_expiry` | ⏰ Clock | Amber | Pass expiry warning (7 days, 1 day) |

---

## 📱 Real-Time Flow

### How Notifications Work:

1. **Event Triggers** (Frontend)
   - User completes booking → `addNotification("booking", ...)`
   - Payment verified → `addNotification("payment", ...)`
   - Wash completed → `addNotification("wash_status", ...)`

2. **Database Insert** (Supabase)
   - Data sent to `notifications` table with `user_id`
   - Postgres fires INSERT event

3. **Real-Time Subscription** (Realtime)
   - `NotificationContext` listens via `supabase.channel()`
   - Receives payload and updates state

4. **UI Updates** (NotificationBell)
   - Bell icon shows unread count
   - Dropdown displays newest notifications first
   - Clicking notification marks it as read

---

## 🔧 How to Add New Notifications

### Step 1: Import the hook
```javascript
import { useNotifications } from "../context/NotificationContext";

// Inside component
const { addNotification } = useNotifications();
```

### Step 2: Trigger notification
```javascript
await addNotification(
  "payment",                  // type (must be in database schema)
  "Payment Received",        // title
  "₹500 received",           // message
  { amount: 500, id: 123 }   // data (optional, stored as JSON)
);
```

### Step 3: Verify notification appears
- Check NotificationBell in UI
- Should show in dropdown with correct icon/color
- Database will record in `notifications` table

---

## 🚀 Testing Notifications

### Manual Testing:

1. **Create a Booking**
   - Go to `/bookings`
   - Create a booking → Should see "Booking Confirmed!" notification
   - Look at NotificationBell in navbar

2. **Complete a Payment**
   - During booking, select UPI payment
   - Enter UTR → Should see "Payment Successful!" notification

3. **Complete a Wash** (Admin/Employee)
   - Go to WashSessionManager
   - Scan QR, upload before/after images
   - Click "Mark as Washed" → Should see "Wash Completed!" notification

4. **Use Monthly Pass**
   - Have active monthly pass
   - Create booking with "Use Pass" checked
   - Should see "Monthly Pass Used" notification

---

## 🔄 Real-Time Testing via SQL

### Check notifications in Supabase:
```sql
SELECT * FROM notifications 
WHERE user_id = 'YOUR_USER_ID' 
ORDER BY created_at DESC 
LIMIT 10;
```

### Clear old notifications:
```sql
DELETE FROM notifications 
WHERE created_at < NOW() - INTERVAL '7 days';
```

---

## ⚠️ Common Issues & Solutions

### Issue: Notifications not appearing
**Solution:**
1. Verify `NotificationProvider` wraps App routes ✅
2. Check browser console for errors
3. Ensure user is authenticated
4. Check Supabase RLS policies allow SELECT/UPDATE for `notifications` table

### Issue: Notifications table doesn't have `wash_status` type
**Solution:**
Run the updated schema:
```sql
ALTER TABLE notifications 
DROP CONSTRAINT notifications_type_check;

ALTER TABLE notifications 
ADD CONSTRAINT notifications_type_check 
CHECK (type IN ('payment', 'booking', 'pass', 'wallet', 'pickup', 'delivery', 'wash_status', 'daily_payment', 'pass_expiry'));
```

### Issue: Real-time updates not working
**Solution:**
1. Check `realtime` extension enabled in Supabase
2. Verify `ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;`
3. Check Supabase logs for subscription errors

---

## 📊 Notification Statistics

### Where Notifications Trigger:
| Feature | Location | Type | Status |
|---------|----------|------|--------|
| Booking Creation | `Bookings.jsx:476` | `booking` | ✅ Active |
| UPI Payment | `Bookings.jsx:828` | `payment` | ✅ Active |
| Pass Usage | `Bookings.jsx:438` | `pass` | ✅ Active |
| Wash Completion | `WashSessionManager.jsx:169` | `wash_status` | ✅ Active |
| Emergency Wash Request | `EmergencyWashRequest.jsx` | `pickup` | ⏳ Ready |
| Wallet Topup | `Transactions.jsx` | `wallet` | ⏳ Ready |
| Daily Payment | Backend | `daily_payment` | ⏳ Pending |
| Pass Expiry | Backend | `pass_expiry` | ⏳ Pending |

---

## 🎨 UI Components Status

### NotificationBell Component:
- ✅ Light theme styling (white bg, slate borders)
- ✅ Icons for all notification types
- ✅ Unread count badge
- ✅ Mark as read functionality
- ✅ Delete notification functionality
- ✅ Real-time updates from Supabase

### Notification Card Styling:
- ✅ Light backgrounds (`bg-blue-50`, `bg-emerald-50`, etc.)
- ✅ Colored borders matching type
- ✅ Hover effects
- ✅ Timestamps
- ✅ Delete button

---

## ✨ Next Steps

1. **Daily Payment Notifications**
   - Add backend scheduled job to trigger at daily payment time
   - Send `daily_payment` type notification

2. **Pass Expiry Warnings**
   - Add backend cron job to check expiring passes
   - Send `pass_expiry` type notification (7 days before, 1 day before)

3. **SMS/Email Integration** (Optional)
   - Send SMS for critical notifications (payment, booking)
   - Send email for pass expiry, low wallet

4. **Notification Preferences**
   - Add settings page for notification types
   - Allow users to opt-in/out for certain types

---

## 📝 Summary

✅ **Complete notification system with real-time Supabase integration**
- Database schema updated with all notification types
- NotificationContext provides real-time updates
- NotificationBell displays notifications with proper styling
- Bookings, Payments, Pass usage, Wash completion all trigger notifications
- App properly wrapped with NotificationProvider
- System ready for extended features (daily payments, pass expiry, etc.)

🎉 **The notification system is LIVE and WORKING!**
