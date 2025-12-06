# Admin Employee Tracking & Live Location System

## 📋 Overview

This system provides real-time tracking and management of your workforce:
- **Real-time rider location tracking** from the `live_tracking` table
- **Washer performance metrics** with daily/all-time statistics
- **Employee management** showing active workers and their status
- **Live location history** for each rider
- **Booking-to-employee linking** for better job management

---

## 🎯 Features

### 1. Dashboard Overview
- **Total Washers Count** - Quick view of approved washers
- **Total Riders Count** - Quick view of approved riders
- **Total Employees** - Combined workforce count
- **Real-time Updates** - Stats refresh every 30 seconds

### 2. Rider Management
- 📍 **Live Location Tracking**
  - Current GPS coordinates
  - Real-time location updates
  - Location history (last 10 positions)
  - View on Google Maps integration

- 👤 **Rider Status**
  - Online/Offline status (5-minute timeout)
  - Contact information
  - Today's booking count

- 📅 **Current Booking Info**
  - Vehicle details
  - Pickup and dropoff locations
  - Booking status

### 3. Washer Management
- 📊 **Daily Performance**
  - Total washes today
  - Completed washes
  - Pending washes

- 📈 **Overall Statistics**
  - Total washes (all-time)
  - Completion rate percentage
  - Performance tracking

- 🎯 **Individual Wash Records**
  - Car number/details
  - Wash status (pending, washed, cancelled)
  - Timestamps
  - Notes from washer

---

## 🔧 API Endpoints

### Employee Statistics

**Get Employee Count**
```http
GET /admin-stats/employee-count
```

Response:
```json
{
  "success": true,
  "stats": {
    "total_washers": 12,
    "total_riders": 8,
    "total_employees": 20
  }
}
```

---

### Rider Endpoints

**Get All Riders**
```http
GET /admin-stats/all-riders
```

Response:
```json
{
  "success": true,
  "total": 8,
  "riders": [
    {
      "id": "uuid",
      "name": "Rider Name",
      "email": "email@example.com",
      "phone": "9876543210",
      "created_at": "2024-12-01T10:00:00Z",
      "is_online": true,
      "todays_bookings_count": 5,
      "current_location": {
        "latitude": 28.7041,
        "longitude": 77.1025,
        "status": "active",
        "last_updated": "2024-12-06T14:30:00Z"
      }
    }
  ]
}
```

**Get Specific Rider Location**
```http
GET /admin-stats/rider/:riderId/location
```

Parameters:
- `riderId` - UUID of the rider

Response:
```json
{
  "success": true,
  "rider": {
    "id": "uuid",
    "name": "Rider Name",
    "email": "email@example.com",
    "phone": "9876543210"
  },
  "current_location": {
    "latitude": 28.7041,
    "longitude": 77.1025,
    "status": "active",
    "timestamp": "2024-12-06T14:35:00Z",
    "booking_id": "booking-uuid"
  },
  "current_booking": {
    "id": "booking-uuid",
    "car_name": "Honda City",
    "pickup_location": "Connaught Place",
    "dropoff_location": "Airport Road",
    "status": "in_progress",
    "created_at": "2024-12-06T14:00:00Z"
  },
  "location_history": [
    {
      "id": "tracking-uuid",
      "latitude": 28.7041,
      "longitude": 77.1025,
      "status": "active",
      "created_at": "2024-12-06T14:35:00Z",
      "booking_id": "booking-uuid"
    }
  ],
  "is_online": true
}
```

**Get Rider Bookings**
```http
GET /admin-stats/rider/:riderId/bookings?limit=20&offset=0&status=in_progress
```

Query Parameters:
- `limit` - Number of records (default: 20)
- `offset` - Pagination offset (default: 0)
- `status` - Optional: Filter by booking status

---

### Washer Endpoints

**Get All Washers**
```http
GET /admin-stats/all-washers
```

Response:
```json
{
  "success": true,
  "total": 12,
  "washers": [
    {
      "id": "uuid",
      "name": "Washer Name",
      "email": "email@example.com",
      "phone": "9876543210",
      "created_at": "2024-12-01T10:00:00Z",
      "todays_washes": 8,
      "washes_completed": 6,
      "washes_pending": 2
    }
  ]
}
```

**Get Specific Washer Details**
```http
GET /admin-stats/washer/:washerId/details
```

Response:
```json
{
  "success": true,
  "washer": {
    "id": "uuid",
    "name": "Washer Name",
    "email": "email@example.com",
    "phone": "9876543210",
    "created_at": "2024-12-01T10:00:00Z"
  },
  "today_summary": {
    "total_washes": 8,
    "completed": 6,
    "pending": 2,
    "cancelled": 0,
    "washes": [
      {
        "id": "wash-uuid",
        "car_number": "DL-01-AA-1234",
        "status": "washed",
        "notes": "Full wash completed",
        "created_at": "2024-12-06T10:00:00Z",
        "wash_completed_at": "2024-12-06T10:45:00Z"
      }
    ]
  },
  "overall_stats": {
    "total_washes_all_time": 250,
    "total_completed": 245,
    "completion_rate": "98.00%"
  }
}
```

---

## 🚀 Setup Instructions

### 1. Backend Integration

**File:** `backend/server.js`

Add the import:
```javascript
import adminStatsRoutes from "./routes/adminStatsRoutes.js";
```

Add the route:
```javascript
app.use("/admin-stats", adminStatsRoutes);
```

### 2. Frontend Integration

**File:** `frontend/src/App.jsx`

Add the import:
```javascript
import AdminEmployeeTracking from "./Admin/AdminEmployeeTracking.jsx";
```

Add the route:
```jsx
<Route path="/admin/employee-tracking" element={<AdminEmployeeTracking />} />
```

### 3. Navigation Setup

Add a link in your admin dashboard to access the page:

```jsx
<Link to="/admin/employee-tracking" className="btn-primary">
  👥 Employee Tracking & Live Location
</Link>
```

---

## 📊 Data Flow

### Rider Location Tracking Flow
```
1. Rider app sends GPS data → live_tracking table
2. Admin opens employee tracking page
3. System fetches latest location from live_tracking
4. Location history shown (last 10 records)
5. Google Maps link displays live location
6. Auto-refreshes every 30 seconds
```

### Washer Performance Flow
```
1. Washer logs wash completion → car_wash_tracking table
2. Admin clicks on washer
3. System aggregates today's washes:
   - Total count
   - Completed count
   - Pending count
4. Shows all-time statistics
5. Displays individual wash records
```

---

## 🎨 UI Components

### Dashboard Overview
- 3 stat cards (Washers, Riders, Total)
- Tab navigation system
- Quick action buttons

### Rider Management
- Rider list with status indicators
- Click to view detailed tracking
- Current location display
- Google Maps integration
- Location history timeline
- Recent bookings list

### Washer Management
- Washer list with today's stats
- Click to view detailed performance
- Today's wash summary (3 cards)
- Overall statistics (3 cards)
- Complete wash record list

### Filtering & Search
- Filter by online/offline status (riders)
- Filter by status type
- Pagination for large datasets
- Real-time updates

---

## 🔍 Key Information Displayed

### For Each Rider:
- ✅ Name, email, phone
- ✅ Online/offline status
- ✅ Current GPS location
- ✅ Last update timestamp
- ✅ Current booking details
- ✅ Location history (10 last positions)
- ✅ Recent bookings with tracking

### For Each Washer:
- ✅ Name, email, phone
- ✅ Today's wash count (total, completed, pending)
- ✅ All-time statistics
- ✅ Completion rate percentage
- ✅ Individual wash records with timestamps

---

## 🌍 Location Mapping

### Live Location Display
- **Latitude & Longitude** - 6 decimal places precision
- **Google Maps Link** - Direct link to exact location
- **Status** - Active/idle/completed
- **Timestamp** - Last update time
- **Booking ID** - Associated booking reference

### Location History
- Shows last 10 location updates
- Includes timestamp for each location
- Shows status at each point
- Chronological ordering

---

## 📱 Status Indicators

### Rider Status
- 🟢 **Online** - Last update within 5 minutes
- 🔴 **Offline** - No update in last 5 minutes

### Wash Status
- 🟢 **Washed** - Completed
- 🟡 **Pending** - In progress
- 🔴 **Cancelled** - Cancelled

### Booking Status
- 🟢 **Completed** - Finished
- 🔵 **In Progress** - Active
- 🟡 **Pending** - Waiting

---

## ⚙️ Configuration

### Auto-Refresh Interval
- **Stats:** 30 seconds
- **Location:** On-demand (click)
- **History:** On-demand (click)

### Location Timeout (Online Status)
- 5 minutes - Rider marked offline
- Configurable in backend

### Pagination
- **Riders/Washers:** 20 per page
- **Bookings:** 10 per page
- **Location History:** 10 records

---

## 🐛 Troubleshooting

### Issue: Riders showing as offline
**Solution:** 
- Check if live_tracking data is being sent
- Verify location timeout setting
- Confirm timestamp format is correct

### Issue: Location not updating
**Solution:**
- Verify rider app is sending live_tracking data
- Check API endpoint response
- Confirm database has live_tracking records

### Issue: Washer stats not accurate
**Solution:**
- Verify car_wash_tracking records exist
- Check employee_id matches
- Confirm date filtering is correct

### Issue: Performance slow with many records
**Solution:**
- Enable pagination (limit parameter)
- Check database indexes on live_tracking table
- Use date filtering for history

---

## 📈 Database Schema Requirements

### Required Tables
1. **profiles** - Employee/rider information
   - Must have: id, name, email, phone, employee_type, approval_status

2. **live_tracking** - Real-time location data
   - Must have: id, employee_id, booking_id, latitude, longitude, status, created_at

3. **car_wash_tracking** - Washer wash records
   - Must have: id, employee_id, status, created_at, wash_completed_at

4. **bookings** - Booking information
   - Must have: id, rider_id, car_name, status, created_at

---

## 🔐 Security

✅ **Row-Level Security (RLS)**
- Admin can only see their employees
- Employees can only see their own data
- Customers see only their bookings

✅ **Data Privacy**
- GPS coordinates shown only to admin
- Employee phone visible to admin only
- Customer data privacy maintained

✅ **Authentication**
- All endpoints require proper auth context
- Only admin users can access this dashboard

---

## 📞 Support

For issues or questions:
1. Check API endpoint responses
2. Verify database schema
3. Confirm RLS policies
4. Check browser console for errors
5. Review backend logs

---

**Version:** 1.0  
**Last Updated:** December 2024  
**Status:** ✅ Production Ready
