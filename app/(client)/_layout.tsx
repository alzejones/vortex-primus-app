import { Redirect, Slot } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "../../contexts/AuthContext";
import { T } from "../../utils/theme";
import SupportButton from "../../components/SupportButton";
import { useConsentStatus } from "../../hooks/useConsentStatus";

export default function ClientLayout() {
  const { session, loading, role } = useAuth();
  const consentStatus = useConsentStatus();

  if (loading || consentStatus.loading) {
    return (
      <View style={{ flex: 1, backgroundColor: T.bg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={T.blue} />
      </View>
    );
  }

  if (!session) return <Redirect href="/login" />;

  if (role === null) {
    return (
      <View style={{ flex: 1, backgroundColor: T.bg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={T.blue} />
      </View>
    );
  }

  if (role !== "client") return <Redirect href="/login" />;

  if (consentStatus.needsConsent) {
    return <Redirect href="/consent-required" />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: T.bg }}>
      <Slot />
      <SupportButton bottom={24} />
    </View>
  );
}
