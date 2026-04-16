-- Migration: meal_log + meal_log_foods
-- Registro diário de refeições consumidas pelo aluno (análise por foto via IA)

CREATE TABLE public.meal_log (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id       uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  consumed_at     timestamp with time zone NOT NULL DEFAULT now(),
  meal_type       text,
  photo_url       text,
  ai_analysis     jsonb,
  total_calories  numeric(7,1),
  total_protein   numeric(5,1),
  total_carbs     numeric(5,1),
  total_fat       numeric(5,1),
  notes           text,
  created_at      timestamp with time zone DEFAULT now()
);

CREATE TABLE public.meal_log_foods (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_log_id     uuid NOT NULL REFERENCES public.meal_log(id) ON DELETE CASCADE,
  food_id         uuid REFERENCES public.foods(id) ON DELETE SET NULL,
  name            text NOT NULL,
  quantity_grams  numeric(7,1),
  calories        numeric(7,1),
  protein         numeric(5,1),
  carbs           numeric(5,1),
  fat             numeric(5,1),
  order_index     integer NOT NULL DEFAULT 0
);

ALTER TABLE public.meal_log       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_log_foods ENABLE ROW LEVEL SECURITY;

-- Aluno vê/cria/edita seus próprios registros
CREATE POLICY "client_own_meal_log" ON public.meal_log
  FOR ALL
  USING (client_id IN (
    SELECT id FROM public.clients WHERE user_id = auth.uid()
  ))
  WITH CHECK (client_id IN (
    SELECT id FROM public.clients WHERE user_id = auth.uid()
  ));

-- Treinador lê registros dos seus alunos
CREATE POLICY "trainer_read_client_meal_log" ON public.meal_log
  FOR SELECT
  USING (client_id IN (
    SELECT c.id
    FROM   public.clients  c
    JOIN   public.trainers t ON c.trainer_id = t.id
    WHERE  t.user_id = auth.uid()
  ));

-- Aluno manipula foods do seu meal_log
CREATE POLICY "client_own_meal_log_foods" ON public.meal_log_foods
  FOR ALL
  USING (meal_log_id IN (
    SELECT ml.id
    FROM   public.meal_log ml
    JOIN   public.clients  c  ON ml.client_id = c.id
    WHERE  c.user_id = auth.uid()
  ))
  WITH CHECK (meal_log_id IN (
    SELECT ml.id
    FROM   public.meal_log ml
    JOIN   public.clients  c  ON ml.client_id = c.id
    WHERE  c.user_id = auth.uid()
  ));

-- Treinador lê foods dos registros dos seus alunos
CREATE POLICY "trainer_read_client_meal_log_foods" ON public.meal_log_foods
  FOR SELECT
  USING (meal_log_id IN (
    SELECT ml.id
    FROM   public.meal_log ml
    JOIN   public.clients  c  ON ml.client_id = c.id
    JOIN   public.trainers t  ON c.trainer_id = t.id
    WHERE  t.user_id = auth.uid()
  ));
