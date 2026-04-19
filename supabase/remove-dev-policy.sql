-- Remove temporary dev read policies
drop policy if exists "dev read all" on holdings;
drop policy if exists "dev read all" on accounts;
drop policy if exists "dev read all" on balances;
