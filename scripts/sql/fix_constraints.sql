-- 1. Add Unique Constraint to daily_history (user_id + date)
-- This allows UPSERT to work correctly when saving daily stats
ALTER TABLE daily_history 
ADD CONSTRAINT daily_history_user_date_key UNIQUE (user_id, date);

-- 2. Add Unique Constraint to topic_progress (user_id + topic_id)
-- This allows UPSERT to work correctly when saving topic progress
ALTER TABLE topic_progress 
ADD CONSTRAINT topic_progress_user_topic_key UNIQUE (user_id, topic_id);

-- Note: If this fails with "duplicate key value violates unique constraint",
-- it means you already have duplicate data. You might need to delete duplicates first.
-- But since you just started, it should be fine.
