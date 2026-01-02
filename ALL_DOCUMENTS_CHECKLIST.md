# All Documents Module - Implementation Checklist

## Pre-Implementation

- [ ] Backup database
- [ ] Review role hierarchy (General → Sub-General → HR-General → Salesman)
- [ ] Verify all user role assignments are correct
- [ ] Test access for at least one user from each role

## Database Setup

### Columns Verification
- [ ] `sales_cars.id` exists (TEXT PRIMARY KEY)
- [ ] `sales_cars.customer_name` exists
- [ ] `sales_cars.customer_phone` exists
- [ ] `sales_cars.number_plate` exists
- [ ] `sales_cars.customer_city` exists
- [ ] `sales_cars.customer_taluko` exists
- [ ] `sales_cars.car_photo_url` exists (for car photo)
- [ ] `sales_cars.image_url_1` exists (for address proof)
- [ ] `sales_cars.image_url_2` exists (for light bill)
- [ ] `sales_cars.created_at` exists

### Profiles Table
- [ ] `profiles.employee_type` column exists
  - Acceptable values: 'general', 'sub-general', 'hr-general', 'salesman'
- [ ] `profiles.assigned_cities` column exists (for Sub-General)
- [ ] `profiles.assigned_talukas` column exists (for HR-General)

### Indexes
- [ ] Create index on `sales_cars.customer_city`
- [ ] Create index on `sales_cars.customer_taluko`
- [ ] Create index on `sales_cars.customer_name`

Run SQL from `ALL_DOCUMENTS_DATABASE_SETUP.sql`

## Frontend Implementation

### File Creation
- [ ] Create `/frontend/src/Employee/AllDocuments.jsx`
- [ ] File contains all required functionality
- [ ] No syntax errors

### Component Integration
- [ ] Import AllDocuments in routing file
- [ ] Add route: `/documents/all` → `AllDocuments`
- [ ] Route requires authentication via `useRoleBasedRedirect`

### Navigation Integration
- [ ] Add navigation link in navbar/sidebar
- [ ] Link only shows for non-salesman roles
- [ ] Link has proper icon (`FiFileText`)
- [ ] Link text: "All Documents"

### Icon Imports
- [ ] Component imports all required icons from `react-icons/fi`:
  - [ ] `FiFileText`
  - [ ] `FiDownload`
  - [ ] `FiMapPin`
  - [ ] `FiAlertCircle`
  - [ ] `FiFilter`
  - [ ] `FiX`
  - [ ] `FiSearch`
  - [ ] `FiLock`

## Testing

### Access Control
- [ ] Test 1: Sales person visits `/documents/all` → See "Access Denied"
- [ ] Test 2: HR-General visits page → Can see documents
- [ ] Test 3: Sub-General visits page → Can see documents
- [ ] Test 4: General visits page → Can see documents

### Role-Based Filtering
- [ ] Test 5: HR-General sees only their assigned taluka documents
  - [ ] Verify customer_taluko matches assigned talukas
  - [ ] Verify no documents from other talukas visible
  
- [ ] Test 6: Sub-General sees only their assigned city documents
  - [ ] Verify customer_city matches assigned cities
  - [ ] Verify all talukas under assigned cities are visible
  - [ ] Verify no documents from other cities visible
  
- [ ] Test 7: General sees all documents
  - [ ] No geographic restrictions
  - [ ] All documents visible regardless of city/taluka

### Search & Filter
- [ ] Test 8: Search by customer name
  - [ ] Searching "John" finds "John Doe"
  - [ ] Case-insensitive search works
  
- [ ] Test 9: Search by phone number
  - [ ] Partial phone number search works
  - [ ] Full phone number search works
  
- [ ] Test 10: Search by number plate
  - [ ] Searching for plate works
  - [ ] Case-insensitive search works
  
- [ ] Test 11: Filter by document type
  - [ ] "Car Photo" filter shows only car_photo_url docs
  - [ ] "Address Proof" filter shows only image_url_1 docs
  - [ ] "Light Bill" filter shows only image_url_2 docs
  - [ ] "All Documents" filter shows all
  
- [ ] Test 12: Combined search + filter
  - [ ] Search and filter work together
  - [ ] Results update correctly

### Document Interaction
- [ ] Test 13: View document link
  - [ ] Clicking "View" opens document in new tab
  - [ ] Document displays correctly
  - [ ] Different documents can be viewed
  
- [ ] Test 14: Download document
  - [ ] Download button works for car_photo_url
  - [ ] Download button works for image_url_1
  - [ ] Download button works for image_url_2
  - [ ] File downloads with correct name
  
- [ ] Test 15: Multiple documents on card
  - [ ] Card shows multiple documents properly
  - [ ] Each document has separate view/download buttons
  - [ ] No overlap or layout issues

### UI/UX
- [ ] Test 16: Empty state
  - [ ] "No documents found" message appears when no results
  - [ ] Message appears for all roles
  - [ ] Friendly icon displayed
  
- [ ] Test 17: Loading state
  - [ ] Loading spinner appears while fetching
  - [ ] Loading message displays
  - [ ] Spinner disappears when loaded
  
- [ ] Test 18: Responsive design
  - [ ] Page works on desktop (3 columns)
  - [ ] Page works on tablet (2 columns)
  - [ ] Page works on mobile (1 column)
  - [ ] All text readable
  - [ ] No horizontal scrolling on mobile
  
- [ ] Test 19: Information display
  - [ ] Customer name displays
  - [ ] Customer phone displays
  - [ ] Vehicle number displays
  - [ ] City and taluka display (if present)
  - [ ] Registration date displays
  - [ ] User role displays in banner
  - [ ] Assigned cities/talukas display in banner

### Edge Cases
- [ ] Test 20: User with no assigned cities/talukas
  - [ ] HR-General with no talukas → No documents shown
  - [ ] Sub-General with no cities → No documents shown
  
- [ ] Test 21: Document with missing information
  - [ ] Document missing city → Still displays
  - [ ] Document missing taluko → Still displays
  - [ ] Document missing phone → Shows "N/A"
  - [ ] Document missing name → Shows "N/A"
  
- [ ] Test 22: Very long data
  - [ ] Very long customer name displays correctly
  - [ ] Very long number plate displays correctly
  - [ ] URLs truncate properly
  
- [ ] Test 23: Special characters
  - [ ] Names with special characters work
  - [ ] Phone numbers with +91 prefix work
  - [ ] City names with special characters work
  - [ ] Search with special characters works

### Performance
- [ ] Test 24: Load time with many documents
  - [ ] Page loads in <2 seconds with 100 documents
  - [ ] Page loads in <5 seconds with 1000 documents
  
- [ ] Test 25: Search responsiveness
  - [ ] Search results update immediately (< 100ms)
  - [ ] No lag when typing in search box
  
- [ ] Test 26: Filter responsiveness
  - [ ] Filter change updates immediately
  - [ ] No lag when changing filters

### Browser Compatibility
- [ ] Test 27: Chrome/Edge
  - [ ] All features work
  - [ ] Styling correct
  
- [ ] Test 28: Firefox
  - [ ] All features work
  - [ ] Styling correct
  
- [ ] Test 29: Safari
  - [ ] All features work
  - [ ] Styling correct
  
- [ ] Test 30: Mobile browsers
  - [ ] All features work on mobile
  - [ ] Responsive design works

## Error Handling

- [ ] Test 31: Network error
  - [ ] Error handled gracefully
  - [ ] User sees error message
  - [ ] App doesn't crash
  
- [ ] Test 32: Authentication error
  - [ ] User redirected to login if not authenticated
  - [ ] Proper error message displayed
  
- [ ] Test 33: Invalid document URL
  - [ ] "View" link handles 404 gracefully
  - [ ] "Download" handles 404 gracefully

## Post-Implementation

### Documentation
- [ ] README updated with new feature
- [ ] User guide created for each role
- [ ] API documentation updated
- [ ] Database schema documented

### Deployment
- [ ] Code reviewed
- [ ] All tests pass
- [ ] No console warnings/errors
- [ ] Staging environment tested
- [ ] Production deployment scheduled
- [ ] Backup created before deployment
- [ ] Deploy to production
- [ ] Monitor for errors

### User Communication
- [ ] Email sent to users about new feature
- [ ] Training materials created (if needed)
- [ ] Help desk notified about new feature
- [ ] FAQ updated

## Rollback Plan

In case of issues:
- [ ] Backup location documented
- [ ] Rollback procedure documented
- [ ] Test rollback procedure before production
- [ ] Contact info for emergency rollback

## Success Criteria

✅ All tests pass
✅ No security vulnerabilities found
✅ Performance acceptable
✅ All roles have correct access
✅ Users can view and download documents
✅ Search and filter work correctly
✅ Mobile responsive
✅ All browsers supported
✅ Documentation complete
✅ Users trained and ready

## Sign-Off

- [ ] QA approved
- [ ] Security approved  
- [ ] Product owner approved
- [ ] Ready for production deployment

---

**Deployment Date:** _______________
**Deployed By:** ___________________
**Notes:** _________________________
