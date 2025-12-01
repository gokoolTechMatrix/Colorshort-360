alter table if exists public.vendor
  add column if not exists payment_term_id bigint references public.payment_term(id),
  add column if not exists is_active boolean not null default true,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now(),
  add column if not exists deleted_at timestamptz;

create trigger vendor_set_updated_at
before update on public.vendor
for each row
execute procedure moddatetime('updated_at');
