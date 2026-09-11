// ============================================================
// reset-clientes.tsx — Rota para lista de clientes Kit Reset
// Conteúdo real vive em components/business/ResetClientesContent.tsx
// ============================================================
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { T } from '../../utils/theme';
import { useTheme } from '../../contexts/ThemeContext';
import ResetClientesContent from '../../components/business/ResetClientesContent';

export default function ResetClientesRoute() {
  const { theme } = useTheme();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top']}>
      <ResetClientesContent />
    </SafeAreaView>
  );
}
