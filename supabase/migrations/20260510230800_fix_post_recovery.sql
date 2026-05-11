-- ============================================================
-- CORREÇÕES PÓS-RECUPERAÇÃO DO BANCO (10/05/2026)
-- Projeto: rwyyvilshrjhfwlzudqg
-- ============================================================

-- 1. Adiciona plan_id em trainers (FK para plans)
ALTER TABLE trainers
ADD COLUMN IF NOT EXISTS plan_id uuid REFERENCES plans(id);

-- Atribui plano Teste a trainers sem plano
UPDATE trainers
SET plan_id = '9d8a50e0-007a-4e5f-ab1c-3641629204a7'
WHERE plan_id IS NULL;

-- 2. Adiciona stripe_price_id em plans
ALTER TABLE plans
ADD COLUMN IF NOT EXISTS stripe_price_id text;

-- 3. Corrige RLS de plans (planos são globais)
DROP POLICY IF EXISTS plans_trainer_access ON plans;

CREATE POLICY "plans_select_authenticated"
ON plans FOR SELECT
TO authenticated
USING (true);

-- 4. Atualiza nomes, preços e stripe_price_id dos planos
UPDATE plans SET
  name = 'Plano Iniciante',
  price_monthly = 14.90,
  price_cents = 1490,
  stripe_price_id = 'price_1TIXIy2HlySFSGvPVYuorHXs'
WHERE id = 'bbd394d2-34d6-44b5-a131-1efd5c02af46';

UPDATE plans SET
  name = 'Avançado',
  price_monthly = 24.90,
  price_cents = 2490,
  stripe_price_id = 'price_1TIXL72HlySFSGvPThHoZmT1'
WHERE id = '9958fea0-d6d7-4c2f-acf0-aee92a6bbfb4';

UPDATE plans SET
  name = 'Escalando 🚀🚀🚀',
  price_monthly = 39.90,
  price_cents = 3990,
  stripe_price_id = 'price_1TIXOj2HlySFSGvPdGX9EBKF'
WHERE id = 'aef822a6-1bec-4f75-bcb7-94b4adab340f';

-- NOTA: STRIPE_SECRET_KEY deve ser configurada via:
-- supabase secrets set STRIPE_SECRET_KEY=sk_test_... --project-ref rwyyvilshrjhfwlzudqg
