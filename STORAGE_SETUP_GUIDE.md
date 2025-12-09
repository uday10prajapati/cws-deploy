# Supabase Storage Setup Guide

## Issue
The `washer_documents` storage bucket doesn't exist yet in your Supabase project.

## Quick Fix (2 Minutes)

### Method 1: Using Supabase Dashboard (Easiest)

1. **Go to Supabase Dashboard**
   - Open: https://app.supabase.com
   - Login with your account
   - Select your project: `cjaufvqninknntiukxka`

2. **Navigate to Storage**
   - Left sidebar → click **Storage**
   - You'll see "Buckets" section

3. **Create New Bucket**
   - Click **Create a new bucket**
   - **Bucket name:** `washer_documents` (exactly as shown)
   - **Make it public:** Toggle the switch to ON
   - **File size limit:** 52 MB
   - Click **Create bucket**

4. **Done!** ✅
   - Your bucket is ready
   - Try uploading documents again

### Method 2: Using Node Script

```bash
cd backend
node setup-storage.js
```

## File Structure Inside Bucket

Once created, your bucket will have this structure:

```
washer_documents/
├── [washer-id]/
│   ├── aadhar/
│   │   └── 1765297645662_aadhar.pdf
│   ├── pancard/
│   │   └── 1765297645662_pan.jpg
│   ├── votercard/
│   │   └── 1765297645662_voter.jpg
│   ├── bankpassbook/
│   │   └── 1765297645662_bank.pdf
│   └── profile_pic/
│       └── 1765297645662_photo.jpg
```

## Verification

After creating the bucket, test it:

1. **As Washer:**
   - Go to `/washer/documents`
   - Try uploading a test image
   - Should succeed without errors

2. **Check Supabase:**
   - Go back to Storage
   - Click on `washer_documents` bucket
   - You should see the uploaded file there

## Bucket Settings

Your bucket should have these settings:

| Setting | Value |
|---------|-------|
| Bucket Name | `washer_documents` |
| Public | ✅ YES |
| File Size Limit | 52 MB |
| Allowed MIME Types | image/*, application/pdf |

## Troubleshooting

### Still Getting "Bucket not found"?
1. **Refresh page** - Browser cache issue
2. **Check bucket name** - Must be exactly `washer_documents` (lowercase, with underscore)
3. **Verify public access** - Toggle the public switch in Supabase
4. **Clear browser cache** - Ctrl+Shift+Delete

### Upload Still Failing?
1. **Check file size** - Must be under 50 MB
2. **Check file type** - Only images and PDF allowed
3. **Check user auth** - Must be logged in
4. **Check backend** - API at `http://localhost:5000/documents/documents/upload`

## API Security

The bucket is **PUBLIC** which means:
- ✅ Anyone can read uploaded files (good for profile pics)
- ✅ RLS policies in database control who can access records
- ✅ Backend validates user permissions

This is secure because:
- Database records track who owns each document
- Only authenticated washers can upload
- Only admins can verify documents
- Files are linked to washer_documents table

## Complete Checklist

- [ ] Created `washer_documents` bucket
- [ ] Set bucket to **Public**
- [ ] Refreshed browser
- [ ] Tested upload as washer
- [ ] File appears in Supabase Storage
- [ ] Admin can see document in dashboard

## Need Help?

If you still get errors:

1. **Check Supabase Status**
   - Go to https://status.supabase.com
   - Make sure everything is green

2. **Check Your Connection**
   - Backend running on `localhost:5000`?
   - Frontend running on `localhost:5173`?
   - Supabase URL correct in code?

3. **Check Logs**
   - Browser console (F12) for frontend errors
   - Backend terminal for API errors
   - Supabase dashboard for storage logs

---

**Status:** Setup Required
**Time to Complete:** 2 minutes
**Difficulty:** Very Easy ⭐
