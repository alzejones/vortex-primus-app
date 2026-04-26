-- ============================================================
-- Migration: Campos para integração com balanças BLE
-- Adiciona campos que faltam na tabela anthropometry
-- ============================================================

-- Adicionar campos novos para dados das balanças
ALTER TABLE "public"."anthropometry" 
ADD COLUMN IF NOT EXISTS bmi numeric(5,2);

ALTER TABLE "public"."anthropometry" 
ADD COLUMN IF NOT EXISTS water_percent numeric(5,2);

ALTER TABLE "public"."anthropometry" 
ADD COLUMN IF NOT EXISTS bone_mass numeric(5,2);

ALTER TABLE "public"."anthropometry" 
ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'manual';

-- Comentários para documentação
COMMENT ON COLUMN "public"."anthropometry".bmi IS 'Índice de Massa Corporal (IMC)';
COMMENT ON COLUMN "public"."anthropometry".water_percent IS 'Percentual de água corporal';
COMMENT ON COLUMN "public"."anthropometry".bone_mass IS 'Massa óssea em kg';
COMMENT ON COLUMN "public"."anthropometry".source IS 'Origem dos dados: manual, ble_trainer, ble_client';