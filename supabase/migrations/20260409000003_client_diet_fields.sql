-- ============================================================
-- FASE 6: Campos de dieta no perfil do aluno
-- ============================================================

ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS objective       text,
  ADD COLUMN IF NOT EXISTS activity_level  text,
  ADD COLUMN IF NOT EXISTS food_restrictions text;
