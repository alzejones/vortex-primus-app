// ============================================================
// herbalife-relatorios.tsx — Rota standalone
// Conteúdo real vive em components/business/RelatoriosContent.tsx
// ============================================================
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import RelatoriosContent from '../../components/business/RelatoriosContent';

export default function HerbalifeRelatoriosRoute() {
  const { theme } = useTheme();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top']}>
      <RelatoriosContent />
    </SafeAreaView>
  );
}
