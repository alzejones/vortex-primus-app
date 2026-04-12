-- ============================================================
-- FIX: link_client_user_id — protege contra falhas de RLS/permissão
-- que causavam 'Database error saving new user' no inviteUserByEmail
-- ============================================================

-- Garante que o role postgres possa fazer UPDATE em clients
-- sem depender de BYPASSRLS (revogado no Supabase Cloud)
GRANT UPDATE (user_id) ON clients TO postgres;

CREATE OR REPLACE FUNCTION link_client_user_id()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_client_id uuid;
BEGIN
  v_client_id := (NEW.raw_user_meta_data->>'client_id')::uuid;

  IF v_client_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF (NEW.raw_user_meta_data->>'role') IS DISTINCT FROM 'client' THEN
    RETURN NEW;
  END IF;

  UPDATE clients
     SET user_id = NEW.id
   WHERE id = v_client_id
     AND user_id IS NULL;

  RETURN NEW;

EXCEPTION WHEN OTHERS THEN
  -- Não bloqueia a criação do usuário se o vínculo falhar.
  -- O UPDATE será retentado quando o trigger disparar novamente
  -- no UPDATE do auth.users (confirmação de e-mail).
  RAISE WARNING 'link_client_user_id: falha ao vincular client_id=% user_id=% — %',
    v_client_id, NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;
