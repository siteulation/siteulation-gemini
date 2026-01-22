
-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create a table for profiles (optional, helps with username storage if not in metadata)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique,
  updated_at timestamp with time zone,
  is_banned boolean default false
);

-- Create a table for the 'Carts' (Projects)
create table public.carts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) not null,
  username text, -- Stored denormalized for easier fetching
  name text, -- Custom name for the website
  prompt text not null,
  model text not null,
  code text not null,
  views integer default 0,
  is_listed boolean default false, -- Controls public feed visibility
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.carts enable row level security;

-- Policies for Carts
-- Everyone can read carts (even unlisted ones if they have the ID, but api filters feed)
create policy "Carts are public" on public.carts
  for select using (true);

-- Authenticated users can insert their own carts
create policy "Users can insert own carts" on public.carts
  for insert with check (auth.uid() = user_id);
  
-- Allow users to update their own carts (e.g., for renaming or listing)
create policy "Users can update own carts" on public.carts
  for update using (auth.uid() = user_id);

-- Allow the service role (backend) to update views, or create specific policy
-- For simplicity, we rely on the backend using the Service Role Key which bypasses RLS for updates

-- Policies for Profiles
create policy "Public profiles are viewable by everyone" on public.profiles
  for select using (true);

create policy "Users can insert their own profile" on public.profiles
  for insert with check (auth.uid() = id);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- Function to handle new user signup (Trigger)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username)
  values (new.id, new.raw_user_meta_data->>'username');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger
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
