import { Redirect, Slot } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "../../contexts/AuthContext";
import TabBar from "../../components/TabBar";
import { T } from "../../utils/theme";

export default function ProtectedLayout() {
  const { session, loading, role } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: T.bg }}>
        <ActivityIndicator size="large" color={T.blue} />
      </View>
    );
  }

  if (!session || role !== "trainer") {
    return <Redirect href="/login" />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: T.bg }}>
      <View style={{ flex: 1, paddingBottom: 64 }}>
        <Slot />
      </View>
      <View style={{ position: "absolute", bottom: 0, left: 0, right: 0 }}>
        <TabBar />
      </View>
    </View>
  );
}