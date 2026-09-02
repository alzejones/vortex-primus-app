-- ============================================================================
-- Migration: Adiciona CHECK constraint em product_reminder_queue.status
-- Data: 2026-09-02
-- Branch: feat-aviso-reposicao-produtos
-- 
-- IMPORTANTE: Esta constraint JÁ FOI APLICADA EM PRODUÇÃO via console
-- do Supabase. Esta migration apenas rastreia o histórico de schema.
-- ============================================================================

-- JÁ APLICADO EM PRODUÇÃO
ALTER TABLE product_reminder_queue 
  ADD CONSTRAINT product_reminder_queue_status_check 
  CHECK (status IN ('pending', 'sent', 'cancelled'));

COMMENT ON CONSTRAINT product_reminder_queue_status_check ON product_reminder_queue IS 
  'Valida status do aviso: pending (aguardando), sent (enviado), cancelled (cancelado)';


-- ============================================================================
-- FIM DA MIGRATION
-- ============================================================================
-- Esta constraint foi aplicada manualmente em produção antes desta migration
-- ser criada. A migration existe apenas para rastreamento de histórico.
-- ============================================================================
