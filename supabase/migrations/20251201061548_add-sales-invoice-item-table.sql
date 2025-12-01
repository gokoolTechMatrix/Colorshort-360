create table if not exists public.sales_invoice_item (
  id bigint generated always as identity primary key,
  sales_invoice_id bigint not null references public.sales_invoice(id),
  product_id bigint not null references public.product(id),
  description text,
  quantity numeric(18,3),
  unit_price numeric(18,2),
  discount_pct numeric(8,3),
  tax_id bigint,
  line_total numeric(18,2),
  created_at timestamptz default now()
);
