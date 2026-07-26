-- RPC de produtividade dos downlines para o Painel do Presidente Herbalife.
-- Replica EXATAMENTE a lógica de contagem da tela business-goals.tsx:
--   Agendamentos: appointments por created_at (fuso America/Sao_Paulo) no mês civil
--   Avaliações:   physical_assessments por assessment_date no mês civil
CREATE OR REPLACE FUNCTION public.get_downline_productivity()
RETURNS TABLE (
  downline_trainer_id uuid,
  downline_name text,
  downline_email text,
  downline_phone text,
  meta_agendamentos integer,
  meta_avaliacoes integer,
  agendamentos_mes bigint,
  avaliacoes_mes bigint,
  agendamentos_mes_anterior bigint,
  avaliacoes_mes_anterior bigint,
  agendamentos_serie bigint[],
  avaliacoes_serie bigint[],
  total_alunos bigint,
  ultima_avaliacao date
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $
WITH me AS (
  SELECT public.normalize_phone_br(t.phone) AS my_phone
  FROM public.trainers t
  WHERE t.user_id = auth.uid()
),
tz AS (
  SELECT date_trunc('month', (now() AT TIME ZONE 'America/Sao_Paulo'))::date AS cur_month
),
d AS (
  SELECT t.id, t.name, t.email, t.phone
  FROM public.trainers t, me
  WHERE t.is_herbalife_consultant = true
    AND me.my_phone IS NOT NULL
    AND public.normalize_phone_br(t.herbalife_president_phone) = me.my_phone
)
SELECT
  d.id,
  d.name,
  d.email,
  d.phone,
  COALESCE(g.monthly_scheduled_goal, 0),
  COALESCE(g.monthly_completed_goal, 0),
  (SELECT count(*) FROM public.appointments a, tz
     WHERE a.trainer_id = d.id
       AND (a.created_at AT TIME ZONE 'America/Sao_Paulo')::date >= tz.cur_month
       AND (a.created_at AT TIME ZONE 'America/Sao_Paulo')::date < (tz.cur_month + interval '1 month')::date),
  (SELECT count(*) FROM public.physical_assessments p, tz
     WHERE p.trainer_id = d.id
       AND p.assessment_date >= tz.cur_month
       AND p.assessment_date < (tz.cur_month + interval '1 month')::date),
  (SELECT count(*) FROM public.appointments a, tz
     WHERE a.trainer_id = d.id
       AND (a.created_at AT TIME ZONE 'America/Sao_Paulo')::date >= (tz.cur_month - interval '1 month')::date
       AND (a.created_at AT TIME ZONE 'America/Sao_Paulo')::date < tz.cur_month),
  (SELECT count(*) FROM public.physical_assessments p, tz
     WHERE p.trainer_id = d.id
       AND p.assessment_date >= (tz.cur_month - interval '1 month')::date
       AND p.assessment_date < tz.cur_month),
  (SELECT array_agg(s.c ORDER BY s.m)
     FROM (
       SELECT m.m,
              (SELECT count(*) FROM public.appointments a
                WHERE a.trainer_id = d.id
                  AND (a.created_at AT TIME ZONE 'America/Sao_Paulo')::date >= m.m
                  AND (a.created_at AT TIME ZONE 'America/Sao_Paulo')::date < (m.m + interval '1 month')::date) AS c
       FROM (SELECT ((SELECT cur_month FROM tz) - (i || ' months')::interval)::date AS m
             FROM generate_series(5, 0, -1) AS i) m
     ) s),
  (SELECT array_agg(s.c ORDER BY s.m)
     FROM (
       SELECT m.m,
              (SELECT count(*) FROM public.physical_assessments p
                WHERE p.trainer_id = d.id
                  AND p.assessment_date >= m.m
                  AND p.assessment_date < (m.m + interval '1 month')::date) AS c
       FROM (SELECT ((SELECT cur_month FROM tz) - (i || ' months')::interval)::date AS m
             FROM generate_series(5, 0, -1) AS i) m
     ) s),
  (SELECT count(*) FROM public.clients c WHERE c.trainer_id = d.id),
  (SELECT max(p.assessment_date) FROM public.physical_assessments p WHERE p.trainer_id = d.id)
FROM d
LEFT JOIN public.trainer_goals g ON g.trainer_id = d.id
ORDER BY d.name;
$;

REVOKE EXECUTE ON FUNCTION public.get_downline_productivity() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_downline_productivity() TO authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.get_downline_stats() FROM PUBLIC, anon;
