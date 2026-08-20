// ============================================================
// business-goals.tsx — Container "Negócio"
// Abas: Metas | Vendas | Relatórios (Herbalife)
// ============================================================
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { T } from '../../utils/theme';
import { FeatureGate } from '../../components/FeatureGate';
import { useLicenseStatus } from '../../hooks/useLicenseStatus';
import MetasContent from '../../components/business/MetasContent';
import VendasContent from '../../components/business/VendasContent';
import RelatoriosContent from '../../components/business/RelatoriosContent';

type Tab = 'metas' | 'vendas' | 'relatorios';

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: 'metas',      label: 'Metas',      icon: '🎯' },
  { key: 'vendas',     label: 'Vendas',     icon: '💰' },
  { key: 'relatorios', label: 'Relatórios', icon: '📊' },
];

export default function BusinessGoalsContainer() {
  const [tab, setTab] = useState<Tab>('metas');
  const { hasFeature } = useLicenseStatus();

  const hasProductivityGoals = hasFeature('productivity_goals');
  const hasSalesTracking = hasFeature('sales_tracking');
  const hasRealtimeEarnings = hasFeature('realtime_earnings');
  const hasEarningsProjection = hasFeature('earnings_projection');

  return (
    <View style={{ flex: 1, backgroundColor: T.bg }}>
      <View style={styles.header}>
        <Text style={styles.pageLabel}>NEGÓCIO</Text>
        <View style={styles.tabsRow}>
          {TABS.map((t) => (
            <TouchableOpacity
              key={t.key}
              style={[styles.tabBtn, tab === t.key && styles.tabBtnActive]}
              onPress={() => setTab(t.key)}
            >
              <Text style={[styles.tabTxt, tab === t.key && styles.tabTxtActive]}>
                {t.icon} {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {tab === 'metas' && (
        hasProductivityGoals ? (
          <MetasContent />
        ) : (
          <FeatureGate
            featureKey="productivity_goals"
            featureName="Metas de Produtividade"
            requiredPlan="Escalando"
          >
            <MetasContent />
          </FeatureGate>
        )
      )}
      {tab === 'vendas' && (
        hasSalesTracking && hasRealtimeEarnings ? (
          <VendasContent onGoToReports={() => setTab('relatorios')} />
        ) : (
          <FeatureGate
            featureKey="sales_tracking"
            featureName="Controle de Vendas"
            requiredPlan="Escalando"
          >
            <VendasContent onGoToReports={() => setTab('relatorios')} />
          </FeatureGate>
        )
      )}
      {tab === 'relatorios' && (
        hasEarningsProjection ? (
          <RelatoriosContent />
        ) : (
          <FeatureGate
            featureKey="earnings_projection"
            featureName="Projeção de Ganhos"
            requiredPlan="Escalando"
          >
            <RelatoriosContent />
          </FeatureGate>
        )
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header:        { padding: 16, paddingBottom: 8 },
  pageLabel:     { fontSize: 11, fontWeight: '700', color: T.t3, letterSpacing: 1.5, marginBottom: 8 },
  tabsRow:       { flexDirection: 'row', backgroundColor: T.card, borderRadius: 12, padding: 4, gap: 4 },
  tabBtn:        { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center' },
  tabBtnActive:  { backgroundColor: T.blue },
  tabTxt:        { fontSize: 12, fontWeight: '700', color: T.t2 },
  tabTxtActive:  { color: '#fff' },
});
