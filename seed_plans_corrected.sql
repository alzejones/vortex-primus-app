DO $$
DECLARE
  trainer_uuid uuid;
  plan_teste_uuid uuid;
BEGIN
  SELECT id INTO trainer_uuid 
  FROM public.trainers 
  LIMIT 1;
  
  IF trainer_uuid IS NULL THEN
    RAISE EXCEPTION 'Nenhum treinador encontrado na tabela trainers';
  END IF;
  
  RAISE NOTICE 'Treinador encontrado: %', trainer_uuid;
  
  INSERT INTO public.plans (id, trainer_id, name, price_cents, max_clients, features)
  VALUES (
    gen_random_uuid(),
    trainer_uuid,
    'Teste',
    0,
    50,
    '["Acesso básico", "Suporte limitado"]'::jsonb
  )
  RETURNING id INTO plan_teste_uuid;
  
  INSERT INTO public.plans (trainer_id, name, price_cents, max_clients, features)
  VALUES (
    trainer_uuid,
    'Iniciando',
    2990,
    99,
    '["Recursos completos", "Suporte por email"]'::jsonb
  );
  
  INSERT INTO public.plans (trainer_id, name, price_cents, max_clients, features)
  VALUES (
    trainer_uuid,
    'Escalando',
    3990,
    299,
    '["Recursos avançados", "Suporte prioritário", "Relatórios detalhados"]'::jsonb
  );
  
  INSERT INTO public.plans (trainer_id, name, price_cents, max_clients, features)
  VALUES (
    trainer_uuid,
    'Livre',
    5990,
    99999,
    '["Todos os recursos", "Suporte 24/7", "API personalizada"]'::jsonb
  );
  
  INSERT INTO public.trainer_subscriptions (trainer_id, plan_id, status, started_at)
  VALUES (
    trainer_uuid,
    plan_teste_uuid,
    'active',
    now()
  );
  
  RAISE NOTICE 'Script executado com sucesso!';
END $$;