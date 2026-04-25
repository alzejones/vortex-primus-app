// DashboardLayoutMobile.tsx — Layout mobile original (usado no app nativo e como fallback no browser mobile)
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import {
  FlatList, Modal, Platform, RefreshControl,
  ScrollView, StyleSheet, Text, TextInput,
  TouchableOpacity, View,
} from 'react-native';
import { GradientPrimary, GradientSuccess } from '../../utils/gradients';
import { T } from '../../utils/theme';

export interface Client {
  id: string;
  name: string;
  totalViews?: number;
  [key: string]: any;
}

export interface Appointment {
  id: string;
  appointment_date: string;
  appointment_time: string;
  types: string;
  clients: { name: string } | null;
}

export interface DashboardLayoutProps {
  planName: string;
  maxClients: number;
  currentClients: number;
  planStatus: string;
  clients: Client[];
  filteredClients: Client[];
  upcomingAppointments: Appointment[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
  isScheduleModalVisible: boolean;
  onOpenScheduleModal: () => void;
  onCloseScheduleModal: () => void;
  scheduleSearchQuery: string;
  onScheduleSearchChange: (q: string) => void;
  scheduleFilteredClients: Client[];
  refreshing: boolean;
  onRefresh: () => void;
  getInitials: (name: string) => string;
  formatDateBR: (iso: string) => string;
}

export default function DashboardLayoutMobile({
  planName, maxClients, currentClients, planStatus,
  clients, filteredClients, upcomingAppointments,
  searchQuery, onSearchChange,
  isScheduleModalVisible, onOpenScheduleModal, onCloseScheduleModal,
  scheduleSearchQuery, onScheduleSearchChange, scheduleFilteredClients,
  refreshing, onRefresh,
  getInitials, formatDateBR,
}: DashboardLayoutProps) {

  const usagePercentage = maxClients > 0 ? (currentClients / maxClients) * 100 : 0;

  const renderHeader = () => (
    <View style={{ paddingBottom: 15 }}>
      <View style={[styles.headerTopArea, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
        <View>
          <Text style={styles.greetingText}>Visão Geral</Text>
          <Text style={styles.title}>Meu Dashboard</Text>
        </View>
        <TouchableOpacity
          style={{ width: 48, height: 48, backgroundColor: T.surfaceAlt, borderRadius: 24, justifyContent: 'center', alignItems: 'center' }}
          onPress={() => router.push('/(protected)/trainer-profile' as any)}
        >
          <Text style={{ fontSize: 22 }}>⚙️</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.planWidget}>
        <View style={styles.widgetHeader}>
          <Text style={styles.widgetTitle}>📅 Agendamentos</Text>
          <TouchableOpacity onPress={() => router.push('/(protected)/schedule/' as any)}>
            <Text style={styles.widgetLink}>Ver todas →</Text>
          </TouchableOpacity>
        </View>
        {upcomingAppointments.length === 0 ? (
          <TouchableOpacity
            style={styles.widgetEmpty}
            onPress={() => router.push('/(protected)/schedule/' as any)}
            activeOpacity={0.7}
          >
            <Text style={{ color: T.t2, fontSize: 14, textAlign: 'center', lineHeight: 20 }}>
              Nenhum agendamento.{'\n'}
              <Text style={{ color: T.blue, fontWeight: '700' }}>Toque para agendar avaliações →</Text>
            </Text>
          </TouchableOpacity>
        ) : (
          upcomingAppointments.map((apt) => (
            <View key={apt.id} style={styles.agendaItem}>
              <View style={styles.agendaDateBox}>
                <Text style={styles.agendaDateText}>{formatDateBR(apt.appointment_date)}</Text>
                <Text style={styles.agendaTimeText}>{apt.appointment_time?.substring(0, 5)}</Text>
              </View>
              <View style={styles.agendaInfo}>
                <Text style={styles.agendaClientName}>{(apt.clients as any)?.name || 'Aluno'}</Text>
                <Text style={styles.agendaTypes}>{apt.types}</Text>
              </View>
            </View>
          ))
        )}
      </View>

      <View style={{ borderRadius: 16, overflow: 'hidden', marginBottom: 24 }}>
        <LinearGradient {...GradientPrimary} style={{ padding: 18, alignItems: 'center' }}>
          <TouchableOpacity onPress={() => router.push('/(protected)/client-create' as any)}>
            <Text style={styles.buttonText}>+ Adicionar Novo Aluno</Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>

      <View style={{ marginBottom: 24 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
          <Text style={{ fontSize: 11, color: T.t3, fontWeight: '600' }}>Alunos ativos</Text>
          <Text style={{ fontSize: 11, color: T.t3, fontWeight: '600' }}>{currentClients}/{maxClients}</Text>
        </View>
        <View style={{ height: 4, backgroundColor: T.border, borderRadius: 99, overflow: 'hidden' }}>
          <View style={{
            height: '100%',
            borderRadius: 99,
            backgroundColor: maxClients > 0 && (currentClients / maxClients) >= 0.8 ? T.orange : T.blue,
            width: `${Math.min(maxClients > 0 ? (currentClients / maxClients) * 100 : 0, 100)}%` as any
          }} />
        </View>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar aluno..."
            placeholderTextColor={T.t3}
            value={searchQuery}
            onChangeText={onSearchChange}
          />
        </View>
      </View>

      <Text style={styles.sectionTitle}>Meus Alunos ({filteredClients.length})</Text>
    </View>
  );

  return (
    <View style={styles.outerWrapper}>
      <View style={styles.container}>
        <FlatList
          data={filteredClients}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={renderHeader}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={T.blue} />}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>👥</Text>
              <Text style={styles.emptyTitle}>Nenhum aluno encontrado</Text>
              <Text style={styles.emptyText}>Adicione seu primeiro aluno para começar</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.clientCard}>
              <TouchableOpacity style={styles.clientInfoArea} onPress={() => router.push(`/(protected)/client-details?id=${item.id}` as any)} activeOpacity={0.7}>
                <View style={styles.clientProfileGroup}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{getInitials(item.name)}</Text>
                  </View>
                  <View>
                    <Text style={styles.clientName}>{item.name}</Text>
                    <Text style={styles.clientSubText}>{item.email || 'Sem email'}</Text>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={styles.viewsBadge}>
                    <Text style={styles.viewsEmoji}>👁️</Text>
                    <Text style={styles.viewsText}>{item.totalViews ?? 0}</Text>
                  </View>
                  <Text style={styles.arrowIcon}>›</Text>
                </View>
              </TouchableOpacity>
            <View style={styles.clientActionsArea}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <TouchableOpacity style={styles.actionButtonScroll} onPress={() => router.push(`/(protected)/client-details?id=${item.id}` as any)}>
                  <Text style={styles.actionEmoji}>📋</Text><Text style={styles.actionLabel}>Perfil</Text>
                </TouchableOpacity>
                <View style={styles.verticalDivider} />
                <TouchableOpacity style={styles.actionButtonScroll} onPress={() => router.push(`/schedule/new?client_id=${item.id}` as any)}>
                  <Text style={styles.actionEmoji}>🗓️</Text><Text style={styles.actionLabel}>Agendar</Text>
                </TouchableOpacity>
                <View style={styles.verticalDivider} />
                <TouchableOpacity style={styles.actionButtonScroll} onPress={() => router.push(`/(protected)/client-assessments?id=${item.id}&openForm=true` as any)}>
                  <Text style={styles.actionEmoji}>🩻</Text><Text style={styles.actionLabel}>Avaliar</Text>
                </TouchableOpacity>
                <View style={styles.verticalDivider} />
                <TouchableOpacity style={styles.actionButtonScroll} onPress={() => router.push(`/(protected)/client-assessments?id=${item.id}` as any)}>
                  <Text style={styles.actionEmoji}>📊</Text><Text style={styles.actionLabel}>Corporal</Text>
                </TouchableOpacity>
                <View style={styles.verticalDivider} />
                <TouchableOpacity style={styles.actionButtonScroll} onPress={() => router.push(`/(protected)/assessments/conditioning?client_id=${item.id}` as any)}>
                  <Text style={styles.actionEmoji}>🏋️‍♀️</Text><Text style={styles.actionLabel}>Testar</Text>
                </TouchableOpacity>
                <View style={styles.verticalDivider} />
                <TouchableOpacity style={styles.actionButtonScroll} onPress={() => router.push(`/(protected)/assessments/conditioning-evolution?client_id=${item.id}` as any)}>
                  <Text style={styles.actionEmoji}>📈</Text><Text style={styles.actionLabel}>Condic.</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
            </View>
          )}
        />
      </View>

      <Modal
        visible={isScheduleModalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={onCloseScheduleModal}
      >
        <View style={{ flex: 1, backgroundColor: T.bg }}>
          <View style={{ flex: 1, backgroundColor: T.bg }}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderTop}>
                <Text style={styles.modalTitle}>Agendar Sessão</Text>
                <TouchableOpacity onPress={onCloseScheduleModal}>
                  <Text style={styles.modalCloseBtn}>Fechar</Text>
                </TouchableOpacity>
              </View>
              <TextInput
                style={styles.modalInput}
                placeholder="Buscar aluno..."
                placeholderTextColor={T.t3}
                value={scheduleSearchQuery}
                onChangeText={onScheduleSearchChange}
              />
            </View>
            <FlatList
              data={scheduleFilteredClients}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalClientItem}
                  onPress={() => {
                    onCloseScheduleModal();
                    router.push(`/schedule/new?client_id=${item.id}` as any);
                  }}
                >
                  <Text style={styles.modalClientEmoji}>👤</Text>
                  <Text style={styles.modalClientName}>{item.name}</Text>
                  <Text style={styles.modalArrow}>›</Text>
                </TouchableOpacity>
              )}
            />
            <View style={styles.addClientFixedFooter}>
              <TouchableOpacity
                style={styles.addClientFooterBtn}
                onPress={() => {
                  onCloseScheduleModal();
                  router.push('/(protected)/client-create' as any);
                }}
              >
                <Text style={styles.addClientFooterIcon}>+</Text>
                <Text style={styles.addClientFooterText}>Adicionar Novo Aluno</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  outerWrapper: {
    flex: 1,
    backgroundColor: T.bg,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    backgroundColor: T.bg,
  },

  // ─── Header ─────────────────────────────────────────────────────
  headerTopArea: { marginBottom: 24, marginTop: 10 },
  greetingText: { fontSize: 14, fontWeight: '600', color: T.t3, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  title: { fontSize: 32, fontWeight: '900', color: T.t1, letterSpacing: -0.5 },


  // ─── Widget de sessões ──────────────────────────────────────────
  planWidget: { backgroundColor: T.card, padding: 24, borderRadius: 20, marginBottom: 24, borderWidth: 1, borderColor: T.border },
  widgetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  widgetTitle: { fontSize: 18, fontWeight: '800', color: T.t1 },
  widgetLink: { fontSize: 12, fontWeight: '700', color: T.blue },
  widgetEmpty: { paddingVertical: 10, alignItems: 'center' },
  agendaItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: T.border },
  agendaDateBox: { backgroundColor: T.surfaceAlt, padding: 10, borderRadius: 12, alignItems: 'center', width: 65, marginRight: 14 },
  agendaDateText: { fontSize: 13, fontWeight: '800', color: T.blue },
  agendaTimeText: { fontSize: 11, color: T.blue, fontWeight: '600', marginTop: 2 },
  agendaInfo: { flex: 1 },
  agendaClientName: { fontSize: 16, fontWeight: '700', color: T.t1 },
  agendaTypes: { fontSize: 13, color: T.t2, marginTop: 2 },

  // ─── Botões de ação ─────────────────────────────────────────────
  mainScheduleBtn: { backgroundColor: T.card, flexDirection: 'row', alignItems: 'center', padding: 20, borderRadius: 20, marginBottom: 24, borderWidth: 1, borderColor: T.border },
  mainScheduleBtnIcon: { fontSize: 36, marginRight: 16 },
  mainScheduleBtnTitle: { fontSize: 18, fontWeight: '800', color: T.t1 },
  mainScheduleBtnSub: { fontSize: 13, color: T.t2, marginTop: 4, paddingRight: 30 },
  buttonText: { color: T.white, fontWeight: '800', fontSize: 16, letterSpacing: 0.5 },

  // ─── Busca ──────────────────────────────────────────────────────
  searchContainer: { marginBottom: 24 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: T.surface, borderRadius: 14, paddingHorizontal: 16, height: 54, borderWidth: 1, borderColor: T.border },
  searchIcon: { fontSize: 16, marginRight: 10, opacity: 0.6 },
  searchInput: { flex: 1, fontSize: 16, color: T.white, height: '100%' },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: T.t1, marginBottom: 16, letterSpacing: -0.5 },

  // ─── Cards de aluno ─────────────────────────────────────────────
  clientCard: { backgroundColor: T.card, borderRadius: 20, marginBottom: 16, borderWidth: 1, borderColor: T.border },
  clientInfoArea: { padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  clientProfileGroup: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: T.surfaceAlt, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  avatarText: { color: T.blue, fontWeight: 'bold', fontSize: 16, letterSpacing: 1 },
  clientName: { fontSize: 17, fontWeight: '700', color: T.t1, marginBottom: 2 },
  clientSubText: { fontSize: 13, color: T.t2, fontWeight: '500' },
  viewsBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: T.surface, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, marginRight: 10 },
  viewsEmoji: { fontSize: 10, marginRight: 4 },
  viewsText: { fontSize: 11, fontWeight: '700', color: T.t2 },
  arrowIcon: { fontSize: 24, color: T.t3 },
  clientActionsArea: { borderTopWidth: 1, borderTopColor: T.border, backgroundColor: T.bg, borderBottomLeftRadius: 20, borderBottomRightRadius: 20 },
  actionButtonScroll: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 18 },
  actionEmoji: { fontSize: 16, marginRight: 8 },
  actionLabel: { fontSize: 12, color: T.t2, fontWeight: '700' },
  verticalDivider: { width: 1, backgroundColor: T.border, marginVertical: 10 },

  // ─── Estado vazio ───────────────────────────────────────────────
  emptyContainer: { padding: 30, alignItems: 'center', justifyContent: 'center', backgroundColor: T.card, borderRadius: 20, marginTop: 10, borderWidth: 1, borderColor: T.border },
  emptyEmoji: { fontSize: 40, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: T.t1, marginBottom: 8 },
  emptyText: { color: T.t2, fontSize: 15, textAlign: 'center', lineHeight: 22 },

  // ─── Modal ──────────────────────────────────────────────────────
  modalHeader: { padding: 20, backgroundColor: T.card, borderBottomWidth: 1, borderColor: T.border, paddingTop: Platform.OS === 'android' ? 40 : 20 },
  modalHeaderTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: '900', color: T.t1 },
  modalCloseBtn: { color: T.red, fontWeight: '800', fontSize: 16 },
  modalInput: { backgroundColor: T.surface, padding: 16, borderRadius: 12, fontSize: 16, color: T.white, borderWidth: 1, borderColor: T.border },
  modalClientItem: { padding: 16, backgroundColor: T.card, borderBottomWidth: 1, borderColor: T.border, flexDirection: 'row', alignItems: 'center' },
  modalClientEmoji: { fontSize: 24, marginRight: 16 },
  modalClientName: { fontSize: 16, fontWeight: '700', color: T.t1, flex: 1 },
  modalArrow: { fontSize: 18, color: T.t3 },
  addClientFixedFooter: { backgroundColor: T.surface, borderTopWidth: 1, borderTopColor: T.border, padding: 12 },
  addClientFooterBtn: { flexDirection: 'row', alignItems: 'center', padding: 14, backgroundColor: T.card, borderRadius: 12, borderWidth: 1, borderColor: T.border },
  addClientFooterIcon: { fontSize: 18, color: T.blue, marginRight: 10, fontWeight: '800' },
  addClientFooterText: { fontSize: 15, color: T.blue, fontWeight: '700' },
});