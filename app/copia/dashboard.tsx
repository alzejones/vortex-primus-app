import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabase";

export default function Dashboard() {
  const { signOut } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false); // Estado para o "Puxar para atualizar"
  const [searchQuery, setSearchQuery] = useState(""); // Estado para a barra de pesquisa
  
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

      const { data: trainer } = await supabase
        .from("trainers")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!trainer) return;
      setTrainerId(trainer.id);

        // Buscar plano ativo
      const { data: subscription, error: subError } = await supabase
        .from("trainer_subscriptions")
        .select(`
          is_active,
          plans ( name, max_clients )
        `)
        .eq("trainer_id", trainer.id)
        .eq("is_active", true)
        .single();

      if (subscription) {
        // Usamos o "as any" ou acessamos como array se o TS reclamar
        const planData = subscription.plans as any;
        
        setPlanName(planData?.name || "Sem Plano");
        setMaxClients(planData?.max_clients || 0);
        setPlanStatus(subscription.is_active ? "Ativo" : "Inativo");
      }

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

  // Função disparada ao arrastar a tela para baixo
  async function onRefresh() {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  }

  function handleClientPress(clientId: string) {
    router.push(`/(protected)/client-details?id=${clientId}`);
  }

  const usagePercentage = maxClients > 0 ? (currentClients / maxClients) * 100 : 0;
  
  // Filtra os clientes com base no que for digitado na barra de pesquisa
  const filteredClients = clients.filter((client) =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // O "Cabeçalho" da lista, contendo o card do plano, os botões e o campo de busca
  const renderHeader = () => (
    <View style={{ paddingBottom: 15 }}>
      <Text style={styles.title}>Dashboard</Text>

      {/* CARD DO PLANO MODERNO */}
      <View style={styles.planBox}>
        <View style={styles.planHeader}>
          <Text style={styles.planTitle}>Meu Plano: {planName}</Text>
          <View style={[styles.statusBadge, { backgroundColor: planStatus === "Ativo" ? "#dcfce7" : "#fee2e2" }]}>
            <Text style={[styles.statusText, { color: planStatus === "Ativo" ? "#16a34a" : "#dc2626" }]}>
              {planStatus}
            </Text>
          </View>
        </View>
        
        <Text style={styles.planText}>
          Clientes: {currentClients} de {maxClients}
        </Text>

        {/* Barra de Progresso Visual */}
        <View style={styles.progressBarBackground}>
          <View 
            style={[
              styles.progressBarFill, 
              { 
                width: `${Math.min(usagePercentage, 100)}%`,
                backgroundColor: usagePercentage >= 80 ? "#dc2626" : "#2563eb"
              }
            ]} 
          />
        </View>

        {usagePercentage >= 80 && (
          <Text style={styles.warning}>⚠️ Você está próximo do limite do plano.</Text>
        )}
      </View>

      <TouchableOpacity
        onPress={() => router.push("/(protected)/client-create")}
        style={styles.primaryButton}
      >
        <Text style={styles.buttonText}>+ NOVO CLIENTE</Text>
      </TouchableOpacity>

      {/* BARRA DE PESQUISA */}
      {clients.length > 0 && (
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="🔍 Buscar cliente por nome..."
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      )}

      {clients.length > 0 && <Text style={styles.sectionTitle}>Seus Clientes</Text>}
    </View>
  );

  // O "Rodapé" da lista, contendo o botão de Logout
  const renderFooter = () => (
    <View style={{ paddingTop: 20 }}>
      <TouchableOpacity onPress={signOut} style={styles.logoutButton}>
        <Text style={styles.buttonText}>SAIR DO SISTEMA</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Usamos o FlatList como container principal para habilitar o RefreshControl e a rolagem suave */}
      <FlatList
        data={filteredClients}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 30 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#2563eb"]} />
        }
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={
          clients.length > 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Nenhum cliente encontrado com "{searchQuery}".</Text>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Você ainda não possui clientes cadastrados.</Text>
            </View>
          )
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.clientItem}
            onPress={() => handleClientPress(item.id)}
            activeOpacity={0.7}
          >
            <Text style={styles.clientName}>{item.name}</Text>
            <Text style={styles.arrowIcon}>›</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    backgroundColor: "#f9fafb", // Cor de fundo mais moderna
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f9fafb",
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 20,
  },
  planBox: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 16, // Bordas mais arredondadas
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: "#000", // Sombra leve
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  planHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  planTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1f2937",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "bold",
  },
  planText: {
    fontSize: 15,
    color: "#4b5563",
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: "#f3f4f6",
    borderRadius: 4,
    marginTop: 12,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 4,
  },
  warning: {
    marginTop: 12,
    color: "#dc2626",
    fontWeight: "600",
    fontSize: 13,
  },
  primaryButton: {
    backgroundColor: "#000",
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logoutButton: {
    backgroundColor: "#fee2e2", // Fundo vermelho clarinho
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  buttonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 15,
  },
  searchContainer: {
    marginBottom: 15,
  },
  searchInput: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    color: "#111827",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#374151",
    marginBottom: 10,
  },
  clientItem: {
    backgroundColor: "#fff",
    padding: 18,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    flexDirection: "row", // Para alinhar o nome e a setinha
    justifyContent: "space-between",
    alignItems: "center",
  },
  clientName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
  },
  arrowIcon: {
    fontSize: 20,
    color: "#9ca3af",
  },
  emptyContainer: {
    padding: 20,
    alignItems: "center",
  },
  emptyText: {
    color: "#6b7280",
    fontSize: 15,
    textAlign: "center",
  },
});

