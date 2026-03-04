import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabase";

export default function Clients() {
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
    Alert.alert("Excluir", "Deseja realmente excluir?", [
      { text: "Cancelar" },
      {
        text: "Excluir",
        style: "destructive",
        onPress: async () => {
          const { error } = await supabase
            .from("clients")
            .delete()
            .eq("id", id);

          if (error) {
            Alert.alert("Erro ao excluir", error.message);
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
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.newButton}
        onPress={() => router.push("/(protected)/client-create")}
      >
        <Text style={styles.buttonText}>+ Novo Cliente</Text>
      </TouchableOpacity>

      <FlatList
        data={clients}
        keyExtractor={(item: any) => item.id}
        renderItem={({ item }: any) => (
          <View style={styles.card}>
            {/* Clique no nome abre ClientDetails */}
            <TouchableOpacity
              onPress={() =>
                router.push(
                  `/(protected)/client-details?id=${item.id}`
                )
              }
            >
              <Text style={styles.name}>{item.name}</Text>
            </TouchableOpacity>

            {/* Ações */}
            <View style={styles.actions}>
              {/* Editar agora abre a mesma tela de detalhes */}
              <TouchableOpacity
                onPress={() =>
                  router.push(
                    `/(protected)/client-details?id=${item.id}`
                  )
                }
              >
                <Text style={styles.link}>Editar</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => handleDelete(item.id)}>
                <Text style={[styles.link, { color: "red" }]}>
                  Excluir
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  newButton: {
    backgroundColor: "#000",
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  buttonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold",
  },
  card: {
    backgroundColor: "#f4f4f4",
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  name: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  link: {
    fontWeight: "bold",
  },
});