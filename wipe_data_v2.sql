-- WIPE DATA BY EMAIL
-- Replace 'seu_email_aqui' with your actual email if needed, 
-- OR just run this if you are the only user (it wipes everything for safety in dev).

-- Option A: Wipe EVERYTHING (Easiest for single user dev)
TRUNCATE TABLE daily_history;
TRUNCATE TABLE topic_progress;

-- Option B: Wipe only for specific user (if you prefer)
-- DELETE FROM daily_history WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'thiago2015araujo1234@gmail.com');
-- DELETE FROM topic_progress WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'thiago2015araujo1234@gmail.com');
