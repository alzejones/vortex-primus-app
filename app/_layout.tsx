import { Slot } from "expo-router";
import StripeWrapper from "../components/StripeWrapper"; // 🔴 Importação do nosso Wrapper inteligente
import { AuthProvider } from "../contexts/AuthContext";
import { ThemeProvider } from "../contexts/ThemeContext";

export default function RootLayout() {
  return (
    <StripeWrapper publishableKey={process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || ""}>
      <ThemeProvider>
        <AuthProvider>
          <Slot />
        </AuthProvider>
      </ThemeProvider>
    </StripeWrapper>
  );
}