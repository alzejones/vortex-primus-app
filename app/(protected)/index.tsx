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

export default function index() {
  const { signOut } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
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
        const planData = subscription.plans as any;
        setPlanName(planData?.name || "Sem Plano");
        setMaxClients(planData?.max_clients || 0);
        setPlanStatus(subscription.is_active ? "Ativo" : "Inativo");
      }

      // BUSCA INTELIGENTE: Traz os clientes e soma as visualizações das avaliações
      const { data: clientList } = await supabase
        .from("clients")
        .select(`
          *,
          physical_assessments (
            id,
            anthropometry:anthropometry!anthropometry_assessment_id_fkey (
              view_count
            )
          )
        `)
        .eq("trainer_id", trainer.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      // Processa a soma de views para cada cliente
      const clientsWithViews = (clientList || []).map((client: any) => {
        let totalViews = 0;
        if (client.physical_assessments) {
          client.physical_assessments.forEach((pa: any) => {
            if (pa.anthropometry && pa.anthropometry.length > 0) {
              totalViews += (pa.anthropometry[0].view_count || 0);
            }
          });
        }
        return { ...client, totalViews };
      });

      setClients(clientsWithViews);
      setCurrentClients(clientsWithViews.length || 0);
    } catch (error) {
      console.log("Erro ao carregar dashboard:", error);
    } finally {
      setLoading(false);
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  }

  function handleClientPress(clientId: string) {
    router.push(`/(protected)/client-details?id=${clientId}`);
  }

  // --- FUNÇÃO DE UX: GERA AS INICIAIS DO NOME PARA O AVATAR ---
  const getInitials = (name: string) => {
    if (!name) return "AL";
    const names = name.trim().split(" ");
    if (names.length >= 2) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const usagePercentage = maxClients > 0 ? (currentClients / maxClients) * 100 : 0;
  
  const filteredClients = clients.filter((client) =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderHeader = () => (
    <View style={{ paddingBottom: 15 }}>
      {/* CABEÇALHO COM SAUDAÇÃO */}
      <View style={styles.headerTopArea}>
        <Text style={styles.greetingText}>Visão Geral</Text>
        <Text style={styles.title}>Meu Dashboard</Text>
      </View>

      {/* WIDGET DO PLANO (SaaS PREMIUM) */}
      <View style={styles.planWidget}>
        <View style={styles.planHeader}>
          <View>
            <Text style={styles.planLabel}>Plano Atual</Text>
            <Text style={styles.planTitle}>{planName}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: planStatus === "Ativo" ? "#ecfdf5" : "#fef2f2" }]}>
            <View style={[styles.statusDot, { backgroundColor: planStatus === "Ativo" ? "#10b981" : "#ef4444" }]} />
            <Text style={[styles.statusText, { color: planStatus === "Ativo" ? "#059669" : "#dc2626" }]}>
              {planStatus}
            </Text>
          </View>
        </View>
        
        <View style={styles.metricsRow}>
          <Text style={styles.planText}>
            <Text style={styles.highlightNumber}>{currentClients}</Text> de {maxClients} alunos
          </Text>
        </View>

        <View style={styles.progressBarBackground}>
          <View 
            style={[
              styles.progressBarFill, 
              { 
                width: `${Math.min(usagePercentage, 100)}%`,
                backgroundColor: usagePercentage >= 80 ? "#ef4444" : "#4f46e5" 
              }
            ]} 
          />
        </View>

        {usagePercentage >= 80 && (
          <Text style={styles.warning}>⚠️ Você está próximo do limite do seu plano.</Text>
        )}
      </View>

      <TouchableOpacity
        onPress={() => router.push("/(protected)/client-create")}
        style={styles.primaryButton}
        activeOpacity={0.8}
      >
        <Text style={styles.buttonText}>+ Adicionar Aluno</Text>
      </TouchableOpacity>

      {/* BARRA DE PESQUISA REFINADA */}
      {clients.length > 0 && (
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar aluno por nome..."
              placeholderTextColor="#94a3b8"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>
      )}

      {clients.length > 0 && <Text style={styles.sectionTitle}>Seus Alunos</Text>}
    </View>
  );

  const renderFooter = () => (
    <View style={{ paddingTop: 30, paddingBottom: 20 }}>
      <TouchableOpacity onPress={signOut} style={styles.logoutButton} activeOpacity={0.7}>
        <Text style={styles.logoutButtonText}>SAIR DO SISTEMA</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4f46e5" />
        <Text style={styles.loadingText}>Carregando seu painel...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredClients}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#4f46e5"]} tintColor="#4f46e5" />
        }
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={
          clients.length > 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>🧐</Text>
              <Text style={styles.emptyText}>Nenhum aluno encontrado com "{searchQuery}".</Text>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>🚀</Text>
              <Text style={styles.emptyTitle}>Sua jornada começa aqui!</Text>
              <Text style={styles.emptyText}>Você ainda não possui alunos cadastrados.</Text>
            </View>
          )
        }
        renderItem={({ item }) => (
          <View style={styles.clientCard}>
            
            <TouchableOpacity
              style={styles.clientInfoArea}
              onPress={() => handleClientPress(item.id)}
              activeOpacity={0.7}
            >
              <View style={styles.clientProfileGroup}>
                {/* AVATAR DO CLIENTE */}
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{getInitials(item.name)}</Text>
                </View>
                <View>
                  <Text style={styles.clientName}>{item.name}</Text>
                  <Text style={styles.clientSubText}>Ver perfil completo</Text>
                </View>
              </View>
              
              {/* ÁREA DA DIREITA: BADGE DE VIEWS E SETA (Corrigido para mostrar o 0) */}
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={styles.viewsBadge}>
                  <Text style={styles.viewsEmoji}>👁️</Text>
                  <Text style={styles.viewsText}>{item.totalViews !== undefined ? item.totalViews : 0}</Text>
                </View>
                <Text style={styles.arrowIcon}>›</Text>
              </View>
            </TouchableOpacity>

            <View style={styles.clientActionsArea}>
              {/* Botão 1: Histórico/Gráficos */}
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => router.push(`/(protected)/client-assessments?id=${item.id}`)}
              >
                <Text style={styles.actionEmoji}>📈</Text>
                <Text style={styles.actionLabel}>Evolução</Text>
              </TouchableOpacity>

              <View style={styles.verticalDivider} />

              {/* Botão 2: Nova Avaliação */}
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => router.push(`/(protected)/client-assessments?id=${item.id}&openForm=true`)}
              >
                <Text style={styles.actionEmoji}>➕</Text>
                <Text style={styles.actionLabel}>Avaliar</Text>
              </TouchableOpacity>

              <View style={styles.verticalDivider} />

              {/* Botão 3: Perfil */}
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => router.push(`/(protected)/client-details?id=${item.id}`)}
              >
                <Text style={styles.actionEmoji}>⚙️</Text>
                <Text style={styles.actionLabel}>Perfil</Text>
              </TouchableOpacity>
            </View>
          </View>
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
    backgroundColor: "#f8fafc", 
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc",
  },
  loadingText: {
    marginTop: 12,
    color: "#64748b",
    fontSize: 15,
    fontWeight: "500",
  },
  headerTopArea: {
    marginBottom: 24,
    marginTop: 10,
  },
  greetingText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
  },
  title: {
    fontSize: 32,
    fontWeight: "900",
    color: "#0f172a", 
    letterSpacing: -0.5,
  },
  
  // --- WIDGET DO PLANO ---
  planWidget: {
    backgroundColor: "#ffffff",
    padding: 24,
    borderRadius: 20,
    marginBottom: 24,
    shadowColor: "#64748b",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 15,
    elevation: 4,
  },
  planHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  planLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  planTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0f172a",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 99,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "700",
  },
  metricsRow: {
    marginBottom: 12,
  },
  planText: {
    fontSize: 15,
    color: "#64748b",
    fontWeight: "500",
  },
  highlightNumber: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0f172a",
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: "#f1f5f9",
    borderRadius: 99,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 99,
  },
  warning: {
    marginTop: 12,
    color: "#ef4444",
    fontWeight: "600",
    fontSize: 13,
  },

  // --- BOTÕES E INPUTS ---
  primaryButton: {
    backgroundColor: "#0f172a", 
    padding: 18,
    borderRadius: 16,
    marginBottom: 24,
    alignItems: "center",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  buttonText: {
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: 16,
    letterSpacing: 0.5,
  },
  searchContainer: {
    marginBottom: 24,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 54,
    shadowColor: "#64748b",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 10,
    opacity: 0.5,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#0f172a",
    height: "100%",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 16,
    letterSpacing: -0.5,
  },

  // --- CARTÃO DO CLIENTE PREMIUM ---
  clientCard: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    marginBottom: 16,
    shadowColor: "#64748b",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  clientInfoArea: {
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  clientProfileGroup: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#e0e7ff", 
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  avatarText: {
    color: "#4f46e5", 
    fontWeight: "bold",
    fontSize: 16,
    letterSpacing: 1,
  },
  clientName: {
    fontSize: 17,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 2,
  },
  clientSubText: {
    fontSize: 13,
    color: "#94a3b8",
    fontWeight: "500",
  },
  
  // --- BADGE DE VISUALIZAÇÕES PREMIUM ---
  viewsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9', 
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 10,
  },
  viewsEmoji: {
    fontSize: 10,
    marginRight: 4,
  },
  viewsText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569', 
  },

  arrowIcon: {
    fontSize: 24,
    color: "#cbd5e1",
  },
  clientActionsArea: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    backgroundColor: "#fcfcfd",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
  },
  actionEmoji: {
    fontSize: 16,
    marginRight: 8,
  },
  actionLabel: {
    fontSize: 13,
    color: "#64748b",
    fontWeight: "600",
  },
  verticalDivider: {
    width: 1,
    backgroundColor: "#f1f5f9",
    marginVertical: 10,
  },

  // --- ESTADOS VAZIOS ---
  emptyContainer: {
    padding: 30,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
    borderRadius: 20,
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#f1f5f9",
    borderStyle: "dashed", 
  },
  emptyEmoji: {
    fontSize: 40,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#0f172a",
    marginBottom: 8,
  },
  emptyText: {
    color: "#64748b",
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
  },

  // --- BOTÃO DE LOGOUT ---
  logoutButton: {
    backgroundColor: "transparent", 
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#fca5a5", 
    alignItems: "center",
  },
  logoutButtonText: {
    color: "#ef4444", 
    fontWeight: "bold",
    fontSize: 14,
    letterSpacing: 1, 
  },
});

