-- Salesperson Area Assignment System - Database Schema
-- Run this in Supabase SQL Query Editor

-- ============================================
-- 1. CREATE employee_assigned_areas TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.employee_assigned_areas (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    employee_id uuid NOT NULL,
    assigned_by uuid,
    city character varying(100),
    talukas character varying(500),
    created_at timestamp without time zone DEFAULT now(),
    
    -- Constraints
    PRIMARY KEY (id),
    CONSTRAINT fk_employee FOREIGN KEY (employee_id) 
        REFERENCES public.profiles(id) ON DELETE CASCADE,
    CONSTRAINT fk_assigned_by FOREIGN KEY (assigned_by) 
        REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Comment on table
COMMENT ON TABLE public.employee_assigned_areas 
IS 'Stores area assignments to salespeople. Areas are geographic territories (city/taluka) assigned to sales employees.';

-- Comments on columns
COMMENT ON COLUMN public.employee_assigned_areas.id 
IS 'Unique identifier for the area assignment';
COMMENT ON COLUMN public.employee_assigned_areas.employee_id 
IS 'ID of the salesperson who is assigned this area (must have employee_type=sales)';
COMMENT ON COLUMN public.employee_assigned_areas.assigned_by 
IS 'ID of the employee who made this assignment (for audit trail)';
COMMENT ON COLUMN public.employee_assigned_areas.city 
IS 'City name (e.g., Ahmedabad, Surat, Vadodara)';
COMMENT ON COLUMN public.employee_assigned_areas.talukas 
IS 'Comma-separated list of talukas (e.g., "Ahmedabad,Sanand,Borsad")';
COMMENT ON COLUMN public.employee_assigned_areas.created_at 
IS 'Timestamp when this area was assigned';

-- ============================================
-- 2. CREATE INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX idx_areas_employee ON public.employee_assigned_areas USING btree (employee_id);
COMMENT ON INDEX idx_areas_employee 
IS 'Index for fast lookup of areas assigned to a specific employee';

CREATE INDEX idx_areas_city ON public.employee_assigned_areas USING btree (city);
COMMENT ON INDEX idx_areas_city 
IS 'Index for fast lookup of areas in a specific city';

CREATE INDEX idx_areas_assigned_by ON public.employee_assigned_areas USING btree (assigned_by);
COMMENT ON INDEX idx_areas_assigned_by 
IS 'Index for audit trail lookup of who assigned areas';

-- ============================================
-- 3. ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE public.employee_assigned_areas ENABLE ROW LEVEL SECURITY;

-- Allow anyone to view area assignments
CREATE POLICY "Anyone can view employee assigned areas" 
ON public.employee_assigned_areas 
FOR SELECT 
USING (true);

-- Allow anyone to create area assignments
CREATE POLICY "Anyone can create area assignments" 
ON public.employee_assigned_areas 
FOR INSERT 
WITH CHECK (true);

-- Allow anyone to delete area assignments
CREATE POLICY "Anyone can delete area assignments" 
ON public.employee_assigned_areas 
FOR DELETE 
USING (true);

-- Allow anyone to update area assignments
CREATE POLICY "Anyone can update area assignments" 
ON public.employee_assigned_areas 
FOR UPDATE 
USING (true);

-- ============================================
-- 4. VERIFY profiles TABLE STRUCTURE
-- ============================================

-- Check if profiles table has employee_type column
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;

-- If employee_type column doesn't exist, create it:
-- ALTER TABLE public.profiles 
-- ADD COLUMN IF NOT EXISTS employee_type character varying(50) DEFAULT 'general';

-- ============================================
-- 5. CREATE TEST DATA (Optional)
-- ============================================

-- Insert test salespeople
INSERT INTO public.profiles (
    id,
    email,
    name,
    phone,
    role,
    employee_type,
    city,
    taluka,
    created_at,
    updated_at
) VALUES
(
    'a1234567-89ab-cdef-0123-456789abcdef'::uuid,
    'rajesh.kumar@carwash.com',
    'Rajesh Kumar',
    '9876543210',
    'employee',
    'sales',
    'Ahmedabad',
    'Ahmedabad',
    now(),
    now()
),
(
    'b1234567-89ab-cdef-0123-456789abcdef'::uuid,
    'priya.patel@carwash.com',
    'Priya Patel',
    '9876543211',
    'employee',
    'sales',
    'Surat',
    'Surat',
    now(),
    now()
),
(
    'c1234567-89ab-cdef-0123-456789abcdef'::uuid,
    'vikram.singh@carwash.com',
    'Vikram Singh',
    '9876543212',
    'employee',
    'sales',
    'Vadodara',
    'Vadodara',
    now(),
    now()
),
(
    'd1234567-89ab-cdef-0123-456789abcdef'::uuid,
    'general.emp@carwash.com',
    'General Employee',
    '9876543213',
    'employee',
    'general',
    'Gandhinagar',
    'Gandhinagar',
    now(),
    now()
)
ON CONFLICT (id) DO NOTHING;

-- Insert test area assignments
INSERT INTO public.employee_assigned_areas (
    employee_id,
    assigned_by,
    city,
    talukas,
    created_at
) VALUES
(
    'a1234567-89ab-cdef-0123-456789abcdef'::uuid,
    'd1234567-89ab-cdef-0123-456789abcdef'::uuid,
    'Ahmedabad',
    'Ahmedabad,Sanand,Borsad,Viramgam',
    now()
),
(
    'b1234567-89ab-cdef-0123-456789abcdef'::uuid,
    'd1234567-89ab-cdef-0123-456789abcdef'::uuid,
    'Surat',
    'Surat,Palsana,Mangrol',
    now()
)
ON CONFLICT DO NOTHING;

-- ============================================
-- 6. VERIFY DATA
-- ============================================

-- Check salespeople
SELECT 
    id, 
    name, 
    email, 
    employee_type, 
    city, 
    taluka 
FROM public.profiles 
WHERE role = 'employee' 
ORDER BY created_at DESC;

-- Check area assignments
SELECT 
    id, 
    employee_id, 
    assigned_by, 
    city, 
    talukas, 
    created_at 
FROM public.employee_assigned_areas 
ORDER BY created_at DESC;

-- Check assigned areas for a specific salesperson
SELECT 
    ea.id, 
    ea.city, 
    ea.talukas, 
    p.name as assigned_by_name,
    ea.created_at 
FROM public.employee_assigned_areas ea
LEFT JOIN public.profiles p ON ea.assigned_by = p.id
WHERE ea.employee_id = 'a1234567-89ab-cdef-0123-456789abcdef'::uuid
ORDER BY ea.created_at DESC;

-- ============================================
-- 7. USEFUL QUERIES
-- ============================================

-- Get all salespeople with their assigned areas count
SELECT 
    p.id,
    p.name,
    p.email,
    p.phone,
    p.city,
    p.taluka,
    COUNT(ea.id) as areas_assigned
FROM public.profiles p
LEFT JOIN public.employee_assigned_areas ea ON p.id = ea.employee_id
WHERE p.role = 'employee' AND p.employee_type = 'sales'
GROUP BY p.id, p.name, p.email, p.phone, p.city, p.taluka
ORDER BY p.name;

-- Get all areas in a specific city
SELECT 
    ea.id,
    p.name as salesperson_name,
    ea.city,
    ea.talukas,
    admin.name as assigned_by,
    ea.created_at
FROM public.employee_assigned_areas ea
JOIN public.profiles p ON ea.employee_id = p.id
LEFT JOIN public.profiles admin ON ea.assigned_by = admin.id
WHERE ea.city = 'Ahmedabad'
ORDER BY ea.created_at DESC;

-- Get salesperson's area coverage
SELECT 
    ea.city,
    STRING_AGG(taluka, ', ') as talukas
FROM public.employee_assigned_areas ea,
     LATERAL UNNEST(STRING_TO_ARRAY(ea.talukas, ',')) taluka
WHERE ea.employee_id = 'a1234567-89ab-cdef-0123-456789abcdef'::uuid
GROUP BY ea.city
ORDER BY ea.city;

-- Check for duplicate area assignments
SELECT 
    employee_id,
    city,
    COUNT(*) as assignment_count
FROM public.employee_assigned_areas
GROUP BY employee_id, city
HAVING COUNT(*) > 1
ORDER BY assignment_count DESC;

-- ============================================
-- 8. CLEANUP PROCEDURES (Use carefully!)
-- ============================================

-- Delete all area assignments for a salesperson
-- DELETE FROM public.employee_assigned_areas
-- WHERE employee_id = 'a1234567-89ab-cdef-0123-456789abcdef'::uuid;

-- Delete a specific area assignment
-- DELETE FROM public.employee_assigned_areas
-- WHERE id = 'area-uuid';

-- Drop the table (DANGER - Data loss!)
-- DROP TABLE IF EXISTS public.employee_assigned_areas CASCADE;

-- ============================================
-- NOTES
-- ============================================
-- 1. The employee_assigned_areas table links to profiles.id
--    Make sure profiles table exists and has id column
--
-- 2. employee_type column in profiles must contain values:
--    - 'sales' for salespeople who can receive area assignments
--    - 'general' for general employees
--
-- 3. Talukas are stored as comma-separated strings in the database
--    Backend API parses them to arrays for JSON responses
--
-- 4. assigned_by field tracks audit trail of who assigned areas
--    This is important for tracking responsibility
--
-- 5. RLS policies allow anyone to view/edit areas
--    Adjust policies based on your authentication model
--
-- 6. Foreign key constraints ensure data integrity:
--    - Deleting a profile cascades to delete their area assignments
--    - Deleting assigned_by profile sets the field to NULL
--
-- 7. Indexes improve query performance for common operations:
--    - Finding areas for a specific salesperson
--    - Finding all areas in a city
--    - Finding areas assigned by a specific person
--
-- 8. Timestamps help track when areas were assigned for audit trail
--
-- ============================================
