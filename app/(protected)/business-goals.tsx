// ============================================================
// business-goals.tsx — Evolução de Negócio do Treinador
// Metas mensais editáveis. Semanal e diário calculados dinamicamente
// redistribuindo déficit pelos dias úteis (seg-sex) restantes.
// ============================================================
import { useCallback, useState } from 'react';
import {
  ActivityIndicator, ScrollView, StyleSheet, Text,
  TextInput, TouchableOpacity, View,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { T } from '../../utils/theme';

type Period = 'monthly' | 'weekly' | 'daily';

interface Goals {
  monthly_scheduled_goal: number;
  monthly_completed_goal: number;
}

interface Actuals {
  scheduled: number;
  completed: number;
}

// Conta dias úteis (seg-sex) entre duas datas inclusive
function getWorkingDays(start: Date, end: Date): number {
  let count = 0;
  const d = new Date(start); d.setHours(0, 0, 0, 0);
  const e = new Date(end);   e.setHours(0, 0, 0, 0);
  while (d <= e) {
    const day = d.getDay();
    if (day !== 0 && day !== 6) count++;
    d.setDate(d.getDate() + 1);
  }
  return count;
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

  // Semana corrente: seg a sex (ou fim do mês, o que vier antes)
  const dow = now.getDay();
  const weekMon = new Date(now);
  weekMon.setDate(now.getDate() - (dow === 0 ? 6 : dow - 1));
  const weekFri = new Date(weekMon);
  weekFri.setDate(weekMon.getDate() + 4);
  const effectiveWeekEnd = weekFri <= monthEnd ? weekFri : monthEnd;
  const workingDaysThisWeek = getWorkingDays(weekMon, effectiveWeekEnd);
  const weeklyGoal = dailyGoal * workingDaysThisWeek;

  return { dailyGoal, weeklyGoal };
}

function getDateRange(period: Period): { start: string; end: string } {
  const now = new Date();
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
  const today = now.toISOString().split('T')[0];
  return { start: today, end: today };
}

function ProgressBar({ value, goal, color }: { value: number; goal: number; color: string }) {
  const pct = goal > 0 ? Math.min((value / goal) * 100, 100) : 0;
  return (
    <View style={{ marginTop: 6 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
        <Text style={{ color: T.t2, fontSize: 12 }}>
          {value} <Text style={{ color: T.t3 }}>de {goal}</Text>
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
  label, icon, value, goal, color, onEdit, isComputed,
}: {
  label: string; icon: string; value: number; goal: number;
  color: string; onEdit?: () => void; isComputed?: boolean;
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
      <ProgressBar value={value} goal={goal} color={color} />
    </View>
  );
}

export default function BusinessGoals() {
  const [loading, setLoading]     = useState(true);
  const [period, setPeriod]       = useState<Period>('monthly');
  const [trainerId, setTrainerId] = useState<string | null>(null);
  const [goals, setGoals]         = useState<Goals>({ monthly_scheduled_goal: 0, monthly_completed_goal: 0 });
  const [actuals, setActuals]     = useState<Actuals>({ scheduled: 0, completed: 0 });
  const [monthActuals, setMonthActuals] = useState<Actuals>({ scheduled: 0, completed: 0 });
  const [baseBeforeToday, setBaseBeforeToday]   = useState<Actuals>({ scheduled: 0, completed: 0 });
  const [baseBeforeWeek,  setBaseBeforeWeek]    = useState<Actuals>({ scheduled: 0, completed: 0 });
  const [editingField, setEditingField] = useState<keyof Goals | null>(null);
  const [editValue, setEditValue] = useState('');

  useFocusEffect(useCallback(() => { loadData(); }, []));

  async function loadData() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: trainer } = await supabase.from('trainers').select('id').eq('user_id', user.id).single();
      if (!trainer) return;
      setTrainerId(trainer.id);

      const { data: goalsData } = await supabase
        .from('trainer_goals').select('*').eq('trainer_id', trainer.id).maybeSingle();
      if (goalsData) {
        setGoals({
          monthly_scheduled_goal: goalsData.monthly_scheduled_goal || 0,
          monthly_completed_goal:  goalsData.monthly_completed_goal  || 0,
        });
      }
      await loadActuals(trainer.id, period);
    } finally {
      setLoading(false);
    }
  }

  async function loadActuals(tid: string, p: Period) {
    const { start, end }         = getDateRange(p);
    const { start: ms, end: me } = getDateRange('monthly');

    // Ontem
    const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    // Fim da semana passada (última sexta-feira)
    const now2 = new Date();
    const dow = now2.getDay(); // 0=Dom
    const lastFri = new Date(now2);
    lastFri.setDate(now2.getDate() - (dow === 0 ? 2 : dow === 6 ? 1 : dow + 1));
    const lastFriStr = lastFri.toISOString().split('T')[0];

    const [
      { count: sched }, { count: comp },
      { count: schedM }, { count: compM },
      { count: schedY }, { count: compY },
      { count: schedW }, { count: compW },
    ] = await Promise.all([
      supabase.from('appointments').select('*', { count: 'exact', head: true })
        .eq('trainer_id', tid).gte('appointment_date', start).lte('appointment_date', end),
      supabase.from('physical_assessments').select('*', { count: 'exact', head: true })
        .eq('trainer_id', tid).gte('assessment_date', start).lte('assessment_date', end),
      supabase.from('appointments').select('*', { count: 'exact', head: true })
        .eq('trainer_id', tid).gte('appointment_date', ms).lte('appointment_date', me),
      supabase.from('physical_assessments').select('*', { count: 'exact', head: true })
        .eq('trainer_id', tid).gte('assessment_date', ms).lte('assessment_date', me),
      supabase.from('appointments').select('*', { count: 'exact', head: true })
        .eq('trainer_id', tid).gte('appointment_date', ms).lte('appointment_date', yesterdayStr),
      supabase.from('physical_assessments').select('*', { count: 'exact', head: true })
        .eq('trainer_id', tid).gte('assessment_date', ms).lte('assessment_date', yesterdayStr),
      supabase.from('appointments').select('*', { count: 'exact', head: true })
        .eq('trainer_id', tid).gte('appointment_date', ms).lte('appointment_date', lastFriStr),
      supabase.from('physical_assessments').select('*', { count: 'exact', head: true })
        .eq('trainer_id', tid).gte('assessment_date', ms).lte('assessment_date', lastFriStr),
    ]);

    setActuals({ scheduled: sched || 0, completed: comp || 0 });
    setMonthActuals({ scheduled: schedM || 0, completed: compM || 0 });
    setBaseBeforeToday({ scheduled: schedY || 0, completed: compY || 0 });
    setBaseBeforeWeek({ scheduled: schedW || 0, completed: compW || 0 });
  }

  async function changePeriod(p: Period) {
    setPeriod(p);
    if (trainerId) await loadActuals(trainerId, p);
  }

  async function saveGoal(field: keyof Goals, value: number) {
    if (!trainerId) return;
    const updated = { ...goals, [field]: value };
    await supabase.from('trainer_goals')
      .upsert(
        { trainer_id: trainerId, ...updated },
        { onConflict: 'trainer_id' }
      );
    setGoals(updated);
    setEditingField(null);
  }

  // Base correta por período:
  // - diário: feitos até ontem
  // - semanal: feitos até fim da semana passada
  // - mensal: feitos no mês inteiro (para exibição)
  const baseSchedForCalc = period === 'daily' ? baseBeforeToday.scheduled
    : period === 'weekly' ? baseBeforeWeek.scheduled
    : monthActuals.scheduled;
  const baseCompForCalc  = period === 'daily' ? baseBeforeToday.completed
    : period === 'weekly' ? baseBeforeWeek.completed
    : monthActuals.completed;

  const adjSched = computeAdjusted(goals.monthly_scheduled_goal, baseSchedForCalc);
  const adjComp  = computeAdjusted(goals.monthly_completed_goal,  baseCompForCalc);

  const schedGoal = period === 'monthly' ? goals.monthly_scheduled_goal
    : period === 'weekly'  ? adjSched.weeklyGoal
    : adjSched.dailyGoal;

  const compGoal  = period === 'monthly' ? goals.monthly_completed_goal
    : period === 'weekly'  ? adjComp.weeklyGoal
    : adjComp.dailyGoal;

  const periodLabels: Record<Period, string> = { monthly: 'Mensal', weekly: 'Semanal', daily: 'Diário' };
  const isComputed = period !== 'monthly';

  if (loading) return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: T.bg }}>
      <ActivityIndicator size="large" color={T.blue} />
    </View>
  );

  return (
    <ScrollView style={{ flex: 1, backgroundColor: T.bg }} contentContainerStyle={styles.container}>
      <Text style={styles.pageLabel}>PRODUTIVIDADE</Text>
      <Text style={styles.pageTitle}>Evolução de Negócio</Text>

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
      {isComputed && (goals.monthly_scheduled_goal > 0 || goals.monthly_completed_goal > 0) && (
        <View style={{ backgroundColor: 'rgba(59,130,246,0.08)', borderRadius: 10, padding: 10, marginBottom: 16, borderLeftWidth: 3, borderLeftColor: T.blue }}>
          <Text style={{ fontSize: 12, color: T.t2, lineHeight: 18 }}>
            📊 Metas {periodLabels[period].toLowerCase()}s calculadas automaticamente redistribuindo o déficit nos dias úteis restantes do mês.
          </Text>
        </View>
      )}

      <MetricCard
        label="Agendamentos" icon="📅"
        value={actuals.scheduled} goal={schedGoal}
        color="#3b82f6"
        isComputed={isComputed}
        onEdit={() => { setEditingField('monthly_scheduled_goal'); setEditValue(String(goals.monthly_scheduled_goal)); }}
      />
      <MetricCard
        label="Avaliações Realizadas" icon="✅"
        value={actuals.completed} goal={compGoal}
        color="#22c55e"
        isComputed={isComputed}
        onEdit={() => { setEditingField('monthly_completed_goal'); setEditValue(String(goals.monthly_completed_goal)); }}
      />

      {/* Resumo numérico */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Resumo {periodLabels[period]}</Text>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{actuals.scheduled}</Text>
            <Text style={styles.summaryLabel}>Agendados</Text>
          </View>
          <View style={[styles.summaryItem, { borderLeftWidth: 1, borderRightWidth: 1, borderColor: T.border }]}>
            <Text style={[styles.summaryValue, { color: '#22c55e' }]}>{actuals.completed}</Text>
            <Text style={styles.summaryLabel}>Realizados</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: '#f59e0b' }]}>
              {actuals.scheduled > 0
                ? Math.round((actuals.completed / actuals.scheduled) * 100)
                : 0}%
            </Text>
            <Text style={styles.summaryLabel}>Taxa Execução</Text>
          </View>
        </View>
      </View>

      {/* Edição de meta mensal */}
      {editingField && (
        <View style={styles.editCard}>
          <Text style={styles.editTitle}>
            {editingField === 'monthly_scheduled_goal' ? '📅 Meta Mensal — Agendamentos' : '✅ Meta Mensal — Avaliações'}
          </Text>
          <Text style={{ fontSize: 12, color: T.t3, marginBottom: 12 }}>
            As metas semanal e diária serão recalculadas automaticamente.
          </Text>
          <TextInput
            style={styles.editInput}
            value={editValue}
            onChangeText={setEditValue}
            keyboardType="number-pad"
            autoFocus
            placeholder="Ex: 100"
            placeholderTextColor={T.t3}
          />
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
            <TouchableOpacity
              style={[styles.editActionBtn, { backgroundColor: T.blue }]}
              onPress={() => saveGoal(editingField, parseInt(editValue) || 0)}
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
  );
}

const styles = StyleSheet.create({
  container:         { padding: 20, paddingBottom: 40 },
  pageLabel:         { fontSize: 11, fontWeight: '700', color: T.t3, letterSpacing: 1.5, marginBottom: 4 },
  pageTitle:         { fontSize: 28, fontWeight: '900', color: T.t1, marginBottom: 24 },
  periodRow:         { flexDirection: 'row', backgroundColor: T.card, borderRadius: 12, padding: 4, marginBottom: 24, gap: 4 },
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