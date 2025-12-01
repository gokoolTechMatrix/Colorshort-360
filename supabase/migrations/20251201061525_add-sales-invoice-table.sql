create table if not exists public.sales_invoice (
  id bigint generated always as identity primary key,
  company_id bigint not null references public.company(id),
  invoice_no varchar(50),
  customer_id bigint not null references public.customer(id),
  sales_order_id bigint references public.sales_doc(id),
  service_ticket_id bigint references public.service_ticket(id),
  spare_request_id bigint references public.spare_request(id),
  dc_id bigint references public.delivery_challan(id),
  invoice_date date,
  type varchar(50),
  subtotal_amount numeric(18,2),
  discount_amount numeric(18,2),
  tax_amount numeric(18,2),
  total_amount numeric(18,2),
  balance_amount numeric(18,2),
  payment_status varchar(50),
  created_by_id bigint references public."user"(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create trigger sales_invoice_set_updated_at
before update on public.sales_invoice
for each row
execute procedure moddatetime('updated_at');
