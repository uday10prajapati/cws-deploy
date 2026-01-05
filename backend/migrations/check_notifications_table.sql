-- Check current notifications table structure
-- Run this in Supabase SQL Editor to see what columns exist

SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'notifications'
ORDER BY ordinal_position;

-- If the above shows the structure, you can see which columns are available
-- Based on the errors, these columns seem to NOT exist:
-- - is_read
-- - reference_id

-- If you need to add columns, use this:
-- ALTER TABLE notifications ADD COLUMN reference_id uuid;
-- ALTER TABLE notifications ADD COLUMN is_read boolean DEFAULT false;
