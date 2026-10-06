-- 2026-10-06: lock the retired mail-ai email_* tables (shared SEF Supabase
-- dgghsrmxzasdvckncpjf).
--
-- mail-ai-analytics was decommissioned 2026-07-30 (rg-mail-ai-analytics deleted;
-- see Control Tower entry mail-ai-assitant). Its n8n writer was retired 2026-07-31.
-- Each table still carried a policy "Service role full access on <table>" that was
-- FOR ALL TO public USING (true) - i.e. anyone holding the public anon key could
-- read and write every row. service_role bypasses RLS and does not need a policy.
--
-- This migration: drops those permissive policies, keeps RLS enabled, and revokes
-- all table privileges from anon and authenticated. No data is deleted; the
-- service role (and postgres) keep full access for any future restore/export.
--
-- Rollback (restores the previous open state - do not run unless restoring the app):
--   grant all on public.<t> to anon, authenticated;
--   create policy "Service role full access on <t>" on public.<t>
--     for all to public using (true);

begin;

drop policy if exists "Service role full access on email_analytics"     on public.email_analytics;
drop policy if exists "Service role full access on email_corrections"   on public.email_corrections;
drop policy if exists "Service role full access on email_decisions"     on public.email_decisions;
drop policy if exists "Service role full access on email_system_config" on public.email_system_config;
drop policy if exists "Service role full access on email_threads"       on public.email_threads;

alter table public.email_analytics     enable row level security;
alter table public.email_corrections   enable row level security;
alter table public.email_decisions     enable row level security;
alter table public.email_system_config enable row level security;
alter table public.email_threads       enable row level security;

revoke all on table
  public.email_analytics,
  public.email_corrections,
  public.email_decisions,
  public.email_system_config,
  public.email_threads
from anon, authenticated;

commit;
