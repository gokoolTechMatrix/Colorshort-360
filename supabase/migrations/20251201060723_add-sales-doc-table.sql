create table if not exists public.sales_doc (
  id bigint generated always as identity primary key,
  company_id bigint not null references public.company(id),
  doc_type varchar(30),
  doc_no varchar(50),
  version_no int,
  customer_id bigint not null references public.customer(id),
  opportunity_id bigint,
  parent_doc_id bigint references public.sales_doc(id),
  doc_date date,
  valid_till date,
  status varchar(50),
  subtotal_amount numeric(18,2),
  discount_amount numeric(18,2),
  tax_amount numeric(18,2),
  total_amount numeric(18,2),
  payment_term_id bigint references public.payment_term(id),
  emi_months int,
  emi_needs_approval boolean not null default false,
  prepared_by_id bigint references public."user"(id),
  approved_by_id bigint references public."user"(id),
  created_by_id bigint references public."user"(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create trigger sales_doc_set_updated_at
before update on public.sales_doc
for each row
execute procedure moddatetime('updated_at');
