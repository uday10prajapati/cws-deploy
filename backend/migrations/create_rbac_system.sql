-- Create user_role_assignments table for RBAC system
-- This table maintains the hierarchical role assignments and geographic permissions

CREATE TABLE IF NOT EXISTS user_role_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  role VARCHAR(50) NOT NULL CHECK (role IN ('general', 'sub-general', 'hr-general', 'salesman')),
  
  -- Geographic assignments
  assigned_cities TEXT[] DEFAULT NULL,  -- For General and Sub-General
  assigned_talukas TEXT[] DEFAULT NULL, -- For HR-General and Salesman
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Foreign key constraint
  CONSTRAINT fk_user_role_assignments_user_id 
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Explicit unique constraint for upsert operations
  UNIQUE(user_id)
);

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_user_role_assignments_role ON user_role_assignments(role);
CREATE INDEX IF NOT EXISTS idx_user_role_assignments_user_id ON user_role_assignments(user_id);

-- Add role hierarchy columns to profiles table if not exists
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS assigned_cities TEXT[],
ADD COLUMN IF NOT EXISTS assigned_talukas TEXT[],
ADD COLUMN IF NOT EXISTS role_hierarchy_level INT CHECK (role_hierarchy_level IN (1, 2, 3, 4));

-- Role hierarchy levels:
-- 1 = Salesman
-- 2 = HR-General
-- 3 = Sub-General
-- 4 = General

-- Create a view for easier access to user role assignments with profile data
CREATE OR REPLACE VIEW user_roles_with_profiles AS
SELECT 
  ura.id,
  ura.user_id,
  ura.role,
  ura.assigned_cities,
  ura.assigned_talukas,
  ura.created_at,
  ura.updated_at,
  p.email,
  p.name,
  p.employee_type
FROM user_role_assignments ura
LEFT JOIN profiles p ON ura.user_id = p.id;

-- Create a function to validate geographic hierarchy
CREATE OR REPLACE FUNCTION validate_geographic_assignment()
RETURNS TRIGGER AS $$
BEGIN
  -- Validate that assigned values are not null for appropriate roles
  IF NEW.role = 'general' THEN
    NEW.assigned_cities := NULL;
    NEW.assigned_talukas := NULL;
  ELSIF NEW.role = 'sub-general' THEN
    IF NEW.assigned_cities IS NULL OR array_length(NEW.assigned_cities, 1) = 0 THEN
      RAISE EXCEPTION 'Sub-General must have at least one assigned city';
    END IF;
    NEW.assigned_talukas := NULL;
  ELSIF NEW.role = 'hr-general' THEN
    IF NEW.assigned_talukas IS NULL OR array_length(NEW.assigned_talukas, 1) = 0 THEN
      RAISE EXCEPTION 'HR-General must have at least one assigned taluka';
    END IF;
  ELSIF NEW.role = 'salesman' THEN
    IF NEW.assigned_talukas IS NULL OR array_length(NEW.assigned_talukas, 1) != 1 THEN
      RAISE EXCEPTION 'Salesman must have exactly one assigned taluka';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for validation
DROP TRIGGER IF EXISTS trigger_validate_geographic_assignment ON user_role_assignments;
CREATE TRIGGER trigger_validate_geographic_assignment
BEFORE INSERT OR UPDATE ON user_role_assignments
FOR EACH ROW
EXECUTE FUNCTION validate_geographic_assignment();

-- Create audit table for tracking role changes
CREATE TABLE IF NOT EXISTS role_assignment_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  old_role VARCHAR(50),
  new_role VARCHAR(50),
  changed_by UUID,
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT fk_audit_user_id 
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE,
  CONSTRAINT fk_audit_changed_by 
    FOREIGN KEY (changed_by) REFERENCES profiles(id) ON DELETE SET NULL
);

-- Create index for audit log
CREATE INDEX IF NOT EXISTS idx_role_assignment_audit_user_id ON role_assignment_audit(user_id);
CREATE INDEX IF NOT EXISTS idx_role_assignment_audit_changed_at ON role_assignment_audit(changed_at);
