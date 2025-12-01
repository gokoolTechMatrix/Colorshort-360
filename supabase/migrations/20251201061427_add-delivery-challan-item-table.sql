create table if not exists public.delivery_challan_item (
  id bigint generated always as identity primary key,
  delivery_challan_id bigint not null references public.delivery_challan(id),
  product_id bigint not null references public.product(id),
  quantity numeric(18,3),
  remarks text,
  created_at timestamptz default now()
);
