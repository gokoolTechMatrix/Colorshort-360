create table if not exists public.customer (
  id bigint generated always as identity primary key,
  company_id bigint not null references public.company(id),
  name varchar(255),
  code varchar(50),
  contact_person varchar(150),
  phone varchar(50),
  alt_phone varchar(50),
  email varchar(150),
  gstin varchar(50),
  billing_address text,
  shipping_address text,
  state varchar(100),
  country varchar(100),
  payment_term_id bigint references public.payment_term(id),
  customer_type varchar(50),
  is_active boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);

create trigger customer_set_updated_at
before update on public.customer
for each row
execute procedure moddatetime('updated_at');
