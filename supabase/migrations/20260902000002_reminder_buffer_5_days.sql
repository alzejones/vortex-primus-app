-- ============================================================
-- 20260902000002_reminder_buffer_5_days.sql
-- ⚠️  JÁ APLICADO EM PRODUÇÃO (rwyyvilshrjhfwlzudqg)
-- Atualiza trigger de avisos de reposição: buffer de 3→5 dias
-- ============================================================

-- Ajusta a função enqueue_product_reminder() para calcular
-- scheduled_date como (data_termino_prevista - INTERVAL '5 days')
-- ao invés de 3 days, dando mais antecedência ao aviso de reposição.

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

  IF NEW.data_termino_prevista IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT hs.trainer_id, hs.client_id INTO v_trainer_id, v_client_id
    FROM herbalife_sales hs WHERE hs.id = NEW.sale_id;

  IF v_client_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT s.name INTO v_product_name FROM supplements s WHERE s.id = NEW.supplement_id;
  v_product_name := COALESCE(NEW.kit_name, v_product_name, 'produto');

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
