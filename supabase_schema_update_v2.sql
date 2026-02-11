  -- 6. Product Ingredients (Recipes)
  create table if not exists public.product_ingredients (
    id uuid default uuid_generate_v4() primary key,
    product_id uuid references public.products(id) on delete cascade,
    inventory_id uuid references public.inventory(id) on delete cascade,
    quantity_required decimal(10,4) not null,
    unit text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
  );

  -- Ensure unique ingredients per product to avoid duplicates on re-seed
  create unique index if not exists idx_product_ingredients_unique 
  on public.product_ingredients(product_id, inventory_id);

  -- Seed Data for Recipes
  do $$
  declare
    nasigoreng_id uuid;
    tehmanis_id uuid;
    beras_id uuid;
    telur_id uuid;
    teh_id uuid;
    gula_id uuid;
  begin
    -- Get Products
    select id into nasigoreng_id from public.products where name = 'Nasi Goreng Spesial' limit 1;
    select id into tehmanis_id from public.products where name = 'Es Teh Manis' limit 1;

    -- Create/Get Inventory Items if not exist (for demo purposes we assume they might not exist yet from previous seed, 
    -- or we insert them now if we didn't before. 
    -- NOTE: The previous script created specific items. Let's make sure we have basic ingredients.)
    
    -- Insert Ingredients if not exist
    insert into public.inventory (name, sku, category, unit, current_stock, min_stock)
    values 
    ('Beras Premium', 'ING-001', 'Dry Goods', 'kg', 50, 10),
    ('Telur Ayam', 'ING-002', 'Fresh', 'butir', 100, 20),
    ('Teh Celup', 'ING-003', 'Dry Goods', 'pcs', 200, 50),
    ('Gula Pasir', 'ING-004', 'Dry Goods', 'kg', 30, 5)
    on conflict (sku) do nothing;

    -- Get IDs
    select id into beras_id from public.inventory where sku = 'ING-001';
    select id into telur_id from public.inventory where sku = 'ING-002';
    select id into teh_id from public.inventory where sku = 'ING-003';
    select id into gula_id from public.inventory where sku = 'ING-004';

    -- Link Recipes
    -- Nasi Goreng = 0.2kg Beras + 1 Telur
    if nasigoreng_id is not null then
      insert into public.product_ingredients (product_id, inventory_id, quantity_required, unit) values
      (nasigoreng_id, beras_id, 0.2, 'kg'),
      (nasigoreng_id, telur_id, 1, 'butir')
      on conflict (product_id, inventory_id) do nothing;
    end if;

    -- Es Teh Manis = 1 Teh Celup + 0.02kg Gula
    if tehmanis_id is not null then
      insert into public.product_ingredients (product_id, inventory_id, quantity_required, unit) values
      (tehmanis_id, teh_id, 1, 'pcs'),
      (tehmanis_id, gula_id, 0.02, 'kg')
      on conflict (product_id, inventory_id) do nothing;
    end if;

  end $$;


  -- 7. Analytics Helper (Simple Daily View)
  create or replace view daily_sales_stats as
  select
    count(*) as total_orders,
    sum(total_amount) as total_revenue,
    sum(case when status = 'completed' then 1 else 0 end) as completed_orders,
    sum(case when status = 'cancelled' then 1 else 0 end) as cancelled_orders
  from orders
  where date(created_at AT TIME ZONE 'Asia/Jakarta') = date(now() AT TIME ZONE 'Asia/Jakarta');
