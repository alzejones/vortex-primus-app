// ============================================================
// herbalife-team.tsx — Painel da Equipe Herbalife
// Dashboard completo de produtividade dos downlines com ranking,
// destaques, sparklines e reconhecimento via WhatsApp
// + Relatórios de negócio (vendas, PV, convites) dos downlines
// ============================================================
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { T } from '../../utils/theme';
import { GradientPrimary } from '../../utils/gradients';
import { FeatureGate } from '../../components/FeatureGate';
import { useLicenseStatus } from '../../hooks/useLicenseStatus';
import { computeTrend } from '../../utils/goalCalculations';
import TeamSparkline from '../../components/TeamSparkline';

interface DownlineData {
  downline_trainer_id: string;
  downline_name: string;
  downline_email: string;
  downline_phone: string | null;
  meta_agendamentos: number;
  meta_avaliacoes: number;
  agendamentos_mes: string;
  avaliacoes_mes: string;
  agendamentos_mes_anterior: string;
  avaliacoes_mes_anterior: string;
  agendamentos_serie: string[] | null;
  avaliacoes_serie: string[] | null;
  total_alunos: string;
  ultima_avaliacao: string | null;
}

interface ProcessedDownline {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  metaAgendamentos: number;
  metaAvaliacoes: number;
  agendamentosMes: number;
  avaliacoesMes: number;
  deltaMoM: number;
  pctAgend: number | null;
  pctAval: number | null;
  execucao: number | null;
  trendAgend: ReturnType<typeof computeTrend>;
  trendAval: ReturnType<typeof computeTrend>;
  statusGeral: 'on-track' | 'warning' | 'risk' | null;
  avaliacoesSerie: number[];
  totalAlunos: number;
  diasSemAvaliar: number | null;
}

interface BusinessReportRow {
  trainer_id: string;
  trainer_name: string;
  report_date: string;
  convites: number;
  entraram: number;
  novos: number;
  repetidores: number;
  apresentacoes: number;
  resets: number;
  indicacoes: number;
  acessos: number;
  ganhos: number;
  pv: number;
}

interface WeeklyReportRow {
  trainer_id: string;
  trainer_name: string;
  week_start: string;
  week_end: string;
  dias_com_dados: number;
  acessos_media: number;
  ganho_semanal: number;
  estimado_mensal: number;
}

interface MonthlyReportRow {
  trainer_id: string;
  trainer_name: string;
  month_start: string;
  acessos_media: number;
  pvt: number;
  ganhos: number;
  tendencia_pvt: number;
  tendencia_ganhos: number;
}

type Tab = 'produtividade' | 'relatorios';

export default function HerbalifeTeam() {
  const router = useRouter();
  const { hasFeature } = useLicenseStatus();
  const [tab, setTab] = useState<Tab>('produtividade');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [downlines, setDownlines] = useState<ProcessedDownline[]>([]);
  const [businessReports, setBusinessReports] = useState<BusinessReportRow[]>([]);
  const [weeklyReports, setWeeklyReports] = useState<WeeklyReportRow[]>([]);
  const [monthlyReports, setMonthlyReports] = useState<MonthlyReportRow[]>([]);
  const [businessLoading, setBusinessLoading] = useState(false);
  const [selectedDownlineId, setSelectedDownlineId] = useState<string | null>(null);

  useFocusEffect(useCallback(() => { loadData(); }, []));

  async function loadData() {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_downline_productivity');
      if (error) throw error;

      const processed: ProcessedDownline[] = (data || []).map((d: DownlineData) => {
        const metaAgendamentos = d.meta_agendamentos || 0;
        const metaAvaliacoes = d.meta_avaliacoes || 0;
        const agendamentosMes = Number(d.agendamentos_mes);
        const avaliacoesMes = Number(d.avaliacoes_mes);
        const agendamentosMesAnt = Number(d.agendamentos_mes_anterior);
        const avaliacoesMesAnt = Number(d.avaliacoes_mes_anterior);
        const deltaMoM =
          (agendamentosMes + avaliacoesMes) -
          (agendamentosMesAnt + avaliacoesMesAnt);

        const pctAgend = metaAgendamentos > 0 ? agendamentosMes / metaAgendamentos : null;
        const pctAval = metaAvaliacoes > 0 ? avaliacoesMes / metaAvaliacoes : null;
        const pcts = [pctAgend, pctAval].filter((p) => p !== null) as number[];
        const execucao = pcts.length > 0 ? pcts.reduce((a, b) => a + b, 0) / pcts.length : null;

        const trendAgend = computeTrend(metaAgendamentos, agendamentosMes);
        const trendAval = computeTrend(metaAvaliacoes, avaliacoesMes);

        let statusGeral: 'on-track' | 'warning' | 'risk' | null = null;
        if (trendAgend || trendAval) {
          const statuses = [trendAgend?.status, trendAval?.status].filter(Boolean);
          if (statuses.includes('risk')) statusGeral = 'risk';
          else if (statuses.includes('warning')) statusGeral = 'warning';
          else if (statuses.includes('on-track')) statusGeral = 'on-track';
        }

        const avaliacoesSerie = (d.avaliacoes_serie || []).map(Number);
        const totalAlunos = Number(d.total_alunos);

        let diasSemAvaliar: number | null = null;
        if (d.ultima_avaliacao) {
          const ultima = new Date(d.ultima_avaliacao);
          const agora = new Date();
          diasSemAvaliar = Math.floor((agora.getTime() - ultima.getTime()) / (1000 * 60 * 60 * 24));
        }

        return {
          id: d.downline_trainer_id,
          name: d.downline_name,
          email: d.downline_email,
          phone: d.downline_phone,
          metaAgendamentos,
          metaAvaliacoes,
          agendamentosMes,
          avaliacoesMes,
          deltaMoM,
          pctAgend,
          pctAval,
          execucao,
          trendAgend,
          trendAval,
          statusGeral,
          avaliacoesSerie,
          totalAlunos,
          diasSemAvaliar,
        };
      });

      const withMeta = processed.filter((d) => d.execucao !== null);
      const withoutMeta = processed.filter((d) => d.execucao === null);
      withMeta.sort((a, b) => (b.execucao || 0) - (a.execucao || 0));
      withoutMeta.sort((a, b) => (b.agendamentosMes + b.avaliacoesMes) - (a.agendamentosMes + a.avaliacoesMes));

      setDownlines([...withMeta, ...withoutMeta]);
    } catch (err) {
      console.error('Erro ao carregar equipe:', err);
      setDownlines([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function loadBusinessReports() {
    try {
      setBusinessLoading(true);
      const [daily, weekly, monthly] = await Promise.all([
        supabase.rpc('get_downline_business_reports'),
        supabase.rpc('get_downline_weekly_report'),
        supabase.rpc('get_downline_monthly_report'),
      ]);
      if (daily.error) throw daily.error;
      if (weekly.error) throw weekly.error;
      if (monthly.error) throw monthly.error;
      setBusinessReports(daily.data || []);
      setWeeklyReports(weekly.data || []);
      setMonthlyReports(monthly.data || []);
    } catch (err) {
      console.error('Erro ao carregar relatórios:', err);
      setBusinessReports([]);
      setWeeklyReports([]);
      setMonthlyReports([]);
    } finally {
      setBusinessLoading(false);
      setRefreshing(false);
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    if (tab === 'produtividade') {
      await loadData();
    } else {
      await loadBusinessReports();
    }
  }

  function handleTabChange(newTab: Tab) {
    setTab(newTab);
    if (newTab === 'relatorios' && businessReports.length === 0) {
      loadBusinessReports();
    }
  }

  function handleWhatsApp(downline: ProcessedDownline) {
    if (!downline.phone) return;

    const phone = downline.phone.replace(/\D/g, '');
    let mensagem = '';

    if (downline.statusGeral === 'on-track') {
      mensagem = `Olá ${downline.name}! 🎉\n\nParabéns pelo ritmo excelente este mês! Você já conquistou ${downline.agendamentosMes} agendamentos e ${downline.avaliacoesMes} avaliações. Continue assim, você está arrasando! 🚀`;
    } else if (downline.statusGeral === 'warning') {
      mensagem = `Oi ${downline.name}! 💪\n\nVi que você está com ${downline.agendamentosMes} agendamentos e ${downline.avaliacoesMes} avaliações este mês. Vamos acelerar juntos para alcançar suas metas? Conte comigo! 🔥`;
    } else if (downline.statusGeral === 'risk') {
      mensagem = `Oi ${downline.name}! 🤝\n\nEstou aqui para te apoiar. Como posso te ajudar a melhorar seus resultados este mês? Vamos conversar e alinhar estratégias juntos!`;
    } else {
      mensagem = `Olá ${downline.name}! 👋\n\nTudo bem? Vamos conversar sobre suas metas e como posso te apoiar nessa jornada?`;
    }

    try {
      Linking.openURL(`whatsapp://send?phone=55${phone}&text=${encodeURIComponent(mensagem)}`);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível abrir o WhatsApp');
    }
  }

  function handleShareApp() {
    const mensagem = `🚀 Olá! Conheça o Vortex Primus, o app completo para Personal Trainers gerenciarem clientes, avaliações, dietas e muito mais!\n\nCadastre-se como Consultor Independente Herbalife e conecte-se à minha equipe. Acesse: https://vortex-primus.vercel.app`;

    try {
      Linking.openURL(`whatsapp://send?text=${encodeURIComponent(mensagem)}`);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível abrir o WhatsApp.');
    }
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={T.blue} />
      </View>
    );
  }

  const monthName = new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);

  const totalAgendGrupo = downlines.reduce((sum, d) => sum + d.agendamentosMes, 0);
  const totalAvalGrupo = downlines.reduce((sum, d) => sum + d.avaliacoesMes, 0);
  const metaTotalAgend = downlines.reduce((sum, d) => sum + d.metaAgendamentos, 0);
  const metaTotalAval = downlines.reduce((sum, d) => sum + d.metaAvaliacoes, 0);

  const withMeta = downlines.filter((d) => d.execucao !== null);
  const execucaoGrupo =
    withMeta.length > 0
      ? Math.round(withMeta.reduce((sum, d) => sum + (d.execucao || 0), 0) / withMeta.length * 100)
      : 0;

  const deltaTotalGrupo = downlines.reduce((sum, d) => sum + d.deltaMoM, 0);

  const destaqueMes = withMeta.length > 0 ? withMeta[0] : null;
  const maiorEvolucao = downlines.length > 0
    ? downlines.reduce((max, d) => (d.deltaMoM > max.deltaMoM ? d : max))
    : null;
  const precisaApoio = withMeta.find((d) => (d.execucao || 0) < 0.6);

  const showDestaques = downlines.length >= 2;

  const trendGrupoAgend = computeTrend(metaTotalAgend, totalAgendGrupo);
  const trendGrupoAval = computeTrend(metaTotalAval, totalAvalGrupo);

  if (!hasFeature('downline_stats')) {
    return (
      <View style={{ flex: 1, backgroundColor: T.bg, padding: 16 }}>
        <FeatureGate
          featureKey="downline_stats"
          featureName="Painel de Downlines"
          requiredPlan="Escalando"
        >
          <View />
        </FeatureGate>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>EQUIPE HERBALIFE</Text>
        <Text style={styles.title}>Painel da Equipe</Text>
        <Text style={styles.subtitle}>
          {capitalizedMonth} · {downlines.length} {downlines.length === 1 ? 'consultor ativo' : 'consultores ativos'}
        </Text>
      </View>

      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'produtividade' && styles.tabBtnActive]}
          onPress={() => handleTabChange('produtividade')}
        >
          <Text style={[styles.tabText, tab === 'produtividade' && styles.tabTextActive]}>Produtividade</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'relatorios' && styles.tabBtnActive]}
          onPress={() => handleTabChange('relatorios')}
        >
          <Text style={[styles.tabText, tab === 'relatorios' && styles.tabTextActive]}>Relatórios</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={T.blue} />}
      >
        {tab === 'produtividade' ? (
          <>
            <Text style={styles.helperNote}>Previsto = ritmo esperado até hoje · Tendência = fechamento estimado no ritmo atual</Text>

            {downlines.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>👥</Text>
                <Text style={styles.emptyTitle}>Sua equipe ainda não está conectada</Text>
                <Text style={styles.emptyText}>
                  Os consultores precisam ativar "Sou Consultor Independente Herbalife" no perfil e informar o seu celular como Presidente.
                </Text>
                <TouchableOpacity style={styles.shareBtn} onPress={handleShareApp}>
                  <Text style={styles.shareBtnText}>Compartilhar o Vortex Primus</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <LinearGradient {...GradientPrimary} style={styles.heroCard}>
                  <View style={styles.heroRow}>
                    <Text style={styles.heroLabel}>📅 Agendamentos</Text>
                    <View style={styles.statGrid}>
                      <View style={styles.statCol}>
                        <Text style={styles.statCaption}>META</Text>
                        <Text style={styles.statValue}>{metaTotalAgend}</Text>
                      </View>
                      <View style={styles.statCol}>
                        <Text style={styles.statCaption}>PREVISTO</Text>
                        <Text style={styles.statValue}>
                          {trendGrupoAgend ? trendGrupoAgend.expected : '—'}
                        </Text>
                      </View>
                      <View style={styles.statCol}>
                        <Text style={styles.statCaption}>REALIZADO</Text>
                        <Text style={styles.statValue}>{totalAgendGrupo}</Text>
                      </View>
                      <View style={styles.statCol}>
                        <Text style={styles.statCaption}>TENDÊNCIA</Text>
                        <Text style={[styles.statValue, { color: trendGrupoAgend ? trendGrupoAgend.color : 'rgba(255,255,255,0.5)' }]}>
                          {trendGrupoAgend ? trendGrupoAgend.projection : '—'}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.progressBar}>
                      <View
                        style={[
                          styles.progressFill,
                          {
                            width: metaTotalAgend > 0 ? `${Math.min((totalAgendGrupo / metaTotalAgend) * 100, 100)}%` : '0%',
                            backgroundColor: T.blue,
                          },
                        ]}
                      />
                    </View>
                  </View>

                  <View style={[styles.heroRow, { marginTop: 16 }]}>
                    <Text style={styles.heroLabel}>✅ Avaliações</Text>
                    <View style={styles.statGrid}>
                      <View style={styles.statCol}>
                        <Text style={styles.statCaption}>META</Text>
                        <Text style={styles.statValue}>{metaTotalAval}</Text>
                      </View>
                      <View style={styles.statCol}>
                        <Text style={styles.statCaption}>PREVISTO</Text>
                        <Text style={styles.statValue}>
                          {trendGrupoAval ? trendGrupoAval.expected : '—'}
                        </Text>
                      </View>
                      <View style={styles.statCol}>
                        <Text style={styles.statCaption}>REALIZADO</Text>
                        <Text style={styles.statValue}>{totalAvalGrupo}</Text>
                      </View>
                      <View style={styles.statCol}>
                        <Text style={styles.statCaption}>TENDÊNCIA</Text>
                        <Text style={[styles.statValue, { color: trendGrupoAval ? trendGrupoAval.color : 'rgba(255,255,255,0.5)' }]}>
                          {trendGrupoAval ? trendGrupoAval.projection : '—'}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.progressBar}>
                      <View
                        style={[
                          styles.progressFill,
                          {
                            width: metaTotalAval > 0 ? `${Math.min((totalAvalGrupo / metaTotalAval) * 100, 100)}%` : '0%',
                            backgroundColor: T.green,
                          },
                        ]}
                      />
                    </View>
                  </View>

                  <View style={styles.heroDivider} />

                  <Text style={styles.heroExecLabel}>Execução do Grupo</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', gap: 8 }}>
                    <Text style={styles.heroExecValue}>{execucaoGrupo}%</Text>
                    <View
                      style={[
                        styles.heroChip,
                        { backgroundColor: deltaTotalGrupo >= 0 ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)' },
                      ]}
                    >
                      <Text style={{ color: deltaTotalGrupo >= 0 ? T.green : T.red, fontSize: 12, fontWeight: '800' }}>
                        {deltaTotalGrupo >= 0 ? '▲' : '▼'} {Math.abs(deltaTotalGrupo)} vs mês anterior
                      </Text>
                    </View>
                  </View>
                </LinearGradient>

                {showDestaques && (
                  <View style={styles.destaquesContainer}>
                    <Text style={styles.destaquesTitle}>Destaques do Mês</Text>
                    <View style={styles.destaquesRow}>
                      {destaqueMes && (
                        <View style={styles.destaqueCard}>
                          <Text style={styles.destaqueIcon}>🏆</Text>
                          <Text style={styles.destaqueLabel}>Destaque do Mês</Text>
                          <Text style={styles.destaqueValue}>
                            {destaqueMes.name.split(' ')[0]} · {Math.round((destaqueMes.execucao || 0) * 100)}%
                          </Text>
                        </View>
                      )}
                      {maiorEvolucao && maiorEvolucao.deltaMoM > 0 && (
                        <View style={styles.destaqueCard}>
                          <Text style={styles.destaqueIcon}>🚀</Text>
                          <Text style={styles.destaqueLabel}>Maior Evolução</Text>
                          <Text style={styles.destaqueValue}>
                            {maiorEvolucao.name.split(' ')[0]} · +{maiorEvolucao.deltaMoM}
                          </Text>
                        </View>
                      )}
                      {precisaApoio && (
                        <View style={[styles.destaqueCard, { borderColor: 'rgba(245,158,11,0.3)' }]}>
                          <Text style={styles.destaqueIcon}>🤝</Text>
                          <Text style={styles.destaqueLabel}>Precisa de Apoio</Text>
                          <Text style={styles.destaqueValue}>
                            {precisaApoio.name.split(' ')[0]} · {Math.round((precisaApoio.execucao || 0) * 100)}%
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                )}

                <Text style={styles.rankingTitle}>Ranking da Equipe</Text>

                {downlines.map((downline, idx) => {
                  const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`;
                  const initials = downline.name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase();

                  let atividadeLabel = '';
                  let atividadeColor = T.t3;
                  if (downline.diasSemAvaliar === null) {
                    atividadeLabel = 'Sem avaliações';
                    atividadeColor = T.t3;
                  } else if (downline.diasSemAvaliar <= 7) {
                    atividadeLabel = 'Ativo';
                    atividadeColor = T.green;
                  } else if (downline.diasSemAvaliar <= 30) {
                    atividadeLabel = `Há ${downline.diasSemAvaliar} dias`;
                    atividadeColor = T.orange;
                  } else {
                    atividadeLabel = `Inativo há ${downline.diasSemAvaliar} dias`;
                    atividadeColor = T.red;
                  }

                  const statusChip = downline.trendAgend || downline.trendAval
                    ? (downline.trendAgend || downline.trendAval)
                    : null;

                  return (
                    <View key={downline.id} style={styles.rankCard}>
                      <View style={styles.rankHeader}>
                        <Text style={styles.rankMedal}>{medal}</Text>
                        <View style={styles.rankAvatar}>
                          <Text style={styles.rankAvatarText}>{initials}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.rankName}>{downline.name}</Text>
                          {statusChip ? (
                            <View style={[styles.statusChip, { backgroundColor: statusChip.color + '22' }]}>
                              <Text style={{ color: statusChip.color, fontSize: 11, fontWeight: '800' }}>
                                {statusChip.label}
                              </Text>
                            </View>
                          ) : (
                            <View style={[styles.statusChip, { backgroundColor: 'rgba(100,116,139,0.15)' }]}>
                              <Text style={{ color: T.t3, fontSize: 11, fontWeight: '800' }}>Sem meta definida</Text>
                            </View>
                          )}
                        </View>
                      </View>

                      <View style={styles.metricsRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.miniStatCaption}>📅 AGENDAMENTOS</Text>
                          <View style={styles.miniStatGrid}>
                            <View style={styles.miniStatCol}>
                              <Text style={styles.miniStatLabel}>Meta</Text>
                              <Text style={styles.miniStatNum}>{downline.metaAgendamentos}</Text>
                            </View>
                            <View style={styles.miniStatCol}>
                              <Text style={styles.miniStatLabel}>Previsto</Text>
                              <Text style={styles.miniStatNum}>
                                {downline.trendAgend ? downline.trendAgend.expected : '—'}
                              </Text>
                            </View>
                            <View style={styles.miniStatCol}>
                              <Text style={styles.miniStatLabel}>Feito</Text>
                              <Text style={styles.miniStatNum}>{downline.agendamentosMes}</Text>
                            </View>
                            <View style={styles.miniStatCol}>
                              <Text style={styles.miniStatLabel}>Tendência</Text>
                              <Text style={[styles.miniStatNum, { color: downline.trendAgend ? downline.trendAgend.color : T.t3 }]}>
                                {downline.trendAgend ? downline.trendAgend.projection : '—'}
                              </Text>
                            </View>
                          </View>
                          <View style={styles.miniProgressBar}>
                            <View
                              style={[
                                styles.miniProgressFill,
                                {
                                  width: downline.metaAgendamentos > 0
                                    ? `${Math.min((downline.agendamentosMes / downline.metaAgendamentos) * 100, 100)}%`
                                    : '0%',
                                  backgroundColor: T.blue,
                                },
                              ]}
                            />
                          </View>
                        </View>
                        <View style={{ width: 16 }} />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.miniStatCaption}>✅ AVALIAÇÕES</Text>
                          <View style={styles.miniStatGrid}>
                            <View style={styles.miniStatCol}>
                              <Text style={styles.miniStatLabel}>Meta</Text>
                              <Text style={styles.miniStatNum}>{downline.metaAvaliacoes}</Text>
                            </View>
                            <View style={styles.miniStatCol}>
                              <Text style={styles.miniStatLabel}>Previsto</Text>
                              <Text style={styles.miniStatNum}>
                                {downline.trendAval ? downline.trendAval.expected : '—'}
                              </Text>
                            </View>
                            <View style={styles.miniStatCol}>
                              <Text style={styles.miniStatLabel}>Feito</Text>
                              <Text style={styles.miniStatNum}>{downline.avaliacoesMes}</Text>
                            </View>
                            <View style={styles.miniStatCol}>
                              <Text style={styles.miniStatLabel}>Tendência</Text>
                              <Text style={[styles.miniStatNum, { color: downline.trendAval ? downline.trendAval.color : T.t3 }]}>
                                {downline.trendAval ? downline.trendAval.projection : '—'}
                              </Text>
                            </View>
                          </View>
                          <View style={styles.miniProgressBar}>
                            <View
                              style={[
                                styles.miniProgressFill,
                                {
                                  width: downline.metaAvaliacoes > 0
                                    ? `${Math.min((downline.avaliacoesMes / downline.metaAvaliacoes) * 100, 100)}%`
                                    : '0%',
                                  backgroundColor: T.green,
                                },
                              ]}
                            />
                          </View>
                        </View>
                      </View>

                      <View style={styles.sparklineRow}>
                        <TeamSparkline data={downline.avaliacoesSerie} color={T.green} />
                        <Text style={styles.sparklineLabel}>últimos 6 meses</Text>
                      </View>

                      <View style={styles.rankFooter}>
                        <Text style={styles.footerText}>👥 {downline.totalAlunos} alunos</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <View style={[styles.atividadeBolinha, { backgroundColor: atividadeColor }]} />
                          <Text style={[styles.footerText, { color: atividadeColor }]}>{atividadeLabel}</Text>
                        </View>
                      </View>

                      {downline.phone && (
                        <TouchableOpacity style={styles.whatsappBtn} onPress={() => handleWhatsApp(downline)}>
                          <Text style={styles.whatsappBtnText}>👏 Reconhecer</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  );
                })}
              </>
            )}
          </>
        ) : (
          <RelatoriosTab
            businessReports={businessReports}
            weeklyReports={weeklyReports}
            monthlyReports={monthlyReports}
            businessLoading={businessLoading}
            downlines={downlines}
            selectedDownlineId={selectedDownlineId}
            setSelectedDownlineId={setSelectedDownlineId}
          />
        )}
      </ScrollView>
    </View>
  );
}

function RelatoriosTab({
  businessReports,
  weeklyReports,
  monthlyReports,
  businessLoading,
  downlines,
  selectedDownlineId,
  setSelectedDownlineId,
}: {
  businessReports: BusinessReportRow[];
  weeklyReports: WeeklyReportRow[];
  monthlyReports: MonthlyReportRow[];
  businessLoading: boolean;
  downlines: ProcessedDownline[];
  selectedDownlineId: string | null;
  setSelectedDownlineId: (id: string | null) => void;
}) {
  const brl = (v: number) => `R$ ${Number(v || 0).toFixed(2).replace('.', ',')}`;
  const fmtDate = (d: string) => {
    const [y, m, day] = d.split('-');
    return `${day}/${m}`;
  };

  // Hook sempre no topo, antes de qualquer retorno condicional (Rules of Hooks) —
  // antes ficava declarado depois dos "if (loading) return", o que quebrava a
  // ordem dos hooks entre renders.
  const [viewMode, setViewMode] = React.useState<'diario' | 'semanal' | 'mensal'>('diario');
  const [selectedMonth, setSelectedMonth] = React.useState<string>(new Date().toISOString().slice(0, 7));
  const [showMonthPicker, setShowMonthPicker] = React.useState(false);

  const monthNames: Record<string, string> = {
    '01': 'Janeiro', '02': 'Fevereiro', '03': 'Março', '04': 'Abril',
    '05': 'Maio', '06': 'Junho', '07': 'Julho', '08': 'Agosto',
    '09': 'Setembro', '10': 'Outubro', '11': 'Novembro', '12': 'Dezembro',
  };

  if (businessLoading) {
    return (
      <View style={{ paddingVertical: 40, alignItems: 'center' }}>
        <ActivityIndicator size="large" color={T.blue} />
      </View>
    );
  }

  if (businessReports.length === 0) {
    return (
      <View style={{ paddingVertical: 40, alignItems: 'center' }}>
        <Text style={{ fontSize: 16, color: T.t2 }}>Nenhum dado de relatório disponível</Text>
      </View>
    );
  }

  const filteredReports = selectedDownlineId
    ? businessReports.filter((r) => r.trainer_id === selectedDownlineId)
    : businessReports;

  const dailyGrouped = filteredReports.reduce((acc, row) => {
    const existing = acc.find((g) => g.report_date === row.report_date);
    if (existing) {
      existing.convites += row.convites;
      existing.entraram += row.entraram;
      existing.novos += row.novos;
      existing.repetidores += row.repetidores;
      existing.apresentacoes += row.apresentacoes;
      existing.resets += row.resets;
      existing.indicacoes += row.indicacoes;
      existing.acessos += row.acessos;
      existing.ganhos += row.ganhos;
      existing.pv += row.pv;
    } else {
      acc.push({ ...row });
    }
    return acc;
  }, [] as BusinessReportRow[]);

  dailyGrouped.sort((a, b) => b.report_date.localeCompare(a.report_date));

  // Preencher todos os dias do mês selecionado (igual RelatoriosContent.tsx)
  function shiftDate(dateStr: string, delta: number): string {
    const [y, m, d] = dateStr.split('-').map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d));
    dt.setUTCDate(dt.getUTCDate() + delta);
    return dt.toISOString().split('T')[0];
  }

  const [y, m] = selectedMonth.split('-').map(Number);
  const firstDay = selectedMonth + '-01';
  const today = new Date().toISOString().split('T')[0];
  const isCurrentMonth = selectedMonth === today.slice(0, 7);
  const lastDay = isCurrentMonth ? today : new Date(y, m, 0).toISOString().split('T')[0];

  const dailyMap = new Map<string, BusinessReportRow>();
  dailyGrouped.forEach((row) => dailyMap.set(row.report_date, row));

  const dailyWithAllDays: BusinessReportRow[] = [];
  let current = lastDay;
  while (current >= firstDay) {
    const existing = dailyMap.get(current);
    dailyWithAllDays.push(existing || {
      trainer_id: '',
      trainer_name: '',
      report_date: current,
      convites: 0,
      entraram: 0,
      novos: 0,
      repetidores: 0,
      apresentacoes: 0,
      resets: 0,
      indicacoes: 0,
      acessos: 0,
      ganhos: 0,
      pv: 0,
    });
    current = shiftDate(current, -1);
  }

  // Semanal e Mensal agora vêm prontos do banco (get_downline_weekly_report /
  // get_downline_monthly_report) — mesma fórmula exata que o downline vê no
  // próprio login (v_herbalife_weekly/monthly). Nada é somado no cliente aqui.
  const filteredWeekly = (selectedDownlineId
    ? weeklyReports.filter((r) => r.trainer_id === selectedDownlineId)
    : weeklyReports
  ).slice().sort((a, b) => b.week_start.localeCompare(a.week_start));

  const filteredMonthly = (selectedDownlineId
    ? monthlyReports.filter((r) => r.trainer_id === selectedDownlineId)
    : monthlyReports
  ).slice().sort((a, b) => b.month_start.localeCompare(a.month_start));

  return (
    <View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity
            style={[styles.filterBtn, selectedDownlineId === null && styles.filterBtnActive]}
            onPress={() => setSelectedDownlineId(null)}
          >
            <Text style={[styles.filterBtnText, selectedDownlineId === null && styles.filterBtnTextActive]}>Todos</Text>
          </TouchableOpacity>
          {downlines.map((d) => (
            <TouchableOpacity
              key={d.id}
              style={[styles.filterBtn, selectedDownlineId === d.id && styles.filterBtnActive]}
              onPress={() => setSelectedDownlineId(d.id)}
            >
              <Text style={[styles.filterBtnText, selectedDownlineId === d.id && styles.filterBtnTextActive]}>
                {d.name.split(' ')[0]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
        <TouchableOpacity
          style={[styles.viewModeBtn, viewMode === 'diario' && styles.viewModeBtnActive]}
          onPress={() => setViewMode('diario')}
        >
          <Text style={[styles.viewModeBtnText, viewMode === 'diario' && styles.viewModeBtnTextActive]}>Diário</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.viewModeBtn, viewMode === 'semanal' && styles.viewModeBtnActive]}
          onPress={() => setViewMode('semanal')}
        >
          <Text style={[styles.viewModeBtnText, viewMode === 'semanal' && styles.viewModeBtnTextActive]}>Semanal</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.viewModeBtn, viewMode === 'mensal' && styles.viewModeBtnActive]}
          onPress={() => setViewMode('mensal')}
        >
          <Text style={[styles.viewModeBtnText, viewMode === 'mensal' && styles.viewModeBtnTextActive]}>Mensal</Text>
        </TouchableOpacity>
      </View>

      {viewMode === 'diario' && (
        <>
          <TouchableOpacity
            style={styles.monthSelector}
            onPress={() => setShowMonthPicker(!showMonthPicker)}
          >
            <Text style={styles.monthSelectorText}>
              {monthNames[selectedMonth.slice(5, 7)]}/{selectedMonth.slice(0, 4)}
            </Text>
            <Text style={styles.monthSelectorArrow}>{showMonthPicker ? '▲' : '▼'}</Text>
          </TouchableOpacity>

          {showMonthPicker && (
            <View style={styles.monthPickerContainer}>
              {Array.from({ length: 12 }, (_, i) => {
                const today = new Date();
                const targetDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
                const monthKey = targetDate.toISOString().slice(0, 7);
                const monthLabel = `${monthNames[monthKey.slice(5, 7)]}/${monthKey.slice(0, 4)}`;
                return (
                  <TouchableOpacity
                    key={monthKey}
                    style={[styles.monthPickerItem, selectedMonth === monthKey && styles.monthPickerItemActive]}
                    onPress={() => {
                      setSelectedMonth(monthKey);
                      setShowMonthPicker(false);
                    })
                  >
                    <Text style={[styles.monthPickerItemText, selectedMonth === monthKey && styles.monthPickerItemTextActive]}>
                      {monthLabel}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          <View style={styles.reportTable}>
            {dailyWithAllDays.length > 0 && (
              <View style={[styles.reportRow, { backgroundColor: '#1A1A1A', paddingVertical: 8, marginBottom: 4 }]}>
                <Text style={[styles.reportCell, { flex: 0.5, color: '#FFF', fontWeight: '700' }]}>Total</Text>
                <Text style={[styles.reportCell, { fontWeight: '700', color: '#FFF' }]}>{dailyWithAllDays.reduce((sum, r) => sum + r.convites, 0)}</Text>
                <Text style={[styles.reportCell, { fontWeight: '700', color: '#FFF' }]}>{dailyWithAllDays.reduce((sum, r) => sum + r.apresentacoes, 0)}</Text>
                <Text style={[styles.reportCell, { fontWeight: '700', color: '#FFF' }]}>{dailyWithAllDays.reduce((sum, r) => sum + r.resets, 0)}</Text>
                <Text style={[styles.reportCell, { fontWeight: '700', color: '#FFF' }]}>{dailyWithAllDays.reduce((sum, r) => sum + r.novos, 0)}</Text>
                <Text style={[styles.reportCell, { fontWeight: '700', color: '#FFF' }]}>{dailyWithAllDays.reduce((sum, r) => sum + r.repetidores, 0)}</Text>
                <Text style={[styles.reportCell, { fontWeight: '700', color: '#FFF' }]}>{dailyWithAllDays.reduce((sum, r) => sum + r.indicacoes, 0)}</Text>
                <Text style={[styles.reportCell, { fontWeight: '700', color: '#FFF' }]}>{dailyWithAllDays.reduce((sum, r) => sum + r.acessos, 0)}</Text>
                <Text style={[styles.reportCell, { flex: 1, fontWeight: '700', color: '#FFF', textAlign: 'right' }]}>{dailyWithAllDays.reduce((sum, r) => sum + r.pv, 0).toFixed(2)}</Text>
                <Text style={[styles.reportCell, { flex: 1.2, fontWeight: '700', color: '#4ADE80', textAlign: 'right' }]}>{brl(dailyWithAllDays.reduce((sum, r) => sum + r.ganhos, 0))}</Text>
              </View>
            )}

            <View style={styles.reportHeaderRow}>
              <Text style={[styles.reportHeaderCell, { flex: 0.5 }]} numberOfLines={1}>Dia</Text>
              <Text style={styles.reportHeaderCell} numberOfLines={1}>Contat</Text>
              <Text style={styles.reportHeaderCell} numberOfLines={1}>Apres</Text>
              <Text style={styles.reportHeaderCell} numberOfLines={1}>Reset</Text>
              <Text style={styles.reportHeaderCell} numberOfLines={1}>Nov</Text>
              <Text style={styles.reportHeaderCell} numberOfLines={1}>Rep</Text>
              <Text style={styles.reportHeaderCell} numberOfLines={1}>Ind</Text>
              <Text style={styles.reportHeaderCell} numberOfLines={1}>Aces</Text>
              <Text style={[styles.reportHeaderCell, { flex: 1, textAlign: 'right' }]} numberOfLines={1}>PV</Text>
              <Text style={[styles.reportHeaderCell, { flex: 1.2, textAlign: 'right' }]} numberOfLines={1}>Ganhos</Text>
            </View>
            {dailyWithAllDays.map((row, idx) => (
              <View key={`${row.report_date}-${idx}`} style={styles.reportRow}>
                <Text style={[styles.reportCell, { flex: 0.5, color: '#FFF' }]}>{row.report_date.slice(8, 10)}</Text>
                <Text style={styles.reportCell}>{row.convites}</Text>
                <Text style={styles.reportCell}>{row.apresentacoes}</Text>
                <Text style={styles.reportCell}>{row.resets}</Text>
                <Text style={styles.reportCell}>{row.novos}</Text>
                <Text style={styles.reportCell}>{row.repetidores}</Text>
                <Text style={styles.reportCell}>{row.indicacoes}</Text>
                <Text style={styles.reportCell}>{row.acessos}</Text>
                <Text style={[styles.reportCell, { flex: 1, textAlign: 'right' }]}>{Number(row.pv).toFixed(2)}</Text>
                <Text style={[styles.reportCell, { flex: 1.2, color: '#4ADE80', textAlign: 'right' }]}>{brl(row.ganhos)}</Text>
              </View>
            ))}
            {dailyWithAllDays.length === 0 && (
              <Text style={{ color: T.t3, fontStyle: 'italic', marginTop: 12, textAlign: 'center' }}>Sem dados neste mês.</Text>
            )}
          </View>
        </>
      )}

      {/* Semanal — mesmo layout de card que o downline vê no próprio login
          (título da semana + Acessos média/dia + Ganho semanal + Estimado mensal),
          vindo pronto de get_downline_weekly_report. */}
      {viewMode === 'semanal' && (
        <>
          {filteredWeekly.length === 0 && (
            <Text style={{ color: T.t3, fontStyle: 'italic', textAlign: 'center', marginTop: 12 }}>Sem dados semanais.</Text>
          )}
          {filteredWeekly.slice(0, 12).map((r, idx) => (
            <View key={`${r.trainer_id}-${r.week_start}-${idx}`} style={styles.weekCard}>
              <Text style={styles.weekTitle}>
                {fmtDate(r.week_start)} a {fmtDate(r.week_end)}
                {selectedDownlineId === null && (
                  <Text style={{ color: T.t3, fontWeight: '600' }}> · {r.trainer_name}</Text>
                )}
              </Text>
              <View style={styles.weekLine}>
                <Text style={styles.weekLabel}>Acessos (média/dia)</Text>
                <Text style={styles.weekValue}>{Number(r.acessos_media).toFixed(1)}</Text>
              </View>
              <View style={styles.weekLine}>
                <Text style={styles.weekLabel}>Ganho semanal</Text>
                <Text style={[styles.weekValue, { color: T.green }]}>{brl(r.ganho_semanal)}</Text>
              </View>
              <View style={styles.weekLine}>
                <Text style={styles.weekLabel}>Estimado mensal</Text>
                <Text style={[styles.weekValue, { color: T.blue }]}>{brl(r.estimado_mensal)}</Text>
              </View>
            </View>
          ))}
        </>
      )}

      {/* Mensal — mesma tabela + seção de Tendências que o downline vê no
          próprio login, vindo pronto de get_downline_monthly_report. */}
      {viewMode === 'mensal' && (
        <>
          <View style={styles.reportHeaderRow}>
            <Text style={[styles.reportHeaderCell, { flex: 1 }]}>Mês</Text>
            {selectedDownlineId === null && (
              <Text style={[styles.reportHeaderCell, { flex: 1.3 }]}>Consultor</Text>
            )}
            <Text style={[styles.reportHeaderCell, { flex: 1 }]}>Acessos</Text>
            <Text style={[styles.reportHeaderCell, { flex: 1 }]}>P.V.T.</Text>
            <Text style={[styles.reportHeaderCell, { flex: 1.4 }]}>Ganhos</Text>
          </View>
          {filteredMonthly.slice(0, 12).map((r, idx) => (
            <View key={`${r.trainer_id}-${r.month_start}-${idx}`} style={styles.reportRow}>
              <Text style={[styles.reportCell, { flex: 1, color: T.t1 }]}>
                {r.month_start.slice(5, 7)}/{r.month_start.slice(2, 4)}
              </Text>
              {selectedDownlineId === null && (
                <Text style={[styles.reportCell, { flex: 1.3 }]} numberOfLines={1}>{r.trainer_name}</Text>
              )}
              <Text style={[styles.reportCell, { flex: 1 }]}>{Number(r.acessos_media).toFixed(1)}</Text>
              <Text style={[styles.reportCell, { flex: 1 }]}>{Number(r.pvt).toFixed(2)}</Text>
              <Text style={[styles.reportCell, { flex: 1.4, color: T.green }]}>{brl(r.ganhos)}</Text>
            </View>
          ))}
          {filteredMonthly.length === 0 && (
            <Text style={{ color: T.t3, fontStyle: 'italic', marginTop: 12, textAlign: 'center' }}>Sem dados mensais.</Text>
          )}

          {filteredMonthly.length > 0 && (
            <>
              <Text style={{ color: T.t1, fontWeight: '700', fontSize: 14, marginTop: 20, marginBottom: 8 }}>— Tendências —</Text>
              <View style={styles.reportHeaderRow}>
                <Text style={[styles.reportHeaderCell, { flex: 1 }]}>Mês</Text>
                {selectedDownlineId === null && (
                  <Text style={[styles.reportHeaderCell, { flex: 1.3 }]}>Consultor</Text>
                )}
                <Text style={[styles.reportHeaderCell, { flex: 1 }]}>P.V.T.</Text>
                <Text style={[styles.reportHeaderCell, { flex: 1.4 }]}>Ganhos</Text>
              </View>
              {filteredMonthly
                .filter((r) => r.month_start.slice(0, 7) === new Date().toISOString().slice(0, 7))
                .map((r, idx) => (
                  <View key={`tend-${r.trainer_id}-${r.month_start}-${idx}`} style={styles.reportRow}>
                    <Text style={[styles.reportCell, { flex: 1, color: T.t1 }]}>
                      {r.month_start.slice(5, 7)}/{r.month_start.slice(2, 4)}
                    </Text>
                    {selectedDownlineId === null && (
                      <Text style={[styles.reportCell, { flex: 1.3 }]} numberOfLines={1}>{r.trainer_name}</Text>
                    )}
                    <Text style={[styles.reportCell, { flex: 1 }]}>{Number(r.tendencia_pvt).toFixed(2)}</Text>
                    <Text style={[styles.reportCell, { flex: 1.4, color: T.blue }]}>{brl(r.tendencia_ganhos)}</Text>
                  </View>
                ))}
            </>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: T.bg },
  header: { paddingHorizontal: 20, paddingTop: 20 },
  scrollView: { flex: 1 },
  content: { padding: 20, paddingBottom: 60, maxWidth: 900, alignSelf: 'center', width: '100%' },

  tabsContainer: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, marginTop: 12, marginBottom: 16 },
  tabBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: T.card, alignItems: 'center', borderWidth: 1, borderColor: T.border },
  tabBtnActive: { backgroundColor: T.blue, borderColor: T.blue },
  tabText: { fontSize: 14, fontWeight: '700', color: T.t2 },
  tabTextActive: { color: '#fff' },

  filterBtn: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8, backgroundColor: T.card, borderWidth: 1, borderColor: T.border },
  filterBtnActive: { backgroundColor: T.blue, borderColor: T.blue },
  filterBtnText: { fontSize: 12, fontWeight: '700', color: T.t2 },
  filterBtnTextActive: { color: '#fff' },

  viewModeBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: T.card, alignItems: 'center', borderWidth: 1, borderColor: T.border },
  viewModeBtnActive: { backgroundColor: T.blue, borderColor: T.blue },
  viewModeBtnText: { fontSize: 13, fontWeight: '700', color: T.t2 },
  viewModeBtnTextActive: { color: '#fff' },

  reportTable: { backgroundColor: T.card, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: T.border },
  weekCard: { backgroundColor: T.card, borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: T.border },
  weekTitle: { color: T.t1, fontWeight: '700', marginBottom: 8 },
  weekLine: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  weekLabel: { color: T.t2, fontSize: 13 },
  weekValue: { color: T.t1, fontWeight: '600', fontSize: 13 },
  reportHeaderRow: { flexDirection: 'row', paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: T.border },
  reportHeaderCell: { flex: 0.7, fontSize: 10, fontWeight: '800', color: T.t3, textTransform: 'uppercase' },
  reportRow: { flexDirection: 'row', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: T.surface },
  reportCell: { flex: 0.7, fontSize: 12, color: T.t2, fontWeight: '600' },

  eyebrow: { fontSize: 11, fontWeight: '700', color: T.t3, letterSpacing: 1.5, marginBottom: 4 },
  title: { fontSize: 28, fontWeight: '900', color: T.t1, marginBottom: 4 },
  subtitle: { fontSize: 14, color: T.t2, marginBottom: 8 },
  helperNote: { fontSize: 12, color: T.t3, fontStyle: 'italic', marginTop: 4, marginBottom: 20 },

  emptyContainer: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 20 },
  emptyIcon: { fontSize: 64, opacity: 0.3, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: T.t1, marginBottom: 8, textAlign: 'center' },
  emptyText: { fontSize: 14, color: T.t2, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  shareBtn: { backgroundColor: T.blue, paddingVertical: 14, paddingHorizontal: 28, borderRadius: 12 },
  shareBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },

  heroCard: { borderRadius: 20, padding: 24, marginBottom: 24 },
  heroRow: {},
  heroLabel: { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.9)', marginBottom: 6 },
  heroValue: { fontSize: 22, fontWeight: '900', color: '#fff', marginBottom: 8 },
  heroMeta: { fontSize: 16, fontWeight: '600', color: 'rgba(255,255,255,0.7)' },
  statGrid: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, marginBottom: 10 },
  statCol: { alignItems: 'center', flex: 1 },
  statCaption: { fontSize: 9, fontWeight: '800', color: 'rgba(255,255,255,0.6)', letterSpacing: 0.5, marginBottom: 2 },
  statValue: { fontSize: 17, fontWeight: '900', color: '#fff' },
  progressBar: { height: 8, backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: 8, borderRadius: 4 },
  heroDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.15)', marginVertical: 20 },
  heroExecLabel: { fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.8)', textAlign: 'center', marginBottom: 8 },
  heroExecValue: { fontSize: 36, fontWeight: '900', color: '#fff' },
  heroChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99 },

  destaquesContainer: { marginBottom: 24 },
  destaquesTitle: { fontSize: 16, fontWeight: '800', color: T.t1, marginBottom: 12 },
  destaquesRow: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  destaqueCard: {
    flex: 1,
    minWidth: 150,
    backgroundColor: T.card,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: T.border,
  },
  destaqueIcon: { fontSize: 28, marginBottom: 8 },
  destaqueLabel: { fontSize: 10, fontWeight: '700', color: T.t3, textTransform: 'uppercase', marginBottom: 4, textAlign: 'center' },
  destaqueValue: { fontSize: 13, fontWeight: '800', color: T.t1, textAlign: 'center' },

  rankingTitle: { fontSize: 18, fontWeight: '800', color: T.t1, marginBottom: 16 },

  rankCard: { backgroundColor: T.card, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: T.border },
  rankHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  rankMedal: { fontSize: 20, marginRight: 12, width: 28 },
  rankAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(59,130,246,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankAvatarText: { fontSize: 14, fontWeight: '900', color: T.blue },
  rankName: { fontSize: 16, fontWeight: '800', color: T.t1, marginBottom: 4 },
  statusChip: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },

  metricsRow: { flexDirection: 'row', marginBottom: 14 },
  metricLabel: { fontSize: 12, fontWeight: '700', color: T.t2, marginBottom: 6 },
  miniStatCaption: { fontSize: 10, fontWeight: '800', color: T.t3, letterSpacing: 0.4, marginBottom: 6, textTransform: 'uppercase' },
  miniStatGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  miniStatCol: { alignItems: 'center' },
  miniStatLabel: { fontSize: 8, fontWeight: '700', color: T.t3, marginBottom: 1 },
  miniStatNum: { fontSize: 13, fontWeight: '900', color: T.t1 },
  miniProgressBar: { height: 6, backgroundColor: T.surface, borderRadius: 3, overflow: 'hidden' },
  miniProgressFill: { height: 6, borderRadius: 3 },

  sparklineRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  sparklineLabel: { fontSize: 11, color: T.t3, fontWeight: '600' },

  rankFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTopWidth: 1, borderTopColor: T.border, marginBottom: 12 },
  footerText: { fontSize: 12, fontWeight: '700', color: T.t2 },
  atividadeBolinha: { width: 6, height: 6, borderRadius: 3 },

  whatsappBtn: { backgroundColor: T.blue, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  whatsappBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },

  monthSelector: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: T.card, borderRadius: 10, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: T.border },
  monthSelectorText: { color: T.t1, fontSize: 16, fontWeight: '700', marginRight: 8 },
  monthSelectorArrow: { color: T.blue, fontSize: 14, fontWeight: '700' },
  monthPickerContainer: { backgroundColor: T.card, borderRadius: 10, padding: 8, marginBottom: 12, borderWidth: 1, borderColor: T.border },
  monthPickerItem: { padding: 10, borderRadius: 8 },
  monthPickerItemActive: { backgroundColor: T.blue },
  monthPickerItemText: { color: T.t2, fontSize: 14, fontWeight: '600', textAlign: 'center' },
  monthPickerItemTextActive: { color: '#000' },
});
