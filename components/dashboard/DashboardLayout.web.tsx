// ============================================================
// DashboardLayout.web.tsx — Layout desktop do dashboard
// Expo usa este arquivo automaticamente na web (≥768px).
// Grid de 2 colunas: conteúdo principal + sidebar direita.
// Hover actions nos cards de aluno (padrão Linear/Notion).
// ============================================================
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import {
  FlatList, Modal, ScrollView, StyleSheet,
  Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { T } from '../../utils/theme';
import { GradientPrimary, GradientSuccess } from '../../utils/gradients';
import type { DashboardLayoutProps } from './DashboardLayout';

// Card de aluno com hover actions (padrão web moderno)
function ClientCard({ item, getInitials }: { item: any; getInitials: (n: string) => string }) {
  const [hovered, setHovered] = useState(false);

  const actions = [
    { emoji: '📋', label: 'Perfil', href: `/(protected)/client-details?id=${item.id}` },
    { emoji: '📅', label: 'Agendar', href: `/schedule/new?client_id=${item.id}` },
    { emoji: '📉', label: 'Corporal', href: `/(protected)/client-assessments?id=${item.id}` },
    { emoji: '➕', label: 'Avaliar', href: `/(protected)/client-assessments?id=${item.id}&openForm=true` },
    { emoji: '📈', label: 'Condic.', href: `/(protected)/assessments/conditioning-evolution?client_id=${item.id}` },
    { emoji: '💪', label: 'Testar', href: `/(protected)/assessments/conditioning?client_id=${item.id}` },
  ];

  return (
    <View
      style={[styles.clientCard, hovered && styles.clientCardHovered]}
      // @ts-ignore — onMouseEnter/Leave são válidos na web
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Linha principal do card */}
      <TouchableOpacity
        style={styles.clientInfoArea}
        onPress={() => router.push(`/(protected)/client-details?id=${item.id}` as any)}
        activeOpacity={0.8}
      >
        <View style={styles.clientProfileGroup}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitials(item.name)}</Text>
          </View>
          <View>
            <Text style={styles.clientName}>{item.name}</Text>
            <Text style={styles.clientSubText}>{item.email || 'Sem email'}</Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={styles.viewsBadge}>
            <Text style={styles.viewsEmoji}>👁️</Text>
            <Text style={styles.viewsText}>{item.totalViews ?? 0}</Text>
          </View>
          {!hovered && <Text style={styles.arrowIcon}>›</Text>}
        </View>
      </TouchableOpacity>

      {/* Hover actions — aparecem ao passar o mouse */}
      {hovered && (
        <View style={styles.hoverActions}>
          {actions.map((action, i) => (
            <TouchableOpacity
              key={i}
              style={styles.hoverActionBtn}
              onPress={() => router.push(action.href as any)}
              activeOpacity={0.7}
            >
              <Text style={styles.hoverActionEmoji}>{action.emoji}</Text>
              <Text style={styles.hoverActionLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

export default function DashboardLayout({
  planName, maxClients, currentClients, planStatus,
  filteredClients, upcomingAppointments,
  searchQuery, onSearchChange,
  isScheduleModalVisible, onOpenScheduleModal, onCloseScheduleModal,
  scheduleSearchQuery, onScheduleSearchChange, scheduleFilteredClients,
  refreshing, onRefresh,
  getInitials, formatDateBR,
}: DashboardLayoutProps) {

  const usagePercentage = maxClients > 0 ? (currentClients / maxClients) * 100 : 0;

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Header — largura total */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greetingText}>Visão Geral</Text>
          <Text style={styles.title}>Meu Dashboard</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/(protected)/invite-client' as any)}>
            <Text style={styles.addBtnText}>+ Novo Aluno</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.scheduleBtn} onPress={onOpenScheduleModal}>
            <Text style={styles.scheduleBtnText}>📅 Agendar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.configBtn}
            onPress={() => router.push('/(protected)/trainer-profile' as any)}
          >
            <Text style={{ fontSize: 20 }}>⚙️</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Grid principal: coluna esquerda + sidebar direita */}
      <View style={styles.grid}>

        {/* Coluna esquerda — lista de alunos */}
        <View style={styles.mainCol}>
          {/* Barra de busca */}
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

          <Text style={styles.sectionTitle}>
            Meus Alunos <Text style={styles.sectionCount}>({filteredClients.length})</Text>
          </Text>

          {filteredClients.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>👥</Text>
              <Text style={styles.emptyTitle}>Nenhum aluno encontrado</Text>
              <Text style={styles.emptyText}>Adicione seu primeiro aluno para começar</Text>
            </View>
          ) : (
            filteredClients.map((item) => (
              <ClientCard key={item.id} item={item} getInitials={getInitials} />
            ))
          )}
        </View>

        {/* Sidebar direita — widgets */}
        <View style={styles.sideCol}>

          {/* Card do Plano */}
          <LinearGradient {...GradientPrimary} style={styles.planCard}>
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
            <Text style={styles.planText}>
              <Text style={styles.highlightNumber}>{currentClients}</Text>
              {' de '}
              <Text style={styles.highlightNumber}>{maxClients}</Text>
              {' alunos'}
            </Text>
            <View style={styles.progressBg}>
              <LinearGradient {...GradientSuccess} style={[styles.progressFill, { width: `${Math.min(usagePercentage, 100)}%` as any }]} />
            </View>
            {usagePercentage >= 80 && (
              <Text style={styles.warning}>⚠️ Próximo do limite</Text>
            )}
            <TouchableOpacity style={styles.manageBtn} onPress={() => router.push('/(protected)/trainer-profile' as any)}>
              <Text style={styles.manageBtnText}>Gerenciar Plano</Text>
            </TouchableOpacity>
          </LinearGradient>

          {/* Widget Próximas Sessões */}
          <View style={styles.widget}>
            <View style={styles.widgetHeader}>
              <Text style={styles.widgetTitle}>📅 Próximas Sessões</Text>
              <TouchableOpacity onPress={() => router.push('/(protected)/schedule/' as any)}>
                <Text style={styles.widgetLink}>Ver todas →</Text>
              </TouchableOpacity>
            </View>
            {upcomingAppointments.length === 0 ? (
              <Text style={styles.widgetEmpty}>Nenhuma sessão agendada</Text>
            ) : (
              upcomingAppointments.map((apt) => (
                <View key={apt.id} style={styles.agendaItem}>
                  <View style={styles.agendaDateBox}>
                    <Text style={styles.agendaDateText}>{formatDateBR(apt.appointment_date)}</Text>
                    <Text style={styles.agendaTimeText}>{apt.appointment_time?.substring(0, 5)}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.agendaClientName}>{(apt.clients as any)?.name || 'Aluno'}</Text>
                    <Text style={styles.agendaTypes}>{apt.types}</Text>
                  </View>
                </View>
              ))
            )}
          </View>

          {/* Botão Novo Agendamento */}
          <TouchableOpacity style={styles.newScheduleWidget} onPress={onOpenScheduleModal}>
            <Text style={styles.newScheduleIcon}>📆</Text>
            <View>
              <Text style={styles.newScheduleTitle}>Novo Agendamento</Text>
              <Text style={styles.newScheduleSub}>Agende uma sessão</Text>
            </View>
          </TouchableOpacity>

        </View>
      </View>

      {/* Modal de agendamento */}
      <Modal visible={isScheduleModalVisible} animationType="fade" transparent onRequestClose={onCloseScheduleModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Agendar Sessão</Text>
              <TouchableOpacity onPress={onCloseScheduleModal}>
                <Text style={styles.modalCloseBtn}>✕</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.modalInput}
              placeholder="Buscar aluno..."
              placeholderTextColor={T.t3}
              value={scheduleSearchQuery}
              onChangeText={onScheduleSearchChange}
              autoFocus
            />
            <ScrollView style={{ maxHeight: 360 }}>
              {scheduleFilteredClients.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.modalClientItem}
                  onPress={() => { onCloseScheduleModal(); router.push(`/schedule/new?client_id=${item.id}` as any); }}
                >
                  <Text style={styles.modalClientEmoji}>👤</Text>
                  <Text style={styles.modalClientName}>{item.name}</Text>
                  <Text style={styles.modalArrow}>›</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.modalFooterBtn}
              onPress={() => { onCloseScheduleModal(); router.push('/(protected)/invite-client' as any); }}
            >
              <Text style={styles.modalFooterBtnText}>+ Adicionar Novo Aluno</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: T.bg },
  scrollContent: { padding: 40, maxWidth: 1400, alignSelf: 'center', width: '100%' as any },

  // Header
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 },
  greetingText: { fontSize: 13, fontWeight: '600', color: T.t3, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  title: { fontSize: 36, fontWeight: '900', color: T.t1, letterSpacing: -1 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  addBtn: { backgroundColor: T.blue, paddingVertical: 10, paddingHorizontal: 20, borderRadius: 10 },
  addBtnText: { color: T.white, fontWeight: '700', fontSize: 14 },
  scheduleBtn: { backgroundColor: T.surface, paddingVertical: 10, paddingHorizontal: 20, borderRadius: 10, borderWidth: 1, borderColor: T.border },
  scheduleBtnText: { color: T.t1, fontWeight: '700', fontSize: 14 },
  configBtn: { width: 42, height: 42, backgroundColor: T.surface, borderRadius: 10, borderWidth: 1, borderColor: T.border, justifyContent: 'center', alignItems: 'center' },

  // Grid
  grid: { flexDirection: 'row', gap: 32, alignItems: 'flex-start' },
  mainCol: { flex: 1 },
  sideCol: { width: 320, gap: 20 },

  // Busca
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: T.surface, borderRadius: 12, paddingHorizontal: 16, height: 48, borderWidth: 1, borderColor: T.border, marginBottom: 24 },
  searchIcon: { fontSize: 15, marginRight: 10, opacity: 0.5 },
  searchInput: { flex: 1, fontSize: 15, color: T.white },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: T.t1, marginBottom: 16, letterSpacing: -0.3 },
  sectionCount: { fontWeight: '500', color: T.t3 },

  // Card de aluno
  clientCard: { backgroundColor: T.card, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: T.border, overflow: 'hidden', transition: 'all 0.15s ease' as any },
  clientCardHovered: { borderColor: T.blue + '60', shadowColor: T.blue, shadowOpacity: 0.12, shadowRadius: 16, elevation: 4 },
  clientInfoArea: { padding: 18, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  clientProfileGroup:{ flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: T.surfaceAlt, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  avatarText: { color: T.blue, fontWeight: 'bold', fontSize: 15, letterSpacing: 1 },
  clientName: { fontSize: 16, fontWeight: '700', color: T.t1, marginBottom: 2 },
  clientSubText: { fontSize: 13, color: T.t2 },
  viewsBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: T.surface, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  viewsEmoji: { fontSize: 10, marginRight: 4 },
  viewsText: { fontSize: 11, fontWeight: '700', color: T.t2 },
  arrowIcon: { fontSize: 22, color: T.t3, marginLeft: 8 },

  // Hover actions
  hoverActions: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: T.border, backgroundColor: T.bg, paddingHorizontal: 8, paddingVertical: 4 },
  hoverActionBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8, gap: 6 },
  hoverActionEmoji: { fontSize: 14 },
  hoverActionLabel: { fontSize: 12, fontWeight: '600', color: T.t2 },

  // Sidebar — Card do plano
  planCard: { padding: 24, borderRadius: 20 },
  planHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  planLabel: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.65)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  planTitle: { fontSize: 20, fontWeight: '800', color: T.white },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 99 },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 5 },
  statusText: { fontSize: 11, fontWeight: '700' },
  planText: { fontSize: 14, color: 'rgba(255,255,255,0.8)', fontWeight: '500', marginBottom: 12 },
  highlightNumber: { fontSize: 17, fontWeight: '800', color: T.white },
  progressBg: { height: 7, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 99, overflow: 'hidden', marginBottom: 8 },
  progressFill:{ height: '100%' as any, borderRadius: 99 },
  warning: { fontSize: 12, color: T.orange, fontWeight: '600', marginBottom: 8 },
  manageBtn: { backgroundColor: 'rgba(255,255,255,0.15)', paddingVertical: 12, borderRadius: 10, alignItems: 'center', marginTop: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  manageBtnText: { color: T.white, fontWeight: '700', fontSize: 13 },

  // Widget sessões
  widget: { backgroundColor: T.card, padding: 20, borderRadius: 16, borderWidth: 1, borderColor: T.border },
  widgetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  widgetTitle: { fontSize: 16, fontWeight: '800', color: T.t1 },
  widgetLink: { fontSize: 12, fontWeight: '700', color: T.blue },
  widgetEmpty: { color: T.t2, fontSize: 13, paddingVertical: 8 },
  agendaItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: T.border },
  agendaDateBox:{ backgroundColor: T.surfaceAlt, padding: 8, borderRadius: 10, alignItems: 'center', width: 58, marginRight: 12 },
  agendaDateText:{ fontSize: 12, fontWeight: '800', color: T.blue },
  agendaTimeText:{ fontSize: 10, color: T.blue, fontWeight: '600', marginTop: 2 },
  agendaClientName: { fontSize: 14, fontWeight: '700', color: T.t1 },
  agendaTypes: { fontSize: 12, color: T.t2, marginTop: 2 },

  // Widget novo agendamento
  newScheduleWidget: { backgroundColor: T.card, flexDirection: 'row', alignItems: 'center', padding: 18, borderRadius: 16, borderWidth: 1, borderColor: T.border, gap: 14 },
  newScheduleIcon: { fontSize: 28 },
  newScheduleTitle: { fontSize: 15, fontWeight: '800', color: T.t1 },
  newScheduleSub: { fontSize: 12, color: T.t2, marginTop: 2 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  modalBox: { backgroundColor: T.card, borderRadius: 20, width: 480, maxWidth: '90%' as any, overflow: 'hidden', borderWidth: 1, borderColor: T.border },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: T.border },
  modalTitle: { fontSize: 18, fontWeight: '900', color: T.t1 },
  modalCloseBtn: { fontSize: 18, color: T.t2, fontWeight: '700', padding: 4 },
  modalInput: { margin: 16, backgroundColor: T.surface, padding: 14, borderRadius: 10, fontSize: 15, color: T.white, borderWidth: 1, borderColor: T.border },
  modalClientItem: { padding: 16, borderBottomWidth: 1, borderBottomColor: T.border, flexDirection: 'row', alignItems: 'center' },
  modalClientEmoji:{ fontSize: 20, marginRight: 14 },
  modalClientName: { fontSize: 15, fontWeight: '700', color: T.t1, flex: 1 },
  modalArrow: { fontSize: 18, color: T.t3 },
  modalFooterBtn: { margin: 16, padding: 14, backgroundColor: T.surface, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: T.border },
  modalFooterBtnText: { fontSize: 14, color: T.blue, fontWeight: '700' },

  // Estado vazio
  emptyContainer: { padding: 40, alignItems: 'center', backgroundColor: T.card, borderRadius: 16, borderWidth: 1, borderColor: T.border },
  emptyEmoji: { fontSize: 40, marginBottom: 12 },
  emptyTitle: { fontSize: 17, fontWeight: 'bold', color: T.t1, marginBottom: 8 },
  emptyText: { color: T.t2, fontSize: 14, textAlign: 'center' },
});