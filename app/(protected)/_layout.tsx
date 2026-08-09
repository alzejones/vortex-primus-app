// ============================================================
// (protected)/_layout.tsx — Layout do treinador (mobile-only)
// TabBar inferior absoluta + TRAVA DE TRIAL
// ============================================================
import { Redirect, Slot, useRouter } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import TabBar from '../../components/TabBar';
import { T } from '../../utils/theme';
import SupportButton from '../../components/SupportButton';
import { useLicenseStatus } from '../../hooks/useLicenseStatus';

export default function ProtectedLayout() {
  const insets = useSafeAreaInsets();
  const { session, loading, role } = useAuth();
  const router = useRouter();
  const licenseStatus = useLicenseStatus();

  if (loading || licenseStatus.loading) {
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

  // 🔒 TRAVA DE LICENÇA: redireciona para license-blocked se status bloqueante
  if (licenseStatus.status === 'expired' || licenseStatus.status === 'limit_reached' || licenseStatus.status === 'blocked_error') {
    return <Redirect href="/license-blocked" as any />;
  }

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
