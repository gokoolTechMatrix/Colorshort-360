create table if not exists public.lead (
  id bigint generated always as identity primary key,
  company_id bigint not null references public.company(id),
  lead_source_ varchar(150),
  customer_name varchar(255),
  contact_person varchar(150),
  phone varchar(50),
  email varchar(150),
  state varchar(100),
  purpose_switch varchar(100),
  status varchar(50),
  gst varchar(50),
  hot_cold_flag varchar(10),
  outcome varchar(255),
  assigned_to_id bigint references public."user"(id),
  created_by_id bigint references public."user"(id),
  next_followup_on date,
  customer_id bigint references public.customer(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create trigger lead_set_updated_at
before update on public.lead
for each row
execute procedure moddatetime('updated_at');
