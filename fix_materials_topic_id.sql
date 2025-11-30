-- Add topic_id column to materials table
ALTER TABLE materials
ADD COLUMN IF NOT EXISTS topic_id TEXT;

-- Update RLS policies if needed (existing ones should cover it as they are based on user_id)
