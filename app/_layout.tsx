import { Slot } from "expo-router";
import { View } from "react-native";
import StripeWrapper from "../components/StripeWrapper";
import { AuthProvider } from "../contexts/AuthContext";
import { ThemeProvider } from "../contexts/ThemeContext";
import { TutorialProvider } from "../contexts/TutorialContext";
import { LanguageProvider } from "../contexts/LanguageContext";
import { T } from "../utils/theme";

export default function RootLayout() {
  const stripeKey = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || "";
  
  return (
    <StripeWrapper publishableKey={stripeKey}>
      <ThemeProvider>
        <AuthProvider>
          <TutorialProvider>
            <LanguageProvider>
              <View style={{ flex: 1, backgroundColor: T.bg }}>
                <Slot />
              </View>
            </LanguageProvider>
          </TutorialProvider>
        </AuthProvider>
      </ThemeProvider>
    </StripeWrapper>
  );
}