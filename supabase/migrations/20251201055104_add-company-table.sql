create extension if not exists moddatetime;

create table if not exists public.company (
  id bigint generated always as identity primary key,
  name varchar(255),
  legal_name varchar(255),
  code varchar(50) not null unique,
  logo_url varchar(255),
  address_line1 varchar(255),
  address_line2 varchar(255),
  city varchar(100),
  state varchar(100),
  country varchar(100),
  pincode varchar(20),
  phone varchar(50),
  email varchar(150),
  gstin varchar(50),
  is_active boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create trigger company_set_updated_at
before update on public.company
for each row
execute procedure moddatetime('updated_at');
