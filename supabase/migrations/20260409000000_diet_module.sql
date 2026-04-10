-- ============================================================
-- FASE 1: Módulo de Dieta — Vortex Primus
-- Data: 2026-04-09
-- Branch: develop
-- ============================================================


-- ------------------------------------------------------------
-- 1. CLIENTES: adiciona user_id para suportar login do aluno
--    (nullable — clientes existentes não têm conta ainda)
-- ------------------------------------------------------------
ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS clients_user_id_unique
  ON clients (user_id)
  WHERE user_id IS NOT NULL;


-- ------------------------------------------------------------
-- 2. MEAL_PLANS — plano alimentar vinculado a um aluno
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS meal_plans (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id    uuid NOT NULL REFERENCES clients(id)  ON DELETE CASCADE,
  trainer_id   uuid NOT NULL REFERENCES trainers(id) ON DELETE CASCADE,
  title        text NOT NULL DEFAULT 'Plano Alimentar',
  objective    text,          -- editável pelo aluno (ex: "Emagrecimento")
  meals_per_day integer DEFAULT 5,  -- editável pelo aluno
  notes        text,          -- observações do treinador
  is_active    boolean NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);


-- ------------------------------------------------------------
-- 3. MEAL_PLAN_MEALS — refeições dentro do plano
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS meal_plan_meals (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_plan_id  uuid NOT NULL REFERENCES meal_plans(id) ON DELETE CASCADE,
  name          text NOT NULL,          -- ex: "Café da manhã"
  time_suggestion text,                 -- ex: "07:00"
  order_index   integer NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now()
);


-- ------------------------------------------------------------
-- 4. MEAL_PLAN_FOODS — alimentos dentro de cada refeição
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS meal_plan_foods (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_id     uuid NOT NULL REFERENCES meal_plan_meals(id) ON DELETE CASCADE,
  name        text NOT NULL,
  quantity    text,           -- ex: "100g", "2 col. sopa"
  calories    numeric(7,1),
  protein     numeric(5,1),
  carbs       numeric(5,1),
  fat         numeric(5,1),
  notes       text,
  order_index integer NOT NULL DEFAULT 0
);


-- ------------------------------------------------------------
-- 5. DIET_PREFERENCES — preferências/restrições, editáveis
--    pelo próprio aluno
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS diet_preferences (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id           uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  food_restrictions   text[],   -- ex: {"lactose", "glúten"}
  preferred_foods     text[],
  updated_at          timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT diet_preferences_client_id_unique UNIQUE (client_id)
);


-- ------------------------------------------------------------
-- 6. TRIGGER: atualiza updated_at em meal_plans
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_meal_plans_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_meal_plans_updated_at ON meal_plans;
CREATE TRIGGER trg_meal_plans_updated_at
  BEFORE UPDATE ON meal_plans
  FOR EACH ROW EXECUTE FUNCTION update_meal_plans_updated_at();


-- ============================================================
-- RLS
-- ============================================================

ALTER TABLE meal_plans       ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plan_meals  ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plan_foods  ENABLE ROW LEVEL SECURITY;
ALTER TABLE diet_preferences ENABLE ROW LEVEL SECURITY;


-- ---- meal_plans --------------------------------------------

-- Treinador: acesso total aos seus próprios planos
CREATE POLICY "trainer_all_meal_plans"
  ON meal_plans FOR ALL
  USING (
    trainer_id IN (
      SELECT id FROM trainers WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    trainer_id IN (
      SELECT id FROM trainers WHERE user_id = auth.uid()
    )
  );

-- Aluno: pode ler o próprio plano
CREATE POLICY "client_select_meal_plans"
  ON meal_plans FOR SELECT
  USING (
    client_id IN (
      SELECT id FROM clients WHERE user_id = auth.uid()
    )
  );

-- Aluno: pode atualizar APENAS objective e meals_per_day
CREATE POLICY "client_update_meal_plans"
  ON meal_plans FOR UPDATE
  USING (
    client_id IN (
      SELECT id FROM clients WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    client_id IN (
      SELECT id FROM clients WHERE user_id = auth.uid()
    )
  );


-- ---- meal_plan_meals ----------------------------------------

-- Treinador: acesso total (via meal_plan)
CREATE POLICY "trainer_all_meal_plan_meals"
  ON meal_plan_meals FOR ALL
  USING (
    meal_plan_id IN (
      SELECT mp.id FROM meal_plans mp
        JOIN trainers t ON t.id = mp.trainer_id
       WHERE t.user_id = auth.uid()
    )
  )
  WITH CHECK (
    meal_plan_id IN (
      SELECT mp.id FROM meal_plans mp
        JOIN trainers t ON t.id = mp.trainer_id
       WHERE t.user_id = auth.uid()
    )
  );

-- Aluno: somente leitura
CREATE POLICY "client_select_meal_plan_meals"
  ON meal_plan_meals FOR SELECT
  USING (
    meal_plan_id IN (
      SELECT mp.id FROM meal_plans mp
        JOIN clients c ON c.id = mp.client_id
       WHERE c.user_id = auth.uid()
    )
  );


-- ---- meal_plan_foods ----------------------------------------

-- Treinador: acesso total (via meal → meal_plan)
CREATE POLICY "trainer_all_meal_plan_foods"
  ON meal_plan_foods FOR ALL
  USING (
    meal_id IN (
      SELECT mpm.id FROM meal_plan_meals mpm
        JOIN meal_plans mp ON mp.id = mpm.meal_plan_id
        JOIN trainers t   ON t.id  = mp.trainer_id
       WHERE t.user_id = auth.uid()
    )
  )
  WITH CHECK (
    meal_id IN (
      SELECT mpm.id FROM meal_plan_meals mpm
        JOIN meal_plans mp ON mp.id = mpm.meal_plan_id
        JOIN trainers t   ON t.id  = mp.trainer_id
       WHERE t.user_id = auth.uid()
    )
  );

-- Aluno: somente leitura
CREATE POLICY "client_select_meal_plan_foods"
  ON meal_plan_foods FOR SELECT
  USING (
    meal_id IN (
      SELECT mpm.id FROM meal_plan_meals mpm
        JOIN meal_plans mp ON mp.id = mpm.meal_plan_id
        JOIN clients c     ON c.id  = mp.client_id
       WHERE c.user_id = auth.uid()
    )
  );


-- ---- diet_preferences --------------------------------------

-- Treinador: leitura das preferências dos seus alunos
CREATE POLICY "trainer_select_diet_preferences"
  ON diet_preferences FOR SELECT
  USING (
    client_id IN (
      SELECT c.id FROM clients c
        JOIN trainers t ON t.id = c.trainer_id
       WHERE t.user_id = auth.uid()
    )
  );

-- Aluno: leitura e escrita das próprias preferências
CREATE POLICY "client_all_diet_preferences"
  ON diet_preferences FOR ALL
  USING (
    client_id IN (
      SELECT id FROM clients WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    client_id IN (
      SELECT id FROM clients WHERE user_id = auth.uid()
    )
  );


-- ---- clients (nova política para o aluno ler o próprio registro) --
CREATE POLICY "client_select_own_record"
  ON clients FOR SELECT
  USING (user_id = auth.uid());
