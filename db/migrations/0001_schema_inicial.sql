-- Migration 0001: schema inicial do ALIMENTA (PostgreSQL simples)
-- Tabelas criadas na ordem correta de dependências (sem FKs circulares).

create extension if not exists pgcrypto;

-- 1. perfis
create table profiles (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  full_name text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. funções
create table roles (
  id uuid primary key default gen_random_uuid(),
  code text unique not null check (code in ('admin', 'operator', 'social_worker')),
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. user_roles
create table user_roles (
  user_id uuid references profiles(id) on delete cascade,
  role_id uuid references roles(id) on delete cascade,
  primary key (user_id, role_id),
  created_at timestamptz not null default now()
);

-- 4. doadores
create table donors (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  donor_type text,
  email text,
  phone text,
  address text,
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 5. categorias
create table categories (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 6. produtos (depende de categories)
create table products (
  id uuid primary key default gen_random_uuid(),
  sku text unique not null,
  name text not null,
  category_id uuid references categories(id) on delete restrict,
  default_unit text not null,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 7. armazéns
create table warehouses (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  address text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 8. localizações (depende de warehouses)
create table storage_locations (
  id uuid primary key default gen_random_uuid(),
  warehouse_id uuid references warehouses(id) on delete restrict,
  code text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (warehouse_id, code)
);

-- 9. doações (depende de donors, profiles)
create table donations (
  id uuid primary key default gen_random_uuid(),
  reference text unique not null,
  donor_id uuid references donors(id) on delete restrict,
  received_at timestamptz not null,
  status text not null check (status in ('pending', 'under_inspection', 'partially_accepted', 'accepted', 'rejected')) default 'pending',
  received_by uuid references profiles(id),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 10. donation_items (depende de donations, products)
create table donation_items (
  id uuid primary key default gen_random_uuid(),
  donation_id uuid references donations(id) on delete cascade,
  product_id uuid references products(id) on delete restrict,
  quantity_received numeric(12,3) not null check (quantity_received >= 0),
  quantity_accepted numeric(12,3) not null default 0 check (quantity_accepted >= 0),
  quantity_rejected numeric(12,3) not null default 0 check (quantity_rejected >= 0),
  unit_code text not null,
  supplier_batch_code text,
  expiry_date date,
  expiry_type text check (expiry_type in ('use_by', 'best_before', 'none')),
  inspection_status text,
  inspection_notes text,
  created_at timestamptz not null default now(),
  constraint quantidade_consistente check (quantity_accepted + quantity_rejected <= quantity_received)
);

-- 11. batches (depende de products, donation_items, warehouses, storage_locations)
create table batches (
  id uuid primary key default gen_random_uuid(),
  internal_code text unique not null,
  product_id uuid references products(id) on delete restrict,
  donation_item_id uuid references donation_items(id) on delete restrict,
  supplier_batch_code text,
  warehouse_id uuid references warehouses(id) on delete restrict,
  storage_location_id uuid references storage_locations(id) on delete restrict,
  received_at timestamptz not null,
  expiry_date date,
  expiry_type text check (expiry_type in ('use_by', 'best_before', 'none')),
  initial_quantity numeric(12,3) not null check (initial_quantity >= 0),
  on_hand_quantity numeric(12,3) not null default 0 check (on_hand_quantity >= 0),
  reserved_quantity numeric(12,3) not null default 0 check (reserved_quantity >= 0),
  available_quantity numeric(12,3) not null default 0 check (available_quantity >= 0),
  unit_code text not null,
  status text not null check (status in ('available', 'reserved', 'blocked', 'expired', 'depleted', 'disposed')) default 'available',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint saldo_coerente check (on_hand_quantity >= reserved_quantity),
  constraint disponivel_igual_saldo_menos_reserva check (available_quantity = on_hand_quantity - reserved_quantity)
);

-- 12. batch_inspections (depende de batches, profiles)
create table batch_inspections (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid references batches(id) on delete cascade,
  inspected_by uuid references profiles(id),
  inspected_at timestamptz,
  condition text,
  packaging_ok boolean,
  storage_ok boolean,
  decision text,
  notes text,
  created_at timestamptz not null default now()
);

-- 13. stock_movements (depende de batches, profiles)
create table stock_movements (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid references batches(id) on delete restrict,
  movement_type text not null check (movement_type in ('receipt', 'distribution', 'disposal', 'adjustment_in', 'adjustment_out', 'reservation_release')),
  quantity numeric(12,3) not null check (quantity >= 0),
  unit_code text not null,
  source_type text,
  source_id uuid,
  reason text,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

-- 14. households
create table households (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  household_size integer check (household_size > 0),
  parish text,
  status text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 15. beneficiaries (depende de households)
create table beneficiaries (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  household_id uuid references households(id) on delete restrict,
  full_name text,
  phone text,
  email text,
  is_primary_contact boolean not null default false,
  status text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 16. beneficiary_needs (depende de beneficiaries)
create table beneficiary_needs (
  id uuid primary key default gen_random_uuid(),
  beneficiary_id uuid references beneficiaries(id) on delete cascade,
  need_type text,
  value text,
  notes text,
  created_at timestamptz not null default now()
);

-- 17. distributions (depende de households, profiles)
create table distributions (
  id uuid primary key default gen_random_uuid(),
  reference text unique not null,
  household_id uuid references households(id) on delete restrict,
  status text not null check (status in ('draft', 'preparing', 'reserved', 'delivered', 'cancelled')) default 'draft',
  scheduled_at timestamptz,
  delivered_at timestamptz,
  created_by uuid references profiles(id),
  delivered_by uuid references profiles(id),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 18. distribution_items (depende de distributions, products)
create table distribution_items (
  id uuid primary key default gen_random_uuid(),
  distribution_id uuid references distributions(id) on delete cascade,
  product_id uuid references products(id) on delete restrict,
  quantity_requested numeric(12,3),
  quantity_reserved numeric(12,3) not null default 0,
  unit_code text,
  created_at timestamptz not null default now()
);

-- 19. stock_reservations (depende de distribution_items, batches)
create table stock_reservations (
  id uuid primary key default gen_random_uuid(),
  distribution_item_id uuid references distribution_items(id) on delete cascade,
  batch_id uuid references batches(id) on delete restrict,
  quantity numeric(12,3) not null check (quantity >= 0),
  status text not null check (status in ('active', 'consumed', 'released')) default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 20. disposals (depende de batches, profiles)
create table disposals (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid references batches(id) on delete restrict,
  quantity numeric(12,3) not null check (quantity >= 0),
  reason_code text not null check (reason_code in ('expired', 'damaged_packaging', 'improper_storage', 'spoiled', 'preventive_recall', 'other')),
  reason_notes text,
  destination text,
  disposed_at timestamptz,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

-- 21. audit_logs (depende de profiles)
create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references profiles(id),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb,
  created_at timestamptz not null default now()
);

-- 22. settings (depende de profiles)
create table settings (
  key text primary key,
  value jsonb not null,
  updated_by uuid references profiles(id),
  updated_at timestamptz not null default now()
);

-- índices
create index idx_donations_donor on donations(donor_id);
create index idx_donations_status on donations(status);
create index idx_donation_items_donation on donation_items(donation_id);
create index idx_donation_items_product on donation_items(product_id);
create index idx_batches_product on batches(product_id);
create index idx_batches_status on batches(status);
create index idx_batches_expiry on batches(expiry_date);
create index idx_batches_donation_item on batches(donation_item_id);
create index idx_stock_movements_batch on stock_movements(batch_id);
create index idx_stock_movements_type on stock_movements(movement_type);
create index idx_stock_movements_created_at on stock_movements(created_at);
create index idx_stock_reservations_batch on stock_reservations(batch_id);
create index idx_stock_reservations_status on stock_reservations(status);
create index idx_stock_reservations_distribution_item on stock_reservations(distribution_item_id);
create index idx_distributions_household on distributions(household_id);
create index idx_distributions_status on distributions(status);
create index idx_distribution_items_distribution on distribution_items(distribution_id);
create index idx_distribution_items_product on distribution_items(product_id);
create index idx_disposals_batch on disposals(batch_id);
create index idx_audit_logs_entity on audit_logs(entity_type, entity_id);
create index idx_audit_logs_created_at on audit_logs(created_at);
create index idx_beneficiaries_household on beneficiaries(household_id);

-- trigger updated_at
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

do $$
declare tbl text;
begin
  for tbl in
    select c.table_name from information_schema.columns c
    where c.table_schema = 'public'
      and c.column_name = 'updated_at'
  loop
    execute format('create trigger trg_%s_updated_at before update on %I for each row execute function set_updated_at()', tbl, tbl);
  end loop;
end $$;

-- RLS
alter table profiles enable row level security;
alter table roles enable row level security;
alter table user_roles enable row level security;
alter table donors enable row level security;
alter table donations enable row level security;
alter table donation_items enable row level security;
alter table categories enable row level security;
alter table products enable row level security;
alter table warehouses enable row level security;
alter table storage_locations enable row level security;
alter table batches enable row level security;
alter table batch_inspections enable row level security;
alter table stock_movements enable row level security;
alter table stock_reservations enable row level security;
alter table households enable row level security;
alter table beneficiaries enable row level security;
alter table beneficiary_needs enable row level security;
alter table distributions enable row level security;
alter table distribution_items enable row level security;
alter table disposals enable row level security;
alter table audit_logs enable row level security;
alter table settings enable row level security;

create or replace function current_user_role()
returns text as $$
declare
  r text;
begin
  select max(r.code) into r
  from user_roles ur
  join roles r on r.id = ur.role_id
  where ur.user_id = current_setting('app.current_user_id', true)::uuid;
  return r;
end;
$$ language plpgsql stable;

-- políticas RLS básicas (a app define app.current_user_id por sessão)
create policy p_select on profiles for select using (true);
create policy p_select on roles for select using (true);
create policy p_select on user_roles for select using (true);
create policy p_all on donors for all using (current_user_role() in ('admin','operator')) with check (current_user_role() in ('admin','operator'));
create policy p_all on donations for all using (current_user_role() in ('admin','operator')) with check (current_user_role() in ('admin','operator'));
create policy p_all on donation_items for all using (current_user_role() in ('admin','operator')) with check (current_user_role() in ('admin','operator'));
create policy p_all on categories for all using (current_user_role() = 'admin') with check (current_user_role() = 'admin');
create policy p_all on products for all using (current_user_role() = 'admin') with check (current_user_role() = 'admin');
create policy p_all on warehouses for all using (current_user_role() = 'admin') with check (current_user_role() = 'admin');
create policy p_all on storage_locations for all using (current_user_role() = 'admin') with check (current_user_role() = 'admin');
create policy p_all on batches for all using (current_user_role() in ('admin','operator')) with check (current_user_role() in ('admin','operator'));
create policy p_all on batch_inspections for all using (current_user_role() in ('admin','operator')) with check (current_user_role() in ('admin','operator'));
create policy p_all on stock_movements for all using (current_user_role() in ('admin','operator')) with check (current_user_role() in ('admin','operator'));
create policy p_all on stock_reservations for all using (current_user_role() in ('admin','operator')) with check (current_user_role() in ('admin','operator'));
create policy p_all on households for all using (current_user_role() in ('admin','operator')) with check (current_user_role() in ('admin','operator'));
create policy p_all on beneficiaries for all using (current_user_role() in ('admin','social_worker')) with check (current_user_role() in ('admin','social_worker'));
create policy p_all on beneficiary_needs for all using (current_user_role() in ('admin','social_worker')) with check (current_user_role() in ('admin','social_worker'));
create policy p_all on distributions for all using (current_user_role() in ('admin','operator')) with check (current_user_role() in ('admin','operator'));
create policy p_all on distribution_items for all using (current_user_role() in ('admin','operator')) with check (current_user_role() in ('admin','operator'));
create policy p_all on disposals for all using (current_user_role() in ('admin','operator')) with check (current_user_role() in ('admin','operator'));
create policy p_select_admin on audit_logs for select using (current_user_role() = 'admin');
create policy p_insert on audit_logs for insert with check (true);
create policy p_all on settings for all using (current_user_role() = 'admin') with check (current_user_role() = 'admin');
