# One Way Solutions Deployment

## Current Build

- Public site: `https://onewaysolutions-eg.com`
- Admin site: `https://admin.onewaysolutions-eg.com`
- Runtime: Next.js standalone server in Docker, routed by the existing VPS Traefik project
- Database: Supabase project `oqkojvazjtqjgjrufxug`
- Customer auth: none
- Admin auth: Supabase Auth user plus `public.admin_profiles`

## VPS Deployment

1. Copy `.env.production.example` to `.env.production` on the VPS.
2. Confirm DNS records point to the VPS public IP:
   - `onewaysolutions-eg.com`
   - `www.onewaysolutions-eg.com`
   - `admin.onewaysolutions-eg.com`
3. Start or update the stack:

```bash
docker compose up -d --build
```

The Compose file attaches the app to the existing `root_default` Docker network and uses Traefik labels for:

- `onewaysolutions-eg.com`
- `www.onewaysolutions-eg.com`
- `admin.onewaysolutions-eg.com`

## Hostinger VPS API Notes

The Hostinger VPS connector needs a `virtualMachineId`. For API deployment, pass `APP_BUILD_CONTEXT` as the GitHub repository URL so the VPS can build the image from source.

## First Admin User

Create the admin user in Supabase Auth, then insert the user's UUID:

```sql
insert into public.admin_profiles (user_id, full_name, role, is_active)
values ('<auth-user-uuid>', '<admin-name>', 'owner', true);
```

Without this row, `/admin` and `admin.onewaysolutions-eg.com` will reject the signed-in user.

## Catalog Data

The public site currently serves the full imported catalog from local generated assets:

- `public/catalog`
- `src/data/catalog-manifest.json`

The Supabase schema is ready. Remote product/category seeding can be applied from:

```text
supabase/seed/catalog_seed.sql
```
