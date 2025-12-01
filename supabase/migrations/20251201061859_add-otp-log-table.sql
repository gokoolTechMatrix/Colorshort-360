create table if not exists public.otp_log (
  id bigint generated always as identity primary key,
  company_id bigint not null references public.company(id),
  purpose varchar(50),
  target_type varchar(50),
  target_id bigint,
  channel varchar(50),
  otp_code varchar(20),
  expires_at timestamptz,
  verified_at timestamptz,
  created_at timestamptz default now()
);
