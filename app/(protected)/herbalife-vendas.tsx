// ============================================================
// herbalife-vendas.tsx — Rota standalone (deep-link vindo de client-diet.tsx)
// Conteúdo real vive em components/business/VendasContent.tsx
// ============================================================
import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { T } from '../../utils/theme';
import VendasContent from '../../components/business/VendasContent';

export default function HerbalifeVendasRoute() {
  const { client_id } = useLocalSearchParams();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: T.bg }} edges={['top']}>
      <VendasContent prefillClientId={client_id as string} />
    </SafeAreaView>
  );
}
