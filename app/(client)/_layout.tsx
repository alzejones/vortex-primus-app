import { Redirect, Slot } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "../../contexts/AuthContext";
import { T } from "../../utils/theme";

export default function ClientLayout() {
  const { session, loading, role } = useAuth();

  if (loading) return null;
  if (!session) return <Redirect href="/login" />;
  if (role === null) return (
    <View style={{ flex: 1, backgroundColor: '#0a0a0a', justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color="#3B82F6" />
    </View>
  );
  if (role !== "client") return <Redirect href="/login" />;

  return (
    <View style={{ flex: 1, backgroundColor: T.bg }}>
      <Slot />
    </View>
  );
}
