# Washer Document Upload - Quick Setup Guide

## What Was Just Added

Complete document verification system for washers with:
- ✅ Washer document upload interface at `/washer/documents`
- ✅ Admin verification dashboard in AdminDashboard
- ✅ Unique profile codes for each washer
- ✅ Real-time verification status tracking
- ✅ Navbar and sidebar integration

## Quick Start

### Step 1: Create Database Tables
Run this SQL in Supabase SQL Editor:

```sql
-- Copy contents of WASHER_DOCUMENTS_SCHEMA.sql
```

### Step 2: Setup Supabase Storage
1. Go to Supabase Dashboard → Storage
2. Create bucket: `washer_documents`
3. Set to **Public** (check "Make this bucket public")

### Step 3: Backend Already Configured
Routes are mounted at:
- `/documents/*` - All document endpoints

### Step 4: Frontend Already Configured
Routes added:
- `/washer/documents` - Washer upload page
- AdminDashboard has "Washer Documents" menu item

## How to Use

### As a Washer

1. **Login** as washer
2. **Click** "Documents" in sidebar (or 📄 icon)
3. **Copy** your profile code (appears at top)
4. **Upload** required documents:
   - Aadhar Card (required)
   - PAN Card OR Voter Card (one required)
   - Bank Passbook (required)
   - Profile Picture (required)
5. **Wait** for admin verification
6. **Get notified** when documents are approved

### As an Admin

1. **Login** as admin
2. **Click** "Washer Documents" in sidebar
3. **See list** of all washers with status
4. **Search** by name, email, or profile code
5. **Filter** by completion status (All/Verified/Pending)
6. **Click** on washer to review documents
7. **Approve/Reject** each document
8. **Add notes** if document needs work
9. **Washer gets notified** automatically

## Features

### Washer Features
- 📄 Upload documents with drag-and-drop
- 🔄 Track verification status in real-time
- 📋 See profile code to share with admin
- 👀 View uploaded documents
- ✏️ Re-upload if rejected
- 🔔 Get notifications on approval/rejection

### Admin Features
- 🔍 Search by name, email, or profile code
- 🗂️ Filter by status (Complete/Pending)
- 👁️ View document images and PDFs
- ✅ Approve documents
- ❌ Reject with notes
- 📊 See completion status per washer
- 🔔 Auto-send notifications

## Profile Code Format

```
WD093025AB12
│ │      │
│ │      └─ Random 4 alphanumeric
│ └─────── Last 6 digits of timestamp
└────── Washer Documents prefix
```

## Required Documents

| Document | Type | Status |
|----------|------|--------|
| Aadhar Card | Government ID | Required ✓ |
| PAN / Voter Card | Government ID | One Required ✓ |
| Bank Passbook | Financial | Required ✓ |
| Profile Picture | Photo | Required ✓ |

**Profile Completes When:**
- ✅ Aadhar verified
- ✅ Identity verified (PAN or Voter)
- ✅ Bank verified
- ✅ Profile picture uploaded

## API Endpoints

### Washer Endpoints
- `GET /documents/documents/:washer_id` - Get my documents
- `GET /documents/profile-code/:washer_id` - Get my profile code
- `POST /documents/documents/upload` - Upload document
- `DELETE /documents/documents/:document_id` - Delete document

### Admin Endpoints
- `GET /documents/admin/all-documents` - Get all documents
- `GET /documents/admin/documents/:washer_id` - Get washer's docs
- `POST /documents/admin/verify-document` - Approve/Reject
- `GET /documents/admin/profile-codes` - Get all profile codes

## File Structure

```
Frontend:
├── Washer/
│   └── WasherDocumentUpload.jsx ✅ Document upload page
│
└── Admin/
    └── AdminDocumentVerification.jsx ✅ Admin verification

Backend:
├── routes/
│   └── washerDocumentsRoutes.js ✅ All endpoints
│
└── WASHER_DOCUMENTS_SCHEMA.sql ✅ Database schema
```

## Integration Points

### Existing Components Used
- ✅ Navbar (from components/)
- ✅ Sidebar (custom in component)
- ✅ useRoleBasedRedirect hook
- ✅ Supabase auth
- ✅ Notification system

### Routes Added
- ✅ /washer/documents (in App.jsx)
- ✅ Admin menu item (in AdminDashboard.jsx)
- ✅ Washer menu item (in CarWash.jsx)

## Testing

### Test Upload Flow
1. Login as washer
2. Go to `/washer/documents`
3. Upload test image
4. Should see "Pending Review"
5. Login as admin
6. Go to Washer Documents
7. Find washer and approve
8. Check washer dashboard - status updates

### Test Admin Verification
1. Login as admin
2. Click "Washer Documents"
3. Search for test washer
4. Click to expand
5. Review documents
6. Add notes (optional)
7. Click "Approve"
8. Should see success message

## Troubleshooting

### Issue: Can't upload documents
**Solution:** Check Supabase Storage bucket `washer_documents` exists and is public

### Issue: Admin can't see documents
**Solution:** Ensure user has admin role in profiles table

### Issue: Notifications not appearing
**Solution:** Check notifications table exists in database

### Issue: Profile code not showing
**Solution:** Ensure washer_profile_codes table was created

## Next Steps

1. **Run SQL schema** to create tables
2. **Test washer upload** with test account
3. **Test admin verification** with admin account
4. **Configure storage bucket** if not done
5. **Monitor notifications** to ensure they're working

## Files Modified

✅ `App.jsx` - Added route
✅ `CarWash.jsx` - Added menu item
✅ `AdminDashboard.jsx` - Added menu item + component import
✅ `server.js` - Added routes (already done)

## Files Created

✅ `WasherDocumentUpload.jsx` - Washer UI
✅ `AdminDocumentVerification.jsx` - Admin UI
✅ `washerDocumentsRoutes.js` - Backend
✅ `WASHER_DOCUMENTS_SCHEMA.sql` - Database
✅ `WASHER_DOCUMENTS_COMPLETE_GUIDE.md` - Full docs

---

**Status:** ✅ Ready to Test
**Last Updated:** December 9, 2025
