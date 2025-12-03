-- 1. Aggressive cleanup: Keep ONLY the latest row (physically) for each ID
DELETE FROM profiles
WHERE ctid NOT IN (
    SELECT max(ctid)
    FROM profiles
    GROUP BY id
);

-- 2. Force Primary Key (this is crucial for upsert to work)
ALTER TABLE profiles ADD PRIMARY KEY (id);
