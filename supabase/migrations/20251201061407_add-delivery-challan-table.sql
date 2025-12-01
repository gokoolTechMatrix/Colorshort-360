create table if not exists public.delivery_challan (
  id bigint generated always as identity primary key,
  company_id bigint not null references public.company(id),
  dc_no varchar(50),
  customer_id bigint not null references public.customer(id),
  sales_order_id bigint references public.sales_doc(id),
  spare_request_id bigint references public.spare_request(id),
  dc_date date,
  type varchar(50),
  status varchar(50),
  linked_invoice_id bigint references public.sales_doc(id),
  created_by_id bigint references public."user"(id),
  created_at timestamptz default now()
);
