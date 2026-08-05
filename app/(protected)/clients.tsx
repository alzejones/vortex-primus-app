import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Dimensions,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabase";
import { GradientPrimary } from "../../utils/gradients";
import { T } from "../../utils/theme";

export default function Clients() {
  const insets = useSafeAreaInsets();
  // ─── Responsividade ───────────────────────────────
  const [screenWidth, setScreenWidth] = useState(
    () => Dimensions.get('window').width || 375
  );
  useEffect(() => {
    const sub = Dimensions.addEventListener('change', ({ window }) => {
      setScreenWidth(window.width);
    });
    return () => sub.remove();
  }, []);
  const isDesktop = screenWidth >= 768;
  // ────────────────────────────────────────────

  const { session } = useAuth();
  const [clients, setClients] = useState<any[]>([]);
  const [trainerId, setTrainerId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [totalClients, setTotalClients] = useState<number>(0);
  const [sortField, setSortField] = useState<'name' | 'data_cadastro_efetiva'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  async function loadTrainer() {
    if (!session?.user?.id) return;

    const { data, error } = await supabase
      .from("trainers")
      .select("id")
      .eq("user_id", session.user.id)
      .single();

    if (error) {
      Alert.alert("Erro ao carregar treinador", error.message);
      return;
    }

    setTrainerId(data.id);
  }

  async function fetchClients(currentTrainerId: string) {
    // Fetch total count
    const { count, error: countError } = await supabase
      .from("clients")
      .select("*", { count: "exact", head: true })
      .eq("trainer_id", currentTrainerId);

    if (countError) {
      Alert.alert("Erro ao carregar total de clientes", countError.message);
    } else {
      setTotalClients(count || 0);
    }

    // Fetch all clients in batches of 1000 until no more rows
    const allClients: any[] = [];
    let offset = 0;
    const batchSize = 1000;
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await supabase
        .from("v_clients_alunos")
        .select("*")
        .eq("trainer_id", currentTrainerId)
        .order(sortField, { ascending: sortDirection === 'asc' })
        .order('id', { ascending: true })
        .range(offset, offset + batchSize - 1);

      if (error) {
        Alert.alert("Erro ao carregar clientes", error.message);
        hasMore = false;
      } else {
        const batch = data || [];
        allClients.push(...batch);
        hasMore = batch.length === batchSize;
        offset += batchSize;
      }
    }

    setClients(allClients);
  }

  async function handleDelete(id: string) {
    Alert.alert('Excluir aluno', 'Deseja realmente excluir este aluno? Esta ação não pode ser desfeita.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          const { data, error } = await supabase.functions.invoke('delete-client', {
            body: { client_id: id },
          });

          if (error || data?.error) {
            Alert.alert('Erro ao excluir', data?.error ?? error?.message ?? 'Erro desconhecido');
          } else if (trainerId) {
            fetchClients(trainerId);
          }
        },
      },
    ]);
  }

  useEffect(() => {
    loadTrainer();
  }, [session]);

  useEffect(() => {
    if (trainerId) {
      fetchClients(trainerId);
    }
  }, [trainerId, sortField, sortDirection]);

  // Formata celular/telefone BR: 11 dígitos -> (99) 99999-9999, 10 dígitos -> (99) 9999-9999
  const formatPhoneBR = (phone: string) => {
    if (!phone) return '';
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 11) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
    }
    if (digits.length === 10) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    }
    return phone; // formato não reconhecido — mostra como veio, sem quebrar a tela
  };

  // Normaliza string: remove diacríticos + lowercase — busca insensível a acento
  const normalize = (str: string) =>
    (str || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

  const filteredClients = useMemo(() => {
    const q = normalize(searchQuery);
    if (!q) return clients;
    return clients.filter((c: any) => normalize(c.name).includes(q));
  }, [clients, searchQuery]);

  return (
    <View style={{ flex: 1, backgroundColor: T.bg, alignItems: isDesktop ? 'center' : undefined }}>
      <View style={{ flex: 1, width: '100%', maxWidth: isDesktop ? 900 : undefined }}>
        <View style={[styles.container, isDesktop && { paddingHorizontal: 32, paddingVertical: 32 }]}>
          <TouchableOpacity
            style={styles.newButton}
            onPress={() => router.push("/(protected)/client-create")}
            activeOpacity={0.85}
          >
            <LinearGradient {...GradientPrimary} style={styles.newButtonGradient}>
              <Text style={styles.newButtonText}>+ Novo Cliente</Text>
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.totalContainer}>
            <Text style={styles.totalText}>
              Total de Clientes: <Text style={styles.totalCount}>{totalClients}</Text>
            </Text>
          </View>

          <View style={styles.sortContainer}>
            <View style={styles.sortRow}>
              <TouchableOpacity
                style={[styles.sortButton, sortField === 'name' && styles.sortButtonActive]}
                onPress={() => setSortField('name')}
                activeOpacity={0.7}
              >
                <Text style={[styles.sortButtonText, sortField === 'name' && styles.sortButtonTextActive]}>
                  Alfabética
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.sortButton, sortField === 'data_cadastro_efetiva' && styles.sortButtonActive]}
                onPress={() => setSortField('data_cadastro_efetiva')}
                activeOpacity={0.7}
              >
                <Text style={[styles.sortButtonText, sortField === 'data_cadastro_efetiva' && styles.sortButtonTextActive]}>
                  Cadastro
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.sortRow}>
              <TouchableOpacity
                style={[styles.sortButton, sortDirection === 'asc' && styles.sortButtonActive]}
                onPress={() => setSortDirection('asc')}
                activeOpacity={0.7}
              >
                <Text style={[styles.sortButtonText, sortDirection === 'asc' && styles.sortButtonTextActive]}>
                  ↑ Asc
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.sortButton, sortDirection === 'desc' && styles.sortButtonActive]}
                onPress={() => setSortDirection('desc')}
                activeOpacity={0.7}
              >
                <Text style={[styles.sortButtonText, sortDirection === 'desc' && styles.sortButtonTextActive]}>
                  ↓ Desc
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar por nome..."
              placeholderTextColor={T.t3}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <FlatList
            style={{ flex: 1 }}
            data={filteredClients}
            keyExtractor={(item: any) => item.id}
            showsVerticalScrollIndicator={true}
            contentContainerStyle={{ paddingBottom: 64 + insets.bottom + 16 }}
            renderItem={({ item }: any) => (
              <View style={styles.card}>
                <TouchableOpacity
                  onPress={() =>
                    router.push(`/(protected)/client-details?id=${item.id}`)
                  }
                >
                  <Text style={styles.name}>{item.name}</Text>
                  {item.phone ? (
                    <Text style={styles.phone}>{formatPhoneBR(item.phone)}</Text>
                  ) : null}
                </TouchableOpacity>

                <View style={styles.actions}>
                  <TouchableOpacity
                    onPress={() =>
                      router.push(`/(protected)/client-details?id=${item.id}`)
                    }
                  >
                    <Text style={styles.linkEdit}>Editar</Text>
                  </TouchableOpacity>

                  <TouchableOpacity onPress={() => handleDelete(item.id)}>
                    <Text style={styles.linkDelete}>Excluir</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                {searchQuery.trim().length > 0 ? (
                  <>
                    <Text style={styles.emptyText}>Nenhum aluno encontrado.</Text>
                    <Text style={styles.emptySubText}>Tente buscar por outro nome.</Text>
                  </>
                ) : (
                  <>
                    <Text style={styles.emptyText}>Nenhum aluno cadastrado.</Text>
                    <Text style={styles.emptySubText}>Toque em "+ Novo Cliente" para começar.</Text>
                  </>
                )}
              </View>
            }
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },

  newButton: { borderRadius: 14, overflow: "hidden", marginBottom: 20 },
  newButtonGradient: {
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
  },
  newButtonText: { color: T.white, fontWeight: "800", fontSize: 15 },

  totalContainer: {
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  totalText: {
    fontSize: 14,
    color: T.t2,
    fontWeight: "600",
  },
  totalCount: {
    fontSize: 16,
    color: T.t1,
    fontWeight: "800",
  },

  sortContainer: {
    marginBottom: 16,
    gap: 8,
  },
  sortRow: {
    flexDirection: "row",
    gap: 8,
  },
  sortButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: T.surfaceAlt,
    borderWidth: 1,
    borderColor: T.border,
    alignItems: "center",
  },
  sortButtonActive: {
    backgroundColor: T.blue,
    borderColor: T.blue,
  },
  sortButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: T.t2,
  },
  sortButtonTextActive: {
    color: T.white,
  },

  searchContainer: { marginBottom: 16 },
  searchInput: {
    backgroundColor: T.card,
    borderWidth: 1,
    borderColor: T.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: T.t1,
  },

  card: {
    backgroundColor: T.card,
    padding: 16,
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: T.border,
  },
  name: { fontSize: 16, fontWeight: "800", color: T.t1, marginBottom: 4 },
  phone: { fontSize: 13, color: T.t3, marginBottom: 8 },

  actions: { flexDirection: "row", justifyContent: "space-between", marginTop: 4 },
  linkEdit: { fontWeight: "700", color: T.blue, fontSize: 13 },
  linkDelete: { fontWeight: "700", color: T.red, fontSize: 13 },

  emptyState: { alignItems: "center", paddingTop: 60 },
  emptyText: { color: T.t2, fontSize: 16, fontWeight: "700", marginBottom: 6 },
  emptySubText: { color: T.t3, fontSize: 13 },
});
