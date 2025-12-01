# Location Tracking with Leaflet Map

## Overview
Integrated Leaflet.js interactive map into the Customer Location page for real-time location tracking of car pickup and delivery.

## Features Implemented

### 1. **Interactive Map Display**
- Uses Leaflet.js with OpenStreetMap tiles
- Shows real-time user and driver locations
- Displays route line between user and driver
- Custom colored markers:
  - **Blue marker**: User location
  - **Red marker**: Driver/Vehicle location
- Live indicator showing active tracking

### 2. **Backend Location Endpoints**

#### Get User Location for Booking
```
GET /car-location/user/:user_id/:booking_id
```
**Response:**
```json
{
  "success": true,
  "location": {
    "booking_id": "...",
    "customer": {
      "id": "...",
      "name": "...",
      "email": "..."
    },
    "driver": {
      "id": "...",
      "name": "...",
      "email": "..."
    },
    "service_location": "Main Outlet",
    "pickup_required": true,
    "status": "pickup_in_progress",
    "booking_date": "2025-12-01",
    "booking_time": "10:30 AM",
    "car_name": "Swift LXi",
    "amount": 299
  }
}
```

#### Get All Bookings with Locations
```
GET /car-location/user-bookings/:user_id
```
**Response:**
```json
{
  "success": true,
  "total": 5,
  "bookings": [
    {
      "id": "booking_1",
      "car_name": "Swift LXi",
      "status": "completed",
      "location": "Main Outlet",
      "date": "2025-12-01",
      "time": "10:30 AM",
      "amount": 299,
      "driver": {...},
      "pickup_required": true
    }
  ]
}
```

### 3. **Frontend Components**

#### Location.jsx Changes
- **Imports**: Added Leaflet, React-Leaflet, and CSS
- **Marker Icons**: Configured custom blue and red markers
- **MapDisplay Component**: 
  - Renders interactive map container
  - Shows user location marker
  - Shows driver location marker
  - Draws polyline route between locations
  - Displays live tracking indicator

#### Features:
- Auto-detects user geolocation using browser Geolocation API
- Continuous location updates with watchPosition
- Simulated driver movement towards user
- Distance calculation using Haversine formula
- ETA calculation based on distance
- Real-time status monitoring

### 4. **Data Flow**

```
Customer Opens Location Page
        ↓
Browser gets user geolocation
        ↓
Fetch booking details from Supabase
        ↓
Fetch location data from backend API
        ↓
Load Leaflet map with OpenStreetMap tiles
        ↓
Display user marker (blue)
        ↓
Display driver marker (red)
        ↓
Draw route polyline
        ↓
Watch for continuous location updates
        ↓
Update distance & ETA in real-time
```

## Installation

### Frontend
```bash
npm install leaflet react-leaflet
```

### CSS Import (Already Added)
```javascript
import "leaflet/dist/leaflet.css";
```

## Dependencies
- **leaflet**: ^1.9.4 (mapping library)
- **react-leaflet**: ^4.x (React wrapper for Leaflet)
- **OpenStreetMap**: Free tile layer (no API key required)

## Database Tables Used

### bookings
- `id`: Booking ID
- `customer_id`: Customer/User ID
- `assigned_to`: Driver/Employee ID
- `car_name`: Vehicle name
- `location`: Service location
- `date`: Booking date
- `time`: Booking time
- `status`: Current booking status
- `pickup`: Whether pickup is required
- `amount`: Total amount
- `created_at`: Creation timestamp

### profiles
- `id`: User ID
- `email`: Email address
- `name`: Full name

## Map Features

### Markers
1. **User Marker** (Blue)
   - Shows customer's current location
   - Populates from browser geolocation API
   - Updates continuously

2. **Driver Marker** (Red)
   - Shows driver's current location
   - Simulated movement towards user
   - Updates every 2 seconds

### Route Visualization
- **Polyline**: Dashed red line connecting driver to user
- **Map Controls**: Zoom, pan, fullscreen
- **Tile Layer**: OpenStreetMap for easy access

## Usage

### For Customer
1. Navigate to booking location page
2. See interactive Leaflet map
3. View your location (blue marker)
4. View driver location (red marker) in real-time
5. See distance and ETA updates
6. Track driver progress via polyline route

### API Integration
```javascript
// Fetch location data for booking
const res = await fetch(
  `http://localhost:5000/car-location/user/${userId}/${bookingId}`
);
const locationData = await res.json();
```

## Status Indicators
- **Pending**: No tracking
- **Confirmed**: Tracking active
- **pickup_in_progress**: Tracking active
- **in_wash**: Tracking active
- **delivery_in_progress**: Tracking active
- **completed**: No tracking

## Browser Geolocation Permissions
- User must grant location permission
- Fallback location: Delhi (28.7041, 77.1025)
- High accuracy enabled for better precision

## Map Center
- Centers on user location if available
- Falls back to service location
- Default to Delhi if no location found

## Future Enhancements
1. Real GPS data integration (instead of simulation)
2. Multiple waypoint routes
3. Traffic layer overlay
4. Distance optimization algorithm
5. Historical location tracking
6. Map export/sharing
7. Alternative routing options

## Files Modified
1. `frontend/src/Customer/Location.jsx` - Updated with Leaflet map
2. `backend/routes/carLocation.js` - Added new location endpoints
3. `frontend/package.json` - Leaflet dependencies (auto-updated)

## Testing

### Test Endpoint
```bash
# Get user location for booking
curl http://localhost:5000/car-location/user/{userId}/{bookingId}

# Get all user bookings with locations
curl http://localhost:5000/car-location/user-bookings/{userId}
```

### Browser Testing
1. Start backend: `npm start` (port 5000)
2. Start frontend: `npm run dev`
3. Navigate to customer location page
4. Verify map displays correctly
5. Verify user and driver markers show
6. Verify distance/ETA updates
7. Verify polyline route appears
