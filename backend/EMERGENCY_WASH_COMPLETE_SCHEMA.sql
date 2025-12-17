-- Create emergency_wash_requests table
create table if not exists public.emergency_wash_requests (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  car_id uuid null,
  car_plate text null,
  car_model text null,
  address text not null,
  description text null,
  status text null default 'Pending'::text,
  created_at timestamp with time zone not null default timezone ('utc'::text, now()),
  updated_at timestamp with time zone,
  completed_at timestamp with time zone,
  assigned_to uuid null,
  before_img_1 text null,
  before_img_2 text null,
  before_img_3 text null,
  before_img_4 text null,
  after_img_1 text null,
  after_img_2 text null,
  after_img_3 text null,
  after_img_4 text null,
  constraint emergency_wash_requests_pkey primary key (id),
  constraint emergency_wash_requests_car_id_fkey foreign key (car_id) references public.cars (id) on delete set null,
  constraint emergency_wash_requests_user_id_fkey foreign key (user_id) references auth.users (id) on delete cascade,
  constraint emergency_wash_requests_assigned_to_fkey foreign key (assigned_to) references auth.users (id) on delete set null
) tablespace pg_default;

-- Create indexes for performance
create index if not exists emergency_wash_requests_user_id_idx on public.emergency_wash_requests (user_id);
create index if not exists emergency_wash_requests_assigned_to_idx on public.emergency_wash_requests (assigned_to);
create index if not exists emergency_wash_requests_status_idx on public.emergency_wash_requests (status);
create index if not exists emergency_wash_requests_created_at_idx on public.emergency_wash_requests (created_at);

-- Enable RLS
alter table public.emergency_wash_requests enable row level security;

-- RLS Policy: Customers can view their own requests
create policy "Customers can view own emergency wash requests"
  on public.emergency_wash_requests
  for select
  using (auth.uid() = user_id);

-- RLS Policy: Customers can create their own requests
create policy "Customers can create emergency wash requests"
  on public.emergency_wash_requests
  for insert
  with check (auth.uid() = user_id);

-- RLS Policy: Customers can update their own pending requests
create policy "Customers can update own pending requests"
  on public.emergency_wash_requests
  for update
  using (auth.uid() = user_id AND status = 'Pending');

-- RLS Policy: Admin can view all requests
create policy "Admin can view all emergency wash requests"
  on public.emergency_wash_requests
  for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

-- RLS Policy: Admin can update any request
create policy "Admin can update all emergency wash requests"
  on public.emergency_wash_requests
  for update
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

-- RLS Policy: Employees can view assigned requests
create policy "Employees can view assigned emergency wash requests"
  on public.emergency_wash_requests
  for select
  using (
    assigned_to = auth.uid() OR
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

-- RLS Policy: Employees can update assigned requests
create policy "Employees can update assigned emergency wash requests"
  on public.emergency_wash_requests
  for update
  using (
    assigned_to = auth.uid() OR
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

-- Create storage bucket for emergency wash images
insert into storage.buckets (id, name, public)
values ('emergency-wash-images', 'emergency-wash-images', true)
on conflict (id) do nothing;

-- Allow public to read images
create policy "Public can read emergency wash images"
  on storage.objects
  for select
  using (bucket_id = 'emergency-wash-images');

-- Allow authenticated users to upload images
create policy "Authenticated users can upload emergency wash images"
  on storage.objects
  for insert
  with check (bucket_id = 'emergency-wash-images' AND auth.role() = 'authenticated');

-- Allow users to update their own uploads
create policy "Users can update emergency wash images"
  on storage.objects
  for update
  using (bucket_id = 'emergency-wash-images' AND auth.role() = 'authenticated');
