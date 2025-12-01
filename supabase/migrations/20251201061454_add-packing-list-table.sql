create table if not exists public.packing_list (
  id bigint generated always as identity primary key,
  company_id bigint not null references public.company(id),
  pl_no varchar(50) not null,
  customer_id bigint not null references public.customer(id),
  sales_order_id bigint references public.sales_doc(id),
  dc_id bigint references public.delivery_challan(id),
  pl_date date,
  remarks text,
  created_by_id bigint references public."user"(id),
  packing_list_id bigint not null references public.packing_list(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (company_id, pl_no)
);

create trigger packing_list_set_updated_at
before update on public.packing_list
for each row
execute procedure moddatetime('updated_at');
