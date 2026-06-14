create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create index if not exists quote_request_items_product_id_idx on public.quote_request_items(product_id);
create index if not exists site_settings_updated_by_idx on public.site_settings(updated_by);

drop policy if exists "Admins can manage admin profiles" on public.admin_profiles;
drop policy if exists "Admins manage categories" on public.categories;
drop policy if exists "Admins manage brands" on public.brands;
drop policy if exists "Admins manage products" on public.products;
drop policy if exists "Admins manage product images" on public.product_images;
drop policy if exists "Admins manage product specs" on public.product_specs;
drop policy if exists "Admins manage project gallery" on public.project_gallery;
drop policy if exists "Admins manage site settings" on public.site_settings;

create policy "Admins insert admin profiles"
on public.admin_profiles for insert
to authenticated
with check (app_private.is_admin());

create policy "Admins update admin profiles"
on public.admin_profiles for update
to authenticated
using (app_private.is_admin())
with check (app_private.is_admin());

create policy "Admins delete admin profiles"
on public.admin_profiles for delete
to authenticated
using (app_private.is_admin());

create policy "Admins insert categories"
on public.categories for insert
to authenticated
with check (app_private.is_admin());

create policy "Admins update categories"
on public.categories for update
to authenticated
using (app_private.is_admin())
with check (app_private.is_admin());

create policy "Admins delete categories"
on public.categories for delete
to authenticated
using (app_private.is_admin());

create policy "Admins insert brands"
on public.brands for insert
to authenticated
with check (app_private.is_admin());

create policy "Admins update brands"
on public.brands for update
to authenticated
using (app_private.is_admin())
with check (app_private.is_admin());

create policy "Admins delete brands"
on public.brands for delete
to authenticated
using (app_private.is_admin());

create policy "Admins insert products"
on public.products for insert
to authenticated
with check (app_private.is_admin());

create policy "Admins update products"
on public.products for update
to authenticated
using (app_private.is_admin())
with check (app_private.is_admin());

create policy "Admins delete products"
on public.products for delete
to authenticated
using (app_private.is_admin());

create policy "Admins insert product images"
on public.product_images for insert
to authenticated
with check (app_private.is_admin());

create policy "Admins update product images"
on public.product_images for update
to authenticated
using (app_private.is_admin())
with check (app_private.is_admin());

create policy "Admins delete product images"
on public.product_images for delete
to authenticated
using (app_private.is_admin());

create policy "Admins insert product specs"
on public.product_specs for insert
to authenticated
with check (app_private.is_admin());

create policy "Admins update product specs"
on public.product_specs for update
to authenticated
using (app_private.is_admin())
with check (app_private.is_admin());

create policy "Admins delete product specs"
on public.product_specs for delete
to authenticated
using (app_private.is_admin());

create policy "Admins insert project gallery"
on public.project_gallery for insert
to authenticated
with check (app_private.is_admin());

create policy "Admins update project gallery"
on public.project_gallery for update
to authenticated
using (app_private.is_admin())
with check (app_private.is_admin());

create policy "Admins delete project gallery"
on public.project_gallery for delete
to authenticated
using (app_private.is_admin());

create policy "Admins insert site settings"
on public.site_settings for insert
to authenticated
with check (app_private.is_admin());

create policy "Admins update site settings"
on public.site_settings for update
to authenticated
using (app_private.is_admin())
with check (app_private.is_admin());

create policy "Admins delete site settings"
on public.site_settings for delete
to authenticated
using (app_private.is_admin());
