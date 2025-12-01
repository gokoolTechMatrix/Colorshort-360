create table if not exists public.inventory_txn (
  id bigint generated always as identity primary key,
  company_id bigint not null references public.company(id),
  product_id bigint not null references public.product(id),
  warehouse_from_id bigint references public.warehouse(id),
  warehouse_to_id bigint references public.warehouse(id),
  txn_date timestamptz,
  quantity numeric(18,3),
  unit_cost numeric(18,2),
  txn_type varchar(50),
  ref_type varchar(50),
  ref_id bigint,
  created_by_id bigint references public."user"(id),
  created_at timestamptz default now()
);
