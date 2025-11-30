-- 1. Remove Duplicates from topic_progress
-- Keeps the most recent entry (highest ID) for each user+topic
DELETE FROM topic_progress
WHERE id IN (
  SELECT id
  FROM (
    SELECT id,
           ROW_NUMBER() OVER (PARTITION BY user_id, topic_id ORDER BY id DESC) as rnum
    FROM topic_progress
  ) t
  WHERE t.rnum > 1
);

-- 2. Remove Duplicates from daily_history
-- Keeps the most recent entry for each user+date
DELETE FROM daily_history
WHERE id IN (
  SELECT id
  FROM (
    SELECT id,
           ROW_NUMBER() OVER (PARTITION BY user_id, date ORDER BY id DESC) as rnum
    FROM daily_history
  ) t
  WHERE t.rnum > 1
);

-- 3. Add Unique Constraint to daily_history
ALTER TABLE daily_history 
ADD CONSTRAINT daily_history_user_date_key UNIQUE (user_id, date);

-- 4. Add Unique Constraint to topic_progress
ALTER TABLE topic_progress 
ADD CONSTRAINT topic_progress_user_topic_key UNIQUE (user_id, topic_id);
