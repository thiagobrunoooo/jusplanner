-- 1. Check count BEFORE (Just to see)
SELECT count(*) as "Rows Before" FROM topic_progress;

-- 2. Delete EVERYTHING (Forcefully)
DELETE FROM daily_history;
DELETE FROM topic_progress;

-- 3. Check count AFTER (Must be 0)
SELECT count(*) as "Rows After" FROM topic_progress;
