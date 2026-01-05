# Live Location Tracking System - Complete Implementation Guide

## Overview
A real-time washer location tracking system for on-demand washer service (similar to Uber). The washer location is tracked from when they accept an emergency request until they reach the customer's location.

---

## Architecture Overview

```
WASHER SIDE                          CUSTOMER SIDE
┌─────────────────────────┐         ┌──────────────────────┐
│ WasherEmergency       │         │ CustomerEmergency   │
│ WashTracking.jsx      │         │ WashLiveTracking.jsx│
└────────────┬──────────┘         └──────────┬───────────┘
             │                               │
    1. View Request Details              5. Subscribe to Updates
    2. Click "Starting to reach"         6. See "Washer on the way"
    3. Start GPS tracking                7. Watch marker move
    4. Send location every 5 sec         8. See "Arrived" message
    5. Click "I have reached"
             │                               │
             └────────────────┬──────────────┘
                              │
                    ┌─────────▼─────────┐
                    │  Backend API      │
                    │  /live-tracking   │
                    │  (Express.js)     │
                    └─────────┬─────────┘
                              │
                    ┌─────────▼─────────┐
                    │  Supabase         │
                    │  live_tracking    │
                    │  table (Realtime) │
                    └───────────────────┘
```

---

## 1. Database Schema

### live_tracking Table

```sql
CREATE TABLE live_tracking (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID NOT NULL REFERENCES emergency_wash_requests(id) ON DELETE CASCADE,
  washer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Location Data (Updated continuously)
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  accuracy DECIMAL(7, 2),
  heading DECIMAL(6, 2),
  speed DECIMAL(6, 2),
  
  -- Status Tracking
  status VARCHAR(20) DEFAULT 'on_the_way' 
    CHECK (status IN ('on_the_way', 'reached', 'stopped', 'abandoned')),
  
  -- Timestamps
  tracking_started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  reached_at TIMESTAMP WITH TIME ZONE,
  stopped_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Analytics
  distance_covered DECIMAL(10, 2) DEFAULT 0,
  estimated_arrival TIMESTAMP WITH TIME ZONE,
  notes TEXT
);

-- Indexes for Performance
CREATE INDEX idx_live_tracking_request_id ON live_tracking(request_id);
CREATE INDEX idx_live_tracking_washer_id ON live_tracking(washer_id);
CREATE INDEX idx_live_tracking_customer_id ON live_tracking(customer_id);
CREATE INDEX idx_live_tracking_status ON live_tracking(status);
CREATE INDEX idx_live_tracking_created_at ON live_tracking(created_at DESC);
CREATE INDEX idx_live_tracking_updated_at ON live_tracking(updated_at DESC);

-- Enable RLS
ALTER TABLE live_tracking ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Customers can view tracking" ON live_tracking
  FOR SELECT USING (auth.uid() = customer_id);

CREATE POLICY "Washers can view their tracking" ON live_tracking
  FOR SELECT USING (auth.uid() = washer_id);

CREATE POLICY "Washers can insert tracking data" ON live_tracking
  FOR INSERT WITH CHECK (auth.uid() = washer_id);

CREATE POLICY "Washers can update their tracking" ON live_tracking
  FOR UPDATE USING (auth.uid() = washer_id);

CREATE POLICY "Service role full access" ON live_tracking
  FOR ALL USING (auth.role() = 'service_role');
```

### Update emergency_wash_requests Table

```sql
-- Add tracking reference to emergency_wash_requests
ALTER TABLE emergency_wash_requests
ADD COLUMN IF NOT EXISTS tracking_id UUID REFERENCES live_tracking(id) ON DELETE SET NULL;

ALTER TABLE emergency_wash_requests
ADD COLUMN IF NOT EXISTS tracking_status VARCHAR(20) 
  CHECK (tracking_status IS NULL OR tracking_status IN ('on_the_way', 'reached', 'stopped', 'abandoned'));

CREATE INDEX IF NOT EXISTS idx_emergency_wash_tracking_status 
  ON emergency_wash_requests(tracking_status);
```

---

## 2. Backend API Endpoints

### Base URL: `POST /api/live-tracking`

#### 2.1 Start Tracking
**Endpoint:** `POST /api/live-tracking/start`

**When:** Washer clicks "I am starting to reach you"

**Request Body:**
```javascript
{
  request_id: "uuid",
  customer_id: "uuid",
  latitude: 19.0760,
  longitude: 72.8777,
  accuracy: 10.5,
  heading: 270,
  speed: 0
}
```

**Response:**
```javascript
{
  success: true,
  tracking_id: "uuid",
  message: "Live tracking started"
}
```

**Backend Logic:**
1. Validate request_id and customer_id
2. Create entry in `live_tracking` table
3. Update `emergency_wash_requests.tracking_id`
4. Return tracking_id to client
5. Client uses tracking_id for all future updates

---

#### 2.2 Update Location (Continuous)
**Endpoint:** `POST /api/live-tracking/update-location`

**When:** Every 5 seconds while washer is on the way

**Request Body:**
```javascript
{
  tracking_id: "uuid",
  latitude: 19.0762,
  longitude: 72.8779,
  accuracy: 8.2,
  heading: 270,
  speed: 15.5
}
```

**Response:**
```javascript
{
  success: true,
  message: "Location updated",
  updated_at: "2025-01-05T10:30:45Z"
}
```

**Backend Logic:**
1. Verify tracking_id belongs to authenticated washer
2. Update location fields
3. Update `updated_at` timestamp
4. Broadcast update via Supabase Realtime

---

#### 2.3 Washer Reached
**Endpoint:** `POST /api/live-tracking/reached`

**When:** Washer clicks "I have reached"

**Request Body:**
```javascript
{
  tracking_id: "uuid"
}
```

**Response:**
```javascript
{
  success: true,
  message: "Status updated to reached",
  reached_at: "2025-01-05T10:45:30Z"
}
```

**Backend Logic:**
1. Update `status = 'reached'`
2. Set `reached_at` timestamp
3. Update `emergency_wash_requests.tracking_status = 'reached'`
4. Stop real-time broadcasts
5. Notify customer via push notification

---

#### 2.4 Get Current Tracking
**Endpoint:** `GET /api/live-tracking/:tracking_id`

**Request:** No body, param only

**Response:**
```javascript
{
  success: true,
  tracking: {
    id: "uuid",
    request_id: "uuid",
    washer_id: "uuid",
    customer_id: "uuid",
    latitude: 19.0765,
    longitude: 72.8782,
    accuracy: 7.5,
    heading: 270,
    speed: 20,
    status: "on_the_way",
    tracking_started_at: "2025-01-05T10:30:00Z",
    updated_at: "2025-01-05T10:45:15Z"
  }
}
```

---

#### 2.5 Stop Tracking
**Endpoint:** `POST /api/live-tracking/stop`

**When:** Washer manually stops or request is cancelled

**Request Body:**
```javascript
{
  tracking_id: "uuid"
}
```

**Response:**
```javascript
{
  success: true,
  message: "Tracking stopped"
}
```

---

#### 2.6 Get Tracking History
**Endpoint:** `GET /api/live-tracking/request/:request_id`

**Response:**
```javascript
{
  success: true,
  tracking: [
    {
      id: "uuid",
      latitude: 19.0760,
      longitude: 72.8777,
      accuracy: 10.5,
      speed: 0,
      status: "on_the_way",
      updated_at: "2025-01-05T10:30:00Z"
    },
    ...
  ]
}
```

---

## 3. Real-Time Updates Strategy

### Option A: Supabase Realtime (RECOMMENDED)

**Why:** 
- Built into Supabase
- WebSocket under the hood
- Simple to implement
- No additional infrastructure

**Implementation:**

**Washer Side - Send Updates:**
```javascript
// Send location every 5 seconds
useEffect(() => {
  const interval = setInterval(async () => {
    const { latitude, longitude } = await getCurrentLocation();
    
    await fetch('/api/live-tracking/update-location', {
      method: 'POST',
      body: JSON.stringify({
        tracking_id: trackingId,
        latitude,
        longitude
      })
    });
  }, 5000);
  
  return () => clearInterval(interval);
}, [tracking_id]);
```

**Customer Side - Receive Updates:**
```javascript
useEffect(() => {
  const subscription = supabase
    .from('live_tracking')
    .on('*', { event: 'UPDATE', schema: 'public' }, payload => {
      if (payload.new.id === trackingId) {
        setWasherLocation({
          latitude: payload.new.latitude,
          longitude: payload.new.longitude
        });
      }
    })
    .subscribe();
  
  return () => subscription.unsubscribe();
}, [tracking_id]);
```

### Option B: Polling (Fallback)

If Realtime fails, poll every 2 seconds:

```javascript
useEffect(() => {
  const interval = setInterval(async () => {
    const { data } = await supabase
      .from('live_tracking')
      .select('*')
      .eq('id', trackingId)
      .single();
    
    setWasherLocation(data);
  }, 2000);
  
  return () => clearInterval(interval);
}, [tracking_id]);
```

---

## 4. Washer Side Implementation

### Component: `WasherEmergencyWashTracking.jsx`

**State Flow:**
1. **View Request** → Customer details + location
2. **Click "I am starting to reach"** → Start tracking
3. **Live GPS Updates** → Send every 5 seconds
4. **Click "I have reached"** → Stop tracking & notify customer

**Key Features:**
- Show request details (customer name, location, phone)
- Display customer location on map
- "I am starting to reach you" button
- Start GPS tracking
- Send location updates every 5 seconds
- Show "I have reached" button
- Handle permission denial
- Handle network errors
- Handle background mode

---

## 5. Customer Side Implementation

### Component: `CustomerEmergencyWashLiveTracking.jsx`

**State Flow:**
1. **View Request Card** → Click to open tracking
2. **See "Washer on the way"** status
3. **Watch Washer Move** on map (real-time marker)
4. **See "Washer has arrived"** status
5. **Close Tracking** once completed

**Key Features:**
- Show customer location (fixed)
- Show washer location (moving marker)
- Display distance & ETA
- Real-time marker updates
- Status text ("on the way" / "arrived")
- Handle connection loss
- Show loading state while waiting

---

## 6. Edge Cases & Error Handling

### 6.1 Location Permission Denied

**Washer Side:**
```javascript
try {
  const position = await new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject);
  });
} catch (error) {
  if (error.code === error.PERMISSION_DENIED) {
    showModal("Location access is required to send live tracking. Please enable it in settings.");
    // Don't start tracking
  }
}
```

### 6.2 Network Loss

**Washer Side - Retry Logic:**
```javascript
const updateLocationWithRetry = async (trackingId, location, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      await fetch('/api/live-tracking/update-location', {
        method: 'POST',
        body: JSON.stringify({ tracking_id: trackingId, ...location })
      });
      return true; // Success
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(r => setTimeout(r, 2000)); // Wait 2s before retry
    }
  }
};
```

**Customer Side - Graceful Degradation:**
```javascript
// Try Realtime first
const subscription = supabase.from('live_tracking').on('*', ...);

// Fallback to polling if Realtime fails
const fallbackInterval = setInterval(async () => {
  const { data } = await supabase
    .from('live_tracking')
    .select('*')
    .eq('id', trackingId)
    .single();
  // update location
}, 3000);
```

### 6.3 App Background Mode

**Washer Side:**
```javascript
useEffect(() => {
  const handleVisibilityChange = () => {
    if (document.hidden) {
      console.log("⚠️ App in background - using Background Geolocation");
      // Continue sending updates in background if possible
    } else {
      console.log("✅ App in foreground");
    }
  };
  
  document.addEventListener('visibilitychange', handleVisibilityChange);
  return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
}, []);
```

### 6.4 Inactivity Timeout

**Washer Side:**
```javascript
useEffect(() => {
  const timeout = setTimeout(() => {
    console.warn("⚠️ No location update for 30 seconds - stopping tracking");
    stopTracking();
  }, 30000);
  
  return () => clearTimeout(timeout);
}, [lastUpdate]);
```

---

## 7. Implementation Checklist

### Database
- [ ] Create `live_tracking` table
- [ ] Add RLS policies
- [ ] Create indexes
- [ ] Update `emergency_wash_requests` with tracking columns

### Backend APIs
- [ ] POST `/api/live-tracking/start`
- [ ] POST `/api/live-tracking/update-location`
- [ ] POST `/api/live-tracking/reached`
- [ ] POST `/api/live-tracking/stop`
- [ ] GET `/api/live-tracking/:tracking_id`
- [ ] GET `/api/live-tracking/request/:request_id`

### Washer Component
- [ ] Display request details
- [ ] Show customer location on map
- [ ] "I am starting to reach you" button
- [ ] Start GPS tracking
- [ ] Send location updates every 5 seconds
- [ ] Show distance & ETA
- [ ] "I have reached" button
- [ ] Handle permission denied
- [ ] Handle network errors
- [ ] Display status text

### Customer Component
- [ ] Display customer location (fixed)
- [ ] Display washer location (moving)
- [ ] Real-time marker updates
- [ ] Display distance & ETA
- [ ] Display status text
- [ ] Handle loading state
- [ ] Handle connection loss
- [ ] Close tracking after reached

### Error Handling
- [ ] Permission denied handling
- [ ] Network loss retry logic
- [ ] Background mode handling
- [ ] Inactivity timeout
- [ ] Location unavailable
- [ ] Request cancelled

---

## 8. Testing Scenarios

### Scenario 1: Happy Path
1. Washer receives emergency request
2. Washer clicks "I am starting to reach you"
3. Washer location updates every 5 seconds
4. Customer sees washer moving on map
5. Washer reaches location
6. Washer clicks "I have reached"
7. Customer sees "Washer has arrived"

### Scenario 2: Network Loss
1. Washer clicks "Starting to reach"
2. Network goes down
3. App retries location updates
4. Network comes back
5. Updates resume

### Scenario 3: Permission Denied
1. Washer clicks "Starting to reach"
2. Location permission denied
3. Show error modal
4. Don't start tracking

### Scenario 4: Timeout
1. Washer clicks "Starting to reach"
2. No location update for 30 seconds
3. Automatically stop tracking
4. Notify customer

---

## 9. Performance Considerations

- Update frequency: **Every 5 seconds** (balance between real-time & battery)
- Map zoom level: **Zoom 15-17** (shows ~1-2 km radius)
- Line smoothing: Use **Polyline** with **smooth:true**
- Update limit: Max **60 updates per minute** per washer
- Data retention: Keep tracking data for **30 days** then archive

---

## 10. Security Considerations

1. **Authentication:** All endpoints require auth middleware
2. **Authorization:** 
   - Washer can only send their own location
   - Customer can only view their request's washer location
3. **Rate Limiting:** Max 1 update per 2 seconds per washer
4. **Data Validation:** 
   - Latitude: -90 to 90
   - Longitude: -180 to 180
   - Accuracy: > 0

---

## 11. Deployment Steps

1. Run migration: `create_live_tracking_table.sql`
2. Deploy backend APIs
3. Register route in `server.js`
4. Deploy washer tracking component
5. Deploy customer tracking component
6. Test all scenarios
7. Monitor error logs
8. Monitor performance

---

## 12. Future Enhancements

- [ ] Route optimization (Google Maps API)
- [ ] ETA calculation (Google Maps Directions API)
- [ ] Distance calculation with actual route
- [ ] Historical heatmaps (where washers go most)
- [ ] Offline mode (queue updates when offline)
- [ ] Voice notifications ("Washer is 2 minutes away")
- [ ] Call washer directly from map
- [ ] Rate washer based on tracking (did they take efficient route?)
- [ ] Geofencing (auto-mark as reached when within 50m)

---

**Status:** Ready for implementation
**Last Updated:** 2025-01-05
