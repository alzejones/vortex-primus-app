// ============================================================
// ApresentacoesPendentesContent.tsx — Apresentações sem Venda
// Lista todas as apresentações que ainda não viraram venda
// Filtros: Mês + Dia (opcional) + Busca por nome
// ============================================================
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useState, useMemo } from 'react';
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
import { supabase } from '../../lib/supabase';
import { T } from '../../utils/theme';
import { normalizeSearch } from '../../utils/textSearch';
import SaleFormModal, { Kit, KitItem, Pricing, ClientRow, SaleRow, maskPhone, notify } from './SaleFormModal';

type Presentation = {
  id: string;
  prospect_name: string;
  prospect_phone: string | null;
  contact_date: string;
  converted: boolean;
};

function fmtDateFull(d: string) {
  const [y, m, day] = d.split('-');
  return `${day}/${m}/${y}`;
}

export default function ApresentacoesPendentesContent() {
  const [loading, setLoading] = useState(true);
  const [trainerId, setTrainerId] = useState<string | null>(null);
  const [trainerLevel, setTrainerLevel] = useState<string>('50');
  const [presentations, setPresentations] = useState<Presentation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMonth, setFilterMonth] = useState<string>('');
  const [filterDay, setFilterDay] = useState<string>('');

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
      setLoading(true);
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

      const [{ data: k }, { data: ki }, { data: pr }, { data: cl }, { data: pres }] = await Promise.all([
        supabase.from('herbalife_kits').select('id, name, default_price, is_redemption_only, is_access_kit, triggers_reset_protocol').eq('active', true).order('name'),
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
          .select('id, prospect_name, prospect_phone, contact_date, converted')
          .eq('trainer_id', trainer.id)
          .eq('source', 'apresentacao')
          .eq('converted', false)
          .order('contact_date', { ascending: false }),
      ]);

      setKits((k as any) || []);
      setKitItems((ki as any) || []);
      setPricing(((pr as any) || []).map((p: any) => ({ ...p, name: p.supplements?.name })));
      setClients((cl as any) || []);
      setPresentations((pres as any) || []);
    } catch (e) {
      console.error('Erro ao carregar dados:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const filteredPresentations = useMemo(() => {
    let result = presentations;

    if (searchQuery.trim()) {
      const normalized = normalizeSearch(searchQuery);
      result = result.filter((p) =>
        normalizeSearch(p.prospect_name).includes(normalized)
      );
    }

    if (filterMonth || filterDay) {
      result = result.filter((p) => {
        const [y, m, d] = p.contact_date.split('-');

        if (filterMonth && m !== filterMonth) return false;
        if (filterDay && d !== filterDay.padStart(2, '0')) return false;

        return true;
      });
    }

    return result;
  }, [presentations, searchQuery, filterMonth, filterDay]);

  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    presentations.forEach((p) => {
      const [y, m] = p.contact_date.split('-');
      months.add(m);
    });
    return Array.from(months).sort();
  }, [presentations]);

  function handleSendMessage(item: Presentation) {
    const digits = (item.prospect_phone || '').replace(/\D/g, '');
    if (!digits) {
      notify('Sem celular', `${item.prospect_name} não tem celular cadastrado.`);
      return;
    }

    const fullPhone = (digits.length > 11 && digits.startsWith('55')) ? digits : '55' + digits;
    const firstName = item.prospect_name.split(' ')[0];
    const message = `Oi ${firstName}! Tudo bem? Vi que você fez uma apresentação e queria saber se ficou alguma dúvida 😊`;

    Linking.openURL(`whatsapp://send?phone=${fullPhone}&text=${encodeURIComponent(message)}`).catch(err => {
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
      loadData();
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

  const monthNames: Record<string, string> = {
    '01': 'Janeiro',
    '02': 'Fevereiro',
    '03': 'Março',
    '04': 'Abril',
    '05': 'Maio',
    '06': 'Junho',
    '07': 'Julho',
    '08': 'Agosto',
    '09': 'Setembro',
    '10': 'Outubro',
    '11': 'Novembro',
    '12': 'Dezembro',
  };

  if (loading) {
    return (
      <View style={[s.center, { backgroundColor: T.bg }]}>
        <ActivityIndicator size="large" color={T.blue} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: T.bg }}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Text style={s.backBtnText}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.title}>Apresentações sem Venda</Text>
          <Text style={s.subtitle}>{presentations.length} pendentes</Text>
        </View>
      </View>

      {/* Filtros */}
      <View style={s.filtersContainer}>
        <TextInput
          style={s.searchInput}
          placeholder="Buscar por nome..."
          placeholderTextColor={T.t3}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

        <View style={s.dateFilters}>
          <View style={s.dateFilterGroup}>
            <Text style={s.filterLabel}>Mês</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <TouchableOpacity
                style={[s.monthChip, !filterMonth && s.monthChipActive]}
                onPress={() => setFilterMonth('')}
              >
                <Text style={[s.monthChipText, !filterMonth && s.monthChipTextActive]}>
                  Todos
                </Text>
              </TouchableOpacity>
              {availableMonths.map((month) => (
                <TouchableOpacity
                  key={month}
                  style={[s.monthChip, filterMonth === month && s.monthChipActive]}
                  onPress={() => setFilterMonth(month)}
                >
                  <Text
                    style={[
                      s.monthChipText,
                      filterMonth === month && s.monthChipTextActive,
                    ]}
                  >
                    {monthNames[month]}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={s.dateFilterGroup}>
            <Text style={s.filterLabel}>Dia (opcional)</Text>
            <TextInput
              style={s.dayInput}
              placeholder="1-31"
              placeholderTextColor={T.t3}
              keyboardType="number-pad"
              value={filterDay}
              onChangeText={(text) => {
                const num = parseInt(text, 10);
                if (text === '' || (num >= 1 && num <= 31)) {
                  setFilterDay(text);
                }
              }}
            />
          </View>
        </View>
      </View>

      {/* Lista */}
      <FlatList
        data={filteredPresentations}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        ListEmptyComponent={() => (
          <Text style={s.empty}>Nenhuma apresentação encontrada</Text>
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
          loadData();
        }}
      />
    </View>
  );
}

const s = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingBottom: 16, backgroundColor: T.bg },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#1A1A1A', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  backBtnText: { color: T.blue, fontSize: 20, fontWeight: '700' },
  title: { fontSize: 24, fontWeight: '700', color: '#FFF', marginBottom: 4 },
  subtitle: { color: T.t2, fontSize: 14 },
  filtersContainer: { paddingHorizontal: 20, marginBottom: 20 },
  searchInput: {
    backgroundColor: '#242424',
    borderRadius: 10,
    padding: 12,
    color: '#FFF',
    fontSize: 15,
    marginBottom: 16,
  },
  dateFilters: { gap: 12 },
  dateFilterGroup: { gap: 8 },
  filterLabel: { color: T.t2, fontSize: 13, fontWeight: '600' },
  monthChip: {
    backgroundColor: '#242424',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
  },
  monthChipActive: { backgroundColor: T.blue },
  monthChipText: { color: T.t2, fontSize: 13, fontWeight: '600' },
  monthChipTextActive: { color: '#000', fontWeight: '700' },
  dayInput: {
    backgroundColor: '#242424',
    borderRadius: 10,
    padding: 12,
    color: '#FFF',
    fontSize: 15,
    width: 100,
  },
  empty: { color: T.t2, fontSize: 14, textAlign: 'center', marginTop: 40 },
  presRow: { flexDirection: 'row', backgroundColor: '#1A1A1A', borderRadius: 10, padding: 12, marginBottom: 8, alignItems: 'center' },
  presDate: { color: '#888', fontSize: 12, marginBottom: 4 },
  presName: { color: '#FFF', fontWeight: '600', fontSize: 15, marginBottom: 2 },
  presPhone: { color: '#BBB', fontSize: 13 },
  whatsappBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#25D366', justifyContent: 'center', alignItems: 'center', marginLeft: 12 },
  whatsappIcon: { fontSize: 20 },
});
