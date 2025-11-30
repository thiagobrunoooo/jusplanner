-- Wipe all data from tables but keep structure
TRUNCATE TABLE topic_progress CASCADE;
TRUNCATE TABLE daily_history CASCADE;
TRUNCATE TABLE study_time CASCADE;
TRUNCATE TABLE notes CASCADE;
TRUNCATE TABLE materials CASCADE;

-- Reset profiles stats (don't delete users)
UPDATE profiles 
SET xp = 0, 
    level = 1, 
    streak = 0, 
    last_activity = NULL;
