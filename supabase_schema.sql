-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Categories
create table public.categories (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  icon text,
  sort_order int default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Products (Menu Items)
create table public.products (
  id uuid default uuid_generate_v4() primary key,
  category_id uuid references public.categories(id),
  name text not null,
  description text,
  price decimal(12,2) not null,
  image_url text,
  status text default 'available' check (status in ('available', 'cooking', 'sold_out')),
  is_available boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Inventory (Raw Materials)
create table public.inventory (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  sku text unique,
  category text,
  current_stock decimal(10,2) default 0,
  unit text,
  min_stock decimal(10,2) default 0,
  max_stock decimal(10,2),
  image_url text,
  last_updated timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Orders
create table public.orders (
  id uuid default uuid_generate_v4() primary key,
  table_no text,
  order_type text default 'dine-in' check (order_type in ('dine-in', 'take-away', 'delivery')),
  status text default 'waiting' check (status in ('waiting', 'cooking', 'ready', 'completed', 'refunded', 'cancelled')),
  guest_count int,
  subtotal decimal(12,2) default 0,
  tax decimal(12,2) default 0,
  discount decimal(12,2) default 0,
  total_amount decimal(12,2) default 0,
  payment_method text,
  payment_status text default 'pending',
  kitchen_notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Order Items
create table public.order_items (
  id uuid default uuid_generate_v4() primary key,
  order_id uuid references public.orders(id) on delete cascade,
  product_id uuid references public.products(id),
  product_name text not null, -- Snapshot name in case product changes
  quantity int not null,
  price decimal(12,2) not null, -- Snapshot price
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Realtime
alter publication supabase_realtime add table public.orders;
alter publication supabase_realtime add table public.order_items;
alter publication supabase_realtime add table public.inventory;
alter publication supabase_realtime add table public.products;

-- SEED DATA (Dummy content for demo)
insert into public.categories (name, icon, sort_order) values
('Main Course', 'utensils', 1),
('Drinks', 'coffee', 2),
('Dessert', 'ice-cream', 3);

do $$
declare
  main_id uuid;
  drink_id uuid;
  dessert_id uuid;
begin
  select id into main_id from public.categories where name = 'Main Course' limit 1;
  select id into drink_id from public.categories where name = 'Drinks' limit 1;
  select id into dessert_id from public.categories where name = 'Dessert' limit 1;

  insert into public.products (category_id, name, price, image_url, status) values
  (main_id, 'Nasi Goreng Spesial', 25000, 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=500&auto=format&fit=crop&q=60', 'available'),
  (main_id, 'Ayam Bakar Madu', 30000, 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=500&auto=format&fit=crop&q=60', 'available'),
  (drink_id, 'Es Teler Sultan', 18000, 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=500&auto=format&fit=crop&q=60', 'available'),
  (dessert_id, 'Pudding Coklat', 15000, 'https://images.unsplash.com/photo-1549405625-2b6271c77840?w=500&auto=format&fit=crop&q=60', 'cooking'),
  (drink_id, 'Es Teh Manis', 5000, 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=500&auto=format&fit=crop&q=60', 'available');
end $$;
