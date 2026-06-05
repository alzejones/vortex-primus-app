// ============================================================
// DashboardLayout.web.tsx — Dashboard desktop profissional
// Expo carrega este arquivo automaticamente no browser (web).
// Mobile continua usando DashboardLayout.tsx sem alterações.
// Layout: Sidebar fixa esquerda + área principal scrollável.
// ============================================================
import { LinearGradient } from 'expo-linear-gradient';
import { router, usePathname } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { GradientPrimary, GradientSuccess } from '../../utils/gradients';
import { T } from '../../utils/theme';
import type { DashboardLayoutProps } from './DashboardLayout';
import MobileLayout from './DashboardLayoutMobile';

// ─── Itens de navegação da sidebar ───────────────────────────
const NAV_ITEMS = [
  { key: 'home',     label: 'Dashboard',  icon: '⊞',  href: '/(protected)'                },
  { key: 'clients',  label: 'Alunos',     icon: '👥',  href: '/(protected)/clients'        },
  { key: 'schedule', label: 'Agenda',     icon: '📅',  href: '/(protected)/schedule/'      },
  { key: 'config',   label: 'Configurações', icon: '⚙️', href: '/(protected)/trainer-profile' },
] as const;

function isNavActive(key: string, pathname: string): boolean {
  switch (key) {
    case 'home':     return pathname === '/' || pathname === '/(protected)' || pathname === '';
    case 'clients':  return pathname.includes('client');
    case 'schedule': return pathname.includes('schedule');
    case 'config':   return pathname.includes('trainer-profile') || pathname.includes('upgrade') || pathname.includes('plans');
    default:         return false;
  }
}

export default function DashboardLayout(props: DashboardLayoutProps) {
  const {
    planName, maxClients, currentClients, planStatus,
    clients, filteredClients, upcomingAppointments,
    searchQuery, onSearchChange,
    isScheduleModalVisible, onOpenScheduleModal, onCloseScheduleModal,
    scheduleSearchQuery, onScheduleSearchChange, scheduleFilteredClients,
    refreshing, onRefresh,
    getInitials, formatDateBR,
  } = props;

  const pathname = usePathname();

  // ─── Detecção de viewport: mobile browser usa layout mobile ──
  const [screenWidth, setScreenWidth] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth : 1024
  );
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onResize = () => setScreenWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  if (screenWidth < 768) return <MobileLayout {...props} />;
  // ─────────────────────────────────────────────────────────────
  const usagePercentage = maxClients > 0 ? (currentClients / maxClients) * 100 : 0;

  // ─── Sidebar ─────────────────────────────────────────────────
  const Sidebar = () => (
    <View style={styles.sidebar}>
      {/* Logo */}
      <View style={styles.sidebarLogo}>
        <LinearGradient {...GradientPrimary} style={styles.logoMark}>
          <Text style={styles.logoLetter}>V</Text>
        </LinearGradient>
        <View>
          <Text style={styles.logoName}>Vortex</Text>
          <Text style={styles.logoSub}>PRIMUS</Text>
        </View>
      </View>

      {/* Divisor */}
      <View style={styles.sidebarDivider} />

      {/* Navegação */}
      <View style={styles.navSection}>
        {NAV_ITEMS.map((item) => {
          const active = isNavActive(item.key, pathname);
          return (
            <TouchableOpacity
              key={item.key}
              style={[styles.navItem, active && styles.navItemActive]}
              onPress={() => router.push(item.href as any)}
              activeOpacity={0.7}
            >
              {active && <View style={styles.navActiveBar} />}
              <Text style={styles.navIcon}>{item.icon}</Text>
              <Text style={[styles.navLabel, active && styles.navLabelActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Spacer */}
      <View style={{ flex: 1 }} />

      {/* Plano — discreto no rodapé da sidebar */}
      <View style={styles.sidebarFooter}>
        <View style={styles.planChip}>
          <View style={[styles.planDot, { backgroundColor: planStatus === 'Ativo' ? '#22C55E' : '#EF4444' }]} />
          <Text style={styles.planChipText}>{planName}</Text>
        </View>
        <View style={styles.planUsageRow}>
          <Text style={styles.planUsageText}>{currentClients} / {maxClients} alunos</Text>
          <Text style={styles.planUsagePct}>{Math.round(usagePercentage)}%</Text>
        </View>
        <View style={styles.planBarBg}>
          <LinearGradient
            {...GradientSuccess}
            style={[styles.planBarFill, { width: `${Math.min(usagePercentage, 100)}%` as any }]}
          />
        </View>
        {usagePercentage >= 80 && (
          <TouchableOpacity onPress={() => router.push('/(protected)/upgrade' as any)}>
            <Text style={styles.planWarning}>⚠️ Próximo do limite · Upgrade</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  // ─── Card de métrica ─────────────────────────────────────────
  const MetricCard = ({ label, value, sub, accent }: { label: string; value: string | number; sub?: string; accent?: string }) => (
    <View style={[styles.metricCard, accent ? { borderTopColor: accent, borderTopWidth: 3 } : {}]}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
      {sub ? <Text style={styles.metricSub}>{sub}</Text> : null}
    </View>
  );

  // ─── Linha de aluno na tabela ─────────────────────────────────
  const ClientRow = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.clientRow}
      onPress={() => router.push(`/(protected)/client-details?id=${item.id}` as any)}
      activeOpacity={0.7}
    >
      <View style={styles.clientAvatar}>
        <Text style={styles.clientAvatarText}>{getInitials(item.name)}</Text>
      </View>
      <View style={styles.clientInfo}>
        <Text style={styles.clientName}>{item.name}</Text>
        <Text style={styles.clientEmail}>📲 {item.phone || 'Sem WhatsApp'}</Text>
      </View>
              <View style={styles.clientActions}>
                <TouchableOpacity
                  style={styles.clientActionBtn}
                  // @ts-ignore
                  title="Detalhes do Perfil do Aluno"
                  onPress={() => router.push(`/(protected)/client-details?id=${item.id}` as any)}
                >
                  <Text style={styles.clientActionIcon}>📋</Text>
                  <Text style={styles.clientActionLabel}>Perfil</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.clientActionBtn}
                  // @ts-ignore
                  title="Agendar Avaliação"
                  onPress={() => router.push(`/schedule/new?client_id=${item.id}` as any)}
                >
                  <Text style={styles.clientActionIcon}>🗓️</Text>
                  <Text style={styles.clientActionLabel}>Agendar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.clientActionBtn}
                  // @ts-ignore
                  title="Cadastrar Avaliação da Composição Corporal"
                  onPress={() => router.push(`/(protected)/client-assessments?id=${item.id}&openForm=true` as any)}
                >
                  <Text style={styles.clientActionIcon}>🩻</Text>
                  <Text style={styles.clientActionLabel}>Avaliar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.clientActionBtn}
                  // @ts-ignore
                  title="Consultar Avaliação da Composição Corporal"
                  onPress={() => router.push(`/(protected)/client-assessments?id=${item.id}` as any)}
                >
                  <Text style={styles.clientActionIcon}>📊</Text>
                  <Text style={styles.clientActionLabel}>Corporal</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.clientActionBtn}
                  // @ts-ignore
                  title="Cadastrar Teste da Avaliação Física"
                  onPress={() => router.push(`/(protected)/assessments/conditioning?client_id=${item.id}` as any)}
                >
                  <Text style={styles.clientActionIcon}>🏋️‍♀️</Text>
                  <Text style={styles.clientActionLabel}>Testar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.clientActionBtn}
                  // @ts-ignore
                  title="Consultar Avaliações de Condicionamento Físico"
                  onPress={() => router.push(`/(protected)/assessments/conditioning-evolution?client_id=${item.id}` as any)}
                >
                  <Text style={styles.clientActionIcon}>📈</Text>
                  <Text style={styles.clientActionLabel}>Condic.</Text>
                </TouchableOpacity>
              </View>
    </TouchableOpacity>
  );

  // ─── Painel direito: próximas sessões ─────────────────────────
  const SessionsPanel = () => (
    <View style={styles.rightPanel}>
      <View style={styles.panelHeader}>
        <Text style={styles.panelTitle}>Agendamentos</Text>
        <TouchableOpacity onPress={() => router.push('/(protected)/schedule/' as any)}>
          <Text style={styles.panelLink}>Ver todas →</Text>
        </TouchableOpacity>
      </View>

      {upcomingAppointments.length === 0 ? (
        <View style={styles.emptyPanel}>
          <Text style={styles.emptyPanelIcon}>📭</Text>
          <Text style={styles.emptyPanelText}>Nenhum agendamento.\nToque para agendar avaliações →</Text>
        </View>
      ) : (
        upcomingAppointments.map((apt) => (
          <View key={apt.id} style={styles.sessionItem}>
            <View style={styles.sessionDateBox}>
              <Text style={styles.sessionDate}>{formatDateBR(apt.appointment_date)}</Text>
              <Text style={styles.sessionTime}>{apt.appointment_time?.substring(0, 5)}</Text>
            </View>
            <View style={styles.sessionInfo}>
              <Text style={styles.sessionClient}>{(apt.clients as any)?.name || 'Aluno'}</Text>
              <Text style={styles.sessionType}>{apt.types}</Text>
            </View>
          </View>
        ))
      )}

      {/* Botão adicionar aluno */}
      <TouchableOpacity
        style={styles.addClientBtn}
        onPress={() => router.push('/(protected)/client-create' as any)}
      >
        <LinearGradient {...GradientPrimary} style={styles.addClientBtnGradient}>
          <Text style={styles.addClientBtnText}>+ Adicionar Novo Aluno</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  // ─── Render principal ─────────────────────────────────────────
  return (
    <View style={styles.root}>
      {/* Sidebar fixa */}
      <Sidebar />

      {/* Área principal — scrollável com scrollbar visível */}
      <ScrollView
        style={styles.main}
        contentContainerStyle={styles.mainContent}
        showsVerticalScrollIndicator={true}
        indicatorStyle="white"
      >
        {/* Cabeçalho da página */}
        <View style={styles.pageHeader}>
          <View>
            <Text style={styles.pageGreeting}>Visão Geral</Text>
            <Text style={styles.pageTitle}>Meu Dashboard</Text>
          </View>
          <TextInput
            style={styles.topSearch}
            placeholder="🔍  Buscar aluno..."
            placeholderTextColor={T.t3}
            value={searchQuery}
            onChangeText={onSearchChange}
          />
        </View>

        {/* Métricas */}
        <View style={styles.metricsRow}>
          <MetricCard
            label="Alunos Ativos"
            value={currentClients}
            sub={`de ${maxClients} no plano`}
            accent={T.blue}
          />
          <MetricCard
            label="Próximas Sessões"
            value={upcomingAppointments.length}
            sub="agendadas"
            accent="#22C55E"
          />
          <MetricCard
            label="Total de Alunos"
            value={clients.length}
            sub="cadastrados"
            accent="#F59E0B"
          />
        </View>

        {/* Conteúdo em duas colunas */}
        <View style={styles.twoColumns}>

          {/* Coluna esquerda: lista de alunos */}
          <View style={styles.leftColumn}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                Meus Alunos
                <Text style={styles.sectionCount}> ({filteredClients.length})</Text>
              </Text>
              <TextInput
                style={styles.columnSearch}
                placeholder="Buscar Aluno..."
                placeholderTextColor={T.t3}
                value={searchQuery}
                onChangeText={onSearchChange}
              />
            </View>

            {/* Cabeçalho da tabela */}
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, { flex: 2 }]}>ALUNO</Text>
              <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'right' }]}>AÇÕES RÁPIDAS</Text>
            </View>

            {filteredClients.length === 0 ? (
              <View style={styles.emptyTable}>
                <Text style={styles.emptyTableIcon}>👥</Text>
                <Text style={styles.emptyTableTitle}>Nenhum aluno encontrado</Text>
                <Text style={styles.emptyTableSub}>Adicione seu primeiro aluno para começar</Text>
              </View>
            ) : (
              filteredClients.map((item) => (
                <ClientRow key={item.id} item={item} />
              ))
            )}
          </View>

          {/* Coluna direita: sessões + ações */}
          <SessionsPanel />
        </View>
      </ScrollView>

      {/* Modal de agendamento — overlay centralizado no desktop */}
      <Modal
        visible={isScheduleModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={onCloseScheduleModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Agendar Sessão</Text>
              <TouchableOpacity onPress={onCloseScheduleModal}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.modalSearch}
              placeholder="Buscar aluno..."
              placeholderTextColor={T.t3}
              value={scheduleSearchQuery}
              onChangeText={onScheduleSearchChange}
              autoFocus
            />
            <FlatList
              data={scheduleFilteredClients}
              keyExtractor={(item) => item.id}
              style={{ maxHeight: 320 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalClientRow}
                  onPress={() => { onCloseScheduleModal(); router.push(`/schedule/new?client_id=${item.id}` as any); }}
                >
                  <View style={styles.modalClientAvatar}>
                    <Text style={styles.modalClientAvatarText}>{getInitials(item.name)}</Text>
                  </View>
                  <Text style={styles.modalClientName}>{item.name}</Text>
                  <Text style={styles.modalArrow}>→</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              style={styles.modalAddClient}
              onPress={() => { onCloseScheduleModal(); router.push('/(protected)/client-create' as any); }}
            >
              <Text style={styles.modalAddClientText}>+ Adicionar Novo Aluno</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const SIDEBAR_W = 240;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: T.bg,
  },

  // ─── Sidebar ───────────────────────────────────────────────
  sidebar: {
    width: SIDEBAR_W,
    backgroundColor: T.surface,
    borderRightWidth: 1,
    borderRightColor: T.border,
    paddingTop: 24,
    paddingBottom: 24,
  },
  sidebarLogo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 28,
    gap: 12,
  },
  logoMark: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoLetter: { fontSize: 20, fontWeight: '900', color: '#fff' },
  logoName:   { fontSize: 16, fontWeight: '900', color: T.white, letterSpacing: -0.3 },
  logoSub:    { fontSize: 9,  fontWeight: '800', color: T.blue,  letterSpacing: 2.5 },

  sidebarDivider: {
    height: 1,
    backgroundColor: T.border,
    marginHorizontal: 20,
    marginBottom: 20,
  },

  navSection: { gap: 4, paddingHorizontal: 12 },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 10,
    position: 'relative',
    gap: 12,
  },
  navItemActive: { backgroundColor: T.surfaceAlt },
  navActiveBar: {
    position: 'absolute',
    left: 0,
    top: 8,
    bottom: 8,
    width: 3,
    borderRadius: 2,
    backgroundColor: T.blue,
  },
  navIcon:        { fontSize: 18, width: 24, textAlign: 'center' },
  navLabel:       { fontSize: 14, fontWeight: '500', color: T.t2 },
  navLabelActive: { color: T.white, fontWeight: '700' },

  // ─── Sidebar footer: plano ────────────────────────────────
  sidebarFooter: {
    marginHorizontal: 16,
    padding: 14,
    backgroundColor: T.surfaceAlt,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: T.border,
    gap: 8,
  },
  planChip: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  planDot:  { width: 6, height: 6, borderRadius: 3 },
  planChipText: { fontSize: 11, fontWeight: '800', color: T.white, textTransform: 'uppercase', letterSpacing: 1 },
  planUsageRow: { flexDirection: 'row', justifyContent: 'space-between' },
  planUsageText: { fontSize: 12, color: T.t2 },
  planUsagePct:  { fontSize: 12, color: T.t2, fontWeight: '700' },
  planBarBg:  { height: 4, backgroundColor: T.border, borderRadius: 99, overflow: 'hidden' },
  planBarFill: { height: '100%', borderRadius: 99 },
  planWarning: { fontSize: 11, color: '#F59E0B', fontWeight: '600', textAlign: 'center' },

  // ─── Área principal ───────────────────────────────────────
  main: { flex: 1 },
  mainContent: { padding: 32, paddingBottom: 48, gap: 28 },

  pageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  pageGreeting: { fontSize: 12, fontWeight: '700', color: T.t3, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 4 },
  pageTitle:    { fontSize: 30, fontWeight: '900', color: T.white, letterSpacing: -0.5 },
  topSearch: {
    backgroundColor: T.surface,
    borderWidth: 1,
    borderColor: T.border,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: T.white,
    width: 260,
  },

  // ─── Métricas ─────────────────────────────────────────────
  metricsRow: { flexDirection: 'row', gap: 16 },
  metricCard: {
    flex: 1,
    backgroundColor: T.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: T.border,
    gap: 4,
  },
  metricValue: { fontSize: 32, fontWeight: '900', color: T.white, letterSpacing: -1 },
  metricLabel: { fontSize: 13, fontWeight: '600', color: T.t2 },
  metricSub:   { fontSize: 11, color: T.t3 },

  // ─── Duas colunas ─────────────────────────────────────────
  twoColumns: { flexDirection: 'row', gap: 20, alignItems: 'flex-start' },

  // ─── Coluna esquerda: alunos ──────────────────────────────
  leftColumn: {
    flex: 2,
    backgroundColor: T.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: T.border,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
  },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: T.white },
  sectionCount: { color: T.t3, fontWeight: '500' },
  columnSearch: {
    backgroundColor: T.surface,
    borderWidth: 1,
    borderColor: T.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: T.white,
    width: 200,
  },

  tableHeader: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: T.bg,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
  },
  tableHeaderText: { fontSize: 10, fontWeight: '800', color: T.t3, letterSpacing: 1, textTransform: 'uppercase' },

  clientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
    gap: 14,
  },
  clientAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: T.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clientAvatarText: { color: T.blue, fontWeight: '800', fontSize: 13, letterSpacing: 1 },
  clientInfo:  { flex: 1, gap: 2 },
  clientName:  { fontSize: 15, fontWeight: '700', color: T.white },
  clientEmail: { fontSize: 12, color: T.t3 },
  clientActions: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  clientActionBtn: {
    minWidth: 52,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: T.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: T.border,
    gap: 2,
  },
  clientActionIcon: { fontSize: 14 },
  clientActionLabel: { fontSize: 11, color: T.t2, fontWeight: '600', marginTop: 3 },
  clientDetailBtn: {
    width: 'auto' as any,
    paddingHorizontal: 12,
    backgroundColor: T.surfaceAlt,
  },
  clientDetailBtnText: { fontSize: 12, fontWeight: '600', color: T.blue },

  emptyTable: {
    padding: 48,
    alignItems: 'center',
    gap: 8,
  },
  emptyTableIcon:  { fontSize: 40 },
  emptyTableTitle: { fontSize: 16, fontWeight: '700', color: T.t1 },
  emptyTableSub:   { fontSize: 13, color: T.t2, textAlign: 'center' },

  // ─── Painel direito ───────────────────────────────────────
  rightPanel: {
    flex: 1,
    gap: 12,
  },

  panelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: T.card,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: T.border,
    paddingBottom: 16,
  },
  panelTitle: { fontSize: 16, fontWeight: '800', color: T.white },
  panelLink:  { fontSize: 12, fontWeight: '700', color: T.blue },

  sessionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: T.card,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: T.border,
    gap: 12,
  },
  sessionDateBox: {
    backgroundColor: T.surfaceAlt,
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    minWidth: 54,
  },
  sessionDate:   { fontSize: 13, fontWeight: '800', color: T.blue },
  sessionTime:   { fontSize: 11, fontWeight: '600', color: T.blue, marginTop: 2 },
  sessionInfo:   { flex: 1, gap: 2 },
  sessionClient: { fontSize: 14, fontWeight: '700', color: T.white },
  sessionType:   { fontSize: 12, color: T.t2 },

  emptyPanel: {
    backgroundColor: T.card,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: T.border,
    gap: 8,
  },
  emptyPanelIcon: { fontSize: 28 },
  emptyPanelText: { fontSize: 13, color: T.t2, textAlign: 'center' },


  addClientBtn: { borderRadius: 12, overflow: 'hidden' },
  addClientBtnGradient: { padding: 16, alignItems: 'center' },
  addClientBtnText: { fontSize: 14, fontWeight: '800', color: T.white, letterSpacing: 0.3 },

  // ─── Modal overlay ────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    width: 500,
    backgroundColor: T.card,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: T.border,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
  },
  modalTitle: { fontSize: 18, fontWeight: '900', color: T.white },
  modalClose: { fontSize: 18, color: T.t2, fontWeight: '700', padding: 4 },
  modalSearch: {
    margin: 16,
    backgroundColor: T.surface,
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    color: T.white,
    borderWidth: 1,
    borderColor: T.border,
  },
  modalClientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: T.border,
    gap: 14,
  },
  modalClientAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: T.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalClientAvatarText: { fontSize: 12, fontWeight: '800', color: T.blue },
  modalClientName: { flex: 1, fontSize: 15, fontWeight: '600', color: T.white },
  modalArrow: { fontSize: 16, color: T.t3, fontWeight: '700' },
  modalAddClient: {
    margin: 16,
    padding: 14,
    backgroundColor: T.surfaceAlt,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: T.border,
  },
  modalAddClientText: { fontSize: 14, fontWeight: '700', color: T.blue },
});
