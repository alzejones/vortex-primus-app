-- Migration: fix_handle_new_user_role_check
-- Problema: handle_new_user() criava registro em trainers para TODOS os novos
-- usuários em auth.users, inclusive alunos convidados via invite-client.
-- Isso gerava registros espúrios em trainers (name=null) e trainer_subscriptions
-- para cada aluno cujo convite foi aceito.
--
-- Correção:
--   1. Adiciona guarda de role em handle_new_user(): só cria trainers se
--      raw_user_meta_data->>'role' != 'client'.
--   2. Remove registros espúrios já existentes em trainers (e por CASCADE
--      em trainer_subscriptions) onde o user_id pertence a um aluno.

-- 1. Corrige a função handle_new_user()
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Alunos convidados chegam com role = 'client' no raw_user_meta_data.
  -- Não criar registro em trainers para eles.
  IF (NEW.raw_user_meta_data->>'role') = 'client' THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.trainers (id, user_id, email)
  VALUES (gen_random_uuid(), NEW.id, NEW.email);

  RETURN NEW;
END;
$$;

-- 2. Remove registros espúrios em trainers criados para usuários que são alunos.
-- Critério: o user_id desse trainers existe em clients.user_id
-- (o mesmo auth.users não pode ser simultaneamente treinador e aluno).
-- trainer_subscriptions é removido automaticamente por CASCADE
-- (trainer_subscriptions_trainer_id_fkey ON DELETE CASCADE).
DELETE FROM public.trainers
WHERE user_id IN (
  SELECT user_id
  FROM public.clients
  WHERE user_id IS NOT NULL
);
