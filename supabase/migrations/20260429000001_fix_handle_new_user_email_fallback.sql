-- Migration: fix_handle_new_user_email_fallback
-- Data: 29/04/2026
-- 
-- Problema: handle_new_user() está falhando para cadastros email/senha porque:
--   1. raw_user_meta_data vem vazio/null para auth nativo
--   2. Coluna trainers.name é NOT NULL
--   3. Função atual não tem fallback adequado
--
-- Solução: Função robusta com ordem de prioridade:
--   1. full_name (Google OAuth)
--   2. name (outros OAuth)  
--   3. split_part(email, '@', 1) (prefixo do email)
--   4. 'Novo Treinador' (fallback final)
--
-- Mantém proteção contra criação de trainers para role='client'

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  extracted_name text;
BEGIN
  -- Proteção: Alunos convidados chegam com role = 'client' no raw_user_meta_data.
  -- Não criar registro em trainers para eles.
  IF (NEW.raw_user_meta_data->>'role') = 'client' THEN
    RETURN NEW;
  END IF;

  -- Extração robusta do nome com fallbacks em cascata
  -- Ordem de prioridade: full_name > name > email_prefix > fallback_seguro
  extracted_name := COALESCE(
    NULLIF(trim(NEW.raw_user_meta_data->>'full_name'), ''),
    NULLIF(trim(NEW.raw_user_meta_data->>'name'), ''),
    NULLIF(trim(split_part(NEW.email, '@', 1)), ''),
    'Novo Treinador'
  );

  -- Garantir que extracted_name nunca seja NULL ou vazio
  IF extracted_name IS NULL OR extracted_name = '' THEN
    extracted_name := 'Novo Treinador';
  END IF;

  INSERT INTO public.trainers (id, user_id, name, email)
  VALUES (gen_random_uuid(), NEW.id, extracted_name, NEW.email);

  RETURN NEW;
END;
$$;