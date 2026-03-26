import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Platform,
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
  const [trainerId, setTrainerId] = useState<string | null>(null);
  const [clients, setClients] = useState<any[]>([]);

  const [upcomingAppointments, setUpcomingAppointments] = useState<any[]>([]);
  const [isScheduleModalVisible, setScheduleModalVisible] = useState(false);
  const [scheduleSearchQuery, setScheduleSearchQuery] = useState("");

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: trainer } = await supabase.from("trainers").select("id").eq("user_id", user.id).single();
      if (!trainer) return;
      setTrainerId(trainer.id);

      const { data: subscription } = await supabase.from("subscriptions").select("plan_name, max_clients").eq("trainer_id", trainer.id).single();
      if (subscription) {
        setPlanName(subscription.plan_name);
        setMaxClients(subscription.max_clients);
      }

      const { data: clientsData } = await supabase.from("clients").select("*").eq("trainer_id", trainer.id).order("name");
      if (clientsData) {
        setClients(clientsData);
        setCurrentClients(clientsData.length);
      }

      const today = new Date().toISOString().split('T')[0];
      const { data: agendaData } = await supabase
        .from("appointments")
        .select("id, appointment_date, appointment_time, types, clients(name)")
        .eq("trainer_id", trainer.id)
        .gte("appointment_date", today)
        .order("appointment_date", { ascending: true })
        .order("appointment_time", { ascending: true })
        .limit(3);

      if (agendaData) {
        setUpcomingAppointments(agendaData);
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

  const filteredClients = clients.filter((c) => c.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const scheduleFilteredClients = clients.filter((c) => c.name.toLowerCase().includes(scheduleSearchQuery.toLowerCase()));

  const formatDateBR = (isoString: string) => {
    if (!isoString) return "";
    const [y, m, d] = isoString.split('-');
    return `${d}/${m}`;
  };

  if (loading) {
    return <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}><ActivityIndicator size="large" color="#2563eb" /></View>;
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f8fafc" }}>
      
      <Modal visible={isScheduleModalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setScheduleModalVisible(false)}>
        <View style={styles.modalHeader}>
          <View style={styles.modalHeaderTop}>
            <Text style={styles.modalTitle}>Agendar Avaliação</Text>
            <TouchableOpacity onPress={() => setScheduleModalVisible(false)}><Text style={styles.modalCloseBtn}>Fechar</Text></TouchableOpacity>
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
                // CORREÇÃO: Usando a navegação via String para evitar erros do TypeScript
                router.push(`/schedule/new?client_id=${item.id}` as any);
              }}
            >
              <Text style={styles.modalClientEmoji}>👤</Text>
              <Text style={styles.modalClientName}>{item.name}</Text>
              <Text style={styles.modalArrow}>→</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={<Text style={{ textAlign: "center", color: "#64748b", marginTop: 20 }}>Nenhum aluno encontrado.</Text>}
        />
      </Modal>

      <FlatList
        data={filteredClients}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
        ListHeaderComponent={
          <View>
            <View style={styles.header}>
              <View>
                <Text style={styles.welcomeText}>Bem-vindo,</Text>
                <Text style={styles.titleText}>Dashboard</Text>
              </View>
              <TouchableOpacity onPress={signOut} style={styles.logoutBtn}><Text style={styles.logoutText}>Sair</Text></TouchableOpacity>
            </View>

            <View style={styles.planCard}>
              <Text style={styles.planTitle}>Plano Atual: {planName}</Text>
              <Text style={styles.planInfo}>Alunos: {currentClients} / {maxClients}</Text>
            </View>

            <View style={styles.widgetContainer}>
              <View style={styles.widgetHeader}>
                <Text style={styles.widgetTitle}>Próximas Avaliações</Text>
                <TouchableOpacity onPress={() => router.push('/schedule'  as any)}>
                  <Text style={styles.widgetLink}>Ver Toda a Agenda</Text>
                </TouchableOpacity>
              </View>
              
              {upcomingAppointments.length === 0 ? (
                <View style={styles.widgetEmpty}>
                  <Text style={{ color: '#64748b' }}>Sem avaliações marcadas para breve.</Text>
                </View>
              ) : (
                upcomingAppointments.map((app) => (
                  <View key={app.id} style={styles.agendaItem}>
                    <View style={styles.agendaDateBox}>
                      <Text style={styles.agendaDateText}>{formatDateBR(app.appointment_date)}</Text>
                      <Text style={styles.agendaTimeText}>{app.appointment_time}</Text>
                    </View>
                    <View style={styles.agendaInfo}>
                      <Text style={styles.agendaClientName}>{app.clients?.name}</Text>
                      <Text style={styles.agendaTypes}>
                        {app.types && app.types.includes('composition') && '⚖️ Comp. '}
                        {app.types && app.types.includes('conditioning') && '🏃 Cond. '}
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </View>

            <TouchableOpacity 
              style={styles.mainScheduleBtn} 
              onPress={() => { setScheduleSearchQuery(""); setScheduleModalVisible(true); }}
            >
              <Text style={styles.mainScheduleBtnIcon}>📅</Text>
              <View>
                <Text style={styles.mainScheduleBtnTitle}>Novo Agendamento</Text>
                <Text style={styles.mainScheduleBtnSub}>Busque um aluno e marque um horário rapidamente</Text>
              </View>
            </TouchableOpacity>

            <View style={styles.searchRow}>
              <TextInput style={styles.searchInput} placeholder="Buscar aluno..." value={searchQuery} onChangeText={setSearchQuery} />
              <TouchableOpacity style={styles.addBtn} onPress={() => router.push("/clients/new"  as any)}><Text style={styles.addBtnText}>+ Novo</Text></TouchableOpacity>
            </View>
          </View>
        }
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
<View style={styles.actionArea}>
              <TouchableOpacity style={styles.actionButton} onPress={() => router.push(`/clients/${item.id}` as any)}>
                <Text style={styles.actionEmoji}>📋</Text>
                <Text style={styles.actionLabel}>Perfil</Text>
              </TouchableOpacity>
              
              <View style={styles.verticalDivider} />
              
              <TouchableOpacity style={styles.actionButton} onPress={() => router.push(`/schedule/new?client_id=${item.id}` as any)}>
                <Text style={styles.actionEmoji}>📅</Text>
                <Text style={styles.actionLabel}>Agendar</Text>
              </TouchableOpacity>
              
              <View style={styles.verticalDivider} />
              
              <TouchableOpacity style={styles.actionButton} onPress={() => router.push(`/assessments/new?client_id=${item.id}` as any)}>
                <Text style={styles.actionEmoji}>⚖️</Text>
                <Text style={styles.actionLabel}>Comp.</Text>
              </TouchableOpacity>
              
              <View style={styles.verticalDivider} />
              
              <TouchableOpacity style={styles.actionButton} onPress={() => router.push(`/assessments/conditioning?client_id=${item.id}` as any)}>
                <Text style={styles.actionEmoji}>🏃</Text>
                <Text style={styles.actionLabel}>Condic.</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 20, marginBottom: 16 },
  welcomeText: { fontSize: 14, color: "#64748b" },
  titleText: { fontSize: 28, fontWeight: "bold", color: "#0f172a" },
  logoutBtn: { backgroundColor: "#f1f5f9", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  logoutText: { color: "#ef4444", fontWeight: "bold" },
  
  planCard: { backgroundColor: "#1e293b", padding: 16, borderRadius: 12, marginBottom: 16 },
  planTitle: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  planInfo: { color: "#94a3b8", fontSize: 14, marginTop: 4 },

  widgetContainer: { backgroundColor: "#fff", borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: "#e2e8f0" },
  widgetHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  widgetTitle: { fontSize: 16, fontWeight: "800", color: "#0f172a" },
  widgetLink: { fontSize: 12, fontWeight: "700", color: "#2563eb" },
  widgetEmpty: { paddingVertical: 10, alignItems: "center" },
  
  agendaItem: { flexDirection: "row", alignItems: "center", marginBottom: 8, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  agendaDateBox: { backgroundColor: "#f8fafc", padding: 8, borderRadius: 8, alignItems: "center", width: 60, marginRight: 12, borderWidth: 1, borderColor: "#e2e8f0" },
  agendaDateText: { fontSize: 12, fontWeight: "800", color: "#1e293b" },
  agendaTimeText: { fontSize: 11, color: "#64748b", fontWeight: "600", marginTop: 2 },
  agendaInfo: { flex: 1 },
  agendaClientName: { fontSize: 15, fontWeight: "700", color: "#334155" },
  agendaTypes: { fontSize: 12, color: "#64748b", marginTop: 2 },

  mainScheduleBtn: { backgroundColor: "#eff6ff", flexDirection: "row", alignItems: "center", padding: 16, borderRadius: 16, marginBottom: 20, borderWidth: 1, borderColor: "#bfdbfe" },
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
  
  actionArea: { flexDirection: "row", borderTopWidth: 1, borderTopColor: "#f1f5f9", backgroundColor: "#fcfcfd", borderBottomLeftRadius: 12, borderBottomRightRadius: 12 },
  actionButton: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 14 },
  actionEmoji: { fontSize: 16, marginRight: 6 },
  actionLabel: { fontSize: 11, color: "#64748b", fontWeight: "600" },
  verticalDivider: { width: 1, backgroundColor: "#f1f5f9", marginVertical: 10 },

  emptyContainer: { padding: 30, alignItems: "center", backgroundColor: "#fff", borderRadius: 12, marginTop: 10, borderWidth: 1, borderColor: "#f1f5f9", borderStyle: "dashed" },
  emptyEmoji: { fontSize: 40, marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: "bold", color: "#64748b" },

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

