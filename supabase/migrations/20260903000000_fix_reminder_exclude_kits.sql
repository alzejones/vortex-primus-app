-- ════════════════════════════════════════════════════════════════════════════════
-- Migration: Fix Product Reminder — Exclude Kits
-- Data: 03/09/2026
-- Status: ✅ JÁ APLICADO EM PRODUÇÃO
-- 
-- Bug corrigido:
-- Kits do tipo "doses" (ex: Kit Desafio T21) têm supplement_id preenchido
-- para cálculo automático de preço (calculateSuggestedPrice usa pricing table).
-- 
-- A versão anterior das functions checava apenas "supplement_id IS NULL",
-- o que permitia que itens de kit gerassem avisos de reposição indevidos.
-- 
-- Correção:
-- Agora ambas as functions checam explicitamente "NEW.kit_id IS NOT NULL"
-- ANTES de processar, garantindo exclusão total de kits do sistema de reminders.
-- ════════════════════════════════════════════════════════════════════════════════

-- ────────────────────────────────────────────────────────────────────────────────
-- Function 1: calc_product_reminder_fields
-- Trigger: BEFORE INSERT/UPDATE em herbalife_sale_items
-- Calcula dose_diaria e data_termino_prevista para produtos avulsos
-- ────────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.calc_product_reminder_fields()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_doses_per_package numeric;
  v_default_dose numeric;
  v_effective_dose numeric;
  v_dias numeric;
  v_sale_date date;
BEGIN
  -- Kits ficam de fora, mesmo quando também têm supplement_id preenchido
  -- (kits tipo "doses" referenciam um supplement só pra cálculo de preço)
  IF NEW.kit_id IS NOT NULL OR NEW.supplement_id IS NULL THEN
    NEW.dose_diaria := NULL;
    NEW.data_termino_prevista := NULL;
    RETURN NEW;
  END IF;

  SELECT hp.doses_per_package, hp.dose_diaria_padrao
    INTO v_doses_per_package, v_default_dose
    FROM herbalife_pricing hp
    WHERE hp.supplement_id = NEW.supplement_id;

  v_effective_dose := COALESCE(NEW.dose_diaria, v_default_dose);
  NEW.dose_diaria := v_effective_dose;

  IF v_effective_dose IS NULL OR v_effective_dose <= 0
     OR v_doses_per_package IS NULL OR v_doses_per_package <= 0 THEN
    NEW.data_termino_prevista := NULL;
    RETURN NEW;
  END IF;

  SELECT hs.sale_date INTO v_sale_date FROM herbalife_sales hs WHERE hs.id = NEW.sale_id;
  v_dias := CEIL((COALESCE(NEW.line_qty, NEW.quantity) * v_doses_per_package) / v_effective_dose);
  NEW.data_termino_prevista := v_sale_date + (v_dias || ' days')::interval;

  RETURN NEW;
END;
$function$;

-- ────────────────────────────────────────────────────────────────────────────────
-- Function 2: enqueue_product_reminder
-- Trigger: AFTER INSERT/UPDATE em herbalife_sale_items
-- Cria entrada em product_reminder_queue quando data_termino_prevista existe
-- ────────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.enqueue_product_reminder()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_trainer_id uuid;
  v_client_id uuid;
  v_product_name text;
BEGIN
  DELETE FROM product_reminder_queue WHERE sale_item_id = NEW.id AND status = 'pending';

  -- Reforço: nunca enfileira aviso pra item de kit, mesmo que data_termino_prevista tenha ficado preenchida por algum motivo
  IF NEW.kit_id IS NOT NULL OR NEW.data_termino_prevista IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT hs.trainer_id, hs.client_id INTO v_trainer_id, v_client_id
    FROM herbalife_sales hs WHERE hs.id = NEW.sale_id;

  IF v_client_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT s.name INTO v_product_name FROM supplements s WHERE s.id = NEW.supplement_id;
  v_product_name := COALESCE(v_product_name, 'produto');

  INSERT INTO product_reminder_queue
    (trainer_id, client_id, sale_item_id, product_name, scheduled_date, message_text, status)
  VALUES (
    v_trainer_id,
    v_client_id,
    NEW.id,
    v_product_name,
    (NEW.data_termino_prevista - INTERVAL '5 days')::date,
    'Oi! Seu ' || v_product_name || ' deve estar acabando em breve. Vamos agendar a reposição?',
    'pending'
  );

  RETURN NEW;
END;
$function$;

-- ────────────────────────────────────────────────────────────────────────────────
-- Comentários técnicos
-- ────────────────────────────────────────────────────────────────────────────────

-- 1. Ambas as functions agora checam "NEW.kit_id IS NOT NULL" como primeira condição
-- 2. Garante que kits (independente de terem ou não supplement_id) nunca geram reminders
-- 3. Produtos avulsos (kit_id IS NULL AND supplement_id IS NOT NULL) seguem o fluxo normal
-- 4. Migration aplicada manualmente em produção antes de ser commitada ao repo
-- 5. Próximo passo: adicionar coluna "is_from_kit" à tabela product_reminder_queue
--    para auditoria (identificar se algum reminder antigo veio de kit antes do fix)
