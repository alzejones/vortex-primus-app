// ============================================================
// DashboardLayout.tsx — Layout responsivo do dashboard
// Mobile: comportamento original preservado integralmente.
// Desktop (>=768px): container centralizado maxWidth 960,
//                    modal como overlay centralizado.
// ============================================================
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import {
  Dimensions,
  FlatList, Modal, Platform, RefreshControl,
  ScrollView, StyleSheet, Text, TextInput,
  TouchableOpacity, View,
} from 'react-native';
import { T } from '../../utils/theme';
import { GradientPrimary, GradientSuccess } from '../../utils/gradients';

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

export default function DashboardLayout({
  planName, maxClients, currentClients, planStatus,
  clients, filteredClients, upcomingAppointments,
  searchQuery, onSearchChange,
  isScheduleModalVisible, onOpenScheduleModal, onCloseScheduleModal,
  scheduleSearchQuery, onScheduleSearchChange, scheduleFilteredClients,
  refreshing, onRefresh,
  getInitials, formatDateBR,
}: DashboardLayoutProps) {

  // ─── Responsividade ──────────────────────────────────────────────
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
  // ─────────────────────────────────────────────────────────────────

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

      <LinearGradient {...GradientPrimary} style={styles.planGradientCard}>
        <View style={styles.planHeader}>
          <View>
            <Text style={styles.planLabel}>Plano Atual</Text>
            <Text style={styles.planTitle}>{planName}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: planStatus === 'Ativo' ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)' }]}>
            <View style={[styles.statusDot, { backgroundColor: planStatus === 'Ativo' ? '#22C55E' : '#EF4444' }]} />
            <Text style={[styles.statusText, { color: planStatus === 'Ativo' ? '#22C55E' : '#EF4444' }]}>{planStatus}</Text>
          </View>
        </View>
        <View style={styles.metricsRow}>
          <Text style={styles.planText}>
            <Text style={styles.highlightNumber}>{currentClients}</Text>
            {' de '}
            <Text style={styles.highlightNumber}>{maxClients}</Text>
            {' alunos ativos'}
          </Text>
        </View>
        <View style={styles.progressBarBackground}>
          <LinearGradient {...GradientSuccess} style={[styles.progressBarFill, { width: `${Math.min(usagePercentage, 100)}%` as any }]} />
        </View>
        {usagePercentage >= 80 && (
          <Text style={styles.warning}>⚠️ Você está próximo do limite do plano</Text>
        )}
        <TouchableOpacity style={styles.upgradeDashboardBtn} onPress={() => router.push('/(protected)/trainer-profile' as any)}>
          <Text style={styles.upgradeDashboardBtnText}>Gerenciar Plano</Text>
        </TouchableOpacity>
      </LinearGradient>

      <View style={styles.planWidget}>
        <View style={styles.widgetHeader}>
          <Text style={styles.widgetTitle}>📅 Próximas Sessões</Text>
          <TouchableOpacity onPress={() => router.push('/(protected)/schedule/' as any)}>
            <Text style={styles.widgetLink}>Ver todas →</Text>
          </TouchableOpacity>
        </View>
        {upcomingAppointments.length === 0 ? (
          <View style={styles.widgetEmpty}>
            <Text style={{ color: T.t2, fontSize: 14 }}>Nenhuma sessão agendada</Text>
          </View>
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

      <TouchableOpacity style={styles.mainScheduleBtn} onPress={onOpenScheduleModal}>
        <Text style={styles.mainScheduleBtnIcon}>📆</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.mainScheduleBtnTitle}>Novo Agendamento</Text>
          <Text style={styles.mainScheduleBtnSub}>Agende uma sessão com seu aluno</Text>
        </View>
      </TouchableOpacity>

      <View style={{ borderRadius: 16, overflow: 'hidden', marginBottom: 24 }}>
        <LinearGradient {...GradientPrimary} style={{ padding: 18, alignItems: 'center' }}>
          <TouchableOpacity onPress={() => router.push('/(protected)/client-create' as any)}>
            <Text style={styles.buttonText}>+ Adicionar Novo Aluno</Text>
          </TouchableOpacity>
        </LinearGradient>
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
    // Wrapper externo: no desktop centraliza o conteúdo horizontalmente
    <View style={[styles.outerWrapper, isDesktop && styles.outerWrapperDesktop]}>

      {/* Container interno: no desktop tem maxWidth e é centralizado */}
      <View style={[styles.container, isDesktop && styles.containerDesktop]}>
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
                    <Text style={styles.actionEmoji}>📅</Text><Text style={styles.actionLabel}>Agendar</Text>
                  </TouchableOpacity>
                  <View style={styles.verticalDivider} />
                  <TouchableOpacity style={styles.actionButtonScroll} onPress={() => router.push(`/(protected)/client-diet?client_id=${item.id}` as any)}>
                    <Text style={styles.actionEmoji}>🥗</Text><Text style={styles.actionLabel}>Dieta</Text>
                  </TouchableOpacity>
                  <View style={styles.verticalDivider} />
                  <TouchableOpacity style={styles.actionButtonScroll} onPress={() => router.push(`/(protected)/client-assessments?id=${item.id}` as any)}>
                    <Text style={styles.actionEmoji}>📉</Text><Text style={styles.actionLabel}>Corporal</Text>
                  </TouchableOpacity>
                  <View style={styles.verticalDivider} />
                  <TouchableOpacity style={styles.actionButtonScroll} onPress={() => router.push(`/(protected)/client-assessments?id=${item.id}&openForm=true` as any)}>
                    <Text style={styles.actionEmoji}>➕</Text><Text style={styles.actionLabel}>Avaliar</Text>
                  </TouchableOpacity>
                  <View style={styles.verticalDivider} />
                  <TouchableOpacity style={styles.actionButtonScroll} onPress={() => router.push(`/(protected)/assessments/conditioning-evolution?client_id=${item.id}` as any)}>
                    <Text style={styles.actionEmoji}>📈</Text><Text style={styles.actionLabel}>Condic.</Text>
                  </TouchableOpacity>
                  <View style={styles.verticalDivider} />
                  <TouchableOpacity style={styles.actionButtonScroll} onPress={() => router.push(`/(protected)/assessments/conditioning?client_id=${item.id}` as any)}>
                    <Text style={styles.actionEmoji}>💪</Text><Text style={styles.actionLabel}>Testar</Text>
                  </TouchableOpacity>
                </ScrollView>
              </View>
            </View>
          )}
        />
      </View>

      {/* Modal de agendamento
          Mobile: tela cheia deslizando (comportamento original)
          Desktop: overlay escurecido com card centralizado              */}
      <Modal
        visible={isScheduleModalVisible}
        animationType={isDesktop ? 'fade' : 'slide'}
        transparent={isDesktop}
        onRequestClose={onCloseScheduleModal}
      >
        <View style={isDesktop ? styles.modalOverlay : { flex: 1, backgroundColor: T.bg }}>
          <View style={isDesktop ? styles.modalDesktopCard : { flex: 1, backgroundColor: T.bg }}>
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
  // ─── Wrappers responsivos ────────────────────────────────────────
  // Mobile: flex:1 simples (comportamento original)
  outerWrapper: {
    flex: 1,
    backgroundColor: T.bg,
  },
  // Desktop: centraliza o container interno
  outerWrapperDesktop: {
    alignItems: 'center',
  },
  // Mobile: ocupa 100% (comportamento original)
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    backgroundColor: T.bg,
  },
  // Desktop: largura máxima de 960px, full height
  containerDesktop: {
    width: '100%',
    maxWidth: 960,
  },

  // ─── Header ─────────────────────────────────────────────────────
  headerTopArea: { marginBottom: 24, marginTop: 10 },
  greetingText: { fontSize: 14, fontWeight: '600', color: T.t3, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  title: { fontSize: 32, fontWeight: '900', color: T.t1, letterSpacing: -0.5 },

  // ─── Plano ──────────────────────────────────────────────────────
  planGradientCard: { padding: 24, borderRadius: 20, marginBottom: 24 },
  planHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  planLabel: { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  planTitle: { fontSize: 22, fontWeight: '800', color: T.white },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 99 },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  statusText: { fontSize: 12, fontWeight: '700' },
  metricsRow: { marginBottom: 12 },
  planText: { fontSize: 15, color: 'rgba(255,255,255,0.8)', fontWeight: '500' },
  highlightNumber: { fontSize: 18, fontWeight: '800', color: T.white },
  progressBarBackground: { height: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 99, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 99 },
  warning: { marginTop: 12, color: T.orange, fontWeight: '600', fontSize: 13 },
  upgradeDashboardBtn: { backgroundColor: 'rgba(255,255,255,0.15)', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  upgradeDashboardBtnText: { color: T.white, fontWeight: '800', fontSize: 14, textTransform: 'uppercase', letterSpacing: 0.5 },

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

  // ─── Modal Desktop ──────────────────────────────────────────────
  // Fundo escurecido semi-transparente cobrindo a tela toda
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Card centralizado com altura máxima e scroll interno
  modalDesktopCard: {
    width: 520,
    maxHeight: '80%',
    backgroundColor: T.bg,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: T.border,
  },
});
