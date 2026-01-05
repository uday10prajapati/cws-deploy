# Live Location Tracking - Implementation Guide

## Overview
Complete real-time live location tracking system for on-demand washer service with Supabase Realtime.

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    WASHER (Live Location Sender)                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ 1. Get GPS Location (every 5 sec)                        │   │
│  │ 2. Send to Backend API (/api/live-tracking/update-location) │
│  │ 3. Backend stores in live_tracking table                 │   │
│  └──────────────────────────────────────────────────────────┘   │
└──────────────┬─────────────────────────────────────────────────┘
               │
               │ HTTP/REST (every 5 seconds)
               │
┌──────────────▼─────────────────────────────────────────────────┐
│                  BACKEND (Node.js Express)                      │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ POST /api/live-tracking/start          - Start tracking  │   │
│  │ POST /api/live-tracking/update-location - Send location  │   │
│  │ POST /api/live-tracking/reached         - Mark arrived   │   │
│  │ GET  /api/live-tracking/:trackingId     - Get status     │   │
│  └──────────────────────────────────────────────────────────┘   │
└──────────────┬─────────────────────────────────────────────────┘
               │
               │ Saves to PostgreSQL
               │
┌──────────────▼─────────────────────────────────────────────────┐
│              DATABASE (Supabase PostgreSQL)                     │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ live_tracking table:                                      │   │
│  │ - id, request_id, washer_id, customer_id                 │   │
│  │ - latitude, longitude, accuracy, speed                   │   │
│  │ - status (on_the_way, reached, stopped)                  │   │
│  │ - updated_at (triggers realtime updates)                 │   │
│  └──────────────────────────────────────────────────────────┘   │
└──────────────┬─────────────────────────────────────────────────┘
               │
               │ Supabase Realtime (WebSocket)
               │
┌──────────────▼─────────────────────────────────────────────────┐
│                CUSTOMER (Live Location Receiver)                │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ 1. Subscribe to live_tracking updates (Realtime)          │   │
│  │ 2. Receive location updates in real-time                  │   │
│  │ 3. Update map with washer position                        │   │
│  │ 4. Show status: "On the way" or "Arrived"                │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## Database Schema

### live_tracking table
```sql
CREATE TABLE live_tracking (
  id UUID PRIMARY KEY,
  request_id UUID (references emergency_wash_requests),
  washer_id UUID (references auth.users),
  customer_id UUID (references auth.users),
  
  -- Location
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  accuracy DECIMAL(7, 2),      -- GPS accuracy in meters
  heading DECIMAL(6, 2),        -- Direction in degrees
  speed DECIMAL(6, 2),          -- Speed in m/s
  
  -- Status
  status VARCHAR(20),           -- 'on_the_way', 'reached', 'stopped'
  tracking_started_at TIMESTAMP,
  reached_at TIMESTAMP,
  
  -- Metadata
  created_at TIMESTAMP,
  updated_at TIMESTAMP,         -- Triggers Realtime
  distance_covered DECIMAL(10, 2),
  estimated_arrival TIMESTAMP,
  notes TEXT
);
```

## Setup Instructions

### 1. Database Migration
Run this in Supabase SQL editor:
```sql
-- Copy entire content from backend/migrations/create_live_tracking_table.sql
-- and paste in Supabase SQL Editor
```

### 2. Backend Setup

#### Install dependencies (if needed)
```bash
npm install
```

#### Register route in server.js
```javascript
import liveTrackingRoutes from './routes/liveTrackingRoutes.js';

// In your express app setup:
app.use('/api/live-tracking', authMiddleware, liveTrackingRoutes);
```

#### Ensure authMiddleware is set up
```javascript
// middleware/authMiddleware.js should extract user from JWT
req.user = { id: user_id_from_token }
```

### 3. Frontend Setup

#### Add routes to App.jsx
```jsx
import WasherEmergencyWashTracking from './Washer/WasherEmergencyWashTracking';
import CustomerEmergencyWashLiveTracking from './Customer/CustomerEmergencyWashLiveTracking';

// In your router:
<Route path="/washer/emergency-wash/tracking" element={<WasherEmergencyWashTracking />} />
<Route path="/customer/emergency-wash/tracking" element={<CustomerEmergencyWashLiveTracking />} />
```

#### Add link in Emergency Wash Assignment
From AdminEmergencyWashManagement.jsx, add tracking link:
```jsx
<Link to={`/washer/emergency-wash/tracking?requestId=${request.id}`}>
  View Live Tracking
</Link>
```

### 4. Map Integration (Optional)

Replace the map placeholder with:
- **Google Maps**: Use `@react-google-maps/api`
- **Mapbox**: Use `mapbox-gl` or `react-map-gl`
- **Leaflet**: Use `react-leaflet`

Example with react-leaflet:
```bash
npm install react-leaflet leaflet
```

## API Endpoints

### 1. Start Live Tracking
**POST** `/api/live-tracking/start`

Request:
```json
{
  "requestId": "uuid",
  "customerId": "uuid",
  "latitude": 23.1234,
  "longitude": 72.5678,
  "accuracy": 10.5,
  "heading": 45.2,
  "speed": 15.3
}
```

Response:
```json
{
  "success": true,
  "trackingId": "uuid",
  "message": "Live tracking started"
}
```

### 2. Update Location (Called every 5 seconds)
**POST** `/api/live-tracking/update-location`

Request:
```json
{
  "trackingId": "uuid",
  "latitude": 23.1235,
  "longitude": 72.5679,
  "accuracy": 10.2,
  "heading": 45.5,
  "speed": 15.5
}
```

### 3. Mark as Reached
**POST** `/api/live-tracking/reached`

Request:
```json
{
  "trackingId": "uuid"
}
```

Response:
```json
{
  "success": true,
  "message": "Status updated to reached",
  "reachedAt": "2024-01-05T15:30:45Z"
}
```

### 4. Get Tracking Status
**GET** `/api/live-tracking/:trackingId`

Response:
```json
{
  "success": true,
  "tracking": {
    "id": "uuid",
    "request_id": "uuid",
    "washer_id": "uuid",
    "latitude": 23.1235,
    "longitude": 72.5679,
    "status": "on_the_way",
    "updated_at": "2024-01-05T15:30:45Z"
  }
}
```

## Washer Side Flow

1. **Emergency request received** → Shows request details
2. **Admin assigns washer** → Washer gets notification
3. **Washer clicks "I am starting to reach you"**
   - Browser requests GPS permission
   - Gets current location
   - Creates tracking record via `/api/live-tracking/start`
   - Starts watching position (`navigator.geolocation.watchPosition`)
4. **Location updates**
   - Every 5 seconds, sends location via `/api/live-tracking/update-location`
   - Frontend shows: lat/lon, speed, accuracy
5. **Washer clicks "I have reached"**
   - Calls `/api/live-tracking/reached`
   - Stops location watching
   - Customer gets real-time notification

## Customer Side Flow

1. **Washer gets assigned** → Customer sees "Waiting for washer"
2. **Washer starts tracking** → Customer subscribes to real-time updates
3. **Live tracking active**
   - Map shows washer location (updates in real-time)
   - Shows speed, accuracy, last update time
   - Customer sees "Washer is on the way"
4. **Washer reaches location**
   - Real-time update received
   - Status changes to "Washer has arrived"
   - Notification sent to customer (if browser notifications enabled)

## Real-time Implementation

### Supabase Realtime (WebSocket)

The customer component automatically subscribes to updates:

```javascript
const realtimeChannelRef = useRef(null);

realtimeChannelRef.current = supabase
  .channel(`tracking:${trackingId}`)
  .on(
    "postgres_changes",
    {
      event: "UPDATE",
      schema: "public",
      table: "live_tracking",
      filter: `id=eq.${trackingId}`,
    },
    (payload) => {
      setTracking(payload.new);  // Update UI instantly
      if (payload.new.status === "reached") {
        showNotification("Washer has arrived!");
      }
    }
  )
  .subscribe();
```

**Advantages:**
- ✅ True real-time (WebSocket)
- ✅ No polling overhead
- ✅ Built into Supabase
- ✅ Automatic cleanup
- ✅ Secure with RLS

## Edge Cases Handled

### 1. App in Background
```javascript
// Location tracking continues in background (if OS allows)
// For iOS: Configure app to track location in background
// For Android: Use foreground service
```

### 2. Network Loss
```javascript
// If update fails (500ms timeout):
// - Next location will be sent in 5 seconds
// - No manual retry needed (automatic)
// - User sees "last update" time
```

### 3. Location Permission Denied
```javascript
// Error is caught and shown to user:
// "❌ Please enable location services"
// Button remains clickable for retry
```

### 4. Stopped Tracking
```javascript
// If tracking >30 mins without reaching:
// Admin can manually stop tracking
// Customer gets notification
```

### 5. Accuracy Issues
```javascript
// Low accuracy GPS? Shows warning:
// "Accuracy: 150m (High uncertainty)"
// User can wait for better fix or proceed
```

## Security (RLS Policies)

- **Customers**: Can only view tracking for their requests
- **Washers**: Can insert/update only their own tracking
- **Admins**: Can manage tracking if needed
- **Service Role**: Backend can manage for automated tasks

## Performance Optimization

1. **Location Update Frequency**: 5 seconds (configurable)
2. **Database Indexes**: On request_id, washer_id, updated_at
3. **Realtime Subscriptions**: Only one per tracking record
4. **Cleanup**: Automatic unsubscribe on component unmount
5. **Memory**: Watch ID cleared on stop

## Testing

### Test Washer Tracking
1. Go to Emergency Wash Admin page
2. Assign a wash to washer "sky"
3. Visit `/washer/emergency-wash/tracking?requestId=<REQUEST_ID>`
4. Click "I am starting to reach you"
5. Check browser console for location updates

### Test Customer View
1. Visit `/customer/emergency-wash/tracking?requestId=<REQUEST_ID>`
2. Should show "Waiting for Washer"
3. Once washer starts, should see real-time location updates
4. Check browser console for realtime subscription

### Test Reach Destination
1. Washer clicks "I have reached"
2. Status updates to "reached" in database
3. Customer sees "Washer has arrived" immediately (realtime)

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Location not updating | Check GPS permission, ensure accuracy > 0 |
| Real-time not working | Check Supabase Realtime enabled in settings |
| Tracking shows old location | Refresh page, check `updated_at` time |
| "Unauthorized" error | Ensure JWT token valid, user_id matches |
| High accuracy/low signal | Use `enableHighAccuracy: true` (uses more battery) |

## Next Steps

1. ✅ Database schema created
2. ✅ Backend APIs implemented
3. ✅ Frontend components created
4. ⬜ Add Google Maps / Mapbox integration
5. ⬜ Add background location tracking (native apps)
6. ⬜ Add estimated arrival calculation
7. ⬜ Add rating/review after completion
8. ⬜ Add support for multiple washers

