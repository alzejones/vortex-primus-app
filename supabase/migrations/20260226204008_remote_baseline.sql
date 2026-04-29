-- ============================================================
-- SCHEMA BASE - Vortex Primus
-- Recriação das tabelas principais baseado no CLAUDE.md
-- Data: 2026-04-28
-- ============================================================

-- RLS será habilitado individualmente por tabela

-- ============================================================
-- 1. TRAINERS
-- ============================================================
CREATE TABLE IF NOT EXISTS trainers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text,
  created_at timestamp with time zone DEFAULT now()
);

-- RLS para trainers
ALTER TABLE trainers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "trainers_own_record" 
  ON trainers FOR ALL 
  USING (user_id = auth.uid());

-- ============================================================
-- 2. PLANS
-- ============================================================
CREATE TABLE IF NOT EXISTS plans (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  trainer_id uuid REFERENCES trainers(id) ON DELETE CASCADE,
  name text NOT NULL,
  price_cents integer NOT NULL DEFAULT 0,
  max_clients integer,
  features jsonb DEFAULT '[]'::jsonb,
  created_at timestamp with time zone DEFAULT now()
);

-- RLS para plans
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "plans_trainer_access" 
  ON plans FOR ALL 
  USING (trainer_id IN (
    SELECT id FROM trainers WHERE user_id = auth.uid()
  ));

-- ============================================================
-- 3. TRAINER_SUBSCRIPTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS trainer_subscriptions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  trainer_id uuid REFERENCES trainers(id) ON DELETE CASCADE,
  plan_id uuid REFERENCES plans(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'active',
  started_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone,
  stripe_subscription_id text UNIQUE,
  created_at timestamp with time zone DEFAULT now()
);

-- RLS para trainer_subscriptions
ALTER TABLE trainer_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "trainer_subscriptions_own_access" 
  ON trainer_subscriptions FOR ALL 
  USING (trainer_id IN (
    SELECT id FROM trainers WHERE user_id = auth.uid()
  ));

-- ============================================================
-- 4. CLIENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS clients (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  trainer_id uuid REFERENCES trainers(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text,
  phone text,
  birth_date date,
  gender text CHECK (gender IN ('M', 'F')),
  height_cm numeric(5,2),
  created_at timestamp with time zone DEFAULT now()
);

-- RLS para clients
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "clients_trainer_access" 
  ON clients FOR ALL 
  USING (trainer_id IN (
    SELECT id FROM trainers WHERE user_id = auth.uid()
  ));

-- ============================================================
-- 5. PHYSICAL_ASSESSMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS physical_assessments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  trainer_id uuid REFERENCES trainers(id) ON DELETE CASCADE,
  assessment_date date NOT NULL DEFAULT CURRENT_DATE,
  notes text,
  created_at timestamp with time zone DEFAULT now()
);

-- RLS para physical_assessments
ALTER TABLE physical_assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "physical_assessments_trainer_access" 
  ON physical_assessments FOR ALL 
  USING (trainer_id IN (
    SELECT id FROM trainers WHERE user_id = auth.uid()
  ));

-- ============================================================
-- 6. ANTHROPOMETRY
-- ============================================================
CREATE TABLE IF NOT EXISTS anthropometry (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  assessment_id uuid REFERENCES physical_assessments(id) ON DELETE CASCADE,
  weight_kg numeric(5,2),
  body_fat_percent numeric(5,2),
  muscle_mass_kg numeric(5,2),
  -- Medidas do tronco
  chest_cm numeric(5,2),
  waist_cm numeric(5,2),
  hips_cm numeric(5,2),
  -- Medidas dos membros
  right_arm_cm numeric(5,2),
  left_arm_cm numeric(5,2),
  right_forearm_cm numeric(5,2),
  left_forearm_cm numeric(5,2),
  right_thigh_cm numeric(5,2),
  left_thigh_cm numeric(5,2),
  right_calf_cm numeric(5,2),
  left_calf_cm numeric(5,2),
  created_at timestamp with time zone DEFAULT now()
);

-- RLS para anthropometry
ALTER TABLE anthropometry ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anthropometry_trainer_access" 
  ON anthropometry FOR ALL 
  USING (assessment_id IN (
    SELECT pa.id FROM physical_assessments pa
    JOIN trainers t ON t.id = pa.trainer_id
    WHERE t.user_id = auth.uid()
  ));

-- ============================================================
-- 7. CONDITIONING_ASSESSMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS conditioning_assessments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  assessment_id uuid REFERENCES physical_assessments(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now()
);

-- RLS para conditioning_assessments
ALTER TABLE conditioning_assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "conditioning_assessments_trainer_access" 
  ON conditioning_assessments FOR ALL 
  USING (assessment_id IN (
    SELECT pa.id FROM physical_assessments pa
    JOIN trainers t ON t.id = pa.trainer_id
    WHERE t.user_id = auth.uid()
  ));

-- ============================================================
-- 8. CONDITIONING_TESTS
-- ============================================================
CREATE TABLE IF NOT EXISTS conditioning_tests (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  conditioning_assessment_id uuid REFERENCES conditioning_assessments(id) ON DELETE CASCADE,
  test_name text NOT NULL,
  result_value numeric,
  result_unit text,
  notes text,
  created_at timestamp with time zone DEFAULT now()
);

-- RLS para conditioning_tests
ALTER TABLE conditioning_tests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "conditioning_tests_trainer_access" 
  ON conditioning_tests FOR ALL 
  USING (conditioning_assessment_id IN (
    SELECT ca.id FROM conditioning_assessments ca
    JOIN physical_assessments pa ON pa.id = ca.assessment_id
    JOIN trainers t ON t.id = pa.trainer_id
    WHERE t.user_id = auth.uid()
  ));

-- ============================================================
-- 9. MEAL_PLANS
-- ============================================================
CREATE TABLE IF NOT EXISTS meal_plans (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  trainer_id uuid REFERENCES trainers(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  start_date date,
  end_date date,
  status text DEFAULT 'active' CHECK (status IN ('draft', 'active', 'completed')),
  created_at timestamp with time zone DEFAULT now()
);

-- RLS para meal_plans
ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "meal_plans_trainer_access" 
  ON meal_plans FOR ALL 
  USING (trainer_id IN (
    SELECT id FROM trainers WHERE user_id = auth.uid()
  ));

-- ============================================================
-- 10. MEAL_PLAN_MEALS
-- ============================================================
CREATE TABLE IF NOT EXISTS meal_plan_meals (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  meal_plan_id uuid REFERENCES meal_plans(id) ON DELETE CASCADE,
  meal_type text NOT NULL CHECK (meal_type IN ('breakfast', 'morning_snack', 'lunch', 'afternoon_snack', 'dinner', 'evening_snack')),
  name text NOT NULL,
  description text,
  target_calories integer,
  created_at timestamp with time zone DEFAULT now()
);

-- RLS para meal_plan_meals
ALTER TABLE meal_plan_meals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "meal_plan_meals_trainer_access" 
  ON meal_plan_meals FOR ALL 
  USING (meal_plan_id IN (
    SELECT mp.id FROM meal_plans mp
    JOIN trainers t ON t.id = mp.trainer_id
    WHERE t.user_id = auth.uid()
  ));

-- ============================================================
-- 11. FOODS (Tabela TACO)
-- ============================================================
CREATE TABLE IF NOT EXISTS foods (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  category text,
  energy_kcal numeric(8,2),
  protein_g numeric(8,2),
  carb_g numeric(8,2),
  fat_g numeric(8,2),
  fiber_g numeric(8,2),
  sodium_mg numeric(8,2),
  created_at timestamp with time zone DEFAULT now()
);

-- RLS para foods (leitura pública)
ALTER TABLE foods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "foods_public_read" 
  ON foods FOR SELECT 
  USING (true);

-- ============================================================
-- 12. MEAL_PLAN_FOODS
-- ============================================================
CREATE TABLE IF NOT EXISTS meal_plan_foods (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  meal_id uuid REFERENCES meal_plan_meals(id) ON DELETE CASCADE,
  food_id uuid REFERENCES foods(id) ON DELETE CASCADE,
  quantity_g numeric(8,2) NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- RLS para meal_plan_foods
ALTER TABLE meal_plan_foods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "meal_plan_foods_trainer_access" 
  ON meal_plan_foods FOR ALL 
  USING (meal_id IN (
    SELECT mpm.id FROM meal_plan_meals mpm
    JOIN meal_plans mp ON mp.id = mpm.meal_plan_id
    JOIN trainers t ON t.id = mp.trainer_id
    WHERE t.user_id = auth.uid()
  ));

-- ============================================================
-- 13. MEAL_LOG
-- ============================================================
CREATE TABLE IF NOT EXISTS meal_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  meal_type text NOT NULL CHECK (meal_type IN ('breakfast', 'morning_snack', 'lunch', 'afternoon_snack', 'dinner', 'evening_snack')),
  logged_at timestamp with time zone DEFAULT now(),
  notes text,
  photo_url text,
  created_at timestamp with time zone DEFAULT now()
);

-- RLS para meal_log
ALTER TABLE meal_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "meal_log_trainer_access" 
  ON meal_log FOR ALL 
  USING (client_id IN (
    SELECT c.id FROM clients c
    JOIN trainers t ON t.id = c.trainer_id
    WHERE t.user_id = auth.uid()
  ));

-- ============================================================
-- FUNÇÃO: handle_new_user (Auth trigger)
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Criar registro de trainer para novos usuários autenticados
  INSERT INTO public.trainers (user_id, name, email)
  VALUES (new.id, COALESCE(new.raw_user_meta_data->>'name', 'Novo Treinador'), new.email);
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar trainer automaticamente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- ÍNDICES PARA PERFORMANCE
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_trainers_user_id ON trainers(user_id);
CREATE INDEX IF NOT EXISTS idx_clients_trainer_id ON clients(trainer_id);
CREATE INDEX IF NOT EXISTS idx_physical_assessments_client_id ON physical_assessments(client_id);
CREATE INDEX IF NOT EXISTS idx_physical_assessments_trainer_id ON physical_assessments(trainer_id);
CREATE INDEX IF NOT EXISTS idx_anthropometry_assessment_id ON anthropometry(assessment_id);
CREATE INDEX IF NOT EXISTS idx_meal_plans_client_id ON meal_plans(client_id);
CREATE INDEX IF NOT EXISTS idx_meal_plans_trainer_id ON meal_plans(trainer_id);
CREATE INDEX IF NOT EXISTS idx_meal_plan_meals_plan_id ON meal_plan_meals(meal_plan_id);
CREATE INDEX IF NOT EXISTS idx_meal_plan_foods_meal_id ON meal_plan_foods(meal_id);
CREATE INDEX IF NOT EXISTS idx_meal_log_client_id ON meal_log(client_id);

-- ============================================================
-- GRANTS FINAIS
-- ============================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
