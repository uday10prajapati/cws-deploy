-- Assign bookings with ratings to first user (employee)
UPDATE bookings 
SET assigned_to = 'aad7ca5b-8ecf-4f75-8660-aeb7ae2976ec'
WHERE rating > 0 
AND assigned_to IS NULL;

-- Verify the update
SELECT id, rating, assigned_to FROM bookings WHERE rating > 0;
