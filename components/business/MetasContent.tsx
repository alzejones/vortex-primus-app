// ============================================================
// MetasContent.tsx — Evolução de Negócio do Treinador
// Metas mensais editáveis, genéricas por goal_type.
// Semanal e diário calculados dinamicamente redistribuindo
// déficit pelos dias úteis (seg-sex) restantes.
// Sub-abas: Atendimento (Agendamentos/Avaliações) | Comercial (5 métricas novas)
// ============================================================
import { useCallback, useState, useRef } from 'react';
import {
  ActivityIndicator, ScrollView, StyleSheet, Text,
  TextInput, TouchableOpacity, View,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { T } from '../../utils/theme';
import { getWorkingDays, computeTrend } from '../../utils/goalCalculations';
import { todayBR, daysAgoBR, brasiliaDate } from '../../utils/dateBR';
import { TutorialHelpButton } from '../tutorial/TutorialHelpButton';
import { TutorialOverlay } from '../tutorial/TutorialOverlay';

type Period = 'monthly' | 'weekly' | 'daily';
type Category = 'atendimento' | 'comercial';

type GoalType =
  | 'agendamentos' | 'avaliacoes'
  | 'apresentacoes_kit' | 'kit_acesso_vendido' | 'novos_clientes'
  | 'clientes_repetidores' | 'lucro_mensal';

interface GoalTypeConfig {
  type: GoalType;
  label: string;
  icon: string;
  color: string;
  category: Category;
  isCurrency?: boolean;
}

const GOAL_CONFIG: GoalTypeConfig[] = [
  { type: 'agendamentos',         label: 'Agendamentos',              icon: '📅', color: '#3b82f6', category: 'atendimento' },
  { type: 'avaliacoes',           label: 'Avaliações Realizadas',      icon: '✅', color: '#22c55e', category: 'atendimento' },
  { type: 'apresentacoes_kit',    label: 'Apresentações Kit Acesso',   icon: '🎤', color: '#a855f7', category: 'comercial'   },
  { type: 'kit_acesso_vendido',   label: 'Kit Acesso Vendidos',        icon: '📦', color: '#06b6d4', category: 'comercial'   },
  { type: 'novos_clientes',       label: 'Novos Clientes',             icon: '🆕', color: '#f59e0b', category: 'comercial'   },
  { type: 'clientes_repetidores', label: 'Clientes Repetidores',       icon: '🔁', color: '#ec4899', category: 'comercial'   },
  { type: 'lucro_mensal',         label: 'Lucro Mensal',               icon: '💵', color: '#10b981', category: 'comercial', isCurrency: true },
];

const ALL_TYPES = GOAL_CONFIG.map((g) => g.type);

type NumMap = Record<GoalType, number>;

function emptyMap(): NumMap {
  const m = {} as NumMap;
  ALL_TYPES.forEach((t) => { m[t] = 0; });
  return m;
}

function formatValue(value: number, isCurrency?: boolean): string {
  if (isCurrency) {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
  }
  return String(Math.round(value));
}

// Retorna meta ajustada diária e semanal com base no déficit redistribuído
function computeAdjusted(monthlyGoal: number, actualMonthToDate: number) {
  const now = new Date();
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const cutoff = new Date(now);
  cutoff.setHours(22, 0, 0, 0);
  const startDay = now >= cutoff ? new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1) : now;
  const workingDaysRemaining = getWorkingDays(startDay, monthEnd);
  const remaining = Math.max(monthlyGoal - actualMonthToDate, 0);
  const dailyGoal = workingDaysRemaining > 0
    ? Math.ceil(remaining / workingDaysRemaining)
    : remaining;

  // Semana corrente: só os dias úteis que REALMENTE restam — de hoje/amanhã
  // (respeitando o corte das 22h) até sexta-feira (ou fim do mês, o que vier antes).
  // Nunca conta dias já passados da semana.
  const dow = now.getDay();
  const weekMon = new Date(now);
  weekMon.setDate(now.getDate() - (dow === 0 ? 6 : dow - 1));
  const weekFri = new Date(weekMon);
  weekFri.setDate(weekMon.getDate() + 4);
  const effectiveWeekEnd = weekFri <= monthEnd ? weekFri : monthEnd;
  const weekRemainingStart = startDay > weekMon ? startDay : weekMon;
  const workingDaysRemainingInWeek = weekRemainingStart <= effectiveWeekEnd
    ? getWorkingDays(weekRemainingStart, effectiveWeekEnd)
    : 0;
  const weeklyGoal = dailyGoal * workingDaysRemainingInWeek;

  return { dailyGoal, weeklyGoal };
}

function getDateRange(period: Period): { start: string; end: string } {
  const now = brasiliaDate();
  if (period === 'monthly') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end   = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] };
  }
  if (period === 'weekly') {
    const dow = now.getDay();
    const mon = new Date(now); mon.setDate(now.getDate() - (dow === 0 ? 6 : dow - 1));
    const fri = new Date(mon); fri.setDate(mon.getDate() + 4);
    return { start: mon.toISOString().split('T')[0], end: fri.toISOString().split('T')[0] };
  }
  return { start: todayBR(), end: todayBR() };
}

// Busca o "realizado" de um goal_type num intervalo de datas [start, end] (inclusive).
// Cada tipo sabe qual tabela/coluna consultar e se é COUNT ou SUM.
async function fetchActual(goalType: GoalType, tid: string, start: string, end: string): Promise<number> {
  switch (goalType) {
    case 'agendamentos': {
      const { count } = await supabase.from('appointments').select('*', { count: 'exact', head: true })
        .eq('trainer_id', tid).gte('created_at', start + 'T00:00:00-03:00').lte('created_at', end + 'T23:59:59-03:00');
      return count || 0;
    }
    case 'avaliacoes': {
      const { count } = await supabase.from('physical_assessments').select('*', { count: 'exact', head: true })
        .eq('trainer_id', tid).gte('assessment_date', start).lte('assessment_date', end);
      return count || 0;
    }
    case 'apresentacoes_kit': {
      const { count } = await supabase.from('herbalife_prospects').select('*', { count: 'exact', head: true })
        .eq('trainer_id', tid).eq('source', 'apresentacao')
        .gte('contact_date', start).lte('contact_date', end);
      return count || 0;
    }
    case 'kit_acesso_vendido': {
      const { count } = await supabase.from('herbalife_sales').select('*', { count: 'exact', head: true })
        .eq('trainer_id', tid).eq('sale_type', 'acesso')
        .gte('sale_date', start).lte('sale_date', end);
      return count || 0;
    }
    case 'novos_clientes': {
      const { count } = await supabase.from('clients').select('*', { count: 'exact', head: true })
        .eq('trainer_id', tid).gte('created_at', start + 'T00:00:00-03:00').lte('created_at', end + 'T23:59:59-03:00');
      return count || 0;
    }
    case 'clientes_repetidores': {
      const { count } = await supabase.from('herbalife_sales').select('*', { count: 'exact', head: true })
        .eq('trainer_id', tid).eq('client_status', 'repetidor')
        .gte('sale_date', start).lte('sale_date', end);
      return count || 0;
    }
    case 'lucro_mensal': {
      const { data } = await supabase.from('herbalife_sales').select('total_profit')
        .eq('trainer_id', tid).gte('sale_date', start).lte('sale_date', end);
      return (data || []).reduce((sum: number, row: any) => sum + (Number(row.total_profit) || 0), 0);
    }
  }
}

function ProgressBar({ value, goal, color, isCurrency }: { value: number; goal: number; color: string; isCurrency?: boolean }) {
  const pct = goal > 0 ? Math.min((value / goal) * 100, 100) : 0;
  return (
    <View style={{ marginTop: 6 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
        <Text style={{ color: T.t2, fontSize: 12 }}>
          {formatValue(value, isCurrency)} <Text style={{ color: T.t3 }}>de {formatValue(goal, isCurrency)}</Text>
        </Text>
        <Text style={{ color, fontSize: 12, fontWeight: '800' }}>{Math.round(pct)}%</Text>
      </View>
      <View style={{ height: 8, backgroundColor: T.border, borderRadius: 4, overflow: 'hidden' }}>
        <View style={{ height: 8, width: `${pct}%` as any, backgroundColor: color, borderRadius: 4 }} />
      </View>
    </View>
  );
}

function MetricCard({
  label, icon, value, goal, color, onEdit, isComputed, trend, isCurrency,
}: {
  label: string; icon: string; value: number; goal: number;
  color: string; onEdit?: () => void; isComputed?: boolean; isCurrency?: boolean;
  trend?: { projection: number; pct: number; color: string; label: string } | null;
}) {
  return (
    <View style={[styles.card, { borderLeftColor: color, borderLeftWidth: 4 }]}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={{ fontSize: 20 }}>{icon}</Text>
          <Text style={{ color: T.t1, fontSize: 14, fontWeight: '700' }}>{label}</Text>
        </View>
        {onEdit && !isComputed ? (
          <TouchableOpacity onPress={onEdit} style={styles.editBtn}>
            <Text style={{ fontSize: 11, color: T.blue, fontWeight: '700' }}>✏️ Meta</Text>
          </TouchableOpacity>
        ) : isComputed ? (
          <View style={[styles.editBtn, { backgroundColor: 'transparent' }]}>
            <Text style={{ fontSize: 10, color: T.t3, fontStyle: 'italic' }}>ajustada</Text>
          </View>
        ) : null}
      </View>
      <ProgressBar value={value} goal={goal} color={color} isCurrency={isCurrency} />
      {trend && (
        <View style={{
          flexDirection: 'row', justifyContent: 'space-between',
          alignItems: 'center', marginTop: 10,
          paddingTop: 10, borderTopWidth: 1, borderTopColor: T.border,
        }}>
          <Text style={{ fontSize: 11, color: T.t3, fontWeight: '600' }}>
            Tendência fim do mês
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={{ fontSize: 11, fontWeight: '800', color: trend.color }}>
              {trend.label}
            </Text>
            <View style={{
              backgroundColor: trend.color + '22',
              paddingHorizontal: 7, paddingVertical: 2, borderRadius: 99,
            }}>
              <Text style={{ fontSize: 11, fontWeight: '900', color: trend.color }}>
                {formatValue(trend.projection, isCurrency)}
              </Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

export default function MetasContent() {
  const [loading, setLoading]     = useState(true);
  const [category, setCategory]   = useState<Category>('atendimento');
  const [period, setPeriod]       = useState<Period>('monthly');
  const [trainerId, setTrainerId] = useState<string | null>(null);

  const [goals, setGoals]                     = useState<NumMap>(emptyMap());
  const [actuals, setActuals]                 = useState<NumMap>(emptyMap());
  const [monthActuals, setMonthActuals]       = useState<NumMap>(emptyMap());
  const [baseBeforeToday, setBaseBeforeToday] = useState<NumMap>(emptyMap());

  const [editingField, setEditingField] = useState<GoalType | null>(null);
  const [editValue, setEditValue] = useState('');

  const aba_atendimentoRef = useRef(null);
  const aba_comercialRef = useRef(null);
  const botao_editar_metaRef = useRef(null);

  useFocusEffect(useCallback(() => { loadData(); }, []));

  async function loadData() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: trainer } = await supabase.from('trainers').select('id').eq('user_id', user.id).single();
      if (!trainer) return;
      setTrainerId(trainer.id);

      const { data: goalsData } = await supabase
        .from('trainer_goals').select('goal_type, monthly_goal').eq('trainer_id', trainer.id);
      const g = emptyMap();
      (goalsData || []).forEach((row: any) => { g[row.goal_type as GoalType] = Number(row.monthly_goal) || 0; });
      setGoals(g);

      await loadActuals(trainer.id, period);
    } finally {
      setLoading(false);
    }
  }

  async function loadActuals(tid: string, p: Period) {
    const { start, end }         = getDateRange(p);
    const { start: ms, end: me } = getDateRange('monthly');
    const yesterdayStr = daysAgoBR(1);

    const results = await Promise.all(ALL_TYPES.map(async (t) => {
      const [cur, month, beforeToday] = await Promise.all([
        fetchActual(t, tid, start, end),
        fetchActual(t, tid, ms, me),
        fetchActual(t, tid, ms, yesterdayStr),
      ]);
      return { t, cur, month, beforeToday };
    }));

    const nActuals = emptyMap(), nMonth = emptyMap(), nToday = emptyMap();
    results.forEach(({ t, cur, month, beforeToday }) => {
      nActuals[t] = cur; nMonth[t] = month; nToday[t] = beforeToday;
    });
    setActuals(nActuals);
    setMonthActuals(nMonth);
    setBaseBeforeToday(nToday);
  }

  async function changePeriod(p: Period) {
    setPeriod(p);
    if (trainerId) await loadActuals(trainerId, p);
  }

  async function saveGoal(type: GoalType, value: number) {
    if (!trainerId) return;
    await supabase.from('trainer_goals')
      .upsert(
        { trainer_id: trainerId, goal_type: type, monthly_goal: value },
        { onConflict: 'trainer_id,goal_type' }
      );
    setGoals({ ...goals, [type]: value });
    setEditingField(null);
  }

  const periodLabels: Record<Period, string> = { monthly: 'Mensal', weekly: 'Semanal', daily: 'Diário' };
  const isComputed = period !== 'monthly';

  if (loading) return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: T.bg }}>
      <ActivityIndicator size="large" color={T.blue} />
    </View>
  );

  const visibleGoals = GOAL_CONFIG.filter((g) => g.category === category);

  return (
    <View style={{ flex: 1, backgroundColor: T.bg }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.container}>
      {/* Seletor de categoria */}
      <View style={styles.periodRow}>
        {([
          { key: 'atendimento' as Category, label: '🏋️ Atendimento' },
          { key: 'comercial' as Category,   label: '💼 Comercial' },
        ]).map((c) => (
          <TouchableOpacity
            key={c.key}
            ref={c.key === 'atendimento' ? aba_atendimentoRef : aba_comercialRef}
            style={[styles.periodBtn, category === c.key && styles.periodBtnActive]}
            onPress={() => setCategory(c.key)}
          >
            <Text style={[styles.periodLabel, category === c.key && styles.periodLabelActive]}>
              {c.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Seletor de período */}
      <View style={styles.periodRow}>
        {(['monthly', 'weekly', 'daily'] as Period[]).map((p) => (
          <TouchableOpacity
            key={p}
            style={[styles.periodBtn, period === p && styles.periodBtnActive]}
            onPress={() => changePeriod(p)}
          >
            <Text style={[styles.periodLabel, period === p && styles.periodLabelActive]}>
              {periodLabels[p]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Nota de meta ajustada */}
      {isComputed && visibleGoals.some((g) => goals[g.type] > 0) && (
        <View style={{ backgroundColor: 'rgba(59,130,246,0.08)', borderRadius: 10, padding: 10, marginBottom: 16, borderLeftWidth: 3, borderLeftColor: T.blue }}>
          <Text style={{ fontSize: 12, color: T.t2, lineHeight: 18 }}>
            📊 Metas {periodLabels[period].toLowerCase()}s calculadas automaticamente redistribuindo o déficit nos dias úteis restantes do mês.
          </Text>
        </View>
      )}

      {visibleGoals.map((cfg) => {
        // Diário e Semanal usam o mesmo ritmo-base ("realizado até ontem"),
        // já que a meta semanal agora é derivada do ritmo diário — não faz
        // sentido as duas abas mostrarem ritmos diferentes pra mesma métrica.
        const baseForCalc = period === 'monthly' ? monthActuals[cfg.type] : baseBeforeToday[cfg.type];

        const adj = computeAdjusted(goals[cfg.type], baseForCalc);
        const trend = period === 'monthly' ? computeTrend(goals[cfg.type], monthActuals[cfg.type]) : null;

        const cardGoal = period === 'monthly' ? goals[cfg.type]
          : period === 'weekly' ? adj.weeklyGoal
          : adj.dailyGoal;

        return (
          <MetricCard
            key={cfg.type}
            label={cfg.label} icon={cfg.icon}
            value={actuals[cfg.type]} goal={cardGoal}
            color={cfg.color}
            isComputed={isComputed}
            isCurrency={cfg.isCurrency}
            trend={trend}
            onEdit={() => { setEditingField(cfg.type); setEditValue(String(goals[cfg.type])); }}
          />
        );
      })}

      {/* Resumo numérico — só faz sentido pra Atendimento (mesma métrica: contagem) */}
      {category === 'atendimento' && (
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Resumo {periodLabels[period]}</Text>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{Math.round(actuals.agendamentos)}</Text>
              <Text style={styles.summaryLabel}>Agendados</Text>
            </View>
            <View style={[styles.summaryItem, { borderLeftWidth: 1, borderRightWidth: 1, borderColor: T.border }]}>
              <Text style={[styles.summaryValue, { color: '#22c55e' }]}>{Math.round(actuals.avaliacoes)}</Text>
              <Text style={styles.summaryLabel}>Realizados</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: '#f59e0b' }]}>
                {actuals.agendamentos > 0
                  ? Math.round((actuals.avaliacoes / actuals.agendamentos) * 100)
                  : 0}%
              </Text>
              <Text style={styles.summaryLabel}>Taxa Execução</Text>
            </View>
          </View>
        </View>
      )}

      {/* Edição de meta mensal */}
      {editingField && (
        <View style={styles.editCard}>
          <Text style={styles.editTitle}>
            {GOAL_CONFIG.find((g) => g.type === editingField)?.icon} Meta Mensal — {GOAL_CONFIG.find((g) => g.type === editingField)?.label}
          </Text>
          <Text style={{ fontSize: 12, color: T.t3, marginBottom: 12 }}>
            As metas semanal e diária serão recalculadas automaticamente.
          </Text>
          <TextInput
            style={styles.editInput}
            value={editValue}
            onChangeText={setEditValue}
            keyboardType={GOAL_CONFIG.find((g) => g.type === editingField)?.isCurrency ? 'decimal-pad' : 'number-pad'}
            autoFocus
            placeholder={GOAL_CONFIG.find((g) => g.type === editingField)?.isCurrency ? 'Ex: 3000.00' : 'Ex: 100'}
            placeholderTextColor={T.t3}
          />
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
            <TouchableOpacity
              style={[styles.editActionBtn, { backgroundColor: T.blue }]}
              onPress={() => {
                const isCurrency = GOAL_CONFIG.find((g) => g.type === editingField)?.isCurrency;
                const parsed = isCurrency ? parseFloat(editValue.replace(',', '.')) : parseInt(editValue, 10);
                saveGoal(editingField, Number.isFinite(parsed) ? parsed : 0);
              }}
            >
              <Text style={{ color: '#fff', fontWeight: '800', fontSize: 14 }}>Salvar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.editActionBtn, { backgroundColor: T.card }]}
              onPress={() => setEditingField(null)}
            >
              <Text style={{ color: T.t2, fontWeight: '700', fontSize: 14 }}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      </ScrollView>

      <TutorialOverlay
        targetRefs={{
          aba_atendimento: aba_atendimentoRef,
          aba_comercial: aba_comercialRef,
          botao_editar_meta: botao_editar_metaRef,
        }}
      />
      <TutorialHelpButton screenId="metas" />
    </View>
  );
}

const styles = StyleSheet.create({
  container:         { padding: 20, paddingBottom: 40 },
  pageLabel:         { fontSize: 11, fontWeight: '700', color: T.t3, letterSpacing: 1.5, marginBottom: 4 },
  pageTitle:         { fontSize: 28, fontWeight: '900', color: T.t1, marginBottom: 24 },
  periodRow:         { flexDirection: 'row', backgroundColor: T.card, borderRadius: 12, padding: 4, marginBottom: 12, gap: 4 },
  periodBtn:         { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center' },
  periodBtnActive:   { backgroundColor: T.blue },
  periodLabel:       { fontSize: 13, fontWeight: '700', color: T.t2 },
  periodLabelActive: { color: '#fff' },
  card:              { backgroundColor: T.card, borderRadius: 16, padding: 16, marginBottom: 16 },
  editBtn:           { backgroundColor: T.surface, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  summaryCard:       { backgroundColor: T.card, borderRadius: 16, padding: 16, marginTop: 8 },
  summaryTitle:      { fontSize: 13, fontWeight: '700', color: T.t2, marginBottom: 16, textAlign: 'center' },
  summaryRow:        { flexDirection: 'row' },
  summaryItem:       { flex: 1, alignItems: 'center' },
  summaryValue:      { fontSize: 28, fontWeight: '900', color: T.t1 },
  summaryLabel:      { fontSize: 11, color: T.t3, marginTop: 4, fontWeight: '600' },
  editCard:          { backgroundColor: T.card, borderRadius: 16, padding: 20, marginTop: 16, borderWidth: 1.5, borderColor: T.blue },
  editTitle:         { fontSize: 15, fontWeight: '800', color: T.t1, marginBottom: 6 },
  editInput:         { backgroundColor: T.surface, borderRadius: 10, padding: 14, fontSize: 24, fontWeight: '900', color: T.t1, textAlign: 'center', borderWidth: 1, borderColor: T.border },
  editActionBtn:     { flex: 1, padding: 14, borderRadius: 10, alignItems: 'center' },
});
