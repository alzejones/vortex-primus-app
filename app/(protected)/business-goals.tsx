// ============================================================
// business-goals.tsx — Evolução de Negócio do Treinador
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
  weekly_scheduled_goal: number;
  weekly_completed_goal: number;
  daily_scheduled_goal: number;
  daily_completed_goal: number;
}

interface Actuals {
  scheduled: number;
  completed: number;
}

function getDateRange(period: Period): { start: string; end: string } {
  const now = new Date();
  if (period === 'monthly') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] };
  }
  if (period === 'weekly') {
    const day = now.getDay();
    const mon = new Date(now); mon.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
    const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
    return { start: mon.toISOString().split('T')[0], end: sun.toISOString().split('T')[0] };
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
  label, icon, value, goal, color, onEdit,
}: {
  label: string; icon: string; value: number; goal: number;
  color: string; onEdit: () => void;
}) {
  return (
    <View style={[styles.card, { borderLeftColor: color, borderLeftWidth: 4 }]}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={{ fontSize: 20 }}>{icon}</Text>
          <Text style={{ color: T.t1, fontSize: 14, fontWeight: '700' }}>{label}</Text>
        </View>
        <TouchableOpacity onPress={onEdit} style={styles.editBtn}>
          <Text style={{ fontSize: 11, color: T.blue, fontWeight: '700' }}>✏️ Meta</Text>
        </TouchableOpacity>
      </View>
      <ProgressBar value={value} goal={goal} color={color} />
    </View>
  );
}

export default function BusinessGoals() {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>('monthly');
  const [trainerId, setTrainerId] = useState<string | null>(null);
  const [goals, setGoals] = useState<Goals>({
    monthly_scheduled_goal: 0, monthly_completed_goal: 0,
    weekly_scheduled_goal: 0, weekly_completed_goal: 0,
    daily_scheduled_goal: 0, daily_completed_goal: 0,
  });
  const [actuals, setActuals] = useState<Actuals>({ scheduled: 0, completed: 0 });
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
      if (goalsData) setGoals(goalsData);

      await loadActuals(trainer.id, period);
    } finally {
      setLoading(false);
    }
  }

  async function loadActuals(tid: string, p: Period) {
    const { start, end } = getDateRange(p);
    const [{ count: sched }, { count: comp }] = await Promise.all([
      supabase.from('appointments').select('*', { count: 'exact', head: true })
        .eq('trainer_id', tid).gte('appointment_date', start).lte('appointment_date', end),
      supabase.from('physical_assessments').select('*', { count: 'exact', head: true })
        .eq('trainer_id', tid).gte('assessment_date', start).lte('assessment_date', end),
    ]);
    setActuals({ scheduled: sched || 0, completed: comp || 0 });
  }

  async function changePeriod(p: Period) {
    setPeriod(p);
    if (trainerId) await loadActuals(trainerId, p);
  }

  async function saveGoal(field: keyof Goals, value: number) {
    if (!trainerId) return;
    const updated = { ...goals, [field]: value };
    await supabase.from('trainer_goals')
      .upsert({ trainer_id: trainerId, ...updated }, { onConflict: 'trainer_id' });
    setGoals(updated);
    setEditingField(null);
  }

  const periodLabels: Record<Period, string> = { monthly: 'Mensal', weekly: 'Semanal', daily: 'Diário' };
  const schedKey = `${period}_scheduled_goal` as keyof Goals;
  const compKey  = `${period}_completed_goal` as keyof Goals;
  const schedGoal = goals[schedKey] as number;
  const compGoal  = goals[compKey] as number;

  if (loading) return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: T.bg }}>
      <ActivityIndicator size="large" color={T.blue} />
    </View>
  );

  return (
    <ScrollView style={{ flex: 1, backgroundColor: T.bg }} contentContainerStyle={styles.container}>
      {/* Cabeçalho */}
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

      {/* Cards de progresso */}
      <MetricCard
        label="Agendamentos" icon="📅"
        value={actuals.scheduled} goal={schedGoal}
        color="#3b82f6"
        onEdit={() => { setEditingField(schedKey); setEditValue(String(schedGoal)); }}
      />
      <MetricCard
        label="Avaliações Realizadas" icon="✅"
        value={actuals.completed} goal={compGoal}
        color="#22c55e"
        onEdit={() => { setEditingField(compKey); setEditValue(String(compGoal)); }}
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

      {/* Modal inline de edição de meta */}
      {editingField && (
        <View style={styles.editCard}>
          <Text style={styles.editTitle}>Definir Meta</Text>
          <TextInput
            style={styles.editInput}
            value={editValue}
            onChangeText={setEditValue}
            keyboardType="number-pad"
            autoFocus
            placeholder="Ex: 20"
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
  container:       { padding: 20, paddingBottom: 40 },
  pageLabel:       { fontSize: 11, fontWeight: '700', color: T.t3, letterSpacing: 1.5, marginBottom: 4 },
  pageTitle:       { fontSize: 28, fontWeight: '900', color: T.t1, marginBottom: 24 },
  periodRow:       { flexDirection: 'row', backgroundColor: T.card, borderRadius: 12, padding: 4, marginBottom: 24, gap: 4 },
  periodBtn:       { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center' },
  periodBtnActive: { backgroundColor: T.blue },
  periodLabel:     { fontSize: 13, fontWeight: '700', color: T.t2 },
  periodLabelActive: { color: '#fff' },
  card:            { backgroundColor: T.card, borderRadius: 16, padding: 16, marginBottom: 16 },
  editBtn:         { backgroundColor: T.surface, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  summaryCard:     { backgroundColor: T.card, borderRadius: 16, padding: 16, marginTop: 8 },
  summaryTitle:    { fontSize: 13, fontWeight: '700', color: T.t2, marginBottom: 16, textAlign: 'center' },
  summaryRow:      { flexDirection: 'row' },
  summaryItem:     { flex: 1, alignItems: 'center' },
  summaryValue:    { fontSize: 28, fontWeight: '900', color: T.t1 },
  summaryLabel:    { fontSize: 11, color: T.t3, marginTop: 4, fontWeight: '600' },
  editCard:        { backgroundColor: T.card, borderRadius: 16, padding: 20, marginTop: 16, borderWidth: 1.5, borderColor: T.blue },
  editTitle:       { fontSize: 16, fontWeight: '800', color: T.t1, marginBottom: 12 },
  editInput:       { backgroundColor: T.surface, borderRadius: 10, padding: 14, fontSize: 24, fontWeight: '900', color: T.t1, textAlign: 'center', borderWidth: 1, borderColor: T.border },
  editActionBtn:   { flex: 1, padding: 14, borderRadius: 10, alignItems: 'center' },
});