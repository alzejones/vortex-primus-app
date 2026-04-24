import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabase";
import { GradientPrimary } from "../../utils/gradients";
import { T } from "../../utils/theme";

export default function Clients() {
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
    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .eq("trainer_id", currentTrainerId)
      .order("created_at", { ascending: false });

    if (error) {
      Alert.alert("Erro ao carregar clientes", error.message);
    } else {
      setClients(data || []);
    }
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
  }, [trainerId]);

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

          <FlatList
            data={clients}
            keyExtractor={(item: any) => item.id}
            showsVerticalScrollIndicator={true}
            contentContainerStyle={{ paddingBottom: 40 }}
            renderItem={({ item }: any) => (
              <View style={styles.card}>
                <TouchableOpacity
                  onPress={() =>
                    router.push(`/(protected)/client-details?id=${item.id}`)
                  }
                >
                  <Text style={styles.name}>{item.name}</Text>
                  {item.email ? (
                    <Text style={styles.email}>{item.email}</Text>
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
                <Text style={styles.emptyText}>Nenhum aluno cadastrado.</Text>
                <Text style={styles.emptySubText}>Toque em "+ Novo Cliente" para começar.</Text>
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

  card: {
    backgroundColor: T.card,
    padding: 16,
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: T.border,
  },
  name: { fontSize: 16, fontWeight: "800", color: T.t1, marginBottom: 4 },
  email: { fontSize: 13, color: T.t3, marginBottom: 8 },

  actions: { flexDirection: "row", justifyContent: "space-between", marginTop: 4 },
  linkEdit: { fontWeight: "700", color: T.blue, fontSize: 13 },
  linkDelete: { fontWeight: "700", color: T.red, fontSize: 13 },

  emptyState: { alignItems: "center", paddingTop: 60 },
  emptyText: { color: T.t2, fontSize: 16, fontWeight: "700", marginBottom: 6 },
  emptySubText: { color: T.t3, fontSize: 13 },
});
