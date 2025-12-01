create table if not exists public.sales_doc_item (
  id bigint generated always as identity primary key,
  sales_doc_id bigint not null references public.sales_doc(id),
  product_id bigint not null references public.product(id),
  description text,
  quantity numeric(18,3),
  unit_price numeric(18,2),
  discount_pct numeric(8,3),
  total_amount numeric(18,2),
  created_by_id bigint references public."user"(id),
  created_at timestamptz default now()
);
