-- ============================================================
-- FASE 2: Catálogo de Alimentos TACO — Vortex Primus
-- Data: 2026-04-09
-- ============================================================


-- ------------------------------------------------------------
-- 1. FOODS — catálogo TACO (somente leitura para usuários)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS foods (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  taco_id     integer UNIQUE,       -- ID original da TACO (1..597)
  name        text NOT NULL,
  energy_kcal numeric(7,1),
  protein     numeric(5,1),
  carbs       numeric(5,1),
  fat         numeric(5,1),
  fiber       numeric(5,1),
  sodium      numeric(7,1),
  calcium     numeric(7,1),
  iron        numeric(5,1),
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS foods_name_idx ON foods USING gin(to_tsvector('portuguese', name));


-- ------------------------------------------------------------
-- 2. meal_plan_foods — adiciona food_id (FK para foods)
--    Nullable: treinador pode adicionar alimento customizado
--    (food_id NULL + name + macros preenchidos manualmente)
-- ------------------------------------------------------------
ALTER TABLE meal_plan_foods
  ADD COLUMN IF NOT EXISTS food_id uuid REFERENCES foods(id) ON DELETE SET NULL;


-- ------------------------------------------------------------
-- 3. RLS — foods é catálogo público de leitura
--    Escrita apenas via service_role (seed script)
-- ------------------------------------------------------------
ALTER TABLE foods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_select_foods"
  ON foods FOR SELECT
  USING (true);
-- INSERT/UPDATE/DELETE: bloqueados para authenticated/anon
-- O seed usa service_role que bypassa RLS
