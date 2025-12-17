-- Add missing columns to emergency_wash_requests table

-- Add assigned_to column
alter table public.emergency_wash_requests
add column if not exists assigned_to uuid;

-- Add foreign key for assigned_to
alter table public.emergency_wash_requests
add constraint emergency_wash_requests_assigned_to_fkey 
foreign key (assigned_to) references auth.users (id) on delete set null;

-- Add updated_at column
alter table public.emergency_wash_requests
add column if not exists updated_at timestamp with time zone;

-- Add completed_at column
alter table public.emergency_wash_requests
add column if not exists completed_at timestamp with time zone;

-- Create indexes for better query performance
create index if not exists emergency_wash_requests_assigned_to_idx on public.emergency_wash_requests (assigned_to);
create index if not exists emergency_wash_requests_status_idx on public.emergency_wash_requests (status);
create index if not exists emergency_wash_requests_created_at_idx on public.emergency_wash_requests (created_at);
