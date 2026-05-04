-- 1. EXTENSIONS
create extension if not exists "uuid-ossp";

-- 2. PROFILES TABLE
-- This stores user-specific data like credits and banned status.
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique,
  avatar_url text,
  updated_at timestamp with time zone,
  is_banned boolean default false,
  credits integer default 15,
  last_reset_date date default CURRENT_DATE,
  created_at timestamp with time zone default now()
);

-- Ensure columns exist if table was already created
do $$ 
begin 
  if not exists (select 1 from information_schema.columns where table_name='profiles' and column_name='avatar_url') then
    alter table public.profiles add column avatar_url text;
  end if;
  if not exists (select 1 from information_schema.columns where table_name='profiles' and column_name='created_at') then
    alter table public.profiles add column created_at timestamp with time zone default now();
  end if;
end $$;

-- 3. CARTS TABLE
-- This stores the generated applications/games.
create table if not exists public.carts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  username text, -- Denormalized for speed
  name text,
  prompt text not null,
  model text not null,
  code text not null,
  views integer default 0,
  is_listed boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. CREDIT REQUESTS TABLE
-- For the donation/credit system.
create table if not exists public.credit_requests (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  username text,
  cashtag text not null,
  amount_usd numeric not null,
  credits_requested integer not null,
  status text default 'pending', -- 'pending', 'approved', 'denied'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. ENABLE RLS
alter table public.profiles enable row level security;
alter table public.carts enable row level security;
alter table public.credit_requests enable row level security;

-- 6. POLICIES (Idempotent)

-- Profiles Policies
drop policy if exists "Public profiles are viewable by everyone" on public.profiles;
create policy "Public profiles are viewable by everyone" on public.profiles for select using (true);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile" on public.profiles for insert with check (auth.uid() = id);

-- Carts Policies
drop policy if exists "Carts are public" on public.carts;
create policy "Carts are public" on public.carts for select using (is_listed = true OR auth.uid() = user_id);

drop policy if exists "Users can insert own carts" on public.carts;
create policy "Users can insert own carts" on public.carts for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update own carts" on public.carts;
create policy "Users can update own carts" on public.carts for update using (auth.uid() = user_id);

drop policy if exists "Admins can delete any cart" on public.carts;
create policy "Admins can delete any cart" on public.carts for delete using (
    exists (
        select 1 from public.profiles 
        where id = auth.uid() and username = 'homelessman'
    )
);

-- Credit Requests Policies
drop policy if exists "Users can view own requests" on public.credit_requests;
create policy "Users can view own requests" on public.credit_requests for select using (auth.uid() = user_id);

drop policy if exists "Users can insert own requests" on public.credit_requests;
create policy "Users can insert own requests" on public.credit_requests for insert with check (auth.uid() = user_id);

-- 7. TRIGGERS & FUNCTIONS

-- Handle new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, credits, last_reset_date)
  values (
    new.id, 
    coalesce(new.raw_user_meta_data->>'username', 'user_' || substr(new.id::text, 1, 8)), 
    15, 
    current_date
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- RPC Function to increment views safely
create or replace function increment_cart_views(row_id uuid)
returns void as $$
begin
  update public.carts
  set views = views + 1
  where id = row_id;
end;
$$ language plpgsql security definer;
