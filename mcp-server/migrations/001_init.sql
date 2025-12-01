-- Base MCP schema seed. Extend with your domain tables as needed.

create extension if not exists "pgcrypto";

create table if not exists mcp_example (
  id uuid primary key default gen_random_uuid(),
  note text not null,
  created_at timestamptz not null default now()
);

-- Lead management table aligned with UI fields.
create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  customer text not null,
  company text not null,
  owner text not null,
  role text not null,
  zone text not null,
  state text not null,
  product text not null,
  source text not null,
  stage text not null,
  temperature text not null,
  value text,
  next_action text,
  next_at timestamptz,
  special boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists leads_stage_idx on leads (stage);
create index if not exists leads_temperature_idx on leads (temperature);
create index if not exists leads_owner_idx on leads (owner);
