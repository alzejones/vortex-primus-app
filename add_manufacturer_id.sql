-- Execute este SQL no painel do Supabase (SQL Editor)
-- URL: https://supabase.com/dashboard/project/rwyyvilshrjhfwlzudqg/sql

-- Step 1: Add manufacturer_id column
ALTER TABLE supported_scales ADD COLUMN IF NOT EXISTS manufacturer_id integer DEFAULT NULL;

-- Step 2: Update chipsea_okok records with manufacturer ID (0x0FC0 = 4032)
UPDATE supported_scales
SET manufacturer_id = 4032
WHERE protocol = 'chipsea_okok';

-- Step 3: Verify the changes
SELECT id, brand, model, protocol, manufacturer_id 
FROM supported_scales 
WHERE protocol = 'chipsea_okok';