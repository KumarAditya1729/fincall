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

  -- Add tables safely
  DO $$
  DECLARE
      t text;
  BEGIN
      FOR t IN 
          SELECT unnest(ARRAY['customers', 'call_logs', 'followups', 'payments', 'activity_logs', 'remarks'])
      LOOP
          IF NOT EXISTS (
              SELECT 1 
              FROM pg_publication_tables 
              WHERE pubname = 'supabase_realtime' 
              AND tablename = t
          ) THEN
              EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE %I', t);
          END IF;
      END LOOP;
  END;
  $$;
COMMIT;
