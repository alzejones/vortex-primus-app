// ============================================================
// LayoutBase.web.tsx — Container de tela para desktop
// Expo usa este arquivo automaticamente na web.
// Centraliza conteúdo com maxWidth e padding generoso.
// ============================================================
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

interface Props {
  children: React.ReactNode;
}

export default function LayoutBase({ children }: Props) {
  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.container}>
        {children}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    flexGrow: 1,
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 32,
  },
  container: {
    width: '100%' as any,
    maxWidth: 1100,
  },
});