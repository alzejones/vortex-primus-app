import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
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
} from "react-native";
import { supabase } from "../../lib/supabase";

export default function Index() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [planName, setPlanName] = useState("");
  const [maxClients, setMaxClients] = useState(0);
  const [currentClients, setCurrentClients] = useState(0);
  const [planStatus, setPlanStatus] = useState("");
  const [trainerId, setTrainerId] = useState<string | null>(null);
  const [clients, setClients] = useState<any[]>([]);

  // 🔴 ESTADOS DA AGENDA
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

      // BUSCA O PLANO
      const { data: subscription } = await supabase
        .from("trainer_subscriptions")
        .select(`is_active, plans ( name, max_clients )`)
        .eq("trainer_id", trainer.id)
        .eq("is_active", true)
        .single();

      if (subscription) {
        const planData = subscription.plans as any;
        setPlanName(planData?.name || "Sem Plano");
        setMaxClients(planData?.max_clients || 0);
        setPlanStatus(subscription.is_active ? "Ativo" : "Inativo");
      }

      // BUSCA CLIENTES E VIEWS
      const { data: clientList } = await supabase
        .from("clients")
        .select(`
          *,
          physical_assessments (
            id,
            anthropometry:anthropometry!anthropometry_assessment_id_fkey (view_count)
          )
        `)
        .eq("trainer_id", trainer.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

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

      // 🔴 BUSCA OS PRÓXIMOS AGENDAMENTOS
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

  const getInitials = (name: string) => {
    if (!name) return "AL";
    const names = name.trim().split(" ");
    if (names.length >= 2) return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  const formatDateBR = (isoString: string) => {
    if (!isoString) return "";
    const [y, m, d] = isoString.split('-');
    return `${d}/${m}`;
  };

  const usagePercentage = maxClients > 0 ? (currentClients / maxClients) * 100 : 0;
  
  const filteredClients = clients.filter((client) => client.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const scheduleFilteredClients = clients.filter((c) => c.name.toLowerCase().includes(scheduleSearchQuery.toLowerCase()));

const renderHeader = () => (
    <View style={{ paddingBottom: 15 }}>
      <View style={[styles.headerTopArea, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
        <View>
          <Text style={styles.greetingText}>Visão Geral</Text>
          <Text style={styles.title}>Meu Dashboard</Text>
        </View>
        <TouchableOpacity 
          style={{ width: 48, height: 48, backgroundColor: '#e0e7ff', borderRadius: 24, justifyContent: 'center', alignItems: 'center' }}
          onPress={() => router.push("/(protected)/trainer-profile" as any)}
        >
          <Text style={{ fontSize: 22 }}>⚙️</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.planWidget}>
        <View style={styles.planHeader}>
          <View>
            <Text style={styles.planLabel}>Plano Atual</Text>
            <Text style={styles.planTitle}>{planName}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: planStatus === "Ativo" ? "#ecfdf5" : "#fef2f2" }]}>
            <View style={[styles.statusDot, { backgroundColor: planStatus === "Ativo" ? "#10b981" : "#ef4444" }]} />
            <Text style={[styles.statusText, { color: planStatus === "Ativo" ? "#059669" : "#dc2626" }]}>{planStatus}</Text>
          </View>
        </View>
        
        <View style={styles.metricsRow}>
          <Text style={styles.planText}><Text style={styles.highlightNumber}>{currentClients}</Text> de {maxClients} alunos</Text>
        </View>

        <View style={styles.progressBarBackground}>
          <View style={[styles.progressBarFill, { width: `${Math.min(usagePercentage, 100)}%`, backgroundColor: usagePercentage >= 80 ? "#ef4444" : "#4f46e5" }]} />
        </View>
        {usagePercentage >= 80 && <Text style={styles.warning}>⚠️ Você está próximo do limite do seu plano.</Text>}

        {/* 🔴 A PONTE DE VENDA (UPSELL CONTEXTUAL) */}
        {usagePercentage >= 80 && (
          <TouchableOpacity 
            style={styles.upgradeDashboardBtn}
            onPress={() => router.push("/(protected)/upgrade" as any)}
            activeOpacity={0.8}
          >
            <Text style={styles.upgradeDashboardBtnText}>⭐ Fazer Upgrade Agora</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 🔴 NOVO WIDGET: PRÓXIMAS AVALIAÇÕES */}
      <View style={styles.planWidget}>
        <View style={styles.widgetHeader}>
          <Text style={styles.widgetTitle}>Próximas Avaliações</Text>
          <TouchableOpacity onPress={() => router.push('/schedule' as any)}>
            <Text style={styles.widgetLink}>Ver Toda a Agenda</Text>
          </TouchableOpacity>
        </View>
        
        {upcomingAppointments.length === 0 ? (
          <View style={styles.widgetEmpty}>
            <Text style={{ color: '#94a3b8' }}>Sem avaliações marcadas para breve.</Text>
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

      {/* 🔴 BOTÃO GIGANTE DE AGENDAMENTO RÁPIDO */}
      <TouchableOpacity 
        style={styles.mainScheduleBtn} 
        onPress={() => { setScheduleSearchQuery(""); setScheduleModalVisible(true); }}
        activeOpacity={0.8}
      >
        <Text style={styles.mainScheduleBtnIcon}>📅</Text>
        <View>
          <Text style={styles.mainScheduleBtnTitle}>Novo Agendamento</Text>
          <Text style={styles.mainScheduleBtnSub}>Marque um horário rapidamente com seu aluno</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push("/(protected)/client-create")} style={styles.primaryButton} activeOpacity={0.8}>
        <Text style={styles.buttonText}>+ Adicionar Novo Aluno</Text>
      </TouchableOpacity>

      {clients.length > 0 && (
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput style={styles.searchInput} placeholder="Buscar aluno por nome..." placeholderTextColor="#94a3b8" value={searchQuery} onChangeText={setSearchQuery} />
          </View>
        </View>
      )}

      {clients.length > 0 && <Text style={styles.sectionTitle}>Seus Alunos</Text>}
    </View>
  );

  const renderFooter = () => null;

  if (loading) return (
    <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#4f46e5" /><Text style={styles.loadingText}>Carregando seu painel...</Text></View>
  );

  return (
    <View style={styles.container}>
      
      {/* 🔴 MODAL DE AGENDAMENTO INTELIGENTE */}
      <Modal visible={isScheduleModalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setScheduleModalVisible(false)}>
        <View style={styles.modalHeader}>
          <View style={styles.modalHeaderTop}>
            <Text style={styles.modalTitle}>Agendar Avaliação</Text>
            <TouchableOpacity onPress={() => setScheduleModalVisible(false)}><Text style={styles.modalCloseBtn}>Fechar</Text></TouchableOpacity>
          </View>
          <TextInput style={styles.modalInput} placeholder="Qual aluno será avaliado?" placeholderTextColor="#94a3b8" value={scheduleSearchQuery} onChangeText={setScheduleSearchQuery} autoFocus />
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
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#4f46e5"]} tintColor="#4f46e5" />}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={
          clients.length > 0 ? (
            <View style={styles.emptyContainer}><Text style={styles.emptyEmoji}>🧐</Text><Text style={styles.emptyText}>Nenhum aluno encontrado.</Text></View>
          ) : (
            <View style={styles.emptyContainer}><Text style={styles.emptyEmoji}>🚀</Text><Text style={styles.emptyTitle}>Sua jornada começa aqui!</Text><Text style={styles.emptyText}>Você ainda não possui alunos cadastrados.</Text></View>
          )
        }
        renderItem={({ item }) => (
          <View style={styles.clientCard}>
            
            <TouchableOpacity style={styles.clientInfoArea} onPress={() => handleClientPress(item.id)} activeOpacity={0.7}>
              <View style={styles.clientProfileGroup}>
                <View style={styles.avatar}><Text style={styles.avatarText}>{getInitials(item.name)}</Text></View>
                <View>
                  <Text style={styles.clientName}>{item.name}</Text>
                  <Text style={styles.clientSubText}>Ver perfil completo</Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={styles.viewsBadge}><Text style={styles.viewsEmoji}>👁️</Text><Text style={styles.viewsText}>{item.totalViews !== undefined ? item.totalViews : 0}</Text></View>
                <Text style={styles.arrowIcon}>›</Text>
              </View>
            </TouchableOpacity>

            <View style={styles.clientActionsArea}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                
                {/* 1. PERFIL */}
                <TouchableOpacity style={styles.actionButtonScroll} onPress={() => router.push(`/(protected)/client-details?id=${item.id}` as any)}>
                  <Text style={styles.actionEmoji}>📋</Text>
                  <Text style={styles.actionLabel}>Perfil</Text>
                </TouchableOpacity>
                <View style={styles.verticalDivider} />

                {/* 2. AGENDAR */}
                <TouchableOpacity style={styles.actionButtonScroll} onPress={() => router.push(`/schedule/new?client_id=${item.id}` as any)}>
                  <Text style={styles.actionEmoji}>📅</Text>
                  <Text style={styles.actionLabel}>Agendar</Text>
                </TouchableOpacity>
                <View style={styles.verticalDivider} />

                {/* 3. VER AVALIAÇÃO CORPORAL */}
                <TouchableOpacity style={styles.actionButtonScroll} onPress={() => router.push(`/(protected)/client-assessments?id=${item.id}` as any)}>
                  <Text style={styles.actionEmoji}>📉</Text>
                  <Text style={styles.actionLabel}>Corporal</Text>
                </TouchableOpacity>
                <View style={styles.verticalDivider} />

                {/* 4. ADICIONAR NOVA AVALIAÇÃO CORPORAL */}
                <TouchableOpacity style={styles.actionButtonScroll} onPress={() => router.push(`/(protected)/client-assessments?id=${item.id}&openForm=true` as any)}>
                  <Text style={styles.actionEmoji}>➕</Text>
                  <Text style={styles.actionLabel}>Avaliar</Text>
                </TouchableOpacity>
                <View style={styles.verticalDivider} />

                {/* 5. VER CONDICIONAMENTO */}
                <TouchableOpacity style={styles.actionButtonScroll} onPress={() => router.push(`/(protected)/assessments/conditioning-evolution?client_id=${item.id}` as any)}>
                  <Text style={styles.actionEmoji}>📈</Text>
                  <Text style={styles.actionLabel}>Condic.</Text>
                </TouchableOpacity>
                <View style={styles.verticalDivider} />

                {/* 6. ADICIONAR NOVO CONDICIONAMENTO */}
                <TouchableOpacity style={styles.actionButtonScroll} onPress={() => router.push(`/(protected)/assessments/conditioning?client_id=${item.id}` as any)}>
                  <Text style={styles.actionEmoji}>💪</Text>
                  <Text style={styles.actionLabel}>Testar</Text>
                </TouchableOpacity>

              </ScrollView>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 20, backgroundColor: "#f8fafc" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f8fafc" },
  loadingText: { marginTop: 12, color: "#64748b", fontSize: 15, fontWeight: "500" },
  headerTopArea: { marginBottom: 24, marginTop: 10 },
  greetingText: { fontSize: 14, fontWeight: "600", color: "#64748b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 },
  title: { fontSize: 32, fontWeight: "900", color: "#0f172a", letterSpacing: -0.5 },
  
  planWidget: { backgroundColor: "#ffffff", padding: 24, borderRadius: 20, marginBottom: 24, shadowColor: "#64748b", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.06, shadowRadius: 15, elevation: 4 },
  planHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 },
  planLabel: { fontSize: 12, fontWeight: "700", color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 },
  planTitle: { fontSize: 22, fontWeight: "800", color: "#0f172a" },
  statusBadge: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 99 },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  statusText: { fontSize: 12, fontWeight: "700" },
  metricsRow: { marginBottom: 12 },
  planText: { fontSize: 15, color: "#64748b", fontWeight: "500" },
  highlightNumber: { fontSize: 18, fontWeight: "800", color: "#0f172a" },
  progressBarBackground: { height: 8, backgroundColor: "#f1f5f9", borderRadius: 99, overflow: "hidden" },
  progressBarFill: { height: "100%", borderRadius: 99 },
  warning: { marginTop: 12, color: "#ef4444", fontWeight: "600", fontSize: 13 },

  // 🔴 NOVO ESTILO DO BOTÃO DE UPGRADE
  upgradeDashboardBtn: { backgroundColor: "#111827", paddingVertical: 14, borderRadius: 12, alignItems: "center", marginTop: 16, shadowColor: "#111827", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  upgradeDashboardBtnText: { color: "#ffffff", fontWeight: "800", fontSize: 14, textTransform: "uppercase", letterSpacing: 0.5 },

  widgetHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  widgetTitle: { fontSize: 18, fontWeight: "800", color: "#0f172a" },
  widgetLink: { fontSize: 12, fontWeight: "700", color: "#4f46e5" },
  widgetEmpty: { paddingVertical: 10, alignItems: "center" },
  agendaItem: { flexDirection: "row", alignItems: "center", marginBottom: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  agendaDateBox: { backgroundColor: "#e0e7ff", padding: 10, borderRadius: 12, alignItems: "center", width: 65, marginRight: 14 },
  agendaDateText: { fontSize: 13, fontWeight: "800", color: "#4f46e5" },
  agendaTimeText: { fontSize: 11, color: "#4f46e5", fontWeight: "600", marginTop: 2 },
  agendaInfo: { flex: 1 },
  agendaClientName: { fontSize: 16, fontWeight: "700", color: "#0f172a" },
  agendaTypes: { fontSize: 13, color: "#64748b", marginTop: 2 },

  mainScheduleBtn: { backgroundColor: "#e0e7ff", flexDirection: "row", alignItems: "center", padding: 20, borderRadius: 20, marginBottom: 24, borderWidth: 1, borderColor: "#c7d2fe" },
  mainScheduleBtnIcon: { fontSize: 36, marginRight: 16 },
  mainScheduleBtnTitle: { fontSize: 18, fontWeight: "800", color: "#4f46e5" },
  mainScheduleBtnSub: { fontSize: 13, color: "#4f46e5", marginTop: 4, paddingRight: 30, opacity: 0.8 },

  primaryButton: { backgroundColor: "#0f172a", padding: 18, borderRadius: 16, marginBottom: 24, alignItems: "center", shadowColor: "#0f172a", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 5 },
  buttonText: { color: "#ffffff", fontWeight: "bold", fontSize: 16, letterSpacing: 0.5 },
  searchContainer: { marginBottom: 24 },
  searchBar: { flexDirection: "row", alignItems: "center", backgroundColor: "#ffffff", borderRadius: 14, paddingHorizontal: 16, height: 54, shadowColor: "#64748b", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  searchIcon: { fontSize: 16, marginRight: 10, opacity: 0.5 },
  searchInput: { flex: 1, fontSize: 16, color: "#0f172a", height: "100%" },
  sectionTitle: { fontSize: 20, fontWeight: "800", color: "#0f172a", marginBottom: 16, letterSpacing: -0.5 },

  clientCard: { backgroundColor: "#ffffff", borderRadius: 20, marginBottom: 16, shadowColor: "#64748b", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  clientInfoArea: { padding: 20, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  clientProfileGroup: { flexDirection: "row", alignItems: "center" },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: "#e0e7ff", alignItems: "center", justifyContent: "center", marginRight: 14 },
  avatarText: { color: "#4f46e5", fontWeight: "bold", fontSize: 16, letterSpacing: 1 },
  clientName: { fontSize: 17, fontWeight: "700", color: "#0f172a", marginBottom: 2 },
  clientSubText: { fontSize: 13, color: "#94a3b8", fontWeight: "500" },
  viewsBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, marginRight: 10 },
  viewsEmoji: { fontSize: 10, marginRight: 4 },
  viewsText: { fontSize: 11, fontWeight: '700', color: '#475569' },
  arrowIcon: { fontSize: 24, color: "#cbd5e1" },
  
  clientActionsArea: { borderTopWidth: 1, borderTopColor: "#f1f5f9", backgroundColor: "#fcfcfd", borderBottomLeftRadius: 20, borderBottomRightRadius: 20 },
  actionButtonScroll: { flexDirection: "row", alignItems: "center", paddingVertical: 14, paddingHorizontal: 18 },
  actionEmoji: { fontSize: 16, marginRight: 8 },
  actionLabel: { fontSize: 12, color: "#64748b", fontWeight: "700" },
  verticalDivider: { width: 1, backgroundColor: "#e2e8f0", marginVertical: 10 },

  emptyContainer: { padding: 30, alignItems: "center", justifyContent: "center", backgroundColor: "#ffffff", borderRadius: 20, marginTop: 10, borderWidth: 1, borderColor: "#f1f5f9", borderStyle: "dashed" },
  emptyEmoji: { fontSize: 40, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: "bold", color: "#0f172a", marginBottom: 8 },
  emptyText: { color: "#64748b", fontSize: 15, textAlign: "center", lineHeight: 22 },

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
