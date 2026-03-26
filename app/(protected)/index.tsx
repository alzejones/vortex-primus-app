import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabase";

export default function Index() {
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

  // 🔴 NOVOS ESTADOS: Controle do Modal Inteligente de Agendamento
  const [isScheduleModalVisible, setScheduleModalVisible] = useState(false);
  const [scheduleSearchQuery, setScheduleSearchQuery] = useState("");

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

      // (Mantida a sua lógica original de busca de plano e clientes)
      const { data: subscription } = await supabase
        .from("subscriptions")
        .select("plan_name, max_clients, status")
        .eq("trainer_id", trainer.id)
        .single();

      if (subscription) {
        setPlanName(subscription.plan_name);
        setMaxClients(subscription.max_clients);
        setPlanStatus(subscription.status);
      }

      const { data: clientsData } = await supabase
        .from("clients")
        .select("*")
        .eq("trainer_id", trainer.id)
        .order("name");

      if (clientsData) {
        setClients(clientsData);
        setCurrentClients(clientsData.length);
      }
    } catch (error) {
      console.log("Erro ao carregar dashboard:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const handleRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  const filteredClients = clients.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filtro específico para o Modal de Agendamento
  const scheduleFilteredClients = clients.filter((c) =>
    c.name.toLowerCase().includes(scheduleSearchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f8fafc" }}>
      
      {/* 🔴 MODAL DE AGENDAMENTO (SOBREPÕE A TELA QUANDO ATIVADO) */}
      <Modal visible={isScheduleModalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setScheduleModalVisible(false)}>
        <View style={styles.modalHeader}>
          <View style={styles.modalHeaderTop}>
            <Text style={styles.modalTitle}>Agendar Avaliação</Text>
            <TouchableOpacity onPress={() => setScheduleModalVisible(false)}>
              <Text style={styles.modalCloseBtn}>Fechar</Text>
            </TouchableOpacity>
          </View>
          <TextInput
            style={styles.modalInput}
            placeholder="Qual aluno será avaliado?"
            placeholderTextColor="#94a3b8"
            value={scheduleSearchQuery}
            onChangeText={setScheduleSearchQuery}
            autoFocus
          />
        </View>
        <FlatList
          data={scheduleFilteredClients}
          keyExtractor={(item) => item.id}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.modalClientItem}
              onPress={() => {
                setScheduleModalVisible(false);
                router.push({ pathname: '/schedule/new', params: { client_id: item.id } });
              }}
            >
              <Text style={styles.modalClientEmoji}>👤</Text>
              <Text style={styles.modalClientName}>{item.name}</Text>
              <Text style={styles.modalArrow}>→</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <Text style={{ textAlign: "center", color: "#64748b", marginTop: 20 }}>Nenhum aluno encontrado.</Text>
          }
        />
      </Modal>

      <View style={styles.container}>
        {/* CABEÇALHO PADRÃO DO DASHBOARD */}
        <View style={styles.header}>
          <View>
            <Text style={styles.welcomeText}>Bem-vindo,</Text>
            <Text style={styles.titleText}>Dashboard</Text>
          </View>
          <TouchableOpacity onPress={signOut} style={styles.logoutBtn}>
            <Text style={styles.logoutText}>Sair</Text>
          </TouchableOpacity>
        </View>

        {/* INFO DO PLANO */}
        <View style={styles.planCard}>
          <Text style={styles.planTitle}>Plano Atual: {planName}</Text>
          <Text style={styles.planInfo}>
            Alunos: {currentClients} / {maxClients}
          </Text>
        </View>

        {/* 🔴 O NOVO BOTÃO DE AÇÃO RÁPIDA (DESTAQUE) */}
        <TouchableOpacity 
          style={styles.mainScheduleBtn} 
          onPress={() => {
            setScheduleSearchQuery(""); // Limpa a busca anterior
            setScheduleModalVisible(true); // Abre o modal inteligente
          }}
        >
          <Text style={styles.mainScheduleBtnIcon}>📅</Text>
          <View>
            <Text style={styles.mainScheduleBtnTitle}>Agendar Avaliação</Text>
            <Text style={styles.mainScheduleBtnSub}>Busque um aluno e marque um horário rapidamente</Text>
          </View>
        </TouchableOpacity>

        {/* BUSCA DA LISTA PRINCIPAL E BOTÃO DE NOVO ALUNO */}
        <View style={styles.searchRow}>
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar aluno..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => router.push("/clients/new")}
          >
            <Text style={styles.addBtnText}>+ Novo</Text>
          </TouchableOpacity>
        </View>

        {/* LISTAGEM PRINCIPAL DE ALUNOS */}
        <FlatList
          data={filteredClients}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
          contentContainerStyle={{ paddingBottom: 40 }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>👥</Text>
              <Text style={styles.emptyTitle}>Nenhum aluno encontrado.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.clientCard}>
              <View style={styles.clientInfoArea}>
                <Text style={styles.clientName}>{item.name}</Text>
                <Text style={styles.clientEmail}>{item.email}</Text>
              </View>

              {/* BARRA DE AÇÕES INFERIOR DO CARD */}
              <View style={styles.actionArea}>
                <TouchableOpacity style={styles.actionButton} onPress={() => router.push(`/clients/${item.id}`)}>
                  <Text style={styles.actionEmoji}>📋</Text>
                  <Text style={styles.actionLabel}>Perfil</Text>
                </TouchableOpacity>

                <View style={styles.verticalDivider} />

                {/* BOTÃO CONTEXTUAL DE AGENDAMENTO DENTRO DO CARD (Opcional, mas muito útil) */}
                <TouchableOpacity style={styles.actionButton} onPress={() => router.push({ pathname: '/schedule/new', params: { client_id: item.id } })}>
                  <Text style={styles.actionEmoji}>📅</Text>
                  <Text style={styles.actionLabel}>Agendar</Text>
                </TouchableOpacity>

                <View style={styles.verticalDivider} />

                <TouchableOpacity style={styles.actionButton} onPress={() => router.push(`/assessments/new?client_id=${item.id}`)}>
                  <Text style={styles.actionEmoji}>⚖️</Text>
                  <Text style={styles.actionLabel}>Comp.</Text>
                </TouchableOpacity>

                <View style={styles.verticalDivider} />

                <TouchableOpacity style={styles.actionButton} onPress={() => router.push(`/assessments/conditioning?client_id=${item.id}`)}>
                  <Text style={styles.actionEmoji}>🏃</Text>
                  <Text style={styles.actionLabel}>Condic.</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 20, marginBottom: 16 },
  welcomeText: { fontSize: 14, color: "#64748b" },
  titleText: { fontSize: 28, fontWeight: "bold", color: "#0f172a" },
  logoutBtn: { backgroundColor: "#f1f5f9", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  logoutText: { color: "#ef4444", fontWeight: "bold" },
  
  planCard: { backgroundColor: "#1e293b", padding: 16, borderRadius: 12, marginBottom: 16 },
  planTitle: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  planInfo: { color: "#94a3b8", fontSize: 14, marginTop: 4 },

  // --- BOTÃO PRINCIPAL DE AGENDAMENTO (NOVO) ---
  mainScheduleBtn: {
    backgroundColor: "#eff6ff",
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#bfdbfe",
  },
  mainScheduleBtnIcon: { fontSize: 32, marginRight: 16 },
  mainScheduleBtnTitle: { fontSize: 18, fontWeight: "800", color: "#1d4ed8" },
  mainScheduleBtnSub: { fontSize: 12, color: "#3b82f6", marginTop: 2, paddingRight: 30 },

  searchRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  searchInput: { flex: 1, backgroundColor: "#fff", borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 8, paddingHorizontal: 16, height: 48 },
  addBtn: { backgroundColor: "#2563eb", justifyContent: "center", paddingHorizontal: 20, borderRadius: 8 },
  addBtnText: { color: "#fff", fontWeight: "bold" },
  
  clientCard: { backgroundColor: "#fff", borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: "#e2e8f0" },
  clientInfoArea: { padding: 16 },
  clientName: { fontSize: 18, fontWeight: "bold", color: "#1e293b" },
  clientEmail: { fontSize: 14, color: "#64748b", marginTop: 4 },
  
  actionArea: { flexDirection: "row", borderTopWidth: 1, borderTopColor: "#f1f5f9", backgroundColor: "#f8fafc", borderBottomLeftRadius: 12, borderBottomRightRadius: 12 },
  actionButton: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 12 },
  actionEmoji: { fontSize: 14, marginRight: 6 },
  actionLabel: { fontSize: 11, color: "#64748b", fontWeight: "700" },
  verticalDivider: { width: 1, backgroundColor: "#e2e8f0", marginVertical: 8 },

  emptyContainer: { padding: 30, alignItems: "center", backgroundColor: "#fff", borderRadius: 12, marginTop: 10, borderWidth: 1, borderColor: "#e2e8f0", borderStyle: "dashed" },
  emptyEmoji: { fontSize: 40, marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: "bold", color: "#64748b" },

  // --- ESTILOS DO MODAL DE AGENDAMENTO (NOVO) ---
  modalHeader: { padding: 20, backgroundColor: "#fff", borderBottomWidth: 1, borderColor: "#e2e8f0", paddingTop: Platform.OS === "android" ? 40 : 20 },
  modalHeaderTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: "900", color: "#0f172a" },
  modalCloseBtn: { color: "#ef4444", fontWeight: "800", fontSize: 16 },
  modalInput: { backgroundColor: "#f1f5f9", padding: 16, borderRadius: 12, fontSize: 16, color: "#1e293b", borderWidth: 1, borderColor: "#cbd5e1" },
  modalClientItem: { padding: 16, backgroundColor: "#fff", borderBottomWidth: 1, borderColor: "#f1f5f9", flexDirection: "row", alignItems: "center" },
  modalClientEmoji: { fontSize: 24, marginRight: 16 },
  modalClientName: { fontSize: 16, fontWeight: "700", color: "#334155", flex: 1 },
  modalArrow: { fontSize: 18, color: "#cbd5e1" },
});

