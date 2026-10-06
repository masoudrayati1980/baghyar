create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;


create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'manager' check (role in ('owner','manager','irrigation','worker','viewer')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.orchards (
  id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null, area_hectare numeric(12,3), location text, latitude double precision, longitude double precision,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.plots (
  id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  orchard_id uuid not null references public.orchards(id) on delete restrict, parent_plot_id uuid references public.plots(id) on delete set null,
  code text not null, name text, area_hectare numeric(12,3), crop text, variety text, base_name text, planting_year int,
  active boolean not null default true, status text not null default 'active', created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.plot_relations (
  id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  from_plot_id uuid not null references public.plots(id) on delete cascade, to_plot_id uuid not null references public.plots(id) on delete cascade,
  relation_type text not null check (relation_type in ('split','merge','rename','rezone')), effective_at timestamptz not null default now(), notes text
);

create table if not exists public.trees (
  id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  plot_id uuid references public.plots(id) on delete set null, row_no text, tree_no text, unique_code text not null, crop text, variety text, rootstock text,
  planting_year int, status text not null default 'healthy', health_status text, latitude double precision, longitude double precision, photo_url text, notes text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(user_id, unique_code)
);

create table if not exists public.water_sources (
  id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null, source_type text not null, flow_m3h numeric(12,3), status text not null default 'active', notes text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.water_pools (
  id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null, capacity_m3 numeric(14,3) not null default 0, current_volume_m3 numeric(14,3) not null default 0,
  min_volume_m3 numeric(14,3) not null default 0, max_volume_m3 numeric(14,3), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.water_transactions (
  id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  pool_id uuid references public.water_pools(id) on delete set null, source_id uuid references public.water_sources(id) on delete set null, plot_id uuid references public.plots(id) on delete set null,
  transaction_type text not null check (transaction_type in ('in','out','adjustment')), quantity_m3 numeric(14,3) not null, duration_min int,
  cost numeric(14,2) not null default 0, transaction_date date not null default current_date, notes text, created_at timestamptz not null default now()
);

create table if not exists public.operations (
  id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  operation_type text not null, operation_date date not null default current_date, plot_id uuid references public.plots(id) on delete set null, tree_id uuid references public.trees(id) on delete set null,
  quantity numeric(14,3), unit text, material_name text, cost numeric(14,2) not null default 0, labor_hours numeric(10,2), performer text, notes text, photo_url text,
  planned boolean not null default false, planned_for date, created_at timestamptz not null default now()
);

create table if not exists public.harvests (
  id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  harvest_date date not null default current_date, plot_id uuid references public.plots(id) on delete set null, tree_id uuid references public.trees(id) on delete set null,
  crop text, variety text, quantity_kg numeric(14,3) not null default 0, grade text, destination text, sale_amount numeric(14,2), notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  expense_date date not null default current_date, category text not null, amount numeric(14,2) not null default 0, plot_id uuid references public.plots(id) on delete set null,
  description text, supplier text, invoice_no text, created_at timestamptz not null default now()
);

create table if not exists public.inventory_items (
  id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null, category text not null, unit text not null, quantity numeric(14,3) not null default 0, min_quantity numeric(14,3) not null default 0,
  unit_price numeric(14,2), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.inventory_transactions (
  id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  item_id uuid not null references public.inventory_items(id) on delete cascade, transaction_type text not null check (transaction_type in ('in','out','adjustment')),
  quantity numeric(14,3) not null, unit_price numeric(14,2), transaction_date date not null default current_date, reference text, notes text, created_at timestamptz not null default now()
);

create table if not exists public.employees (
  id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null, role text, phone text, daily_wage numeric(14,2), active boolean not null default true, created_at timestamptz not null default now()
);

create table if not exists public.equipment (
  id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null, equipment_type text, code text, status text default 'active', hours numeric(12,2) default 0, notes text, created_at timestamptz not null default now()
);

create table if not exists public.pest_observations (
  id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  plot_id uuid references public.plots(id) on delete set null, tree_id uuid references public.trees(id) on delete set null, observation_date date not null default current_date,
  pest_name text, disease_name text, severity text, affected_count int, photo_url text, action_taken text, result text, notes text, created_at timestamptz not null default now()
);

create table if not exists public.weather_observations (
  id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  observed_at timestamptz not null default now(), temperature_c numeric(6,2), rainfall_mm numeric(8,2), humidity_pct numeric(6,2), wind_kmh numeric(8,2), frost boolean default false, heat_stress boolean default false, notes text
);

create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  table_name text not null, record_id uuid, action text not null, old_data jsonb, new_data jsonb, created_at timestamptz not null default now()
);

create index if not exists plots_user_orchard_idx on public.plots(user_id, orchard_id);
create index if not exists plots_user_active_idx on public.plots(user_id, active);
create index if not exists trees_user_plot_idx on public.trees(user_id, plot_id);
create index if not exists operations_user_date_idx on public.operations(user_id, operation_date desc);
create index if not exists water_tx_user_date_idx on public.water_transactions(user_id, transaction_date desc);
create index if not exists harvest_user_date_idx on public.harvests(user_id, harvest_date desc);
create index if not exists expenses_user_date_idx on public.expenses(user_id, expense_date desc);

-- Automatic timestamps.
drop trigger if exists trg_orchards_updated on public.orchards;
create trigger trg_orchards_updated before update on public.orchards for each row execute function public.set_updated_at();
drop trigger if exists trg_plots_updated on public.plots;
create trigger trg_plots_updated before update on public.plots for each row execute function public.set_updated_at();
drop trigger if exists trg_pools_updated on public.water_pools;
create trigger trg_pools_updated before update on public.water_pools for each row execute function public.set_updated_at();
drop trigger if exists trg_inventory_updated on public.inventory_items;
create trigger trg_inventory_updated before update on public.inventory_items for each row execute function public.set_updated_at();

-- Generic RLS helper policy pattern: each row belongs to the authenticated user.
do $$
declare t text;
begin
  foreach t in array array['profiles','orchards','plots','plot_relations','trees','water_sources','water_pools','water_transactions','operations','harvests','expenses','inventory_items','inventory_transactions','employees','equipment','pest_observations','weather_observations','audit_log']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "user_select_%I" on public.%I', t, t);
    execute format('drop policy if exists "user_insert_%I" on public.%I', t, t);
    execute format('drop policy if exists "user_update_%I" on public.%I', t, t);
    execute format('drop policy if exists "user_delete_%I" on public.%I', t, t);
    execute format('create policy "user_select_%I" on public.%I for select using (auth.uid() = user_id)', t, t);
    execute format('create policy "user_insert_%I" on public.%I for insert with check (auth.uid() = user_id)', t, t);
    execute format('create policy "user_update_%I" on public.%I for update using (auth.uid() = user_id) with check (auth.uid() = user_id)', t, t);
    execute format('create policy "user_delete_%I" on public.%I for delete using (auth.uid() = user_id)', t, t);
  end loop;
end $$;
