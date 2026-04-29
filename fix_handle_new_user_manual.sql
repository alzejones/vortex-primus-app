-- SQL PARA EXECUTAR MANUALMENTE NO SUPABASE SQL EDITOR
-- Corrige handle_new_user() para preencher campo 'name' obrigatório
-- 
-- INSTRUÇÕES:
-- 1. Acesse https://supabase.com/dashboard/project/rwyyvilshrjhfwlzudqg/sql/new
-- 2. Cole este código e clique em "Run"
-- 3. Delete o usuário órfão em Authentication > Users
-- 4. Teste login novamente

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