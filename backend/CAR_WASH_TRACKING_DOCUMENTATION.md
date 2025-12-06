# Car Wash Tracking System - Complete Documentation

## 📋 Overview

The Car Wash Tracking system allows employees to:
- ✅ Add new car wash records
- ✅ Track wash status (Pending, Completed, Cancelled)
- ✅ View daily statistics
- ✅ View monthly statistics
- ✅ Filter by status
- ✅ Delete records
- ✅ Generate performance insights

## 🎯 Features

### 1. **Daily Tracking**
- See all washes for today
- Quick status update dropdown
- Real-time statistics

### 2. **Monthly Analytics**
- View entire month's data
- Select any month/year
- Day-wise breakdown
- Completion rate tracking

### 3. **Statistics Dashboard**
- Today's totals (completed, pending, cancelled)
- This month's totals
- Visual stat cards
- Performance overview

### 4. **Status Management**
- **Pending** 🟡 - Wash scheduled/in progress
- **Completed** 🟢 - Wash finished
- **Cancelled** 🔴 - Wash not done

## 🗄️ Database Schema

### `car_wash_tracking` Table

```sql
id                   UUID        - Primary key
employee_id          UUID        - Employee reference
car_owner_name       VARCHAR     - Customer name
car_model            VARCHAR     - Model (Honda City, etc.)
car_number           VARCHAR     - Unique car number
car_color            VARCHAR     - Car color
status               VARCHAR     - pending|washed|cancelled
created_at           TIMESTAMP   - When wash was added
wash_completed_at    TIMESTAMP   - When actually washed
notes                TEXT        - Additional notes
```

### Views Created

1. **daily_car_wash_stats** - Daily statistics by date
2. **monthly_car_wash_stats** - Monthly statistics
3. **employee_car_wash_performance** - Employee performance metrics

## 🔧 Backend API Endpoints

### 1. Add New Car Wash
**POST** `/car-wash/add-wash`

**Request:**
```json
{
  "employeeId": "uuid",
  "carOwnerName": "John Doe",
  "carModel": "Honda City",
  "carNumber": "GJ01AB1234",
  "carColor": "Silver",
  "notes": "Exterior wash only"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Car wash record added",
  "data": { ...wash object }
}
```

### 2. Update Wash Status
**PUT** `/car-wash/update-status/:id`

**Request:**
```json
{
  "status": "washed"  // pending, washed, or cancelled
}
```

**Response:**
```json
{
  "success": true,
  "message": "Car wash status updated to 'washed'",
  "data": { ...updated wash object }
}
```

### 3. Get Today's Washes
**GET** `/car-wash/today/:employeeId`

**Response:**
```json
{
  "success": true,
  "date": "2024-12-06",
  "total": 5,
  "completed": 3,
  "pending": 1,
  "cancelled": 1,
  "washes": [...]
}
```

### 4. Get Monthly Washes
**GET** `/car-wash/monthly/:employeeId?month=12&year=2024`

**Response:**
```json
{
  "success": true,
  "month": 12,
  "year": 2024,
  "monthName": "December",
  "total": 45,
  "completed": 42,
  "pending": 2,
  "cancelled": 1,
  "byDay": {
    "2024-12-01": { "total": 5, "completed": 4, "pending": 0, "cancelled": 1 },
    "2024-12-02": { "total": 6, "completed": 6, "pending": 0, "cancelled": 0 }
  },
  "washes": [...]
}
```

### 5. Get Statistics Dashboard
**GET** `/car-wash/stats/:employeeId`

**Response:**
```json
{
  "success": true,
  "today": {
    "total": 5,
    "completed": 3,
    "pending": 1,
    "cancelled": 1
  },
  "month": {
    "total": 45,
    "completed": 42,
    "pending": 2,
    "cancelled": 1
  },
  "overall": {
    "total": 250,
    "completed": 245,
    "pending": 3,
    "cancelled": 2
  }
}
```

### 6. Get All Washes (with pagination)
**GET** `/car-wash/all/:employeeId?status=washed&limit=50&offset=0`

**Response:**
```json
{
  "success": true,
  "total": 250,
  "limit": 50,
  "offset": 0,
  "washes": [...]
}
```

### 7. Delete Car Wash Record
**DELETE** `/car-wash/delete/:id`

**Response:**
```json
{
  "success": true,
  "message": "Car wash record deleted"
}
```

## 🎨 Frontend Component

### File Location
`frontend/src/page/CarWash.jsx`

### Key States
```javascript
const [stats, setStats] = useState({
  today: { total, completed, pending, cancelled },
  month: { total, completed, pending, cancelled }
});
const [washes, setWashes] = useState([]);
const [viewMode, setViewMode] = useState("today"); // or "monthly"
const [filterStatus, setFilterStatus] = useState("all");
const [selectedMonth, setSelectedMonth] = useState(12);
const [selectedYear, setSelectedYear] = useState(2024);
```

### Main Features

**Statistics Cards:**
- Today Total
- Today Completed
- This Month Total
- This Month Completed

**View Modes:**
- Today's Washes - Shows all washes added today
- Monthly Summary - Shows all washes in selected month

**Add Form:**
- Car Owner Name (required)
- Car Number (required, validated)
- Car Model
- Car Color
- Notes

**Wash Table:**
- Car Owner
- Car Number (highlighted)
- Model
- Status (dropdown to change)
- Date/Time
- Delete button

## 🧪 Testing

### Step 1: Setup Database
1. Go to Supabase Dashboard
2. SQL Editor → New Query
3. Copy content from `CAR_WASH_TRACKING_SCHEMA.sql`
4. Run it ✅

### Step 2: Start Services
```bash
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### Step 3: Test Features

**Add a Car Wash:**
1. Click "Add New Wash" button
2. Fill in details:
   - Car Owner: "John Doe"
   - Car Number: "GJ01AB1234"
   - Car Model: "Honda City"
   - Car Color: "Silver"
3. Click "Add Wash" ✅

**Change Status:**
1. In the table, find a wash record
2. Click the status dropdown
3. Select "Completed"
4. Status updates in real-time ✅

**View Monthly:**
1. Select "Monthly Summary" from View Mode
2. Choose month/year
3. See all washes for that period ✅

**Filter by Status:**
1. Use the "Filter Status" dropdown
2. Select "Completed"
3. Only completed washes show ✅

## 📊 Data Flow

```
Frontend (CarWash.jsx)
    ↓
    ├─→ Add Form → POST /add-wash → Backend → Supabase
    ├─→ Status Dropdown → PUT /update-status → Backend → Supabase
    ├─→ Get Today → GET /today → Backend → Supabase
    ├─→ Get Monthly → GET /monthly → Backend → Supabase
    ├─→ Get Stats → GET /stats → Backend → Supabase
    └─→ Delete → DELETE /delete → Backend → Supabase
    ↓
Backend Routes (carWash.js)
    ↓
Supabase Database
    ↓
Views (daily_stats, monthly_stats, performance)
```

## 🛡️ Security Features

- ✅ RLS (Row Level Security) - Employees can only see their own data
- ✅ Car number validation (Indian format)
- ✅ Status validation (only valid statuses accepted)
- ✅ Employee ID verification
- ✅ Timestamps auto-generated

## 📈 Performance Optimization

- ✅ Indexes on frequently searched columns
- ✅ Views for fast statistics
- ✅ Date-based filtering
- ✅ Pagination support
- ✅ Limited data loading

## 🐛 Troubleshooting

### "Invalid car number format"
**Solution:** Use Indian format like `GJ01AB1234` (2 letters + 2 chars + 2 letters + 4 digits)

### Stats not updating
**Solution:** 
1. Check if `employeeId` is in localStorage
2. Refresh the page
3. Check browser console for errors

### Can't see employee's washes
**Solution:**
1. Make sure you're logged in
2. Check `localStorage.getItem('userId')`
3. Verify correct employee ID is passed

### Database table not created
**Solution:**
1. Run the SQL schema in Supabase
2. Check for errors in SQL execution
3. Verify table exists: `SELECT * FROM car_wash_tracking`

## 📁 Files Created

| File | Purpose |
|------|---------|
| `backend/routes/carWash.js` | API endpoints |
| `backend/CAR_WASH_TRACKING_SCHEMA.sql` | Database schema |
| `frontend/src/page/CarWash.jsx` | UI component |

## 🚀 Integration Steps

### 1. Add Backend Route to server.js
```javascript
import carWashRoutes from "./routes/carWash.js";
app.use("/car-wash", carWashRoutes);
```

### 2. Add Frontend Route to App.jsx
```javascript
import CarWash from "./page/CarWash.jsx";
<Route path="/car-wash" element={<CarWash />} />
```

### 3. Run Database Schema
- Copy SQL from `CAR_WASH_TRACKING_SCHEMA.sql`
- Run in Supabase SQL Editor

## 💡 Future Enhancements

- [ ] Export to PDF/CSV
- [ ] Email reports
- [ ] SMS notifications
- [ ] Quality rating system
- [ ] Customer feedback
- [ ] Revenue tracking
- [ ] Team comparison
- [ ] Mobile app push notifications

## 📞 Support

For issues or questions, check:
1. Browser console for error messages
2. Backend logs for API errors
3. Supabase logs for database issues
4. Verify environment variables are set

---

**Version:** 1.0  
**Last Updated:** December 2024  
**Status:** ✅ Production Ready
