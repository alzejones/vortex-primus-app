-- ============================================================
-- Migration: get_downline_business_reports
-- Função SECURITY DEFINER para Presidente visualizar relatórios
-- de negócio (vendas, PV, lucro, convites) dos seus Downlines
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_downline_business_reports(
  target_trainer_id uuid DEFAULT NULL
)
RETURNS TABLE (
  trainer_id uuid,
  trainer_name text,
  report_date date,
  convites integer,
  entraram bigint,
  novos bigint,
  indicacoes bigint,
  acessos bigint,
  ganhos numeric,
  pv numeric
)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  WITH me AS (
    SELECT public.normalize_phone_br(t.phone) AS my_phone
    FROM public.trainers t
    WHERE t.user_id = auth.uid()
  ),
  downlines AS (
    SELECT t.id, t.name
    FROM public.trainers t, me
    WHERE t.is_herbalife_consultant = true
      AND me.my_phone IS NOT NULL
      AND public.normalize_phone_br(t.herbalife_president_phone) = me.my_phone
      AND (target_trainer_id IS NULL OR t.id = target_trainer_id)
  )
  SELECT
    d.id AS trainer_id,
    d.name AS trainer_name,
    dates.report_date,
    COALESCE(inv.count, 0) AS convites,
    COALESCE(ent.entraram, 0::bigint) AS entraram,
    COALESCE(nov.novos, 0::bigint) AS novos,
    COALESCE(ref.indicacoes, 0::bigint) AS indicacoes,
    COALESCE(acs.acessos, 0::bigint) AS acessos,
    COALESCE(gan.ganhos, 0::numeric) AS ganhos,
    COALESCE(gan.pv, 0::numeric) AS pv
  FROM downlines d
  CROSS JOIN LATERAL (
    SELECT DISTINCT herbalife_sales.sale_date AS report_date
    FROM public.herbalife_sales
    WHERE herbalife_sales.trainer_id = d.id
    UNION
    SELECT DISTINCT herbalife_daily_invites.invite_date
    FROM public.herbalife_daily_invites
    WHERE herbalife_daily_invites.trainer_id = d.id
    UNION
    SELECT DISTINCT appointments.appointment_date
    FROM public.appointments
    WHERE appointments.trainer_id = d.id
    UNION
    SELECT DISTINCT clients.created_at::date
    FROM public.clients
    WHERE clients.trainer_id = d.id
    UNION
    SELECT DISTINCT herbalife_referrals.referral_date
    FROM public.herbalife_referrals
    WHERE herbalife_referrals.trainer_id = d.id
  ) dates
  LEFT JOIN public.herbalife_daily_invites inv 
    ON inv.trainer_id = d.id AND inv.invite_date = dates.report_date
  LEFT JOIN (
    SELECT appointments.trainer_id,
           appointments.appointment_date,
           count(*) AS entraram
    FROM public.appointments
    GROUP BY appointments.trainer_id, appointments.appointment_date
  ) ent ON ent.trainer_id = d.id AND ent.appointment_date = dates.report_date
  LEFT JOIN (
    SELECT clients.trainer_id,
           clients.created_at::date AS created_date,
           count(*) AS novos
    FROM public.clients
    GROUP BY clients.trainer_id, clients.created_at::date
  ) nov ON nov.trainer_id = d.id AND nov.created_date = dates.report_date
  LEFT JOIN (
    SELECT herbalife_referrals.trainer_id,
           herbalife_referrals.referral_date,
           count(*) AS indicacoes
    FROM public.herbalife_referrals
    GROUP BY herbalife_referrals.trainer_id, herbalife_referrals.referral_date
  ) ref ON ref.trainer_id = d.id AND ref.referral_date = dates.report_date
  LEFT JOIN (
    SELECT herbalife_sales.trainer_id,
           herbalife_sales.sale_date,
           count(*) AS acessos
    FROM public.herbalife_sales
    WHERE herbalife_sales.sale_type = 'acesso'::text
    GROUP BY herbalife_sales.trainer_id, herbalife_sales.sale_date
  ) acs ON acs.trainer_id = d.id AND acs.sale_date = dates.report_date
  LEFT JOIN (
    SELECT herbalife_sales.trainer_id,
           herbalife_sales.sale_date,
           sum(herbalife_sales.total_profit) AS ganhos,
           sum(herbalife_sales.total_pv) AS pv
    FROM public.herbalife_sales
    GROUP BY herbalife_sales.trainer_id, herbalife_sales.sale_date
  ) gan ON gan.trainer_id = d.id AND gan.sale_date = dates.report_date
  ORDER BY dates.report_date DESC, d.name;
$$;

COMMENT ON FUNCTION public.get_downline_business_reports IS 
'Retorna dados diários de negócio (vendas, PV, convites, etc.) dos downlines do Presidente logado. target_trainer_id NULL = todos downlines; preenchido = apenas aquele downline.';
