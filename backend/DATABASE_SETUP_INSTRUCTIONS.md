# Database Setup Instructions

## Step 1: Create the Profiles Table

Run the SQL from `PROFILES_SCHEMA.sql` in your Supabase SQL Editor:

1. Go to Supabase Dashboard → Your Project
2. Click "SQL Editor" on the left sidebar
3. Click "New Query"
4. Copy and paste all the SQL from `backend/PROFILES_SCHEMA.sql`
5. Click "Run"

⚠️ **IMPORTANT**: This must be run BEFORE users can signup/login!

## Step 2: Create the User Approvals Table (if not already done)

Run the SQL from `USER_APPROVALS_SCHEMA.sql` in your Supabase SQL Editor:

1. Create a new query in SQL Editor
2. Copy and paste all the SQL from `backend/USER_APPROVALS_SCHEMA.sql`
3. Click "Run"

## Step 3: Verify Setup

After running both schemas:

1. Go to Supabase Dashboard → Authentication → Users
2. If you have test users, check if their profiles appear in the `profiles` table
3. If not, you may need to run the verify-otp endpoint again to create new profiles

## Troubleshooting

### Error: "Profile not found"
- Make sure the `profiles` table was created
- Check if RLS policies are correctly set
- Run the query manually: `SELECT * FROM profiles;`

### Error: "Column 'id' does not exist"
- The profiles table wasn't created, run Step 1

### Error: "400 Bad Request"
- This usually means RLS policy is blocking the query
- Verify the policies were created in Step 1

## Next Steps

After the database is set up:

1. Create a test user via the signup form
2. Verify the profile is created in the `profiles` table
3. Try logging in
4. Check the admin dashboard to approve the employee account (if applicable)
