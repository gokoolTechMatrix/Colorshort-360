create table if not exists public.installed_asset (
  id bigint generated always as identity primary key,
  company_id bigint not null references public.company(id),
  customer_id bigint not null references public.customer(id),
  product_id bigint not null references public.product(id),
  serial_no varchar(100),
  install_date date,
  installed_by_id bigint references public."user"(id),
  location_text text,
  status varchar(50),
  warranty_months int,
  warranty_start date,
  created_at timestamptz default now(),
  unique (company_id, serial_no)
);
