create table if not exists public.service_visit (
  id bigint generated always as identity primary key,
  service_ticket_id bigint not null references public.service_ticket(id),
  visit_no int,
  technician_id bigint references public."user"(id),
  checkin_time timestamptz,
  checkin_lat numeric(10,6),
  checkin_lng numeric(10,6),
  checkin_photo_url varchar(255),
  checkout_time timestamptz,
  checkout_lat numeric(10,6),
  checkout_lng numeric(10,6),
  work_summary text,
  hours_spent numeric(10,2),
  km_travelled numeric(10,2),
  customer_sign_url varchar(255),
  installation_password varchar(50),
  service_code varchar(50),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (service_ticket_id, visit_no)
);

create trigger service_visit_set_updated_at
before update on public.service_visit
for each row
execute procedure moddatetime('updated_at');
