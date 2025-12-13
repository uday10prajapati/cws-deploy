# QR Code Wash Management System - Complete Documentation

## System Overview

The QR Code Wash Management System is a comprehensive solution for managing car wash sessions with customer verification, image documentation, and loyalty point rewards.

### Workflow

```
1. Customer Setup
   └─ Customer creates account and adds cars
   └─ Address information is stored (Village, Street, City, State, Country)
   
2. QR Code Generation (Web)
   └─ Customer generates unique QR code for each car
   └─ QR contains: Customer name, email, mobile, address, car details, monthly pass status
   └─ Customer can download and print QR code to stick on car
   
3. Washer Workflow (Mobile/Web App)
   └─ Washer scans QR code at customer's location
   └─ System displays customer details and monthly pass status
   └─ Washer takes 4 photos BEFORE washing
   └─ Washer washes the car
   └─ Washer takes 4 photos AFTER washing
   └─ Washer marks wash as complete
   
4. Loyalty Reward
   └─ Customer automatically gets +1 loyalty point
   └─ Points can be redeemed for future services
```

## Database Schema

### Tables

#### 1. **qr_codes** - Store QR code data for each car
```sql
- id (UUID, Primary Key)
- car_id (UUID, Foreign Key → cars)
- customer_id (UUID, Foreign Key → profiles)
- qr_code_data (TEXT, JSON) - Full QR data
- qr_code_image (TEXT) - Base64/URL to QR image
- customer_name
- customer_email
- customer_mobile
- customer_address
- is_active (Boolean)
- created_at, updated_at
```

#### 2. **wash_sessions** - Record each wash session
```sql
- id (UUID, Primary Key)
- qr_code_id (UUID, Foreign Key → qr_codes)
- car_id (UUID, Foreign Key → cars)
- customer_id (UUID, Foreign Key → profiles)
- washer_id (UUID, Foreign Key → profiles)
- session_start, session_end (Timestamps)
- status (in_progress, completed, cancelled)
- monthly_pass_active (Boolean)
- is_completed (Boolean)
```

#### 3. **wash_session_images** - Store before/after photos
```sql
- id (UUID, Primary Key)
- wash_session_id (UUID, Foreign Key → wash_sessions)
- image_url (TEXT)
- image_type ('before' or 'after')
- image_position (1-4)
- uploaded_at
```

#### 4. **qr_code_scans** - Log each QR scan
```sql
- id (UUID, Primary Key)
- qr_code_id (UUID, Foreign Key → qr_codes)
- washer_id (UUID, Foreign Key → profiles)
- scan_timestamp
- scan_location (optional GPS)
- device_info
```

#### 5. **wash_completions** - Final wash record
```sql
- id (UUID, Primary Key)
- wash_session_id (UUID)
- qr_code_id (UUID)
- customer_id (UUID)
- washer_id (UUID)
- completion_timestamp
- loyalty_points_awarded (default: 1)
- payment_status
- notes
```

## API Endpoints

### QR Code Generation & Management

#### 1. Generate QR Code
```
GET /qrcode/generate/:carId
Response:
{
  success: true,
  qrCode: {
    id: "uuid",
    qrCodeImage: "base64 or URL",
    qrData: {
      carId, customerId, customerName, customerEmail,
      customerPhone, customerAddress, carBrand, carModel,
      numberPlate, monthlyPassActive, generatedAt
    }
  }
}
```

#### 2. Decode QR Code & Start Session
```
GET /qrcode/decode/:qrId
Response:
{
  success: true,
  qrCode: {
    id, customerName, customerEmail, customerMobile,
    customerAddress, qrData
  }
}
```

#### 3. Start Wash Session
```
POST /qrcode/start-wash-session
Body: { qrCodeId, washerId }
Response:
{
  success: true,
  washSession: {
    id, monthlyPassActive, customerName, customerMobile
  }
}
```

#### 4. Upload Wash Images
```
POST /qrcode/upload-wash-images
Body: {
  washSessionId,
  images: [
    { url: "base64", type: "before", position: 1 },
    { url: "base64", type: "after", position: 1 }
  ]
}
```

#### 5. Complete Wash Session
```
POST /qrcode/complete-wash
Body: { washSessionId }
Response:
{
  success: true,
  completion: {
    id, loyaltyPointsAwarded: 1, totalPoints
  }
}
```

#### 6. List QR Codes
```
GET /qrcode/list/:customerId
Response:
{
  success: true,
  qrCodes: [{ id, customer_name, ... }]
}
```

#### 7. Wash History
```
GET /qrcode/wash-history/:customerId
Response:
{
  success: true,
  washHistory: [{ completion record with relations }]
}
```

## Frontend Components

### 1. QRCodeManager.jsx
**Purpose:** Customer-facing component to generate and manage QR codes

**Features:**
- Display all customer's cars
- Generate QR codes for each car
- Download QR code images
- Preview QR code with customer details
- Shows customer name, email, mobile, address

**Props:** None (uses auth context)

**Usage:**
```jsx
import QRCodeManager from "@/components/QRCodeManager";

<QRCodeManager />
```

### 2. WashSessionManager.jsx
**Purpose:** Washer interface to scan QR and complete wash sessions

**Features:**
- QR code scanner (paste or scan)
- Display customer details when QR is scanned
- Monthly pass status indicator
- Upload up to 4 before images
- Upload up to 4 after images
- Complete wash and award loyalty point

**Usage:**
```jsx
import WashSessionManager from "@/components/WashSessionManager";

<WashSessionManager />
```

## Installation & Setup

### 1. Update Server Configuration
Add route to `backend/server.js`:
```javascript
import qrcodeRoutesNew from "./routes/qrcodeRoutesNew.js";
app.use("/qrcode", qrcodeRoutesNew);
```

### 2. Install Required Package
```bash
npm install qrcode
```

### 3. Run Database Schema
Execute `QR_CODE_SYSTEM_SCHEMA.sql` in your Supabase database.

### 4. Add Components to Your App
```jsx
// In your routing setup
import QRCodeManager from "@/components/QRCodeManager";
import WashSessionManager from "@/components/WashSessionManager";

// Customer route
<Route path="/customer/qrcodes" element={<QRCodeManager />} />

// Washer route
<Route path="/washer/wash-session" element={<WashSessionManager />} />
```

## Mobile App Integration Notes

For the mobile app (Android/iOS with React Native):

1. **QR Scanner Integration:**
   - Use `react-native-camera` or `expo-camera` for QR scanning
   - Parse QR data and pass to `start-wash-session` API

2. **Image Capture:**
   - Use device camera to capture before/after images
   - Convert to base64 and send to `upload-wash-images` endpoint

3. **Loyalty Points:**
   - Display earned points after wash completion
   - Show total loyalty points balance

## Example Usage Scenarios

### Scenario 1: Customer Creates QR Code
1. Customer logs in to web app
2. Goes to "QR Codes" section
3. Selects a car from their cars list
4. Clicks "Generate QR Code"
5. Downloads the QR code image
6. Prints and sticks on car window

### Scenario 2: Washer Completes Wash
1. Washer arrives at customer's location
2. Scans QR code with mobile app camera
3. App displays:
   - Customer: "John Doe"
   - Email: john@example.com
   - Mobile: 9876543210
   - Address: Village XYZ, City ABC
   - Monthly Pass: ✓ ACTIVE
4. Washer takes 4 photos BEFORE washing
5. Washer washes the car
6. Washer takes 4 photos AFTER washing
7. Clicks "Mark as Washed"
8. System confirms: "Wash completed! Customer earned 1 loyalty point"

### Scenario 3: Customer Checks Loyalty Points
1. Customer logs in to web app
2. Views loyalty points balance
3. Points increased by 1 from last wash
4. Can redeem points for discount on next service

## Security Considerations

1. **QR Code Data:**
   - Contains only non-sensitive info (name, phone, address)
   - No payment info or passwords in QR

2. **Authentication:**
   - Washer must be authenticated to start session
   - Only assigned employees can access wash sessions

3. **Image Storage:**
   - Before/after images stored securely
   - Can be used for quality verification and disputes

4. **Loyalty Points:**
   - Only awarded on session completion
   - Verified through database records

## Future Enhancements

1. **GPS Tracking:** Log exact location of wash
2. **Payment Integration:** Automatic payment on wash completion
3. **Rating System:** Customer rating for washer quality
4. **Subscription Plans:** Monthly vs. on-demand pricing
5. **Analytics Dashboard:** Track wash statistics and trends
6. **Multi-car Packages:** Discount for multiple cars
7. **Notification System:** Alert customer when wash starts/completes

## Troubleshooting

### QR Code Not Scanning
- Ensure good lighting
- Check QR code is not damaged
- Try manual paste of QR data

### Images Not Uploading
- Check internet connection
- Ensure camera permissions are granted
- Verify image size is not too large

### Loyalty Points Not Awarded
- Verify wash session marked as completed
- Check customer loyalty_points table exists
- Review wash_completions table for record

## Support & Maintenance

For issues or feature requests, contact the development team with:
1. Error message or screenshot
2. Steps to reproduce
3. Device/browser information
