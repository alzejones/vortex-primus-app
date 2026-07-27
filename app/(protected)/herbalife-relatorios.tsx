// ============================================================
// herbalife-relatorios.tsx — Rota standalone
// Conteúdo real vive em components/business/RelatoriosContent.tsx
// ============================================================
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { T } from '../../utils/theme';
import RelatoriosContent from '../../components/business/RelatoriosContent';

export default function HerbalifeRelatoriosRoute() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: T.bg }} edges={['top']}>
      <RelatoriosContent />
    </SafeAreaView>
  );
}
