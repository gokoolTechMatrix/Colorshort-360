create table if not exists public.payment_receipt (
  id bigint generated always as identity primary key,
  company_id bigint not null references public.company(id),
  receipt_no varchar(50),
  customer_id bigint not null references public.customer(id),
  sales_invoice_id bigint not null references public.sales_invoice(id),
  receipt_date date,
  amount numeric(18,2),
  mode varchar(50),
  reference_no varchar(100),
  created_by_id bigint references public."user"(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create trigger payment_receipt_set_updated_at
before update on public.payment_receipt
for each row
execute procedure moddatetime('updated_at');
