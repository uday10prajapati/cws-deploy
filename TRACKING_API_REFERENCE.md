# Tracking API Reference

## Endpoints

### 1. GET /car-location/test/tracking-data
**Purpose:** Diagnostic endpoint to verify live_tracking table connectivity

**Request:**
```
GET http://localhost:5000/car-location/test/tracking-data
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Live tracking table status",
  "total_records": 8,
  "table_status": "✅ Data exists",
  "data": [
    {
      "id": "uuid",
      "booking_id": "92cd42c3-fade-42ba-96b5-e179c0e706aa",
      "employee_id": "1",
      "latitude": 21.1458,
      "longitude": 79.0882,
      "status": "pickup_in_progress",
      "created_at": "2025-12-01T01:00:00+00:00"
    },
    ...
  ]
}
```

**Use Case:** Check if database is working before fetching specific booking data

---

### 2. GET /car-location/tracking-history/:booking_id?date=YYYY-MM-DD
**Purpose:** Fetch all tracking coordinates for a booking on a specific date

**Request:**
```
GET http://localhost:5000/car-location/tracking-history/92cd42c3-fade-42ba-96b5-e179c0e706aa?date=2025-12-01
```

**Parameters:**
- `booking_id` (required): UUID of the booking
- `date` (optional): Date in YYYY-MM-DD format (defaults to today if not provided)

**Response (Success - 200):**
```json
{
  "success": true,
  "data": {
    "booking_id": "92cd42c3-fade-42ba-96b5-e179c0e706aa",
    "date": "2025-12-01",
    "summary": {
      "total_points": 8,
      "pickup_points": 3,
      "wash_points": 2,
      "delivery_points": 2,
      "completed_points": 1
    },
    "all_tracking": [
      {
        "id": "uuid",
        "booking_id": "92cd42c3-fade-42ba-96b5-e179c0e706aa",
        "employee_id": "1",
        "latitude": 21.1458,
        "longitude": 79.0882,
        "status": "pickup_in_progress",
        "tracking_type": "live",
        "created_at": "2025-12-01T01:00:00+00:00",
        "updated_at": "2025-12-01T01:00:00+00:00"
      },
      {
        "id": "uuid",
        "booking_id": "92cd42c3-fade-42ba-96b5-e179c0e706aa",
        "employee_id": "1",
        "latitude": 21.1459,
        "longitude": 79.0883,
        "status": "pickup_in_progress",
        "tracking_type": "live",
        "created_at": "2025-12-01T01:05:00+00:00",
        "updated_at": "2025-12-01T01:05:00+00:00"
      },
      // ... 6 more points
    ],
    "grouped": {
      "pickup": [
        // 3 points with status: pickup_in_progress
      ],
      "wash": [
        // 2 points with status: in_wash
      ],
      "delivery": [
        // 2 points with status: delivery_in_progress
      ],
      "completed": [
        // 1 point with status: completed
      ]
    },
    "date_range": {
      "from": "2025-12-01T01:00:00+00:00",
      "to": "2025-12-01T01:45:00+00:00"
    }
  }
}
```

**Error Response (404 - No data):**
```json
{
  "success": false,
  "error": "Error message or empty result set"
}
```

**Frontend Console Logs:**
```
📡 Fetching tracking for booking: 92cd42c3-fade-42ba-96b5-e179c0e706aa, date: 2025-12-01
📊 Response status: 200 OK
✅ Retrieved 8 tracking points
📍 Tracking data loaded: {booking_id, summary, all_tracking, ...}
🗺️ Updated driver location to: 21.1463, 79.0887
```

**Use Case:** Display all GPS coordinates for a booking, group by status, show on map and timeline

---

### 3. GET /car-location/live/:booking_id
**Purpose:** Get the latest GPS coordinate for a booking (real-time location)

**Request:**
```
GET http://localhost:5000/car-location/live/92cd42c3-fade-42ba-96b5-e179c0e706aa
```

**Response (Success - 200):**
```json
{
  "success": true,
  "data": {
    "booking_id": "92cd42c3-fade-42ba-96b5-e179c0e706aa",
    "latest_coordinate": {
      "latitude": 21.1463,
      "longitude": 79.0887,
      "status": "completed",
      "created_at": "2025-12-01T01:45:00+00:00"
    },
    "employee": {
      "id": "1",
      "name": "Driver Name"
    },
    "booking": {
      "id": "92cd42c3-fade-42ba-96b5-e179c0e706aa",
      "car_name": "Toyota Fortuner",
      "location": "Delivery Address"
    }
  }
}
```

**Use Case:** Get real-time driver location for live tracking on map

---

### 4. POST /car-location/tracking/save
**Purpose:** Employee app saves new GPS coordinate (real-time tracking)

**Request:**
```bash
curl -X POST http://localhost:5000/car-location/tracking/save \
  -H "Content-Type: application/json" \
  -d '{
    "booking_id": "92cd42c3-fade-42ba-96b5-e179c0e706aa",
    "employee_id": "1",
    "latitude": 21.1465,
    "longitude": 79.0890,
    "status": "delivery_in_progress"
  }'
```

**Request Body:**
```json
{
  "booking_id": "92cd42c3-fade-42ba-96b5-e179c0e706aa" (required),
  "employee_id": "1" (required),
  "latitude": 21.1465 (required),
  "longitude": 79.0890 (required),
  "status": "delivery_in_progress" (required)
}
```

**Valid Status Values:**
- `pickup_in_progress` - Driver picking up car
- `in_wash` - Car being washed
- `delivery_in_progress` - Driver delivering car
- `completed` - Delivery completed

**Response (Success - 201):**
```json
{
  "success": true,
  "data": {
    "id": "new-uuid",
    "booking_id": "92cd42c3-fade-42ba-96b5-e179c0e706aa",
    "employee_id": "1",
    "latitude": 21.1465,
    "longitude": 79.0890,
    "status": "delivery_in_progress",
    "tracking_type": "live",
    "created_at": "2025-12-01T01:50:00+00:00",
    "updated_at": "2025-12-01T01:50:00+00:00"
  }
}
```

**Error Response (400 - Missing fields):**
```json
{
  "success": false,
  "error": "All fields are required"
}
```

**Use Case:** Employee app periodically sends GPS updates to track car movement

---

## Frontend Usage Examples

### Example 1: Fetch All Tracking Data for a Date
```javascript
const fetchTrackingHistory = async (bookingId, date) => {
  try {
    const res = await fetch(
      `http://localhost:5000/car-location/tracking-history/${bookingId}?date=${date}`
    );
    
    if (!res.ok) {
      console.warn("⚠️ No tracking data available");
      return null;
    }

    const data = await res.json();
    console.log("✅ Tracking data loaded:", data.data);
    return data.data;
  } catch (err) {
    console.error("Error:", err);
    return null;
  }
};

// Usage
const trackingData = await fetchTrackingHistory(
  "92cd42c3-fade-42ba-96b5-e179c0e706aa",
  "2025-12-01"
);

// Access data
console.log(trackingData.summary.total_points); // 8
console.log(trackingData.all_tracking.length); // 8
trackingData.all_tracking.forEach(point => {
  console.log(`${point.latitude}, ${point.longitude} - ${point.status}`);
});
```

### Example 2: Get Latest Location
```javascript
const fetchLiveLocation = async (bookingId) => {
  try {
    const res = await fetch(`http://localhost:5000/car-location/live/${bookingId}`);
    
    if (!res.ok) return null;

    const data = await res.json();
    const { latitude, longitude } = data.data.latest_coordinate;
    
    // Update map marker
    setDriverLocation({ lat: latitude, lng: longitude });
  } catch (err) {
    console.error("Error:", err);
  }
};

// Usage
await fetchLiveLocation("92cd42c3-fade-42ba-96b5-e179c0e706aa");
```

### Example 3: Display Tracking Table
```javascript
{trackingHistory?.data?.all_tracking.map((point, idx) => (
  <tr key={idx}>
    <td>{idx + 1}</td>
    <td>{new Date(point.created_at).toLocaleTimeString()}</td>
    <td>{point.latitude.toFixed(6)}</td>
    <td>{point.longitude.toFixed(6)}</td>
    <td>{point.status}</td>
  </tr>
))}
```

### Example 4: Filter by Status
```javascript
const pickupPoints = trackingData.all_tracking.filter(
  p => p.status === "pickup_in_progress"
);
const washPoints = trackingData.all_tracking.filter(
  p => p.status === "in_wash"
);
const deliveryPoints = trackingData.all_tracking.filter(
  p => p.status === "delivery_in_progress"
);
```

---

## Database Schema

### live_tracking Table
```sql
CREATE TABLE live_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id),
  employee_id UUID NOT NULL REFERENCES profiles(id),
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pickup_in_progress', 'in_wash', 'delivery_in_progress', 'completed')),
  tracking_type VARCHAR(20) NOT NULL DEFAULT 'live',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
  FOREIGN KEY (employee_id) REFERENCES profiles(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX idx_live_tracking_booking_id ON live_tracking(booking_id);
CREATE INDEX idx_live_tracking_employee_id ON live_tracking(employee_id);
CREATE INDEX idx_live_tracking_created_at ON live_tracking(created_at);
CREATE INDEX idx_live_tracking_status ON live_tracking(status);

-- Row Level Security
ALTER TABLE live_tracking ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their booking tracking" 
  ON live_tracking FOR SELECT 
  USING (booking_id IN (SELECT id FROM bookings WHERE customer_id = auth.uid())
         OR employee_id = auth.uid());

CREATE POLICY "Employees can insert tracking data" 
  ON live_tracking FOR INSERT 
  WITH CHECK (employee_id = auth.uid());

CREATE POLICY "Employees can update their own tracking" 
  ON live_tracking FOR UPDATE 
  USING (employee_id = auth.uid());
```

---

## Testing Checklist

- [ ] Diagnostic endpoint returns data count
- [ ] Tracking history endpoint returns all coordinates
- [ ] Frontend displays tracking table correctly
- [ ] Date picker filters data by date
- [ ] Empty state shows when no data
- [ ] Console logs show all API calls
- [ ] Coordinates display with 6 decimal precision
- [ ] Status badges show correct colors
- [ ] Coverage area calculations work
- [ ] Summary statistics accurate

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| 404 on tracking-history | No data in table - run insert script |
| Wrong coordinates | Check booking_id matches test data |
| Table not showing | Verify all_tracking array is not empty |
| Map not updating | Check latitude/longitude values are valid |
| Console errors | Check network tab (F12) for actual API error |

---

**API Status:** ✅ Ready for Production
**Frontend Status:** ✅ Ready for Production
**Database Status:** ✅ Schema Complete
**Testing Status:** ✅ Test Data Script Ready
