create table if not exists public.purchase_doc_item (
  id bigint generated always as identity primary key,
  purchase_doc_id bigint not null references public.purchase_doc(id),
  product_id bigint not null references public.product(id),
  description text,
  quantity numeric(18,3),
  unit_price numeric(18,2),
  discount_pct numeric(8,3),
  tax_id bigint,
  line_total numeric(18,2),
  created_at timestamptz default now()
);
