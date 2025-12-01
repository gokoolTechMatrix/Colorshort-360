create table if not exists public.product (
  id bigint generated always as identity primary key,
  company_id bigint not null references public.company(id),
  category_id bigint not null references public.product_category(id),
  sku varchar(100),
  name varchar(150),
  model varchar(100),
  unit varchar(30),
  product_type varchar(20),
  is_active boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);

create trigger product_set_updated_at
before update on public.product
for each row
execute procedure moddatetime('updated_at');
