// ============================================================
// ResetHubContent.tsx — Hub Reset
// Tela principal da aba Reset com 2 cards de navegação
// ============================================================
import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { T } from '../../utils/theme';

export default function ResetHubContent() {
  return (
    <View style={{ flex: 1, backgroundColor: T.bg }}>
      <View style={s.header}>
        <Text style={s.title}>Reset</Text>
      </View>

      <View style={s.container}>
        <TouchableOpacity
          style={s.card}
          onPress={() => router.push('/reset-clientes' as any)}
          activeOpacity={0.7}
        >
          <View style={{ flex: 1 }}>
            <View style={s.cardHeader}>
              <Text style={s.cardIcon}>🔄</Text>
              <Text style={s.cardTitle}>Clientes com Kit Reset</Text>
            </View>
            <Text style={s.cardSubtitle}>Acompanhamento do protocolo de 5 dias</Text>
          </View>
          <Text style={s.cardArrow}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={s.card}
          onPress={() => router.push('/apresentacoes-pendentes' as any)}
          activeOpacity={0.7}
        >
          <View style={{ flex: 1 }}>
            <View style={s.cardHeader}>
              <Text style={s.cardIcon}>💬</Text>
              <Text style={s.cardTitle}>Apresentações Sem Venda</Text>
            </View>
            <Text style={s.cardSubtitle}>Leads de apresentação ainda não convertidos</Text>
          </View>
          <Text style={s.cardArrow}>→</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  header: {
    padding: 16,
    paddingTop: 20,
    backgroundColor: T.bg,
    borderBottomWidth: 1,
    borderBottomColor: '#1E1E1E',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFF',
  },
  container: {
    padding: 16,
    gap: 16,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 10,
  },
  cardIcon: {
    fontSize: 24,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFF',
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#888',
    lineHeight: 18,
  },
  cardArrow: {
    fontSize: 24,
    color: '#666',
    marginLeft: 16,
  },
});
