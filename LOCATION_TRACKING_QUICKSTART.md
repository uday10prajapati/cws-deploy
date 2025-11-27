# 🚀 Location Tracking Feature - Quick Start Guide

## What's New?
Employees can now track and manage real-time pickup and delivery locations with:
- **Active Deliveries**: See jobs in progress
- **Pending Bookings**: View upcoming jobs
- **Optimized Route**: See the best sequence of locations to visit
- **Live Statistics**: Dashboard showing today's job summary
- **Real-time Updates**: Auto-refreshes every 30 seconds

## How to Use

### 1. Navigate to Locations
Click "Locations" in the sidebar menu (orange location icon) or go to `/employee/location`

### 2. View Active Deliveries
- See all jobs currently being serviced
- Check customer details and contact info
- Verify pickup/delivery location
- Click "Mark Completed" when done

### 3. Check Pending Jobs
- See upcoming bookings for today
- Review job details before starting
- Click "Start Delivery" when ready to pick up/service

### 4. Follow Optimized Route
- See all locations grouped together
- Locations are numbered in optimal sequence
- Expand locations to see individual jobs
- Save time by following the suggested route

### 5. Monitor Statistics
Real-time counters show:
- Today's total jobs
- Pending jobs awaiting start
- Active deliveries in progress
- Completed jobs
- Pickups required
- Self-delivery jobs

## Key Features Explained

### Status Indicators
| Indicator | Meaning |
|-----------|---------|
| 🟢 Blinking Green | In Progress - Active delivery |
| 🟡 Yellow | Pending - Waiting to start |
| ✅ Green | Completed - Job finished |

### Booking Card Information
Each job card shows:
- **Car Details**: Make, model, license plate
- **Customer**: Name and phone (clickable to call)
- **Timing**: Date and time scheduled
- **Services**: What services to perform
- **Location**: Where the service happens
- **Amount**: Payment for this job
- **Pickup Status**: Does car need pickup?

### Route Tab Benefits
- Groups jobs by location
- Shows 3-5 jobs per location on average
- Numbered sequence for easy navigation
- Shows pickup count per location
- Estimated 30 mins per job in each location

## Button Actions

| Button | Action | Result |
|--------|--------|--------|
| **Start Delivery** | Click when ready to begin | Changes status to "In Progress" |
| **Mark Completed** | Click when job is done | Changes status to "Completed" |
| **Refresh** | Manual refresh | Fetches latest job data |
| **Expand Location** | Click to expand/collapse | Shows/hides jobs in location |

## Color Legend

| Color | Means |
|-------|-------|
| 🔵 Blue | Primary/Service location |
| 🟢 Green | Completed/Ready |
| 🟡 Yellow | Pending/Attention needed |
| 🟠 Orange | Pickup required |
| 🟣 Purple | Car details |
| ⚪ Gray | Additional info |

## Time-Saving Tips

1. **Use Route Tab First**
   - Start with Route to plan your day
   - Visit locations in numbered order
   - Saves travel time and fuel

2. **Check Statistics**
   - Know how many pickups you need to do
   - Plan breaks between locations
   - Track progress throughout the day

3. **Call Customers**
   - Click phone icon to call
   - Confirm pickup time/location
   - Update customer on status

4. **Auto-Refresh**
   - Leave location page open
   - New jobs appear automatically every 30 seconds
   - Data always up-to-date

## Common Workflows

### Daily Morning Routine
1. Open Locations page
2. Check Statistics (see today's workload)
3. Switch to Route tab
4. Follow the numbered locations
5. For each job: expand → check details → Start Delivery

### During Service
1. Click "Start Delivery" when picking up car
2. Navigate to service location
3. Perform services
4. Click "Mark Completed" when done
5. System auto-refreshes for next job

### End of Day
1. Check "Completed" counter
2. All jobs should be green ✅
3. Compare with "Today's Jobs" counter
4. Any pending? Call customer to reschedule

## FAQ

**Q: How often does the data update?**  
A: Every 30 seconds automatically. Click Refresh for instant update.

**Q: Can I update a status by accident?**  
A: Yes, but you can click the other button to change it back.

**Q: Why isn't a new job showing up?**  
A: Click Refresh button or wait 30 seconds for auto-refresh.

**Q: How do I know which location to visit first?**  
A: Check Route tab - locations are numbered in best sequence.

**Q: Can I call the customer from here?**  
A: Yes! Click the phone icon on any booking card.

**Q: What if I need to cancel a booking?**  
A: That's a different process - ask your manager.

## API Details (For Developers)

**Base URL**: `http://localhost:5000/api/car-locations`

**Key Endpoints**:
- `GET /active/:employee_id` - Active & pending jobs
- `GET /stats/today/:employee_id` - Today's statistics
- `GET /route/:employee_id` - Optimized route
- `PUT /update-status/:booking_id` - Change job status
- `GET /booking/:booking_id` - Single job details

**Auto-Refresh**: 30-second interval (configurable in code)

## Troubleshooting

| Issue | Solution |
|-------|----------|
| No jobs showing | Click Refresh / Logout & login again |
| Wrong job status | Click the action button to correct it |
| Customer phone not working | Check phone number format (10 digits) |
| Page slow to load | Clear browser cache / Try incognito mode |
| Real-time not updating | Check internet connection / Refresh page |

## Keyboard Shortcuts (Future)
- `R` - Refresh data
- `⬅️ ➡️` - Switch tabs
- `E` - Expand all locations
- `C` - Collapse all locations

---

**Last Updated**: November 27, 2025  
**Feature Status**: ✅ Live & Active  
**Support**: Contact your manager or tech team
