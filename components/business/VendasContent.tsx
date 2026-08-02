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

// ---------- helpers ----------
function notify(title: string, msg: string) {
  if (Platform.OS === 'web') window.alert(`${title}\n\n${msg}`);
  else Alert.alert(title, msg);
}
const brl = (v: number) =>
  `R$ ${Number(v || 0).toFixed(2).replace('.', ',')}`;

// Máscara de celular BR: formata enquanto digita e também na exibição
// (cobre números já salvos sem máscara, como nos testes iniciais).
// Alterna 4/5 dígitos no corpo conforme o tamanho (fixo vs celular).
function maskPhone(raw: string): string {
  const digits = (raw || '').replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

// ---------- tipos ----------
interface Kit {
  id: string;
  name: string;
  default_price: number;
  is_redemption_only: boolean;
}
interface KitItem {
  kit_id: string;
  supplement_id: string;
  doses_used: number;
}
interface Pricing {
  supplement_id: string;
  sku: string;
  pv: number;
  price_venda: number;
  price_bronze: number;
  price_prata: number;
  price_ouro: number;
  price_25: number;
  price_35: number;
  price_42: number;
  price_50: number;
  doses_per_package: number | null;
  name?: string;
}
interface ClientRow {
  id: string;
  name: string;
  herbalife_discount_level: string;
}
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

export default function VendasContent({ prefillClientId, onGoToReports }: { prefillClientId?: string; onGoToReports?: () => void }) {
  const [prefillDone, setPrefillDone] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [trainerId, setTrainerId] = useState<string | null>(null);
  const [trainerLevel, setTrainerLevel] = useState<string>('50');

  // resumo do dia
  const [convites, setConvites] = useState(0);
  const [acessosHoje, setAcessosHoje] = useState(0);
  const [ganhosHoje, setGanhosHoje] = useState(0);
  const [vendasHoje, setVendasHoje] = useState<SaleRow[]>([]);
  const [saleProductLines, setSaleProductLines] = useState<Record<string, string[]>>({});
  const [apresentacoesHoje, setApresentacoesHoje] = useState(0);
  const [presentacoesLista, setPresentacoesLista] = useState<{ id: string; prospect_name: string; prospect_phone: string | null }[]>([]);

  // catálogo
  const [kits, setKits] = useState<Kit[]>([]);
  const [kitItems, setKitItems] = useState<KitItem[]>([]);
  const [pricing, setPricing] = useState<Pricing[]>([]);
  const [clients, setClients] = useState<ClientRow[]>([]);

  // modal nova venda
  const [modalOpen, setModalOpen] = useState(false);
  const [saleType, setSaleType] = useState<'acesso' | 'produto_fechado'>('acesso');
  const [selKit, setSelKit] = useState<Kit | null>(null);
  const [selProduct, setSelProduct] = useState<Pricing | null>(null);
  const [qty, setQty] = useState('1');
  const [price, setPrice] = useState('');
  const [selClient, setSelClient] = useState<ClientRow | null>(null);
  const [manualName, setManualName] = useState('');
  const [manualPhone, setManualPhone] = useState('');
  const [selectedProspectId, setSelectedProspectId] = useState<string | null>(null);
  const [isIndicacao, setIsIndicacao] = useState(false);
  const [pickerOpen, setPickerOpen] = useState<'kit' | 'produto' | 'cliente' | 'apresentacao' | null>(null);
  const [pickerSearch, setPickerSearch] = useState('');
  const [saving, setSaving] = useState(false);

  // modal nova apresentação (Kit Acesso)
  const [presModalOpen, setPresModalOpen] = useState(false);
  const [presName, setPresName] = useState('');
  const [presPhone, setPresPhone] = useState('');
  const [presSaving, setPresSaving] = useState(false);

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
            .select('id, client_name_manual, client_status, sale_type, total_charged, total_profit, total_pv, clients!herbalife_sales_client_id_fkey(name)')
            .eq('trainer_id', trainer.id)
            .eq('sale_date', today)
            .order('created_at', { ascending: false }),
          supabase.from('herbalife_kits').select('id, name, default_price, is_redemption_only').eq('active', true).order('name'),
          supabase.from('herbalife_kit_items').select('kit_id, supplement_id, doses_used'),
          supabase
            .from('herbalife_pricing')
            .select('*, supplements(name)')
            .order('sku'),
          supabase
            .from('clients')
            .select('id, name, herbalife_discount_level')
            .eq('trainer_id', trainer.id)
            .eq('is_active', true)
            .order('name'),
          supabase
            .from('herbalife_prospects')
            .select('id, prospect_name, prospect_phone')
            .eq('trainer_id', trainer.id)
            .eq('source', 'apresentacao')
            .eq('contact_date', today)
            .order('created_at', { ascending: false }),
        ]);

      setConvites(daily?.convites ?? 0);
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
          .select('sale_id, kit_id, kit_name, supplement_id, supplements(name)')
          .in('sale_id', saleIds);
        const lines: Record<string, string[]> = {};
        (items || []).forEach((it: any) => {
          const label = it.kit_id ? it.kit_name : (it.supplements?.name || 'Produto');
          if (!lines[it.sale_id]) lines[it.sale_id] = [];
          if (!lines[it.sale_id].includes(label)) lines[it.sale_id].push(label);
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
          setSelClient(found);
          setSaleType('acesso');
          setSelKit(null);
          setSelProduct(null);
          setQty('1');
          setPrice('');
          setManualName('');
          setIsIndicacao(false);
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

  // ---------- convites ----------
  async function bumpInvites(delta: number) {
    if (!trainerId) return;
    const { data, error } = await supabase.rpc('increment_daily_invites', {
      p_trainer_id: trainerId,
      p_delta: delta,
    });
    if (!error) setConvites(data ?? 0);
  }

  // ---------- custo por nível do consultor ----------
  function trainerUnitCost(p: Pricing): number {
    const map: Record<string, number> = {
      '25': p.price_25,
      '35': p.price_35,
      '42': p.price_42,
      '50': p.price_50,
    };
    return Number(map[trainerLevel] ?? p.price_50);
  }
  function clientUnitPrice(p: Pricing, level: string): number {
    const map: Record<string, number> = {
      venda: p.price_venda,
      bronze: p.price_bronze,
      prata: p.price_prata,
      ouro: p.price_ouro,
    };
    return Number(map[level] ?? p.price_venda);
  }

  // custo do kit = soma (custo_pote/doses) * doses_usadas
  function kitCost(kit: Kit): { cost: number; pv: number } {
    let cost = 0;
    let pv = 0;
    for (const item of kitItems.filter((i) => i.kit_id === kit.id)) {
      const p = pricing.find((pr) => pr.supplement_id === item.supplement_id);
      if (!p) continue;
      const doses = p.doses_per_package || 1;
      cost += (trainerUnitCost(p) / doses) * Number(item.doses_used);
      pv += (Number(p.pv) / doses) * Number(item.doses_used);
    }
    return { cost, pv };
  }

  function openNewSale() {
    setSaleType('acesso');
    setSelKit(null);
    setSelProduct(null);
    setQty('1');
    setPrice('');
    setSelClient(null);
    setManualName('');
    setManualPhone('');
    setSelectedProspectId(null);
    setIsIndicacao(false);
    setModalOpen(true);
  }

  // Atalho: tocar num nome em "Apresentações Kit Acesso de hoje" já abre a
  // Nova Venda com nome/celular/vínculo preenchidos — mesmo efeito de
  // selecionar pelo picker de dentro do modal, só que em 1 toque.
  function sellToProspect(p: { id: string; prospect_name: string; prospect_phone: string | null }) {
    openNewSale();
    setManualName(p.prospect_name);
    setManualPhone(p.prospect_phone ? maskPhone(p.prospect_phone) : '');
    setSelectedProspectId(p.id);
  }

  function pickKit(k: Kit) {
    setSelKit(k);
    setPrice(String(k.default_price));
    setPickerOpen(null);
  }
  function pickProduct(p: Pricing) {
    setSelProduct(p);
    const level = selClient?.herbalife_discount_level || 'venda';
    setPrice(String(clientUnitPrice(p, level)));
    setPickerOpen(null);
  }

  function openPicker(type: 'kit' | 'produto' | 'cliente' | 'apresentacao') {
    setPickerSearch('');
    setPickerOpen(type);
  }

  async function saveSale() {
    if (!trainerId) return;
    const chargedUnit = parseFloat(price.replace(',', '.'));
    const quantity = parseInt(qty) || 1;
    const isRedemption = saleType === 'acesso' && selKit?.is_redemption_only === true;
    if (isNaN(chargedUnit) || (chargedUnit <= 0 && !isRedemption)) {
      notify('Atenção', 'Informe um valor válido.');
      return;
    }
    if (saleType === 'acesso' && !selKit) {
      notify('Atenção', 'Selecione um kit.');
      return;
    }
    if (saleType === 'produto_fechado' && !selProduct) {
      notify('Atenção', 'Selecione um produto.');
      return;
    }
    if (!selClient && !manualName.trim()) {
      notify('Atenção', 'Selecione um cliente ou digite o nome.');
      return;
    }
    setSaving(true);
    try {
      // status N/I automático: indicação > repetidor (já comprou) > novo
      let status: 'novo' | 'indicacao' | 'repetidor' = 'novo';
      if (isIndicacao) status = 'indicacao';
      else if (selClient) {
        const { count } = await supabase
          .from('herbalife_sales')
          .select('id', { count: 'exact', head: true })
          .eq('client_id', selClient.id);
        if ((count ?? 0) > 0) status = 'repetidor';
      }

      let totalCharged = 0;
      let totalCost = 0;
      let totalPv = 0;
      const items: any[] = [];

      if (saleType === 'acesso' && selKit) {
        if (selKit.is_redemption_only) {
          totalCharged = 0;
          totalCost = 0;
          totalPv = 0;
          for (const item of kitItems.filter((i) => i.kit_id === selKit.id)) {
            items.push({
              supplement_id: item.supplement_id,
              kit_id: selKit.id,
              kit_name: selKit.name,
              quantity: Number(item.doses_used) * quantity,
              unit_charged: 0,
              unit_cost: 0,
              pv: 0,
            });
          }
        } else {
          const { cost, pv } = kitCost(selKit);
          totalCharged = chargedUnit * quantity;
          totalCost = cost * quantity;
          totalPv = pv * quantity;
          for (const item of kitItems.filter((i) => i.kit_id === selKit.id)) {
            const p = pricing.find((pr) => pr.supplement_id === item.supplement_id);
            if (!p) continue;
            const doses = p.doses_per_package || 1;
            items.push({
              supplement_id: item.supplement_id,
              kit_id: selKit.id,
              kit_name: selKit.name,
              quantity: Number(item.doses_used) * quantity,
              unit_charged: 0,
              unit_cost: trainerUnitCost(p) / doses,
              pv: (Number(p.pv) / doses) * Number(item.doses_used),
            });
          }
        }
      } else if (selProduct) {
        const cost = trainerUnitCost(selProduct);
        totalCharged = chargedUnit * quantity;
        totalCost = cost * quantity;
        totalPv = Number(selProduct.pv) * quantity;
        items.push({
          supplement_id: selProduct.supplement_id,
          kit_id: null,
          quantity,
          unit_charged: chargedUnit,
          unit_cost: cost,
          pv: Number(selProduct.pv),
        });
      }

      const { data: sale, error } = await supabase
        .from('herbalife_sales')
        .insert({
          trainer_id: trainerId,
          client_id: selClient?.id ?? null,
          client_name_manual: selClient ? null : manualName.trim(),
          client_status: status,
          sale_type: saleType,
          origin: 'manual',
          total_charged: totalCharged,
          total_cost: Number(totalCost.toFixed(2)),
          total_pv: Number(totalPv.toFixed(2)),
        })
        .select('id')
        .single();
      if (error) throw error;

      const { error: itemsErr } = await supabase
        .from('herbalife_sale_items')
        .insert(items.map((i) => ({ ...i, sale_id: sale.id })));
      if (itemsErr) throw itemsErr;

      // Cliente avulso (não cadastrado): garante que nome+celular não se percam.
      // Se veio de uma apresentação já lançada hoje, marca ela como convertida.
      // Se foi digitado na hora, cria um novo prospecto já convertido.
      if (!selClient && manualName.trim()) {
        const phone = manualPhone.trim() || null;
        if (selectedProspectId) {
          await supabase.from('herbalife_prospects').update({
            converted: true,
            converted_sale_id: sale.id,
            converted_at: new Date().toISOString(),
            ...(phone ? { prospect_phone: phone } : {}),
          }).eq('id', selectedProspectId);
        } else {
          await supabase.from('herbalife_prospects').insert({
            trainer_id: trainerId,
            prospect_name: manualName.trim(),
            prospect_phone: phone,
            source: 'venda_avulsa',
            converted: true,
            converted_sale_id: sale.id,
            converted_at: new Date().toISOString(),
          });
        }
      }

      setModalOpen(false);
      load();
    } catch (e: any) {
      console.error(e);
      notify('Erro', e.message || 'Falha ao salvar a venda.');
    } finally {
      setSaving(false);
    }
  }

  function openNewPresentation() {
    setPresName('');
    setPresPhone('');
    setPresModalOpen(true);
  }

  async function savePresentation() {
    if (!trainerId) return;
    if (!presName.trim()) {
      notify('Atenção', 'Informe o nome do prospecto.');
      return;
    }
    setPresSaving(true);
    try {
      const { error } = await supabase.from('herbalife_prospects').insert({
        trainer_id: trainerId,
        prospect_name: presName.trim(),
        prospect_phone: presPhone.trim() || null,
        source: 'apresentacao',
      });
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

  async function deleteSale(id: string) {
    const doDelete = async () => {
      await supabase.from('herbalife_sales').delete().eq('id', id);
      load();
    };
    if (Platform.OS === 'web') {
      if (window.confirm('Excluir esta venda?')) doDelete();
    } else {
      Alert.alert('Excluir venda', 'Confirma a exclusão?', [
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
            <View style={s.counterRow}>
              <TouchableOpacity style={s.counterBtn} onPress={() => bumpInvites(-1)}>
                <Text style={s.counterBtnTxt}>−</Text>
              </TouchableOpacity>
              <Text style={s.cardValue}>{convites}</Text>
              <TouchableOpacity style={[s.counterBtn, { backgroundColor: T.blue }]} onPress={() => bumpInvites(1)}>
                <Text style={[s.counterBtnTxt, { color: '#000' }]}>+</Text>
              </TouchableOpacity>
            </View>
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
          <TouchableOpacity key={v.id} style={s.saleRow} onLongPress={() => deleteSale(v.id)}>
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
          <Text style={s.hint}>Segure numa venda para excluir.</Text>
        )}

        <Text style={[s.sectionTitle, { marginTop: 24 }]}>Apresentações Kit Acesso de hoje</Text>
        {presentacoesLista.length === 0 && (
          <Text style={s.empty}>Nenhuma apresentação lançada hoje.</Text>
        )}
        {presentacoesLista.map((p) => (
          <TouchableOpacity
            key={p.id}
            style={s.presRow}
            onPress={() => sellToProspect(p)}
            onLongPress={() => deletePresentation(p.id)}
          >
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#A855F7', marginRight: 10 }} />
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

      {/* ---------- MODAL NOVA VENDA ---------- */}
      <Modal visible={modalOpen} animationType="slide" transparent>
        <View style={s.modalBg}>
          <View style={s.modalBox}>
            <ScrollView>
              <Text style={s.modalTitle}>Nova Venda</Text>

              <View style={s.toggleRow}>
                {(['acesso', 'produto_fechado'] as const).map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[s.toggleBtn, saleType === t && s.toggleBtnActive]}
                    onPress={() => { setSaleType(t); setSelKit(null); setSelProduct(null); setPrice(''); }}
                  >
                    <Text style={[s.toggleTxt, saleType === t && s.toggleTxtActive]}>
                      {t === 'acesso' ? 'Acesso (Kit)' : 'Produto Fechado'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {saleType === 'acesso' ? (
                <TouchableOpacity style={s.selector} onPress={() => openPicker('kit')}>
                  <Text style={s.selectorTxt}>{selKit ? selKit.name : 'Selecionar kit…'}</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={s.selector} onPress={() => openPicker('produto')}>
                  <Text style={s.selectorTxt} numberOfLines={1}>
                    {selProduct ? selProduct.name : 'Selecionar produto…'}
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity style={s.selector} onPress={() => openPicker('cliente')}>
                <Text style={s.selectorTxt}>
                  {selClient ? selClient.name : 'Cliente cadastrado (opcional)…'}
                </Text>
              </TouchableOpacity>
              {!selClient && (
                <>
                  <TextInput
                    style={s.input}
                    placeholder="Ou nome do cliente avulso"
                    placeholderTextColor="#777"
                    value={manualName}
                    onChangeText={(t) => { setManualName(t); setSelectedProspectId(null); }}
                  />
                  <TextInput
                    style={s.input}
                    placeholder="Celular do cliente avulso (opcional)"
                    placeholderTextColor="#777"
                    value={manualPhone}
                    onChangeText={(t) => setManualPhone(maskPhone(t))}
                    keyboardType="phone-pad"
                    maxLength={16}
                  />
                </>
              )}
              {!selClient && presentacoesLista.length > 0 && (
                <TouchableOpacity style={s.selector} onPress={() => openPicker('apresentacao')}>
                  <Text style={[s.selectorTxt, { color: '#A855F7' }]}>
                    🎤 Selecionar de "Apresentações Kit Acesso de hoje"…
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity style={s.checkRow} onPress={() => setIsIndicacao(!isIndicacao)}>
                <View style={[s.checkbox, isIndicacao && { backgroundColor: T.blue }]} />
                <Text style={s.checkTxt}>Veio por indicação</Text>
              </TouchableOpacity>

              <View style={s.inline}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={s.label}>Qtd</Text>
                  <TextInput style={s.input} keyboardType="numeric" value={qty} onChangeText={setQty} />
                </View>
                <View style={{ flex: 2 }}>
                  <Text style={s.label}>Valor unitário (editável)</Text>
                  <TextInput style={s.input} keyboardType="numeric" value={price} onChangeText={setPrice} />
                </View>
              </View>

              <Text style={s.totalPreview}>
                Total: {brl((parseFloat((price || '0').replace(',', '.')) || 0) * (parseInt(qty) || 1))}
              </Text>

              <View style={s.inline}>
                <TouchableOpacity style={[s.btn, s.btnGhost]} onPress={() => setModalOpen(false)}>
                  <Text style={s.btnGhostTxt}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[s.btn, { backgroundColor: T.blue }]} onPress={saveSale} disabled={saving}>
                  <Text style={s.btnTxt}>{saving ? 'Salvando…' : 'Confirmar Venda'}</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ---------- MODAL NOVA APRESENTAÇÃO (Kit Acesso) ---------- */}
      <Modal visible={presModalOpen} animationType="slide" transparent>
        <View style={s.modalBg}>
          <View style={s.modalBox}>
            <Text style={s.modalTitle}>Nova Apresentação — Kit Acesso</Text>

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

      {/* ---------- PICKER GENÉRICO ---------- */}
      <Modal visible={pickerOpen !== null} animationType="fade" transparent>
        <View style={s.modalBg}>
          <View style={[s.modalBox, { maxHeight: '70%' }]}>
            <Text style={s.modalTitle}>
              {pickerOpen === 'kit' ? 'Kits'
                : pickerOpen === 'produto' ? 'Produtos'
                : pickerOpen === 'apresentacao' ? 'Apresentações de hoje'
                : 'Clientes'}
            </Text>
            <TextInput
              style={s.input}
              placeholder="Buscar por nome…"
              placeholderTextColor="#777"
              value={pickerSearch}
              onChangeText={setPickerSearch}
              autoFocus
            />
            <FlatList
              data={(
                pickerOpen === 'kit'
                  ? kits
                  : pickerOpen === 'produto'
                  ? pricing.filter((p) => p.name)
                  : pickerOpen === 'apresentacao'
                  ? presentacoesLista
                  : clients
              ).filter((item: any) =>
                (item.name || item.prospect_name || '').toLowerCase().includes(pickerSearch.trim().toLowerCase())
              )}
              keyExtractor={(item: any) => item.id || item.supplement_id}
              renderItem={({ item }: any) => (
                <TouchableOpacity
                  style={s.pickerRow}
                  onPress={() => {
                    if (pickerOpen === 'kit') pickKit(item);
                    else if (pickerOpen === 'produto') pickProduct(item);
                    else if (pickerOpen === 'apresentacao') {
                      setManualName(item.prospect_name);
                      setManualPhone(item.prospect_phone ? maskPhone(item.prospect_phone) : '');
                      setSelectedProspectId(item.id);
                      setSelClient(null);
                      setPickerOpen(null);
                    } else {
                      setSelClient(item);
                      setSelectedProspectId(null);
                      setPickerOpen(null);
                      if (selProduct) setPrice(String(clientUnitPrice(selProduct, item.herbalife_discount_level)));
                    }
                  }}
                >
                  <Text style={s.pickerTxt} numberOfLines={1}>
                    {pickerOpen === 'apresentacao' ? item.prospect_name : item.name}
                    {pickerOpen === 'kit' ? `  ·  ${brl(item.default_price)}` : ''}
                    {pickerOpen === 'produto' ? `  ·  ${brl(item.price_venda)}` : ''}
                    {pickerOpen === 'apresentacao' && item.prospect_phone ? `  ·  ${maskPhone(item.prospect_phone)}` : ''}
                  </Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity style={[s.btn, s.btnGhost, { marginTop: 8 }]} onPress={() => { setPickerSearch(''); setPickerOpen(null); }}>
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
  counterRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  counterBtn: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#333', justifyContent: 'center', alignItems: 'center' },
  counterBtnTxt: { color: '#FFF', fontSize: 16, fontWeight: '700' },
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
  selector: { backgroundColor: '#242424', borderRadius: 10, padding: 12, marginBottom: 10 },
  selectorTxt: { color: '#DDD' },
  input: { backgroundColor: '#242424', borderRadius: 10, padding: 12, color: '#FFF', marginBottom: 10 },
  label: { color: '#999', fontSize: 12, marginBottom: 4 },
  inline: { flexDirection: 'row', marginTop: 4 },
  checkRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  checkbox: { width: 20, height: 20, borderRadius: 5, borderWidth: 1, borderColor: '#555', marginRight: 8 },
  checkTxt: { color: '#DDD' },
  btn: { flex: 1, padding: 13, borderRadius: 10, alignItems: 'center', marginHorizontal: 4 },
  btnTxt: { color: '#000', fontWeight: '700' },
  btnGhost: { backgroundColor: '#242424' },
  btnGhostTxt: { color: '#AAA', fontWeight: '600' },
  pickerRow: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#242424' },
  pickerTxt: { color: '#DDD' },
});
