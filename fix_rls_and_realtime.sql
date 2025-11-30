-- 1. Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE topic_progress ENABLE ROW LEVEL SECURITY;

-- 2. Create Policies (Drop existing first to avoid errors)
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

DROP POLICY IF EXISTS "Users can view own history" ON daily_history;
DROP POLICY IF EXISTS "Users can update own history" ON daily_history;
DROP POLICY IF EXISTS "Users can insert own history" ON daily_history;

DROP POLICY IF EXISTS "Users can view own progress" ON topic_progress;
DROP POLICY IF EXISTS "Users can update own progress" ON topic_progress;
DROP POLICY IF EXISTS "Users can insert own progress" ON topic_progress;

-- Profiles Policies
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Daily History Policies
CREATE POLICY "Users can view own history" ON daily_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own history" ON daily_history FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own history" ON daily_history FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Topic Progress Policies
CREATE POLICY "Users can view own progress" ON topic_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own progress" ON topic_progress FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own progress" ON topic_progress FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 3. Enable Realtime
-- Add tables to the publication used by Supabase Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE daily_history;
ALTER PUBLICATION supabase_realtime ADD TABLE topic_progress;
