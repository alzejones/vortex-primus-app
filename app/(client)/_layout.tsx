import { Redirect, Slot } from "expo-router";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { T } from "../../utils/theme";
import SupportButton from "../../components/SupportButton";
import { useConsentStatus } from "../../hooks/useConsentStatus";

export default function ClientLayout() {
  const { session, loading, role } = useAuth();
  const consentStatus = useConsentStatus();
  const { theme } = useTheme();
  const styles = createStyles(theme);

  if (loading || consentStatus.loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!session) return <Redirect href="/login" />;

  if (role === null) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (role !== "client") return <Redirect href="/login" />;

  if (consentStatus.needsConsent) {
    return <Redirect href="/consent-required" />;
  }

  return (
    <View style={styles.root}>
      <Slot />
      <SupportButton bottom={24} />
    </View>
  );
}

const createStyles = (theme: import("../../contexts/ThemeContext").AppTheme) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    loadingContainer: {
      flex: 1,
      backgroundColor: theme.colors.background,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });
