-- 1. Delete specific duplicate rows using ctid (internal ID)
-- This ensures we delete the physical duplicate rows, not just based on ID
DELETE FROM profiles
WHERE ctid IN (
  SELECT ctid
  FROM (
    SELECT ctid, ROW_NUMBER() OVER (PARTITION BY id ORDER BY updated_at DESC) as row_num
    FROM profiles
  ) t
  WHERE t.row_num > 1
);

-- 2. Now that duplicates are gone, enforce Primary Key
-- This prevents future duplicates
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_pkey') THEN
        ALTER TABLE profiles ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);
    END IF;
END
$$;
