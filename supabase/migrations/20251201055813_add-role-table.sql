create table if not exists public.role (
  id bigint generated always as identity primary key,
  company_id bigint not null references public.company(id),
  name varchar(100),
  code varchar(50),
  description text,
  is_system boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create trigger role_set_updated_at
before update on public.role
for each row
execute procedure moddatetime('updated_at');
