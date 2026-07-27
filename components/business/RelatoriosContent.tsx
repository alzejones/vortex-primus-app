// ============================================================
// herbalife-relatorios.tsx — Relatórios Herbalife
// Diário / Semanal / Mensal lendo direto das views
// v_herbalife_daily, v_herbalife_weekly, v_herbalife_monthly.
// Substitui as planilhas manuais: zero digitação.
// ============================================================
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { supabase } from '../../lib/supabase';
import { T } from '../../utils/theme';

const brl = (v: number) => `R$ ${Number(v || 0).toFixed(2).replace('.', ',')}`;
const fmtDate = (d: string) => {
  const [y, m, day] = d.split('-');
  return `${day}/${m}`;
};

type Tab = 'diario' | 'semanal' | 'mensal';

export default function RelatoriosContent() {
  const [tab, setTab] = useState<Tab>('diario');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [daily, setDaily] = useState<any[]>([]);
  const [weekly, setWeekly] = useState<any[]>([]);
  const [monthly, setMonthly] = useState<any[]>([]);

  const load = useCallback(async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData?.user?.id;
      if (!uid) return;
      const { data: trainer } = await supabase
        .from('trainers')
        .select('id')
        .eq('user_id', uid)
        .single();
      if (!trainer) return;

      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 31);
      const cutoffStr = cutoff.toISOString().slice(0, 10);

      const [{ data: d }, { data: w }, { data: m }] = await Promise.all([
        supabase
          .from('v_herbalife_daily')
          .select('*')
          .eq('trainer_id', trainer.id)
          .gte('report_date', cutoffStr)
          .order('report_date', { ascending: false }),
        supabase
          .from('v_herbalife_weekly')
          .select('*')
          .eq('trainer_id', trainer.id)
          .order('week_start', { ascending: false })
          .limit(12),
        supabase
          .from('v_herbalife_monthly')
          .select('*')
          .eq('trainer_id', trainer.id)
          .order('month_start', { ascending: false })
          .limit(12),
      ]);
      setDaily(d || []);
      setWeekly(w || []);
      setMonthly(m || []);
    } catch (e) {
      console.error('Erro relatórios Herbalife:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (loading) {
    return (
      <View style={[s.center, { backgroundColor: T.bg }]}>
        <ActivityIndicator size="large" color={T.blue} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: T.bg }}>
      <View style={{ padding: 16, paddingBottom: 0 }}>
        <View style={s.tabs}>
          {(['diario', 'semanal', 'mensal'] as Tab[]).map((t) => (
            <TouchableOpacity
              key={t}
              style={[s.tabBtn, tab === t && s.tabBtnActive]}
              onPress={() => setTab(t)}
            >
              <Text style={[s.tabTxt, tab === t && s.tabTxtActive]}>
                {t === 'diario' ? 'Diário' : t === 'semanal' ? 'Semanal' : 'Mensal'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={T.blue} />
        }
      >
        {tab === 'diario' && (
          <>
            <View style={s.headRow}>
              <Text style={[s.hCell, { flex: 1 }]}>Dia</Text>
              <Text style={s.hCell}>Conv</Text>
              <Text style={s.hCell}>Entr</Text>
              <Text style={s.hCell}>Nov</Text>
              <Text style={s.hCell}>Ind</Text>
              <Text style={s.hCell}>Ace</Text>
              <Text style={[s.hCell, { flex: 1.4 }]}>Ganhos</Text>
            </View>
            {daily.map((r) => (
              <View key={r.report_date} style={s.row}>
                <Text style={[s.cell, { flex: 1, color: '#FFF' }]}>{fmtDate(r.report_date)}</Text>
                <Text style={s.cell}>{r.convites}</Text>
                <Text style={s.cell}>{r.entraram}</Text>
                <Text style={s.cell}>{r.novos}</Text>
                <Text style={s.cell}>{r.indicacoes}</Text>
                <Text style={s.cell}>{r.acessos}</Text>
                <Text style={[s.cell, { flex: 1.4, color: '#4ADE80' }]}>{brl(r.ganhos)}</Text>
              </View>
            ))}
            {daily.length === 0 && <Text style={s.empty}>Sem dados nos últimos 31 dias.</Text>}
          </>
        )}

        {tab === 'semanal' &&
          (weekly.length === 0 ? (
            <Text style={s.empty}>Sem dados semanais.</Text>
          ) : (
            weekly.map((r) => (
              <View key={r.week_start} style={s.weekCard}>
                <Text style={s.weekTitle}>
                  {fmtDate(r.week_start)} a {fmtDate(r.week_end)}
                </Text>
                <View style={s.weekLine}>
                  <Text style={s.weekLabel}>Acessos (média/dia)</Text>
                  <Text style={s.weekValue}>{Number(r.acessos_media).toFixed(1)}</Text>
                </View>
                <View style={s.weekLine}>
                  <Text style={s.weekLabel}>Ganho semanal</Text>
                  <Text style={[s.weekValue, { color: '#4ADE80' }]}>{brl(r.ganho_semanal)}</Text>
                </View>
                <View style={s.weekLine}>
                  <Text style={s.weekLabel}>Estimado mensal</Text>
                  <Text style={[s.weekValue, { color: T.blue }]}>{brl(r.estimado_mensal)}</Text>
                </View>
              </View>
            ))
          ))}

        {tab === 'mensal' && (
          <>
            <View style={s.headRow}>
              <Text style={[s.hCell, { flex: 1 }]}>Mês</Text>
              <Text style={[s.hCell, { flex: 1 }]}>Acessos</Text>
              <Text style={[s.hCell, { flex: 1 }]}>P.V.T.</Text>
              <Text style={[s.hCell, { flex: 1.4 }]}>Ganhos</Text>
            </View>
            {monthly.map((r) => (
              <View key={r.month_start} style={s.row}>
                <Text style={[s.cell, { flex: 1, color: '#FFF' }]}>
                  {r.month_start.slice(5, 7)}/{r.month_start.slice(2, 4)}
                </Text>
                <Text style={[s.cell, { flex: 1 }]}>{Number(r.acessos_media).toFixed(1)}</Text>
                <Text style={[s.cell, { flex: 1 }]}>{Number(r.pvt).toFixed(2)}</Text>
                <Text style={[s.cell, { flex: 1.4, color: '#4ADE80' }]}>{brl(r.ganhos)}</Text>
              </View>
            ))}
            {monthly.length === 0 && <Text style={s.empty}>Sem dados mensais.</Text>}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: '700', color: '#FFF', marginBottom: 12 },
  tabs: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  tabBtn: { flex: 1, padding: 10, borderRadius: 10, backgroundColor: '#1A1A1A', alignItems: 'center' },
  tabBtnActive: { backgroundColor: T.blue },
  tabTxt: { color: '#AAA', fontWeight: '600' },
  tabTxtActive: { color: '#000' },
  headRow: { flexDirection: 'row', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#333' },
  hCell: { flex: 0.8, color: '#888', fontSize: 11, fontWeight: '700' },
  row: { flexDirection: 'row', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#1E1E1E' },
  cell: { flex: 0.8, color: '#BBB', fontSize: 12 },
  empty: { color: '#777', fontStyle: 'italic', marginTop: 12 },
  weekCard: { backgroundColor: '#1A1A1A', borderRadius: 12, padding: 14, marginBottom: 10 },
  weekTitle: { color: '#FFF', fontWeight: '700', marginBottom: 8 },
  weekLine: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  weekLabel: { color: '#999', fontSize: 13 },
  weekValue: { color: '#FFF', fontWeight: '600', fontSize: 13 },
});
