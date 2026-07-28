// ============================================================
// herbalife-kits.tsx — Administração de Kits Herbalife
// CRUD completo: lista, criar, editar, excluir (com validação de vendas)
// ============================================================
import { router, useFocusEffect } from 'expo-router';
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

function notify(title: string, msg: string) {
  if (Platform.OS === 'web') window.alert(`${title}\n\n${msg}`);
  else Alert.alert(title, msg);
}
const brl = (v: number) => `R$ ${Number(v || 0).toFixed(2).replace('.', ',')}`;

interface Kit {
  id: string;
  trainer_id: string | null;
  name: string;
  default_price: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

interface Supplement {
  id: string;
  name: string;
}

interface KitItem {
  supplement_id: string;
  supplement_name?: string;
  doses_used: string;
}

export default function HerbalifeKits() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [trainerId, setTrainerId] = useState<string | null>(null);
  const [kits, setKits] = useState<Kit[]>([]);
  const [supplements, setSupplements] = useState<Supplement[]>([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingKit, setEditingKit] = useState<Kit | null>(null);
  const [kitName, setKitName] = useState('');
  const [kitPrice, setKitPrice] = useState('');
  const [kitItems, setKitItems] = useState<KitItem[]>([]);
  const [productPickerOpen, setProductPickerOpen] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [saving, setSaving] = useState(false);

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

      const [{ data: kitsData }, { data: supData }] = await Promise.all([
        supabase
          .from('herbalife_kits')
          .select('*')
          .or(`trainer_id.is.null,trainer_id.eq.${trainer.id}`)
          .order('name'),
        supabase.from('supplements').select('id, name').order('name'),
      ]);

      setKits((kitsData as Kit[]) || []);
      setSupplements((supData as Supplement[]) || []);
    } catch (e) {
      console.error('Erro ao carregar kits:', e);
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

  async function toggleActive(kit: Kit) {
    try {
      const { error } = await supabase
        .from('herbalife_kits')
        .update({ active: !kit.active, updated_at: new Date().toISOString() })
        .eq('id', kit.id);
      if (error) throw error;
      load();
    } catch (e: any) {
      console.error(e);
      notify('Erro', e.message || 'Falha ao atualizar status do kit.');
    }
  }

  async function openCreateModal() {
    setEditingKit(null);
    setKitName('');
    setKitPrice('');
    setKitItems([]);
    setModalOpen(true);
  }

  async function openEditModal(kit: Kit) {
    setEditingKit(kit);
    setKitName(kit.name);
    setKitPrice(String(kit.default_price));

    const { data: items } = await supabase
      .from('herbalife_kit_items')
      .select('supplement_id, doses_used, supplements(name)')
      .eq('kit_id', kit.id);

    setKitItems(
      (items || []).map((i: any) => ({
        supplement_id: i.supplement_id,
        supplement_name: i.supplements?.name || '',
        doses_used: String(i.doses_used),
      }))
    );
    setModalOpen(true);
  }

  function addProduct(sup: Supplement) {
    if (kitItems.some((i) => i.supplement_id === sup.id)) {
      notify('Atenção', 'Este produto já está no kit.');
      return;
    }
    setKitItems([...kitItems, { supplement_id: sup.id, supplement_name: sup.name, doses_used: '1' }]);
    setProductPickerOpen(false);
  }

  function updateDoses(suppId: string, doses: string) {
    setKitItems(kitItems.map((i) => (i.supplement_id === suppId ? { ...i, doses_used: doses } : i)));
  }

  function removeProduct(suppId: string) {
    setKitItems(kitItems.filter((i) => i.supplement_id !== suppId));
  }

  async function deleteKit(kit: Kit) {
    try {
      const { count } = await supabase
        .from('herbalife_sale_items')
        .select('id', { count: 'exact', head: true })
        .eq('kit_id', kit.id);

      if ((count ?? 0) > 0) {
        const confirmDeactivate = () => {
          supabase
            .from('herbalife_kits')
            .update({ active: false, updated_at: new Date().toISOString() })
            .eq('id', kit.id)
            .then(() => load());
        };

        if (Platform.OS === 'web') {
          if (
            window.confirm(
              `Este kit já foi vendido ${count} vez(es) e não pode ser excluído.\n\nDeseja desativá-lo? Ele deixará de aparecer nas novas vendas.`
            )
          ) {
            confirmDeactivate();
          }
        } else {
          Alert.alert(
            'Kit já foi vendido',
            `Este kit já foi vendido ${count} vez(es) e não pode ser excluído.\n\nDeseja desativá-lo? Ele deixará de aparecer nas novas vendas.`,
            [
              { text: 'Cancelar', style: 'cancel' },
              { text: 'Desativar', onPress: confirmDeactivate },
            ]
          );
        }
        return;
      }

      const confirmDelete = async () => {
        await supabase.from('herbalife_kit_items').delete().eq('kit_id', kit.id);
        await supabase.from('herbalife_kits').delete().eq('id', kit.id);
        load();
      };

      if (Platform.OS === 'web') {
        if (window.confirm(`Excluir "${kit.name}"? Esta ação não pode ser desfeita.`)) {
          confirmDelete();
        }
      } else {
        Alert.alert('Excluir kit', `Confirma a exclusão de "${kit.name}"?`, [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Excluir', style: 'destructive', onPress: confirmDelete },
        ]);
      }
    } catch (e: any) {
      console.error(e);
      notify('Erro', e.message || 'Falha ao excluir o kit.');
    }
  }

  async function saveKit() {
    if (!trainerId) return;
    if (!kitName.trim()) {
      notify('Atenção', 'Informe o nome do kit.');
      return;
    }
    const price = parseFloat(kitPrice.replace(',', '.'));
    if (isNaN(price) || price <= 0) {
      notify('Atenção', 'Informe um preço válido.');
      return;
    }
    if (kitItems.length === 0) {
      notify('Atenção', 'Adicione pelo menos 1 produto ao kit.');
      return;
    }
    for (const item of kitItems) {
      const doses = parseFloat(item.doses_used.replace(',', '.'));
      if (isNaN(doses) || doses <= 0) {
        notify('Atenção', `Doses inválidas para ${item.supplement_name || 'produto'}.`);
        return;
      }
    }

    setSaving(true);
    try {
      if (editingKit) {
        const { error: updateErr } = await supabase
          .from('herbalife_kits')
          .update({ name: kitName.trim(), default_price: price, updated_at: new Date().toISOString() })
          .eq('id', editingKit.id);
        if (updateErr) throw updateErr;

        await supabase.from('herbalife_kit_items').delete().eq('kit_id', editingKit.id);

        const { error: itemsErr } = await supabase
          .from('herbalife_kit_items')
          .insert(
            kitItems.map((i) => ({
              kit_id: editingKit.id,
              supplement_id: i.supplement_id,
              doses_used: parseFloat(i.doses_used.replace(',', '.')),
            }))
          );
        if (itemsErr) throw itemsErr;
      } else {
        const { data: newKit, error: insertErr } = await supabase
          .from('herbalife_kits')
          .insert({ trainer_id: trainerId, name: kitName.trim(), default_price: price, active: true })
          .select('id')
          .single();
        if (insertErr) throw insertErr;

        const { error: itemsErr } = await supabase
          .from('herbalife_kit_items')
          .insert(
            kitItems.map((i) => ({
              kit_id: newKit.id,
              supplement_id: i.supplement_id,
              doses_used: parseFloat(i.doses_used.replace(',', '.')),
            }))
          );
        if (itemsErr) throw itemsErr;
      }

      setModalOpen(false);
      load();
    } catch (e: any) {
      console.error(e);
      notify('Erro', e.message || 'Falha ao salvar o kit.');
    } finally {
      setSaving(false);
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
      <View style={{ padding: 16, paddingBottom: 0 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={{ color: T.blue, fontWeight: '700', fontSize: 13 }}>← Voltar</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/herbalife-vendas' as any)}>
            <Text style={{ color: T.blue, fontWeight: '700', fontSize: 13 }}>📦 Vendas</Text>
          </TouchableOpacity>
        </View>
        <Text style={s.pageTitle}>Meus Kits</Text>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={T.blue} />
        }
      >
        {kits.length === 0 && (
          <Text style={s.empty}>Nenhum kit cadastrado. Crie seu primeiro kit abaixo!</Text>
        )}
        {kits.map((kit) => {
          const isGlobal = kit.trainer_id === null;
          return (
            <View key={kit.id} style={s.kitCard}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <Text style={s.kitName}>{kit.name}</Text>
                  {isGlobal && (
                    <View style={s.badgeGlobal}>
                      <Text style={s.badgeGlobalTxt}>Global</Text>
                    </View>
                  )}
                </View>
                <Text style={s.kitPrice}>{brl(Number(kit.default_price))}</Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity style={s.deleteIconBtn} onPress={() => deleteKit(kit)}>
                  <Text style={{ fontSize: 16 }}>🗑</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.editIconBtn} onPress={() => openEditModal(kit)}>
                  <Text style={{ fontSize: 16 }}>✏️</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.toggleBtn, kit.active && s.toggleBtnActive]}
                  onPress={() => toggleActive(kit)}
                >
                  <Text style={[s.toggleTxt, kit.active && s.toggleTxtActive]}>
                    {kit.active ? '✓ Ativo' : 'Inativo'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </ScrollView>

      <View style={s.fabContainer}>
        <TouchableOpacity style={s.fab} onPress={openCreateModal}>
          <Text style={s.fabTxt}>+ Novo Kit</Text>
        </TouchableOpacity>
      </View>

      {/* MODAL CRIAR/EDITAR KIT */}
      <Modal visible={modalOpen} animationType="slide" transparent>
        <View style={s.modalBg}>
          <View style={s.modalBox}>
            <ScrollView>
              <Text style={s.modalTitle}>{editingKit ? 'Editar Kit' : 'Novo Kit'}</Text>

              <Text style={s.label}>Nome do Kit</Text>
              <TextInput
                style={s.input}
                placeholder="Ex: Kit Desafio T21 - Avançado"
                placeholderTextColor="#777"
                value={kitName}
                onChangeText={setKitName}
              />

              <Text style={s.label}>Preço Padrão (R$)</Text>
              <TextInput
                style={s.input}
                placeholder="Ex: 547,00"
                placeholderTextColor="#777"
                keyboardType="numeric"
                value={kitPrice}
                onChangeText={setKitPrice}
              />

              <Text style={s.label}>Produtos do Kit</Text>
              {kitItems.length === 0 && (
                <Text style={s.emptyProducts}>Nenhum produto adicionado ainda.</Text>
              )}
              {kitItems.map((item) => (
                <View key={item.supplement_id} style={s.productRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.productName} numberOfLines={1}>
                      {item.supplement_name}
                    </Text>
                  </View>
                  <TextInput
                    style={s.dosesInput}
                    placeholder="Doses"
                    placeholderTextColor="#777"
                    keyboardType="numeric"
                    value={item.doses_used}
                    onChangeText={(v) => updateDoses(item.supplement_id, v)}
                  />
                  <TouchableOpacity onPress={() => removeProduct(item.supplement_id)}>
                    <Text style={{ fontSize: 18, color: '#ef4444' }}>🗑</Text>
                  </TouchableOpacity>
                </View>
              ))}
              <TouchableOpacity style={s.addProductBtn} onPress={() => setProductPickerOpen(true)}>
                <Text style={s.addProductTxt}>+ Adicionar Produto</Text>
              </TouchableOpacity>

              <View style={s.inline}>
                <TouchableOpacity style={[s.btn, s.btnGhost]} onPress={() => setModalOpen(false)}>
                  <Text style={s.btnGhostTxt}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[s.btn, { backgroundColor: T.blue }]} onPress={saveKit} disabled={saving}>
                  <Text style={s.btnTxt}>{saving ? 'Salvando…' : 'Salvar Kit'}</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* MODAL SELETOR DE PRODUTOS */}
      <Modal visible={productPickerOpen} animationType="fade" transparent>
        <View style={s.modalBg}>
          <View style={[s.modalBox, { maxHeight: '70%' }]}>
            <Text style={s.modalTitle}>Selecionar Produto</Text>
            <TextInput
              style={s.input}
              placeholder="Buscar por nome…"
              placeholderTextColor="#777"
              value={productSearch}
              onChangeText={setProductSearch}
              autoFocus
            />
            <FlatList
              data={supplements.filter((s) =>
                s.name.toLowerCase().includes(productSearch.trim().toLowerCase())
              )}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity style={s.pickerRow} onPress={() => addProduct(item)}>
                  <Text style={s.pickerTxt} numberOfLines={1}>
                    {item.name}
                  </Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              style={[s.btn, s.btnGhost, { marginTop: 8 }]}
              onPress={() => {
                setProductSearch('');
                setProductPickerOpen(false);
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
  pageTitle: { fontSize: 28, fontWeight: '900', color: T.t1, marginBottom: 12 },
  empty: { color: T.t3, fontStyle: 'italic', textAlign: 'center', marginTop: 20 },
  kitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: T.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  kitName: { color: T.t1, fontWeight: '700', fontSize: 15 },
  kitPrice: { color: T.t2, fontSize: 13, marginTop: 2 },
  badgeGlobal: {
    backgroundColor: 'rgba(59,130,246,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeGlobalTxt: { color: T.blue, fontSize: 10, fontWeight: '800' },
  toggleBtn: {
    backgroundColor: T.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: T.border,
  },
  toggleBtnActive: {
    backgroundColor: T.blue + '22',
    borderColor: T.blue,
  },
  toggleTxt: { color: T.t2, fontSize: 12, fontWeight: '700' },
  toggleTxtActive: { color: T.blue },
  fabContainer: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
  },
  fab: {
    backgroundColor: T.blue,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  fabTxt: { color: '#000', fontWeight: '800', fontSize: 16 },
  deleteIconBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  editIconBtn: {
    backgroundColor: T.surface,
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: T.border,
  },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 20 },
  modalBox: { backgroundColor: '#161616', borderRadius: 16, padding: 18, maxHeight: '85%' },
  modalTitle: { color: '#FFF', fontSize: 18, fontWeight: '700', marginBottom: 14 },
  label: { color: '#999', fontSize: 12, marginBottom: 4, marginTop: 8 },
  input: { backgroundColor: '#242424', borderRadius: 10, padding: 12, color: '#FFF', marginBottom: 10 },
  emptyProducts: { color: '#777', fontStyle: 'italic', fontSize: 12, marginBottom: 8 },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#242424',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  productName: { color: '#DDD', fontSize: 13, fontWeight: '600' },
  dosesInput: {
    backgroundColor: '#1A1A1A',
    borderRadius: 6,
    padding: 8,
    color: '#FFF',
    width: 60,
    textAlign: 'center',
  },
  addProductBtn: { backgroundColor: '#242424', borderRadius: 10, padding: 12, alignItems: 'center', marginTop: 4 },
  addProductTxt: { color: T.blue, fontWeight: '700' },
  inline: { flexDirection: 'row', marginTop: 16, gap: 8 },
  btn: { flex: 1, padding: 13, borderRadius: 10, alignItems: 'center' },
  btnTxt: { color: '#000', fontWeight: '700' },
  btnGhost: { backgroundColor: '#242424' },
  btnGhostTxt: { color: '#AAA', fontWeight: '600' },
  pickerRow: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#242424' },
  pickerTxt: { color: '#DDD' },
});
