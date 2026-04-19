// ============================================================
// (protected)/_layout.tsx — Layout do treinador
// Mobile: TabBar inferior | Desktop: Sidebar lateral (240px)
// ============================================================
import { Redirect, Slot } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import TabBar from '../../components/TabBar';
import { T } from '../../utils/theme';
import { useBreakpoint } from '../../utils/useBreakpoint';

export default function ProtectedLayout() {
  const { session, loading, role } = useAuth();
  const { isDesktop } = useBreakpoint();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: T.bg }}>
        <ActivityIndicator size="large" color={T.blue} />
      </View>
    );
  }

  if (!session) return <Redirect href="/login" />;

  if (role === null) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: T.bg }}>
        <ActivityIndicator size="large" color={T.blue} />
      </View>
    );
  }

  if (role !== 'trainer') return <Redirect href="/login" />;

  // Desktop: sidebar lateral fixa + conteúdo à direita
  if (isDesktop) {
    return (
      <View style={{ flex: 1, flexDirection: 'row', backgroundColor: T.bg }}>
        <TabBar />
        <View style={{ flex: 1, overflow: 'hidden' }}>
          <Slot />
        </View>
      </View>
    );
  }

  // Mobile: TabBar inferior absoluta
  return (
    <View style={{ flex: 1, backgroundColor: T.bg }}>
      <View style={{ flex: 1, paddingBottom: 64 }}>
        <Slot />
      </View>
      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
        <TabBar />
      </View>
    </View>
  );
}