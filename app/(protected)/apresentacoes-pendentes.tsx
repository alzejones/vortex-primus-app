// ============================================================
// apresentacoes-pendentes.tsx — Rota standalone
// Conteúdo real vive em components/business/ApresentacoesPendentesContent.tsx
// ============================================================
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { T } from '../../utils/theme';
import ApresentacoesPendentesContent from '../../components/business/ApresentacoesPendentesContent';

export default function ApresentacoesPendentesRoute() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: T.bg }} edges={['top']}>
      <ApresentacoesPendentesContent />
    </SafeAreaView>
  );
}
