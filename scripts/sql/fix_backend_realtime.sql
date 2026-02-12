-- 1. Reset the Realtime Publication (The "Antenna")
DROP PUBLICATION IF EXISTS supabase_realtime;
CREATE PUBLICATION supabase_realtime FOR TABLE topic_progress, profiles, daily_history, study_time;

-- 2. Force Full Data Replication (Ensures the "Signal" is strong)
-- This makes sure Supabase sends the WHOLE row, not just the ID, when something changes.
ALTER TABLE topic_progress REPLICA IDENTITY FULL;
ALTER TABLE profiles REPLICA IDENTITY FULL;
ALTER TABLE daily_history REPLICA IDENTITY FULL;
ALTER TABLE study_time REPLICA IDENTITY FULL;

-- 3. Re-Verify Permissions (The "Key")
ALTER TABLE topic_progress ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own topics" ON topic_progress;
CREATE POLICY "Users can manage their own topics" ON topic_progress
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
