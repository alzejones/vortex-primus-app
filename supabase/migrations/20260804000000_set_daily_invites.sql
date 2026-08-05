-- set_daily_invites: define contagem absoluta de convites do dia
create or replace function public.set_daily_invites(p_trainer_id uuid, p_count integer)
returns integer
language plpgsql
as $$
declare
  v_new_count integer;
  v_today date := (now() at time zone 'America/Sao_Paulo')::date;
begin
  insert into herbalife_daily_invites (trainer_id, invite_date, count)
  values (p_trainer_id, v_today, greatest(p_count, 0))
  on conflict (trainer_id, invite_date)
  do update set count = greatest(p_count, 0), updated_at = now()
  returning count into v_new_count;
  return v_new_count;
end;
$$;
