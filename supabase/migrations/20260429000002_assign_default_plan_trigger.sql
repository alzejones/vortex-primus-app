-- Migration: assign_default_plan_trigger
-- Data: 29/04/2026
-- 
-- Objetivo: Automatizar atribuição do plano "Teste" para novos treinadores
-- 
-- Problema: Novos treinadores ficam "Sem Plano Ativo" na interface
-- porque não há vínculo automático na tabela trainer_subscriptions
--
-- Solução: Trigger que dispara após INSERT em trainers e cria
-- automaticamente uma assinatura do plano "Teste" (gratuito)

-- ============================================================
-- FUNÇÃO: assign_default_plan
-- ============================================================
CREATE OR REPLACE FUNCTION public.assign_default_plan()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  default_plan_id uuid;
BEGIN
  -- Buscar o plano "Teste" (gratuito) para este treinador
  SELECT id INTO default_plan_id
  FROM public.plans 
  WHERE trainer_id = NEW.id 
    AND (name = 'Teste' OR price_cents = 0)
  ORDER BY created_at ASC
  LIMIT 1;
  
  -- Se encontrou o plano, criar a assinatura
  IF default_plan_id IS NOT NULL THEN
    INSERT INTO public.trainer_subscriptions (
      trainer_id, 
      plan_id, 
      status, 
      started_at
    ) VALUES (
      NEW.id,
      default_plan_id,
      'active',
      NOW()
    );
    
    RAISE NOTICE 'Plano padrão (%) atribuído ao treinador %', default_plan_id, NEW.id;
  ELSE
    RAISE NOTICE 'Nenhum plano padrão encontrado para o treinador %', NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- ============================================================
-- TRIGGER: Dispara após INSERT em trainers
-- ============================================================
DROP TRIGGER IF EXISTS on_trainer_created_assign_plan ON public.trainers;

CREATE TRIGGER on_trainer_created_assign_plan
  AFTER INSERT ON public.trainers
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_default_plan();

-- ============================================================
-- COMENTÁRIO: Este trigger só funcionará se já houver planos
-- criados. Para treinadores existentes, usar script retroativo.
-- ============================================================