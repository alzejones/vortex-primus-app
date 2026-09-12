// ============================================================
// herbalife-vendas.tsx — Rota standalone (deep-link vindo de client-diet.tsx)
// Conteúdo real vive em components/business/VendasContent.tsx
// ============================================================
import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import VendasContent from '../../components/business/VendasContent';

export default function HerbalifeVendasRoute() {
  const { client_id } = useLocalSearchParams();
  const { theme } = useTheme();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top']}>
      <VendasContent prefillClientId={client_id as string} />
    </SafeAreaView>
  );
}
