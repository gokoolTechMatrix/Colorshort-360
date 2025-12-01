create table if not exists public.payment_term (
  id bigint generated always as identity primary key,
  company_id bigint not null references public.company(id),
  name varchar(100),
  days int,
  description text,
  is_active boolean not null default true
);
