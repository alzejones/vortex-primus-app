-- ============================================================
-- FIX: Nullable FKs — clients.trainer_id e trainer_subscriptions
-- Data: 2026-04-12
-- Motivo: trainer_id NOT NULL sem ON DELETE impede deletar
--         treinadores que possuem clientes ou assinaturas.
--         Corrigimos para ON DELETE SET NULL em clients e
--         ON DELETE CASCADE em trainer_subscriptions.
-- ============================================================


-- ------------------------------------------------------------
-- 1. clients.trainer_id
--    Problema: NOT NULL sem ON DELETE → não consegue deletar trainer
--    Fix: DROP NOT NULL + trocar FK para ON DELETE SET NULL
--    Efeito: ao deletar um trainer, seus clientes ficam sem
--            trainer_id (null) em vez de serem deletados.
-- ------------------------------------------------------------

-- Descobre e dropa a FK atual (nome gerado pelo Postgres pode variar)
DO $$
DECLARE
  v_constraint text;
BEGIN
  SELECT conname INTO v_constraint
  FROM pg_constraint
  WHERE conrelid = 'public.clients'::regclass
    AND contype   = 'f'
    AND conkey    = ARRAY[(
      SELECT attnum
      FROM   pg_attribute
      WHERE  attrelid = 'public.clients'::regclass
        AND  attname  = 'trainer_id'
    )];

  IF v_constraint IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.clients DROP CONSTRAINT %I', v_constraint);
    RAISE NOTICE 'FK removida: %', v_constraint;
  ELSE
    RAISE NOTICE 'Nenhuma FK encontrada em clients.trainer_id — prosseguindo.';
  END IF;
END;
$$;

-- Torna nullable
ALTER TABLE public.clients
  ALTER COLUMN trainer_id DROP NOT NULL;

-- Re-adiciona com ON DELETE SET NULL
ALTER TABLE public.clients
  ADD CONSTRAINT clients_trainer_id_fkey
  FOREIGN KEY (trainer_id)
  REFERENCES public.trainers(id)
  ON DELETE SET NULL;


-- ------------------------------------------------------------
-- 2. trainer_subscriptions.trainer_id
--    Problema: FK sem ON DELETE → não consegue deletar trainer
--    Fix: trocar FK para ON DELETE CASCADE
--    Efeito: ao deletar um trainer, suas assinaturas são removidas
--            junto (comportamento esperado — sem trainer não há assinatura).
-- ------------------------------------------------------------

DO $$
DECLARE
  v_constraint text;
BEGIN
  SELECT conname INTO v_constraint
  FROM pg_constraint
  WHERE conrelid = 'public.trainer_subscriptions'::regclass
    AND contype   = 'f'
    AND conkey    = ARRAY[(
      SELECT attnum
      FROM   pg_attribute
      WHERE  attrelid = 'public.trainer_subscriptions'::regclass
        AND  attname  = 'trainer_id'
    )];

  IF v_constraint IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.trainer_subscriptions DROP CONSTRAINT %I', v_constraint);
    RAISE NOTICE 'FK removida: %', v_constraint;
  ELSE
    RAISE NOTICE 'Nenhuma FK encontrada em trainer_subscriptions.trainer_id — prosseguindo.';
  END IF;
END;
$$;

-- Re-adiciona com ON DELETE CASCADE
ALTER TABLE public.trainer_subscriptions
  ADD CONSTRAINT trainer_subscriptions_trainer_id_fkey
  FOREIGN KEY (trainer_id)
  REFERENCES public.trainers(id)
  ON DELETE CASCADE;


-- ------------------------------------------------------------
-- 3. trainers.user_id
--    Garantir ON DELETE SET NULL (ou CASCADE) ao deletar auth.users.
--    Se já tiver CASCADE ou SET NULL, o bloco é no-op.
-- ------------------------------------------------------------

DO $$
DECLARE
  v_constraint text;
  v_confdeltype char;
BEGIN
  SELECT conname, confdeltype INTO v_constraint, v_confdeltype
  FROM pg_constraint
  WHERE conrelid = 'public.trainers'::regclass
    AND contype   = 'f'
    AND conkey    = ARRAY[(
      SELECT attnum
      FROM   pg_attribute
      WHERE  attrelid = 'public.trainers'::regclass
        AND  attname  = 'user_id'
    )];

  -- confdeltype: 'a'=NO ACTION, 'r'=RESTRICT, 'c'=CASCADE, 'n'=SET NULL, 'd'=SET DEFAULT
  IF v_constraint IS NOT NULL AND v_confdeltype NOT IN ('c', 'n') THEN
    EXECUTE format('ALTER TABLE public.trainers DROP CONSTRAINT %I', v_constraint);
    ALTER TABLE public.trainers
      ADD CONSTRAINT trainers_user_id_fkey
      FOREIGN KEY (user_id)
      REFERENCES auth.users(id)
      ON DELETE SET NULL;
    RAISE NOTICE 'trainers.user_id FK atualizada para ON DELETE SET NULL';
  ELSE
    RAISE NOTICE 'trainers.user_id FK já está com CASCADE ou SET NULL — sem alteração.';
  END IF;
END;
$$;


-- ------------------------------------------------------------
-- 4. Comentários explicativos (pg_description)
-- ------------------------------------------------------------

COMMENT ON COLUMN public.clients.trainer_id IS
  'FK nullable para trainers. NULL = aluno sem treinador (ex: conta convidada cujo trainer foi deletado). ON DELETE SET NULL.';

COMMENT ON COLUMN public.trainer_subscriptions.trainer_id IS
  'FK para trainers com ON DELETE CASCADE. A assinatura é removida junto com o trainer.';
