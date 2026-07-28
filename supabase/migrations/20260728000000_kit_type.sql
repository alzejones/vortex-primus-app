-- ============================================================
-- Migration: Adicionar coluna kit_type aos kits Herbalife
-- Data: 2026-07-28
-- Objetivo: Diferenciar kits "fechados" (bundle com preço fixo)
--           de kits "doses" (preço sugerido por dose)
-- ============================================================

-- 1. Adicionar coluna kit_type com constraint
ALTER TABLE herbalife_kits 
ADD COLUMN kit_type text NOT NULL DEFAULT 'fechado' 
CHECK (kit_type IN ('fechado', 'doses'));

-- 2. Backfill dos 4 kits existentes
UPDATE herbalife_kits 
SET kit_type = 'fechado' 
WHERE name IN ('Kit Desafio T21 - Básico', 'Kit Desafio T21 - Avançado');

UPDATE herbalife_kits 
SET kit_type = 'doses' 
WHERE name IN ('Kit Reset', 'Kit Hype Drink');

-- 3. Validação: todos os 4 kits devem ter kit_type atualizado
DO $$
DECLARE
  total_fechado int;
  total_doses int;
BEGIN
  SELECT COUNT(*) INTO total_fechado FROM herbalife_kits WHERE kit_type = 'fechado';
  SELECT COUNT(*) INTO total_doses FROM herbalife_kits WHERE kit_type = 'doses';
  
  IF total_fechado <> 2 OR total_doses <> 2 THEN
    RAISE EXCEPTION 'Backfill falhou: esperado 2 kits fechados e 2 doses, encontrado % fechados e % doses', total_fechado, total_doses;
  END IF;
  
  RAISE NOTICE 'Backfill OK: % kits fechados, % kits doses', total_fechado, total_doses;
END $$;
