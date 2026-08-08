-- Enable Realtime for tables used in dashboard metrics
BEGIN;
  -- If publication doesn't exist, create it (it should exist on Supabase, but safe to check)
  DO $$
  BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
      CREATE PUBLICATION supabase_realtime;
    END IF;
  END
  $$;

  ALTER PUBLICATION supabase_realtime ADD TABLE customers;
  ALTER PUBLICATION supabase_realtime ADD TABLE call_logs;
  ALTER PUBLICATION supabase_realtime ADD TABLE followups;
  ALTER PUBLICATION supabase_realtime ADD TABLE payments;
  ALTER PUBLICATION supabase_realtime ADD TABLE activity_logs;
  ALTER PUBLICATION supabase_realtime ADD TABLE remarks;
COMMIT;
