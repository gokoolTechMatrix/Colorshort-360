create table if not exists public.expense_claim_item (
  id bigint generated always as identity primary key,
  expense_claim_id bigint not null references public.expense_claim(id),
  expense_date date,
  category varchar(50),
  description text,
  amount numeric(18,2),
  km_travelled numeric(10,2),
  attachment_url varchar(255),
  created_at timestamptz default now()
);
