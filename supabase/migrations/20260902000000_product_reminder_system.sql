-- ============================================================================
-- Migration: Sistema de Aviso de Reposição de Produtos Herbalife
-- Data: 2026-09-02
-- Branch: feat-aviso-reposicao-produtos
-- 
-- IMPORTANTE: Esta migration registra alterações já aplicadas em produção
-- via console do Supabase. Não altera o comportamento atual, apenas rastreia
-- o histórico de schema.
--
-- Commit relacionado: 0732915b798540b9487f9c4ac3478a1fd129995b
-- ============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Adiciona campo dose_diaria_padrao em herbalife_pricing
-- ─────────────────────────────────────────────────────────────────────────────
-- JÁ APLICADO EM PRODUÇÃO
-- Armazena a dose diária padrão do produto (ex: 2 para Shake, 1 para CR7 Drive)
ALTER TABLE herbalife_pricing 
  ADD COLUMN IF NOT EXISTS dose_diaria_padrao numeric DEFAULT NULL;

COMMENT ON COLUMN herbalife_pricing.dose_diaria_padrao IS 
  'Dose diária padrão do produto (pode ser sobrescrita por item de venda)';


-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Adiciona campos de rastreamento em herbalife_sale_items
-- ─────────────────────────────────────────────────────────────────────────────
-- JÁ APLICADO EM PRODUÇÃO
-- dose_diaria: dose efetiva do item (herda de pricing se NULL, populada por trigger)
-- data_termino_prevista: data estimada de término (calculada por trigger)
ALTER TABLE herbalife_sale_items 
  ADD COLUMN IF NOT EXISTS dose_diaria numeric DEFAULT NULL;

ALTER TABLE herbalife_sale_items 
  ADD COLUMN IF NOT EXISTS data_termino_prevista date DEFAULT NULL;

COMMENT ON COLUMN herbalife_sale_items.dose_diaria IS 
  'Dose diária efetiva do item (herdada de dose_diaria_padrao se NULL)';

COMMENT ON COLUMN herbalife_sale_items.data_termino_prevista IS 
  'Data prevista de término do produto (calculada automaticamente via trigger)';


-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Cria tabela product_reminder_queue
-- ─────────────────────────────────────────────────────────────────────────────
-- JÁ APLICADO EM PRODUÇÃO
-- Fila de avisos de reposição, populada automaticamente por trigger
CREATE TABLE IF NOT EXISTS product_reminder_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id uuid NOT NULL REFERENCES trainers(id) ON DELETE CASCADE,
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  sale_item_id uuid REFERENCES herbalife_sale_items(id) ON DELETE CASCADE,
  product_name text,
  scheduled_date date,
  message_text text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'dismissed')),
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_product_reminder_queue_trainer_status 
  ON product_reminder_queue(trainer_id, status);

CREATE INDEX IF NOT EXISTS idx_product_reminder_queue_scheduled_date 
  ON product_reminder_queue(scheduled_date) WHERE status = 'pending';

COMMENT ON TABLE product_reminder_queue IS 
  'Fila de avisos de reposição de produtos (populada automaticamente via trigger)';


-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Função de trigger: calc_product_reminder_fields()
-- ─────────────────────────────────────────────────────────────────────────────
-- JÁ APLICADO EM PRODUÇÃO
-- Calcula dose_diaria e data_termino_prevista ao inserir/atualizar sale_item
CREATE OR REPLACE FUNCTION calc_product_reminder_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_doses_per_package numeric;
  v_default_dose numeric;
  v_effective_dose numeric;
  v_dias numeric;
  v_sale_date date;
BEGIN
  -- Ignora itens sem produto vinculado
  IF NEW.supplement_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Busca doses_per_package e dose_diaria_padrao do produto
  SELECT hp.doses_per_package, hp.dose_diaria_padrao
    INTO v_doses_per_package, v_default_dose
    FROM herbalife_pricing hp
    WHERE hp.supplement_id = NEW.supplement_id;

  -- Dose efetiva: usa NEW.dose_diaria se fornecida, senão herda de pricing
  v_effective_dose := COALESCE(NEW.dose_diaria, v_default_dose);
  NEW.dose_diaria := v_effective_dose;

  -- Se não houver dados suficientes, deixa data_termino_prevista NULL
  IF v_effective_dose IS NULL OR v_effective_dose <= 0
     OR v_doses_per_package IS NULL OR v_doses_per_package <= 0 THEN
    NEW.data_termino_prevista := NULL;
    RETURN NEW;
  END IF;

  -- Busca data da venda
  SELECT hs.sale_date INTO v_sale_date FROM herbalife_sales hs WHERE hs.id = NEW.sale_id;

  -- Calcula dias de duração: (quantidade * doses_per_package) / dose_diaria
  v_dias := CEIL((COALESCE(NEW.line_qty, NEW.quantity) * v_doses_per_package) / v_effective_dose);
  NEW.data_termino_prevista := v_sale_date + (v_dias || ' days')::interval;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION calc_product_reminder_fields() IS 
  'Calcula dose_diaria e data_termino_prevista ao inserir/atualizar herbalife_sale_items';


-- ─────────────────────────────────────────────────────────────────────────────
-- 5. Função de trigger: enqueue_product_reminder()
-- ─────────────────────────────────────────────────────────────────────────────
-- JÁ APLICADO EM PRODUÇÃO
-- Adiciona aviso de reposição na fila (scheduled_date = data_termino - 3 dias)
CREATE OR REPLACE FUNCTION enqueue_product_reminder()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_trainer_id uuid;
  v_client_id uuid;
  v_product_name text;
BEGIN
  -- Remove avisos pendentes antigos do mesmo item (se houver update)
  DELETE FROM product_reminder_queue WHERE sale_item_id = NEW.id AND status = 'pending';

  -- Não cria aviso se data_termino_prevista é NULL
  IF NEW.data_termino_prevista IS NULL THEN
    RETURN NEW;
  END IF;

  -- Busca trainer e cliente da venda
  SELECT hs.trainer_id, hs.client_id INTO v_trainer_id, v_client_id
    FROM herbalife_sales hs WHERE hs.id = NEW.sale_id;

  -- Não cria aviso para vendas avulsas (client_id NULL)
  IF v_client_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Busca nome do produto
  SELECT s.name INTO v_product_name FROM supplements s WHERE s.id = NEW.supplement_id;
  v_product_name := COALESCE(NEW.kit_name, v_product_name, 'produto');

  -- Insere aviso na fila (3 dias antes do término)
  INSERT INTO product_reminder_queue
    (trainer_id, client_id, sale_item_id, product_name, scheduled_date, message_text, status)
  VALUES (
    v_trainer_id,
    v_client_id,
    NEW.id,
    v_product_name,
    (NEW.data_termino_prevista - INTERVAL '3 days')::date,
    'Oi! Seu ' || v_product_name || ' deve estar acabando em breve. Vamos agendar a reposição?',
    'pending'
  );

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION enqueue_product_reminder() IS 
  'Enfileira aviso de reposição automático ao inserir/atualizar herbalife_sale_items';


-- ─────────────────────────────────────────────────────────────────────────────
-- 6. Cria triggers em herbalife_sale_items
-- ─────────────────────────────────────────────────────────────────────────────
-- JÁ APLICADO EM PRODUÇÃO
-- Ordem de execução: calc_product_reminder_fields → enqueue_product_reminder

-- DROP anterior para evitar duplicação (idempotente)
DROP TRIGGER IF EXISTS trg_calc_product_reminder_fields ON herbalife_sale_items;
DROP TRIGGER IF EXISTS trg_enqueue_product_reminder ON herbalife_sale_items;

CREATE TRIGGER trg_calc_product_reminder_fields
  BEFORE INSERT OR UPDATE ON herbalife_sale_items
  FOR EACH ROW
  EXECUTE FUNCTION calc_product_reminder_fields();

CREATE TRIGGER trg_enqueue_product_reminder
  AFTER INSERT OR UPDATE ON herbalife_sale_items
  FOR EACH ROW
  EXECUTE FUNCTION enqueue_product_reminder();

COMMENT ON TRIGGER trg_calc_product_reminder_fields ON herbalife_sale_items IS 
  'Calcula dose_diaria e data_termino_prevista antes de inserir/atualizar item';

COMMENT ON TRIGGER trg_enqueue_product_reminder ON herbalife_sale_items IS 
  'Enfileira aviso de reposição após inserir/atualizar item (se houver data_termino_prevista)';


-- ─────────────────────────────────────────────────────────────────────────────
-- 7. Atualiza função upsert_supplement_with_pricing (adiciona p_dose_diaria_padrao)
-- ─────────────────────────────────────────────────────────────────────────────
-- JÁ APLICADO EM PRODUÇÃO
-- Versão com 13 argumentos (adiciona p_dose_diaria_padrao numeric DEFAULT NULL)
CREATE OR REPLACE FUNCTION upsert_supplement_with_pricing(
  p_id uuid,
  p_brand text,
  p_sku text,
  p_name text,
  p_serving_size_g numeric,
  p_calories numeric,
  p_protein_g numeric,
  p_carbs_g numeric,
  p_fat_g numeric,
  p_fiber_g numeric,
  p_notes text,
  p_price_venda numeric,
  p_dose_diaria_padrao numeric DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_id uuid;
  v_sku text;
BEGIN
  -- Validação de permissão
  IF NOT EXISTS (SELECT 1 FROM trainers WHERE trainers.user_id = auth.uid()) THEN
    RAISE EXCEPTION 'not authorized: caller is not a trainer';
  END IF;

  -- Validação de nome
  IF p_name IS NULL OR trim(p_name) = '' THEN
    RAISE EXCEPTION 'name is required';
  END IF;

  -- Validação de preço
  IF p_price_venda IS NULL OR p_price_venda < 0 THEN
    RAISE EXCEPTION 'price_venda must be a non-negative number';
  END IF;

  v_sku := nullif(trim(p_sku), '');

  -- INSERT ou UPDATE em supplements
  IF p_id IS NULL THEN
    INSERT INTO supplements (
      brand, sku, name, serving_size_g, calories, protein_g, carbs_g, fat_g, fiber_g, notes
    ) VALUES (
      coalesce(nullif(trim(p_brand), ''), 'Herbalife'), v_sku, trim(p_name),
      p_serving_size_g, p_calories, p_protein_g, p_carbs_g, p_fat_g, p_fiber_g,
      nullif(trim(p_notes), '')
    )
    RETURNING id INTO v_id;
  ELSE
    UPDATE supplements SET
      brand = coalesce(nullif(trim(p_brand), ''), 'Herbalife'),
      sku = v_sku,
      name = trim(p_name),
      serving_size_g = p_serving_size_g,
      calories = p_calories,
      protein_g = p_protein_g,
      carbs_g = p_carbs_g,
      fat_g = p_fat_g,
      fiber_g = p_fiber_g,
      notes = nullif(trim(p_notes), '')
    WHERE id = p_id
    RETURNING id INTO v_id;

    IF v_id IS NULL THEN
      RAISE EXCEPTION 'supplement % not found', p_id;
    END IF;
  END IF;

  -- UPSERT em herbalife_pricing (adiciona dose_diaria_padrao)
  INSERT INTO herbalife_pricing (
    supplement_id, sku, pv, price_venda,
    price_bronze, price_prata, price_ouro,
    price_25, price_35, price_42, price_50,
    doses_per_package, dose_diaria_padrao
  ) VALUES (
    v_id, coalesce(v_sku, 'S/SKU'), 0, p_price_venda,
    p_price_venda, p_price_venda, p_price_venda,
    p_price_venda, p_price_venda, p_price_venda, p_price_venda,
    1, p_dose_diaria_padrao
  )
  ON CONFLICT (supplement_id) DO UPDATE SET
    sku = excluded.sku,
    price_venda = excluded.price_venda,
    dose_diaria_padrao = excluded.dose_diaria_padrao,
    updated_at = now();

  RETURN v_id;
END;
$$;

COMMENT ON FUNCTION upsert_supplement_with_pricing(
  uuid, text, text, text, numeric, numeric, numeric, numeric, numeric, numeric, text, numeric, numeric
) IS 'Insere/atualiza suplemento + pricing (inclui dose_diaria_padrao desde 2026-09-02)';


-- ─────────────────────────────────────────────────────────────────────────────
-- 8. RLS em product_reminder_queue
-- ─────────────────────────────────────────────────────────────────────────────
-- JÁ APLICADO EM PRODUÇÃO
ALTER TABLE product_reminder_queue ENABLE ROW LEVEL SECURITY;

-- Trainer vê seus próprios avisos
DROP POLICY IF EXISTS product_reminder_queue_trainer_select ON product_reminder_queue;
CREATE POLICY product_reminder_queue_trainer_select
  ON product_reminder_queue FOR SELECT
  USING (trainer_id IN (SELECT id FROM trainers WHERE user_id = auth.uid()));

-- Trainer atualiza status de seus avisos
DROP POLICY IF EXISTS product_reminder_queue_trainer_update ON product_reminder_queue;
CREATE POLICY product_reminder_queue_trainer_update
  ON product_reminder_queue FOR UPDATE
  USING (trainer_id IN (SELECT id FROM trainers WHERE user_id = auth.uid()));

-- Trainer deleta seus avisos
DROP POLICY IF EXISTS product_reminder_queue_trainer_delete ON product_reminder_queue;
CREATE POLICY product_reminder_queue_trainer_delete
  ON product_reminder_queue FOR DELETE
  USING (trainer_id IN (SELECT id FROM trainers WHERE user_id = auth.uid()));


-- ============================================================================
-- FIM DA MIGRATION
-- ============================================================================
-- Todas as alterações acima JÁ ESTAVAM APLICADAS em produção via console
-- do Supabase. Esta migration apenas rastreia o histórico de schema.
-- ============================================================================
