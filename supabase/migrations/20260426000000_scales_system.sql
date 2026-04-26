-- ============================================================
-- Migration: Sistema de Balanças - Fase 1
-- Tabelas: supported_scales + trainer_scales
-- ============================================================

-- Tabela de modelos suportados (catálogo fixo - gerenciado pelo Vortex)
CREATE TABLE IF NOT EXISTS "public"."supported_scales" (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    brand text NOT NULL,
    model text NOT NULL,
    ble_name text,
    protocol text NOT NULL,
    metrics jsonb NOT NULL DEFAULT '[]'::jsonb,
    connection_type text NOT NULL DEFAULT 'ble_web',
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz DEFAULT now()
);

-- Tabela de balanças cadastradas por treinadores
CREATE TABLE IF NOT EXISTS "public"."trainer_scales" (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    trainer_id uuid NOT NULL REFERENCES trainers(id) ON DELETE CASCADE,
    supported_scale_id uuid NOT NULL REFERENCES supported_scales(id) ON DELETE CASCADE,
    nickname text NOT NULL,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz DEFAULT now()
);

-- ============================================================
-- RLS Policies
-- ============================================================

-- supported_scales: SELECT público para usuários autenticados
ALTER TABLE "public"."supported_scales" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "supported_scales_select_for_authenticated" ON "public"."supported_scales"
    FOR SELECT TO authenticated USING (true);

-- trainer_scales: CRUD apenas pelo próprio trainer_id
ALTER TABLE "public"."trainer_scales" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "trainer_scales_crud_own_only" ON "public"."trainer_scales"
    FOR ALL TO authenticated USING (trainer_id IN (
        SELECT id FROM public.trainers WHERE user_id = auth.uid()
    ));

-- ============================================================
-- Seed Data - Modelos suportados iniciais
-- ============================================================

INSERT INTO "public"."supported_scales" (brand, model, ble_name, protocol, metrics, connection_type) VALUES
(
    'Xiaomi',
    'Mi Body Composition Scale 2',
    'MIBCS',
    'xiaomi_v2',
    '["weight","fat_percent","muscle_mass","water_percent","bone_mass","bmr","visceral_fat","bmi","metabolic_age"]'::jsonb,
    'ble_web'
),
(
    'Original Line',
    'Chipsea/OKOK',
    'Chipsea-BLE',
    'chipsea_okok',
    '["weight","fat_percent","muscle_mass","water_percent","bone_mass","bmr","visceral_fat","bmi"]'::jsonb,
    'ble_web'
),
(
    'Techline',
    'TEC-BF01 (Fitdays)',
    '',
    'fitdays',
    '["weight","fat_percent","muscle_mass","water_percent","bone_mass","bmr","visceral_fat","bmi","metabolic_age"]'::jsonb,
    'ble_web'
),
(
    'Manual',
    'Entrada Manual',
    '',
    'manual',
    '[]'::jsonb,
    'manual'
);