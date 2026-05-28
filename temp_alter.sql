ALTER TABLE supported_scales ADD COLUMN IF NOT EXISTS manufacturer_id integer DEFAULT NULL;

UPDATE supported_scales
SET manufacturer_id = 4032
WHERE protocol = 'chipsea_okok';
