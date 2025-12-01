create table if not exists public.service_part_used (
  id bigint generated always as identity primary key,
  service_visit_id bigint not null references public.service_visit(id),
  product_id bigint not null references public.product(id),
  quantity numeric(18,3),
  is_warranty boolean
);
