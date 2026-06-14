create schema if not exists app_private;

create extension if not exists pgcrypto;

do $$
begin
  create type public.quote_status as enum ('new', 'reviewing', 'quoted', 'closed', 'archived');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.admin_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'admin' check (role in ('admin', 'owner')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references public.categories(id) on delete set null,
  name text not null,
  slug text not null unique,
  description text,
  image_path text,
  sort_order integer not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.brands (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  country text,
  website_url text,
  logo_path text,
  sort_order integer not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories(id) on delete set null,
  brand_id uuid references public.brands(id) on delete set null,
  name text not null,
  slug text not null unique,
  summary text,
  description text,
  model text,
  sku text,
  source_page integer,
  source_category text,
  is_featured boolean not null default false,
  is_published boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  bucket_id text not null default 'product-images',
  file_path text not null,
  alt_text text not null,
  source_folder text,
  source_filename text,
  source_page integer,
  width_px integer,
  height_px integer,
  is_primary boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.product_specs (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  label text not null,
  value text not null,
  unit text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.quote_requests (
  id uuid primary key default gen_random_uuid(),
  status public.quote_status not null default 'new',
  customer_name text not null,
  company_name text not null,
  email text,
  phone text not null,
  project_location text,
  message text,
  items jsonb not null default '[]'::jsonb check (jsonb_typeof(items) = 'array'),
  source text not null default 'website',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.quote_request_items (
  id uuid primary key default gen_random_uuid(),
  quote_request_id uuid not null references public.quote_requests(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name_snapshot text not null,
  category_name_snapshot text,
  quantity integer not null default 1 check (quantity > 0),
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.project_gallery (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text,
  location text,
  image_path text,
  alt_text text,
  sort_order integer not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  is_public boolean not null default true,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function app_private.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.admin_profiles
    where user_id = auth.uid()
      and is_active = true
      and role in ('admin', 'owner')
  );
$$;

grant usage on schema app_private to anon, authenticated;
grant execute on function app_private.is_admin() to anon, authenticated;

drop trigger if exists set_admin_profiles_updated_at on public.admin_profiles;
create trigger set_admin_profiles_updated_at
before update on public.admin_profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_categories_updated_at on public.categories;
create trigger set_categories_updated_at
before update on public.categories
for each row execute function public.set_updated_at();

drop trigger if exists set_brands_updated_at on public.brands;
create trigger set_brands_updated_at
before update on public.brands
for each row execute function public.set_updated_at();

drop trigger if exists set_products_updated_at on public.products;
create trigger set_products_updated_at
before update on public.products
for each row execute function public.set_updated_at();

drop trigger if exists set_quote_requests_updated_at on public.quote_requests;
create trigger set_quote_requests_updated_at
before update on public.quote_requests
for each row execute function public.set_updated_at();

drop trigger if exists set_project_gallery_updated_at on public.project_gallery;
create trigger set_project_gallery_updated_at
before update on public.project_gallery
for each row execute function public.set_updated_at();

drop trigger if exists set_site_settings_updated_at on public.site_settings;
create trigger set_site_settings_updated_at
before update on public.site_settings
for each row execute function public.set_updated_at();

alter table public.admin_profiles enable row level security;
alter table public.categories enable row level security;
alter table public.brands enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.product_specs enable row level security;
alter table public.quote_requests enable row level security;
alter table public.quote_request_items enable row level security;
alter table public.project_gallery enable row level security;
alter table public.site_settings enable row level security;

grant select on public.categories, public.brands, public.products, public.product_images, public.product_specs, public.project_gallery, public.site_settings to anon, authenticated;
grant insert on public.quote_requests to anon, authenticated;
grant select, insert, update, delete on public.admin_profiles, public.categories, public.brands, public.products, public.product_images, public.product_specs, public.quote_requests, public.quote_request_items, public.project_gallery, public.site_settings to authenticated;
grant select, insert, update, delete on public.admin_profiles, public.categories, public.brands, public.products, public.product_images, public.product_specs, public.quote_requests, public.quote_request_items, public.project_gallery, public.site_settings to service_role;

create policy "Admins can read admin profiles"
on public.admin_profiles for select
to authenticated
using (user_id = (select auth.uid()) or app_private.is_admin());

create policy "Admins can manage admin profiles"
on public.admin_profiles for all
to authenticated
using (app_private.is_admin())
with check (app_private.is_admin());

create policy "Published categories are public"
on public.categories for select
to anon, authenticated
using (is_published = true or app_private.is_admin());

create policy "Admins manage categories"
on public.categories for all
to authenticated
using (app_private.is_admin())
with check (app_private.is_admin());

create policy "Published brands are public"
on public.brands for select
to anon, authenticated
using (is_published = true or app_private.is_admin());

create policy "Admins manage brands"
on public.brands for all
to authenticated
using (app_private.is_admin())
with check (app_private.is_admin());

create policy "Published products are public"
on public.products for select
to anon, authenticated
using (is_published = true or app_private.is_admin());

create policy "Admins manage products"
on public.products for all
to authenticated
using (app_private.is_admin())
with check (app_private.is_admin());

create policy "Published product images are public"
on public.product_images for select
to anon, authenticated
using (
  exists (
    select 1
    from public.products
    where products.id = product_images.product_id
      and (products.is_published = true or app_private.is_admin())
  )
);

create policy "Admins manage product images"
on public.product_images for all
to authenticated
using (app_private.is_admin())
with check (app_private.is_admin());

create policy "Published product specs are public"
on public.product_specs for select
to anon, authenticated
using (
  exists (
    select 1
    from public.products
    where products.id = product_specs.product_id
      and (products.is_published = true or app_private.is_admin())
  )
);

create policy "Admins manage product specs"
on public.product_specs for all
to authenticated
using (app_private.is_admin())
with check (app_private.is_admin());

create policy "Anyone can submit quote requests"
on public.quote_requests for insert
to anon, authenticated
with check (
  status = 'new'
  and jsonb_typeof(items) = 'array'
  and length(customer_name) between 2 and 160
  and length(company_name) between 2 and 200
  and length(phone) between 7 and 40
);

create policy "Admins can read quote requests"
on public.quote_requests for select
to authenticated
using (app_private.is_admin());

create policy "Admins can update quote requests"
on public.quote_requests for update
to authenticated
using (app_private.is_admin())
with check (app_private.is_admin());

create policy "Admins can delete quote requests"
on public.quote_requests for delete
to authenticated
using (app_private.is_admin());

create policy "Admins manage quote request items"
on public.quote_request_items for all
to authenticated
using (app_private.is_admin())
with check (app_private.is_admin());

create policy "Published project gallery is public"
on public.project_gallery for select
to anon, authenticated
using (is_published = true or app_private.is_admin());

create policy "Admins manage project gallery"
on public.project_gallery for all
to authenticated
using (app_private.is_admin())
with check (app_private.is_admin());

create policy "Public site settings are readable"
on public.site_settings for select
to anon, authenticated
using (is_public = true or app_private.is_admin());

create policy "Admins manage site settings"
on public.site_settings for all
to authenticated
using (app_private.is_admin())
with check (app_private.is_admin());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('product-images', 'product-images', true, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('catalog-pages', 'catalog-pages', true, 10485760, array['image/jpeg', 'image/png', 'image/webp']),
  ('brand-assets', 'brand-assets', true, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']),
  ('project-images', 'project-images', true, 10485760, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy "Public can read website storage assets"
on storage.objects for select
to anon, authenticated
using (bucket_id in ('product-images', 'catalog-pages', 'brand-assets', 'project-images'));

create policy "Admins can upload website storage assets"
on storage.objects for insert
to authenticated
with check (
  bucket_id in ('product-images', 'catalog-pages', 'brand-assets', 'project-images')
  and app_private.is_admin()
);

create policy "Admins can update website storage assets"
on storage.objects for update
to authenticated
using (
  bucket_id in ('product-images', 'catalog-pages', 'brand-assets', 'project-images')
  and app_private.is_admin()
)
with check (
  bucket_id in ('product-images', 'catalog-pages', 'brand-assets', 'project-images')
  and app_private.is_admin()
);

create policy "Admins can delete website storage assets"
on storage.objects for delete
to authenticated
using (
  bucket_id in ('product-images', 'catalog-pages', 'brand-assets', 'project-images')
  and app_private.is_admin()
);

create index if not exists categories_parent_id_idx on public.categories(parent_id);
create index if not exists categories_published_sort_idx on public.categories(is_published, sort_order);
create index if not exists brands_published_sort_idx on public.brands(is_published, sort_order);
create index if not exists products_category_id_idx on public.products(category_id);
create index if not exists products_brand_id_idx on public.products(brand_id);
create index if not exists products_published_sort_idx on public.products(is_published, sort_order);
create index if not exists product_images_product_id_sort_idx on public.product_images(product_id, sort_order);
create index if not exists product_specs_product_id_sort_idx on public.product_specs(product_id, sort_order);
create index if not exists quote_requests_status_created_idx on public.quote_requests(status, created_at desc);
create index if not exists quote_request_items_request_id_idx on public.quote_request_items(quote_request_id);
create index if not exists project_gallery_published_sort_idx on public.project_gallery(is_published, sort_order);

insert into public.site_settings (key, value, is_public)
values
  (
    'company',
    '{
      "name": "One Way Solutions",
      "phone": "+2 0100 309 4000",
      "email": "mohamed.sabry@onewaysolutions-eg.com",
      "address": "109 H, Hadaek Al Haram, Haram, Giza",
      "domain": "onewaysolutions-eg.com"
    }'::jsonb,
    true
  )
on conflict (key) do update
set value = excluded.value,
    is_public = excluded.is_public,
    updated_at = now();
