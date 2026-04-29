-- Migration: fix_handle_new_user_robust
-- Problema: Função handle_new_user() em 20260412000001_fix_handle_new_user_role_check.sql
-- não está preenchendo o campo 'name' obrigatório, causando erro "Database error saving new user"
-- quando usuários fazem login via Google OAuth.
--
-- Diagnóstico:
--   1. Tabela trainers.name é NOT NULL na baseline
--   2. Função atual só faz INSERT com (id, user_id, email)
--   3. Google OAuth envia raw_user_meta_data com 'name' ou 'full_name'
--   4. Trigger falha por violação de constraint NOT NULL
--
-- Correção:
--   1. Função mais robusta que extrai name/full_name do Google
--   2. Fallback para email (parte antes do @) se metadados não existirem
--   3. Mantém proteção contra criação de trainers para role='client'

-- Corrige a função handle_new_user() com robustez completa
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  extracted_name text;
BEGIN
  -- Alunos convidados chegam com role = 'client' no raw_user_meta_data.
  -- Não criar registro em trainers para eles.
  IF (NEW.raw_user_meta_data->>'role') = 'client' THEN
    RETURN NEW;
  END IF;

  -- Extração robusta do nome do usuário (Google OAuth)
  -- Prioridade: full_name > name > email_prefix
  extracted_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1),
    'Novo Treinador'
  );

  INSERT INTO public.trainers (id, user_id, name, email)
  VALUES (gen_random_uuid(), NEW.id, extracted_name, NEW.email);

  RETURN NEW;
END;
$$;