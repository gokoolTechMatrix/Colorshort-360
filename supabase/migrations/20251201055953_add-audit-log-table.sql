create table if not exists public.audit_log (
  id bigint generated always as identity primary key,
  company_id bigint not null references public.company(id),
  actor_user_id bigint not null references public."user"(id),
  entity_type varchar(100),
  entity_id bigint,
  action varchar(50),
  summary text,
  changes_json text,
  created_at timestamptz default now(),
  rate numeric(8,3),
  type varchar(50),
  is_active boolean not null default true
);
