# Washer Document Upload & Verification System

## Overview

Complete document verification system for washers with unique profile codes and admin verification dashboard.

## Features

### For Washers
✅ Upload required documents (Aadhar, Pan/Voter, Bank, Photo)
✅ Automatic profile code generation (format: WD + timestamp + random)
✅ Track verification status in real-time
✅ View admin notes on rejected documents
✅ Re-upload documents as needed
✅ Accessible from sidebar menu

### For Admins
✅ List all washers with verification status
✅ View detailed documents for each washer
✅ Approve/Reject documents with notes
✅ Search by name, email, or profile code
✅ Filter by completion status
✅ View document images/PDFs in detail
✅ Track verification timestamps
✅ Send notifications to washers

## Database Schema

### Tables

#### `washer_documents`
```sql
- id: UUID (PK)
- washer_id: UUID (FK → profiles)
- document_type: VARCHAR(50) [aadhar, pancard, votercard, bankpassbook, profile_pic]
- document_url: TEXT
- uploaded_at: TIMESTAMP
- verified: BOOLEAN
- verified_by: UUID (FK → profiles)
- verified_at: TIMESTAMP
- notes: TEXT
- UNIQUE(washer_id, document_type)
```

#### `washer_profile_codes`
```sql
- id: UUID (PK)
- washer_id: UUID (FK → profiles)
- profile_code: VARCHAR(20) UNIQUE
- documents_complete: BOOLEAN
- aadhar_verified: BOOLEAN
- identity_verified: BOOLEAN
- bank_verified: BOOLEAN
- profile_pic_uploaded: BOOLEAN
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

### Indexes
- `idx_washer_documents_washer_id`
- `idx_washer_documents_type`
- `idx_washer_documents_verified`
- `idx_washer_profile_codes_washer_id`
- `idx_washer_profile_codes_code`
- `idx_washer_profile_codes_complete`

### RLS Policies
- Washers can view and upload own documents
- Admins can view all documents and verify
- Profile codes visible to own washer and admins
- Notifications go to washer on verification

## Backend Routes

### Document Management

#### GET `/documents/documents/:washer_id`
**Purpose:** Fetch washer's documents
**Auth:** Washer or Admin
**Response:**
```json
{
  "success": true,
  "documents": [
    {
      "id": "uuid",
      "washer_id": "uuid",
      "document_type": "aadhar",
      "document_url": "https://...",
      "uploaded_at": "2025-12-09T...",
      "verified": false,
      "verified_by": null,
      "verified_at": null,
      "notes": null
    }
  ]
}
```

#### GET `/documents/profile-code/:washer_id`
**Purpose:** Get or create washer's profile code
**Auth:** Washer or Admin
**Response:**
```json
{
  "success": true,
  "profileCode": {
    "id": "uuid",
    "washer_id": "uuid",
    "profile_code": "WD093025AB12",
    "documents_complete": false,
    "aadhar_verified": false,
    "identity_verified": false,
    "bank_verified": false,
    "profile_pic_uploaded": false,
    "created_at": "...",
    "updated_at": "..."
  }
}
```

#### POST `/documents/documents/upload`
**Purpose:** Upload document to storage and create record
**Auth:** Washer
**Body:**
```json
{
  "washer_id": "uuid",
  "document_type": "aadhar",
  "document_url": "https://storage.url/file.jpg"
}
```
**Response:**
```json
{
  "success": true,
  "message": "Document uploaded successfully",
  "document": { ... }
}
```

#### DELETE `/documents/documents/:document_id`
**Purpose:** Delete document
**Auth:** Washer or Admin
**Response:**
```json
{
  "success": true,
  "message": "Document deleted successfully"
}
```

### Admin Routes

#### GET `/documents/admin/all-documents`
**Purpose:** Get all washers' documents
**Auth:** Admin only
**Response:** Array of documents with washer profile

#### GET `/documents/admin/documents/:washer_id`
**Purpose:** Get specific washer's documents with profile info
**Auth:** Admin only
**Response:**
```json
{
  "success": true,
  "documents": [...],
  "profileCode": {...},
  "washerProfile": {...}
}
```

#### POST `/documents/admin/verify-document`
**Purpose:** Verify or reject document
**Auth:** Admin only
**Body:**
```json
{
  "document_id": "uuid",
  "verified": true,
  "notes": "Clear image, all details visible",
  "admin_id": "uuid"
}
```
**Response:**
```json
{
  "success": true,
  "message": "Document verification updated",
  "document": {...}
}
```

#### GET `/documents/admin/profile-codes`
**Purpose:** Get all washer profile codes with status
**Auth:** Admin only
**Response:** Array of profile codes with completion status

## Frontend Components

### WasherDocumentUpload.jsx
**Route:** `/washer/documents`
**Props:** None (uses auth context)

**Features:**
- Display washer's profile code (copyable)
- 4-step progress indicator (Aadhar, Identity, Bank, Photo)
- 5 document upload cards with drag-and-drop
- Upload to Supabase Storage
- Status badges (Verified, Pending, Required)
- View uploaded documents
- Responsive design (mobile, tablet, desktop)

**State:**
```javascript
{
  user: { id, email, ... },
  documents: [...],
  profileCode: { ... },
  uploading: { [docType]: boolean },
  loading: boolean,
  copied: boolean
}
```

**Document Types:**
```javascript
[
  { id: 'aadhar', label: 'Aadhar Card', required: true },
  { id: 'pancard', label: 'PAN Card', required: false },
  { id: 'votercard', label: 'Voter Card', required: false },
  { id: 'bankpassbook', label: 'Bank Passbook', required: true },
  { id: 'profile_pic', label: 'Profile Picture', required: true }
]
```

### AdminDocumentVerification.jsx
**Route:** Integrated in AdminDashboard (menu item: "Washer Documents")

**Features:**
- List view with search and filters
- Search by name, email, profile code
- Filter by status (All, Verified, Pending)
- Click to view detailed documents
- Document preview (image or PDF)
- Approve/Reject buttons
- Admin notes textarea
- Status badges and icons
- 4-point status indicator per washer

**Modes:**
1. **List View**: All washers with summary status
2. **Detail View**: Individual washer's documents

## Storage Setup

### Supabase Storage Bucket

1. Create bucket: `washer_documents`
2. Enable public access
3. File structure:
   ```
   washer_documents/
   ├── {washer_id}/
   │   ├── aadhar/
   │   │   └── timestamp_filename
   │   ├── pancard/
   │   │   └── timestamp_filename
   │   ├── votercard/
   │   │   └── timestamp_filename
   │   ├── bankpassbook/
   │   │   └── timestamp_filename
   │   └── profile_pic/
   │       └── timestamp_filename
   ```

## Integration Steps

### 1. Database Setup
```bash
# Run in Supabase SQL Editor
psql-command < WASHER_DOCUMENTS_SCHEMA.sql
```

### 2. Backend Integration
```javascript
// server.js
import washerDocumentsRoutes from "./routes/washerDocumentsRoutes.js";
app.use("/documents", washerDocumentsRoutes);
```

### 3. Frontend Integration
```javascript
// App.jsx
import WasherDocumentUpload from "./Washer/WasherDocumentUpload.jsx";
<Route path="/washer/documents" element={<WasherDocumentUpload />} />
```

### 4. Menu Integration
```javascript
// Washer Dashboard (CarWash.jsx)
{ name: "Documents", icon: <span>📄</span>, link: "/washer/documents" }

// Admin Dashboard (AdminDashboard.jsx)
{ name: "Washer Documents", icon: <FiClipboard />, link: null, id: "washer-documents" }
```

## Verification Flow

```
Washer Uploads Document
        ↓
API stores in Supabase Storage
        ↓
Creates washer_documents record
        ↓
Auto-notification to Admin
        ↓
Admin Reviews in Dashboard
        ↓
Admin Approves/Rejects with Notes
        ↓
Auto-notification to Washer
        ↓
If Rejected: Washer can re-upload
If Approved: Status updated
        ↓
When all required docs verified → Profile Complete ✓
```

## Completion Requirements

All 3 conditions must be met:

1. **Aadhar Verified** ✓
2. **Identity Verified** ✓ (Pan OR Voter, both verified)
3. **Bank Verified** ✓
4. **Profile Pic Uploaded** ✓

When all complete: `documents_complete = true` and profile code marked as complete.

## Profile Code Format

```
WD[Last 6 digits of timestamp][4 Random Alphanumeric]

Example: WD093025AB12
  - WD = Washer Documents prefix
  - 093025 = Last 6 digits of timestamp
  - AB12 = Random alphanumeric
```

## Notifications

### To Washer
- `document_uploaded`: Sent when admin reviews
- `document_verified`: Sent when document approved/rejected

### To Admin
- `document_uploaded`: When washer uploads document

## API Error Handling

All endpoints return:
```json
{
  "success": false,
  "error": "Error message here"
}
```

Common errors:
- `Missing required fields`
- `Invalid document type`
- `Unauthorized access`
- `Document not found`

## Testing

### Test as Washer
1. Navigate to `/washer/documents`
2. Copy profile code
3. Upload Aadhar (required)
4. Upload PAN or Voter ID (one required)
5. Upload Bank Passbook (required)
6. Upload Profile Picture (required)
7. Verify all show "Pending Review"

### Test as Admin
1. Go to Admin Dashboard
2. Click "Washer Documents"
3. Search washer by name/code
4. Click to view documents
5. Review each document
6. Add notes (optional)
7. Click Approve/Reject
8. Verify washer receives notification

## Troubleshooting

### Documents not uploading
- Check Supabase Storage bucket exists
- Verify bucket is public
- Check RLS policies allow inserts
- Verify auth token is valid

### Admin can't see documents
- Ensure user has admin role
- Check RLS policies for admin access
- Verify washer_id is valid UUID

### Notifications not sending
- Verify notifications table exists
- Check admin user exists in profiles
- Verify notification type matches listener

### Profile code not generating
- Check washer_profile_codes table exists
- Verify timestamps are valid
- Check random generation logic

## Performance Considerations

### Indexes
- Washer ID indexed (common query)
- Verification status indexed (filtering)
- Document type indexed (grouping)
- Profile code indexed (search)

### Optimization Tips
1. Paginate washer list in admin view
2. Lazy load document previews
3. Cache profile codes client-side
4. Compress images before upload
5. Use CDN for storage URLs

## Future Enhancements

1. **Document Templates**: Admin-defined required docs
2. **Batch Verification**: Approve multiple docs at once
3. **Audit Trail**: Track all verification actions
4. **Expiration**: Require re-verification annually
5. **Document OCR**: Auto-extract and validate info
6. **Biometric**: Facial recognition on profile pic
7. **Email Integration**: Send verification links
8. **Mobile App**: Native camera upload

## Security Considerations

✅ RLS policies enforced for data access
✅ Washer can only upload own documents
✅ Admin can verify and manage all
✅ Storage URLs are signed (if private)
✅ Notifications contain only necessary info
✅ No sensitive data logged
✅ Verification trail maintained

---

**Last Updated:** December 9, 2025
**Version:** 1.0
**Status:** Production Ready
