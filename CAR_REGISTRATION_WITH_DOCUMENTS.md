# Car Registration with Documents - Final Update

## Database Schema Update

### Migration File Created
File: `backend/migrations/add_document_fields_to_sales_cars.sql`

New column added:
- `driving_license_url` - For storing driving license document

### Column Usage in sales_cars Table
```sql
- car_photo_url: Stores the car image/photo
- image_url_1: Stores address proof document (ID/Aadhaar/Voter ID)
- image_url_2: Stores light bill / electricity bill document  
- driving_license_url: Stores driving license document
```

## Frontend Changes - SalesWork.jsx

### 1. Updated carForm State
```javascript
const [carForm, setCarForm] = useState({
  customerName: "",
  customerPhone: "",
  model: "",
  numberPlate: "",
  color: "",
  carPhoto: null,              // Single car photo
  addressProof: null,          // Address proof document
  lightBill: null,            // Light bill document
  drivingLicense: null,       // Driving license document
});
```

### 2. Updated Modal UI Structure

**Car Photo Section:**
- Single upload field for car photo
- Stores in `car_photo_url` database column
- Camera icon with dashed border clickable upload area

**Customer Documents Section:**
- Three separate upload areas with file icons
- Address Proof (green bordered) → stores in `image_url_1`
- Light Bill (green bordered) → stores in `image_url_2`
- Driving License (green bordered) → stores in `driving_license_url`

### 3. Updated handleAddCar Function

Validates:
- ✅ Customer details (name, phone)
- ✅ Car details (model, number plate, color)
- ✅ Car photo
- ✅ All three documents

Uploads to Supabase Storage:
```
cars/{user_id}/{timestamp}_car_photo_{filename}     → car_photo_url
documents/{user_id}/{timestamp}_address_proof_{filename}     → image_url_1
documents/{user_id}/{timestamp}_light_bill_{filename}        → image_url_2
documents/{user_id}/{timestamp}_driving_license_{filename}   → driving_license_url
```

## User Flow

1. **Fill Customer Details**
   - Customer Name
   - Customer Phone

2. **Fill Car Details**
   - Car Model (e.g., Honda Civic)
   - Number Plate (e.g., MH-01-AB-1234)
   - Car Color (e.g., White)

3. **Upload Car Photo**
   - Click camera icon
   - Select single car image

4. **Upload Required Documents**
   - Click Address Proof icon → Select ID/Aadhaar/Voter ID image
   - Click Light Bill icon → Select electricity bill image
   - Click Driving License icon → Select driving license image

5. **Submit**
   - All fields must be filled
   - All images must be uploaded
   - Click "Add Car" button
   - Success message appears
   - Modal closes and resets

## Error Handling

- Specific error messages for each upload failure
- Database errors are caught and reported
- Console logs for debugging
- User-friendly alert messages

## Database Columns Used

| Column | Purpose | Example |
|--------|---------|---------|
| car_photo_url | Car image | https://... |
| image_url_1 | Address proof doc | https://... |
| image_url_2 | Light bill doc | https://... |
| driving_license_url | Driving license | https://... |
| customer_name | Customer name | John Doe |
| customer_phone | Customer phone | 9876543210 |
