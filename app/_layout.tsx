import { Slot } from "expo-router";
import { View } from "react-native";
import StripeWrapper from "../components/StripeWrapper";
import { AuthProvider } from "../contexts/AuthContext";
import { ThemeProvider } from "../contexts/ThemeContext";
import { TutorialProvider } from "../contexts/TutorialContext";
import { T } from "../utils/theme";

export default function RootLayout() {
  const stripeKey = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || "";
  
  return (
    <StripeWrapper publishableKey={stripeKey}>
      <ThemeProvider>
        <AuthProvider>
          <TutorialProvider>
            <View style={{ flex: 1, backgroundColor: T.bg }}>
              <Slot />
            </View>
          </TutorialProvider>
        </AuthProvider>
      </ThemeProvider>
    </StripeWrapper>
  );
}