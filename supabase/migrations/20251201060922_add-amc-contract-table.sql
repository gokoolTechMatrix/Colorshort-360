create table if not exists public.amc_contract (
  id bigint generated always as identity primary key,
  company_id bigint not null references public.company(id),
  contract_no varchar(50) not null,
  customer_id bigint not null references public.customer(id),
  installed_asset_id bigint references public.installed_asset(id),
  start_date date,
  end_date date,
  contract_type varchar(50),
  status varchar(50),
  pm_visits_per_year int,
  value_amount numeric(18,2),
  next_pm_due_date date,
  last_pm_done_date date,
  created_by_id bigint references public."user"(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (company_id, contract_no)
);

create trigger amc_contract_set_updated_at
before update on public.amc_contract
for each row
execute procedure moddatetime('updated_at');
