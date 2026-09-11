// ============================================================
// apresentacoes-pendentes.tsx — Rota standalone
// Conteúdo real vive em components/business/ApresentacoesPendentesContent.tsx
// ============================================================
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import ApresentacoesPendentesContent from '../../components/business/ApresentacoesPendentesContent';

export default function ApresentacoesPendentesRoute() {
  const { theme } = useTheme();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top']}>
      <ApresentacoesPendentesContent />
    </SafeAreaView>
  );
}
