// ============================================================
// (protected)/_layout.tsx — Layout do treinador (mobile-only)
// TabBar inferior absoluta
// ============================================================
import { Redirect, Slot } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import TabBar from '../../components/TabBar';
import { T } from '../../utils/theme';
import SupportButton from '../../components/SupportButton';

export default function ProtectedLayout() {
  const insets = useSafeAreaInsets();
  const { session, loading, role } = useAuth();

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

  // Mobile: TabBar inferior absoluta
  return (
    <View style={{ flex: 1, backgroundColor: T.bg }}>
      <View style={{ flex: 1, paddingBottom: 64 + insets.bottom }}>
        <Slot />
      </View>
      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
        <TabBar />
      </View>
      <SupportButton bottom={72 + insets.bottom} />
    </View>
  );
}