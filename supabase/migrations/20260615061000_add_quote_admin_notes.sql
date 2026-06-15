-- Additive, reversible: internal notes for quote requests (admin-only).
-- Rollback: alter table public.quote_requests drop column if exists admin_notes;
alter table public.quote_requests
  add column if not exists admin_notes text;
