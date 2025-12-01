create table if not exists public.service_ticket (
  id bigint generated always as identity primary key,
  company_id bigint not null references public.company(id),
  ticket_no varchar(50),
  customer_id bigint not null references public.customer(id),
  installed_asset_id bigint references public.installed_asset(id),
  source varchar(50),
  title varchar(255),
  description text,
  priority varchar(20),
  ticket_type varchar(50),
  status varchar(50),
  zone varchar(50),
  balance_hold boolean not null default false,
  assigned_to_id bigint references public."user"(id),
  scheduled_start timestamptz,
  scheduled_end timestamptz,
  assigned_by_id bigint references public."user"(id),
  opened_by_id bigint references public."user"(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create trigger service_ticket_set_updated_at
before update on public.service_ticket
for each row
execute procedure moddatetime('updated_at');
