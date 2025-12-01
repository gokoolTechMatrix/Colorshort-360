create table if not exists public.attendance_log (
  id bigint generated always as identity primary key,
  employee_id bigint not null references public."user"(id),
  log_date date,
  checkin_time timestamptz,
  checkin_lat numeric(10,6),
  checkin_lng numeric(10,6),
  selfie_url varchar(255),
  checkout_time timestamptz,
  checkout_lat numeric(10,6),
  checkout_lng numeric(10,6),
  remarks text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create trigger attendance_log_set_updated_at
before update on public.attendance_log
for each row
execute procedure moddatetime('updated_at');
