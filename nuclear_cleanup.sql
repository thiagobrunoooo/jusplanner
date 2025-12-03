-- 1. Remove any existing Primary Key (to allow us to fix the data)
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_pkey;

-- 2. Create a temporary table with ONLY unique rows (keeping the most recent)
CREATE TABLE profiles_temp AS
SELECT DISTINCT ON (id) *
FROM profiles
ORDER BY id, updated_at DESC;

-- 3. Wipe the original table completely
TRUNCATE TABLE profiles;

-- 4. Put the clean, unique data back
INSERT INTO profiles
SELECT * FROM profiles_temp;

-- 5. Remove the temporary table
DROP TABLE profiles_temp;

-- 6. LOCK IT DOWN: Add the Primary Key on ID so duplicates never happen again
ALTER TABLE profiles ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);
