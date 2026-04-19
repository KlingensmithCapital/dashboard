-- ============================================================
-- Seed: Accounts + Holdings
-- Run in Supabase SQL Editor after schema.sql
-- NOTE: Replace the user_id UUID below with your actual auth
-- user ID (Dashboard → Authentication → Users → copy your ID)
-- ============================================================

do $$
declare
  v_user_id   uuid := 'e59bbbdc-fd06-459b-9e27-53781c55b4eb'; -- REPLACE THIS
  v_roth_id   uuid;
  v_taxable_id uuid;
begin

  -- Accounts
  insert into accounts (id, user_id, name, institution, type)
  values
    (gen_random_uuid(), v_user_id, 'Roth IRA', 'Schwab', 'roth_ira'),
    (gen_random_uuid(), v_user_id, 'Taxable', 'Schwab', 'taxable');

  select id into v_roth_id   from accounts where user_id = v_user_id and type = 'roth_ira'  limit 1;
  select id into v_taxable_id from accounts where user_id = v_user_id and type = 'taxable'   limit 1;

  -- Holdings
  insert into holdings (user_id, account_id, ticker, theme, weight_pct, market_value, pnl_pct, status)
  values
    (v_user_id, v_roth_id,    'NVDA', 'AI Infrastructure',                    31.4, 188400, 18.2, 'green'),
    (v_user_id, v_roth_id,    'CEG',  'Nuclear demand supercycle',             12.7,  34900,  9.7, 'green'),
    (v_user_id, v_taxable_id, 'DKNG', 'Operating leverage + state optionality', 4.1,  11240, -3.1, 'amber'),
    (v_user_id, v_taxable_id, 'CING', 'Binary catalyst sizing discipline',      2.2,   6110,  4.6, 'amber');

  -- Net worth balance
  insert into balances (user_id, account_id, date, value, cash_available)
  values (v_user_id, null, current_date, 742900, 28400);

end $$;
