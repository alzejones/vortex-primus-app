// ============================================================
// herbalife-team.tsx — Painel da Equipe Herbalife
// Dashboard completo de produtividade dos downlines com ranking,
// destaques, sparklines e reconhecimento via WhatsApp
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

export default function HerbalifeTeam() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [downlines, setDownlines] = useState<ProcessedDownline[]>([]);

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

  async function onRefresh() {
    setRefreshing(true);
    await loadData();
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

    const url = `https://wa.me/55${phone}?text=${encodeURIComponent(mensagem)}`;

    if (Platform.OS === 'web') {
      window.open(url, '_blank');
    } else {
      Linking.openURL(url).catch(() => {
        Alert.alert('Erro', 'Não foi possível abrir o WhatsApp');
      });
    }
  }

  function handleShareApp() {
    const mensagem = `🚀 Olá! Conheça o Vortex Primus, o app completo para Personal Trainers gerenciarem clientes, avaliações, dietas e muito mais!\n\nCadastre-se como Consultor Independente Herbalife e conecte-se à minha equipe. Acesse: https://vortex-primus.vercel.app`;
    const url = `https://wa.me/?text=${encodeURIComponent(mensagem)}`;

    if (Platform.OS === 'web') {
      window.open(url, '_blank');
    } else {
      Linking.openURL(url);
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

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={T.blue} />}
    >
      <Text style={styles.eyebrow}>EQUIPE HERBALIFE</Text>
      <Text style={styles.title}>Painel da Equipe</Text>
      <Text style={styles.subtitle}>
        {capitalizedMonth} · {downlines.length} {downlines.length === 1 ? 'consultor ativo' : 'consultores ativos'}
      </Text>
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: T.bg },
  content: { padding: 20, paddingBottom: 60, maxWidth: 900, alignSelf: 'center', width: '100%' },

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
});
