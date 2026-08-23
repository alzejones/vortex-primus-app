import React, { useEffect, useState } from 'react';
import {
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
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { T } from '../../utils/theme';
import { normalizeSearch } from '../../utils/textSearch';
import ConfirmModal from '../ui/ConfirmModal';
import ResetProtocolDateModal from '../ui/ResetProtocolDateModal';

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
  triggers_reset_protocol?: boolean;
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
  client_phone_manual: string | null;
  client_status: string | null;
  sale_type: string;
  total_charged: number;
  total_profit: number;
  total_pv: number;
  sale_date?: string;
  clients?: { name: string } | null;
}

export interface CartItem {
  itemType: 'kit' | 'produto';
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
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
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selClient, setSelClient] = useState<ClientRow | null>(null);
  const [manualName, setManualName] = useState('');
  const [manualPhone, setManualPhone] = useState('');
  const [selectedProspectId, setSelectedProspectId] = useState<string | null>(null);
  const [isIndicacao, setIsIndicacao] = useState(false);
  const [pickerOpen, setPickerOpen] = useState<'kit' | 'produto' | 'cliente' | 'apresentacao' | null>(null);
  const [pickerSearch, setPickerSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [reassessTarget, setReassessTarget] = useState<{id: string; name: string} | null>(null);
  const [resetEnrollment, setResetEnrollment] = useState<{clientId: string; clientName: string; saleId: string; enrollmentId: string} | null>(null);

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
    const existing = cart.find((item) => item.itemType === 'kit' && item.id === k.id);
    if (existing) {
      setCart(cart.map((item) =>
        item.itemType === 'kit' && item.id === k.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, {
        itemType: 'kit',
        id: k.id,
        name: k.name,
        quantity: 1,
        unitPrice: k.default_price,
      }]);
    }
    setPickerOpen(null);
  }

  function pickProduct(p: Pricing) {
    const existing = cart.find((item) => item.itemType === 'produto' && item.id === p.supplement_id);
    if (existing) {
      setCart(cart.map((item) =>
        item.itemType === 'produto' && item.id === p.supplement_id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      const level = selClient?.herbalife_discount_level || 'venda';
      setCart([...cart, {
        itemType: 'produto',
        id: p.supplement_id,
        name: p.name || 'Produto',
        quantity: 1,
        unitPrice: clientUnitPrice(p, level),
      }]);
    }
    setPickerOpen(null);
  }

  function removeCartItem(index: number) {
    setCart(cart.filter((_, i) => i !== index));
  }

  function updateCartQuantity(index: number, qty: string) {
    const parsed = parseInt(qty) || 1;
    setCart(cart.map((item, i) => i === index ? { ...item, quantity: parsed } : item));
  }

  function updateCartPrice(index: number, price: string) {
    const normalized = price.replace(',', '.');
    const parsed = parseFloat(normalized) || 0;
    setCart(cart.map((item, i) => i === index ? { ...item, unitPrice: parsed } : item));
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

          const cartMap = new Map<string, CartItem>();
          items.forEach((item: any) => {
            if (item.kit_id) {
              const key = `kit_${item.kit_id}`;
              if (!cartMap.has(key)) {
                const kit = kits.find((k) => k.id === item.kit_id);
                if (!kit) return;
                const qty = item.line_qty != null ? item.line_qty : (() => {
                  const kitItem = kitItems.find((ki) => ki.kit_id === item.kit_id && ki.supplement_id === item.supplement_id);
                  const dosesUsed = kitItem?.doses_used || 1;
                  return Math.round(item.quantity / dosesUsed);
                })();
                const unitPrice = item.line_unit_charged != null ? item.line_unit_charged : (editingSale.total_charged / qty);
                cartMap.set(key, {
                  itemType: 'kit',
                  id: item.kit_id,
                  name: kit.name,
                  quantity: qty,
                  unitPrice,
                });
              }
            } else {
              const key = `produto_${item.supplement_id}`;
              if (!cartMap.has(key)) {
                const product = pricing.find((p) => p.supplement_id === item.supplement_id);
                if (!product) return;
                const qty = item.line_qty != null ? item.line_qty : item.quantity;
                const unitPrice = item.line_unit_charged != null ? item.line_unit_charged : item.unit_charged;
                cartMap.set(key, {
                  itemType: 'produto',
                  id: item.supplement_id,
                  name: product.name || 'Produto',
                  quantity: qty,
                  unitPrice,
                });
              }
            }
          });
          setCart(Array.from(cartMap.values()));

          if (editingSale.client_id) {
            const client = clients.find((c) => c.id === editingSale.client_id);
            if (client) {
              setSelClient(client);
              setManualName('');
              setManualPhone('');
            } else {
              setSelClient(null);
              setManualName(editingSale.client_name_manual || '');
              setManualPhone(editingSale.client_phone_manual ? maskPhone(editingSale.client_phone_manual) : '');
            }
          } else {
            setSelClient(null);
            setManualName(editingSale.client_name_manual || '');
            setManualPhone(editingSale.client_phone_manual ? maskPhone(editingSale.client_phone_manual) : '');
          }

          setIsIndicacao(editingSale.client_status === 'indicacao');
        } catch (e) {
          console.error('Erro ao carregar venda para edição:', e);
        }
      })();
    } else {
      setCart([]);
      setSelClient(prefillClient || null);
      setManualName(prefillManualEntry?.name || '');
      setManualPhone(prefillManualEntry?.phone ? maskPhone(prefillManualEntry.phone) : '');
      setSelectedProspectId(prefillManualEntry?.prospectId || null);
      setIsIndicacao(false);
    }
  }, [visible, editingSale, prefillClient, prefillManualEntry]);

  async function saveSale() {
    if (cart.length === 0) {
      notify('Atenção', 'Adicione pelo menos um item ao carrinho.');
      return;
    }
    if (!selClient && !manualName.trim()) {
      notify('Atenção', 'Selecione um cliente ou digite o nome.');
      return;
    }
    setSaving(true);
    try {
      const hasResetKit = cart.some((item) => {
        if (item.itemType !== 'kit') return false;
        const kit = kits.find((k) => k.id === item.id);
        return kit?.triggers_reset_protocol === true;
      });

      let status: 'novo' | 'indicacao' | 'repetidor' | null = null;
      if (isIndicacao) {
        status = 'indicacao';
      } else {
        let priorCount = 0;
        if (selClient) {
          const { count } = await supabase
            .from('herbalife_sales')
            .select('id', { count: 'exact', head: true })
            .eq('client_id', selClient.id);
          priorCount = count ?? 0;
        }

        if (priorCount > 0) {
          status = 'repetidor';
        } else if (hasResetKit) {
          status = null;
        } else {
          status = 'novo';
        }
      }

      let totalCharged = 0;
      let totalCost = 0;
      let totalPv = 0;
      const items: any[] = [];

      for (const cartItem of cart) {
        if (cartItem.itemType === 'kit') {
          const kit = kits.find((k) => k.id === cartItem.id);
          if (!kit) continue;
          if (kit.is_redemption_only) {
            for (const item of kitItems.filter((i) => i.kit_id === kit.id)) {
              items.push({
                supplement_id: item.supplement_id,
                kit_id: kit.id,
                kit_name: kit.name,
                quantity: Number(item.doses_used) * cartItem.quantity,
                unit_charged: 0,
                unit_cost: 0,
                pv: 0,
                line_qty: cartItem.quantity,
                line_unit_charged: cartItem.unitPrice,
              });
            }
          } else {
            const { cost, pv } = kitCost(kit);
            totalCharged += cartItem.unitPrice * cartItem.quantity;
            totalCost += cost * cartItem.quantity;
            totalPv += pv * cartItem.quantity;
            for (const item of kitItems.filter((i) => i.kit_id === kit.id)) {
              const p = pricing.find((pr) => pr.supplement_id === item.supplement_id);
              if (!p) continue;
              const doses = p.doses_per_package || 1;
              items.push({
                supplement_id: item.supplement_id,
                kit_id: kit.id,
                kit_name: kit.name,
                quantity: Number(item.doses_used) * cartItem.quantity,
                unit_charged: 0,
                unit_cost: trainerUnitCost(p) / doses,
                pv: (Number(p.pv) / doses) * Number(item.doses_used),
                line_qty: cartItem.quantity,
                line_unit_charged: cartItem.unitPrice,
              });
            }
          }
        } else {
          const product = pricing.find((p) => p.supplement_id === cartItem.id);
          if (!product) continue;
          const cost = trainerUnitCost(product);
          totalCharged += cartItem.unitPrice * cartItem.quantity;
          totalCost += cost * cartItem.quantity;
          totalPv += Number(product.pv) * cartItem.quantity;
          items.push({
            supplement_id: product.supplement_id,
            kit_id: null,
            quantity: cartItem.quantity,
            unit_charged: cartItem.unitPrice,
            unit_cost: cost,
            pv: Number(product.pv),
            line_qty: cartItem.quantity,
            line_unit_charged: cartItem.unitPrice,
          });
        }
      }

      const hasKits = cart.some((item) => item.itemType === 'kit');
      const hasProdutos = cart.some((item) => item.itemType === 'produto');
      const saleType = hasKits && hasProdutos ? 'misto' : hasKits ? 'acesso' : 'produto_fechado';

      if (editingSale === null) {
        const { data: sale, error } = await supabase
          .from('herbalife_sales')
          .insert({
            trainer_id: trainerId,
            client_id: selClient?.id ?? null,
            client_name_manual: selClient ? null : manualName.trim(),
            client_phone_manual: selClient ? null : (manualPhone.trim() || null),
            client_status: status,
            sale_type: saleType,
            origin: 'manual',
            total_charged: Number(totalCharged.toFixed(2)),
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

        let resolvedProspectId: string | null = selectedProspectId;
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
            const { data: newProspect } = await supabase.from('herbalife_prospects').insert({
              trainer_id: trainerId,
              prospect_name: manualName.trim(),
              prospect_phone: phone,
              source: 'venda_avulsa',
              converted: true,
              converted_sale_id: sale.id,
              converted_at: new Date().toISOString(),
            }).select('id').single();
            resolvedProspectId = newProspect?.id ?? null;
          }
        }

        onSaved();
        onClose();

        if (hasResetKit && selClient) {
          const { data: enrollment, error: enrollErr } = await supabase
            .from('reset_protocol_enrollments')
            .insert({
              trainer_id: trainerId,
              client_id: selClient.id,
              sale_id: sale.id,
              status: 'aguardando_data',
            })
            .select('id')
            .single();

          if (enrollErr) {
            console.error('Erro ao criar inscrição no Reset:', enrollErr);
            notify('Atenção', 'A venda foi registrada, mas houve um problema ao inscrever o cliente no Protocolo Reset. Avise o suporte ou tente novamente pela tela de Clientes Kit Reset.');
          } else if (enrollment) {
            setResetEnrollment({
              clientId: selClient.id,
              clientName: selClient.name,
              saleId: sale.id,
              enrollmentId: enrollment.id,
            });
          }
        } else if (selClient) {
          setReassessTarget({ id: selClient.id, name: selClient.name });
        } else if (!selClient && manualName.trim()) {
          let clientId: string | null = null;
          let clientName: string = manualName.trim();

          if (manualPhone.trim()) {
            const { data: existingClient } = await supabase.rpc('find_client_by_phone', { p_phone: manualPhone.trim() });
            if (existingClient && existingClient.length > 0) {
              clientId = existingClient[0].id;
              clientName = existingClient[0].name;
            }
          }

          if (!clientId) {
            const { data: newClient, error: clientErr } = await supabase
              .from('clients')
              .insert({
                trainer_id: trainerId,
                name: manualName.trim(),
                phone: manualPhone.trim() || null,
                client_status: 'Aluno',
              })
              .select('id, name')
              .single();

            if (!clientErr && newClient) {
              clientId = newClient.id;
              clientName = newClient.name;
            }
          }

          if (clientId) {
            if (resolvedProspectId) {
              await supabase.from('herbalife_prospects').update({
                client_id: clientId,
              }).eq('id', resolvedProspectId);
            }

            if (hasResetKit) {
              const { data: enrollment, error: enrollErr } = await supabase
                .from('reset_protocol_enrollments')
                .insert({
                  trainer_id: trainerId,
                  client_id: clientId,
                  sale_id: sale.id,
                  status: 'aguardando_data',
                })
                .select('id')
                .single();

              if (enrollErr) {
                console.error('Erro ao criar inscrição no Reset:', enrollErr);
                notify('Atenção', 'A venda foi registrada, mas houve um problema ao inscrever o cliente no Protocolo Reset. Avise o suporte ou tente novamente pela tela de Clientes Kit Reset.');
              } else if (enrollment) {
                setResetEnrollment({
                  clientId: clientId,
                  clientName: clientName,
                  saleId: sale.id,
                  enrollmentId: enrollment.id,
                });
              }
            } else if (saleType === 'produto_fechado') {
              setReassessTarget({ id: clientId, name: clientName });
            }
          }
        }
      } else {
        const { error: updateErr } = await supabase
          .from('herbalife_sales')
          .update({
            client_id: selClient?.id ?? null,
            client_name_manual: selClient ? null : manualName.trim(),
            client_phone_manual: selClient ? null : (manualPhone.trim() || null),
            client_status: status,
            sale_type: saleType,
            total_charged: Number(totalCharged.toFixed(2)),
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

        onSaved();
        onClose();
      }
    } catch (e: any) {
      console.error(e);
      notify('Erro', e.message || 'Falha ao salvar a venda.');
    } finally {
      setSaving(false);
    }
  }

  const isFromPresentation = !!prefillManualEntry?.prospectId && !editingSale;

  async function handleResetDateConfirm(startDate: string) {
    if (!resetEnrollment) return;
    try {
      await supabase
        .from('reset_protocol_enrollments')
        .update({ start_date: startDate })
        .eq('id', resetEnrollment.enrollmentId);
      setResetEnrollment(null);
    } catch (e: any) {
      console.error('Erro ao atualizar data de início do Reset:', e);
      notify('Erro', 'Falha ao salvar a data de início.');
    }
  }

  return (
    <>
      <ResetProtocolDateModal
        visible={!!resetEnrollment}
        clientName={resetEnrollment?.clientName || ''}
        onConfirmDate={handleResetDateConfirm}
        onDefineLater={() => setResetEnrollment(null)}
      />

      <ConfirmModal
        visible={!!reassessTarget}
        title="Venda registrada!"
        message={`Deseja agendar a reavaliação de ${reassessTarget?.name} agora?`}
        confirmLabel="Sim"
        cancelLabel="Não"
        onConfirm={() => {
          const target = reassessTarget;
          setReassessTarget(null);
          if (target) router.push(`/(protected)/schedule/new?client_id=${target.id}&suggested_type=Comp.Corporal` as any);
        }}
        onCancel={() => setReassessTarget(null)}
      />

      <Modal visible={visible} animationType="slide" transparent>
        <View style={s.modalBg}>
          <View style={s.modalBox}>
            <ScrollView>
              <Text style={s.modalTitle}>{editingSale ? 'Editar Venda' : 'Nova Venda'}</Text>

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
                        placeholder="Nome do Prospecto"
                        placeholderTextColor="#777"
                        value={manualName}
                        onChangeText={(t) => {
                          setManualName(t);
                          setSelectedProspectId(null);
                        }}
                      />
                      <TextInput
                        style={s.input}
                        placeholder="Celular do Prospecto (opcional)"
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
                        🎤 Selecionar de &ldquo;Apresentações Kit Acesso de hoje&rdquo;…
                      </Text>
                    </TouchableOpacity>
                  )}
                </>
              )}

              <TouchableOpacity style={s.checkRow} onPress={() => setIsIndicacao(!isIndicacao)}>
                <View style={[s.checkbox, isIndicacao && { backgroundColor: T.blue }]} />
                <Text style={s.checkTxt}>Veio por indicação</Text>
              </TouchableOpacity>

              <View style={s.toggleRow}>
                <TouchableOpacity style={[s.toggleBtn, { flex: 1 }]} onPress={() => openPicker('kit')}>
                  <Text style={s.toggleTxt}>+ Kit</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[s.toggleBtn, { flex: 1 }]} onPress={() => openPicker('produto')}>
                  <Text style={s.toggleTxt}>+ Produto</Text>
                </TouchableOpacity>
              </View>

              {cart.length === 0 && (
                <Text style={{ color: '#777', fontSize: 13, textAlign: 'center', marginVertical: 12 }}>
                  Carrinho vazio. Adicione kits ou produtos acima.
                </Text>
              )}

              {cart.map((item, index) => (
                <View key={index} style={s.cartItem}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.cartItemName}>{item.name}</Text>
                    <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
                      <View style={{ flex: 1 }}>
                        <Text style={s.cartLabel}>Qtd</Text>
                        <TextInput
                          style={s.cartInput}
                          keyboardType="numeric"
                          value={String(item.quantity)}
                          onChangeText={(t) => updateCartQuantity(index, t)}
                        />
                      </View>
                      <View style={{ flex: 2 }}>
                        <Text style={s.cartLabel}>Valor unit.</Text>
                        <TextInput
                          style={s.cartInput}
                          keyboardType="decimal-pad"
                          value={String(item.unitPrice)}
                          onChangeText={(t) => updateCartPrice(index, t)}
                        />
                      </View>
                    </View>
                    <Text style={s.cartSubtotal}>
                      Subtotal: {brl(item.unitPrice * item.quantity)}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => removeCartItem(index)} style={s.removeBtn}>
                    <Text style={s.removeBtnTxt}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}

              {cart.length > 0 && (
                <Text style={s.totalPreview}>
                  Total: {brl(cart.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0))}
                </Text>
              )}

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
                normalizeSearch(item.name || item.prospect_name || '').includes(normalizeSearch(pickerSearch))
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
  cartItem: { flexDirection: 'row', backgroundColor: '#1A1A1A', borderRadius: 10, padding: 12, marginBottom: 8, alignItems: 'flex-start' },
  cartItemName: { color: '#FFF', fontSize: 14, fontWeight: '600', marginBottom: 4 },
  cartLabel: { color: '#999', fontSize: 11, marginBottom: 3 },
  cartInput: { backgroundColor: '#242424', borderRadius: 6, padding: 8, color: '#FFF', fontSize: 13 },
  cartSubtotal: { color: '#4ADE80', fontSize: 12, fontWeight: '600', marginTop: 4 },
  removeBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#FF4444', justifyContent: 'center', alignItems: 'center', marginLeft: 8 },
  removeBtnTxt: { color: '#FFF', fontSize: 14, fontWeight: '700' },
});
