-- Add study_time and xp_earned to daily_history
ALTER TABLE daily_history 
ADD COLUMN IF NOT EXISTS study_time integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS xp_earned integer DEFAULT 0;

-- Update existing rows to have 0 if null (though default handles new ones)
UPDATE daily_history SET study_time = 0 WHERE study_time IS NULL;
UPDATE daily_history SET xp_earned = 0 WHERE xp_earned IS NULL;
