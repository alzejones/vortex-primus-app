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
import { todayBR, daysAgoBR } from '../../utils/dateBR';
import { T } from '../../utils/theme';

const brl = (v: number) => `R$ ${Number(v || 0).toFixed(2).replace('.', ',')}`;
const fmtDate = (d: string) => {
  const [y, m, day] = d.split('-');
  return `${day}/${m}`;
};
// Soma/subtrai dias a uma data 'YYYY-MM-DD', em UTC puro (sem depender de fuso local)
function shiftDate(dateStr: string, delta: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + delta);
  return dt.toISOString().split('T')[0];
}
function fmtDateFull(d: string) {
  const [y, m, day] = d.split('-');
  return `${day}/${m}/${y}`;
}

type Tab = 'diario' | 'semanal' | 'mensal' | 'por_dia';

interface SaleRow {
  id: string;
  client_name_manual: string | null;
  client_status: string | null;
  sale_type: string;
  total_charged: number;
  total_profit: number;
  total_pv: number;
  clients?: { name: string } | null;
}

export default function RelatoriosContent() {
  const [tab, setTab] = useState<Tab>('diario');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [daily, setDaily] = useState<any[]>([]);
  const [weekly, setWeekly] = useState<any[]>([]);
  const [monthly, setMonthly] = useState<any[]>([]);
  const [trainerId, setTrainerId] = useState<string | null>(null);

  // aba "Por Dia"
  const [selectedDate, setSelectedDate] = useState<string>(todayBR());
  const [daySales, setDaySales] = useState<SaleRow[]>([]);
  const [dayProductLines, setDayProductLines] = useState<Record<string, string[]>>({});
  const [dayLoading, setDayLoading] = useState(false);

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
      setTrainerId(trainer.id);

      const cutoffStr = daysAgoBR(31);

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

  const loadDaySales = useCallback(async (tid: string, date: string) => {
    setDayLoading(true);
    try {
      const { data: sales } = await supabase
        .from('herbalife_sales')
        .select('id, client_name_manual, client_status, sale_type, total_charged, total_profit, total_pv, clients!herbalife_sales_client_id_fkey(name)')
        .eq('trainer_id', tid)
        .eq('sale_date', date)
        .order('created_at', { ascending: false });
      setDaySales((sales as any) || []);

      const saleIds = ((sales as any) || []).map((sRow: any) => sRow.id);
      if (saleIds.length > 0) {
        const { data: items } = await supabase
          .from('herbalife_sale_items')
          .select('sale_id, kit_id, kit_name, supplement_id, supplements(name)')
          .in('sale_id', saleIds);
        const lines: Record<string, string[]> = {};
        (items || []).forEach((it: any) => {
          const label = it.kit_id ? it.kit_name : (it.supplements?.name || 'Produto');
          if (!lines[it.sale_id]) lines[it.sale_id] = [];
          if (!lines[it.sale_id].includes(label)) lines[it.sale_id].push(label);
        });
        setDayProductLines(lines);
      } else {
        setDayProductLines({});
      }
    } catch (e) {
      console.error('Erro ao carregar vendas do dia:', e);
    } finally {
      setDayLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (tab === 'por_dia' && trainerId) loadDaySales(trainerId, selectedDate);
    }, [tab, trainerId, selectedDate, loadDaySales])
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
          {(['diario', 'semanal', 'mensal', 'por_dia'] as Tab[]).map((t) => (
            <TouchableOpacity
              key={t}
              style={[s.tabBtn, tab === t && s.tabBtnActive]}
              onPress={() => setTab(t)}
            >
              <Text style={[s.tabTxt, tab === t && s.tabTxtActive]}>
                {t === 'diario' ? 'Diário' : t === 'semanal' ? 'Semanal' : t === 'mensal' ? 'Mensal' : 'Por Dia'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => {
            setRefreshing(true);
            load();
            if (tab === 'por_dia' && trainerId) loadDaySales(trainerId, selectedDate);
          }} tintColor={T.blue} />
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

            {monthly.length > 0 && (
              <>
                <Text style={s.trendTitle}>— Tendências —</Text>
                <View style={s.headRow}>
                  <Text style={[s.hCell, { flex: 1 }]}>Mês</Text>
                  <Text style={[s.hCell, { flex: 1 }]}>P.V.T.</Text>
                  <Text style={[s.hCell, { flex: 1.4 }]}>Ganhos</Text>
                </View>
                {monthly
                  .filter((r) => r.month_start.slice(0, 7) === todayBR().slice(0, 7))
                  .map((r) => (
                  <View key={`tend-${r.month_start}`} style={s.row}>
                    <Text style={[s.cell, { flex: 1, color: '#FFF' }]}>
                      {r.month_start.slice(5, 7)}/{r.month_start.slice(2, 4)}
                    </Text>
                    <Text style={[s.cell, { flex: 1 }]}>{Number(r.tendencia_pvt).toFixed(2)}</Text>
                    <Text style={[s.cell, { flex: 1.4, color: T.blue }]}>{brl(r.tendencia_ganhos)}</Text>
                  </View>
                ))}
              </>
            )}
          </>
        )}
        {tab === 'por_dia' && (
          <>
            <View style={s.dateNav}>
              <TouchableOpacity style={s.dateNavBtn} onPress={() => setSelectedDate((d) => shiftDate(d, -1))}>
                <Text style={s.dateNavBtnTxt}>◀</Text>
              </TouchableOpacity>
              <View style={{ alignItems: 'center' }}>
                <Text style={s.dateNavLabel}>{fmtDateFull(selectedDate)}</Text>
                {selectedDate !== todayBR() && (
                  <TouchableOpacity onPress={() => setSelectedDate(todayBR())}>
                    <Text style={s.dateNavToday}>Ir para hoje</Text>
                  </TouchableOpacity>
                )}
              </View>
              <TouchableOpacity style={s.dateNavBtn} onPress={() => setSelectedDate((d) => shiftDate(d, 1))}>
                <Text style={s.dateNavBtnTxt}>▶</Text>
              </TouchableOpacity>
            </View>

            {dayLoading ? (
              <ActivityIndicator size="small" color={T.blue} style={{ marginTop: 20 }} />
            ) : (
              <>
                <View style={s.dayCardsRow}>
                  <View style={s.dayCard}>
                    <Text style={s.dayCardLabel}>Vendas</Text>
                    <Text style={s.dayCardValue}>{daySales.length}</Text>
                  </View>
                  <View style={s.dayCard}>
                    <Text style={s.dayCardLabel}>Faturado</Text>
                    <Text style={s.dayCardValue}>{brl(daySales.reduce((sum, v) => sum + Number(v.total_charged), 0))}</Text>
                  </View>
                  <View style={s.dayCard}>
                    <Text style={s.dayCardLabel}>Lucro</Text>
                    <Text style={[s.dayCardValue, { color: '#4ADE80' }]}>{brl(daySales.reduce((sum, v) => sum + Number(v.total_profit), 0))}</Text>
                  </View>
                </View>

                {daySales.length === 0 && (
                  <Text style={s.empty}>Nenhuma venda nesse dia.</Text>
                )}
                {daySales.map((v) => (
                  <View key={v.id} style={s.saleRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={s.saleName}>
                        {v.clients?.name || v.client_name_manual || 'Cliente'}
                        {v.client_status ? `  ·  ${v.client_status[0].toUpperCase()}` : ''}
                      </Text>
                      {(dayProductLines[v.id] || []).map((line, idx) => (
                        <Text key={idx} style={s.saleProduct}>{line}</Text>
                      ))}
                      <Text style={s.saleMeta}>
                        {v.sale_type === 'acesso' ? 'Acesso' : 'Produto fechado'} · PV {Number(v.total_pv).toFixed(2)}
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={s.saleCharged}>{brl(Number(v.total_charged))}</Text>
                      <Text style={s.saleProfit}>lucro {brl(Number(v.total_profit))}</Text>
                    </View>
                  </View>
                ))}
              </>
            )}
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
  trendTitle: { color: '#FFF', fontWeight: '700', fontSize: 14, marginTop: 20, marginBottom: 8 },
  weekCard: { backgroundColor: '#1A1A1A', borderRadius: 12, padding: 14, marginBottom: 10 },
  weekTitle: { color: '#FFF', fontWeight: '700', marginBottom: 8 },
  weekLine: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  weekLabel: { color: '#999', fontSize: 13 },
  weekValue: { color: '#FFF', fontWeight: '600', fontSize: 13 },
  dateNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  dateNavBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#1A1A1A', justifyContent: 'center', alignItems: 'center' },
  dateNavBtnTxt: { color: T.blue, fontSize: 16, fontWeight: '700' },
  dateNavLabel: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  dateNavToday: { color: T.blue, fontSize: 11, fontWeight: '600', marginTop: 2 },
  dayCardsRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  dayCard: { flex: 1, backgroundColor: '#1A1A1A', borderRadius: 12, padding: 12, alignItems: 'center' },
  dayCardLabel: { color: '#999', fontSize: 11, marginBottom: 6 },
  dayCardValue: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  saleRow: { flexDirection: 'row', backgroundColor: '#1A1A1A', borderRadius: 10, padding: 12, marginBottom: 8, alignItems: 'center' },
  saleName: { color: '#FFF', fontWeight: '600' },
  saleProduct: { color: '#BBB', fontSize: 12, marginTop: 2 },
  saleMeta: { color: '#888', fontSize: 12, marginTop: 2 },
  saleCharged: { color: '#FFF', fontWeight: '700' },
  saleProfit: { color: '#4ADE80', fontSize: 12 },
});
