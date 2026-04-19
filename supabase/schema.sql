-- ============================================================
-- Klingensmith Capital — PM Cockpit Schema
-- Run this in the Supabase SQL editor (Dashboard → SQL Editor)
-- ============================================================

-- Enable UUID generation
create extension if not exists "pgcrypto";


-- ============================================================
-- ACCOUNTS
-- Brokerage and personal accounts (Roth IRA, Taxable, etc.)
-- ============================================================
create table accounts (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  name        text not null,                        -- e.g. "Roth IRA", "Taxable"
  institution text not null default 'Schwab',       -- e.g. "Schwab", "Fidelity"
  type        text not null check (type in ('roth_ira', 'traditional_ira', 'taxable', 'hsa', 'cash')),
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table accounts enable row level security;
create policy "owner only" on accounts for all using (auth.uid() = user_id);


-- ============================================================
-- BALANCES
-- Daily net worth and account snapshots
-- ============================================================
create table balances (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references auth.users(id) on delete cascade not null,
  account_id      uuid references accounts(id) on delete cascade,  -- null = total net worth
  date            date not null default current_date,
  value           numeric(14, 2) not null,
  cash_available  numeric(14, 2),                   -- for total-row: deployable cash
  note            text,
  created_at      timestamptz not null default now(),
  unique (user_id, account_id, date)
);

alter table balances enable row level security;
create policy "owner only" on balances for all using (auth.uid() = user_id);
create index on balances (user_id, date desc);


-- ============================================================
-- HOLDINGS
-- Current positions across all accounts
-- ============================================================
create table holdings (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users(id) on delete cascade not null,
  account_id   uuid references accounts(id) on delete cascade not null,
  ticker       text not null,
  name         text,
  theme        text,                                -- e.g. "AI Infrastructure"
  shares       numeric(14, 6),
  cost_basis   numeric(14, 4),                     -- per share
  current_price numeric(14, 4),
  market_value numeric(14, 2),
  weight_pct   numeric(6, 2),                      -- portfolio weight %
  pnl_pct      numeric(8, 4),                      -- unrealized gain/loss %
  status       text not null default 'green' check (status in ('green', 'amber', 'red')),
  is_active    boolean not null default true,
  last_synced  timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table holdings enable row level security;
create policy "owner only" on holdings for all using (auth.uid() = user_id);
create index on holdings (user_id, is_active);


-- ============================================================
-- TRANSACTIONS
-- Buy/sell history and contributions
-- ============================================================
create table transactions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users(id) on delete cascade not null,
  account_id   uuid references accounts(id) on delete cascade not null,
  holding_id   uuid references holdings(id) on delete set null,
  ticker       text,
  type         text not null check (type in ('buy', 'sell', 'contribution', 'withdrawal', 'dividend', 'transfer')),
  shares       numeric(14, 6),
  price        numeric(14, 4),
  total        numeric(14, 2) not null,
  note         text,
  transacted_at timestamptz not null default now(),
  created_at   timestamptz not null default now()
);

alter table transactions enable row level security;
create policy "owner only" on transactions for all using (auth.uid() = user_id);
create index on transactions (user_id, transacted_at desc);


-- ============================================================
-- EXPENSES
-- Personal expenses for capital allocation tracking
-- ============================================================
create table expenses (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users(id) on delete cascade not null,
  category     text not null,                       -- e.g. "Housing", "Food", "Subscriptions"
  description  text not null,
  amount       numeric(10, 2) not null,
  date         date not null default current_date,
  source       text,                                -- e.g. "Chase Sapphire", "Schwab checking"
  is_recurring boolean not null default false,
  created_at   timestamptz not null default now()
);

alter table expenses enable row level security;
create policy "owner only" on expenses for all using (auth.uid() = user_id);
create index on expenses (user_id, date desc);


-- ============================================================
-- THESES
-- Why each position is owned, what changed, what breaks it
-- ============================================================
create table theses (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid references auth.users(id) on delete cascade not null,
  holding_id       uuid references holdings(id) on delete set null,
  ticker           text not null,
  title            text not null,                   -- short label, e.g. "AI Infrastructure compounder"
  body             text not null,                   -- full thesis narrative
  kill_criteria    text,                            -- what would invalidate this
  status           text not null default 'active' check (status in ('active', 'drifting', 'exited', 'killed')),
  conviction       int check (conviction between 1 and 10),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

alter table theses enable row level security;
create policy "owner only" on theses for all using (auth.uid() = user_id);
create index on theses (user_id, ticker);


-- ============================================================
-- THESIS CHANGES
-- Append-only log of thesis drift / updates
-- ============================================================
create table thesis_changes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  thesis_id   uuid references theses(id) on delete cascade not null,
  note        text not null,                        -- what changed and why
  changed_by  text not null default 'pm' check (changed_by in ('pm', 'agent')),
  created_at  timestamptz not null default now()
);

alter table thesis_changes enable row level security;
create policy "owner only" on thesis_changes for all using (auth.uid() = user_id);


-- ============================================================
-- CATALYST EVENTS
-- Upcoming events, deadlines, and decision triggers
-- ============================================================
create table catalyst_events (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users(id) on delete cascade not null,
  holding_id   uuid references holdings(id) on delete set null,
  ticker       text,
  title        text not null,
  type         text not null default 'review' check (type in ('earnings', 'catalyst', 'review', 'deadline', 'macro')),
  urgency      text not null default 'normal' check (urgency in ('today', 'high', 'normal', 'low')),
  due_date     date,
  is_complete  boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table catalyst_events enable row level security;
create policy "owner only" on catalyst_events for all using (auth.uid() = user_id);
create index on catalyst_events (user_id, due_date asc, is_complete);


-- ============================================================
-- IDEAS
-- Idea pipeline — agent-surfaced or PM-created candidates
-- ============================================================
create table ideas (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users(id) on delete cascade not null,
  name         text not null,                       -- idea or basket name
  ticker       text,                                -- optional specific ticker
  note         text,                                -- thesis summary
  score        int check (score between 0 and 100), -- agent conviction score
  status       text not null default 'new' check (status in ('new', 'watch', 'promote', 'hold', 'killed')),
  source       text not null default 'pm' check (source in ('pm', 'agent')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table ideas enable row level security;
create policy "owner only" on ideas for all using (auth.uid() = user_id);
create index on ideas (user_id, status, score desc);


-- ============================================================
-- MORNING BRIEFS
-- Agent-generated daily pre-market brief
-- ============================================================
create table morning_briefs (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references auth.users(id) on delete cascade not null,
  date            date not null default current_date,
  market_summary  text,                             -- macro / tape setup
  portfolio_notes text,                             -- held-name headlines
  flight_plan     jsonb,                            -- ordered PM action list
  market_context  jsonb,                            -- leadership / rates / risk posture
  watchpoints     text[],                           -- tickers or themes to watch
  generated_at    timestamptz not null default now(),
  unique (user_id, date)
);

alter table morning_briefs enable row level security;
create policy "owner only" on morning_briefs for all using (auth.uid() = user_id);
create index on morning_briefs (user_id, date desc);


-- ============================================================
-- AGENT RUNS
-- Log of every agent execution for audit and debugging
-- ============================================================
create table agent_runs (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users(id) on delete cascade not null,
  agent        text not null,                       -- e.g. "morning_brief", "idea_scout"
  status       text not null default 'running' check (status in ('running', 'success', 'failed')),
  input        jsonb,
  output       jsonb,
  error        text,
  duration_ms  int,
  started_at   timestamptz not null default now(),
  finished_at  timestamptz
);

alter table agent_runs enable row level security;
create policy "owner only" on agent_runs for all using (auth.uid() = user_id);
create index on agent_runs (user_id, agent, started_at desc);


-- ============================================================
-- DOCUMENTS
-- Ingested statements, reports, and reference files
-- ============================================================
create table documents (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users(id) on delete cascade not null,
  name         text not null,
  type         text not null check (type in ('statement', 'report', 'research', 'tax', 'other')),
  storage_path text not null,                       -- Supabase Storage path
  parsed       boolean not null default false,
  parsed_at    timestamptz,
  created_at   timestamptz not null default now()
);

alter table documents enable row level security;
create policy "owner only" on documents for all using (auth.uid() = user_id);


-- ============================================================
-- AUTO-UPDATE updated_at ON EVERY WRITE
-- ============================================================
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_updated_at before update on accounts   for each row execute function set_updated_at();
create trigger set_updated_at before update on holdings   for each row execute function set_updated_at();
create trigger set_updated_at before update on theses     for each row execute function set_updated_at();
create trigger set_updated_at before update on catalyst_events for each row execute function set_updated_at();
create trigger set_updated_at before update on ideas      for each row execute function set_updated_at();
