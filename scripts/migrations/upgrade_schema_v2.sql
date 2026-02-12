-- ⚠️ WARNING: This script wipes existing data to install the new structure.
-- Run this in Supabase SQL Editor.

-- 1. CLEANUP (Start Fresh)
DROP PUBLICATION IF EXISTS supabase_realtime;
DROP TABLE IF EXISTS topic_progress;
DROP TABLE IF EXISTS daily_history;
DROP TABLE IF EXISTS study_time;
DROP TABLE IF EXISTS profiles;

-- 2. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 3. PROFILES (Enhanced)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  preferences JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TOPIC PROGRESS (Professional Structure)
-- Uses UUID PK for stability, but enforces Unique(user, topic)
CREATE TABLE topic_progress (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  topic_id TEXT NOT NULL,
  
  -- Enhanced Tracking
  status TEXT CHECK (status IN ('locked', 'available', 'in_progress', 'completed', 'needs_review')) DEFAULT 'available',
  is_read BOOLEAN DEFAULT FALSE,
  is_reviewed BOOLEAN DEFAULT FALSE,
  
  -- Metrics
  questions_total INTEGER DEFAULT 0,
  questions_correct INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraint: One record per topic per user
  UNIQUE(user_id, topic_id)
);

-- 5. DAILY HISTORY (Enhanced)
CREATE TABLE daily_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  date DATE NOT NULL,
  
  questions_count INTEGER DEFAULT 0,
  topics_studied INTEGER DEFAULT 0,
  study_seconds INTEGER DEFAULT 0,
  
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, date)
);

-- 6. STUDY TIME (Enhanced)
CREATE TABLE study_time (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  subject_id TEXT NOT NULL,
  
  seconds INTEGER DEFAULT 0,
  last_session_at TIMESTAMPTZ DEFAULT NOW(),
  
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, subject_id)
);

-- 7. SECURITY (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE topic_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_time ENABLE ROW LEVEL SECURITY;

-- Simple "Owner Only" Policies
CREATE POLICY "Owner Access Profiles" ON profiles FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Owner Access Progress" ON topic_progress FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owner Access History" ON daily_history FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owner Access Time" ON study_time FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 8. REALTIME CONFIGURATION (The "Fix")
-- Create Publication
CREATE PUBLICATION supabase_realtime FOR TABLE profiles, topic_progress, daily_history, study_time;

-- Force Full Data Replication (Critical for Sync)
ALTER TABLE topic_progress REPLICA IDENTITY FULL;
ALTER TABLE daily_history REPLICA IDENTITY FULL;
ALTER TABLE study_time REPLICA IDENTITY FULL;
ALTER TABLE profiles REPLICA IDENTITY FULL;
