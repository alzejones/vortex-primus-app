-- ============================================================
-- SCRIPT RETROATIVO - CORRIGE TREINADORES SEM PLANO
-- ============================================================
-- Executa duas ações:
-- 1. Cria os 4 planos padrão para o treinador atual (se não existirem)
-- 2. Vincula o plano "Teste" aos treinadores que não têm assinatura ativa

DO $$
DECLARE
  trainer_rec RECORD;
  plan_teste_id uuid;
  trainers_count integer;
BEGIN
  -- Verificar quantos treinadores existem
  SELECT COUNT(*) INTO trainers_count FROM public.trainers;
  RAISE NOTICE 'Encontrados % treinadores na base', trainers_count;
  
  -- Para cada treinador, garantir que ele tenha os 4 planos
  FOR trainer_rec IN SELECT id, name, email FROM public.trainers LOOP
    RAISE NOTICE 'Processando treinador: % (%)', trainer_rec.name, trainer_rec.id;
    
    -- Verificar se já existem planos para este treinador
    SELECT COUNT(*) INTO trainers_count FROM public.plans WHERE trainer_id = trainer_rec.id;
    
    IF trainers_count = 0 THEN
      -- Criar os 4 planos para este treinador
      INSERT INTO public.plans (trainer_id, name, price_cents, max_clients) VALUES
      (trainer_rec.id, 'Teste', 0, 50),
      (trainer_rec.id, 'Iniciando', 2990, 99),
      (trainer_rec.id, 'Escalando', 3990, 299),
      (trainer_rec.id, 'Livre', 5990, 99999);
      
      RAISE NOTICE 'Planos criados para treinador %', trainer_rec.id;
    END IF;
    
    -- Buscar o plano "Teste" deste treinador
    SELECT id INTO plan_teste_id 
    FROM public.plans 
    WHERE trainer_id = trainer_rec.id AND name = 'Teste'
    LIMIT 1;
    
    -- Verificar se já tem assinatura ativa
    SELECT COUNT(*) INTO trainers_count 
    FROM public.trainer_subscriptions 
    WHERE trainer_id = trainer_rec.id AND status = 'active';
    
    -- Se não tem assinatura ativa, criar uma para o plano "Teste"
    IF trainers_count = 0 AND plan_teste_id IS NOT NULL THEN
      INSERT INTO public.trainer_subscriptions (trainer_id, plan_id, status, started_at)
      VALUES (trainer_rec.id, plan_teste_id, 'active', NOW());
      
      RAISE NOTICE 'Assinatura do plano Teste criada para treinador %', trainer_rec.id;
    END IF;
    
  END LOOP;
  
  RAISE NOTICE 'Script retroativo executado com sucesso!';
END $$;