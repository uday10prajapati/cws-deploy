-- Drop existing problematic policies
drop policy if exists "Employees can view assigned emergency wash requests" on public.emergency_wash_requests;
drop policy if exists "Employees can update assigned emergency wash requests" on public.emergency_wash_requests;
drop policy if exists "Admin can view all emergency wash requests" on public.emergency_wash_requests;
drop policy if exists "Admin can update all emergency wash requests" on public.emergency_wash_requests;
drop policy if exists "Customers can view own emergency wash requests" on public.emergency_wash_requests;
drop policy if exists "Customers can create emergency wash requests" on public.emergency_wash_requests;
drop policy if exists "Customers can update own pending requests" on public.emergency_wash_requests;

-- Enable RLS
alter table public.emergency_wash_requests enable row level security;

-- Policy 1: Customers can view their own requests
create policy "Customers can view own requests"
  on public.emergency_wash_requests
  for select
  using (auth.uid() = user_id);

-- Policy 2: Customers can create new requests
create policy "Customers can create requests"
  on public.emergency_wash_requests
  for insert
  with check (auth.uid() = user_id);

-- Policy 3: Customers can update their own requests
create policy "Customers can update own requests"
  on public.emergency_wash_requests
  for update
  using (auth.uid() = user_id);

-- Policy 4: Admin can do everything (check role in profiles table)
create policy "Admin full access"
  on public.emergency_wash_requests
  for all
  using (
    (select role from public.profiles where id = auth.uid()) = 'admin'
  );

-- Policy 5: Employee can view all requests
create policy "Employees can view all requests"
  on public.emergency_wash_requests
  for select
  using (
    (select role from public.profiles where id = auth.uid()) = 'employee' or
    (select role from public.profiles where id = auth.uid()) = 'washer'
  );

-- Policy 6: Employee can update any request
create policy "Employees can update requests"
  on public.emergency_wash_requests
  for update
  using (
    (select role from public.profiles where id = auth.uid()) = 'employee' or
    (select role from public.profiles where id = auth.uid()) = 'washer'
  );
