-- Temporary dev policy — allows reads without auth so the cockpit
-- loads while auth is not yet enforced. Remove before going live.
create policy "dev read all" on holdings  for select using (true);
create policy "dev read all" on accounts  for select using (true);
create policy "dev read all" on balances  for select using (true);
