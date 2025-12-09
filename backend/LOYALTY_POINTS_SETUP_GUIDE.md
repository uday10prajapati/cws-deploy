# Washer Loyalty Points System - Implementation Guide

## Overview
This system rewards washers with loyalty points for each car they wash. Points are tracked daily and all-time, with notifications sent to both the washer and admin whenever a point is earned.

## What Was Built

### 1. **Backend Routes** (`loyaltyPointsRoutes.js`)
- `POST /loyalty/loyalty/record-wash` - Record a car wash and earn point
- `GET /loyalty/loyalty/:washer_id` - Get washer's loyalty data
- `GET /loyalty/loyalty/leaderboard` - Get all washers ranked by points
- `GET /loyalty/history/:washer_id` - Get washer's wash history
- `GET /loyalty/admin/daily-summary` - Get today's wash summary (admin)
- `POST /loyalty/loyalty/reset-daily` - Reset daily counters (automated task)

### 2. **Frontend Components**

#### Washer Component: `WasherLoyaltyPoints.jsx`
- Displays washer's loyalty data
- Shows total points, today's washes, all-time washes
- Displays wash history for last 30 days
- Shows reward tiers (Bronze, Silver, Gold)
- Accessible at `/washer/loyalty-points`

#### Admin Component: `AdminLoyaltyDashboard.jsx`
- Dashboard with today's summary stats
- Active washers count
- Total cars washed today
- Points earned today
- Leaderboard ranking all washers by total points
- Shows medals for top 3 (🥇🥈🥉)

## Database Schema

### Tables Created

#### `washer_loyalty_points`
```sql
- id (UUID, Primary Key)
- washer_id (UUID, FK to profiles)
- total_points (INT) - All-time points
- cars_washed_today (INT) - Reset daily
- cars_washed_all_time (INT) - Never resets
- last_wash_date (DATE) - Track if washed today
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### `wash_history`
```sql
- id (UUID, Primary Key)
- washer_id (UUID, FK to profiles)
- car_id (UUID, FK to cars)
- booking_id (UUID, FK to bookings, optional)
- wash_date (DATE)
- created_at (TIMESTAMP)
```

## Integration Points

### How to Record a Wash
When a washer completes a car wash, call this endpoint:

```javascript
// Backend Integration Example
const recordWash = async (washer_id, car_id, booking_id) => {
  const res = await fetch("http://localhost:5000/loyalty/loyalty/record-wash", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      washer_id,
      car_id,
      booking_id // optional
    })
  });
  const data = await res.json();
  return data;
};
```

### Expected Response
```json
{
  "success": true,
  "message": "Loyalty point recorded successfully",
  "loyalty": {
    "id": "uuid",
    "washer_id": "uuid",
    "total_points": 42,
    "cars_washed_today": 5,
    "cars_washed_all_time": 42,
    "last_wash_date": "2025-12-09"
  },
  "notification": {
    "type": "loyalty_point_earned",
    "points_earned": 1,
    "total_points": 42,
    "cars_washed_today": 5,
    "cars_washed_all_time": 42
  }
}
```

## Data Flow

### When a Washer Completes a Wash:
```
1. Frontend calls POST /loyalty/loyalty/record-wash
                        ↓
2. Backend checks if washer has loyalty record
                        ↓
3. Creates new record OR updates existing
                        ↓
4. Increments total_points by 1
                        ↓
5. Resets cars_washed_today if new day
                        ↓
6. Increments cars_washed_today by 1
                        ↓
7. Records wash in wash_history table
                        ↓
8. Creates notification for WASHER
   (Type: "loyalty_point_earned")
                        ↓
9. Creates notification for ALL ADMINS
   (Type: "washer_loyalty_update")
                        ↓
10. Returns success with updated loyalty data
```

## Key Features

✅ **Daily Tracking** - Counts washes per day separately
✅ **All-Time Points** - Never resets, shows total contribution
✅ **Automatic Notifications** - Washer and admin both notified
✅ **Wash History** - Detailed tracking of every wash with car info
✅ **Leaderboard** - Competitive ranking among washers
✅ **Daily Summary** - Admin can see today's activity at a glance
✅ **Reward Tiers** - Visual progression (Bronze 20+, Silver 50+, Gold 100+)

## Frontend Integration

### Add Menu Item to Washer Dashboard
In your washer dashboard/menu, add:
```jsx
<Link to="/washer/loyalty-points" className="menu-item">
  🎫 Loyalty Points
</Link>
```

### Admin Menu Item
Already added to AdminDashboard.jsx:
- Menu item: "Loyalty Points"
- Accessible in admin sidebar

## Usage Examples

### For Washers
1. Washer completes a car wash
2. System records the wash
3. Washer gets notification: "You earned 1 loyalty point! Total: 42 points"
4. Washer can view profile at `/washer/loyalty-points`
5. See daily and all-time stats
6. View last 30 days of wash history
7. Track progress toward reward tiers

### For Admins
1. Admin goes to Dashboard → "Loyalty Points"
2. Views today's summary:
   - How many washers worked today
   - Total cars washed
   - Total points earned
   - Average cars per washer
3. Clicks "Leaderboard" tab
4. Sees ranking of all washers by points
5. Can identify top performers
6. Dashboard auto-refreshes every 5 minutes

## Database Setup

Run this SQL in Supabase:

```sql
-- File: backend/LOYALTY_POINTS_SCHEMA.sql
-- (Already created, just execute in Supabase SQL editor)
```

## Points System

| Action | Points |
|--------|--------|
| Car Washed | +1 point |
| Daily Reset | cars_washed_today → 0, total_points stays |
| New Washer | Starting at 0 points |

## Rewards Tiers

| Tier | Points Needed | Badge | Incentive |
|------|---------------|-------|-----------|
| Bronze | 20+ | 🎯 | Good start |
| Silver | 50+ | ⭐ | Reliable performer |
| Gold | 100+ | 🏆 | Top performer |

## Notifications

### Washer Notification
```
Title: "Loyalty Point Earned! 🎉"
Message: "You earned 1 loyalty point! Total: 42 points | Today: 5 cars"
Type: "loyalty_point_earned"
```

### Admin Notification
```
Title: "Washer Completed Wash"
Message: "[Washer Name] washed a car. Total points today: 5 | All-time points: 42"
Type: "washer_loyalty_update"
```

## Files Created/Modified

### Created:
- ✅ `backend/routes/loyaltyPointsRoutes.js` - All API endpoints
- ✅ `backend/LOYALTY_POINTS_SCHEMA.sql` - Database schema
- ✅ `frontend/src/Washer/WasherLoyaltyPoints.jsx` - Washer dashboard
- ✅ `frontend/src/Admin/AdminLoyaltyDashboard.jsx` - Admin dashboard

### Modified:
- ✅ `backend/server.js` - Added loyalty routes
- ✅ `frontend/src/Admin/AdminDashboard.jsx` - Added menu item & component
- ✅ `frontend/src/App.jsx` - Added route for washer loyalty points

## Testing Checklist

- [ ] Database schema applied (tables created)
- [ ] Backend routes working (all 6 endpoints)
- [ ] Washer can view loyalty page at `/washer/loyalty-points`
- [ ] Admin can view loyalty in dashboard
- [ ] Recording a wash increases points correctly
- [ ] Notifications appear for washer and admin
- [ ] Wash history shows correct data
- [ ] Leaderboard ranks washers correctly
- [ ] Daily counter resets after midnight
- [ ] All-time counter keeps accumulating

## How to Call Recording Endpoint

When a washer marks a booking as complete (wash finished), call:

```javascript
// In your booking completion handler
const handleWashComplete = async (bookingId, washerId, carId) => {
  const res = await fetch("http://localhost:5000/loyalty/loyalty/record-wash", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      washer_id: washerId,
      car_id: carId,
      booking_id: bookingId
    })
  });
  
  const data = await res.json();
  if (data.success) {
    console.log("✅ Loyalty point earned!");
    console.log(`Total points: ${data.loyalty.total_points}`);
    // Refresh washer's loyalty points display
  }
};
```

## Support & Troubleshooting

**Points not updating?**
- Check that booking has washer_id and car_id
- Verify database tables exist
- Check browser console for fetch errors

**Notifications not showing?**
- Ensure notification table has all required columns
- Check that washer/admin IDs are valid
- Verify notifications are being fetched in UI

**Leaderboard empty?**
- Make sure at least one wash has been recorded
- Check that washer profile exists in database
- Verify washer_id reference is correct

## Future Enhancements

- [ ] Points expiration system (e.g., points valid for 1 year)
- [ ] Redemption system (convert points to bonuses)
- [ ] Bonus points for high ratings
- [ ] Streak tracking (consecutive days worked)
- [ ] Team competitions
- [ ] Monthly cash bonuses based on points
- [ ] Mobile app notifications
- [ ] Email notifications for milestones

---

**System Ready!** ✅ Washers can now earn and track loyalty points!
