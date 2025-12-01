create table if not exists public."user" (
  id bigint generated always as identity primary key,
  company_id bigint not null references public.company(id),
  name varchar(150),
  email varchar(150),
  phone varchar(50),
  username varchar(100),
  password_hash varchar(255),
  is_active boolean not null default true,
  last_login_at timestamptz,
  created_at timestamptz default now(),
  role varchar(150),
  updated_at timestamptz default now()
);

create trigger user_set_updated_at
before update on public."user"
for each row
execute procedure moddatetime('updated_at');
