create table if not exists public.credit_note (
  id bigint generated always as identity primary key,
  company_id bigint not null references public.company(id),
  note_no varchar(50),
  customer_id bigint not null references public.customer(id),
  sales_invoice_id bigint references public.sales_invoice(id),
  note_date date,
  amount numeric(18,2),
  reason text
);
