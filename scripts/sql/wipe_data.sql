-- WIPE DATA SCRIPT
-- This will delete ALL study history and progress for the current user.
-- Use this to fix the "phantom data" issue and start fresh.

DELETE FROM daily_history WHERE user_id = auth.uid();
DELETE FROM topic_progress WHERE user_id = auth.uid();

-- The unique constraints we added earlier will prevent future duplicates.
