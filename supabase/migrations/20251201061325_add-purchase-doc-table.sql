create table if not exists public.purchase_doc (
  id bigint generated always as identity primary key,
  company_id bigint not null references public.company(id),
  doc_type varchar(30),
  doc_no varchar(50),
  vendor_id bigint not null references public.vendor(id),
  related_doc_id bigint references public.purchase_doc(id),
  doc_date date,
  expected_date date,
  status varchar(50),
  currency varchar(10),
  subtotal_amount numeric(18,2),
  discount_amount numeric(18,2),
  tax_amount numeric(18,2),
  total_amount numeric(18,2),
  created_by_id bigint references public."user"(id),
  approved_by_id bigint references public."user"(id),
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create trigger purchase_doc_set_updated_at
before update on public.purchase_doc
for each row
execute procedure moddatetime('updated_at');
