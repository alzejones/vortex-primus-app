// ============================================================
// herbalife-relatorios.tsx — Relatórios Herbalife
// Diário / Semanal / Mensal lendo direto das views
// v_herbalife_daily, v_herbalife_weekly, v_herbalife_monthly.
// Substitui as planilhas manuais: zero digitação.
// ============================================================
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
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
import SaleFormModal, { Kit, KitItem, Pricing, ClientRow, SaleRow, maskPhone } from './SaleFormModal';
import SaleActionsModal from './SaleActionsModal';
import { deleteSaleWithConfirm } from '../../utils/salesActions';

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

const monthNames: Record<string, string> = {
  '01': 'Janeiro', '02': 'Fevereiro', '03': 'Março', '04': 'Abril',
  '05': 'Maio', '06': 'Junho', '07': 'Julho', '08': 'Agosto',
  '09': 'Setembro', '10': 'Outubro', '11': 'Novembro', '12': 'Dezembro',
};

export default function RelatoriosContent() {
  const [tab, setTab] = useState<Tab>('diario');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [daily, setDaily] = useState<any[]>([]);
  const [weekly, setWeekly] = useState<any[]>([]);
  const [monthly, setMonthly] = useState<any[]>([]);
  const [trainerId, setTrainerId] = useState<string | null>(null);
  const [trainerLevel, setTrainerLevel] = useState<string>('50');
  const [kits, setKits] = useState<Kit[]>([]);
  const [kitItems, setKitItems] = useState<KitItem[]>([]);
  const [pricing, setPricing] = useState<Pricing[]>([]);
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>(todayBR().slice(0, 7));
  const [showMonthPicker, setShowMonthPicker] = useState(false);

  // aba "Por Dia"
  const [selectedDate, setSelectedDate] = useState<string>(todayBR());
  const [daySales, setDaySales] = useState<SaleRow[]>([]);
  const [dayProductLines, setDayProductLines] = useState<Record<string, string[]>>({});
  const [dayPresentations, setDayPresentations] = useState<{ id: string; prospect_name: string; prospect_phone: string | null; converted: boolean }[]>([]);
  const [dayLoading, setDayLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<SaleRow | null>(null);
  const [actionSale, setActionSale] = useState<SaleRow | null>(null);
  const [prefillManualEntryForModal, setPrefillManualEntryForModal] = useState<
    { name: string; phone?: string; prospectId?: string } | undefined
  >(undefined);

  const load = useCallback(async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData?.user?.id;
      if (!uid) return;
      const { data: trainer } = await supabase
        .from('trainers')
        .select('id, herbalife_discount_level')
        .eq('user_id', uid)
        .single();
      if (!trainer) return;
      setTrainerId(trainer.id);
      setTrainerLevel(trainer.herbalife_discount_level || '50');

      const [y, m] = selectedMonth.split('-').map(Number);
      const firstDay = selectedMonth + '-01';
      const isCurrentMonth = selectedMonth === todayBR().slice(0, 7);
      const lastDay = isCurrentMonth ? todayBR() : new Date(y, m, 0).toISOString().split('T')[0];

      const [{ data: d }, { data: w }, { data: mon }, { data: k }, { data: ki }, { data: pr }, { data: cl }, { data: prospects }, { data: resets }] = await Promise.all([
        supabase
          .from('v_herbalife_daily')
          .select('*')
          .eq('trainer_id', trainer.id)
          .gte('report_date', firstDay)
          .lte('report_date', lastDay)
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
        supabase.from('herbalife_kits').select('id, name, default_price, is_redemption_only, is_access_kit').eq('active', true).or(`trainer_id.is.null,trainer_id.eq.${trainer.id}`).order('name'),
        supabase.from('herbalife_kit_items').select('kit_id, supplement_id, doses_used'),
        supabase
          .from('herbalife_pricing')
          .select('*, supplements(name)')
          .order('sku'),
        (async () => {
          let allClients: any[] = [];
          let page = 0;
          const pageSize = 1000;
          while (true) {
            const { data: clientsPage } = await supabase
              .from('clients')
              .select('id, name, herbalife_discount_level')
              .eq('trainer_id', trainer.id)
              .eq('is_active', true)
              .order('name')
              .order('id')
              .range(page * pageSize, (page + 1) * pageSize - 1);
            if (!clientsPage || clientsPage.length === 0) break;
            allClients = allClients.concat(clientsPage);
            if (clientsPage.length < pageSize) break;
            page++;
          }
          return { data: allClients };
        })(),
        supabase
          .from('herbalife_prospects')
          .select('contact_date')
          .eq('trainer_id', trainer.id)
          .eq('source', 'apresentacao')
          .gte('contact_date', firstDay)
          .lte('contact_date', lastDay),
        supabase
          .from('reset_protocol_enrollments')
          .select('sale_id, herbalife_sales!reset_protocol_enrollments_sale_id_fkey(sale_date)')
          .eq('trainer_id', trainer.id)
          .not('sale_id', 'is', null),
      ]);
      const prospectsMap = new Map<string, number>();
      (prospects || []).forEach((p: any) => {
        const count = prospectsMap.get(p.contact_date) || 0;
        prospectsMap.set(p.contact_date, count + 1);
      });

      const resetsMap = new Map<string, number>();
      (resets || []).forEach((r: any) => {
        const saleDate = r.herbalife_sales?.sale_date;
        if (saleDate && saleDate >= firstDay && saleDate <= lastDay) {
          const count = resetsMap.get(saleDate) || 0;
          resetsMap.set(saleDate, count + 1);
        }
      });

      const dailyMap = new Map<string, any>();
      (d || []).forEach((row) => dailyMap.set(row.report_date, row));

      const dailyWithApresentacoes = [];
      let current = lastDay;
      while (current >= firstDay) {
        const existing = dailyMap.get(current);
        dailyWithApresentacoes.push({
          report_date: current,
          convites: existing?.convites || 0,
          entraram: existing?.entraram || 0,
          novos: existing?.novos || 0,
          repetidores: existing?.repetidores || 0,
          indicacoes: existing?.indicacoes || 0,
          acessos: existing?.acessos || 0,
          ganhos: existing?.ganhos || 0,
          pv: existing?.pv || 0,
          apresentacoes: prospectsMap.get(current) || 0,
          resets: resetsMap.get(current) || 0,
        });
        current = shiftDate(current, -1);
      }

      setDaily(dailyWithApresentacoes);
      setWeekly(w || []);
      setMonthly(mon || []);
      setKits((k as any) || []);
      setKitItems((ki as any) || []);
      setPricing(((pr as any) || []).map((p: any) => ({ ...p, name: p.supplements?.name })));
      setClients((cl as any) || []);
    } catch (e) {
      console.error('Erro relatórios Herbalife:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedMonth]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load, selectedMonth])
  );

  const loadDaySales = useCallback(async (tid: string, date: string) => {
    setDayLoading(true);
    try {
      const [{ data: sales }, { data: prospects }] = await Promise.all([
        supabase
          .from('herbalife_sales')
          .select('id, client_id, client_name_manual, client_phone_manual, client_status, sale_type, total_charged, total_profit, total_pv, clients!herbalife_sales_client_id_fkey(name)')
          .eq('trainer_id', tid)
          .eq('sale_date', date)
          .order('created_at', { ascending: false }),
        supabase
          .from('herbalife_prospects')
          .select('id, prospect_name, prospect_phone, converted')
          .eq('trainer_id', tid)
          .eq('source', 'apresentacao')
          .eq('contact_date', date)
          .order('created_at', { ascending: false }),
      ]);
      setDaySales((sales as any) || []);
      setDayPresentations((prospects as any) || []);

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

  function sellToProspect(p: { id: string; prospect_name: string; prospect_phone: string | null }) {
    setPrefillManualEntryForModal({
      name: p.prospect_name,
      phone: p.prospect_phone || undefined,
      prospectId: p.id,
    });
    setEditingSale(null);
    setModalOpen(true);
  }

  async function deletePresentation(id: string) {
    const doDelete = async () => {
      await supabase.from('herbalife_prospects').delete().eq('id', id);
      if (trainerId) loadDaySales(trainerId, selectedDate);
    };
    if (Platform.OS === 'web') {
      if (window.confirm('Excluir esta apresentação?')) doDelete();
    } else {
      Alert.alert('Excluir apresentação', 'Confirma a exclusão?', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Excluir', style: 'destructive', onPress: doDelete },
      ]);
    }
  }

  function convertToClient(sale: SaleRow) {
    setActionSale(null);
    const nameToUse = sale.client_name_manual || 'Cliente';
    router.push({
      pathname: '/client-create' as any,
      params: { from: 'avulso', sale_id: sale.id, name: nameToUse, phone: sale.client_phone_manual || '' },
    });
  }

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
            <TouchableOpacity
              style={s.monthSelector}
              onPress={() => setShowMonthPicker(!showMonthPicker)}
            >
              <Text style={s.monthSelectorText}>
                {monthNames[selectedMonth.slice(5, 7)]}/{selectedMonth.slice(0, 4)}
              </Text>
              <Text style={s.monthSelectorArrow}>{showMonthPicker ? '▲' : '▼'}</Text>
            </TouchableOpacity>

            {showMonthPicker && (
              <View style={s.monthPickerContainer}>
                {Array.from({ length: 12 }, (_, i) => {
                  const today = new Date();
                  const targetDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
                  const monthKey = targetDate.toISOString().slice(0, 7);
                  const monthLabel = `${monthNames[monthKey.slice(5, 7)]}/${monthKey.slice(0, 4)}`;
                  return (
                    <TouchableOpacity
                      key={monthKey}
                      style={[s.monthPickerItem, selectedMonth === monthKey && s.monthPickerItemActive]}
                      onPress={() => {
                        setSelectedMonth(monthKey);
                        setShowMonthPicker(false);
                      }}
                    >
                      <Text style={[s.monthPickerItemText, selectedMonth === monthKey && s.monthPickerItemTextActive]}>
                        {monthLabel}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {daily.length > 0 && (
              <View style={[s.row, { backgroundColor: '#1A1A1A', paddingVertical: 8, marginBottom: 4 }]}>
                <Text style={[s.cell, { flex: 0.5, color: '#FFF', fontWeight: '700' }]}>Total</Text>
                <Text style={[s.cell, { fontWeight: '700', color: '#FFF', textAlign: 'right' }]}>{daily.reduce((sum, r) => sum + r.convites, 0)}</Text>
                <Text style={[s.cell, { fontWeight: '700', color: '#FFF', textAlign: 'right' }]}>{daily.reduce((sum, r) => sum + r.apresentacoes, 0)}</Text>
                <Text style={[s.cell, { fontWeight: '700', color: '#FFF', textAlign: 'right' }]}>{daily.reduce((sum, r) => sum + r.resets, 0)}</Text>
                <Text style={[s.cell, { fontWeight: '700', color: '#FFF', textAlign: 'right' }]}>{daily.reduce((sum, r) => sum + r.novos, 0)}</Text>
                <Text style={[s.cell, { fontWeight: '700', color: '#FFF', textAlign: 'right' }]}>{daily.reduce((sum, r) => sum + r.repetidores, 0)}</Text>
                <Text style={[s.cell, { fontWeight: '700', color: '#FFF', textAlign: 'right' }]}>{daily.reduce((sum, r) => sum + r.indicacoes, 0)}</Text>
                <Text style={[s.cell, { fontWeight: '700', color: '#FFF', textAlign: 'right' }]}>{daily.reduce((sum, r) => sum + r.acessos, 0)}</Text>
                <Text style={[s.cell, { flex: 1, fontWeight: '700', color: '#FFF', textAlign: 'right' }]}>{daily.reduce((sum, r) => sum + r.pv, 0).toFixed(2)}</Text>
                <Text style={[s.cell, { flex: 1.2, fontWeight: '700', color: '#4ADE80', textAlign: 'right' }]}>{brl(daily.reduce((sum, r) => sum + r.ganhos, 0))}</Text>
              </View>
            )}

            <View style={s.headRow}>
              <Text style={[s.hCell, { flex: 0.5 }]} numberOfLines={1}>Dia</Text>
              <Text style={s.hCell} numberOfLines={1}>Contat</Text>
              <Text style={s.hCell} numberOfLines={1}>Apres</Text>
              <Text style={s.hCell} numberOfLines={1}>Reset</Text>
              <Text style={s.hCell} numberOfLines={1}>Nov</Text>
              <Text style={s.hCell} numberOfLines={1}>Rep</Text>
              <Text style={s.hCell} numberOfLines={1}>Ind</Text>
              <Text style={s.hCell} numberOfLines={1}>Aces</Text>
              <Text style={[s.hCell, { textAlign: 'right' }]} numberOfLines={1}>PV</Text>
              <Text style={[s.hCell, { flex: 1.2, textAlign: 'right' }]} numberOfLines={1}>Ganhos</Text>
            </View>
            {daily.map((r) => (
              <View key={r.report_date} style={s.row}>
                <Text style={[s.cell, { flex: 0.5, color: '#FFF' }]}>{r.report_date.slice(8, 10)}</Text>
                <Text style={[s.cell, { textAlign: 'right' }]}>{r.convites}</Text>
                <Text style={[s.cell, { textAlign: 'right' }]}>{r.apresentacoes}</Text>
                <Text style={[s.cell, { textAlign: 'right' }]}>{r.resets}</Text>
                <Text style={[s.cell, { textAlign: 'right' }]}>{r.novos}</Text>
                <Text style={[s.cell, { textAlign: 'right' }]}>{r.repetidores}</Text>
                <Text style={[s.cell, { textAlign: 'right' }]}>{r.indicacoes}</Text>
                <Text style={[s.cell, { textAlign: 'right' }]}>{r.acessos}</Text>
                <Text style={[s.cell, { flex: 1, textAlign: 'right' }]}>{Number(r.pv).toFixed(2)}</Text>
                <Text style={[s.cell, { flex: 1.2, color: '#4ADE80', textAlign: 'right' }]}>{brl(r.ganhos)}</Text>
              </View>
            ))}
            {daily.length === 0 && <Text style={s.empty}>Sem dados neste mês.</Text>}
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
                  <TouchableOpacity key={v.id} style={s.saleRow} onLongPress={() => setActionSale(v)}>
                    <View style={{ flex: 1 }}>
                      <Text style={s.saleName}>
                        {v.clients?.name || v.client_name_manual || 'Cliente'}
                        {v.client_status ? `  ·  ${v.client_status[0].toUpperCase()}` : ''}
                      </Text>
                      {(dayProductLines[v.id] || []).map((line, idx) => (
                        <Text key={idx} style={s.saleProduct}>{line}</Text>
                      ))}
                      <Text style={s.saleMeta}>
                        {v.sale_type === 'acesso' ? 'Acesso' : v.sale_type === 'misto' ? 'Misto' : 'Produto fechado'} · PV {Number(v.total_pv).toFixed(2)}
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={s.saleCharged}>{brl(Number(v.total_charged))}</Text>
                      <Text style={s.saleProfit}>lucro {brl(Number(v.total_profit))}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
                {daySales.length > 0 && (
                  <Text style={s.hint}>Segure numa venda para editar ou excluir.</Text>
                )}

                <Text style={[s.sectionTitle, { marginTop: 24, marginBottom: 10 }]}>Apresentações Kit Acesso — {fmtDateFull(selectedDate)}</Text>
                {dayPresentations.length === 0 && (
                  <Text style={s.empty}>Nenhuma apresentação nesse dia.</Text>
                )}
                {dayPresentations.map((p) => (
                  <TouchableOpacity
                    key={p.id}
                    style={[
                      s.presRow,
                      p.converted && { backgroundColor: 'rgba(74, 222, 128, 0.12)' }
                    ]}
                    onPress={() => sellToProspect(p)}
                    onLongPress={() => deletePresentation(p.id)}
                  >
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: p.converted ? '#4ADE80' : '#A855F7', marginRight: 10 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={s.saleName}>{p.prospect_name}</Text>
                      {p.prospect_phone && <Text style={s.saleMeta}>{maskPhone(p.prospect_phone)}</Text>}
                    </View>
                  </TouchableOpacity>
                ))}
                {dayPresentations.length > 0 && (
                  <Text style={s.hint}>Toque para vender · segure para excluir.</Text>
                )}
              </>
            )}
          </>
        )}
      </ScrollView>

      <SaleFormModal
        visible={modalOpen}
        editingSale={editingSale}
        trainerId={trainerId!}
        trainerLevel={trainerLevel}
        kits={kits}
        kitItems={kitItems}
        pricing={pricing}
        clients={clients}
        prefillManualEntry={prefillManualEntryForModal}
        onClose={() => {
          setModalOpen(false);
          setPrefillManualEntryForModal(undefined);
        }}
        onSaved={() => {
          if (trainerId) loadDaySales(trainerId, selectedDate);
          load();
        }}
      />

      <SaleActionsModal
        sale={actionSale}
        onClose={() => setActionSale(null)}
        onEdit={(sale) => {
          setEditingSale(sale);
          setActionSale(null);
          setModalOpen(true);
        }}
        onDelete={(id) => {
          deleteSaleWithConfirm(id, () => {
            if (trainerId) loadDaySales(trainerId, selectedDate);
            load();
          });
          setActionSale(null);
        }}
        onConvertToClient={convertToClient}
      />
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
  headRow: { flexDirection: 'row', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#333' },
  hCell: { flex: 0.7, color: '#888', fontSize: 9, fontWeight: '700', minWidth: 0 },
  row: { flexDirection: 'row', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#1E1E1E' },
  cell: { flex: 0.7, color: '#BBB', fontSize: 10, minWidth: 0 },
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
  hint: { color: '#666', fontSize: 11, marginTop: 4, textAlign: 'center' },
  sectionTitle: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  presRow: { flexDirection: 'row', backgroundColor: '#1A1A1A', borderRadius: 10, padding: 12, marginBottom: 8, alignItems: 'center' },
  monthSelector: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#1A1A1A', borderRadius: 10, padding: 12, marginBottom: 12 },
  monthSelectorText: { color: '#FFF', fontSize: 16, fontWeight: '700', marginRight: 8 },
  monthSelectorArrow: { color: T.blue, fontSize: 14, fontWeight: '700' },
  monthPickerContainer: { backgroundColor: '#1A1A1A', borderRadius: 10, padding: 8, marginBottom: 12 },
  monthPickerItem: { padding: 10, borderRadius: 8 },
  monthPickerItemActive: { backgroundColor: T.blue },
  monthPickerItemText: { color: '#AAA', fontSize: 14, fontWeight: '600', textAlign: 'center' },
  monthPickerItemTextActive: { color: '#000' },
});
