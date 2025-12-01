create table if not exists public.vendor (
  id bigint generated always as identity primary key,
  company_id bigint not null references public.company(id),
  name varchar(255),
  code varchar(50),
  contact_person varchar(150),
  phone varchar(50),
  email varchar(150),
  gstin varchar(50),
  address text,
  state varchar(100),
  country varchar(100)
);
