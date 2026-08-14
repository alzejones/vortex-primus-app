// ============================================================
// herbalife-vendas.tsx — Lançamento de Vendas Herbalife
// Contador de convites + Nova Venda (Acesso/Kit ou Produto
// Fechado) + vendas do dia. Alimenta toda a cascata de
// relatórios (v_herbalife_daily/weekly/monthly).
// ============================================================
import { router, useFocusEffect } from 'expo-router';
import { todayBR } from '../../utils/dateBR';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { supabase } from '../../lib/supabase';
import { T } from '../../utils/theme';
import SaleFormModal, { Kit, KitItem, Pricing, ClientRow, SaleRow, maskPhone } from './SaleFormModal';
import SaleActionsModal from './SaleActionsModal';
import { deleteSaleWithConfirm } from '../../utils/salesActions';

// ---------- helpers ----------
const brl = (v: number) =>
  `R$ ${Number(v || 0).toFixed(2).replace('.', ',')}`;

export default function VendasContent({ prefillClientId, onGoToReports }: { prefillClientId?: string; onGoToReports?: () => void }) {
  const [prefillDone, setPrefillDone] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [trainerId, setTrainerId] = useState<string | null>(null);
  const [trainerLevel, setTrainerLevel] = useState<string>('50');

  // resumo do dia
  const [convites, setConvites] = useState(0);
  const [convitesInput, setConvitesInput] = useState('');
  const [acessosHoje, setAcessosHoje] = useState(0);
  const [ganhosHoje, setGanhosHoje] = useState(0);
  const [vendasHoje, setVendasHoje] = useState<SaleRow[]>([]);
  const [saleProductLines, setSaleProductLines] = useState<Record<string, string[]>>({});
  const [apresentacoesHoje, setApresentacoesHoje] = useState(0);
  const [presentacoesLista, setPresentacoesLista] = useState<{ id: string; prospect_name: string; prospect_phone: string | null; converted: boolean }[]>([]);

  // catálogo
  const [kits, setKits] = useState<Kit[]>([]);
  const [kitItems, setKitItems] = useState<KitItem[]>([]);
  const [pricing, setPricing] = useState<Pricing[]>([]);
  const [clients, setClients] = useState<ClientRow[]>([]);

  // modal nova venda
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<SaleRow | null>(null);
  const [actionSale, setActionSale] = useState<SaleRow | null>(null);
  const [prefillClientForModal, setPrefillClientForModal] = useState<ClientRow | undefined>(undefined);
  const [prefillManualEntryForModal, setPrefillManualEntryForModal] = useState<
    { name: string; phone?: string; prospectId?: string } | undefined
  >(undefined);

  // modal nova apresentação (Kit Acesso)
  const [presModalOpen, setPresModalOpen] = useState(false);
  const [presMode, setPresMode] = useState<'existing' | 'avulso'>('existing');
  const [presSelectedClient, setPresSelectedClient] = useState<ClientRow | null>(null);
  const [presName, setPresName] = useState('');
  const [presPhone, setPresPhone] = useState('');
  const [presSaving, setPresSaving] = useState(false);
  const [clientPickerOpen, setClientPickerOpen] = useState(false);
  const [pickerSearch, setPickerSearch] = useState('');

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

      const today = todayBR();

      const [{ data: daily }, { data: sales }, { data: k }, { data: ki }, { data: pr }, { data: cl }, { data: pres }] =
        await Promise.all([
          supabase
            .from('v_herbalife_daily')
            .select('convites, acessos, ganhos')
            .eq('trainer_id', trainer.id)
            .eq('report_date', today)
            .maybeSingle(),
          supabase
            .from('herbalife_sales')
            .select('id, client_id, client_name_manual, client_phone_manual, client_status, sale_type, total_charged, total_profit, total_pv, clients!herbalife_sales_client_id_fkey(name)')
            .eq('trainer_id', trainer.id)
            .eq('sale_date', today)
            .order('created_at', { ascending: false }),
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
          supabase
            .from('herbalife_prospects')
            .select('id, prospect_name, prospect_phone, converted')
            .eq('trainer_id', trainer.id)
            .eq('source', 'apresentacao')
            .eq('contact_date', today)
            .order('created_at', { ascending: false }),
        ]);

      const convitesVal = daily?.convites ?? 0;
      setConvites(convitesVal);
      setConvitesInput(String(convitesVal));
      setAcessosHoje(daily?.acessos ?? 0);
      setGanhosHoje(Number(daily?.ganhos ?? 0));
      setVendasHoje((sales as any) || []);
      setPresentacoesLista((pres as any) || []);
      setApresentacoesHoje((pres || []).length);

      // Descrição de produto(s) por venda: agrupa por kit (1 linha por kit,
      // mesmo que o kit tenha várias linhas em herbalife_sale_items) ou por
      // produto avulso (1 linha por produto distinto).
      const saleIds = ((sales as any) || []).map((sRow: any) => sRow.id);
      if (saleIds.length > 0) {
        const { data: items } = await supabase
          .from('herbalife_sale_items')
          .select('sale_id, kit_id, kit_name, supplement_id, quantity, supplements(name)')
          .in('sale_id', saleIds);
        const lines: Record<string, string[]> = {};
        const kitProcessed = new Set<string>();
        (items || []).forEach((it: any) => {
          if (!lines[it.sale_id]) lines[it.sale_id] = [];
          if (it.kit_id) {
            const kitKey = `${it.sale_id}_${it.kit_id}`;
            if (!kitProcessed.has(kitKey)) {
              kitProcessed.add(kitKey);
              const dosesUsed = ((ki as any) || []).find((kitItem: any) => kitItem.kit_id === it.kit_id && kitItem.supplement_id === it.supplement_id)?.doses_used || 1;
              const kitQty = Math.round(it.quantity / dosesUsed);
              const label = `${it.kit_name}  ·  Qtd ${kitQty}`;
              lines[it.sale_id].push(label);
            }
          } else {
            const label = `${it.supplements?.name || 'Produto'}  ·  Qtd ${it.quantity}`;
            if (!lines[it.sale_id].includes(label)) lines[it.sale_id].push(label);
          }
        });
        setSaleProductLines(lines);
      } else {
        setSaleProductLines({});
      }

      setKits((k as any) || []);
      setKitItems((ki as any) || []);
      setPricing(((pr as any) || []).map((p: any) => ({ ...p, name: p.supplements?.name })));
      setClients((cl as any) || []);

      // Pré-seleção vinda da tela de dieta (Confirmar Venda)
      if (prefillClientId && !prefillDone) {
        const found = ((cl as any) || []).find((c: any) => c.id === prefillClientId);
        if (found) {
          setPrefillClientForModal(found);
          setEditingSale(null);
          setModalOpen(true);
        }
        setPrefillDone(true);
      }
    } catch (e) {
      console.error('Erro ao carregar vendas Herbalife:', e);
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

  // ---------- helpers ----------
  function notify(title: string, msg: string) {
    if (Platform.OS === 'web') {
      alert(`${title}\n\n${msg}`);
    } else {
      Alert.alert(title, msg);
    }
  }

  function openPicker(type: 'cliente') {
    setPickerSearch('');
    setClientPickerOpen(true);
  }

  // ---------- convites ----------
  async function setDailyInvites(count: number) {
    if (!trainerId) return;
    const { data, error } = await supabase.rpc('set_daily_invites', {
      p_trainer_id: trainerId,
      p_count: count,
    });
    if (!error) setConvites(data ?? 0);
  }

  function openNewSale() {
    setPrefillClientForModal(undefined);
    setPrefillManualEntryForModal(undefined);
    setEditingSale(null);
    setModalOpen(true);
  }

  function sellToProspect(p: { id: string; prospect_name: string; prospect_phone: string | null }) {
    setPrefillClientForModal(undefined);
    setPrefillManualEntryForModal({
      name: p.prospect_name,
      phone: p.prospect_phone || undefined,
      prospectId: p.id,
    });
    setEditingSale(null);
    setModalOpen(true);
  }

  function openNewPresentation() {
    setPresMode('existing');
    setPresSelectedClient(null);
    setPresName('');
    setPresPhone('');
    setPresModalOpen(true);
  }

  async function savePresentation() {
    if (!trainerId) return;
    if (presMode === 'existing' && !presSelectedClient) {
      notify('Atenção', 'Selecione um cliente.');
      return;
    }
    if (presMode === 'avulso' && !presName.trim()) {
      notify('Atenção', 'Informe o nome do prospecto.');
      return;
    }
    setPresSaving(true);
    try {
      const payload: any = {
        trainer_id: trainerId,
        source: 'apresentacao',
      };
      if (presMode === 'existing' && presSelectedClient) {
        payload.client_id = presSelectedClient.id;
        payload.prospect_name = presSelectedClient.name;
        const { data: clientData } = await supabase
          .from('clients')
          .select('phone')
          .eq('id', presSelectedClient.id)
          .single();
        payload.prospect_phone = clientData?.phone || null;
      } else {
        payload.client_id = null;
        payload.prospect_name = presName.trim();
        payload.prospect_phone = presPhone.trim() || null;
      }
      const { error } = await supabase.from('herbalife_prospects').insert(payload);
      if (error) throw error;
      setPresModalOpen(false);
      load();
    } catch (e: any) {
      console.error(e);
      notify('Erro', e.message || 'Falha ao salvar a apresentação.');
    } finally {
      setPresSaving(false);
    }
  }

  async function deletePresentation(id: string) {
    const doDelete = async () => {
      await supabase.from('herbalife_prospects').delete().eq('id', id);
      load();
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
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={T.blue} />
        }
      >
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 12 }}>
          <TouchableOpacity onPress={() => router.push('/herbalife-kits' as any)}>
            <Text style={{ color: T.blue, fontWeight: '700', fontSize: 13 }}>🧰 Kits</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => (onGoToReports ? onGoToReports() : router.push('/herbalife-relatorios' as any))}>
            <Text style={{ color: T.blue, fontWeight: '700', fontSize: 13 }}>📊 Relatórios</Text>
          </TouchableOpacity>
        </View>

        {/* resumo do dia */}
        <View style={s.cardsRow}>
          <View style={s.card}>
            <Text style={s.cardLabel}>Convites</Text>
            <TextInput
              style={s.convitesInput}
              keyboardType="number-pad"
              value={convitesInput}
              onChangeText={(t) => {
                const num = parseInt(t) || 0;
                if (num >= 0) {
                  setConvitesInput(t);
                  setDailyInvites(num);
                }
              }}
            />
          </View>
          <View style={s.card}>
            <Text style={s.cardLabel}>Acessos hoje</Text>
            <Text style={s.cardValue}>{acessosHoje}</Text>
          </View>
          <View style={s.card}>
            <Text style={s.cardLabel}>Ganhos hoje</Text>
            <Text style={[s.cardValue, { color: '#4ADE80' }]}>{brl(ganhosHoje)}</Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 4 }}>
          <View style={[s.card, { flex: 1 }]}>
            <Text style={s.cardLabel}>Apresentações Kit Acesso hoje</Text>
            <Text style={[s.cardValue, { color: '#A855F7' }]}>{apresentacoesHoje}</Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
          <TouchableOpacity style={[s.primaryBtn, { flex: 1, marginBottom: 0 }]} onPress={openNewSale}>
            <Text style={s.primaryBtnTxt}>+ Nova Venda</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.primaryBtn, { flex: 1, marginBottom: 0, backgroundColor: '#A855F7' }]} onPress={openNewPresentation}>
            <Text style={s.primaryBtnTxt}>+ Apresentação</Text>
          </TouchableOpacity>
        </View>

        <Text style={s.sectionTitle}>Vendas de hoje</Text>
        {vendasHoje.length === 0 && (
          <Text style={s.empty}>Nenhuma venda lançada hoje.</Text>
        )}
        {vendasHoje.map((v) => (
          <TouchableOpacity key={v.id} style={s.saleRow} onLongPress={() => setActionSale(v)}>
            <View style={{ flex: 1 }}>
              <Text style={s.saleName}>
                {v.clients?.name || v.client_name_manual || 'Cliente'}
                {v.client_status ? `  ·  ${v.client_status[0].toUpperCase()}` : ''}
              </Text>
              {(saleProductLines[v.id] || []).map((line, idx) => (
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
          </TouchableOpacity>
        ))}
        {vendasHoje.length > 0 && (
          <Text style={s.hint}>Segure numa venda para editar ou excluir.</Text>
        )}

        <Text style={[s.sectionTitle, { marginTop: 24 }]}>Apresentações Kit Acesso de hoje</Text>
        {presentacoesLista.length === 0 && (
          <Text style={s.empty}>Nenhuma apresentação lançada hoje.</Text>
        )}
        {presentacoesLista.map((p) => (
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
        {presentacoesLista.length > 0 && (
          <Text style={s.hint}>Toque para vender · segure para excluir.</Text>
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
        presentacoesLista={presentacoesLista}
        prefillClient={prefillClientForModal}
        prefillManualEntry={prefillManualEntryForModal}
        onClose={() => setModalOpen(false)}
        onSaved={load}
      />

      {/* ---------- MODAL NOVA APRESENTAÇÃO (Kit Acesso) ---------- */}
      <Modal visible={presModalOpen} animationType="slide" transparent>
        <View style={s.modalBg}>
          <View style={s.modalBox}>
            <Text style={s.modalTitle}>Nova Apresentação — Kit Acesso</Text>

            <View style={s.toggleRow}>
              {(['existing', 'avulso'] as const).map((m) => (
                <TouchableOpacity
                  key={m}
                  style={[s.toggleBtn, presMode === m && s.toggleBtnActive]}
                  onPress={() => {
                    setPresMode(m);
                    setPresSelectedClient(null);
                    setPresName('');
                    setPresPhone('');
                  }}
                >
                  <Text style={[s.toggleTxt, presMode === m && s.toggleTxtActive]}>
                    {m === 'existing' ? 'Cliente Existente' : 'Avulso'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {presMode === 'existing' ? (
              <>
                <TouchableOpacity style={s.selector} onPress={() => openPicker('cliente')}>
                  <Text style={s.selectorTxt}>
                    {presSelectedClient ? presSelectedClient.name : 'Selecionar cliente…'}
                  </Text>
                </TouchableOpacity>
                {presSelectedClient && (
                  <View style={{ backgroundColor: '#1A1A1A', borderRadius: 8, padding: 10, marginBottom: 10 }}>
                    <Text style={{ color: '#999', fontSize: 11 }}>Nome e celular serão copiados do cadastro</Text>
                  </View>
                )}
              </>
            ) : (
              <>
                <Text style={s.label}>Nome</Text>
                <TextInput
                  style={s.input}
                  placeholder="Nome do prospecto"
                  placeholderTextColor="#777"
                  value={presName}
                  onChangeText={setPresName}
                  autoFocus
                />

                <Text style={s.label}>Celular (opcional)</Text>
                <TextInput
                  style={s.input}
                  placeholder="(00) 00000-0000"
                  placeholderTextColor="#777"
                  value={presPhone}
                  onChangeText={(t) => setPresPhone(maskPhone(t))}
                  keyboardType="phone-pad"
                  maxLength={16}
                />
              </>
            )}

            <View style={s.inline}>
              <TouchableOpacity style={[s.btn, s.btnGhost]} onPress={() => setPresModalOpen(false)}>
                <Text style={s.btnGhostTxt}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.btn, { backgroundColor: '#A855F7' }]}
                onPress={savePresentation}
                disabled={presSaving}
              >
                <Text style={s.btnTxt}>{presSaving ? 'Salvando…' : 'Salvar Apresentação'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <SaleActionsModal
        sale={actionSale}
        onClose={() => setActionSale(null)}
        onEdit={(sale) => {
          setEditingSale(sale);
          setActionSale(null);
          setModalOpen(true);
        }}
        onDelete={(id) => {
          deleteSaleWithConfirm(id, load);
          setActionSale(null);
        }}
        onConvertToClient={convertToClient}
      />

      {/* ---------- MODAL PICKER DE CLIENTE ---------- */}
      <Modal visible={clientPickerOpen} animationType="fade" transparent>
        <View style={s.modalBg}>
          <View style={[s.modalBox, { maxHeight: '70%' }]}>
            <Text style={s.modalTitle}>Clientes</Text>
            <TextInput
              style={s.input}
              placeholder="Buscar por nome…"
              placeholderTextColor="#777"
              value={pickerSearch}
              onChangeText={setPickerSearch}
              autoFocus
            />
            <FlatList
              data={clients.filter((c) =>
                c.name.toLowerCase().includes(pickerSearch.trim().toLowerCase())
              )}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={s.pickerRow}
                  onPress={() => {
                    setPresSelectedClient(item);
                    setClientPickerOpen(false);
                  }}
                >
                  <Text style={s.pickerTxt} numberOfLines={1}>
                    {item.name}
                  </Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              style={[s.btn, s.btnGhost, { marginTop: 8 }]}
              onPress={() => {
                setPickerSearch('');
                setClientPickerOpen(false);
              }}
            >
              <Text style={s.btnGhostTxt}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: '700', color: '#FFF', marginBottom: 16 },
  cardsRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  card: { flex: 1, backgroundColor: '#1A1A1A', borderRadius: 12, padding: 12, alignItems: 'center' },
  cardLabel: { color: '#999', fontSize: 11, marginBottom: 6 },
  cardValue: { color: '#FFF', fontSize: 18, fontWeight: '700' },
  convitesInput: { backgroundColor: '#242424', borderRadius: 8, padding: 8, color: '#FFF', fontSize: 18, fontWeight: '700', textAlign: 'center', marginTop: 4, alignSelf: 'stretch', width: '100%' },
  primaryBtn: { backgroundColor: T.blue, borderRadius: 12, padding: 14, alignItems: 'center', marginBottom: 20 },
  primaryBtnTxt: { color: '#000', fontWeight: '700', fontSize: 16 },
  sectionTitle: { color: '#FFF', fontSize: 16, fontWeight: '600', marginBottom: 10 },
  empty: { color: '#777', fontStyle: 'italic' },
  saleRow: { flexDirection: 'row', backgroundColor: '#1A1A1A', borderRadius: 10, padding: 12, marginBottom: 8, alignItems: 'center' },
  presRow: { flexDirection: 'row', backgroundColor: '#1A1A1A', borderRadius: 10, padding: 12, marginBottom: 8, alignItems: 'center' },
  saleName: { color: '#FFF', fontWeight: '600' },
  saleProduct: { color: '#BBB', fontSize: 12, marginTop: 2 },
  saleMeta: { color: '#888', fontSize: 12, marginTop: 2 },
  saleCharged: { color: '#FFF', fontWeight: '700' },
  saleProfit: { color: '#4ADE80', fontSize: 12 },
  hint: { color: '#666', fontSize: 11, marginTop: 4, textAlign: 'center' },
  totalPreview: { color: '#4ADE80', fontSize: 14, fontWeight: '700', textAlign: 'right', marginBottom: 12 },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 20 },
  modalBox: { backgroundColor: '#161616', borderRadius: 16, padding: 18, maxHeight: '85%' },
  modalTitle: { color: '#FFF', fontSize: 18, fontWeight: '700', marginBottom: 14 },
  toggleRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  toggleBtn: { flex: 1, padding: 10, borderRadius: 10, backgroundColor: '#242424', alignItems: 'center' },
  toggleBtnActive: { backgroundColor: T.blue },
  toggleTxt: { color: '#AAA', fontWeight: '600', fontSize: 13 },
  toggleTxtActive: { color: '#000' },
  selector: { backgroundColor: '#242424', borderRadius: 10, padding: 14, marginBottom: 12 },
  selectorTxt: { color: '#FFF', fontSize: 15 },
  label: { color: '#999', fontSize: 13, fontWeight: '600', marginBottom: 6, marginTop: 8 },
  input: { backgroundColor: '#242424', borderRadius: 10, padding: 14, color: '#FFF', fontSize: 15, marginBottom: 12 },
  inline: { flexDirection: 'row', gap: 10, marginTop: 10 },
  btn: { flex: 1, padding: 14, borderRadius: 12, alignItems: 'center' },
  btnGhost: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#444' },
  btnTxt: { color: '#FFF', fontWeight: '700', fontSize: 15 },
  btnGhostTxt: { color: '#AAA', fontWeight: '700', fontSize: 15 },
  pickerRow: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#242424' },
  pickerTxt: { color: '#DDD' },
});
