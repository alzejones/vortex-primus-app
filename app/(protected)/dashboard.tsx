import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabase";

export default function Dashboard() {
  const { signOut } = useAuth();

  const [loading, setLoading] = useState(true);
  const [planName, setPlanName] = useState("");
  const [maxClients, setMaxClients] = useState(0);
  const [currentClients, setCurrentClients] = useState(0);
  const [planStatus, setPlanStatus] = useState("");
  const [trainerId, setTrainerId] = useState<string | null>(null);
  const [clients, setClients] = useState<any[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      // Buscar trainer
      const { data: trainer } = await supabase
        .from("trainers")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!trainer) return;

      setTrainerId(trainer.id);

      // Buscar plano ativo
      const { data: subscription } = await supabase
        .from("trainer_subscriptions")
        .select(`
          is_active,
          plans ( name, max_clients )
        `)
        .eq("trainer_id", trainer.id)
        .eq("is_active", true)
        .single();

      if (subscription) {
        setPlanName(subscription.plans.name);
        setMaxClients(subscription.plans.max_clients);
        setPlanStatus(subscription.is_active ? "Ativo" : "Inativo");
      }

      // Buscar clientes ativos
      const { data: clientList } = await supabase
        .from("clients")
        .select("*")
        .eq("trainer_id", trainer.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      setClients(clientList || []);
      setCurrentClients(clientList?.length || 0);
    } catch (error) {
      console.log("Erro ao carregar dashboard:", error);
    } finally {
      setLoading(false);
    }
  }

  const usagePercentage =
    maxClients > 0 ? (currentClients / maxClients) * 100 : 0;

  function handleClientPress(clientId: string) {
    router.push(`/(protected)/client-details?id=${clientId}`);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dashboard</Text>

      {loading ? (
        <ActivityIndicator size="large" />
      ) : (
        <>
          {/* CARD DO PLANO */}
          <View style={styles.planBox}>
            <Text style={styles.planTitle}>Plano Atual</Text>
            <Text style={styles.planText}>Plano: {planName}</Text>
            <Text style={styles.planText}>
              Clientes: {currentClients} / {maxClients}
            </Text>
            <Text style={styles.planText}>Status: {planStatus}</Text>

            {usagePercentage >= 80 && (
              <Text style={styles.warning}>
                ⚠️ Você está próximo do limite do seu plano.
              </Text>
            )}
          </View>

          {/* BOTÕES PRINCIPAIS */}
          <TouchableOpacity
            onPress={() => router.push("/(protected)/client-create")}
            style={styles.primaryButton}
          >
            <Text style={styles.buttonText}>NOVO CLIENTE</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push("/(protected)/assessment-create")}
            style={styles.primaryButton}
          >
            <Text style={styles.buttonText}>NOVA AVALIAÇÃO</Text>
          </TouchableOpacity>

          {/* LISTA DE CLIENTES (APENAS SE EXISTIREM) */}
          {clients.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Seus Clientes</Text>

              <FlatList
                data={clients}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.clientItem}
                    onPress={() => handleClientPress(item.id)}
                  >
                    <Text style={styles.clientName}>{item.name}</Text>
                  </TouchableOpacity>
                )}
              />
            </>
          )}

          {/* LOGOUT */}
          <TouchableOpacity onPress={signOut} style={styles.logoutButton}>
            <Text style={styles.buttonText}>LOGOUT</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  planBox: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#eee",
  },
  planTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  planText: {
    fontSize: 15,
    marginBottom: 5,
  },
  warning: {
    marginTop: 10,
    color: "orange",
    fontWeight: "bold",
  },
  primaryButton: {
    backgroundColor: "#000",
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  logoutButton: {
    backgroundColor: "red",
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
  },
  buttonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginVertical: 15,
  },
  clientItem: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#eee",
  },
  clientName: {
    fontSize: 16,
    fontWeight: "500",
  },
});