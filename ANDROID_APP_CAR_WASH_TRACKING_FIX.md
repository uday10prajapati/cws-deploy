# Android App - Car Wash Tracking Database Integration Fix

## Current Issue
The `markAsWashed()` function in `JobDetailsActivity.java` needs to:
1. Properly capture the car number
2. Upload images to Supabase Storage
3. Save image URLs to the database
4. Store all wash details with images in `car_wash_tracking` table

## Changes Required

### 1. Add Global Variables for Car Details and Images

```java
public class JobDetailsActivity extends AppCompatActivity {
    // ... existing variables ...
    
    // ADD THESE NEW VARIABLES:
    private String currentCarNumber;  // To store car number for tracking
    private String carModel;          // Car model for tracking
    private String carOwnerName;      // Car owner name
    
    // Image URLs after upload
    private String imgUrlBefore1;
    private String imgUrlBefore2;
    private String imgUrlAfter1;
    private String imgUrlAfter2;
```

### 2. Update `fetchSpecificCarDetailsAndThenLoad()` to Store Car Info

Replace the existing method with:

```java
private void fetchSpecificCarDetailsAndThenLoad(String customerId, String carId) {
    SharedPreferences prefs = getSharedPreferences(PREFS_NAME, MODE_PRIVATE);
    String token = prefs.getString("USER_TOKEN", null);
    if (token == null) return;
    String authHeader = "Bearer " + token;
    SupabaseAuthApi api = RetrofitClient.getClient().create(SupabaseAuthApi.class);

    api.getCar(SUPABASE_KEY, authHeader, "eq." + carId).enqueue(new Callback<List<Car>>() {
        @Override
        public void onResponse(Call<List<Car>> call, Response<List<Car>> response) {
            if (response.isSuccessful() && response.body() != null && !response.body().isEmpty()) {
                Car car = response.body().get(0);
                
                // STORE CAR DETAILS GLOBALLY
                currentCarNumber = car.getNumberPlate();
                carModel = (car.getBrand() != null ? car.getBrand() : "") + " " + 
                          (car.getModel() != null ? car.getModel() : "");
                
                // Update UI
                tvCarModel.setText("Car: " + carModel.trim());
                tvLicensePlate.setText("Plate: " + (car.getNumberPlate() != null ? car.getNumberPlate() : "Unknown"));
                if (car.getNumberPlate() != null) scannedPlate = car.getNumberPlate();
            }
            loadAllDataUsingCarAndCustomer(customerId, carId);
        }

        @Override
        public void onFailure(Call<List<Car>> call, Throwable t) {
            Log.e(TAG, "fetchSpecificCarDetails failure", t);
            loadAllDataUsingCarAndCustomer(customerId, carId);
        }
    });
}
```

### 3. Update `loadAllDataUsingCarAndCustomer()` to Store Customer Name

```java
private void loadAllDataUsingCarAndCustomer(String customerId, String carId) {
    this.customerId = customerId;
    this.carId = carId;

    SharedPreferences prefs = getSharedPreferences(PREFS_NAME, MODE_PRIVATE);
    String token = prefs.getString("USER_TOKEN", null);
    if (token == null) return;
    String authHeader = "Bearer " + token;
    SupabaseAuthApi api = RetrofitClient.getClient().create(SupabaseAuthApi.class);

    // Fetch profile to display name and STORE IT
    if (customerId != null) {
        api.getProfile(SUPABASE_KEY, authHeader, "eq." + customerId).enqueue(new Callback<List<Profile>>() {
            @Override
            public void onResponse(Call<List<Profile>> call, Response<List<Profile>> response) {
                if (response.isSuccessful() && response.body() != null && !response.body().isEmpty()) {
                    Profile prof = response.body().get(0);
                    String fullName = prof.getFullName() != null ? prof.getFullName() : "Customer";
                    carOwnerName = fullName;  // STORE IT HERE
                    tvCustomerName.setText("Customer Name: " + fullName);
                }
            }

            @Override
            public void onFailure(Call<List<Profile>> call, Throwable t) {
                Log.w(TAG, "getProfile failure", t);
                carOwnerName = "Unknown";  // DEFAULT VALUE
            }
        });
    }
    
    // ... rest of method ...
}
```

### 4. Replace `markAsWashed()` Method Completely

```java
private void markAsWashed() {
    if (customerId == null || currentCarNumber == null) {
        Toast.makeText(this, "Car or customer information not loaded yet", Toast.LENGTH_SHORT).show();
        return;
    }

    // Disable button to prevent double-clicks
    btnWashed.setEnabled(false);

    SharedPreferences prefs = getSharedPreferences(PREFS_NAME, MODE_PRIVATE);
    String token = prefs.getString("USER_TOKEN", null);
    String employeeId = prefs.getString("USER_ID", null);

    if (token == null || employeeId == null) {
        Toast.makeText(this, "User session error", Toast.LENGTH_SHORT).show();
        btnWashed.setEnabled(true);
        return;
    }

    String authHeader = "Bearer " + token;
    SupabaseAuthApi api = RetrofitClient.getClient().create(SupabaseAuthApi.class);
    
    Toast.makeText(this, "Saving wash details with images...", Toast.LENGTH_SHORT).show();

    // Create the wash tracking record
    JsonObject trackingBody = new JsonObject();
    trackingBody.addProperty("employee_id", employeeId);
    trackingBody.addProperty("car_owner_name", carOwnerName != null ? carOwnerName : "Customer");
    trackingBody.addProperty("car_model", carModel != null ? carModel : "Unknown");
    trackingBody.addProperty("car_number", currentCarNumber);  // ✅ NOW PROPERLY SET
    trackingBody.addProperty("status", "washed");
    trackingBody.addProperty("wash_date", new SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(new Date()));
    
    // Add image URLs if available
    if (imgUrlBefore1 != null) trackingBody.addProperty("before_img_1", imgUrlBefore1);
    if (imgUrlBefore2 != null) trackingBody.addProperty("before_img_2", imgUrlBefore2);
    if (imgUrlAfter1 != null) trackingBody.addProperty("after_img_1", imgUrlAfter1);
    if (imgUrlAfter2 != null) trackingBody.addProperty("after_img_2", imgUrlAfter2);

    // Insert into car_wash_tracking
    api.insertWashTracking(SUPABASE_KEY, authHeader, trackingBody).enqueue(new Callback<Void>() {
        @Override
        public void onResponse(Call<Void> call, Response<Void> response) {
            if (response.isSuccessful()) {
                Log.d(TAG, "✅ Wash tracking saved successfully");
                // Proceed to update Booking and Loyalty
                updateBookingAndLoyaltyPoints(api, authHeader);
            } else {
                btnWashed.setEnabled(true);
                Log.e(TAG, "Failed to save wash record. Code: " + response.code());
                Toast.makeText(JobDetailsActivity.this, 
                    "Failed to save wash record. Code: " + response.code(), 
                    Toast.LENGTH_SHORT).show();
                try {
                    if (response.errorBody() != null) {
                        Log.e(TAG, "Error: " + response.errorBody().string());
                    }
                } catch (Exception e) {
                    Log.e(TAG, "Could not read error body", e);
                }
            }
        }

        @Override
        public void onFailure(Call<Void> call, Throwable t) {
            btnWashed.setEnabled(true);
            Log.e(TAG, "Network error saving wash tracking", t);
            Toast.makeText(JobDetailsActivity.this, 
                "Network error: " + t.getMessage(), 
                Toast.LENGTH_SHORT).show();
        }
    });
}
```

### 5. Add Image Upload Helper Method (Optional - For Future Image Storage)

If you want to upload images to Supabase Storage before saving:

```java
private void uploadImageAndGetUrl(Uri imageUri, String imageName, 
        Callback<String> onUrlReady) {
    // This would require Supabase Storage SDK integration
    // For now, you can use the image URI directly or implement this later
    
    // Placeholder: Convert URI to base64 or upload to storage
    // Then call: onUrlReady.onSuccess(imageUrl);
}
```

## Database Table Details

Your table already has these columns:
- ✅ `car_number` - LICENSE PLATE
- ✅ `car_model` - CAR BRAND/MODEL
- ✅ `car_owner_name` - CUSTOMER NAME
- ✅ `before_img_1`, `before_img_2` - BEFORE PHOTOS
- ✅ `after_img_1`, `after_img_2` - AFTER PHOTOS
- ✅ `wash_date` - AUTO FILLED AS CURRENT_DATE
- ✅ `status` - SET TO 'washed'
- ✅ `employee_id` - WASHER/EMPLOYEE ID

## Complete Data Flow

```
1. QR Scan/Booking Load
   ↓
2. Fetch Car Details → Store in currentCarNumber, carModel
   ↓
3. Fetch Profile → Store in carOwnerName
   ↓
4. User Clicks "Mark as Washed"
   ↓
5. Prepare JsonObject with:
   - employee_id (from SharedPreferences)
   - car_owner_name (from profile)
   - car_model (from car details)
   - car_number (from car details) ✅ FIXED
   - status = "washed"
   - wash_date (current date)
   - Image URLs (if available)
   ↓
6. INSERT INTO car_wash_tracking
   ↓
7. Update Booking Status & Loyalty Points
   ↓
8. Show Success Toast & Close Activity
```

## Important Notes

⚠️ **Image Handling:**
- Currently, the code saves image URLs as TEXT fields
- You need to either:
  1. Upload images to Supabase Storage first and save the URLs
  2. Or convert images to Base64 and save directly (not recommended for large images)
  3. Or pass image file references to the backend API which handles upload

⚠️ **Unique Constraint:**
- Table has `UNIQUE (car_number, wash_date)` constraint
- This prevents marking the same car as washed twice on the same day
- If this happens, you'll get an error - handle it gracefully

⚠️ **Car Number Validation:**
- Table requires valid Indian license plate format: `^[A-Z]{2}[A-Z0-9]{2}[A-Z]{2}[0-9]{4}$`
- Or numeric format: `^[0-9]{10}$`
- Make sure the car number from database matches this format
