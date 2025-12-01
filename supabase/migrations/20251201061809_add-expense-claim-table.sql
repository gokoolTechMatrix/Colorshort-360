create table if not exists public.expense_claim (
  id bigint generated always as identity primary key,
  employee_id bigint not null references public."user"(id),
  claim_no varchar(50),
  claim_date date,
  total_amount numeric(18,2),
  status varchar(50),
  approved_by_id bigint references public."user"(id),
  paid_on date,
  created_at timestamptz default now()
);
