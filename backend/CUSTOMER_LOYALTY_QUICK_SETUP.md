# Customer Loyalty Points - Quick Setup Guide

## What You Get

A complete system where:
- ✅ Customers earn **1 point per car wash**
- ✅ Points automatically awarded when washer completes booking
- ✅ Customers unlock offers when reaching point thresholds
- ✅ Customers can redeem offers for coupons/discounts
- ✅ Admin can create and manage offers
- ✅ Admin can view customer loyalty leaderboard
- ✅ Full notification system integrated

## 3-Step Setup

### Step 1: Database Schema
Run this SQL in Supabase SQL Editor:

```sql
-- File: CUSTOMER_LOYALTY_SCHEMA.sql
-- Paste entire file contents and execute
```

This creates 4 tables:
- `customer_loyalty_points` - Track points per customer
- `customer_wash_history` - Record each wash
- `loyalty_offers` - Define available offers
- `loyalty_redemptions` - Track redeemed offers

### Step 2: Backend Ready
Code is already integrated:
- Routes added to `server.js`
- Mounted at `/customer-loyalty`
- All endpoints functional

### Step 3: Frontend Route
Route already added:
- Path: `/customer/loyalty`
- Component: `CustomerLoyaltyDashboard.jsx`

## Add to Navigation

In your customer dashboard, add link:

```jsx
<Link to="/customer/loyalty" className="menu-item">
  🎁 Loyalty Points
</Link>
```

## Create Initial Offers

### Option 1: Postman/cURL
```bash
curl -X POST http://localhost:5000/customer-loyalty/offers/create \
  -H "Content-Type: application/json" \
  -d '{
    "offer_title": "25% Off Next Wash",
    "offer_description": "Get 25% discount on your next wash",
    "points_required": 10,
    "discount_percentage": 25,
    "coupon_code": "LOYALTY25"
  }'
```

### Option 2: JavaScript
```javascript
const createOffer = async (offerData) => {
  const res = await fetch(
    "http://localhost:5000/customer-loyalty/offers/create",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(offerData)
    }
  );
  return await res.json();
};

// Create offers
await createOffer({
  offer_title: "25% Off",
  offer_description: "Get 25% discount",
  points_required: 10,
  discount_percentage: 25,
  coupon_code: "LOYALTY25"
});
```

## Record Washes

Call this when booking is marked complete:

```javascript
const recordWash = async (customerId, carId, bookingId, washerId) => {
  const res = await fetch(
    "http://localhost:5000/customer-loyalty/loyalty/record-wash",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customer_id: customerId,
        car_id: carId,
        booking_id: bookingId,
        washer_id: washerId
      })
    }
  );
  
  const data = await res.json();
  if (data.success) {
    console.log("✅ Point earned! Total:", data.loyalty.total_points);
  }
  return data;
};
```

## How It Works

### Customer Journey

1. **Earn Points**
   - Car gets washed
   - +1 point awarded automatically
   - Notification sent to customer

2. **Reach Threshold**
   - Accumulate points
   - Unlock offers at certain levels (10, 25, 50 points)
   - Get "New Offers Available" notification

3. **Redeem Offer**
   - Go to Loyalty dashboard
   - Click "Redeem Offer"
   - Get coupon code instantly
   - Points deducted from account

4. **Use Coupon**
   - Use code at checkout
   - Get discount/free wash
   - Points won't be refunded

## Points Tier Example

| Milestone | Offers Unlocked |
|-----------|-----------------|
| 10 points | 25% OFF coupon (10 points) |
| 25 points | 50% OFF coupon (25 points) |
| 50 points | FREE WASH (50 points) |

## API Endpoints Summary

```
GET  /customer-loyalty/loyalty/:customer_id
     → Get customer's points and available offers

POST /customer-loyalty/loyalty/record-wash
     → Record a car wash (add 1 point)

GET  /customer-loyalty/offers
     → Get all active offers

POST /customer-loyalty/loyalty/redeem-offer
     → Redeem an offer (spend points, get coupon)

GET  /customer-loyalty/history/:customer_id
     → Get wash history

GET  /customer-loyalty/redemptions/:customer_id
     → Get redeemed offers history

GET  /customer-loyalty/admin/leaderboard
     → Get all customers ranked by points (admin)

POST /customer-loyalty/offers/create
     → Create new offer (admin)
```

## Notifications

### Automatic Notifications Sent

**To Customer:**
- "Loyalty Point Earned! 🎉" - When car washed
- "New Offers Available! 🎁" - When unlocking offers
- "Offer Redeemed! ✅" - When spending points

**To Admin:**
- "Customer Car Washed" - Whenever customer's car is washed
- "Customer Redeemed Offer" - When offer is redeemed

## Testing

### Quick Test

```javascript
// 1. Record 10 washes
for (let i = 0; i < 10; i++) {
  await recordWash(customerId, carId, bookingId, washerId);
}

// 2. Check available offers
const res = await fetch(
  `http://localhost:5000/customer-loyalty/loyalty/${customerId}`
);
const data = await res.json();
console.log("Available offers:", data.offers.available);

// 3. Redeem first offer
const offerToRedeem = data.offers.available[0];
await fetch("http://localhost:5000/customer-loyalty/loyalty/redeem-offer", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    customer_id: customerId,
    offer_id: offerToRedeem.id
  })
});
```

## Admin Features

### View Leaderboard
```bash
curl http://localhost:5000/customer-loyalty/admin/leaderboard
```

Shows all customers ranked by points:
- Customer name/email
- Total points
- Cars washed
- Last wash date

### Manage Offers
- Create offers with specific point requirements
- Set discount percentages
- Auto-generate or custom coupon codes
- Set expiration dates
- Enable/disable offers anytime

## Files Modified/Created

**Created:**
- ✅ `backend/routes/customerLoyaltyRoutes.js`
- ✅ `backend/CUSTOMER_LOYALTY_SCHEMA.sql`
- ✅ `frontend/src/Customer/CustomerLoyaltyDashboard.jsx`

**Modified:**
- ✅ `backend/server.js` - Added routes
- ✅ `frontend/src/App.jsx` - Added route

## Checklist

- [ ] Run CUSTOMER_LOYALTY_SCHEMA.sql in Supabase
- [ ] Create initial offers (at least 3)
- [ ] Add `/customer/loyalty` link to customer menu
- [ ] Test recording a wash
- [ ] Test viewing loyalty dashboard
- [ ] Test redeeming an offer
- [ ] Verify notifications are sent
- [ ] Test admin leaderboard view

## Real-World Integration

When washer marks booking as complete:

```javascript
const completeWash = async (booking) => {
  // 1. Mark complete
  await updateBooking(booking.id, { status: 'completed' });
  
  // 2. Award customer loyalty point
  await recordWash(
    booking.customer_id,
    booking.car_id,
    booking.id,
    booking.washer_id
  );
  
  // 3. Award washer loyalty point (optional, separate system)
  await recordWasherWash(booking.washer_id, booking.car_id, booking.id);
};
```

## Support

**Issue: Points not increasing?**
- Verify customer_id and car_id exist
- Check booking is complete
- Review server logs

**Issue: Offers not showing?**
- Verify offers exist in database
- Check offer is_active = true
- Verify points_required is correct

**Issue: Redemption fails?**
- Check customer has enough points
- Verify offer exists
- Check offer is still valid

---

**Done!** 🎉 Customers can now earn and redeem loyalty points!
