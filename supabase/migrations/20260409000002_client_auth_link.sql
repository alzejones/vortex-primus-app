-- ============================================================
-- FASE 5: Vínculo automático clients.user_id ao aceitar convite
-- ============================================================

-- Quando o aluno aceita o convite e cria a senha, o Supabase
-- insere em auth.users com raw_user_meta_data contendo:
--   { "role": "client", "client_id": "<uuid>" }
-- Este trigger lê esse metadata e preenche clients.user_id.

CREATE OR REPLACE FUNCTION link_client_user_id()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_client_id uuid;
BEGIN
  -- Só age se o metadata indicar role=client com client_id válido
  v_client_id := (NEW.raw_user_meta_data->>'client_id')::uuid;

  IF v_client_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF (NEW.raw_user_meta_data->>'role') <> 'client' THEN
    RETURN NEW;
  END IF;

  -- Vincula apenas se ainda não tiver user_id (evita sobrescrever)
  UPDATE clients
     SET user_id = NEW.id
   WHERE id = v_client_id
     AND user_id IS NULL;

  RETURN NEW;
END;
$$;

-- Dispara no INSERT (primeiro login após aceitar convite)
-- e no UPDATE (caso o Supabase atualize o registro ao confirmar email)
DROP TRIGGER IF EXISTS trg_link_client_user_id ON auth.users;
CREATE TRIGGER trg_link_client_user_id
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION link_client_user_id();
