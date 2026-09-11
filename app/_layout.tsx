import { Slot } from "expo-router";
import { View } from "react-native";
import StripeWrapper from "../components/StripeWrapper";
import { AuthProvider } from "../contexts/AuthContext";
import { ThemeProvider, useTheme } from "../contexts/ThemeContext";
import { TutorialProvider } from "../contexts/TutorialContext";

function RootLayoutInner() {
  const { theme } = useTheme();
  
  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <Slot />
    </View>
  );
}

export default function RootLayout() {
  const stripeKey = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || "";
  
  return (
    <StripeWrapper publishableKey={stripeKey}>
      <ThemeProvider>
        <AuthProvider>
          <TutorialProvider>
            <RootLayoutInner />
          </TutorialProvider>
        </AuthProvider>
      </ThemeProvider>
    </StripeWrapper>
  );
}