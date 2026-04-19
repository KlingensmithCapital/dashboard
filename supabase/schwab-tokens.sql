-- Schwab OAuth tokens — one row per user, updated on each refresh
create table schwab_tokens (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references auth.users(id) on delete cascade not null unique,
  access_token    text not null,
  refresh_token   text not null,
  expires_at      timestamptz not null,
  scope           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table schwab_tokens enable row level security;
create policy "owner only" on schwab_tokens for all using (auth.uid() = user_id);
create trigger set_updated_at before update on schwab_tokens for each row execute function set_updated_at();
