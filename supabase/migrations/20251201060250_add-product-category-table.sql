create table if not exists public.product_category (
  id bigint generated always as identity primary key,
  company_id bigint not null references public.company(id),
  name varchar(100),
  code varchar(50),
  parent_id bigint references public.product_category(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create trigger product_category_set_updated_at
before update on public.product_category
for each row
execute procedure moddatetime('updated_at');
