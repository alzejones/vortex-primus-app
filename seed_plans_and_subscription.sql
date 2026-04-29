-- ============================================================
-- SCRIPT DE DATA SEED - PLANOS E ASSINATURA DO TREINADOR
-- ============================================================
-- Descrição: Insere os 4 planos padrão do SaaS e vincula o 
--            plano "Teste" ao único treinador existente
--
-- ATENÇÃO: Execute este script no SQL Editor do Supabase
--          https://supabase.com/dashboard/project/rwyyvilshrjhfwlzudqg/sql/new
-- ============================================================

DO $$
DECLARE
  trainer_uuid uuid;
  plan_teste_uuid uuid;
BEGIN
  -- 1. Identificar o ID do único treinador cadastrado
  SELECT id INTO trainer_uuid 
  FROM public.trainers 
  LIMIT 1;
  
  -- Verificar se encontrou um treinador
  IF trainer_uuid IS NULL THEN
    RAISE EXCEPTION 'Nenhum treinador encontrado na tabela trainers';
  END IF;
  
  RAISE NOTICE 'Treinador encontrado: %', trainer_uuid;
  
  -- 2. Inserir os 4 planos padrão do SaaS
  -- Plano 1: Teste (Gratuito)
  INSERT INTO public.plans (id, trainer_id, name, price_cents, max_clients, features)
  VALUES (
    gen_random_uuid(),
    trainer_uuid,
    'Teste',
    0,                    -- R$ 0,00 (gratuito)
    50,                   -- Máximo 50 clientes
    '["Acesso básico", "Suporte limitado"]'::jsonb
  )
  RETURNING id INTO plan_teste_uuid;
  
  -- Plano 2: Iniciando
  INSERT INTO public.plans (trainer_id, name, price_cents, max_clients, features)
  VALUES (
    trainer_uuid,
    'Iniciando',
    2990,                 -- R$ 29,90
    99,                   -- Máximo 99 clientes
    '["Recursos completos", "Suporte por email"]'::jsonb
  );
  
  -- Plano 3: Escalando
  INSERT INTO public.plans (trainer_id, name, price_cents, max_clients, features)
  VALUES (
    trainer_uuid,
    'Escalando',
    3990,                 -- R$ 39,90
    299,                  -- Máximo 299 clientes
    '["Recursos avançados", "Suporte prioritário", "Relatórios detalhados"]'::jsonb
  );
  
  -- Plano 4: Livre
  INSERT INTO public.plans (trainer_id, name, price_cents, max_clients, features)
  VALUES (
    trainer_uuid,
    'Livre',
    5990,                 -- R$ 59,90
    99999,                -- Clientes ilimitados (99999)
    '["Todos os recursos", "Suporte 24/7", "API personalizada"]'::jsonb
  );
  
  -- 3. Vincular o plano "Teste" ao treinador (assinatura ativa)
  INSERT INTO public.trainer_subscriptions (trainer_id, plan_id, status, started_at)
  VALUES (
    trainer_uuid,
    plan_teste_uuid,
    'active',
    now()
  );
  
  RAISE NOTICE 'Planos criados e plano Teste vinculado ao treinador %', trainer_uuid;
  RAISE NOTICE 'Script executado com sucesso!';
  
END $$;