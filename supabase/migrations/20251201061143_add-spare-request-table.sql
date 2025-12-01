create table if not exists public.spare_request (
  id bigint generated always as identity primary key,
  company_id bigint not null references public.company(id),
  request_no varchar(50),
  customer_id bigint not null references public.customer(id),
  installed_asset_id bigint references public.installed_asset(id),
  service_ticket_id bigint references public.service_ticket(id),
  request_date date,
  status varchar(50),
  requested_by_type varchar(50),
  requested_via varchar(50),
  approved_by_id bigint references public."user"(id),
  store_incharge_id bigint references public."user"(id),
  delivery_type varchar(50),
  remarks text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create trigger spare_request_set_updated_at
before update on public.spare_request
for each row
execute procedure moddatetime('updated_at');
