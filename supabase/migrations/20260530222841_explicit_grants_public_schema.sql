-- Migration: explicit_grants_public_schema
-- Motivo: Supabase exige GRANTs explícitos a partir de 30/05/2026

-- 1. Remove permissões existentes da role anon para aplicar apenas as necessárias
REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM anon;

-- 2. Schema usage
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- 3. Tabelas públicas (sem autenticação) — apenas as que realmente precisam
--    Regra: somente tabelas de referência/catálogo (plans, foods, supported_scales)
GRANT SELECT ON TABLE public.plans TO anon;
GRANT SELECT ON TABLE public.plans TO authenticated;

GRANT SELECT ON TABLE public.foods TO anon;
GRANT SELECT ON TABLE public.foods TO authenticated;

GRANT SELECT ON TABLE public.supported_scales TO anon;
GRANT SELECT ON TABLE public.supported_scales TO authenticated;

-- 4. Todas as demais tabelas — somente authenticated
--    (cada tabela do schema public, exceto as do item 2)
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.anthropometry TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.appointments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.assessment_photos TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.clients TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.conditioning_assessments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.conditioning_tests TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.diet_preferences TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.endurance_tests TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.meal_log TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.meal_log_foods TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.meal_plan_foods TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.meal_plan_meals TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.meal_plans TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.mobility_tests TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.physical_assessments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.strength_tests TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.supplements TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.trainer_scales TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.trainer_subscriptions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.trainers TO authenticated;

-- 5. Sequences
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 6. Default privileges — tabelas e sequences FUTURAS
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO authenticated;