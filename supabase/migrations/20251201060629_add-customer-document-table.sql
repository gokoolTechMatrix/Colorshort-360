create table if not exists public.customer_document (
  id bigint generated always as identity primary key,
  customer_id bigint not null references public.customer(id),
  doc_type varchar(50),
  file_url varchar(255),
  uploaded_by bigint not null references public."user"(id),
  uploaded_at timestamptz default now()
);
