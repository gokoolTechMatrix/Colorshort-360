create table if not exists public.spare_request_item (
  id bigint generated always as identity primary key,
  spare_request_id bigint not null references public.spare_request(id),
  product_id bigint not null references public.product(id),
  quantity numeric(18,3),
  remarks text,
  created_at timestamptz default now()
);
