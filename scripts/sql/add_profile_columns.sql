-- Add avatar and name columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS avatar text,
ADD COLUMN IF NOT EXISTS name text;

-- Update RLS policies to allow update of these columns (already covered by "Users can update own profile" but good to be safe)
-- The existing policy is: create policy "Users can update own profile" on profiles for update using (auth.uid() = id);
-- This covers all columns, so no change needed there.
