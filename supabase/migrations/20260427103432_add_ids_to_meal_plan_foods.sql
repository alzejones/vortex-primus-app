ALTER TABLE meal_plan_foods
  ADD COLUMN IF NOT EXISTS food_id uuid REFERENCES foods(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS supplement_id uuid REFERENCES supplements(id) ON DELETE SET NULL;