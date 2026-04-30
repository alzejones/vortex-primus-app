-- ============================================================
-- AUDITORIA v2: Correcoes inteligentes codigo vs banco
-- Data: 2026-04-30  
-- ============================================================

-- 1. Adicionar colunas faltando em anthropometry (apenas se nao existirem)
DO $$
BEGIN
  -- Campos criticos faltando
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'anthropometry' AND column_name = 'basal_metabolic_rate') THEN
    ALTER TABLE "public"."anthropometry" ADD COLUMN basal_metabolic_rate numeric(7,1);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'anthropometry' AND column_name = 'body_fat_index') THEN
    ALTER TABLE "public"."anthropometry" ADD COLUMN body_fat_index numeric(5,1);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'anthropometry' AND column_name = 'metabolic_age') THEN
    ALTER TABLE "public"."anthropometry" ADD COLUMN metabolic_age integer;
  END IF;
END $$;

-- 2. Adicionar colunas faltando em clients
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'observation') THEN
    ALTER TABLE "public"."clients" ADD COLUMN observation text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'is_active') THEN
    ALTER TABLE "public"."clients" ADD COLUMN is_active boolean NOT NULL DEFAULT true;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'updated_at') THEN
    ALTER TABLE "public"."clients" ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;

-- 3. Adicionar campo date em physical_assessments
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'physical_assessments' AND column_name = 'date') THEN
    ALTER TABLE "public"."physical_assessments" ADD COLUMN date date;
  END IF;
END $$;

-- 4. Adicionar campo is_active em trainer_subscriptions  
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trainer_subscriptions' AND column_name = 'is_active') THEN
    ALTER TABLE "public"."trainer_subscriptions" ADD COLUMN is_active boolean DEFAULT false;
  END IF;
END $$;

-- 5. Atualizar dados existentes
UPDATE "public"."trainer_subscriptions" 
SET is_active = (status = 'active')
WHERE is_active IS NULL;

UPDATE "public"."physical_assessments" 
SET date = assessment_date 
WHERE date IS NULL;

-- 6. Indices de performance (apenas se nao existirem)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_anthropometry_view_count') THEN
    CREATE INDEX idx_anthropometry_view_count ON anthropometry(view_count);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_clients_is_active') THEN
    CREATE INDEX idx_clients_is_active ON clients(is_active);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_trainer_subscriptions_is_active') THEN
    CREATE INDEX idx_trainer_subscriptions_is_active ON trainer_subscriptions(is_active);
  END IF;
END $$;