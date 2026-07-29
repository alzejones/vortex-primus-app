-- ============================================================
-- Migration: Corrigir RLS para permitir edição de kits globais
-- Data: 2026-07-29
-- Bug: WITH CHECK bloqueava edição de kits com trainer_id = NULL
-- Decisão de produto: kits globais são colaborativos (editáveis 
--                     por qualquer trainer)
-- ============================================================

-- 1. Corrigir política de herbalife_kits
ALTER POLICY herbalife_kits_trainer_manage ON herbalife_kits
  USING (
    (trainer_id IS NULL) OR 
    (trainer_id IN (SELECT id FROM trainers WHERE user_id = auth.uid()))
  )
  WITH CHECK (
    (trainer_id IS NULL) OR 
    (trainer_id IN (SELECT id FROM trainers WHERE user_id = auth.uid()))
  );

-- 2. Corrigir política de herbalife_kit_items (mesma lógica via JOIN)
ALTER POLICY herbalife_kit_items_trainer_manage ON herbalife_kit_items
  USING (
    kit_id IN (
      SELECT id FROM herbalife_kits 
      WHERE (trainer_id IS NULL) OR 
            (trainer_id IN (SELECT id FROM trainers WHERE user_id = auth.uid()))
    )
  )
  WITH CHECK (
    kit_id IN (
      SELECT id FROM herbalife_kits 
      WHERE (trainer_id IS NULL) OR 
            (trainer_id IN (SELECT id FROM trainers WHERE user_id = auth.uid()))
    )
  );

-- Validação: ambas as políticas agora permitem edição de kits globais
DO $$
DECLARE
  kits_using text;
  kits_with_check text;
  items_using text;
  items_with_check text;
BEGIN
  -- Verificar herbalife_kits
  SELECT 
    pg_get_expr(polqual, polrelid),
    pg_get_expr(polwithcheck, polrelid)
  INTO kits_using, kits_with_check
  FROM pg_policy p
  JOIN pg_class c ON p.polrelid = c.oid
  WHERE c.relname = 'herbalife_kits' AND p.polname = 'herbalife_kits_trainer_manage';
  
  IF NOT (kits_using LIKE '%trainer_id IS NULL%' AND kits_with_check LIKE '%trainer_id IS NULL%') THEN
    RAISE EXCEPTION 'herbalife_kits: RLS não corrigido corretamente';
  END IF;
  
  -- Verificar herbalife_kit_items
  SELECT 
    pg_get_expr(polqual, polrelid),
    pg_get_expr(polwithcheck, polrelid)
  INTO items_using, items_with_check
  FROM pg_policy p
  JOIN pg_class c ON p.polrelid = c.oid
  WHERE c.relname = 'herbalife_kit_items' AND p.polname = 'herbalife_kit_items_trainer_manage';
  
  IF NOT (items_using LIKE '%trainer_id IS NULL%' AND items_with_check LIKE '%trainer_id IS NULL%') THEN
    RAISE EXCEPTION 'herbalife_kit_items: RLS não corrigido corretamente';
  END IF;
  
  RAISE NOTICE 'RLS corrigido: kits globais agora são editáveis por qualquer trainer';
END $$;
