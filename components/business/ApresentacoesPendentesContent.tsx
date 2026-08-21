// ============================================================
// ApresentacoesPendentesContent.tsx — Apresentações sem Venda
// Lista todas as apresentações que ainda não viraram venda
// Filtros: Dia (setas ◀/▶) | Mês (setas ◀/▶) | Todas
// ============================================================
import { router } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { todayBR } from '../../utils/dateBR';
import { T } from '../../utils/theme';
import SaleFormModal, { Kit, KitItem, Pricing, ClientRow, SaleRow, maskPhone, notify } from './SaleFormModal';

type Presentation = {
  id: string;
  prospect_name: string;
  prospect_phone: string | null;
  contact_date: string;
  converted: boolean;
};

type DateFilterMode = 'dia' | 'mes' | 'todas';

const brl = (v: number) => `R$ ${Number(v || 0).toFixed(2).replace('.', ',')}`;

// Soma/subtrai dias a uma data 'YYYY-MM-DD', em UTC puro (sem depender de fuso local)
function shiftDate(dateStr: string, delta: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + delta);
  return dt.toISOString().split('T')[0];
}

// Soma/subtrai meses a uma data 'YYYY-MM-DD', em UTC puro
function shiftMonth(dateStr: string, delta: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCMonth(dt.getUTCMonth() + delta);
  return dt.toISOString().split('T')[0];
}

function fmtDateFull(d: string) {
  const [y, m, day] = d.split('-');
  return `${day}/${m}/${y}`;
}

// Formata mês/ano tipo "Agosto/2026"
function fmtMonthYear(dateStr: string) {
  const [y, m] = dateStr.split('-');
  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  return `${monthNames[Number(m) - 1]}/${y}`;
}

// Calcula primeiro dia do mês
function firstDayOfMonth(dateStr: string): string {
  const [y, m] = dateStr.split('-');
  return `${y}-${m}-01`;
}

// Calcula último dia do mês
function lastDayOfMonth(dateStr: string): string {
  const [y, m] = dateStr.split('-');
  const dt = new Date(Date.UTC(Number(y), Number(m), 0));
  return dt.toISOString().split('T')[0];
}

export default function ApresentacoesPendentesContent() {
  const [loading, setLoading] = useState(true);
  const [trainerId, setTrainerId] = useState<string | null>(null);
  const [trainerLevel, setTrainerLevel] = useState<string>('50');
  const [presentations, setPresentations] = useState<Presentation[]>([]);
  const [dateFilterMode, setDateFilterMode] = useState<DateFilterMode>('todas');
  const [selectedDate, setSelectedDate] = useState<string>(todayBR());
  const [searchText, setSearchText] = useState('');
  const [debounceTimeout, setDebounceTimeout] = useState<NodeJS.Timeout | null>(null);

  // Modal de venda
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<SaleRow | null>(null);
  const [prefillManualEntryForModal, setPrefillManualEntryForModal] = useState<
    { name: string; phone?: string; prospectId?: string } | undefined
  >(undefined);

  // Dados para o modal
  const [kits, setKits] = useState<Kit[]>([]);
  const [kitItems, setKitItems] = useState<KitItem[]>([]);
  const [pricing, setPricing] = useState<Pricing[]>([]);
  const [clients, setClients] = useState<ClientRow[]>([]);

  const loadData = useCallback(async () => {
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

      // Carregar kits, pricing e clients em paralelo
      const [{ data: k }, { data: ki }, { data: pr }, { data: cl }] = await Promise.all([
        supabase.from('herbalife_kits').select('id, name, default_price, is_redemption_only').eq('active', true).order('name'),
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
      ]);

      setKits((k as any) || []);
      setKitItems((ki as any) || []);
      setPricing(((pr as any) || []).map((p: any) => ({ ...p, name: p.supplements?.name })));
      setClients((cl as any) || []);

      loadPresentations(trainer.id, dateFilterMode, selectedDate, searchText);
    } catch (e) {
      console.error('Erro ao carregar dados:', e);
    } finally {
      setLoading(false);
    }
  }, [dateFilterMode, selectedDate, searchText]);

  const loadPresentations = useCallback(async (tid: string, mode: DateFilterMode, date: string, search: string) => {
    try {
      let query = supabase
        .from('herbalife_prospects')
        .select('id, prospect_name, prospect_phone, contact_date, converted')
        .eq('trainer_id', tid)
        .eq('source', 'apresentacao')
        .eq('converted', false);

      // Filtro de data
      if (mode === 'dia') {
        query = query.eq('contact_date', date);
      } else if (mode === 'mes') {
        const firstDay = firstDayOfMonth(date);
        const lastDay = lastDayOfMonth(date);
        query = query.gte('contact_date', firstDay).lte('contact_date', lastDay);
      }
      // mode === 'todas' não aplica filtro de data

      // Filtro de busca
      if (search.trim()) {
        query = query.ilike('prospect_name', `%${search.trim()}%`);
      }

      query = query.order('contact_date', { ascending: false });

      const { data } = await query;
      setPresentations((data as any) || []);
    } catch (e) {
      console.error('Erro ao carregar apresentações:', e);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  // Debounce da busca
  useEffect(() => {
    if (debounceTimeout) clearTimeout(debounceTimeout);
    const timeout = setTimeout(() => {
      if (trainerId) loadPresentations(trainerId, dateFilterMode, selectedDate, searchText);
    }, 300);
    setDebounceTimeout(timeout);
    return () => clearTimeout(timeout);
  }, [searchText, trainerId, dateFilterMode, selectedDate]);

  function handleSendMessage(item: Presentation) {
    const digits = (item.prospect_phone || '').replace(/\D/g, '');
    if (!digits) {
      notify('Sem celular', `${item.prospect_name} não tem celular cadastrado.`);
      return;
    }

    const fullPhone = (digits.length > 11 && digits.startsWith('55')) ? digits : '55' + digits;
    const firstName = item.prospect_name.split(' ')[0];
    const message = `Oi ${firstName}! Tudo bem? Vi que você fez uma apresentação e queria saber se ficou alguma dúvida 😊`;
    const url = `https://wa.me/${fullPhone}?text=${encodeURIComponent(message)}`;

    Linking.openURL(url).catch(err => {
      console.error('Erro ao abrir WhatsApp:', err);
      notify('Erro', 'Não foi possível abrir o WhatsApp.');
    });
  }

  function sellToProspect(p: Presentation) {
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
      if (trainerId) loadPresentations(trainerId, dateFilterMode, selectedDate, searchText);
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

  if (loading) {
    return (
      <View style={[s.center, { backgroundColor: T.bg }]}>
        <ActivityIndicator size="large" color={T.blue} />
      </View>
    );
  }

  const isToday = selectedDate === todayBR();
  const hasFilter = searchText.trim().length > 0 || dateFilterMode !== 'todas';

  return (
    <View style={{ flex: 1, backgroundColor: T.bg }}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Text style={s.backBtnText}>←</Text>
        </TouchableOpacity>
        <Text style={s.title}>Apresentações sem Venda</Text>
      </View>

      {/* Filtro de data */}
      <View style={s.filterContainer}>
        <View style={s.segmentedControl}>
          {(['dia', 'mes', 'todas'] as DateFilterMode[]).map((mode) => (
            <TouchableOpacity
              key={mode}
              style={[s.segment, dateFilterMode === mode && s.segmentActive]}
              onPress={() => setDateFilterMode(mode)}
            >
              <Text style={[s.segmentText, dateFilterMode === mode && s.segmentTextActive]}>
                {mode === 'dia' ? 'Dia' : mode === 'mes' ? 'Mês' : 'Todas'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Navegação de data */}
        {dateFilterMode === 'dia' && (
          <View style={s.dateNav}>
            <TouchableOpacity style={s.dateNavBtn} onPress={() => setSelectedDate((d) => shiftDate(d, -1))}>
              <Text style={s.dateNavBtnTxt}>◀</Text>
            </TouchableOpacity>
            <View style={{ alignItems: 'center' }}>
              <Text style={s.dateNavLabel}>{fmtDateFull(selectedDate)}</Text>
              {!isToday && (
                <TouchableOpacity onPress={() => setSelectedDate(todayBR())}>
                  <Text style={s.dateNavToday}>Ir para hoje</Text>
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity style={s.dateNavBtn} onPress={() => setSelectedDate((d) => shiftDate(d, 1))}>
              <Text style={s.dateNavBtnTxt}>▶</Text>
            </TouchableOpacity>
          </View>
        )}

        {dateFilterMode === 'mes' && (
          <View style={s.dateNav}>
            <TouchableOpacity style={s.dateNavBtn} onPress={() => setSelectedDate((d) => shiftMonth(d, -1))}>
              <Text style={s.dateNavBtnTxt}>◀</Text>
            </TouchableOpacity>
            <Text style={s.dateNavLabel}>{fmtMonthYear(selectedDate)}</Text>
            <TouchableOpacity style={s.dateNavBtn} onPress={() => setSelectedDate((d) => shiftMonth(d, 1))}>
              <Text style={s.dateNavBtnTxt}>▶</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Busca */}
        <TextInput
          style={s.searchInput}
          placeholder="Buscar por nome..."
          placeholderTextColor="#666"
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>

      {/* Lista */}
      <FlatList
        data={presentations}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        ListEmptyComponent={() => (
          <Text style={s.empty}>
            {hasFilter ? 'Nenhuma apresentação encontrada com esse filtro.' : 'Nenhuma apresentação pendente.'}
          </Text>
        )}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={s.presRow}
            onPress={() => sellToProspect(item)}
            onLongPress={() => deletePresentation(item.id)}
          >
            <View style={{ flex: 1 }}>
              <Text style={s.presDate}>{fmtDateFull(item.contact_date)}</Text>
              <Text style={s.presName}>{item.prospect_name}</Text>
              {item.prospect_phone && <Text style={s.presPhone}>{maskPhone(item.prospect_phone)}</Text>}
            </View>
            <TouchableOpacity
              style={s.whatsappBtn}
              onPress={(e) => {
                e.stopPropagation();
                handleSendMessage(item);
              }}
            >
              <Text style={s.whatsappIcon}>💬</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        )}
      />

      {/* Modal de venda */}
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
          if (trainerId) loadPresentations(trainerId, dateFilterMode, selectedDate, searchText);
        }}
      />
    </View>
  );
}

const s = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, paddingTop: 20, backgroundColor: T.bg, borderBottomWidth: 1, borderBottomColor: '#1E1E1E' },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#1A1A1A', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  backBtnText: { color: T.blue, fontSize: 20, fontWeight: '700' },
  title: { fontSize: 20, fontWeight: '700', color: '#FFF', flex: 1 },
  filterContainer: { padding: 16, paddingBottom: 8, backgroundColor: T.bg },
  segmentedControl: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  segment: { flex: 1, padding: 10, borderRadius: 10, backgroundColor: '#1A1A1A', alignItems: 'center' },
  segmentActive: { backgroundColor: T.blue },
  segmentText: { color: '#AAA', fontWeight: '600', fontSize: 14 },
  segmentTextActive: { color: '#000' },
  dateNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  dateNavBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#1A1A1A', justifyContent: 'center', alignItems: 'center' },
  dateNavBtnTxt: { color: T.blue, fontSize: 16, fontWeight: '700' },
  dateNavLabel: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  dateNavToday: { color: T.blue, fontSize: 11, fontWeight: '600', marginTop: 2 },
  searchInput: { backgroundColor: '#1A1A1A', borderRadius: 10, padding: 12, color: '#FFF', fontSize: 14 },
  empty: { color: '#777', fontStyle: 'italic', textAlign: 'center', marginTop: 40 },
  presRow: { flexDirection: 'row', backgroundColor: '#1A1A1A', borderRadius: 10, padding: 12, marginBottom: 8, alignItems: 'center' },
  presDate: { color: '#888', fontSize: 12, marginBottom: 4 },
  presName: { color: '#FFF', fontWeight: '600', fontSize: 15, marginBottom: 2 },
  presPhone: { color: '#BBB', fontSize: 13 },
  whatsappBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#25D366', justifyContent: 'center', alignItems: 'center', marginLeft: 12 },
  whatsappIcon: { fontSize: 20 },
});
