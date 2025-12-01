create table if not exists public.warehouse (
  id bigint generated always as identity primary key,
  company_id bigint not null references public.company(id),
  name varchar(100),
  code varchar(50),
  address text,
  is_primary boolean not null default false,
  is_active boolean not null default true
);
