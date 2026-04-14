-- ============================================================
-- RLS: Aluno pode criar e editar seus próprios planos alimentares
-- ============================================================
--
-- Contexto: app/(client)/diet-plan-form.tsx permite que o aluno
-- autenticado crie/edite planos alimentares. As políticas existentes
-- só cobriam SELECT e UPDATE em meal_plans, e SELECT em meal_plan_meals
-- e meal_plan_foods. Este arquivo adiciona INSERT/DELETE/ALL para
-- completar o ciclo de escrita do aluno.
--
-- Segurança:
--   • client_insert_meal_plans: WITH CHECK garante que trainer_id
--     é o treinador do próprio aluno (não pode forjar outro trainer_id).
--   • client_write_meal_plan_meals/foods: encadeiam via JOIN em
--     meal_plans → clients, garantindo que o aluno só escreve em
--     refeições e alimentos de planos que lhe pertencem.
-- ============================================================

-- ---- meal_plans: INSERT ------------------------------------------
-- UPDATE e SELECT já existem (client_update_meal_plans, client_select_meal_plans)
CREATE POLICY "client_insert_meal_plans"
  ON public.meal_plans FOR INSERT
  WITH CHECK (
    client_id IN (
      SELECT id FROM public.clients WHERE user_id = auth.uid()
    )
    AND trainer_id IN (
      SELECT trainer_id FROM public.clients
       WHERE user_id = auth.uid()
         AND trainer_id IS NOT NULL
    )
  );

-- ---- meal_plans: DELETE ------------------------------------------
CREATE POLICY "client_delete_meal_plans"
  ON public.meal_plans FOR DELETE
  USING (
    client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid())
  );

-- ---- meal_plan_meals: INSERT / UPDATE / DELETE -------------------
-- SELECT já existe (client_select_meal_plan_meals)
CREATE POLICY "client_write_meal_plan_meals"
  ON public.meal_plan_meals FOR ALL
  USING (
    meal_plan_id IN (
      SELECT mp.id FROM public.meal_plans mp
        JOIN public.clients c ON c.id = mp.client_id
       WHERE c.user_id = auth.uid()
    )
  )
  WITH CHECK (
    meal_plan_id IN (
      SELECT mp.id FROM public.meal_plans mp
        JOIN public.clients c ON c.id = mp.client_id
       WHERE c.user_id = auth.uid()
    )
  );

-- ---- meal_plan_foods: INSERT / UPDATE / DELETE ------------------
-- SELECT já existe (client_select_meal_plan_foods)
CREATE POLICY "client_write_meal_plan_foods"
  ON public.meal_plan_foods FOR ALL
  USING (
    meal_id IN (
      SELECT mpm.id FROM public.meal_plan_meals mpm
        JOIN public.meal_plans mp ON mp.id = mpm.meal_plan_id
        JOIN public.clients c     ON c.id  = mp.client_id
       WHERE c.user_id = auth.uid()
    )
  )
  WITH CHECK (
    meal_id IN (
      SELECT mpm.id FROM public.meal_plan_meals mpm
        JOIN public.meal_plans mp ON mp.id = mpm.meal_plan_id
        JOIN public.clients c     ON c.id  = mp.client_id
       WHERE c.user_id = auth.uid()
    )
  );
