-- ============================================================
-- CORREÇÃO DOS BUGS DE PRODUÇÃO - Módulo de Dieta
-- Data: 2026-05-03
-- ============================================================
-- 
-- PROBLEMA: useTrainer.ts falha ao buscar trainer_subscriptions
-- com planos devido a colunas ausentes:
--
-- ERRO 1: column plans_1.price_monthly does not exist
-- ERRO 2: column trainer_subscriptions.start_date does not exist
--
-- SOLUÇÃO: Adicionar as colunas faltantes SEM alterar dados existentes
-- ============================================================

-- ============================================================
-- 1. TABELA PLANS - Adicionar price_monthly (CRÍTICO!)
-- ============================================================
DO $$
BEGIN
  -- Adicionar price_monthly se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'plans' 
    AND column_name = 'price_monthly'
  ) THEN
    ALTER TABLE "public"."plans" 
    ADD COLUMN price_monthly numeric(8,2) DEFAULT 0;
    
    -- Migrar dados existentes: price_cents -> price_monthly
    UPDATE "public"."plans" 
    SET price_monthly = COALESCE(price_cents, 0) / 100.0;
    
    RAISE NOTICE 'Coluna price_monthly adicionada à tabela plans';
  ELSE
    RAISE NOTICE 'Coluna price_monthly já existe na tabela plans';
  END IF;
END $$;

-- ============================================================
-- 2. TABELA TRAINER_SUBSCRIPTIONS - Adicionar start_date (CRÍTICO!)
-- ============================================================
DO $$
BEGIN
  -- Adicionar start_date se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'trainer_subscriptions' 
    AND column_name = 'start_date'
  ) THEN
    ALTER TABLE "public"."trainer_subscriptions" 
    ADD COLUMN start_date date;
    
    -- Migrar dados existentes: started_at -> start_date
    UPDATE "public"."trainer_subscriptions" 
    SET start_date = started_at::date
    WHERE started_at IS NOT NULL;
    
    RAISE NOTICE 'Coluna start_date adicionada à tabela trainer_subscriptions';
  ELSE
    RAISE NOTICE 'Coluna start_date já existe na tabela trainer_subscriptions';
  END IF;
END $$;

-- ============================================================
-- 3. VERIFICAÇÃO FINAL
-- ============================================================
-- Confirmar que as colunas foram criadas corretamente
DO $$
DECLARE
  price_monthly_exists boolean;
  start_date_exists boolean;
BEGIN
  -- Verificar price_monthly
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'plans' 
    AND column_name = 'price_monthly'
  ) INTO price_monthly_exists;
  
  -- Verificar start_date
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'trainer_subscriptions' 
    AND column_name = 'start_date'
  ) INTO start_date_exists;
  
  IF price_monthly_exists AND start_date_exists THEN
    RAISE NOTICE '✅ TODAS AS CORREÇÕES APLICADAS COM SUCESSO!';
    RAISE NOTICE 'useTrainer.ts agora deve funcionar corretamente.';
  ELSE
    RAISE NOTICE '❌ ALGUMAS CORREÇÕES FALHARAM:';
    RAISE NOTICE 'price_monthly: %', price_monthly_exists;
    RAISE NOTICE 'start_date: %', start_date_exists;
  END IF;
END $$;