import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
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
import { todayBR } from '../../utils/dateBR';

export function notify(title: string, msg: string) {
  if (Platform.OS === 'web') window.alert(`${title}\n\n${msg}`);
  else Alert.alert(title, msg);
}

const brl = (v: number) =>
  `R$ ${Number(v || 0).toFixed(2).replace('.', ',')}`;

export function maskPhone(raw: string): string {
  const digits = (raw || '').replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export interface Kit {
  id: string;
  name: string;
  default_price: number;
  is_redemption_only: boolean;
}
export interface KitItem {
  kit_id: string;
  supplement_id: string;
  doses_used: number;
}
export interface Pricing {
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
export interface ClientRow {
  id: string;
  name: string;
  herbalife_discount_level: string;
}
export interface SaleRow {
  id: string;
  client_id: string | null;
  client_name_manual: string | null;
  client_status: string | null;
  sale_type: string;
  total_charged: number;
  total_profit: number;
  total_pv: number;
  sale_date?: string;
  clients?: { name: string } | null;
}

interface SaleFormModalProps {
  visible: boolean;
  editingSale: SaleRow | null;
  trainerId: string;
  trainerLevel: string;
  kits: Kit[];
  kitItems: KitItem[];
  pricing: Pricing[];
  clients: ClientRow[];
  presentacoesLista?: { id: string; prospect_name: string; prospect_phone: string | null }[];
  prefillClient?: ClientRow;
  prefillManualEntry?: { name: string; phone?: string; prospectId?: string };
  onClose: () => void;
  onSaved: () => void;
}

export default function SaleFormModal({
  visible,
  editingSale,
  trainerId,
  trainerLevel,
  kits,
  kitItems,
  pricing,
  clients,
  presentacoesLista = [],
  prefillClient,
  prefillManualEntry,
  onClose,
  onSaved,
}: SaleFormModalProps) {
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

  useEffect(() => {
    if (!visible) return;

    if (editingSale) {
      (async () => {
        try {
          const { data: items } = await supabase
            .from('herbalife_sale_items')
            .select('*')
            .eq('sale_id', editingSale.id);

          if (!items || items.length === 0) return;

          if (editingSale.sale_type === 'acesso') {
            const firstItem = items[0];
            const kit = kits.find((k) => k.id === firstItem.kit_id);
            if (!kit) return;

            const kitItem = kitItems.find(
              (ki) => ki.kit_id === firstItem.kit_id && ki.supplement_id === firstItem.supplement_id
            );
            const dosesUsed = kitItem?.doses_used || 1;
            const originalQty = Math.round(firstItem.quantity / dosesUsed);
            const unitPrice = originalQty > 0 ? editingSale.total_charged / originalQty : editingSale.total_charged;

            setSaleType('acesso');
            setSelKit(kit);
            setSelProduct(null);
            setQty(String(originalQty));
            setPrice(String(unitPrice));
          } else {
            const firstItem = items[0];
            const product = pricing.find((p) => p.supplement_id === firstItem.supplement_id);
            if (!product) return;

            setSaleType('produto_fechado');
            setSelProduct(product);
            setSelKit(null);
            setQty(String(firstItem.quantity));
            setPrice(String(firstItem.unit_charged));
          }

          if (editingSale.client_id) {
            const client = clients.find((c) => c.id === editingSale.client_id);
            if (client) {
              setSelClient(client);
              setManualName('');
              setManualPhone('');
            } else {
              setSelClient(null);
              setManualName(editingSale.client_name_manual || '');
              setManualPhone('');
            }
          } else {
            setSelClient(null);
            setManualName(editingSale.client_name_manual || '');
            setManualPhone('');
          }

          setIsIndicacao(editingSale.client_status === 'indicacao');
        } catch (e) {
          console.error('Erro ao carregar venda para edição:', e);
        }
      })();
    } else {
      setSaleType('acesso');
      setSelKit(null);
      setSelProduct(null);
      setQty('1');
      setPrice('');
      setSelClient(prefillClient || null);
      setManualName(prefillManualEntry?.name || '');
      setManualPhone(prefillManualEntry?.phone ? maskPhone(prefillManualEntry.phone) : '');
      setSelectedProspectId(prefillManualEntry?.prospectId || null);
      setIsIndicacao(false);
    }
  }, [visible, editingSale, prefillClient, prefillManualEntry]);

  async function saveSale() {
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

      if (editingSale === null) {
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
      } else {
        const { error: updateErr } = await supabase
          .from('herbalife_sales')
          .update({
            client_id: selClient?.id ?? null,
            client_name_manual: selClient ? null : manualName.trim(),
            client_status: status,
            sale_type: saleType,
            total_charged: totalCharged,
            total_cost: Number(totalCost.toFixed(2)),
            total_pv: Number(totalPv.toFixed(2)),
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingSale.id);
        if (updateErr) throw updateErr;

        await supabase.from('herbalife_sale_items').delete().eq('sale_id', editingSale.id);

        const { error: itemsErr } = await supabase
          .from('herbalife_sale_items')
          .insert(items.map((i) => ({ ...i, sale_id: editingSale.id })));
        if (itemsErr) throw itemsErr;
      }

      onSaved();
      onClose();
    } catch (e: any) {
      console.error(e);
      notify('Erro', e.message || 'Falha ao salvar a venda.');
    } finally {
      setSaving(false);
    }
  }

  const isFromPresentation = !!prefillManualEntry?.prospectId && !editingSale;

  return (
    <>
      <Modal visible={visible} animationType="slide" transparent>
        <View style={s.modalBg}>
          <View style={s.modalBox}>
            <ScrollView>
              <Text style={s.modalTitle}>{editingSale ? 'Editar Venda' : 'Nova Venda'}</Text>

              <View style={s.toggleRow}>
                {(['acesso', 'produto_fechado'] as const).map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[s.toggleBtn, saleType === t && s.toggleBtnActive]}
                    onPress={() => {
                      setSaleType(t);
                      setSelKit(null);
                      setSelProduct(null);
                      setPrice('');
                    }}
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

              {isFromPresentation ? (
                <View style={{ backgroundColor: '#1A1A1A', borderRadius: 8, padding: 12, marginBottom: 12 }}>
                  <Text style={{ color: '#999', fontSize: 11, marginBottom: 4 }}>Vendendo para:</Text>
                  <Text style={{ color: '#FFF', fontSize: 15 }}>
                    {manualName}{manualPhone ? ` — ${manualPhone}` : ''}
                  </Text>
                </View>
              ) : (
                <>
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
                        onChangeText={(t) => {
                          setManualName(t);
                          setSelectedProspectId(null);
                        }}
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
                </>
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
                <TouchableOpacity style={[s.btn, s.btnGhost]} onPress={onClose}>
                  <Text style={s.btnGhostTxt}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[s.btn, { backgroundColor: T.blue }]} onPress={saveSale} disabled={saving}>
                  <Text style={s.btnTxt}>
                    {saving ? 'Salvando…' : editingSale ? 'Salvar Alterações' : 'Confirmar Venda'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={pickerOpen !== null} animationType="fade" transparent>
        <View style={s.modalBg}>
          <View style={[s.modalBox, { maxHeight: '70%' }]}>
            <Text style={s.modalTitle}>
              {pickerOpen === 'kit'
                ? 'Kits'
                : pickerOpen === 'produto'
                ? 'Produtos'
                : pickerOpen === 'apresentacao'
                ? 'Apresentações de hoje'
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
            <TouchableOpacity
              style={[s.btn, s.btnGhost, { marginTop: 8 }]}
              onPress={() => {
                setPickerSearch('');
                setPickerOpen(null);
              }}
            >
              <Text style={s.btnGhostTxt}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const s = StyleSheet.create({
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
  totalPreview: { color: '#4ADE80', fontSize: 14, fontWeight: '700', textAlign: 'right', marginBottom: 12 },
  pickerRow: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#242424' },
  pickerTxt: { color: '#DDD' },
});
