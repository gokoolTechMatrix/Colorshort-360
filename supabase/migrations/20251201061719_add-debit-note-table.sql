create table if not exists public.debit_note (
  id bigint generated always as identity primary key,
  company_id bigint not null references public.company(id),
  note_no varchar(50),
  vendor_id bigint not null references public.vendor(id),
  purchase_invoice_id bigint references public.purchase_doc(id),
  note_date date,
  amount numeric(18,2),
  reason text
);
