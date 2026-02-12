-- FORCE REALTIME ENABLE
-- Run this to guarantee Realtime is active.

BEGIN;

-- 1. Force Set Tables (Idempotent - Overwrites list)
ALTER PUBLICATION supabase_realtime SET TABLE profiles, daily_history, topic_progress, study_time;

COMMIT;

-- 3. Verify (This will show what is enabled)
SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
