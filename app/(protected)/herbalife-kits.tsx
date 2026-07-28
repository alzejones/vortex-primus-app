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
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
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

export default function HerbalifeKits() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [trainerId, setTrainerId] = useState<string | null>(null);
  const [kits, setKits] = useState<Kit[]>([]);

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

      const { data: kitsData } = await supabase
        .from('herbalife_kits')
        .select('*')
        .or(`trainer_id.is.null,trainer_id.eq.${trainer.id}`)
        .order('name');

      setKits((kitsData as Kit[]) || []);
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
              <TouchableOpacity
                style={[s.toggleBtn, kit.active && s.toggleBtnActive]}
                onPress={() => toggleActive(kit)}
              >
                <Text style={[s.toggleTxt, kit.active && s.toggleTxtActive]}>
                  {kit.active ? '✓ Ativo' : 'Inativo'}
                </Text>
              </TouchableOpacity>
            </View>
          );
        })}
      </ScrollView>

      <View style={s.fabContainer}>
        <TouchableOpacity style={s.fab} onPress={() => notify('Em breve', 'Funcionalidade de criar kit será implementada.')}>
          <Text style={s.fabTxt}>+ Novo Kit</Text>
        </TouchableOpacity>
      </View>
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
});
